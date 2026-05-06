const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import.xlsx');
const INDEX_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_whitelist_source_index.json');
const HIGHLIGHT_PAYLOAD = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_highlights.json');
const HIGHLIGHT_HELPER = path.resolve(__dirname, 'patch_xlsx_highlights.py');

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

function extractYearFromTitle(title) {
  const text = normalizeText(title).replace(/&nbsp;/gi, ' ');
  const two = text.match(/\b(?:Shimano|Daiwa)\s+(\d{2})\b/i);
  const four = text.match(/\b(20\d{2})\b/);
  if (four && two && four[1] !== `20${two[1]}`) return '';
  if (four) return four[1];
  if (two) return `20${two[1]}`;
  return '';
}

function extractModelPhrase(title) {
  let text = normalizeText(title).replace(/&nbsp;/gi, ' ');
  text = text.replace(/^Shimano\s+/i, '');
  text = text.replace(/^Daiwa\s+/i, '');
  text = text.replace(/^\d{2,4}\s+/, '');
  text = text.split(/Japan model|Special sale|Now we take|in stock now|High-end|Tournament|Seabass|Finesse tuned|Ultra Finesse/i)[0];
  return normalizeText(text);
}

function scoreCandidate(master, candidate) {
  const currentModel = normalizeText(master.model);
  if (/[（(]/.test(currentModel)) return 0;
  const extracted = extractModelPhrase(candidate.title);
  const currentFlat = flat(currentModel);
  const extractedFlat = flat(extracted);
  if (!currentFlat || !extractedFlat) return 0;
  if (extractedFlat === currentFlat) return 100;
  if (extractedFlat.startsWith(currentFlat)) {
    const extra = extractedFlat.slice(currentFlat.length);
    if (/^\d+$/.test(extra)) return 92;
    if (/^(R|L|RIGHT|LEFT|HG|XG|PG|\d+(HG|XG|PG)?)$/.test(extra)) return 90;
    return 70;
  }
  return 0;
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
  const reelSheet = 'reel';
  const masterHeaders = XLSX.utils.sheet_to_json(wb.Sheets[reelSheet], { header: 1, defval: '' })[0] || [];
  const masters = XLSX.utils.sheet_to_json(wb.Sheets[reelSheet], { defval: '' });
  const indexRows = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const indexById = new Map(indexRows.map((row) => [normalizeText(row.reel_id), row]));

  const newHighlightRefs = [];
  const updates = [];

  masters.forEach((master, idx) => {
    const src = indexById.get(normalizeText(master.id));
    if (!src || !Array.isArray(src.candidates) || !src.candidates.length) return;

    const candidates = src.candidates
      .filter((c) => c.site === 'japantackle')
      .map((c) => ({ ...c, score: scoreCandidate(master, c), year: extractYearFromTitle(c.title) }))
      .filter((c) => c.score >= 90 && c.year);

    if (!candidates.length) return;

    const top = candidates.sort((a, b) => b.score - a.score)[0];
    let changed = false;

    if (!normalizeText(master.model_year) && top.year) {
      master.model_year = top.year;
      const colIndex = masterHeaders.indexOf('model_year');
      if (colIndex !== -1) newHighlightRefs.push(`${encodeColumn(colIndex)}${idx + 2}`);
      changed = true;
    }

    if (!normalizeText(master.alias)) {
      master.alias = `${String(top.year).slice(-2)} ${normalizeText(master.model)}`.trim();
      const colIndex = masterHeaders.indexOf('alias');
      if (colIndex !== -1) newHighlightRefs.push(`${encodeColumn(colIndex)}${idx + 2}`);
      changed = true;
    }

    if (changed) {
      updates.push({
        id: master.id,
        model: master.model,
        year: master.model_year,
        alias: master.alias,
        source_url: top.url,
        source_title: top.title,
      });
    }
  });

  wb.Sheets[reelSheet] = XLSX.utils.json_to_sheet(masters, { header: masterHeaders });
  XLSX.writeFile(wb, IMPORT_FILE);

  let payload = { sheets: [] };
  if (fs.existsSync(HIGHLIGHT_PAYLOAD)) {
    payload = JSON.parse(fs.readFileSync(HIGHLIGHT_PAYLOAD, 'utf8'));
  }
  const sheet1 = payload.sheets.find((s) => s.sheet_xml === 'xl/worksheets/sheet1.xml') || { sheet_xml: 'xl/worksheets/sheet1.xml', refs: [] };
  const refs = new Set(sheet1.refs || []);
  newHighlightRefs.forEach((ref) => refs.add(ref));
  sheet1.refs = [...refs];
  payload.sheets = [
    sheet1,
    ...(payload.sheets || []).filter((s) => s.sheet_xml !== 'xl/worksheets/sheet1.xml'),
  ];
  fs.writeFileSync(HIGHLIGHT_PAYLOAD, JSON.stringify(payload, null, 2), 'utf8');

  const { spawnSync } = require('child_process');
  const patchResult = spawnSync('python3', [HIGHLIGHT_HELPER, IMPORT_FILE, HIGHLIGHT_PAYLOAD], { encoding: 'utf8' });
  if (patchResult.status !== 0) {
    throw new Error(`highlight patch failed: ${patchResult.stderr || patchResult.stdout}`);
  }

  console.log(JSON.stringify({ updated_count: updates.length, updates: updates.slice(0, 30) }, null, 2));
}

main();
