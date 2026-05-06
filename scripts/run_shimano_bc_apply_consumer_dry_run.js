const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const APPLY_INPUT_JSON = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.json');
const BASELINE_XLSX = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_副本.xlsx');
const MAPPING_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_consumer_state_mapping_v1.xlsx');
const DRY_RUN_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_consumer_driven_dry_run_v1.xlsx');
const DRY_RUN_MD = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_consumer_driven_dry_run_v1.md');

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

function loadBaseline() {
  const workbook = XLSX.readFile(BASELINE_XLSX);
  const masterRows = XLSX.utils.sheet_to_json(workbook.Sheets.reel, { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(workbook.Sheets.baitcasting_reel_detail, { defval: '' });
  const masterHeaders = XLSX.utils.sheet_to_json(workbook.Sheets.reel, { header: 1, defval: '' })[0] || [];
  const detailHeaders = XLSX.utils.sheet_to_json(workbook.Sheets.baitcasting_reel_detail, { header: 1, defval: '' })[0] || [];
  return {
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

function buildConsumerStateMapping() {
  return [
    {
      field_key: 'model_year',
      apply_input_status: 'requires_new_apply_input_state',
      apply_input_layer: 'master_identity_value',
      target_scope: 'master',
      target_baseline_column: 'model_year',
      consumer_supported: 'yes',
      required_action: 'consume_master_identity_value',
      overwrite_policy: 'fill_blank_only',
      fallback_behavior: 'hold_if_master_binding_conflicts',
      notes: 'Read builder row as master identity value, keyed by reel_id. Duplicate detail rows should collapse to one master candidate.',
    },
    {
      field_key: 'alias',
      apply_input_status: 'requires_new_apply_input_state',
      apply_input_layer: 'master_dual_alias_value',
      target_scope: 'master',
      target_baseline_column: 'alias',
      consumer_supported: 'yes',
      required_action: 'consume_master_dual_alias_value',
      overwrite_policy: 'controlled_replace_legacy_blank_or_noise',
      fallback_behavior: 'write normalized_alias only; keep canonical_alias in audit sidecar',
      notes: 'Baseline single alias column should receive normalized_alias. canonical_alias stays in consumer audit metadata and dry-run output.',
    },
    {
      field_key: 'version_signature',
      apply_input_status: 'blocked_missing_baseline_column',
      apply_input_layer: 'master_identity_value',
      target_scope: 'master',
      target_baseline_column: '(missing)',
      consumer_supported: 'no',
      required_action: 'hold_master_sidecar_only',
      overwrite_policy: 'cannot_write_without_column',
      fallback_behavior: 'skip baseline write and preserve value in sidecar/audit layer',
      notes: 'Current phase should not remap version_signature into another column. Safe handling is hold/skip, not temporary overloading.',
    },
    {
      field_key: 'body_material',
      apply_input_status: 'ready_with_controlled_replace',
      apply_input_layer: 'detail_direct_value',
      target_scope: 'detail',
      target_baseline_column: 'body_material',
      consumer_supported: 'yes',
      required_action: 'consume_detail_value',
      overwrite_policy: 'controlled_replace_legacy_value',
      fallback_behavior: 'if same value, treat as no_change',
      notes: 'Legacy-compatible detail value. Use review-confirmed value and preserve controlled replacement semantics.',
    },
    {
      field_key: 'body_material',
      apply_input_status: 'ready_with_controlled_replace',
      apply_input_layer: 'detail_confirmed_value',
      target_scope: 'detail',
      target_baseline_column: 'body_material',
      consumer_supported: 'yes',
      required_action: 'consume_detail_confirmed_value',
      overwrite_policy: 'controlled_replace_legacy_value',
      fallback_behavior: 'if same value, treat as no_change',
      notes: 'Some body_material rows are already normalized into detail_confirmed_value. Consumer should handle them the same way as other review-confirmed detail values.',
    },
    {
      field_key: 'body_material_tech',
      apply_input_status: 'requires_new_apply_input_state',
      apply_input_layer: 'detail_confirmed_value',
      target_scope: 'detail',
      target_baseline_column: 'body_material_tech',
      consumer_supported: 'yes',
      required_action: 'consume_detail_confirmed_value',
      overwrite_policy: 'fill_blank_or_controlled_replace_if_review_confirmed',
      fallback_behavior: 'if existing baseline value is same, mark no_change',
      notes: 'This field must now be consumed explicitly from builder output rather than piggybacking on old patch interpretation.',
    },
    {
      field_key: 'gear_material',
      apply_input_status: 'requires_new_apply_input_state',
      apply_input_layer: 'detail_confirmed_value',
      target_scope: 'detail',
      target_baseline_column: 'gear_material',
      consumer_supported: 'yes',
      required_action: 'consume_detail_confirmed_value',
      overwrite_policy: 'fill_blank_or_controlled_replace_if_review_confirmed',
      fallback_behavior: 'if same value, treat as no_change',
      notes: 'Direct-write gear_material is now handled explicitly as a confirmed detail state.',
    },
    {
      field_key: 'gear_material',
      apply_input_status: 'requires_new_apply_input_state',
      apply_input_layer: 'detail_inferred_value',
      target_scope: 'detail',
      target_baseline_column: 'gear_material',
      consumer_supported: 'yes',
      required_action: 'consume_detail_inferred_value',
      overwrite_policy: 'fill_blank_only_keep_non_official',
      fallback_behavior: 'preserve inferred layer in audit output; never promote to official',
      notes: 'SRE5003 stays inferred. Consumer must carry non-official semantics through dry-run and future apply.',
    },
    {
      field_key: 'gear_material',
      apply_input_status: 'requires_new_apply_input_state',
      apply_input_layer: 'detail_confirmed_blank',
      target_scope: 'detail',
      target_baseline_column: 'gear_material',
      consumer_supported: 'yes',
      required_action: 'consume_detail_confirmed_blank',
      overwrite_policy: 'preserve_blank_as_confirmed',
      fallback_behavior: 'do not backfill; mark blank as intentional confirmed state',
      notes: 'SRE5019 must remain an explicit confirmed blank so later passes do not reclassify it as scrape miss.',
    },
  ];
}

function classifyRule(row) {
  const rules = buildConsumerStateMapping();
  return rules.find((rule) =>
    normalizeText(rule.field_key) === normalizeText(row.field_key) &&
    normalizeText(rule.apply_input_layer) === normalizeText(row.apply_input_layer) &&
    normalizeText(rule.target_scope) === normalizeText(row.target_scope)
  );
}

function evaluateRow(row, baseline) {
  const rule = classifyRule(row);
  const result = {
    detail_id: normalizeText(row.detail_id),
    reel_id: normalizeText(row.reel_id),
    model_year: normalizeText(row.model_year),
    SKU: normalizeText(row.SKU),
    field_key: normalizeText(row.field_key),
    apply_input_status: normalizeText(row.apply_input_status),
    apply_input_value: normalizeText(row.apply_input_value),
    apply_input_layer: normalizeText(row.apply_input_layer),
    target_scope: normalizeText(row.target_scope),
    target_baseline_column: normalizeText(row.target_baseline_column),
    overwrite_policy: normalizeText(row.overwrite_policy),
    source_type: normalizeText(row.source_type),
    evidence_type: normalizeText(row.evidence_type),
    consumer_result: '',
    consumer_result_type: '',
    baseline_current_value: '',
    audit_sidecar_value: '',
    notes: '',
  };

  if (!rule) {
    result.consumer_result = 'blocked_consumer_missing_rule';
    result.consumer_result_type = 'blocked_consumer_support';
    result.notes = 'No consumer adaptation rule matched this builder row.';
    return result;
  }

  if (normalizeText(rule.consumer_supported) !== 'yes') {
    result.consumer_result = 'blocked_baseline_missing_column';
    result.consumer_result_type = 'blocked_baseline_schema_gap';
    result.notes = rule.notes;
    result.audit_sidecar_value = normalizeText(row.apply_input_value);
    return result;
  }

  if (row.target_scope === 'master') {
    const masterRow = baseline.mastersById.get(normalizeText(row.reel_id)) || {};
    result.baseline_current_value = normalizeText(masterRow[row.target_baseline_column]);

    if (!hasColumn(baseline.masterHeaders, row.target_baseline_column)) {
      result.consumer_result = 'blocked_baseline_missing_column';
      result.consumer_result_type = 'blocked_baseline_schema_gap';
      result.notes = `Baseline master sheet lacks column '${row.target_baseline_column}'.`;
      return result;
    }

    if (row.field_key === 'alias') {
      result.consumer_result = 'consumable_master_dual_alias';
      result.consumer_result_type = 'consumable';
      result.audit_sidecar_value = `canonical_alias=${normalizeText(row.canonical_alias)} | normalized_alias=${normalizeText(row.normalized_alias)}`;
      result.notes = 'Write normalized_alias into baseline alias column; preserve canonical_alias in audit sidecar.';
      return result;
    }

    if (row.field_key === 'model_year') {
      result.consumer_result = 'consumable_master_identity_value';
      result.consumer_result_type = 'consumable';
      result.notes = 'Consume as master-scoped identity value; duplicate detail rows should collapse to one reel-level update candidate.';
      return result;
    }

    result.consumer_result = 'blocked_baseline_missing_column';
    result.consumer_result_type = 'blocked_baseline_schema_gap';
    result.audit_sidecar_value = normalizeText(row.apply_input_value);
    result.notes = 'Safe current-stage behavior is hold/skip rather than temporary remap.';
    return result;
  }

  const detailRow = baseline.detailsById.get(normalizeText(row.detail_id)) || {};
  result.baseline_current_value = normalizeText(detailRow[row.target_baseline_column]);

  if (!hasColumn(baseline.detailHeaders, row.target_baseline_column)) {
    result.consumer_result = 'blocked_baseline_missing_column';
    result.consumer_result_type = 'blocked_baseline_schema_gap';
    result.notes = `Baseline detail sheet lacks column '${row.target_baseline_column}'.`;
    return result;
  }

  if (row.apply_input_layer === 'detail_inferred_value') {
    result.consumer_result = 'consumable_inferred_non_official';
    result.consumer_result_type = 'consumable';
    result.audit_sidecar_value = 'layer=inferred';
    result.notes = 'Consumer can carry inferred value forward, but it must remain non-official in audit/output semantics.';
    return result;
  }

  if (row.apply_input_layer === 'detail_confirmed_blank') {
    result.consumer_result = 'consumable_confirmed_blank';
    result.consumer_result_type = 'consumable';
    result.audit_sidecar_value = 'confirmed_blank=true';
    result.notes = 'Consumer should preserve intentional blank and must not reclassify it as missing scrape.';
    return result;
  }

  result.consumer_result = 'consumable_detail_value';
  result.consumer_result_type = 'consumable';
  result.notes = rule.notes;
  return result;
}

function summarize(rows) {
  const counts = new Map();
  for (const row of rows) {
    const key = row.consumer_result_type;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const blockerCounts = new Map();
  for (const row of rows) {
    if (row.consumer_result_type !== 'consumable') {
      blockerCounts.set(row.consumer_result, (blockerCounts.get(row.consumer_result) || 0) + 1);
    }
  }
  return [
    { metric: 'total_rows', value: rows.length },
    ...Array.from(counts.entries()).map(([metric, value]) => ({ metric: `consumer_result_type:${metric}`, value })),
    ...Array.from(blockerCounts.entries()).map(([metric, value]) => ({ metric: `blocker:${metric}`, value })),
  ];
}

function renderDryRunMarkdown(summaryRows, dryRunRows) {
  const blockedConsumer = dryRunRows.filter((row) => row.consumer_result_type === 'blocked_consumer_support');
  const blockedBaseline = dryRunRows.filter((row) => row.consumer_result_type === 'blocked_baseline_schema_gap');
  const consumable = dryRunRows.filter((row) => row.consumer_result_type === 'consumable');

  const lines = [
    '# Shimano baitcasting reel consumer-driven dry-run v1',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_apply_input_json: \`${path.relative(REPO_ROOT, APPLY_INPUT_JSON)}\``,
    `- baseline_import: \`${path.relative(REPO_ROOT, BASELINE_XLSX)}\``,
    '',
    '## Summary',
    '',
    ...summaryRows.map((row) => `- ${row.metric}: ${row.value}`),
    '',
    '## Conclusion',
    '',
    blockedConsumer.length
      ? '- consumer_state_support_ready: no'
      : '- consumer_state_support_ready: yes',
    blockedBaseline.length
      ? '- remaining_schema_gap: version_signature baseline column is still missing'
      : '- remaining_schema_gap: none',
    '',
    '## Row sample',
    '',
    '| detail_id | reel_id | field_key | apply_input_layer | consumer_result_type | consumer_result | target_baseline_column | notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...dryRunRows.slice(0, 40).map((row) => `| ${row.detail_id} | ${row.reel_id} | ${row.field_key} | ${row.apply_input_layer} | ${row.consumer_result_type} | ${row.consumer_result} | ${row.target_baseline_column} | ${String(row.notes || '').replace(/\|/g, '\\|')} |`),
    '',
    `- consumable_rows: ${consumable.length}`,
    `- blocked_consumer_support_rows: ${blockedConsumer.length}`,
    `- blocked_baseline_schema_rows: ${blockedBaseline.length}`,
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function main() {
  const payload = loadJson(APPLY_INPUT_JSON);
  const builderRows = payload.rows || [];
  const baseline = loadBaseline();
  const mappingRows = buildConsumerStateMapping();
  const dryRunRows = builderRows.map((row) => evaluateRow(row, baseline));
  const summaryRows = summarize(dryRunRows);

  ensureDir(MAPPING_XLSX);
  ensureDir(DRY_RUN_XLSX);
  ensureDir(DRY_RUN_MD);

  const mappingWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(mappingWb, XLSX.utils.json_to_sheet(mappingRows), 'consumer_state_mapping');
  XLSX.writeFile(mappingWb, MAPPING_XLSX);

  const dryRunWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(dryRunWb, XLSX.utils.json_to_sheet(summaryRows), 'summary');
  XLSX.utils.book_append_sheet(dryRunWb, XLSX.utils.json_to_sheet(dryRunRows), 'consumer_dry_run');
  XLSX.writeFile(dryRunWb, DRY_RUN_XLSX);

  fs.writeFileSync(DRY_RUN_MD, renderDryRunMarkdown(summaryRows, dryRunRows), 'utf8');

  console.log(`Saved consumer state mapping workbook to ${MAPPING_XLSX}`);
  console.log(`Saved consumer-driven dry-run workbook to ${DRY_RUN_XLSX}`);
  console.log(`Saved consumer-driven dry-run markdown to ${DRY_RUN_MD}`);
}

main();
