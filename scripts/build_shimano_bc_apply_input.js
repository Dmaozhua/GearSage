const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONFLICT_TAGGED_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_conflict_tagged_recheck_view.xlsx');
const ADAPTER_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_adapter_v1.xlsx');
const APPROVED_PATCH_JSON = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_patch.json');
const BASELINE_XLSX = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_副本.xlsx');
const OUTPUT_JSON = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.json');
const OUTPUT_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.xlsx');
const OUTPUT_MD = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_summary_v1.md');
const PRECHECK_MD = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_builder_driven_third_dry_run_precheck.md');
const PRECHECK_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_builder_driven_third_dry_run_precheck.xlsx');

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSheetRows(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
}

function loadJsonRows(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return payload.patch_rows || payload.rows || [];
}

function parseAlias(currentValue) {
  const [canonical, normalized] = String(currentValue || '')
    .split('=>')
    .map((part) => normalizeText(part));
  return { canonical_alias: canonical, normalized_alias: normalized };
}

function buildEvidenceType(conflictRow, patchRow) {
  const fieldKey = normalizeText(conflictRow.field_key);
  const sourceType = normalizeText(conflictRow.source_type);
  const conflictTag = normalizeText(conflictRow.conflict_tag);

  if (fieldKey === 'model_year' || fieldKey === 'alias' || fieldKey === 'version_signature') {
    return 'identity_resolved';
  }
  if (conflictTag === 'accepted_inferred') {
    return 'cross_source_inferred';
  }
  if (conflictTag === 'accepted_manual_blank') {
    return 'confirmed_blank';
  }
  if (patchRow && /manual/i.test(normalizeText(patchRow.source_type))) {
    return 'review_confirmed_manual';
  }
  if (/review_confirmed_manual|confirmed_direct_write|direct_write/i.test(sourceType)) {
    return 'exact_text_reviewed';
  }
  return 'resolved_current_state';
}

function buildBuilderRows() {
  const conflictRows = loadSheetRows(CONFLICT_TAGGED_XLSX, 'conflict_tagged_view');
  const adapterRows = loadSheetRows(ADAPTER_XLSX, 'apply_input_mapping');
  const simulationRows = loadSheetRows(ADAPTER_XLSX, 'apply_input_simulation');
  const patchRows = loadJsonRows(APPROVED_PATCH_JSON);
  const baselineWb = XLSX.readFile(BASELINE_XLSX);
  const masterHeaders = XLSX.utils.sheet_to_json(baselineWb.Sheets['reel'], { header: 1, defval: '' })[0] || [];
  const detailHeaders = XLSX.utils.sheet_to_json(baselineWb.Sheets['baitcasting_reel_detail'], { header: 1, defval: '' })[0] || [];

  const conflictByKey = new Map(conflictRows.map((row) => [`${normalizeText(row.detail_id)}:${normalizeText(row.field_key)}`, row]));
  const patchByKey = new Map(patchRows.map((row) => [`${normalizeText(row.detail_id)}:${normalizeText(row.field_key)}`, row]));

  const builderRows = adapterRows.map((adapterRow) => {
    const key = `${normalizeText(adapterRow.detail_id)}:${normalizeText(adapterRow.field_key)}`;
    const conflictRow = conflictByKey.get(key) || {};
    const patchRow = patchByKey.get(key) || {};
    const aliasInfo = normalizeText(adapterRow.field_key) === 'alias'
      ? parseAlias(conflictRow.current_value || adapterRow.current_value)
      : { canonical_alias: '', normalized_alias: '' };

    return {
      detail_id: normalizeText(adapterRow.detail_id),
      reel_id: normalizeText(adapterRow.reel_id),
      model_year: normalizeText(adapterRow.model_year),
      SKU: normalizeText(adapterRow.SKU),
      field_key: normalizeText(adapterRow.field_key),
      apply_input_status: normalizeText(adapterRow.apply_input_status),
      apply_input_value: normalizeText(adapterRow.apply_input_value),
      apply_input_layer: normalizeText(adapterRow.apply_input_layer),
      target_scope: normalizeText(adapterRow.target_scope),
      target_baseline_column: normalizeText(adapterRow.target_baseline_column),
      overwrite_policy: normalizeText(adapterRow.overwrite_policy),
      source_type: normalizeText(conflictRow.source_type || patchRow.source_type),
      evidence_type: buildEvidenceType(conflictRow, patchRow),
      notes: normalizeText(adapterRow.notes),
      current_confirmed_state: normalizeText(adapterRow.current_confirmed_state),
      current_value: normalizeText(adapterRow.current_value),
      current_layer: normalizeText(adapterRow.current_layer),
      decision_bucket: normalizeText(conflictRow.decision_bucket),
      conflict_tag: normalizeText(conflictRow.conflict_tag),
      canonical_alias: aliasInfo.canonical_alias,
      normalized_alias: aliasInfo.normalized_alias,
    };
  });

  return {
    builderRows,
    simulationRows,
    baselineColumns: {
      master: masterHeaders,
      detail: detailHeaders,
    },
  };
}

function summarizeBuilder(rows) {
  const countBy = (key) => {
    const map = new Map();
    for (const row of rows) {
      const value = normalizeText(row[key]) || '(blank)';
      map.set(value, (map.get(value) || 0) + 1);
    }
    return Array.from(map.entries()).map(([metric, value]) => ({ metric, value }));
  };
  return [
    { metric: 'total_apply_input_rows', value: rows.length },
    ...countBy('apply_input_layer').map((row) => ({ metric: `apply_input_layer:${row.metric}`, value: row.value })),
    ...countBy('apply_input_status').map((row) => ({ metric: `apply_input_status:${row.metric}`, value: row.value })),
    ...countBy('target_scope').map((row) => ({ metric: `target_scope:${row.metric}`, value: row.value })),
  ];
}

function renderSummaryMarkdown(rows, summary, simulationRows) {
  const directlyConvertible = simulationRows.filter((row) => row.simulation_result === 'can_directly_convert');
  const needsState = simulationRows.filter((row) => row.simulation_result === 'needs_new_apply_input_state');
  const missingColumn = simulationRows.filter((row) => row.simulation_result === 'cannot_direct_map_missing_column');

  const lines = [
    '# Shimano baitcasting reel apply input summary v1',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_conflict_tagged_view: \`${path.relative(REPO_ROOT, CONFLICT_TAGGED_XLSX)}\``,
    `- input_approved_patch: \`${path.relative(REPO_ROOT, APPROVED_PATCH_JSON)}\``,
    `- input_apply_input_design: \`${path.relative(REPO_ROOT, ADAPTER_XLSX)}\``,
    '',
    '这份 summary 只描述 builder 已经产出的 apply input，不推进真实 apply。',
    '',
    '## Summary',
    '',
    ...summary.map((row) => `- ${row.metric}: ${row.value}`),
    '',
    '## Simulation snapshot',
    '',
    `- can_directly_convert: ${directlyConvertible.map((row) => `${row.reel_id}:${row.field_key}`).join('、') || '无'}`,
    `- needs_new_apply_input_state: ${needsState.map((row) => `${row.reel_id}:${row.field_key}`).join('、') || '无'}`,
    `- cannot_direct_map_missing_column: ${missingColumn.map((row) => `${row.reel_id}:${row.field_key}`).join('、') || '无'}`,
    '',
  ];

  return lines.join('\n');
}

function buildPrecheckRows(builderRows, baselineColumns) {
  return builderRows.map((row) => {
    const result = {
      detail_id: row.detail_id,
      reel_id: row.reel_id,
      model_year: row.model_year,
      SKU: row.SKU,
      field_key: row.field_key,
      apply_input_layer: row.apply_input_layer,
      apply_input_status: row.apply_input_status,
      target_scope: row.target_scope,
      target_baseline_column: row.target_baseline_column,
      consumer_readiness: '',
      blocker_type: '',
      blocker_family: '',
      notes: '',
    };

    if (row.target_scope === 'master') {
      if (row.apply_input_layer === 'master_identity_value' && row.field_key === 'version_signature') {
        result.consumer_readiness = 'blocked';
        result.blocker_type = 'baseline_missing_version_signature_column';
        result.blocker_family = 'baseline_schema_gap';
        result.notes = 'Builder now packages version_signature, but baseline master sheet still has no column to receive it.';
        return result;
      }
      result.consumer_readiness = 'blocked';
      result.blocker_type = 'apply_consumer_missing_master_state_support';
      result.blocker_family = 'consumer_mapping_gap';
      result.notes = 'Current apply consumer still expects detail-only approved patch and cannot yet consume master-scoped builder rows.';
      return result;
    }

    if (row.apply_input_layer === 'detail_inferred_value') {
      result.consumer_readiness = 'blocked';
      result.blocker_type = 'apply_consumer_missing_inferred_state_support';
      result.blocker_family = 'consumer_mapping_gap';
      result.notes = 'Builder correctly packages inferred gear_material, but current apply consumer cannot preserve inferred/non-official semantics.';
      return result;
    }

    if (row.apply_input_layer === 'detail_confirmed_blank') {
      result.consumer_readiness = 'blocked';
      result.blocker_type = 'apply_consumer_missing_confirmed_blank_support';
      result.blocker_family = 'consumer_mapping_gap';
      result.notes = 'Builder correctly marks confirmed blank, but current apply consumer would currently treat this as missing data.';
      return result;
    }

    if (row.apply_input_layer === 'detail_confirmed_value' && row.field_key === 'body_material_tech') {
      result.consumer_readiness = 'blocked';
      result.blocker_type = 'apply_consumer_missing_body_material_tech_state_support';
      result.blocker_family = 'consumer_mapping_gap';
      result.notes = 'body_material_tech is now packaged, but current consumer logic only partially relies on old patch payload and not the new builder state.';
      return result;
    }

    if (row.apply_input_layer === 'detail_confirmed_value' && row.field_key === 'gear_material') {
      result.consumer_readiness = 'blocked';
      result.blocker_type = 'apply_consumer_missing_direct_gear_material_state_support';
      result.blocker_family = 'consumer_mapping_gap';
      result.notes = 'Direct gear_material is packaged in builder, but current apply consumer still reads it only from approved patch rows.';
      return result;
    }

    if (row.apply_input_layer === 'detail_direct_value') {
      result.consumer_readiness = 'ready';
      result.blocker_type = '';
      result.blocker_family = 'none';
      result.notes = 'detail body_material rows are already close to current consumer expectations; remaining issue is overwrite policy execution, not input shape.';
      return result;
    }

    result.consumer_readiness = 'blocked';
    result.blocker_type = 'unclassified_consumer_gap';
    result.blocker_family = 'consumer_mapping_gap';
    result.notes = 'Builder row exists but consumer support is not yet explicit.';
    return result;
  });
}

function summarizePrecheck(rows) {
  const countBy = (key) => {
    const map = new Map();
    for (const row of rows) {
      const value = normalizeText(row[key]) || '(blank)';
      map.set(value, (map.get(value) || 0) + 1);
    }
    return Array.from(map.entries()).map(([metric, value]) => ({ metric, value }));
  };
  return [
    { metric: 'total_precheck_rows', value: rows.length },
    ...countBy('consumer_readiness').map((row) => ({ metric: `consumer_readiness:${row.metric}`, value: row.value })),
    ...countBy('blocker_family').filter((row) => row.metric !== 'none').map((row) => ({ metric: `blocker_family:${row.metric}`, value: row.value })),
    ...countBy('blocker_type').filter((row) => row.metric !== '(blank)').map((row) => ({ metric: `blocker_type:${row.metric}`, value: row.value })),
  ];
}

function renderPrecheckMarkdown(summaryRows, precheckRows) {
  const ready = precheckRows.filter((row) => row.consumer_readiness === 'ready');
  const blocked = precheckRows.filter((row) => row.consumer_readiness !== 'ready');
  const blockerTypes = Array.from(new Set(blocked.map((row) => row.blocker_type)));

  const lines = [
    '# Shimano baitcasting reel builder 驱动的第三轮 dry-run 预检查',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_apply_input_json: \`${path.relative(REPO_ROOT, OUTPUT_JSON)}\``,
    '',
    '## Summary',
    '',
    ...summaryRows.map((row) => `- ${row.metric}: ${row.value}`),
    '',
    '## Conclusion',
    '',
    blocked.length
      ? '- apply_input_ready_for_current_apply_consumer: no'
      : '- apply_input_ready_for_current_apply_consumer: yes',
    blocked.length
      ? `- structural_blockers: ${blockerTypes.join('、')}`
      : '- structural_blockers: none',
    blocked.length
      ? '- missing_piece: current apply consumer still lacks support for builder-defined master states and special detail states.'
      : '- missing_piece: none',
    '',
    '## Rows',
    '',
    '| detail_id | reel_id | field_key | apply_input_layer | apply_input_status | target_scope | target_baseline_column | consumer_readiness | blocker_type | blocker_family | notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...precheckRows.map((row) => `| ${[
      row.detail_id,
      row.reel_id,
      row.field_key,
      row.apply_input_layer,
      row.apply_input_status,
      row.target_scope,
      row.target_baseline_column,
      row.consumer_readiness,
      row.blocker_type,
      row.blocker_family,
      row.notes,
    ].map((value) => String(value || '').replace(/\|/g, '\\|')).join(' | ')} |`),
    '',
  ];

  return lines.join('\n');
}

function writeWorkbook(filePath, sheets) {
  ensureDir(filePath);
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheet.rows), sheet.name);
  }
  XLSX.writeFile(workbook, filePath);
}

function main() {
  const { builderRows, simulationRows, baselineColumns } = buildBuilderRows();
  const summaryRows = summarizeBuilder(builderRows);
  const stateInventory = Array.from(new Map(builderRows.map((row) => [row.apply_input_layer, {
    apply_input_layer: row.apply_input_layer,
    applies_to_fields: [],
    statuses: [],
  }])).values());
  const stateMap = new Map();
  for (const row of builderRows) {
    if (!stateMap.has(row.apply_input_layer)) {
      stateMap.set(row.apply_input_layer, {
        apply_input_layer: row.apply_input_layer,
        applies_to_fields: new Set(),
        statuses: new Set(),
      });
    }
    const item = stateMap.get(row.apply_input_layer);
    item.applies_to_fields.add(row.field_key);
    item.statuses.add(row.apply_input_status);
  }
  const stateInventoryRows = Array.from(stateMap.values()).map((item) => ({
    apply_input_layer: item.apply_input_layer,
    applies_to_fields: Array.from(item.applies_to_fields).sort().join(', '),
    apply_input_statuses: Array.from(item.statuses).sort().join(', '),
  }));

  ensureDir(OUTPUT_JSON);
  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        scope: 'current 5 Shimano baitcasting reel samples / current 6 fields',
        inputs: {
          conflict_tagged_view: path.relative(REPO_ROOT, CONFLICT_TAGGED_XLSX),
          approved_patch: path.relative(REPO_ROOT, APPROVED_PATCH_JSON),
          apply_input_adapter: path.relative(REPO_ROOT, ADAPTER_XLSX),
        },
        rows: builderRows,
        simulation: simulationRows,
        state_inventory: stateInventoryRows,
      },
      null,
      2
    ),
    'utf8'
  );

  writeWorkbook(OUTPUT_XLSX, [
    { name: 'apply_input', rows: builderRows },
    { name: 'apply_input_simulation', rows: simulationRows },
    { name: 'state_inventory', rows: stateInventoryRows },
  ]);
  fs.writeFileSync(OUTPUT_MD, `${renderSummaryMarkdown(builderRows, summaryRows, simulationRows)}\n`, 'utf8');

  const precheckRows = buildPrecheckRows(builderRows, baselineColumns);
  const precheckSummary = summarizePrecheck(precheckRows);
  writeWorkbook(PRECHECK_XLSX, [
    { name: 'summary', rows: precheckSummary },
    { name: 'precheck_rows', rows: precheckRows },
  ]);
  fs.writeFileSync(PRECHECK_MD, `${renderPrecheckMarkdown(precheckSummary, precheckRows)}\n`, 'utf8');

  console.log(`apply input json -> ${OUTPUT_JSON}`);
  console.log(`apply input workbook -> ${OUTPUT_XLSX}`);
  console.log(`apply input summary -> ${OUTPUT_MD}`);
  console.log(`third dry-run precheck markdown -> ${PRECHECK_MD}`);
  console.log(`third dry-run precheck workbook -> ${PRECHECK_XLSX}`);
}

main();
