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
    reviewedWorkbook: resolveRepoPath(config.outputs.reviewed_workbook),
    approvedPatchJson: resolveRepoPath(config.outputs.approved_patch_json),
    dryRunDiffWorkbook: resolveRepoPath(config.outputs.dry_run_diff_workbook),
    dryRunDiffMarkdown: resolveRepoPath(config.outputs.dry_run_diff_markdown),
    identityPatchJson: resolveRepoPath(config.outputs.identity_patch_json),
  };
}

function loadWorkbookRows(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath);
  return {
    workbook,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }),
  };
}

function loadIdentityPatch(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return new Map();
  }

  const patch = loadJson(filePath);
  return new Map(
    (patch.patch_rows || []).map((row) => [
      normalizeText(row.reel_id),
      {
        model_year: normalizeText(row.model_year),
        alias: normalizeText(row.alias),
        version_signature: normalizeText(row.version_signature),
      },
    ])
  );
}

function deriveBodyMaterialParts(value, existingTech) {
  const raw = normalizeText(value);
  const providedTech = normalizeText(existingTech);

  let material = raw;
  if (/magnesium|镁合金/i.test(raw)) {
    material = 'Magnesium';
  } else if (/aluminum alloy|铝合金/i.test(raw)) {
    material = 'Aluminum alloy';
  } else if (/aluminum|铝/i.test(raw)) {
    material = 'Aluminum';
  }

  if (providedTech) {
    return { material, tech: providedTech };
  }

  const techParts = [];
  const push = (text) => {
    if (text && !techParts.includes(text)) techParts.push(text);
  };

  if (/hagane/i.test(raw)) push('HAGANE 机身');
  if (/coresolid body/i.test(raw)) push('CORESOLID BODY');
  if (/一体成型/.test(raw)) push('一体成型');
  if (/fully machined|全加工/i.test(raw)) push('全加工');

  return {
    material,
    tech: techParts.join(' / '),
  };
}

function buildBodyMaterialSources(row, approvedValue, bodyMaterialTech) {
  const sourceType = normalizeText(row.source_type) || (normalizeText(row.review_status) === 'approved_manual_override' ? 'manual' : 'whitelist');
  const official_value = '';
  const official_tech = '';
  const player_value = normalizeText(approvedValue);
  const player_tech = normalizeText(bodyMaterialTech);
  const client_display_priority = 'official > player';
  const client_display_source = official_value ? 'official' : (player_value ? 'player' : '');

  return {
    body_material_official: official_value,
    body_material_tech_official: official_tech,
    body_material_player: player_value,
    body_material_tech_player: player_tech,
    client_display_priority,
    client_display_source,
    body_material_source_route: sourceType,
  };
}

function enrichReviewedRows(reviewRows, identityPatchByReelId) {
  return reviewRows.map((row) => {
    const identity = identityPatchByReelId.get(normalizeText(row.reel_id)) || {};
    const rawApproved = normalizeText(row.approved_value) || normalizeText(row.candidate_value);
    const next = {
      ...row,
      model_year: normalizeText(row.model_year) || normalizeText(identity.model_year),
      alias: normalizeText(row.alias) || normalizeText(identity.alias),
      version_signature: normalizeText(row.version_signature) || normalizeText(identity.version_signature),
      approved_value_raw: normalizeText(row.approved_value_raw) || rawApproved,
      body_material_tech: normalizeText(row.body_material_tech),
    };

    if (normalizeText(row.field_key) === 'body_material') {
      const derived = deriveBodyMaterialParts(rawApproved, next.body_material_tech);
      next.approved_value = derived.material;
      next.body_material_tech = derived.tech;
    } else {
      next.approved_value = rawApproved;
    }

    return next;
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
      alias: normalizeText(row.alias),
      version_signature: normalizeText(row.version_signature),
      sku: normalizeText(row.sku),
      candidate_value: normalizeText(row.candidate_value),
      approved_value_raw: normalizeText(row.approved_value_raw) || normalizeText(row.approved_value) || normalizeText(row.candidate_value),
      approved_value: normalizeText(row.approved_value) || normalizeText(row.candidate_value),
      body_material_tech: normalizeText(row.body_material_tech),
      ...buildBodyMaterialSources(row, normalizeText(row.approved_value) || normalizeText(row.candidate_value), normalizeText(row.body_material_tech)),
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
      alias: patch.alias,
      version_signature: patch.version_signature,
      sku: patch.sku,
      field_key: patch.field_key,
      old_value: normalizeText(review.current_value_before_enrichment),
      new_value: patch.approved_value,
      new_body_material_tech: patch.body_material_tech,
      client_display_source: patch.client_display_source,
      client_display_priority: patch.client_display_priority,
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
  const headers = [
    'field_key',
    'reel_id',
    'detail_id',
    'model',
    'model_year',
    'alias',
    'version_signature',
    'sku',
    'candidate_value',
    'source_site',
    'source_url',
    'evidence_text',
    'current_value_before_enrichment',
    'year_scope_note',
    'fitment_note',
    'review_status',
    'approved_value_raw',
    'approved_value',
    'body_material_tech',
    'reviewer',
    'review_note',
    'rejected_candidate_reason',
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reviewedRows, { header: headers }), REVIEW_SHEET);
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
    '| reel_id | detail_id | field_key | old_value | new_value | body_material_tech | client_display_source | source_type |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...diffRows.map((row) => `| ${row.reel_id} | ${row.detail_id} | ${row.field_key} | ${row.old_value || '(empty)'} | ${row.new_value} | ${row.new_body_material_tech || ''} | ${row.client_display_source || ''} | ${row.source_type} |`),
    '',
  ].join('\n');
  fs.writeFileSync(paths.dryRunDiffMarkdown, `${markdown}\n`, 'utf8');
}

function run() {
  const paths = loadExperimentConfig();
  const identityPatchByReelId = loadIdentityPatch(paths.identityPatchJson);
  const reviewSourceFile = fs.existsSync(paths.reviewedWorkbook) ? paths.reviewedWorkbook : paths.reviewWorkbook;
  const { workbook, rows } = loadWorkbookRows(reviewSourceFile, REVIEW_SHEET);
  const reviewedRows = enrichReviewedRows(rows, identityPatchByReelId);
  const patchRows = buildPatchRows(reviewedRows, paths.config.experiment_id);
  const diffRows = buildDryRunDiffRows(patchRows, reviewedRows);

  writeReviewedWorkbook(workbook, reviewedRows, paths.reviewedWorkbook);
  writePatchOutputs(patchRows, diffRows, paths, paths.config.experiment_id);

  console.log(`Saved reviewed workbook to ${paths.reviewedWorkbook}`);
  console.log(`Saved approved patch to ${paths.approvedPatchJson}`);
  console.log(`Saved dry-run diff to ${paths.dryRunDiffWorkbook}`);
}

run();
