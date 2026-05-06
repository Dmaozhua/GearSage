const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('./node_modules/xlsx');
const gearDataPaths = require('./gear_data_paths');

const ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = gearDataPaths.resolveDataRaw('evergreen_rod_import.xlsx');
const OUT_FILE = gearDataPaths.resolveDataRaw('evergreen_rod_whitelist_player_evidence.json');

const COLLECTION_URLS = [
  'https://store.plus-fishing.com/collections/freshwater-rods/products.json?limit=250',
  'https://store.plus-fishing.com/collections/saltwater-rods/products.json?limit=250',
];

const HTTP_CONFIG = {
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
};

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value) {
  return n(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeSku(value) {
  return n(value)
    .toUpperCase()
    .replace(/\+/g, 'PLUS')
    .replace(/\bPLUS\b/g, 'PLUS')
    .replace(/[^A-Z0-9]/g, '');
}

function htmlToText(html) {
  return cheerio
    .load(`<div>${html || ''}</div>`)('div')
    .text()
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson(url) {
  const { data } = await axios.get(url, HTTP_CONFIG);
  return data;
}

function importIndex() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const rodById = new Map(rods.map((row) => [n(row.id), row]));
  const bySku = new Map();
  const byCodeName = new Map();

  for (const row of details) {
    const master = rodById.get(n(row.rod_id)) || {};
    const hit = { row, master };
    bySku.set(normalizeSku(row.SKU), hit);
    byCodeName.set(normalizeKey(row['Code Name']), hit);
  }

  return { rods, details, bySku, byCodeName };
}

function extractModelCode(text) {
  const value = n(text);
  const match = value.match(/\b([A-Z]{2,6}[\s-]?\d[A-Z0-9/+.\-<>]*)(?:\s+(EX|AGS|UFT|GRT))?(?=\s|[-–|]|$)/i);
  if (!match) return '';
  return `${match[1]}${match[2] ? `-${match[2]}` : ''}`;
}

function titleCodeName(title) {
  const text = n(title)
    .replace(/^[A-Z]{2,6}[\s-]?\d[\w/+.\-<>]*\s*[-–|]?\s*/i, '')
    .replace(/^The\s+/i, '')
    .trim();
  return text || title;
}

function parseModelDescriptions(bodyHtml) {
  const $ = cheerio.load(bodyHtml || '');
  const entries = [];
  $('p').each((_, p) => {
    const strong = n($(p).find('strong').first().text()).replace(/^The\s+/i, '');
    const text = n($(p).text());
    if (!strong || text.length < 30) return;
    entries.push({
      key: normalizeKey(strong),
      label: strong,
      text,
    });
  });
  return entries;
}

function parseSpecRows(bodyHtml) {
  const $ = cheerio.load(bodyHtml || '');
  const rows = [];
  $('table').each((_, table) => {
    const headers = $(table)
      .find('tr')
      .first()
      .find('th,td')
      .map((__, cell) => n($(cell).text()))
      .get();
    if (!headers.some((h) => /^model$/i.test(h))) return;
    $(table)
      .find('tr')
      .slice(1)
      .each((__, tr) => {
        const cells = $(tr)
          .find('th,td')
          .map((___, cell) => n($(cell).text()))
          .get();
        if (!cells.length) return;
        const item = {};
        headers.forEach((header, idx) => {
          item[header] = cells[idx] || '';
        });
        if (item.Model) rows.push(item);
      });
  });
  return rows;
}

function matchHit(index, sourceText) {
  const code = extractModelCode(sourceText);
  const codeKey = normalizeSku(code);
  if (codeKey && index.bySku.has(codeKey)) return { hit: index.bySku.get(codeKey), match_rule: 'source_model_code_exact', source_model_code: code };

  const key = normalizeKey(titleCodeName(sourceText));
  if (key && index.byCodeName.has(key)) return { hit: index.byCodeName.get(key), match_rule: 'code_name_exact', source_model_code: code };

  for (const [skuKey, hit] of index.bySku.entries()) {
    if (skuKey && normalizeSku(sourceText).includes(skuKey)) return { hit, match_rule: 'source_text_contains_sku', source_model_code: n(hit.row.SKU) };
  }
  return { hit: null, match_rule: '', source_model_code: code };
}

function matchDescription(descriptions, row) {
  const codeNameKey = normalizeKey(row['Code Name']);
  const skuKey = normalizeSku(row.SKU);
  return (
    descriptions.find((item) => item.key === codeNameKey) ||
    descriptions.find((item) => item.key && codeNameKey.includes(item.key)) ||
    descriptions.find((item) => normalizeSku(item.text).includes(skuKey)) ||
    null
  );
}

async function collectProducts() {
  const byHandle = new Map();
  for (const url of COLLECTION_URLS) {
    const data = await fetchJson(url);
    for (const product of data.products || []) {
      if (n(product.vendor).toLowerCase() !== 'evergreen') continue;
      byHandle.set(product.handle, {
        handle: product.handle,
        title: product.title,
        collection_url: url,
      });
    }
  }
  return [...byHandle.values()].sort((a, b) => a.handle.localeCompare(b.handle));
}

function supportedFields(spec, desc) {
  const fields = ['player_environment', 'player_positioning', 'player_selling_points'];
  if (spec && Object.keys(spec).length) {
    fields.push('TYPE', 'POWER', 'TOTAL LENGTH', 'LURE WEIGHT', 'Line Wt N F', 'CONTENT CARBON');
  }
  if (desc) fields.push('Description');
  return [...new Set(fields)];
}

async function main() {
  const index = importIndex();
  const products = await collectProducts();
  const evidence = [];
  const sourceSummaries = [];

  for (const productRef of products) {
    const sourceUrl = `https://store.plus-fishing.com/products/${productRef.handle}`;
    const jsonUrl = `${sourceUrl}.json`;
    let product = null;
    try {
      product = (await fetchJson(jsonUrl)).product;
    } catch (error) {
      sourceSummaries.push({
        source_site: 'store.plus-fishing.com',
        source_url: sourceUrl,
        handle: productRef.handle,
        status: 'fetch_failed',
        error: String(error.message || error),
      });
      continue;
    }

    const descriptions = parseModelDescriptions(product.body_html);
    const specRows = parseSpecRows(product.body_html);
    const specBySku = new Map();
    specRows.forEach((row) => {
      const code = extractModelCode(row.Model || '');
      if (code) specBySku.set(normalizeSku(code), row);
    });

    let matched = 0;
    for (const variant of product.variants || []) {
      const sourceText = [variant.title, variant.option1].map(n).filter(Boolean).join(' ');
      const { hit, match_rule, source_model_code } = matchHit(index, sourceText);
      if (!hit) continue;
      const spec = specBySku.get(normalizeSku(source_model_code)) || {};
      const desc = matchDescription(descriptions, hit.row);
      evidence.push({
        scope: 'rod_detail',
        id: n(hit.row.id),
        rod_id: n(hit.row.rod_id),
        model: n(hit.master.model),
        sku: n(hit.row.SKU),
        code_name: n(hit.row['Code Name']),
        confidence: 'high',
        evidence_type: 'whitelist_retail_product_variant',
        source_site: 'store.plus-fishing.com',
        source_url: sourceUrl,
        source_product: n(product.title),
        source_handle: n(product.handle),
        source_model: n(sourceText),
        source_model_code: n(source_model_code),
        source_jan_or_retail_sku: n(variant.sku),
        match_rule,
        source_description: desc ? desc.text : '',
        source_specs: spec,
        supported_fields: supportedFields(spec, desc),
        do_not_apply_fields: ['official_environment', 'AdminCode'],
      });
      matched += 1;
    }

    sourceSummaries.push({
      source_site: 'store.plus-fishing.com',
      source_url: sourceUrl,
      handle: product.handle,
      title: product.title,
      status: 'ok',
      variants: product.variants?.length || 0,
      parsed_spec_rows: specRows.length,
      parsed_model_descriptions: descriptions.length,
      matched_details: matched,
    });
  }

  const unique = [];
  const seen = new Set();
  for (const item of evidence) {
    const key = [item.id, item.source_site, item.source_handle, normalizeSku(item.source_model_code)].join('\u0000');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  const output = {
    generated_at: new Date().toISOString(),
    import_file: path.relative(ROOT, IMPORT_FILE),
    policy: {
      source_boundary: 'Evergreen official site remains primary. Plus Fishing is used as whitelist retail/player context for player-facing fields and exact SKU/model evidence only.',
      match_rule: 'Exact normalized SKU/model-code or exact Code Name match; no fuzzy title-only writes.',
      write_rule: 'This collector writes sidecar evidence only. Field application is handled by the dedicated apply script.',
    },
    source_summaries: sourceSummaries,
    evidence: unique.sort((a, b) => n(a.id).localeCompare(n(b.id)) || n(a.source_handle).localeCompare(n(b.source_handle))),
  };

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  const byHandle = unique.reduce((acc, item) => {
    acc[item.source_handle] = (acc[item.source_handle] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({
    out_file: path.relative(ROOT, OUT_FILE),
    source_count: sourceSummaries.length,
    evidence_count: unique.length,
    matched_handles: Object.keys(byHandle).length,
    by_handle: byHandle,
  }, null, 2));
}

main().catch((error) => {
  console.error('[collect_evergreen_rod_whitelist_evidence_stage3] fatal:', error);
  process.exit(1);
});
