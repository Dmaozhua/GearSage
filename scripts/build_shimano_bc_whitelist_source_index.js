const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import.xlsx');
const OUTPUT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_whitelist_source_index.json');
const TMP_OUTPUT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_whitelist_source_index.partial.json');
const urlCache = new Map();
const LIMIT = Number.parseInt(process.env.GS_SHIMANO_WHITELIST_INDEX_LIMIT || '', 10);

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function fetchUrl(url) {
  if (urlCache.has(url)) return urlCache.get(url);
  const html = execFileSync('curl', ['-s', '-k', '-L', '-A', 'Mozilla/5.0', url], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  urlCache.set(url, html);
  return html;
}

function findAll(text, pattern) {
  return [...text.matchAll(pattern)];
}

function searchJapanTackle(query) {
  const q = normalizeText(query);
  if (!q) return [];
  const url = `https://japantackle.com/catalogsearch/result/?q=${encodeURIComponent(q)}&cat=28`;
  const html = fetchUrl(url);
  const matches = findAll(
    html,
    /<h2 class="product-name">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/gi
  );
  return matches.map((m) => ({
    site: 'japantackle',
    search_query: q,
    url: m[1],
    title: normalizeText(m[2].replace(/<[^>]+>/g, ' ')),
  }));
}

function searchHedgehog(query) {
  const q = normalizeText(query);
  if (!q) return [];
  const url = `https://www.hedgehog-studio.co.jp/product-list?keyword=${encodeURIComponent(q)}`;
  const html = fetchUrl(url);
  const links = findAll(
    html,
    /href="(https:\/\/www\.hedgehog-studio\.co\.jp\/product-list\/\d+)"[^>]*>[\s\S]*?<span class="item_name">([\s\S]*?)<\/span>/gi
  );
  const rows = links.map((m) => ({
    site: 'hedgehog_studio',
    search_query: q,
    url: m[1],
    title: normalizeText(m[2].replace(/<[^>]+>/g, ' ')),
  }));
  const dedup = [];
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.url)) continue;
    seen.add(row.url);
    dedup.push(row);
  }
  return dedup;
}

function buildQueries(row) {
  const queries = [];
  const push = (value) => {
    const text = normalizeText(value);
    if (text && !queries.includes(text)) queries.push(text);
  };

  push(row.alias);
  push(row.model);
  const alias = normalizeText(row.alias);
  const model = normalizeText(row.model);
  if (alias) {
    push(alias.replace(/^\d{2}\s+/, ''));
  }
  if (model) {
    push(model.replace(/（.*?）/g, '').trim());
  }
  return queries.slice(0, 3);
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const masters = XLSX.utils.sheet_to_json(wb.Sheets.reel, { defval: '' });
  const scopedMasters = Number.isFinite(LIMIT) && LIMIT > 0 ? masters.slice(0, LIMIT) : masters;
  const rows = [];

  for (let index = 0; index < scopedMasters.length; index += 1) {
    const master = scopedMasters[index];
    const queries = buildQueries(master);
    const candidates = [];
    for (const q of queries) {
      for (const item of searchJapanTackle(q)) candidates.push(item);
      for (const item of searchHedgehog(q)) candidates.push(item);
    }
    rows.push({
      reel_id: normalizeText(master.id),
      model: normalizeText(master.model),
      alias: normalizeText(master.alias),
      queries,
      candidates,
    });
    fs.writeFileSync(TMP_OUTPUT_FILE, JSON.stringify(rows, null, 2), 'utf8');
    if ((index + 1) % 5 === 0) {
      console.log(`indexed ${index + 1}/${scopedMasters.length}`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`whitelist source index -> ${OUTPUT_FILE}`);
}

main();
