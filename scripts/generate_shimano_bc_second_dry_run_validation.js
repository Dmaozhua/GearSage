const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONFLICT_TAGGED_XLSX = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_conflict_tagged_recheck_view.xlsx'
);
const APPROVED_PATCH_JSON = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_patch.json'
);
const BASELINE_XLSX = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx'
);
const OUTPUT_MD = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_second_dry_run_diff.md'
);
const OUTPUT_XLSX = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_second_dry_run_diff.xlsx'
);

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

function chooseAliasApplyValue(currentValue) {
  const [canonical, normalized] = String(currentValue || '').split('=>').map((part) => normalizeText(part));
  return { canonical_alias: canonical, normalized_alias: normalized };
}

function buildIndexes() {
  const conflictRows = loadSheetRows(CONFLICT_TAGGED_XLSX, 'conflict_tagged_view');
  const approvedPatchRows = loadJsonRows(APPROVED_PATCH_JSON);
  const workbook = XLSX.readFile(BASELINE_XLSX);
  const masterRows = XLSX.utils.sheet_to_json(workbook.Sheets['reel'], { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(workbook.Sheets['baitcasting_reel_detail'], { defval: '' });
  const masterHeaders = XLSX.utils.sheet_to_json(workbook.Sheets['reel'], { header: 1, defval: '' })[0] || [];
  const detailHeaders = XLSX.utils.sheet_to_json(workbook.Sheets['baitcasting_reel_detail'], { header: 1, defval: '' })[0] || [];

  const patchBodyByDetail = new Map();
  const patchGearByDetail = new Map();
  for (const row of approvedPatchRows) {
    if (normalizeText(row.field_key) === 'body_material') patchBodyByDetail.set(normalizeText(row.detail_id), row);
    if (normalizeText(row.field_key) === 'gear_material') patchGearByDetail.set(normalizeText(row.detail_id), row);
  }

  return {
    conflictRows,
    patchBodyByDetail,
    patchGearByDetail,
    mastersById: new Map(masterRows.map((row) => [normalizeText(row.id), row])),
    detailsById: new Map(detailRows.map((row) => [normalizeText(row.id), row])),
    masterHeaders,
    detailHeaders,
  };
}

function evaluateRow(row, ctx) {
  const master = ctx.mastersById.get(normalizeText(row.reel_id));
  const detail = ctx.detailsById.get(normalizeText(row.detail_id));
  const baselineMasterYear = normalizeText(master && master.model_year);
  const detailPatchBody = ctx.patchBodyByDetail.get(normalizeText(row.detail_id));
  const detailPatchGear = ctx.patchGearByDetail.get(normalizeText(row.detail_id));

  const result = {
    detail_id: normalizeText(row.detail_id),
    reel_id: normalizeText(row.reel_id),
    model_year: normalizeText(row.model_year),
    SKU: normalizeText(row.SKU),
    field_key: normalizeText(row.field_key),
    current_value: normalizeText(row.current_value),
    source_type: normalizeText(row.source_type),
    decision_bucket: normalizeText(row.decision_bucket),
    conflict_tag: normalizeText(row.conflict_tag),
    ready_for_next_dry_run: normalizeText(row.ready_for_next_dry_run),
    approved_patch_status: '',
    baseline_target_sheet: '',
    baseline_target_column: '',
    baseline_current_value: '',
    dry_run_status: '',
    blocker_type: '',
    blocker_family: '',
    dry_run_note: '',
  };

  if (row.field_key === 'model_year') {
    result.baseline_target_sheet = 'reel';
    result.baseline_target_column = 'model_year';
    result.baseline_current_value = baselineMasterYear;
    result.approved_patch_status = 'missing_master_apply_input';
    if (!baselineMasterYear) {
      result.dry_run_status = 'blocked_new_structure';
      result.blocker_type = 'confirmed_state_not_packaged_for_master_apply';
      result.blocker_family = 'new_structure_issue';
      result.dry_run_note = 'Current confirmed model_year exists in conflict-tagged view, but approved patch does not carry master-field writes and baseline master year is still blank.';
    } else {
      result.dry_run_status = 'blocked_new_structure';
      result.blocker_type = 'missing_master_apply_input';
      result.blocker_family = 'new_structure_issue';
      result.dry_run_note = 'Baseline already has model_year, but current apply input still has no master-field packaging.';
    }
    return result;
  }

  if (row.field_key === 'version_signature') {
    result.baseline_target_sheet = 'reel';
    result.baseline_target_column = '(missing)';
    result.baseline_current_value = '';
    result.approved_patch_status = 'missing_master_apply_input';
    result.dry_run_status = 'blocked_new_structure';
    result.blocker_type = 'missing_baseline_column_for_version_signature';
    result.blocker_family = 'new_structure_issue';
    result.dry_run_note = 'Baseline import has no version_signature column, so current confirmed identity state has nowhere to land.';
    return result;
  }

  if (row.field_key === 'alias') {
    result.baseline_target_sheet = 'reel';
    result.baseline_target_column = 'alias';
    result.baseline_current_value = normalizeText(master && master.alias);
    result.approved_patch_status = 'missing_master_apply_input';
    const aliasParts = chooseAliasApplyValue(row.current_value);
    result.dry_run_status = 'blocked_new_structure';
    result.blocker_type = 'dual_alias_state_not_mapped_to_single_column';
    result.blocker_family = 'new_structure_issue';
    result.dry_run_note = `Current state keeps canonical_alias='${aliasParts.canonical_alias}' and normalized_alias='${aliasParts.normalized_alias}'. Baseline only has one alias column and approved patch does not define which alias form to write.`;
    return result;
  }

  if (row.field_key === 'body_material') {
    result.baseline_target_sheet = 'baitcasting_reel_detail';
    result.baseline_target_column = 'body_material';
    result.baseline_current_value = normalizeText(detail && detail.body_material);
    result.approved_patch_status = detailPatchBody ? 'present' : 'missing';
    if (!detailPatchBody) {
      result.dry_run_status = 'blocked_new_structure';
      result.blocker_type = 'body_material_missing_from_apply_input';
      result.blocker_family = 'new_structure_issue';
      result.dry_run_note = 'Current confirmed body_material is not represented in approved patch.';
      return result;
    }
    if (!baselineMasterYear) {
      result.dry_run_status = 'blocked_old_baseline';
      result.blocker_type = 'baseline_model_year_blank';
      result.blocker_family = 'old_baseline_residual';
      result.dry_run_note = 'Current apply path still validates against baseline master model_year, which is blank for this reel.';
      return result;
    }
    if (normalizeText(detail && detail.body_material) && normalizeText(detail.body_material) !== normalizeText(row.current_value)) {
      result.dry_run_status = 'blocked_old_baseline';
      result.blocker_type = 'baseline_existing_conflicting_value';
      result.blocker_family = 'old_baseline_residual';
      result.dry_run_note = 'Baseline detail row already contains a legacy body_material phrase that conflicts with the current resolved value.';
      return result;
    }
    result.dry_run_status = 'ready_or_no_change';
    result.blocker_type = '';
    result.blocker_family = 'none';
    result.dry_run_note = normalizeText(detail && detail.body_material) === normalizeText(row.current_value)
      ? 'Baseline already matches the resolved body_material.'
      : 'Would be able to enter apply input without new blocker.';
    return result;
  }

  if (row.field_key === 'body_material_tech') {
    result.baseline_target_sheet = 'baitcasting_reel_detail';
    result.baseline_target_column = 'body_material_tech';
    result.baseline_current_value = normalizeText(detail && detail.body_material_tech);
    const patchTechValue = normalizeText(detailPatchBody && detailPatchBody.body_material_tech);
    result.approved_patch_status = patchTechValue ? 'present' : 'missing_or_blank';
    if (!patchTechValue && normalizeText(row.current_value)) {
      result.dry_run_status = 'blocked_new_structure';
      result.blocker_type = 'confirmed_body_material_tech_not_reflected_in_patch';
      result.blocker_family = 'new_structure_issue';
      result.dry_run_note = 'Current review support state is confirmed, but approved patch still does not carry this body_material_tech value.';
      return result;
    }
    if (!baselineMasterYear) {
      result.dry_run_status = 'blocked_old_baseline';
      result.blocker_type = 'baseline_model_year_blank';
      result.blocker_family = 'old_baseline_residual';
      result.dry_run_note = 'Current apply path still validates against baseline master model_year, which is blank for this reel.';
      return result;
    }
    result.dry_run_status = 'ready_or_no_change';
    result.blocker_type = '';
    result.blocker_family = 'none';
    result.dry_run_note = 'body_material_tech is ready for dry-run input under current confirmed state.';
    return result;
  }

  if (row.field_key === 'gear_material') {
    result.baseline_target_sheet = 'baitcasting_reel_detail';
    result.baseline_target_column = 'gear_material';
    result.baseline_current_value = normalizeText(detail && detail.gear_material);
    result.approved_patch_status = detailPatchGear ? 'present' : 'missing';

    if (row.conflict_tag === 'accepted_manual_blank') {
      result.dry_run_status = 'ready_or_no_change';
      result.blocker_type = '';
      result.blocker_family = 'none';
      result.dry_run_note = 'manual_blank is an accepted terminal state; no write is required and no blocker remains.';
      return result;
    }

    if (!detailPatchGear && normalizeText(row.current_value)) {
      result.dry_run_status = 'blocked_new_structure';
      result.blocker_type = 'confirmed_gear_material_not_reflected_in_patch';
      result.blocker_family = 'new_structure_issue';
      result.dry_run_note = 'Current confirmed gear_material state exists in conflict-tagged view, but approved patch does not yet carry it.';
      return result;
    }

    if (!baselineMasterYear) {
      result.dry_run_status = 'blocked_old_baseline';
      result.blocker_type = 'baseline_model_year_blank';
      result.blocker_family = 'old_baseline_residual';
      result.dry_run_note = 'Current apply path still validates against baseline master model_year, which is blank for this reel.';
      return result;
    }

    if (normalizeText(detail && detail.gear_material) && normalizeText(detail.gear_material) !== normalizeText(row.current_value)) {
      result.dry_run_status = 'blocked_old_baseline';
      result.blocker_type = 'baseline_existing_conflicting_value';
      result.blocker_family = 'old_baseline_residual';
      result.dry_run_note = 'Baseline detail row already contains a conflicting gear_material value.';
      return result;
    }

    result.dry_run_status = 'ready_or_no_change';
    result.blocker_type = '';
    result.blocker_family = 'none';
    result.dry_run_note = normalizeText(detail && detail.gear_material) === normalizeText(row.current_value)
      ? 'Baseline already matches the resolved gear_material.'
      : 'Would be able to enter apply input without new blocker.';
    return result;
  }

  result.dry_run_status = 'blocked_new_structure';
  result.blocker_type = 'unsupported_field';
  result.blocker_family = 'new_structure_issue';
  result.dry_run_note = 'Unsupported field in second dry-run validation.';
  return result;
}

function buildSummary(rows) {
  const countBy = (key) => {
    const map = new Map();
    for (const row of rows) {
      const value = normalizeText(row[key]) || '(blank)';
      map.set(value, (map.get(value) || 0) + 1);
    }
    return Array.from(map.entries()).map(([metric, value]) => ({ metric, value }));
  };

  return {
    metrics: [
      { metric: 'total_rows', value: rows.length },
      ...countBy('dry_run_status').map((row) => ({ metric: `dry_run_status:${row.metric}`, value: row.value })),
      ...countBy('blocker_family').filter((row) => row.metric !== 'none').map((row) => ({ metric: `blocker_family:${row.metric}`, value: row.value })),
      ...countBy('blocker_type').filter((row) => row.metric !== '(blank)').map((row) => ({ metric: `blocker_type:${row.metric}`, value: row.value })),
    ],
    blockerRows: rows.filter((row) => row.blocker_family !== 'none'),
    readyRows: rows.filter((row) => row.blocker_family === 'none'),
  };
}

function renderMarkdown(rows, summary) {
  const escapeCell = (value) => String(value || '-').replace(/\|/g, '\\|');
  const oldBaselineIssues = Array.from(new Set(summary.blockerRows.filter((row) => row.blocker_family === 'old_baseline_residual').map((row) => row.blocker_type)));
  const newStructureIssues = Array.from(new Set(summary.blockerRows.filter((row) => row.blocker_family === 'new_structure_issue').map((row) => row.blocker_type)));

  const lines = [
    '# Shimano baitcasting reel apply 前第二轮 dry-run 验证',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_conflict_tagged_view: \`${path.relative(REPO_ROOT, CONFLICT_TAGGED_XLSX)}\``,
    `- input_approved_patch: \`${path.relative(REPO_ROOT, APPROVED_PATCH_JSON)}\``,
    `- input_baseline_import: \`${path.relative(REPO_ROOT, BASELINE_XLSX)}\``,
    '',
    '这轮只做 dry-run 验证，不执行真实 apply。',
    '',
    '## Summary',
    '',
    ...summary.metrics.map((row) => `- ${row.metric}: ${row.value}`),
    '',
    '## Old baseline residual issues',
    '',
    ...(oldBaselineIssues.length ? oldBaselineIssues.map((item) => `- ${item}`) : ['- none']),
    '',
    '## New structure issues',
    '',
    ...(newStructureIssues.length ? newStructureIssues.map((item) => `- ${item}`) : ['- none']),
    '',
    '## Apply readiness',
    '',
    summary.blockerRows.length
      ? '- current_5_samples_ready_for_first_real_apply: no'
      : '- current_5_samples_ready_for_first_real_apply: yes',
    summary.blockerRows.length
      ? '- readiness_gap: confirmed state is not yet fully packaged into current apply input, and baseline still contains legacy residues.'
      : '- readiness_gap: none',
    '',
    '## Diff rows',
    '',
    '| detail_id | reel_id | model_year | SKU | field_key | current_value | approved_patch_status | baseline_target_sheet | baseline_target_column | baseline_current_value | dry_run_status | blocker_type | blocker_family | dry_run_note |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${[
      row.detail_id,
      row.reel_id,
      row.model_year,
      row.SKU,
      row.field_key,
      row.current_value,
      row.approved_patch_status,
      row.baseline_target_sheet,
      row.baseline_target_column,
      row.baseline_current_value,
      row.dry_run_status,
      row.blocker_type,
      row.blocker_family,
      row.dry_run_note,
    ].map(escapeCell).join(' | ')} |`),
    '',
  ];

  return lines.join('\n');
}

function writeWorkbook(rows, summary) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary.metrics), 'summary');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'dry_run_diff');
  XLSX.writeFile(workbook, OUTPUT_XLSX);
}

function main() {
  const ctx = buildIndexes();
  const rows = ctx.conflictRows.map((row) => evaluateRow(row, ctx));
  const summary = buildSummary(rows);
  ensureDir(OUTPUT_MD);
  ensureDir(OUTPUT_XLSX);
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(rows, summary), 'utf8');
  writeWorkbook(rows, summary);
  console.log(`second dry-run markdown -> ${OUTPUT_MD}`);
  console.log(`second dry-run workbook -> ${OUTPUT_XLSX}`);
}

main();
