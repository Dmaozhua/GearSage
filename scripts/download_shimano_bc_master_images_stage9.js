const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import.xlsx');
const INDEX_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_whitelist_source_index.json');
const HIGHLIGHT_PAYLOAD = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_highlights.json');
const HIGHLIGHT_HELPER = 'scripts/patch_xlsx_highlights.py';
const DOWNLOAD_DIR = '/Users/tommy/Pictures/images/shimano_reels';
const STATIC_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/images/shimano_reels/';
const PAGE_CACHE = new Map();

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function flat(value) {
  return normalizeText(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '')
    .toUpperCase();
}

function extractModelPhrase(title) {
  let text = normalizeText(title).replace(/&nbsp;/gi, ' ');
  text = text.replace(/^Shimano\s+/i, '');
  text = text.replace(/^Daiwa\s+/i, '');
  text = text.replace(/^\d{2,4}\s+/, '');
  text = text.split(/Japan model|Special sale|Now we take|in stock now|High-end|Tournament performance|Tournament|Seabass|Finesse tuned|Ultra Finesse|Versatile/i)[0];
  return normalizeText(text);
}

function scoreCandidate(master, candidate) {
  const a = flat(master.model);
  const b = flat(extractModelPhrase(candidate.title));
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (b.startsWith(a)) return 85;
  return 0;
}

function fetchPage(url) {
  if (PAGE_CACHE.has(url)) return PAGE_CACHE.get(url);
  const html = execFileSync('curl', ['-s', '-k', '-L', '-A', 'Mozilla/5.0', url], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  PAGE_CACHE.set(url, html);
  return html;
}

function extractJapanTackleImageUrl(html) {
  const m = html.match(/<img id="image" src="([^"]+)"/i);
  return m ? normalizeText(m[1]) : '';
}

function sanitizeFilename(name) {
  return String(name || '').replace(/[\\/*?:"<>|]/g, '_').trim();
}

function detectImageExtension(url) {
  const lower = normalizeText(url).toLowerCase();
  if (lower.includes('.png')) return '.png';
  if (lower.includes('.webp')) return '.webp';
  if (lower.includes('.jpeg')) return '.jpeg';
  return '.jpg';
}

function buildFilename(master, imageUrl) {
  const base = normalizeText(master.alias) || normalizeText(master.model) || 'unknown';
  return `${sanitizeFilename(base)}_main${detectImageExtension(imageUrl)}`;
}

function downloadFile(url, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  execFileSync('curl', ['-s', '-k', '-L', '-A', 'Mozilla/5.0', '-o', targetPath, url], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
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
  const masterSheet = 'reel';
  const headers = XLSX.utils.sheet_to_json(wb.Sheets[masterSheet], { header: 1, defval: '' })[0] || [];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[masterSheet], { defval: '' });
  const indexRows = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const indexById = new Map(indexRows.map((r) => [normalizeText(r.reel_id), r]));
  const refs = [];
  const updates = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const src = indexById.get(normalizeText(row.id));
    if (!src || !Array.isArray(src.candidates)) continue;
    const candidates = src.candidates
      .filter((c) => c.site === 'japantackle')
      .map((c) => ({ ...c, score: scoreCandidate(row, c) }))
      .filter((c) => c.score >= 85)
      .sort((a, b) => b.score - a.score);
    if (!candidates.length) continue;
    const top = candidates[0];
    const html = fetchPage(top.url);
    const imageUrl = extractJapanTackleImageUrl(html);
    if (!imageUrl) continue;
    const filename = buildFilename(row, imageUrl);
    const localPath = path.join(DOWNLOAD_DIR, filename);
    if (!fs.existsSync(localPath)) {
      downloadFile(imageUrl, localPath);
    }
    row.images = `${STATIC_PREFIX}${encodeURIComponent(filename)}`;
    const colIndex = headers.indexOf('images');
    if (colIndex !== -1) refs.push(`${encodeColumn(colIndex)}${i + 2}`);
    updates.push({ id: row.id, model: row.model, image_url: row.images, local_path: localPath, source_url: top.url, source_title: top.title });
  }

  wb.Sheets[masterSheet] = XLSX.utils.json_to_sheet(rows, { header: headers });
  XLSX.writeFile(wb, IMPORT_FILE);

  let payload = { sheets: [] };
  if (fs.existsSync(HIGHLIGHT_PAYLOAD)) payload = JSON.parse(fs.readFileSync(HIGHLIGHT_PAYLOAD, 'utf8'));
  const sheet1 = payload.sheets.find((s) => s.sheet_xml === 'xl/worksheets/sheet1.xml') || { sheet_xml: 'xl/worksheets/sheet1.xml', refs: [] };
  const set = new Set(sheet1.refs || []);
  refs.forEach((ref) => set.add(ref));
  sheet1.refs = [...set];
  payload.sheets = [sheet1, ...(payload.sheets || []).filter((s) => s.sheet_xml !== 'xl/worksheets/sheet1.xml')];
  fs.writeFileSync(HIGHLIGHT_PAYLOAD, JSON.stringify(payload, null, 2), 'utf8');

  const patchResult = spawnSync('python3', [HIGHLIGHT_HELPER, IMPORT_FILE, HIGHLIGHT_PAYLOAD], { encoding: 'utf8' });
  if (patchResult.status !== 0) throw new Error(`highlight patch failed: ${patchResult.stderr || patchResult.stdout}`);

  console.log(JSON.stringify({ updated_rows: updates.length, sample: updates.slice(0, 30) }, null, 2));
}

main();
