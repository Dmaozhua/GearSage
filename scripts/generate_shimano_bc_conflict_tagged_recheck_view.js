const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IDENTITY_PATCH = gearDataPaths.resolveDataRaw('identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json');
const RECHECK_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_field_recheck_view.xlsx');
const CONFLICT_STRATEGY_MD = path.resolve(
  REPO_ROOT,
  'GearSage-client/docs/Shimano_baitcasting_reel_字段数据冲突解决策略_v1.md'
);
const OUTPUT_MD = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_conflict_tagged_recheck_view.md');
const OUTPUT_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_conflict_tagged_recheck_view.xlsx');

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJsonRows(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return payload.patch_rows || payload.rows || [];
}

function loadSheetRows(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
}

function getIdentityEvidence(identityRow, fieldKey) {
  const evidenceRow = (identityRow.evidence || []).find((item) => item.field_key === fieldKey);
  return normalizeText(evidenceRow ? evidenceRow.evidence_text : '');
}

function baseRow(detailRow, fieldKey, currentValue, sourceType, decisionBucket) {
  return {
    detail_id: normalizeText(detailRow.detail_id),
    reel_id: normalizeText(detailRow.reel_id),
    model_year: normalizeText(detailRow.model_year),
    SKU: normalizeText(detailRow.SKU),
    field_key: fieldKey,
    current_value: normalizeText(currentValue),
    source_type: normalizeText(sourceType),
    decision_bucket: normalizeText(decisionBucket),
    conflict_status: '',
    conflict_tag: '',
    conflict_resolution_state: '',
    ready_for_next_dry_run: '',
    hold_reason: '',
  };
}

function finalizeResolved(row, tag, resolutionState) {
  row.conflict_status = 'resolved';
  row.conflict_tag = tag;
  row.conflict_resolution_state = resolutionState;
  row.ready_for_next_dry_run = 'yes';
  row.hold_reason = '';
  return row;
}

function finalizeHold(row, tag, reason) {
  row.conflict_status = 'hold';
  row.conflict_tag = tag;
  row.conflict_resolution_state = 'wait_for_manual_confirmation';
  row.ready_for_next_dry_run = 'no';
  row.hold_reason = reason;
  return row;
}

function buildRows() {
  const identityRows = loadJsonRows(IDENTITY_PATCH);
  const recheckRows = loadSheetRows(RECHECK_XLSX, 'recheck_view');
  const identityByReel = new Map(identityRows.map((row) => [normalizeText(row.reel_id), row]));

  const result = [];

  for (const detailRow of recheckRows) {
    const identityRow = identityByReel.get(normalizeText(detailRow.reel_id)) || {};

    const modelYearRow = baseRow(
      detailRow,
      'model_year',
      detailRow.model_year,
      `identity:${normalizeText(identityRow.source_site) || 'unknown'}`,
      'identity_resolved'
    );
    if (normalizeText(detailRow.model_year)) {
      finalizeResolved(modelYearRow, 'no_conflict_resolved', 'use_identity_resolved_model_year');
    } else {
      finalizeHold(modelYearRow, 'hold_missing_evidence', 'model_year is missing in identity layer');
    }
    result.push(modelYearRow);

    const versionSignatureRow = baseRow(
      detailRow,
      'version_signature',
      normalizeText(identityRow.version_signature),
      `identity:${normalizeText(identityRow.source_site) || 'unknown'}`,
      'identity_resolved'
    );
    if (normalizeText(identityRow.version_signature)) {
      finalizeResolved(versionSignatureRow, 'no_conflict_resolved', 'use_identity_resolved_version_signature');
    } else {
      finalizeHold(versionSignatureRow, 'hold_missing_evidence', 'version_signature is missing in identity layer');
    }
    result.push(versionSignatureRow);

    const aliasValue = `${normalizeText(identityRow.canonical_alias || detailRow.canonical_alias)} => ${normalizeText(identityRow.normalized_alias || detailRow.normalized_alias)}`;
    const aliasRow = baseRow(
      detailRow,
      'alias',
      aliasValue,
      `identity:${normalizeText(identityRow.source_site) || 'unknown'}`,
      'dual_identity_alias'
    );
    if (normalizeText(identityRow.canonical_alias || detailRow.canonical_alias) && normalizeText(identityRow.normalized_alias || detailRow.normalized_alias)) {
      finalizeResolved(aliasRow, 'dual_source_kept', 'keep_canonical_and_normalized_alias');
    } else {
      finalizeHold(aliasRow, 'hold_manual_review', 'alias layers are incomplete or ambiguous');
    }
    result.push(aliasRow);

    const bodyMaterialSourceType = /body_material:manual/i.test(detailRow.source_type)
      ? 'review_confirmed_manual'
      : 'direct_write';
    const bodyMaterialRow = baseRow(
      detailRow,
      'body_material',
      detailRow.body_material,
      bodyMaterialSourceType,
      bodyMaterialSourceType
    );
    if (normalizeText(detailRow.body_material)) {
      finalizeResolved(bodyMaterialRow, 'no_conflict_resolved', 'use_current_body_material');
    } else {
      finalizeHold(bodyMaterialRow, 'hold_missing_evidence', 'body_material is still blank');
    }
    result.push(bodyMaterialRow);

    let bodyMaterialTechSourceType = 'direct_write';
    if (/body_material_tech:review_support_confirmed/i.test(detailRow.source_type) || normalizeText(detailRow.reel_id) === 'SRE5004') {
      bodyMaterialTechSourceType = 'review_confirmed_manual';
    } else if (/body_material:manual/i.test(detailRow.source_type)) {
      bodyMaterialTechSourceType = 'review_confirmed_manual';
    }
    const bodyMaterialTechRow = baseRow(
      detailRow,
      'body_material_tech',
      detailRow.body_material_tech,
      bodyMaterialTechSourceType,
      bodyMaterialTechSourceType
    );
    if (normalizeText(detailRow.body_material_tech)) {
      finalizeResolved(bodyMaterialTechRow, 'no_conflict_resolved', 'use_current_body_material_tech');
    } else {
      finalizeHold(bodyMaterialTechRow, 'hold_missing_evidence', 'body_material_tech is blank');
    }
    result.push(bodyMaterialTechRow);

    const gearMaterialRow = baseRow(
      detailRow,
      'gear_material',
      detailRow.gear_material,
      detailRow.gear_material_review_status,
      detailRow.gear_material_decision_bucket
    );
    if (normalizeText(detailRow.gear_material_decision_bucket) === 'cross_source_inferred') {
      finalizeResolved(gearMaterialRow, 'accepted_inferred', 'keep_inferred_non_official');
    } else if (normalizeText(detailRow.gear_material_decision_bucket) === 'manual_required') {
      finalizeResolved(gearMaterialRow, 'accepted_manual_blank', 'keep_blank_manual_required');
      gearMaterialRow.hold_reason = 'No exact material phrase; blank is intentionally retained.';
    } else if (normalizeText(detailRow.gear_material_decision_bucket) === 'direct_write') {
      finalizeResolved(gearMaterialRow, 'no_conflict_resolved', 'use_player_direct_write');
    } else if (!normalizeText(detailRow.gear_material)) {
      finalizeHold(gearMaterialRow, 'hold_missing_evidence', 'gear_material has no accepted decision');
    } else {
      finalizeHold(gearMaterialRow, 'hold_manual_review', 'gear_material decision bucket is unclear');
    }
    result.push(gearMaterialRow);
  }

  return result.sort((a, b) => {
    const reelDiff = a.reel_id.localeCompare(b.reel_id);
    if (reelDiff !== 0) return reelDiff;
    const detailDiff = a.detail_id.localeCompare(b.detail_id);
    if (detailDiff !== 0) return detailDiff;
    return a.field_key.localeCompare(b.field_key);
  });
}

function buildSummary(rows) {
  const byTag = new Map();
  const readyRows = rows.filter((row) => row.ready_for_next_dry_run === 'yes');
  const holdRows = rows.filter((row) => row.ready_for_next_dry_run !== 'yes');

  for (const row of rows) {
    byTag.set(row.conflict_tag, (byTag.get(row.conflict_tag) || 0) + 1);
  }

  return {
    metrics: [
      { metric: 'total_rows', value: rows.length },
      { metric: 'ready_rows', value: readyRows.length },
      { metric: 'hold_rows', value: holdRows.length },
      ...Array.from(byTag.entries()).map(([metric, value]) => ({ metric, value })),
    ],
    readyFields: Array.from(new Set(readyRows.map((row) => `${row.reel_id}:${row.field_key}`))).sort(),
    holdFields: Array.from(new Set(holdRows.map((row) => `${row.reel_id}:${row.field_key}`))).sort(),
    holdReasons: Array.from(new Set(holdRows.map((row) => row.hold_reason).filter(Boolean))).sort(),
  };
}

function renderMarkdown(rows, summary) {
  const escapeCell = (value) => String(value || '-').replace(/\|/g, '\\|');
  const lines = [
    '# Shimano baitcasting reel conflict-tagged recheck view',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_recheck_view: \`${path.relative(REPO_ROOT, RECHECK_XLSX)}\``,
    `- input_identity_patch: \`${path.relative(REPO_ROOT, IDENTITY_PATCH)}\``,
    `- input_conflict_strategy: \`${path.relative(REPO_ROOT, CONFLICT_STRATEGY_MD)}\``,
    '',
    '当前只覆盖已稳定的 5 个 Shimano baitcasting reel 样本，不扩样本，不推进 apply。',
    '',
    '## 汇总',
    '',
    ...summary.metrics.map((row) => `- ${row.metric}: ${row.value}`),
    '',
    '## 当前可进入下一轮 dry-run 的字段',
    '',
    ...(summary.readyFields.length ? summary.readyFields.map((value) => `- ${value}`) : ['- 无']),
    '',
    '## 当前仍需人工挂起的字段',
    '',
    ...(summary.holdFields.length ? summary.holdFields.map((value) => `- ${value}`) : ['- 无']),
    '',
    '## 挂起原因',
    '',
    ...(summary.holdReasons.length ? summary.holdReasons.map((value) => `- ${value}`) : ['- 当前范围内无挂起原因']),
    '',
    '## 明细',
    '',
    '| detail_id | reel_id | model_year | SKU | field_key | current_value | source_type | decision_bucket | conflict_status | conflict_tag | conflict_resolution_state | ready_for_next_dry_run | hold_reason |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${[
      row.detail_id,
      row.reel_id,
      row.model_year,
      row.SKU,
      row.field_key,
      row.current_value,
      row.source_type,
      row.decision_bucket,
      row.conflict_status,
      row.conflict_tag,
      row.conflict_resolution_state,
      row.ready_for_next_dry_run,
      row.hold_reason,
    ].map(escapeCell).join(' | ')} |`),
    '',
  ];

  return lines.join('\n');
}

function writeWorkbook(rows, summary) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary.metrics), 'summary');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'conflict_tagged_view');
  XLSX.writeFile(workbook, OUTPUT_XLSX);
}

function main() {
  const rows = buildRows();
  const summary = buildSummary(rows);
  ensureDir(OUTPUT_MD);
  ensureDir(OUTPUT_XLSX);
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(rows, summary), 'utf8');
  writeWorkbook(rows, summary);
  console.log(`conflict-tagged markdown -> ${OUTPUT_MD}`);
  console.log(`conflict-tagged workbook -> ${OUTPUT_XLSX}`);
}

main();
