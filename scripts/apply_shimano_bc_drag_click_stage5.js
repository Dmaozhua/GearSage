const fs = require('fs');
const { execFileSync, spawnSync } = require('child_process');
const XLSX = require('xlsx');

const IMPORT_FILE = 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx';
const INDEX_FILE = 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_whitelist_source_index.json';
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

function encodeColumn(index) {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function extractDragClick(html) {
  const text = normalizeText(html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' '));
  if (/line alarm|line out alarm|drag clicker|line is pulled out/i.test(text)) return '1';
  if (/clicking star drag/i.test(text)) return '';
  return '';
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const masterRows = XLSX.utils.sheet_to_json(wb.Sheets['reel'], { defval: '' });
  const detailHeaders = XLSX.utils.sheet_to_json(wb.Sheets['baitcasting_reel_detail'], { header: 1, defval: '' })[0] || [];
  const detailRows = XLSX.utils.sheet_to_json(wb.Sheets['baitcasting_reel_detail'], { defval: '' });
  const indexRows = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const indexById = new Map(indexRows.map((row) => [normalizeText(row.reel_id), row]));
  const touchedRefs = [];
  const updates = [];

  const grouped = new Map();
  for (const row of detailRows) {
    const key = normalizeText(row.reel_id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  for (const [reelId, rows] of grouped) {
    if (rows.some((r) => normalizeText(r.drag_click))) continue;
    const idx = indexById.get(reelId);
    if (!idx || !Array.isArray(idx.candidates)) continue;
    const candidates = idx.candidates.filter((c) => c.site === 'japantackle');
    if (!candidates.length) continue;
    let value = '';
    let source = null;
    for (const c of candidates) {
      const html = fetchUrl(c.url);
      const found = extractDragClick(html);
      if (found) {
        value = found;
        source = c;
        break;
      }
    }
    if (!value) continue;

    let changed = 0;
    rows.forEach((row) => {
      row.drag_click = value;
      const rowIndex = detailRows.findIndex((x) => x.id === row.id);
      const colIndex = detailHeaders.indexOf('drag_click');
      if (colIndex !== -1) touchedRefs.push(`${encodeColumn(colIndex)}${rowIndex + 2}`);
      changed += 1;
    });
    updates.push({ reel_id: reelId, model: (masterRows.find((r) => r.id === reelId) || {}).model || '', drag_click: value, source_url: source && source.url, source_title: source && source.title, changed });
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
