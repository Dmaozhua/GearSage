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
  if (b.startsWith(a) && !/\bDC\b/i.test(normalizeText(master.model))) return 85;
  return 0;
}

function extractBodyFields(html) {
  const text = html.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
  const clean = normalizeText(text.replace(/<[^>]+>/g, ' '));
  let bodyMaterial = '';
  let bodyTech = '';

  if (/Hagane aluminum alloy body/i.test(clean)) {
    bodyMaterial = 'Aluminum alloy';
    bodyTech = 'HAGANE 机身';
  } else if (/Fully machined aluminum body and side plates/i.test(clean)) {
    bodyMaterial = 'Aluminum';
    bodyTech = '全加工';
  } else if (/Fully machined aluminum alloy body/i.test(clean)) {
    bodyMaterial = 'Aluminum alloy';
    bodyTech = '全加工';
  } else if (/CORE SOLID aluminum alloy body frame Hagane body/i.test(clean)) {
    bodyMaterial = 'Aluminum alloy';
    bodyTech = 'CORE SOLID / HAGANE 机身';
  } else if (/Aluminum alloy Core Solid main frame/i.test(clean)) {
    bodyMaterial = 'Aluminum alloy';
    bodyTech = 'CORESOLID BODY';
  } else if (/Aluminum alloy main frame/i.test(clean)) {
    bodyMaterial = 'Aluminum alloy';
  } else if (/Magnesium alloy main frame and gear side cup/i.test(clean)) {
    bodyMaterial = 'Magnesium';
    bodyTech = 'CORESOLID BODY';
  } else if (/Core Solid metal body construction/i.test(clean)) {
    bodyMaterial = 'Magnesium';
    bodyTech = 'CORESOLID BODY';
  }

  if (!bodyTech) {
    if (/Hagane body/i.test(clean)) bodyTech = 'HAGANE 机身';
    if (/Coresolid body construction|Core Solid metal body construction/i.test(clean)) bodyTech = bodyTech ? `${bodyTech} / CORESOLID BODY` : 'CORESOLID BODY';
    if (/one piece aluminum alloy body frame/i.test(clean)) bodyTech = bodyTech ? `${bodyTech} / 一体成型` : '一体成型';
    if (/Fully machined aluminum alloy body/i.test(clean)) bodyTech = bodyTech ? `${bodyTech} / 全加工` : '全加工';
  }

  return { bodyMaterial, bodyTech };
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

  const groups = new Map();
  for (const row of detailRows) {
    const key = normalizeText(row.reel_id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  for (const [reelId, rows] of groups) {
    if (rows.some((r) => normalizeText(r.body_material) || normalizeText(r.body_material_tech))) continue;
    const master = masterById.get(reelId);
    const idx = indexById.get(reelId);
    if (!master || !idx || !Array.isArray(idx.candidates)) continue;
    const candidates = idx.candidates
      .filter((c) => c.site === 'japantackle')
      .map((c) => ({ ...c, score: scoreCandidate(master, c) }))
      .filter((c) => c.score >= 85);
    if (!candidates.length) continue;
    let result = null;
    for (const c of candidates) {
      const html = fetchUrl(c.url);
      const fields = extractBodyFields(html);
      if (fields.bodyMaterial || fields.bodyTech) {
        result = { ...fields, source: c };
        break;
      }
    }
    if (!result) continue;

    let changed = 0;
    rows.forEach((row) => {
      const rowIndex = detailRows.findIndex((x) => x.id === row.id);
      if (result.bodyMaterial && !normalizeText(row.body_material)) {
        row.body_material = result.bodyMaterial;
        const colIndex = detailHeaders.indexOf('body_material');
        if (colIndex !== -1) touchedRefs.push(`${encodeColumn(colIndex)}${rowIndex + 2}`);
        changed += 1;
      }
      if (result.bodyTech && !normalizeText(row.body_material_tech)) {
        row.body_material_tech = result.bodyTech;
        const colIndex = detailHeaders.indexOf('body_material_tech');
        if (colIndex !== -1) touchedRefs.push(`${encodeColumn(colIndex)}${rowIndex + 2}`);
        changed += 1;
      }
    });
    if (changed) updates.push({ reel_id: reelId, model: master.model, body_material: result.bodyMaterial, body_material_tech: result.bodyTech, source_url: result.source.url, source_title: result.source.title, changed });
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
