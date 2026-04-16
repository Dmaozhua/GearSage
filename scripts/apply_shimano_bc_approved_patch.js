const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_EXPERIMENT_CONFIG = path.resolve(
  __dirname,
  './config/whitelist_experiments/shimano_baitcasting_reel.json'
);
const MASTER_SHEET = 'reel';
const DETAIL_SHEET = 'baitcasting_reel_detail';
const SUMMARY_SHEET = 'apply_summary';
const DIFF_SHEET = 'apply_diff';
const APPLY_FLAG = '--apply';

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function resolveRepoPath(relativePath) {
  return path.resolve(REPO_ROOT, relativePath);
}

function ensureDirForFile(filePath) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadExperimentConfig() {
  const configArg = process.argv.find((arg) => arg.endsWith('.json'));
  const configPath = configArg
    ? path.resolve(process.cwd(), configArg)
    : DEFAULT_EXPERIMENT_CONFIG;
  const config = loadJson(configPath);
  return {
    config,
    baselineImport: resolveRepoPath(config.inputs.import_file),
    approvedPatch: resolveRepoPath(config.outputs.approved_patch_json),
    applyResultWorkbook: resolveRepoPath(config.outputs.apply_result_workbook),
    applyDiffWorkbook: resolveRepoPath(config.outputs.apply_diff_workbook),
    applyDiffMarkdown: resolveRepoPath(config.outputs.apply_diff_markdown),
  };
}

function loadWorkbook(filePath) {
  return XLSX.readFile(filePath);
}

function buildWorkbookIndex(workbook) {
  const masterRows = XLSX.utils.sheet_to_json(workbook.Sheets[MASTER_SHEET], { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(workbook.Sheets[DETAIL_SHEET], { defval: '' });

  const mastersById = new Map(masterRows.map((row) => [normalizeText(row.id), row]));
  const detailsById = new Map(detailRows.map((row) => [normalizeText(row.id), row]));

  return {
    masterRows,
    detailRows,
    mastersById,
    detailsById,
    detailHeaders: XLSX.utils.sheet_to_json(workbook.Sheets[DETAIL_SHEET], { header: 1, defval: '' })[0] || [],
    masterHeaders: XLSX.utils.sheet_to_json(workbook.Sheets[MASTER_SHEET], { header: 1, defval: '' })[0] || [],
  };
}

function summarizeRows(rows, statusKey) {
  const summary = new Map();
  for (const row of rows) {
    const key = normalizeText(row[statusKey]) || '(blank)';
    summary.set(key, (summary.get(key) || 0) + 1);
  }
  return Array.from(summary.entries()).map(([status, count]) => ({ status, count }));
}

function validateBinding(patchRow, detailRow, masterRow) {
  if (!detailRow) return 'detail_id_not_found';
  if (!masterRow) return 'master_row_not_found';
  if (normalizeText(detailRow.reel_id) !== normalizeText(patchRow.reel_id)) return 'reel_id_mismatch';
  if (normalizeText(detailRow.SKU) !== normalizeText(patchRow.sku)) return 'sku_mismatch';

  const patchYear = normalizeText(patchRow.model_year);
  const baselineYear = normalizeText(masterRow.model_year);
  if (!patchYear) return 'patch_model_year_blank';
  if (!baselineYear) return 'baseline_model_year_blank';
  if (patchYear !== baselineYear) return 'model_year_mismatch';

  return '';
}

function buildAction(targetColumn, incomingValue, currentValue) {
  const nextValue = normalizeText(incomingValue);
  const existingValue = normalizeText(currentValue);

  if (!nextValue) {
    return {
      action: 'skip_empty_patch_value',
      old_value: existingValue,
      new_value: '',
    };
  }

  if (existingValue) {
    return {
      action: 'skip_non_empty_baseline',
      old_value: existingValue,
      new_value: nextValue,
    };
  }

  return {
    action: 'ready',
    old_value: '',
    new_value: nextValue,
    target_column: targetColumn,
  };
}

function buildDiffRows(patchRows, workbookIndex, applyMode) {
  const diffRows = [];

  for (const patchRow of patchRows) {
    const detailRow = workbookIndex.detailsById.get(normalizeText(patchRow.detail_id));
    const masterRow = detailRow ? workbookIndex.mastersById.get(normalizeText(detailRow.reel_id)) : null;
    const bindingError = validateBinding(patchRow, detailRow, masterRow);

    const row = {
      experiment_id: normalizeText(patchRow.experiment_id),
      review_status: normalizeText(patchRow.review_status),
      source_type: normalizeText(patchRow.source_type),
      field_key: normalizeText(patchRow.field_key),
      detail_id: normalizeText(patchRow.detail_id),
      reel_id: normalizeText(patchRow.reel_id),
      model: normalizeText(patchRow.model),
      patch_model_year: normalizeText(patchRow.model_year),
      baseline_model_year: normalizeText(masterRow && masterRow.model_year),
      sku_patch: normalizeText(patchRow.sku),
      sku_baseline: normalizeText(detailRow && detailRow.SKU),
      binding_status: bindingError ? 'blocked_validation' : 'validated',
      reason_code: bindingError || '',
      year_scope_note: normalizeText(patchRow.year_scope_note),
      fitment_note: normalizeText(patchRow.fitment_note),
      body_material_old: normalizeText(detailRow && detailRow.body_material),
      body_material_new: '',
      body_material_action: '',
      body_material_tech_old: normalizeText(detailRow && detailRow.body_material_tech),
      body_material_tech_new: '',
      body_material_tech_action: '',
      gear_material_old: normalizeText(detailRow && detailRow.gear_material),
      gear_material_new: '',
      gear_material_action: '',
      row_status: '',
    };

    if (bindingError) {
      row.body_material_action = 'blocked_validation';
      row.body_material_tech_action = 'blocked_validation';
      row.gear_material_action = 'blocked_validation';
      row.row_status = 'blocked_validation';
      diffRows.push(row);
      continue;
    }

    if (normalizeText(patchRow.field_key) === 'body_material') {
      const materialAction = buildAction('body_material', patchRow.approved_value, detailRow.body_material);
      const techAction = buildAction('body_material_tech', patchRow.body_material_tech, detailRow.body_material_tech);

      row.body_material_new = materialAction.new_value || '';
      row.body_material_action = materialAction.action;
      row.body_material_tech_new = techAction.new_value || '';
      row.body_material_tech_action = techAction.action;

      const actions = [materialAction.action, techAction.action];
      const hasReady = actions.includes('ready');

      if (applyMode && hasReady) {
        if (materialAction.action === 'ready') detailRow.body_material = materialAction.new_value;
        if (techAction.action === 'ready') detailRow.body_material_tech = techAction.new_value;
        row.body_material_action = materialAction.action === 'ready' ? 'applied' : materialAction.action;
        row.body_material_tech_action = techAction.action === 'ready' ? 'applied' : techAction.action;
        row.row_status = 'applied';
      } else if (hasReady) {
        row.row_status = 'would_apply';
      } else {
        row.row_status = 'no_change';
      }
    } else if (normalizeText(patchRow.field_key) === 'gear_material') {
      const gearAction = buildAction('gear_material', patchRow.approved_value, detailRow.gear_material);
      row.gear_material_new = gearAction.new_value || '';
      row.gear_material_action = gearAction.action;

      if (applyMode && gearAction.action === 'ready') {
        detailRow.gear_material = gearAction.new_value;
        row.gear_material_action = 'applied';
        row.row_status = 'applied';
      } else if (gearAction.action === 'ready') {
        row.row_status = 'would_apply';
      } else {
        row.row_status = 'no_change';
      }
    } else {
      row.reason_code = 'unsupported_patch_field';
      row.row_status = 'blocked_validation';
    }

    diffRows.push(row);
  }

  return diffRows;
}

function writeWorkbookFromRows(workbookIndex, targetPath) {
  ensureDirForFile(targetPath);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(workbookIndex.masterRows, { header: workbookIndex.masterHeaders }),
    MASTER_SHEET
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(workbookIndex.detailRows, { header: workbookIndex.detailHeaders }),
    DETAIL_SHEET
  );
  XLSX.writeFile(workbook, targetPath);
}

function writeDiffReports(diffRows, paths, applyMode) {
  const summaryRows = [
    { metric: 'mode', value: applyMode ? 'apply' : 'dry-run' },
    ...summarizeRows(diffRows, 'row_status').map((row) => ({
      metric: `row_status:${row.status}`,
      value: row.count,
    })),
    ...summarizeRows(diffRows, 'reason_code').filter((row) => row.status !== '(blank)').map((row) => ({
      metric: `reason_code:${row.status}`,
      value: row.count,
    })),
  ];

  ensureDirForFile(paths.applyDiffWorkbook);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), SUMMARY_SHEET);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(diffRows), DIFF_SHEET);
  XLSX.writeFile(workbook, paths.applyDiffWorkbook);

  const md = [
    '# Shimano BC Approved Patch Apply Diff',
    '',
    `- mode: ${applyMode ? 'apply' : 'dry-run'}`,
    `- baseline_import: \`${path.relative(REPO_ROOT, paths.baselineImport)}\``,
    `- approved_patch: \`${path.relative(REPO_ROOT, paths.approvedPatch)}\``,
    applyMode
      ? `- apply_result_workbook: \`${path.relative(REPO_ROOT, paths.applyResultWorkbook)}\``
      : '- apply_result_workbook: not written in dry-run mode',
    '',
    '## Summary',
    '',
    ...summaryRows.map((row) => `- ${row.metric}: ${row.value}`),
    '',
    '## Diff Rows',
    '',
    '| detail_id | field_key | row_status | reason_code | body_material_old | body_material_new | body_material_tech_old | body_material_tech_new | gear_material_old | gear_material_new |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...diffRows.map((row) => `| ${row.detail_id} | ${row.field_key} | ${row.row_status} | ${row.reason_code || ''} | ${row.body_material_old || ''} | ${row.body_material_new || ''} | ${row.body_material_tech_old || ''} | ${row.body_material_tech_new || ''} | ${row.gear_material_old || ''} | ${row.gear_material_new || ''} |`),
    '',
  ].join('\n');

  fs.writeFileSync(paths.applyDiffMarkdown, `${md}\n`, 'utf8');
}

function run() {
  const applyMode = process.argv.includes(APPLY_FLAG);
  const paths = loadExperimentConfig();
  const patch = loadJson(paths.approvedPatch);
  const workbook = loadWorkbook(paths.baselineImport);
  const workbookIndex = buildWorkbookIndex(workbook);

  const diffRows = buildDiffRows(patch.patch_rows || [], workbookIndex, applyMode);
  writeDiffReports(diffRows, { ...paths, baselineImport: paths.baselineImport }, applyMode);

  if (applyMode) {
    writeWorkbookFromRows(workbookIndex, paths.applyResultWorkbook);
    console.log(`Saved apply result workbook to ${paths.applyResultWorkbook}`);
  }

  console.log(`Saved apply diff workbook to ${paths.applyDiffWorkbook}`);
  console.log(`Saved apply diff markdown to ${paths.applyDiffMarkdown}`);
}

run();
