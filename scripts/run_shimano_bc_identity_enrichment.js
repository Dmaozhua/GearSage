const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_CONFIG = path.resolve(
  __dirname,
  './config/whitelist_experiments/shimano_baitcasting_reel.json'
);
const HTTP_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
};
const REVIEW_SHEET = 'identity_review';
const SUMMARY_SHEET = 'identity_summary';
const ALIAS_SECTION_NOISE_PATTERNS = [
  /casting reels/i,
  /japantackle/i,
  /\bjdm\b/i,
  /spring trout special/i,
  /archive/i,
  /feature/i,
];
const ALIAS_TOKEN_NOISE_PATTERNS = [
  { pattern: /\bshimano\b/gi, tag: 'brand_prefix' },
  { pattern: /\bcasting reels\b/gi, tag: 'site_section' },
  { pattern: /\bjapantackle\b/gi, tag: 'site_label' },
  { pattern: /\bjdm\b/gi, tag: 'site_label' },
  { pattern: /\b\d{4}\s+spring trout special\b/gi, tag: 'campaign_label' },
];

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
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

function loadConfig() {
  const configPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : DEFAULT_CONFIG;
  const config = loadJson(configPath);
  return {
    config,
    importFile: resolveRepoPath(config.inputs.import_file),
    reportJson: resolveRepoPath(config.outputs.identity_report_json),
    reportMarkdown: resolveRepoPath(config.outputs.identity_report_markdown),
    reviewWorkbook: resolveRepoPath(config.outputs.identity_review_workbook),
    identityPatchJson: resolveRepoPath(config.outputs.identity_patch_json),
  };
}

function buildImportIndex(importFile) {
  const workbook = XLSX.readFile(importFile);
  const masters = XLSX.utils.sheet_to_json(workbook.Sheets.reel, { defval: '' });
  const details = XLSX.utils.sheet_to_json(workbook.Sheets.baitcasting_reel_detail, { defval: '' });
  const detailsByReelId = new Map();
  for (const row of details) {
    const reelId = normalizeText(row.reel_id);
    if (!detailsByReelId.has(reelId)) detailsByReelId.set(reelId, []);
    detailsByReelId.get(reelId).push(row);
  }
  return {
    mastersById: new Map(masters.map((row) => [normalizeText(row.id), row])),
    detailsByReelId,
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

function parseText(html) {
  const $ = cheerio.load(html);
  const title = normalizeText($('title').text());
  const text = normalizeText($('body').text());
  const lines = text.split(/(?<=\.)\s+|\s{2,}/).map(normalizeText).filter(Boolean);
  return { title, text, lines };
}

function deriveYearFromUrl(url) {
  const explicitYear = normalizeText(url).match(/20\d{2}/);
  if (explicitYear) return explicitYear[0];

  const shortYear = normalizeText(url).match(/(?:shimano-|shimano\/|\/)(\d{2})(?=[a-z])/i);
  if (!shortYear) return '';

  const yy = Number(shortYear[1]);
  if (!Number.isFinite(yy)) return '';
  return yy >= 70 ? `19${shortYear[1]}` : `20${shortYear[1]}`;
}

function deriveYearEvidence(parsed, url) {
  const urlYear = deriveYearFromUrl(url);
  if (urlYear) {
    return {
      value: urlYear,
      evidence: `URL token matched year: ${url}`,
      source_type: 'url_token',
    };
  }

  const titleYear = normalizeText(parsed.title).match(/\b(20\d{2})\b/)
    || normalizeText(parsed.title).match(/\b(\d{2})(?=[^\d]|$)/);
  if (titleYear) {
    const raw = titleYear[1];
    const value = raw.length === 2 ? `20${raw}` : raw;
    return {
      value,
      evidence: parsed.title,
      source_type: 'page_title',
    };
  }

  const focusedLine = (parsed.lines || []).find((line) => /shimano|japan model|ultimate finesse|monster drive|calcutta|aldebaran|metanium|antares/i.test(line));
  const yearMatch = (focusedLine && (focusedLine.match(/\b(20\d{2})\b/) || focusedLine.match(/\b(\d{2})(?=[^\d]|$)/)))
    || parsed.text.match(/(?:all new|new|for)\s+(20\d{2})/i);
  if (yearMatch) {
    const raw = yearMatch[1];
    const value = raw.length === 2 ? `20${raw}` : raw;
    return {
      value,
      evidence: focusedLine || parsed.title,
      source_type: 'page_text',
    };
  }

  return {
    value: '',
    evidence: '',
    source_type: '',
  };
}

function cleanupAliasText(value) {
  return normalizeText(
    String(value || '')
      .replace(/\s*-\s*$/g, '')
      .replace(/\s*,\s*$/g, '')
      .replace(/\s{2,}/g, ' ')
  );
}

function deriveAlias(parsed, master, model) {
  const originalTitle = normalizeText(parsed.title);
  const noiseTags = [];
  let cleaned = originalTitle;

  for (const { pattern, tag } of ALIAS_TOKEN_NOISE_PATTERNS) {
    if (pattern.test(cleaned)) {
      noiseTags.push(tag);
      cleaned = cleaned.replace(pattern, ' ');
    }
  }

  const keptSegments = cleaned
    .split(/\s+-\s+/)
    .map((segment) => cleanupAliasText(segment))
    .filter(Boolean)
    .filter((segment) => {
      const noisy = ALIAS_SECTION_NOISE_PATTERNS.some((pattern) => pattern.test(segment));
      if (noisy) noiseTags.push(`section:${segment}`);
      return !noisy;
    });

  const canonicalAlias = cleanupAliasText(
    keptSegments
      .join(' - ')
      .replace(/\b(\d{4})-\b/g, '$1')
  );

  let normalizedAlias = canonicalAlias
    .replace(/\bJapan model\s*20\d{2}\b/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\b20\d{2}\b/g, '')
    .replace(/\s*-\s*$/g, '');
  if (normalizedAlias.includes(',')) {
    normalizedAlias = normalizedAlias.split(',')[0];
  }
  normalizedAlias = cleanupAliasText(normalizedAlias);

  if (canonicalAlias && normalizedAlias && normalizedAlias.toUpperCase() !== normalizeText(model).toUpperCase()) {
    return {
      value: normalizedAlias,
      canonical_alias: canonicalAlias,
      normalized_alias: normalizedAlias,
      noise_tags: Array.from(new Set(noiseTags)).join(', '),
      evidence: originalTitle,
      source_type: 'page_title_normalized',
    };
  }

  const existingAlias = normalizeText(master.alias);
  return {
    value: existingAlias,
    canonical_alias: existingAlias,
    normalized_alias: existingAlias,
    noise_tags: '',
    evidence: existingAlias ? 'existing baseline alias' : '',
    source_type: existingAlias ? 'baseline' : '',
  };
}

function deriveVersionSignature(sample, yearCandidate, detailRows) {
  const reelId = normalizeText(sample.reel_id);
  const skuList = (detailRows || []).map((row) => normalizeText(row.SKU)).filter(Boolean);
  return {
    value: [
      normalizeText(sample.model),
      yearCandidate || 'YEAR_PENDING',
      skuList.length ? `${skuList.length} sku variants` : 'SKU_PENDING',
    ].join(' | '),
    evidence: skuList.slice(0, 3).join(' / '),
  };
}

function reasonCodeFor(fieldKey, candidateValue, sourceUrl) {
  if (!sourceUrl) return 'source_url_missing';
  if (!candidateValue) return `${fieldKey}_not_found`;
  return 'candidate_ready';
}

function buildSummary(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.field_key}::${row.reason_code}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [field_key, reason_code] = key.split('::');
    return { field_key, reason_code, count };
  });
}

function buildIdentityPatch(reviewRows, importIndex) {
  const grouped = new Map();

  for (const row of reviewRows) {
    if (row.reason_code !== 'candidate_ready') continue;
    if (!grouped.has(row.reel_id)) {
      grouped.set(row.reel_id, {
        reel_id: row.reel_id,
        model: row.model,
        source_site: row.source_site,
        source_url: row.source_url,
        model_year: '',
        alias: '',
        canonical_alias: '',
        normalized_alias: '',
        alias_noise_tags: '',
        version_signature: '',
        evidence: [],
        detail_ids: (importIndex.detailsByReelId.get(row.reel_id) || []).map((item) => normalizeText(item.id)),
      });
    }

    const next = grouped.get(row.reel_id);
    if (row.field_key === 'model_year' && !next.model_year) next.model_year = row.candidate_value;
    if (row.field_key === 'alias' && !next.alias) {
      next.alias = row.candidate_value;
      next.canonical_alias = row.canonical_alias || row.candidate_value;
      next.normalized_alias = row.normalized_alias || row.candidate_value;
      next.alias_noise_tags = row.alias_noise_tags || '';
    }
    if (row.field_key === 'version_signature' && !next.version_signature) next.version_signature = row.candidate_value;
    next.evidence.push({
      field_key: row.field_key,
      evidence_text: row.evidence_text,
    });
  }

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    identity_binding_key: `${row.reel_id} | ${row.model_year || 'YEAR_PENDING'}`,
    patch_status: row.model_year ? 'identity_ready' : 'identity_partial',
  }));
}

function renderMarkdown(report, paths) {
  const summaryTable = report.summary
    .map((row) => `| ${row.field_key} | ${row.reason_code} | ${row.count} |`)
    .join('\n');

  return [
    '# Shimano baitcasting reel identity enrichment',
    '',
    `- generated_at: ${report.generated_at}`,
    `- baseline_import: \`${path.relative(REPO_ROOT, paths.importFile)}\``,
    `- identity_patch: \`${path.relative(REPO_ROOT, paths.identityPatchJson)}\``,
    '',
    '## Summary',
    '',
    '| field_key | reason_code | count |',
    '| --- | --- | ---: |',
    summaryTable || '| - | - | 0 |',
    '',
    '## Notes',
    '',
    '- model_year is now treated as an identity enrichment target, not a manual blocker.',
    '- Downstream whitelist field enrichment should read identity_patch first and use its model_year / alias / version_signature values.',
    '- alias now distinguishes canonical_alias and normalized_alias; downstream binding should use normalized_alias.',
    '- section or campaign labels such as Spring Trout Special are treated as alias noise and removed in identity enrichment.',
    '- Current identity patch is generated from whitelist-source evidence and may still need source expansion for unresolved reels.',
    '',
  ].join('\n');
}

async function run() {
  const paths = loadConfig();
  const importIndex = buildImportIndex(paths.importFile);
  const reviewRows = [];

  for (const sample of paths.config.samples || []) {
    const master = importIndex.mastersById.get(normalizeText(sample.reel_id));
    if (!master) continue;

    const html = sample.source_url ? await fetchPage(sample.source_url) : '';
    const parsed = html ? parseText(html) : { title: '', text: '', lines: [] };
    const yearCandidate = deriveYearEvidence(parsed, sample.source_url);
    const aliasCandidate = deriveAlias(parsed, master, sample.model);
    const versionCandidate = deriveVersionSignature(sample, yearCandidate.value, importIndex.detailsByReelId.get(normalizeText(sample.reel_id)));

    const base = {
      reel_id: normalizeText(sample.reel_id),
      model: normalizeText(sample.model),
      source_site: normalizeText(sample.source_id),
      source_url: normalizeText(sample.source_url),
      baseline_model_year: normalizeText(master.model_year),
      baseline_alias: normalizeText(master.alias),
    };

    reviewRows.push({
      ...base,
      field_key: 'model_year',
      candidate_value: normalizeText(yearCandidate.value),
      evidence_text: normalizeText(yearCandidate.evidence),
      review_status: '',
      approved_value: '',
      review_note: '',
      reason_code: reasonCodeFor('model_year', yearCandidate.value, sample.source_url),
    });

    reviewRows.push({
      ...base,
      field_key: 'alias',
      candidate_value: normalizeText(aliasCandidate.value),
      canonical_alias: normalizeText(aliasCandidate.canonical_alias),
      normalized_alias: normalizeText(aliasCandidate.normalized_alias),
      alias_noise_tags: normalizeText(aliasCandidate.noise_tags),
      alias_normalization_rule: 'strip site and section labels, drop campaign suffixes, keep cleaned source phrase as canonical alias, then derive normalized alias for binding',
      evidence_text: normalizeText(aliasCandidate.evidence),
      review_status: '',
      approved_value: '',
      review_note: '',
      reason_code: reasonCodeFor('alias', aliasCandidate.value, sample.source_url),
    });

    reviewRows.push({
      ...base,
      field_key: 'version_signature',
      candidate_value: normalizeText(versionCandidate.value),
      evidence_text: normalizeText(versionCandidate.evidence),
      review_status: '',
      approved_value: '',
      review_note: '',
      reason_code: reasonCodeFor('version_signature', versionCandidate.value, sample.source_url),
    });
  }

  const summary = buildSummary(reviewRows);
  const identityPatch = buildIdentityPatch(reviewRows, importIndex);
  const report = {
    generated_at: new Date().toISOString(),
    experiment_id: `${paths.config.experiment_id}_identity`,
    review_rows: reviewRows,
    identity_patch: identityPatch,
    summary,
  };

  ensureDirForFile(paths.reportJson);
  fs.writeFileSync(paths.reportJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  ensureDirForFile(paths.reviewWorkbook);
  const reviewWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(reviewWb, XLSX.utils.json_to_sheet(reviewRows), REVIEW_SHEET);
  XLSX.utils.book_append_sheet(reviewWb, XLSX.utils.json_to_sheet(summary), SUMMARY_SHEET);
  XLSX.writeFile(reviewWb, paths.reviewWorkbook);
  ensureDirForFile(paths.identityPatchJson);
  fs.writeFileSync(paths.identityPatchJson, `${JSON.stringify({ generated_at: report.generated_at, patch_rows: identityPatch }, null, 2)}\n`, 'utf8');
  ensureDirForFile(paths.reportMarkdown);
  fs.writeFileSync(paths.reportMarkdown, `${renderMarkdown(report, paths)}\n`, 'utf8');

  console.log(`Saved identity report to ${paths.reportJson}`);
  console.log(`Saved identity review workbook to ${paths.reviewWorkbook}`);
  console.log(`Saved identity patch to ${paths.identityPatchJson}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
