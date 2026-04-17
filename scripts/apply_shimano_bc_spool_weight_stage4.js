const XLSX = require('xlsx');
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');

const IMPORT_FILE = 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx';
const HIGHLIGHT_PAYLOAD = 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_highlights.json';
const HIGHLIGHT_HELPER = 'scripts/patch_xlsx_highlights.py';
const PAGE_CACHE = new Map();

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function fetchUrl(url) {
  if (PAGE_CACHE.has(url)) return PAGE_CACHE.get(url);
  const html = execFileSync('curl', ['-s', '-k', '-L', '-A', 'Mozilla/5.0', url], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  PAGE_CACHE.set(url, html);
  return html;
}

function buildQueries(master) {
  const out = [];
  const push = (v) => {
    const t = normalizeText(v);
    if (t && !out.includes(t)) out.push(t);
  };
  push(master.alias);
  push(master.model);
  const alias = normalizeText(master.alias);
  if (alias) push(alias.replace(/^\d{2}\s+/, ''));
  return out.slice(0, 2);
}

function searchHedgehogPhone(query) {
  const q = normalizeText(query);
  if (!q) return [];
  const url = `https://www.hedgehog-studio.co.jp/phone/product-list?keyword=${encodeURIComponent(q)}`;
  const html = fetchUrl(url);
  const matches = [...html.matchAll(/<a href="(https:\/\/www\.hedgehog-studio\.co\.jp\/phone\/product\/\d+)" class="item_data_link">[\s\S]*?<span class="goods_name">([\s\S]*?)<\/span>/gi)];
  const rows = [];
  const seen = new Set();
  for (const m of matches) {
    const title = normalizeText(m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' '));
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    rows.push({ url: m[1], title });
  }
  return rows;
}

function buildTokens(master) {
  const raw = [master.model, master.alias]
    .map(normalizeText)
    .join(' ')
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(/\b\d{2}\b/g, ' ')
    .replace(/[（(].*?[）)]/g, ' ')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toUpperCase();
  const generic = new Set(['DC', 'MD', 'HG', 'XG', 'PG', 'R', 'L', 'RIGHT', 'LEFT', 'F', 'CUSTOM', 'EDITION', 'LIMITED']);
  const specialShort = new Set(['BFS', 'MGL', 'LD', 'CT', 'FT', 'XT', 'SS', 'SW']);
  return [...new Set(raw.split(/\s+/).filter((t) => ((t.length >= 4) || specialShort.has(t)) && !generic.has(t)))];
}

function relevantSpoolCandidates(master) {
  const tokens = buildTokens(master);
  const candidates = [];
  for (const q of buildQueries(master)) {
    for (const c of searchHedgehogPhone(q)) candidates.push(c);
  }
  const seen = new Set();
  return candidates.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    const upper = c.title.toUpperCase();
    if (!/SPOOL/i.test(upper)) return false;
    if (!tokens.every((t) => upper.includes(t))) return false;
    return true;
  });
}

function extractGenuineSpoolWeightFromPage(html) {
  const clean = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

  const patterns = [
    /genuine spool[^0-9]{0,80}?(\d+(?:\.\d+)?)\s*[gｇ]/i,
    /stock spool[^0-9]{0,80}?(\d+(?:\.\d+)?)\s*[gｇ]/i,
    /weight of genuine spool[^0-9]{0,40}?(\d+(?:\.\d+)?)\s*[gｇ]/i,
  ];

  for (const p of patterns) {
    const m = clean.match(p);
    if (m) return m[1];
  }
  return '';
}

function encodeColumn(index) {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const masterRows = XLSX.utils.sheet_to_json(wb.Sheets['reel'], { defval: '' });
  const detailHeaders = XLSX.utils.sheet_to_json(wb.Sheets['baitcasting_reel_detail'], { header: 1, defval: '' })[0] || [];
  const detailRows = XLSX.utils.sheet_to_json(wb.Sheets['baitcasting_reel_detail'], { defval: '' });
  const masterById = new Map(masterRows.map((r) => [normalizeText(r.id), r]));
  const touchedRefs = [];
  const updates = [];

  const groups = new Map();
  for (const row of detailRows) {
    const key = normalizeText(row.reel_id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  for (const [reelId, rows] of groups) {
    if (rows.some((r) => normalizeText(r.spool_weight_g))) continue;
    const master = masterById.get(reelId);
    if (!master) continue;
    const candidates = relevantSpoolCandidates(master);
    if (!candidates.length) continue;

    let weight = '';
    let sourceUrl = '';
    let sourceTitle = '';
    for (const c of candidates) {
      const html = fetchUrl(c.url);
      const found = extractGenuineSpoolWeightFromPage(html);
      if (found) {
        weight = found;
        sourceUrl = c.url;
        sourceTitle = c.title;
        break;
      }
    }
    if (!weight) continue;

    let changed = 0;
    rows.forEach((row) => {
      if (normalizeText(row.spool_weight_g)) return;
      row.spool_weight_g = weight;
      const rowIndex = detailRows.findIndex((x) => x.id === row.id);
      const colIndex = detailHeaders.indexOf('spool_weight_g');
      if (colIndex !== -1) touchedRefs.push(`${encodeColumn(colIndex)}${rowIndex + 2}`);
      changed += 1;
    });

    if (changed) {
      updates.push({ reel_id: reelId, model: master.model, spool_weight_g: weight, source_url: sourceUrl, source_title: sourceTitle, changed });
    }
  }

  wb.Sheets['baitcasting_reel_detail'] = XLSX.utils.json_to_sheet(detailRows, { header: detailHeaders });
  XLSX.writeFile(wb, IMPORT_FILE);

  let payload = { sheets: [] };
  if (fs.existsSync(HIGHLIGHT_PAYLOAD)) payload = JSON.parse(fs.readFileSync(HIGHLIGHT_PAYLOAD, 'utf8'));
  const sheet2 = payload.sheets.find((s) => s.sheet_xml === 'xl/worksheets/sheet2.xml') || { sheet_xml: 'xl/worksheets/sheet2.xml', refs: [] };
  const refs = new Set(sheet2.refs || []);
  touchedRefs.forEach((ref) => refs.add(ref));
  sheet2.refs = [...refs];
  payload.sheets = [sheet2, ...(payload.sheets || []).filter((s) => s.sheet_xml !== 'xl/worksheets/sheet2.xml')];
  fs.writeFileSync(HIGHLIGHT_PAYLOAD, JSON.stringify(payload, null, 2), 'utf8');
  const patchResult = spawnSync('python3', [HIGHLIGHT_HELPER, IMPORT_FILE, HIGHLIGHT_PAYLOAD], { encoding: 'utf8' });
  if (patchResult.status !== 0) throw new Error(`highlight patch failed: ${patchResult.stderr || patchResult.stdout}`);

  console.log(JSON.stringify({ updated_reels: updates.length, updates: updates.slice(0, 30) }, null, 2));
}

main();
