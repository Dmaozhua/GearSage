const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_EXPERIMENT_CONFIG = path.resolve(
  __dirname,
  './config/whitelist_experiments/shimano_baitcasting_reel.json'
);
const WHITELIST_FILE = path.resolve(__dirname, './config/gear_source_whitelist.json');
const STRATEGY_FILE = path.resolve(__dirname, './config/gear_field_strategy.json');

const REVIEW_SHEET = 'review_candidates';
const REASON_SHEET = 'reason_code_stats';
const HTTP_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeModelKey(value) {
  return normalizeText(value).toUpperCase();
}

function ensureDirForFile(filePath) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function resolveRepoPath(relativePath) {
  return path.resolve(REPO_ROOT, relativePath);
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
    configPath,
    config,
    importFile: resolveRepoPath(config.inputs.import_file),
    jsonReport: resolveRepoPath(config.outputs.json_report),
    markdownReport: resolveRepoPath(config.outputs.markdown_report),
    reviewWorkbook: resolveRepoPath(config.outputs.review_workbook),
  };
}

function compileVocabulary(config) {
  const fieldMap = new Map();
  for (const item of config.target_fields || []) {
    fieldMap.set(item.field_key, {
      field_key: item.field_key,
      patterns: (item.vocabulary || []).map((pattern) => new RegExp(pattern, 'i')),
    });
  }
  return fieldMap;
}

function loadImportWorkbook(importFile) {
  return XLSX.readFile(importFile);
}

function buildImportIndex(importFile) {
  const workbook = loadImportWorkbook(importFile);
  const masterRows = XLSX.utils.sheet_to_json(workbook.Sheets.reel, { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(workbook.Sheets.baitcasting_reel_detail, { defval: '' });

  const mastersByModel = new Map();
  const mastersById = new Map();
  for (const row of masterRows) {
    const modelKey = normalizeModelKey(row.model);
    if (modelKey) mastersByModel.set(modelKey, row);
    if (normalizeText(row.id)) mastersById.set(normalizeText(row.id), row);
  }

  const detailsByModel = new Map();
  for (const row of detailRows) {
    const master = mastersById.get(normalizeText(row.reel_id));
    const modelKey = normalizeModelKey(master && master.model);
    if (!modelKey) continue;
    if (!detailsByModel.has(modelKey)) detailsByModel.set(modelKey, []);
    detailsByModel.get(modelKey).push(row);
  }

  return {
    masterRows,
    detailRows,
    mastersByModel,
    mastersById,
    detailsByModel,
  };
}

async function fetchPage(url) {
  const response = await axios.get(url, {
    timeout: 30000,
    headers: HTTP_HEADERS,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
  });
  return response.data;
}

function collectTextLines(html) {
  const $ = cheerio.load(html);
  const main = $('body').text();
  return main
    .split('\n')
    .map((line) => normalizeText(line))
    .filter(Boolean);
}

function findFirstMatch(lines, patterns) {
  for (const line of lines) {
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        const match = line.match(pattern);
        return {
          value: normalizeText(match ? match[0] : line),
          evidence_text: line,
        };
      }
    }
  }
  return null;
}

function getSourceInfo(whitelist, sourceId) {
  return whitelist.sources.find((item) => item.id === sourceId) || null;
}

function buildProposals(lines, fieldVocabulary) {
  const proposals = {};
  for (const [fieldKey, config] of fieldVocabulary.entries()) {
    const match = findFirstMatch(lines, config.patterns);
    proposals[fieldKey] = match
      ? {
          value: match.value,
          evidence_text: match.evidence_text,
          status: 'candidate',
        }
      : {
          value: '',
          evidence_text: '',
          status: 'not_found',
        };
  }
  return proposals;
}

function buildSampleResults(experimentConfig, importIndex, whitelist, fieldVocabulary) {
  const samples = [];
  for (const sample of experimentConfig.samples || []) {
    const modelKey = normalizeModelKey(sample.model);
    const master = sample.reel_id
      ? importIndex.mastersById.get(normalizeText(sample.reel_id))
      : importIndex.mastersByModel.get(modelKey);
    if (!master) {
      throw new Error(`Missing import master row for ${sample.model}`);
    }
    const reelId = normalizeText(master.id);
    const details = importIndex.detailsByModel.get(modelKey) || [];
    samples.push({
      model: normalizeText(sample.model),
      model_key: modelKey,
      reel_id: reelId,
      master_id: reelId,
      model_year: normalizeText(sample.model_year) || normalizeText(master.model_year),
      year_scope_note: normalizeText(sample.year_scope_note),
      source_id: sample.source_id,
      source_site: (getSourceInfo(whitelist, sample.source_id) || {}).name || sample.source_id,
      source_url: sample.source_url,
      current_import_snapshot: {
        detail_count: details.length,
        existing_body_material_count: details.filter((row) => normalizeText(row.body_material)).length,
        existing_gear_material_count: details.filter((row) => normalizeText(row.gear_material)).length,
        official_reference_price: normalizeText(master.official_reference_price),
        description: normalizeText(master.Description).slice(0, 240),
      },
    });
  }
  return samples;
}

async function enrichSampleResults(samples, fieldVocabulary) {
  for (const sample of samples) {
    const html = await fetchPage(sample.source_url);
    const lines = collectTextLines(html);
    sample.proposals = buildProposals(lines, fieldVocabulary);
  }
}

function reasonCodeFor(fieldKey, detailRow, sample) {
  if (normalizeText(detailRow[fieldKey])) {
    return 'existing_value_present';
  }
  if (!sample) {
    return 'model_not_in_experiment_scope';
  }
  const proposal = sample.proposals[fieldKey];
  if (!proposal) {
    return 'field_not_configured';
  }
  if (proposal.status !== 'candidate') {
    return 'candidate_not_found_in_source';
  }
  return 'candidate_ready';
}

function buildFieldOutcomes(experimentConfig, strategy, importIndex, samplesByModel) {
  const targetFields = (experimentConfig.target_fields || []).map((item) => item.field_key);
  const outcomes = [];
  const reviewRows = [];

  for (const detailRow of importIndex.detailRows) {
    const master = importIndex.mastersById
      ? importIndex.mastersById.get(normalizeText(detailRow.reel_id))
      : null;
    const model = normalizeText(master && master.model);
    const modelKey = normalizeModelKey(model);
    const sample = samplesByModel.get(modelKey) || null;

    for (const fieldKey of targetFields) {
      const fieldStrategy = (((strategy.categories || {}).reel || {}).fields || {})[fieldKey] || {};
      const reasonCode = reasonCodeFor(fieldKey, detailRow, sample);
      const proposal = sample && sample.proposals ? sample.proposals[fieldKey] : null;

      const outcome = {
        field_key: fieldKey,
        reel_id: normalizeText(detailRow.reel_id),
        detail_id: normalizeText(detailRow.id),
        model,
        model_year: sample ? normalizeText(sample.model_year) : '',
        sku: normalizeText(detailRow.SKU),
        write_to_import: Boolean(fieldStrategy.write_to_import),
        current_value_before_enrichment: normalizeText(detailRow[fieldKey]),
        reason_code: reasonCode,
        source_id: sample ? sample.source_id : '',
        source_site: sample ? sample.source_site : '',
        source_url: sample ? sample.source_url : '',
        candidate_value: proposal ? normalizeText(proposal.value) : '',
        evidence_text: proposal ? normalizeText(proposal.evidence_text) : '',
      };

      outcomes.push(outcome);

      if (reasonCode === 'candidate_ready') {
        reviewRows.push({
          field_key: fieldKey,
          reel_id: outcome.reel_id,
          detail_id: outcome.detail_id,
          model: outcome.model,
          model_year: outcome.model_year,
          sku: outcome.sku,
          candidate_value: outcome.candidate_value,
          source_site: outcome.source_site,
          source_url: outcome.source_url,
          evidence_text: outcome.evidence_text,
          current_value_before_enrichment: outcome.current_value_before_enrichment,
          year_scope_note: sample ? normalizeText(sample.year_scope_note) : '',
          fitment_note: '',
          review_status: '',
          approved_value: '',
          reviewer: '',
          review_note: '',
          rejected_candidate_reason: '',
        });
      }
    }
  }

  return { outcomes, reviewRows };
}

function summarizeReasonCodes(outcomes) {
  const stats = [];
  const grouped = new Map();

  for (const outcome of outcomes) {
    const key = `${outcome.field_key}::${outcome.reason_code}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        field_key: outcome.field_key,
        reason_code: outcome.reason_code,
        count: 0,
      });
    }
    grouped.get(key).count += 1;
  }

  for (const row of grouped.values()) {
    stats.push(row);
  }

  return stats.sort((a, b) => {
    if (a.field_key !== b.field_key) return a.field_key.localeCompare(b.field_key);
    return a.reason_code.localeCompare(b.reason_code);
  });
}

function buildSummaryCounts(reviewRows, reasonStats) {
  const writtenByField = new Map();
  for (const row of reviewRows) {
    writtenByField.set(row.field_key, (writtenByField.get(row.field_key) || 0) + 1);
  }

  const notWrittenByField = {};
  for (const row of reasonStats) {
    if (row.reason_code === 'candidate_ready') continue;
    if (!notWrittenByField[row.field_key]) notWrittenByField[row.field_key] = {};
    notWrittenByField[row.field_key][row.reason_code] = row.count;
  }

  return {
    candidate_rows_by_field: Object.fromEntries(writtenByField),
    reason_code_not_written: notWrittenByField,
  };
}

function writeReviewWorkbook(reviewWorkbookPath, reviewRows, reasonStats) {
  ensureDirForFile(reviewWorkbookPath);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(reviewRows),
    REVIEW_SHEET
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(reasonStats),
    REASON_SHEET
  );
  XLSX.writeFile(workbook, reviewWorkbookPath);
}

function renderMarkdownSummary(result, paths) {
  const reviewCountText = result.review_rows.reduce((acc, row) => {
    acc[row.field_key] = (acc[row.field_key] || 0) + 1;
    return acc;
  }, {});

  const reasonRows = result.reason_code_stats
    .filter((row) => row.reason_code !== 'candidate_ready')
    .map((row) => `| ${row.field_key} | ${row.reason_code} | ${row.count} |`)
    .join('\n');

  return [
    `# ${result.experiment} Review Summary`,
    '',
    `- generated_at: ${result.generated_at}`,
    `- import_baseline: \`${path.relative(REPO_ROOT, paths.importFile)}\``,
    `- json_report: \`${path.relative(REPO_ROOT, paths.jsonReport)}\``,
    `- review_workbook: \`${path.relative(REPO_ROOT, paths.reviewWorkbook)}\``,
    '',
    '## Candidate Rows',
    '',
    `- body_material: ${reviewCountText.body_material || 0}`,
    `- gear_material: ${reviewCountText.gear_material || 0}`,
    '',
    '## Reason Code Stats',
    '',
    '| field_key | reason_code | count |',
    '| --- | --- | ---: |',
    reasonRows || '| - | - | 0 |',
    '',
    '## Manual Review',
    '',
    '1. Open the review workbook and work in the `review_candidates` sheet.',
    '2. Check `candidate_value`, `source_url`, and `evidence_text` against the source page.',
    '3. Fill `review_status` with the final decision, then fill `approved_value` / `reviewer` / `review_note` if needed.',
    '4. Only after review is complete should enrichment be enabled in the export step.',
    '',
  ].join('\n');
}

async function run() {
  const experiment = loadExperimentConfig();
  const whitelist = loadJson(WHITELIST_FILE);
  const strategy = loadJson(STRATEGY_FILE);
  const experimentConfig = experiment.config;
  const fieldVocabulary = compileVocabulary(experimentConfig);
  const importIndex = buildImportIndex(experiment.importFile);

  const samples = buildSampleResults(experimentConfig, importIndex, whitelist, fieldVocabulary);
  await enrichSampleResults(samples, fieldVocabulary);

  const samplesByModel = new Map(samples.map((item) => [item.model_key, item]));
  const { outcomes, reviewRows } = buildFieldOutcomes(experimentConfig, strategy, importIndex, samplesByModel);
  const reasonStats = summarizeReasonCodes(outcomes);

  const result = {
    generated_at: new Date().toISOString(),
    experiment: experimentConfig.experiment_id,
    scope: {
      brand: experimentConfig.brand,
      category: experimentConfig.category,
      subtype: experimentConfig.subtype,
      target_fields: (experimentConfig.target_fields || []).map((item) => item.field_key),
      baseline_import_file: path.relative(REPO_ROOT, experiment.importFile),
      whitelist_sources: whitelist.sources
        .filter((item) => item.enabled)
        .map((item) => ({ id: item.id, role: item.role, domains: item.domains })),
    },
    samples,
    review_rows: reviewRows,
    reason_code_stats: reasonStats,
    summary: buildSummaryCounts(reviewRows, reasonStats),
  };

  ensureDirForFile(experiment.jsonReport);
  fs.writeFileSync(experiment.jsonReport, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeReviewWorkbook(experiment.reviewWorkbook, reviewRows, reasonStats);
  ensureDirForFile(experiment.markdownReport);
  fs.writeFileSync(
    experiment.markdownReport,
    `${renderMarkdownSummary(result, { ...experiment, importFile: experiment.importFile })}\n`,
    'utf8'
  );

  console.log(`Saved experiment result to ${experiment.jsonReport}`);
  console.log(`Saved review workbook to ${experiment.reviewWorkbook}`);
  console.log(`Saved markdown summary to ${experiment.markdownReport}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
