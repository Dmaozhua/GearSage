const fs = require('fs');
const { execFileSync, spawnSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import.xlsx');
const INDEX_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_whitelist_source_index.json');
const HIGHLIGHT_PAYLOAD = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_highlights.json');
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
  const model = normalizeText(master.model);
  const extracted = extractModelPhrase(candidate.title);
  const a = flat(model);
  const b = flat(extracted);
  if (!a || !b) return 0;
  if (a === b) return 100;
  return 0;
}

function extractMainGearMaterial(html) {
  const text = html.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
  const clean = normalizeText(text.replace(/<[^>]+>/g, ' '));
  if (/Duralumin drive gear/i.test(clean)) return 'Duralumin';
  if (/high tensile brass drive gear|brass drive gear/i.test(clean)) return 'Brass';
  if (/brass gears?/i.test(clean) || /main gear is brass/i.test(clean)) return 'Brass';
  if (/aluminum gears?/i.test(clean) || /main gear is aluminum/i.test(clean)) return 'Aluminum';
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
  const detailHeaders = XLSX.utils.sheet_to_json(wb.Sheets['baitcasting_reel_detail'], { header: 1, defval: '' })[0] || [];
  const detailRows = XLSX.utils.sheet_to_json(wb.Sheets['baitcasting_reel_detail'], { defval: '' });
  const reelRows = XLSX.utils.sheet_to_json(wb.Sheets['reel'], { defval: '' });
  const masterById = new Map(reelRows.map((r) => [normalizeText(r.id), r]));
  const indexRows = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const indexById = new Map(indexRows.map((r) => [normalizeText(r.reel_id), r]));
  const touchedRefs = [];
  const updates = [];

  const grouped = new Map();
  for (const row of detailRows) {
    const key = normalizeText(row.reel_id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  for (const [reelId, rows] of grouped) {
    if (rows.some((r) => normalizeText(r.main_gear_material))) continue;
    const master = masterById.get(reelId);
    const idx = indexById.get(reelId);
    if (!master || !idx || !Array.isArray(idx.candidates)) continue;

    const candidates = idx.candidates
      .filter((c) => c.site === 'japantackle')
      .map((c) => ({ ...c, score: scoreCandidate(master, c) }))
      .filter((c) => c.score >= 90)
      .sort((a, b) => b.score - a.score);

    if (!candidates.length) continue;
    let material = '';
    let source = null;
    for (const c of candidates) {
      const html = fetchUrl(c.url);
      const found = extractMainGearMaterial(html);
      if (found) {
        material = found;
        source = c;
        break;
      }
    }
    if (!material) continue;

    let changed = 0;
    rows.forEach((row) => {
      row.main_gear_material = material;
      const rowIndex = detailRows.findIndex((x) => x.id === row.id);
      const colIndex = detailHeaders.indexOf('main_gear_material');
      if (colIndex !== -1) touchedRefs.push(`${encodeColumn(colIndex)}${rowIndex + 2}`);
      changed += 1;
    });
    updates.push({ reel_id: reelId, model: master.model, main_gear_material: material, source_url: source && source.url, source_title: source && source.title, changed });
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

  console.log(JSON.stringify({ updated_reels: updates.length, updates }, null, 2));
}

main();
