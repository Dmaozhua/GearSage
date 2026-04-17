const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = path.resolve(REPO_ROOT, 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx');
const INDEX_FILE = path.resolve(REPO_ROOT, 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_whitelist_source_index.json');
const HIGHLIGHT_PAYLOAD = path.resolve(REPO_ROOT, 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_highlights.json');
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

function extractModelPhrase(title) {
  let text = normalizeText(title).replace(/&nbsp;/gi, ' ');
  text = text.replace(/^Shimano\s+/i, '');
  text = text.replace(/^Daiwa\s+/i, '');
  text = text.replace(/^\d{2,4}\s+/, '');
  text = text.split(/Japan model|Special sale|Now we take|in stock now|High-end|Tournament performance|Tournament|Seabass|Finesse tuned|Ultra Finesse|Versatile/i)[0];
  return normalizeText(text);
}

function scoreCandidate(master, candidate) {
  const currentModel = normalizeText(master.model);
  if (!currentModel) return 0;
  const extracted = extractModelPhrase(candidate.title);
  const currentFlat = flat(currentModel);
  const extractedFlat = flat(extracted);
  if (!currentFlat || !extractedFlat) return 0;
  if (extractedFlat === currentFlat) return 100;
  if (extractedFlat.startsWith(currentFlat)) return 90;
  return 0;
}

function extractSynopsis(title) {
  const text = normalizeText(title).replace(/&nbsp;/gi, ' ');
  const parts = text.split(/\s+-\s+| \u00a0 /i);
  const idx = parts.findIndex((part) => /Japan model|\b20\d{2}\b|^\d{2}\b/i.test(part));
  if (idx >= 0 && parts[idx + 1]) return normalizeText(parts[idx + 1]);
  const m = text.match(/(?:Japan model\s*\d{4}-?|Japan model\s*\d{2,4}-?)\s*(.*)$/i);
  if (m) return normalizeText(m[1]);
  return '';
}

function derivePositioning(master, synopsis) {
  const t = `${normalizeText(master.model)} ${normalizeText(synopsis)}`.toLowerCase();
  if (/seabass|long casting/.test(t)) return '海鲈远投特化';
  if (/bfs/.test(t)) return 'BFS轻饵特化';
  if (/finesse tuned|finesse/.test(t)) return '轻量技巧泛用';
  if (/monster|heavy duty/.test(t)) return '巨物旗舰';
  if (/big bait|300 size|200 sized/.test(t)) return '重饵泛用';
  if (/shallow/.test(t)) return '浅杯技巧泛用';
  if (/tournament performance|versatile/.test(t)) return '泛用技巧';
  if (/sturdy|solid|super smooth/.test(t)) return '强力泛用';
  if (/small jigs|tai-rubber/.test(t)) return '海水轻量技巧';
  return '';
}

function deriveSellingPoints(master, synopsis) {
  const t = `${normalizeText(master.model)} ${normalizeText(synopsis)}`.toLowerCase();
  const tags = [];
  const push = (x) => { if (x && !tags.includes(x)) tags.push(x); };
  if (/dc/.test(t)) push('DC刹车');
  if (/long casting|cast the longest/.test(t)) push('远投');
  if (/seabass/.test(t)) push('海鲈');
  if (/bfs|finesse/.test(t)) push('轻饵');
  if (/shallow/.test(t)) push('浅杯');
  if (/monster|heavy duty/.test(t)) push('巨物向');
  if (/sturdy|solid/.test(t)) push('高刚性');
  if (/super smooth/.test(t)) push('卷感顺滑');
  if (/tournament performance/.test(t)) push('竞技向');
  if (/versatile/.test(t)) push('泛用');
  if (/300 size/.test(t)) push('300尺寸');
  if (/200 sized|200 size/.test(t)) push('200尺寸');
  if (/small jigs/.test(t)) push('小铁板');
  if (/tai-rubber/.test(t)) push('鯛橡');
  return tags.join(' / ');
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
  const sheet = 'reel';
  const headers = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' })[0] || [];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' });
  const indexRows = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const indexById = new Map(indexRows.map((row) => [normalizeText(row.reel_id), row]));
  const touchedRefs = [];
  const updates = [];

  rows.forEach((row, idx) => {
    const src = indexById.get(normalizeText(row.id));
    if (!src || !Array.isArray(src.candidates)) return;
    const candidates = src.candidates
      .filter((c) => c.site === 'japantackle')
      .map((c) => ({ ...c, score: scoreCandidate(row, c), synopsis: extractSynopsis(c.title) }))
      .filter((c) => c.score >= 90 && c.synopsis);
    if (!candidates.length) return;

    const top = candidates.sort((a, b) => b.score - a.score)[0];
    const positioning = derivePositioning(row, top.synopsis);
    const selling = deriveSellingPoints(row, top.synopsis);
    let changed = false;

    const maybeSet = (field, value) => {
      const text = normalizeText(value);
      if (!text || normalizeText(row[field])) return;
      row[field] = text;
      const colIndex = headers.indexOf(field);
      if (colIndex !== -1) touchedRefs.push(`${encodeColumn(colIndex)}${idx + 2}`);
      changed = true;
    };

    maybeSet('series_positioning', positioning);
    maybeSet('main_selling_points', selling);
    maybeSet('player_positioning', positioning);
    maybeSet('player_selling_points', selling);

    if (changed) {
      updates.push({
        id: row.id,
        model: row.model,
        series_positioning: row.series_positioning,
        main_selling_points: row.main_selling_points,
        source_url: top.url,
        source_title: top.title,
      });
    }
  });

  wb.Sheets[sheet] = XLSX.utils.json_to_sheet(rows, { header: headers });
  XLSX.writeFile(wb, IMPORT_FILE);

  let payload = { sheets: [] };
  if (fs.existsSync(HIGHLIGHT_PAYLOAD)) {
    payload = JSON.parse(fs.readFileSync(HIGHLIGHT_PAYLOAD, 'utf8'));
  }
  const sheet1 = payload.sheets.find((s) => s.sheet_xml === 'xl/worksheets/sheet1.xml') || { sheet_xml: 'xl/worksheets/sheet1.xml', refs: [] };
  const refs = new Set(sheet1.refs || []);
  touchedRefs.forEach((ref) => refs.add(ref));
  sheet1.refs = [...refs];
  payload.sheets = [sheet1, ...(payload.sheets || []).filter((s) => s.sheet_xml !== 'xl/worksheets/sheet1.xml')];
  fs.writeFileSync(HIGHLIGHT_PAYLOAD, JSON.stringify(payload, null, 2), 'utf8');

  const patchResult = spawnSync('python3', [HIGHLIGHT_HELPER, IMPORT_FILE, HIGHLIGHT_PAYLOAD], { encoding: 'utf8' });
  if (patchResult.status !== 0) {
    throw new Error(`highlight patch failed: ${patchResult.stderr || patchResult.stdout}`);
  }

  console.log(JSON.stringify({ updated_count: updates.length, updates: updates.slice(0, 30) }, null, 2));
}

main();
