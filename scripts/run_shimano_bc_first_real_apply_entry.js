const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const APPLY_INPUT_JSON = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.json'
);
const BASELINE_XLSX = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx'
);
const PLAN_JSON = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_执行计划.json'
);
const PREVIEW_XLSX = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_预览.xlsx'
);
const PREVIEW_MD = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_预览.md'
);
const AUDIT_JSON = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_审计.json'
);
const RESULT_XLSX = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_结果候选.xlsx'
);
const CHECKLIST_MD = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_执行前检查清单.md'
);
const SAMPLE_REELS = new Set(['SRE5003', 'SRE5004', 'SRE5015', 'SRE5019', 'SRE5025']);

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadBaselineWorkbook() {
  const workbook = XLSX.readFile(BASELINE_XLSX);
  const masterRows = XLSX.utils.sheet_to_json(workbook.Sheets.reel, { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(workbook.Sheets.baitcasting_reel_detail, { defval: '' });
  const masterHeaders = XLSX.utils.sheet_to_json(workbook.Sheets.reel, { header: 1, defval: '' })[0] || [];
  const detailHeaders = XLSX.utils.sheet_to_json(workbook.Sheets.baitcasting_reel_detail, { header: 1, defval: '' })[0] || [];
  return {
    workbook,
    masterRows,
    detailRows,
    masterHeaders,
    detailHeaders,
    mastersById: new Map(masterRows.map((row) => [normalizeText(row.id), row])),
    detailsById: new Map(detailRows.map((row) => [normalizeText(row.id), row])),
  };
}

function hasColumn(headers, columnName) {
  return headers.some((header) => normalizeText(header) === normalizeText(columnName));
}

function buildMasterKey(row) {
  return `${normalizeText(row.reel_id)}:${normalizeText(row.field_key)}`;
}

function cloneRows(rows) {
  return rows.map((row) => ({ ...row }));
}

function collectActions(builderRows, baseline) {
  const filteredRows = builderRows.filter((row) => SAMPLE_REELS.has(normalizeText(row.reel_id)));
  const masterCandidates = new Map();
  const detailActions = [];
  const sidecarEntries = [];

  for (const row of filteredRows) {
    const fieldKey = normalizeText(row.field_key);
    const targetScope = normalizeText(row.target_scope);
    const layer = normalizeText(row.apply_input_layer);
    const targetColumn = normalizeText(row.target_baseline_column);
    const applyValue = normalizeText(row.apply_input_value);

    if (fieldKey === 'version_signature') {
      sidecarEntries.push({
        reel_id: normalizeText(row.reel_id),
        detail_id: normalizeText(row.detail_id),
        field_key: fieldKey,
        sidecar_type: 'version_signature',
        value: applyValue,
        source_type: normalizeText(row.source_type),
        evidence_type: normalizeText(row.evidence_type),
        note: 'sidecar-only in first real apply; baseline write skipped by decision',
      });
      continue;
    }

    if (fieldKey === 'alias') {
      sidecarEntries.push({
        reel_id: normalizeText(row.reel_id),
        detail_id: normalizeText(row.detail_id),
        field_key: 'canonical_alias',
        sidecar_type: 'alias_audit',
        value: normalizeText(row.canonical_alias),
        source_type: normalizeText(row.source_type),
        evidence_type: normalizeText(row.evidence_type),
        note: 'canonical alias preserved for audit while normalized_alias writes to baseline alias column',
      });
    }

    if (fieldKey === 'gear_material' && layer === 'detail_inferred_value') {
      sidecarEntries.push({
        reel_id: normalizeText(row.reel_id),
        detail_id: normalizeText(row.detail_id),
        field_key: fieldKey,
        sidecar_type: 'inferred_semantics',
        value: applyValue,
        source_type: normalizeText(row.source_type),
        evidence_type: normalizeText(row.evidence_type),
        note: 'keep inferred / non-official semantics',
      });
    }

    if (fieldKey === 'gear_material' && layer === 'detail_confirmed_blank') {
      sidecarEntries.push({
        reel_id: normalizeText(row.reel_id),
        detail_id: normalizeText(row.detail_id),
        field_key: fieldKey,
        sidecar_type: 'confirmed_blank_semantics',
        value: '',
        source_type: normalizeText(row.source_type),
        evidence_type: normalizeText(row.evidence_type),
        note: 'confirmed blank; do not backfill and do not classify as scrape miss',
      });
    }

    if (targetScope === 'master') {
      const masterRow = baseline.mastersById.get(normalizeText(row.reel_id)) || {};
      const key = buildMasterKey(row);
      if (!masterCandidates.has(key)) {
        masterCandidates.set(key, {
          reel_id: normalizeText(row.reel_id),
          field_key: fieldKey,
          apply_input_layer: layer,
          target_baseline_column: targetColumn,
          overwrite_policy: normalizeText(row.overwrite_policy),
          apply_input_value: fieldKey === 'alias' ? normalizeText(row.normalized_alias || row.apply_input_value) : applyValue,
          canonical_alias: normalizeText(row.canonical_alias),
          normalized_alias: normalizeText(row.normalized_alias),
          source_type: normalizeText(row.source_type),
          evidence_type: normalizeText(row.evidence_type),
          baseline_current_value: normalizeText(masterRow[targetColumn]),
          target_scope: 'master',
          detail_id_anchor: normalizeText(row.detail_id),
          SKU_anchor: normalizeText(row.SKU),
          notes: normalizeText(row.notes),
        });
      }
      continue;
    }

    const detailRow = baseline.detailsById.get(normalizeText(row.detail_id)) || {};
    detailActions.push({
      detail_id: normalizeText(row.detail_id),
      reel_id: normalizeText(row.reel_id),
      field_key: fieldKey,
      apply_input_layer: layer,
      target_baseline_column: targetColumn,
      overwrite_policy: normalizeText(row.overwrite_policy),
      apply_input_value: applyValue,
      source_type: normalizeText(row.source_type),
      evidence_type: normalizeText(row.evidence_type),
      baseline_current_value: normalizeText(detailRow[targetColumn]),
      target_scope: 'detail',
      notes: normalizeText(row.notes),
      SKU: normalizeText(row.SKU),
    });
  }

  return {
    masterActions: Array.from(masterCandidates.values()).sort((a, b) => {
      const reelDiff = a.reel_id.localeCompare(b.reel_id);
      if (reelDiff !== 0) return reelDiff;
      return a.field_key.localeCompare(b.field_key);
    }),
    detailActions,
    sidecarEntries,
  };
}

function classifyPreviewAction(action) {
  if (action.field_key === 'gear_material' && action.apply_input_layer === 'detail_confirmed_blank') {
    return 'sidecar_and_preserve_blank';
  }
  if (normalizeText(action.overwrite_policy).includes('controlled_replace')) {
    return 'controlled_replace';
  }
  if (normalizeText(action.overwrite_policy).includes('fill_blank_only')) {
    return 'fill_blank_only';
  }
  return 'write_candidate';
}

function buildPlan(actions) {
  const baselineWriteFields = new Set();
  const sidecarOnlyFields = new Set(['version_signature']);
  const previewRows = [];

  for (const action of [...actions.masterActions, ...actions.detailActions]) {
    const previewAction = classifyPreviewAction(action);
    const writesBaseline = !(action.field_key === 'gear_material' && action.apply_input_layer === 'detail_confirmed_blank');
    if (writesBaseline) baselineWriteFields.add(action.field_key);

    previewRows.push({
      target_scope: action.target_scope,
      reel_id: action.reel_id,
      detail_id: action.detail_id || action.detail_id_anchor || '',
      field_key: action.field_key,
      apply_input_layer: action.apply_input_layer,
      target_baseline_column: action.target_baseline_column,
      preview_action: previewAction,
      apply_input_value: action.apply_input_value,
      baseline_current_value: action.baseline_current_value,
      overwrite_policy: action.overwrite_policy,
      source_type: action.source_type,
      evidence_type: action.evidence_type,
      notes: action.notes,
    });
  }

  return {
    baseline_write_fields: Array.from(baselineWriteFields).sort(),
    sidecar_only_fields: Array.from(sidecarOnlyFields).sort(),
    previewRows,
  };
}

function applyActionsToWorkbook(actions, baseline) {
  const nextMasters = cloneRows(baseline.masterRows);
  const nextDetails = cloneRows(baseline.detailRows);
  const nextMastersById = new Map(nextMasters.map((row) => [normalizeText(row.id), row]));
  const nextDetailsById = new Map(nextDetails.map((row) => [normalizeText(row.id), row]));

  for (const action of actions.masterActions) {
    if (!hasColumn(baseline.masterHeaders, action.target_baseline_column)) continue;
    const target = nextMastersById.get(normalizeText(action.reel_id));
    if (!target) continue;

    if (action.field_key === 'model_year') {
      if (!normalizeText(target[action.target_baseline_column])) {
        target[action.target_baseline_column] = action.apply_input_value;
      }
      continue;
    }

    if (action.field_key === 'alias') {
      const currentValue = normalizeText(target[action.target_baseline_column]);
      if (!currentValue || currentValue !== action.apply_input_value) {
        target[action.target_baseline_column] = action.apply_input_value;
      }
    }
  }

  for (const action of actions.detailActions) {
    if (!hasColumn(baseline.detailHeaders, action.target_baseline_column)) continue;
    if (action.field_key === 'gear_material' && action.apply_input_layer === 'detail_confirmed_blank') {
      continue;
    }
    const target = nextDetailsById.get(normalizeText(action.detail_id));
    if (!target) continue;
    const currentValue = normalizeText(target[action.target_baseline_column]);
    if (!currentValue || normalizeText(action.overwrite_policy).includes('controlled_replace')) {
      target[action.target_baseline_column] = action.apply_input_value;
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(nextMasters, { header: baseline.masterHeaders }),
    'reel'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(nextDetails, { header: baseline.detailHeaders }),
    'baitcasting_reel_detail'
  );
  return workbook;
}

function renderPreviewMarkdown(plan, actions, mode) {
  const baselineWriteFields = plan.baseline_write_fields.map((item) => `\`${item}\``).join('、') || '无';
  const sidecarOnlyFields = plan.sidecar_only_fields.map((item) => `\`${item}\``).join('、') || '无';
  const rollbackStrategy = 'Keep the original baseline import workbook untouched and treat any apply result workbook as disposable candidate output.';

  return [
    '# Shimano baitcasting reel first real apply preview v1',
    '',
    `- mode: ${mode}`,
    `- generated_at: ${new Date().toISOString()}`,
    `- baseline_source: \`${path.relative(REPO_ROOT, BASELINE_XLSX)}\``,
    '',
    '## Scope',
    '',
    '- samples: `SRE5003`、`SRE5004`、`SRE5015`、`SRE5019`、`SRE5025`',
    '- fields in baseline write this round: ' + baselineWriteFields,
    '- fields in sidecar only this round: ' + sidecarOnlyFields,
    '',
    '## Rollback',
    '',
    `- strategy: ${rollbackStrategy}`,
    '',
    '## Preview rows',
    '',
    '| target_scope | reel_id | detail_id | field_key | apply_input_layer | preview_action | target_baseline_column | apply_input_value | baseline_current_value |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...plan.previewRows.slice(0, 40).map((row) => `| ${row.target_scope} | ${row.reel_id} | ${row.detail_id || ''} | ${row.field_key} | ${row.apply_input_layer} | ${row.preview_action} | ${row.target_baseline_column} | ${String(row.apply_input_value || '').replace(/\|/g, '\\|')} | ${String(row.baseline_current_value || '').replace(/\|/g, '\\|')} |`),
    '',
    `- master_actions: ${actions.masterActions.length}`,
    `- detail_actions: ${actions.detailActions.length}`,
    `- sidecar_entries: ${actions.sidecarEntries.length}`,
    '',
  ].join('\n') + '\n';
}

function renderChecklistMarkdown(plan) {
  return [
    '# Shimano baitcasting reel final pre-apply checklist v1',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    '',
    '## Current sample scope',
    '',
    '- `SRE5003`',
    '- `SRE5004`',
    '- `SRE5015`',
    '- `SRE5019`',
    '- `SRE5025`',
    '',
    '## Current field scope',
    '',
    '- `model_year`',
    '- `alias`',
    '- `version_signature`',
    '- `body_material`',
    '- `body_material_tech`',
    '- `gear_material`',
    '',
    '## Fields writing baseline this round',
    '',
    ...plan.baseline_write_fields.map((field) => `- \`${field}\``),
    '',
    '## Fields sidecar-only this round',
    '',
    ...plan.sidecar_only_fields.map((field) => `- \`${field}\``),
    '',
    '## Overwrite policy',
    '',
    '- `model_year`: fill blank only',
    '- `alias`: controlled replace for blank/noise, write `normalized_alias`, keep `canonical_alias` in sidecar',
    '- `body_material`: controlled replace legacy values',
    '- `body_material_tech`: fill blank or controlled replace when review-confirmed',
    '- `gear_material` direct/inferred: follow builder overwrite policy and preserve source semantics',
    '- `gear_material` confirmed_blank: preserve blank, no backfill',
    '',
    '## Rollback strategy',
    '',
    '- Keep source baseline workbook unchanged',
    '- Treat apply result workbook as candidate output only',
    '- If apply is canceled, discard candidate workbook and audit artifacts from that run',
    '',
    '## Audit file locations',
    '',
    `- plan: \`${path.relative(REPO_ROOT, PLAN_JSON)}\``,
    `- preview: \`${path.relative(REPO_ROOT, PREVIEW_XLSX)}\``,
    `- preview markdown: \`${path.relative(REPO_ROOT, PREVIEW_MD)}\``,
    `- audit: \`${path.relative(REPO_ROOT, AUDIT_JSON)}\``,
    '',
    '## Sidecar-specific note',
    '',
    '- `version_signature` stays sidecar-only in first real apply',
    '- No temporary mapping and no baseline column borrowing',
    '',
  ].join('\n') + '\n';
}

function main() {
  const doApply = process.argv.includes('--apply');
  const payload = loadJson(APPLY_INPUT_JSON);
  const builderRows = payload.rows || [];
  const baseline = loadBaselineWorkbook();
  const actions = collectActions(builderRows, baseline);
  const plan = buildPlan(actions);

  const planPayload = {
    generated_at: new Date().toISOString(),
    mode: doApply ? 'apply' : 'preview',
    scope: 'current 5 Shimano baitcasting reel samples / current 6 fields only',
    baseline_source: path.relative(REPO_ROOT, BASELINE_XLSX),
    baseline_write_fields: plan.baseline_write_fields,
    sidecar_only_fields: plan.sidecar_only_fields,
    master_actions: actions.masterActions,
    detail_actions: actions.detailActions,
    sidecar_entries: actions.sidecarEntries,
    rollback_strategy: 'Keep source baseline workbook unchanged; if apply is executed, write candidate result workbook only.',
  };

  ensureDir(PLAN_JSON);
  fs.writeFileSync(PLAN_JSON, JSON.stringify(planPayload, null, 2), 'utf8');

  const previewWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(previewWb, XLSX.utils.json_to_sheet([
    { metric: 'mode', value: doApply ? 'apply' : 'preview' },
    { metric: 'master_actions', value: actions.masterActions.length },
    { metric: 'detail_actions', value: actions.detailActions.length },
    { metric: 'sidecar_entries', value: actions.sidecarEntries.length },
    { metric: 'baseline_write_fields', value: plan.baseline_write_fields.join(', ') },
    { metric: 'sidecar_only_fields', value: plan.sidecar_only_fields.join(', ') },
  ]), 'summary');
  XLSX.utils.book_append_sheet(previewWb, XLSX.utils.json_to_sheet(plan.previewRows), 'apply_preview');
  XLSX.utils.book_append_sheet(previewWb, XLSX.utils.json_to_sheet(actions.sidecarEntries), 'sidecar_audit');
  XLSX.writeFile(previewWb, PREVIEW_XLSX);

  fs.writeFileSync(PREVIEW_MD, renderPreviewMarkdown(plan, actions, doApply ? 'apply' : 'preview'), 'utf8');
  fs.writeFileSync(AUDIT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    mode: doApply ? 'apply' : 'preview',
    sidecar_entries: actions.sidecarEntries,
    note: 'version_signature is sidecar-only in first real apply; canonical_alias / inferred / confirmed_blank semantics are also preserved here.',
  }, null, 2), 'utf8');
  fs.writeFileSync(CHECKLIST_MD, renderChecklistMarkdown(plan), 'utf8');

  if (doApply) {
    const resultWorkbook = applyActionsToWorkbook(actions, baseline);
    XLSX.writeFile(resultWorkbook, RESULT_XLSX);
    console.log(`Saved apply result workbook to ${RESULT_XLSX}`);
  }

  console.log(`Saved apply plan to ${PLAN_JSON}`);
  console.log(`Saved apply preview workbook to ${PREVIEW_XLSX}`);
  console.log(`Saved apply preview markdown to ${PREVIEW_MD}`);
  console.log(`Saved apply audit to ${AUDIT_JSON}`);
  console.log(`Saved final pre-apply checklist to ${CHECKLIST_MD}`);
}

main();
