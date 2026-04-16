const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_EXPERIMENT_CONFIG = path.resolve(
  __dirname,
  './config/whitelist_experiments/shimano_baitcasting_reel.json'
);
const REVIEW_SHEET = 'review_candidates';
const REASON_SHEET = 'reason_code_stats';
const PATCH_SHEET = 'approved_patch';
const DIFF_SHEET = 'dry_run_diff';

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
  const configPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : DEFAULT_EXPERIMENT_CONFIG;
  const config = loadJson(configPath);
  return {
    config,
    reviewWorkbook: resolveRepoPath(config.outputs.review_workbook),
    reviewDecisions: resolveRepoPath(config.outputs.review_decisions),
    reviewedWorkbook: resolveRepoPath(config.outputs.reviewed_workbook),
    approvedPatchJson: resolveRepoPath(config.outputs.approved_patch_json),
    dryRunDiffWorkbook: resolveRepoPath(config.outputs.dry_run_diff_workbook),
    dryRunDiffMarkdown: resolveRepoPath(config.outputs.dry_run_diff_markdown),
  };
}

function loadWorkbookRows(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath);
  return {
    workbook,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }),
  };
}

function buildDecisionMap(decisions) {
  const map = new Map();
  for (const item of decisions.decisions || []) {
    map.set(`${normalizeText(item.reel_id)}::${normalizeText(item.field_key)}`, item);
  }
  return map;
}

function applyReviewDecisions(reviewRows, decisionMap) {
  return reviewRows.map((row) => {
    const key = `${normalizeText(row.reel_id)}::${normalizeText(row.field_key)}`;
    const decision = decisionMap.get(key);
    if (!decision) return { ...row };

    return {
      ...row,
      model_year: normalizeText(row.model_year) || normalizeText(decision.model_year),
      year_scope_note: normalizeText(decision.year_scope_note) || normalizeText(row.year_scope_note),
      fitment_note: normalizeText(decision.fitment_note) || normalizeText(row.fitment_note),
      review_status: normalizeText(decision.review_status),
      approved_value: normalizeText(decision.approved_value) || normalizeText(row.candidate_value),
      reviewer: normalizeText(decision.reviewer),
      review_note: normalizeText(decision.review_note),
      rejected_candidate_reason: normalizeText(decision.rejected_candidate_reason),
    };
  });
}

function buildPatchRows(reviewRows, experimentId) {
  const patchRows = [];

  for (const row of reviewRows) {
    const status = normalizeText(row.review_status);
    if (!status || status === 'rejected_candidate') {
      continue;
    }

    if (status !== 'approved' && status !== 'approved_manual_override') {
      continue;
    }

    patchRows.push({
      experiment_id: experimentId,
      review_status: status,
      source_type: status === 'approved_manual_override' ? 'manual' : 'whitelist',
      field_key: normalizeText(row.field_key),
      reel_id: normalizeText(row.reel_id),
      detail_id: normalizeText(row.detail_id),
      model: normalizeText(row.model),
      model_year: normalizeText(row.model_year),
      sku: normalizeText(row.sku),
      candidate_value: normalizeText(row.candidate_value),
      approved_value: normalizeText(row.approved_value) || normalizeText(row.candidate_value),
      source_site: normalizeText(row.source_site),
      source_url: normalizeText(row.source_url),
      evidence_text: normalizeText(row.evidence_text),
      source_binding_key: [
        normalizeText(row.detail_id),
        normalizeText(row.reel_id),
        normalizeText(row.model_year),
        normalizeText(row.sku),
      ].join(' | '),
      rejected_candidate_value: status === 'approved_manual_override' ? normalizeText(row.candidate_value) : '',
      rejected_candidate_reason: status === 'approved_manual_override' ? normalizeText(row.rejected_candidate_reason) || normalizeText(row.review_note) : '',
      year_scope_note: normalizeText(row.year_scope_note),
      fitment_note: normalizeText(row.fitment_note),
      reviewer: normalizeText(row.reviewer),
      review_note: normalizeText(row.review_note),
    });
  }

  return patchRows;
}

function buildDryRunDiffRows(patchRows, reviewRows) {
  const reviewMap = new Map();
  for (const row of reviewRows) {
    reviewMap.set(`${normalizeText(row.detail_id)}::${normalizeText(row.field_key)}`, row);
  }

  return patchRows.map((patch) => {
    const review = reviewMap.get(`${patch.detail_id}::${patch.field_key}`) || {};
    return {
      reel_id: patch.reel_id,
      detail_id: patch.detail_id,
      model: patch.model,
      model_year: patch.model_year,
      sku: patch.sku,
      field_key: patch.field_key,
      old_value: normalizeText(review.current_value_before_enrichment),
      new_value: patch.approved_value,
      change_type: normalizeText(review.current_value_before_enrichment) ? 'update' : 'fill_empty',
      source_type: patch.source_type,
      candidate_value: patch.candidate_value,
      rejected_candidate_value: patch.rejected_candidate_value,
      rejected_candidate_reason: patch.rejected_candidate_reason,
      year_scope_note: patch.year_scope_note,
      fitment_note: patch.fitment_note,
    };
  });
}

function writeReviewedWorkbook(sourceWorkbook, reviewedRows, reviewedWorkbookPath) {
  ensureDirForFile(reviewedWorkbookPath);
  const workbook = XLSX.utils.book_new();
  const reasonRows = XLSX.utils.sheet_to_json(sourceWorkbook.Sheets[REASON_SHEET], { defval: '' });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reviewedRows), REVIEW_SHEET);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reasonRows), REASON_SHEET);
  XLSX.writeFile(workbook, reviewedWorkbookPath);
}

function writePatchOutputs(patchRows, diffRows, paths, experimentId) {
  ensureDirForFile(paths.approvedPatchJson);
  fs.writeFileSync(
    paths.approvedPatchJson,
    `${JSON.stringify({
      generated_at: new Date().toISOString(),
      experiment_id: experimentId,
      patch_rows: patchRows,
    }, null, 2)}\n`,
    'utf8'
  );

  ensureDirForFile(paths.dryRunDiffWorkbook);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(patchRows), PATCH_SHEET);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(diffRows), DIFF_SHEET);
  XLSX.writeFile(workbook, paths.dryRunDiffWorkbook);

  const markdown = [
    `# ${experimentId} Approved Patch Dry Run`,
    '',
    `- patch_rows: ${patchRows.length}`,
    `- manual_override_rows: ${patchRows.filter((row) => row.source_type === 'manual').length}`,
    '',
    '## Dry Run Diff',
    '',
    '| reel_id | detail_id | field_key | old_value | new_value | source_type |',
    '| --- | --- | --- | --- | --- | --- |',
    ...diffRows.map((row) => `| ${row.reel_id} | ${row.detail_id} | ${row.field_key} | ${row.old_value || '(empty)'} | ${row.new_value} | ${row.source_type} |`),
    '',
  ].join('\n');
  fs.writeFileSync(paths.dryRunDiffMarkdown, `${markdown}\n`, 'utf8');
}

function run() {
  const paths = loadExperimentConfig();
  const decisions = loadJson(paths.reviewDecisions);
  const decisionMap = buildDecisionMap(decisions);
  const { workbook, rows } = loadWorkbookRows(paths.reviewWorkbook, REVIEW_SHEET);
  const reviewedRows = applyReviewDecisions(rows, decisionMap);
  const patchRows = buildPatchRows(reviewedRows, decisions.experiment_id);
  const diffRows = buildDryRunDiffRows(patchRows, reviewedRows);

  writeReviewedWorkbook(workbook, reviewedRows, paths.reviewedWorkbook);
  writePatchOutputs(patchRows, diffRows, paths, decisions.experiment_id);

  console.log(`Saved reviewed workbook to ${paths.reviewedWorkbook}`);
  console.log(`Saved approved patch to ${paths.approvedPatchJson}`);
  console.log(`Saved dry-run diff to ${paths.dryRunDiffWorkbook}`);
}

run();
