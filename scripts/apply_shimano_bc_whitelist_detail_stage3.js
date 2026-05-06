const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import.xlsx');
const INDEX_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_whitelist_source_index.json');
const HIGHLIGHT_PAYLOAD = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_highlights.json');
const HIGHLIGHT_HELPER = path.resolve(__dirname, 'patch_xlsx_highlights.py');
const PAGE_CACHE = new Map();
const LIMIT = Number.parseInt(process.env.GS_SHIMANO_DETAIL_STAGE3_LIMIT || '', 10);

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

function buildModelTokens(master) {
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

function buildVariantTokens(master) {
  const text = [master.model, master.alias].map(normalizeText).join(' ').toUpperCase();
  const tokens = [];
  const push = (v) => { if (!tokens.includes(v)) tokens.push(v); };
  if (/\bBFS\b/.test(text)) push('BFS');
  if (/\bMGL\b/.test(text)) push('MGL');
  if (/\bLD\b/.test(text)) push('LD');
  if (/\bCT\b/.test(text)) push('CT');
  if (/\bFT\b/.test(text)) push('FT');
  if (/\bXT\b/.test(text)) push('XT');
  if (/SHALLOW/.test(text)) push('SHALLOW');
  if (/\bSS\b/.test(text)) push('SS');
  return tokens;
}

function fieldRelevantCandidates(master, candidates, field) {
  const tokens = buildModelTokens(master);
  const variantTokens = buildVariantTokens(master);
  const rootMap = [
    ['CALCUTTA', /CALCUTTA/i],
    ['METANIUM', /METANIUM/i],
    ['EXSENCE', /EXSENCE/i],
    ['ANTARES', /ANTARES/i],
    ['BANTAM', /BANTAM/i],
    ['SCORPION', /SCORPION/i],
    ['SLX', /\bSLX\b/i],
    ['CURADO', /CURADO/i],
    ['OCEA', /OCEA/i],
    ['GRAPPLER', /GRAPPLER/i],
    ['ALDEBARAN', /ALDEBARAN/i],
  ];
  const fallbackRoots = rootMap.filter(([token]) => tokens.includes(token)).map(([, re]) => re);

  return candidates.filter((c) => {
    const title = normalizeText(c.title);
    const upper = title.toUpperCase();
    const matchedCount = tokens.filter((token) => upper.includes(token)).length;
    const rootHit = fallbackRoots.some((re) => re.test(title));
    const requiredMatches = tokens.length >= 2 ? 2 : 1;
    if (!(matchedCount >= requiredMatches || (matchedCount === 0 && rootHit && requiredMatches === 1))) return false;
    if (variantTokens.length && !variantTokens.every((token) => upper.includes(token))) return false;
    if (field === 'spool') {
      return /Spare Spool|Genuine.*Spool|Microcast Spool|Narrowcast Spool/i.test(title);
    }
    if (field === 'knob') {
      return /Handle Knob Bearing|Handle Knob Cap|Genuine Handle Knob/i.test(title);
    }
    if (field === 'bearing') {
      return /Handle Knob Bearing Kit|Overhaul Bearing/i.test(title);
    }
    if (field === 'hole') {
      return /Handle (Lock )?Nut/i.test(title) && /\bM[78]\b/i.test(title);
    }
    return false;
  });
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
    const row = {
      site: 'hedgehog_studio',
      search_query: q,
      url: m[1],
      title: normalizeText(m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ')),
    };
    if (seen.has(row.url)) continue;
    seen.add(row.url);
    rows.push(row);
  }
  return rows;
}

function collectCandidates(master) {
  const candidates = [];
  for (const q of buildQueries(master)) {
    for (const row of searchHedgehogPhone(q)) candidates.push(row);
  }
  const dedup = [];
  const seen = new Set();
  for (const row of candidates) {
    if (seen.has(row.url)) continue;
    seen.add(row.url);
    dedup.push(row);
  }
  const tokens = buildModelTokens(master);
  return dedup.filter((row) => {
    const title = normalizeText(row.title).toUpperCase();
    if (!/\[(SHIMANO|AVAIL|HEDGEHOG STUDIO|SHIMANO GENUINE)\]/i.test(title)) return false;
    if (/\[DAIWA\]|\[ABU\]|DAIWA GENUINE|SLP WORKS/i.test(title)) return false;
    if (!tokens.length) return true;
    return tokens.some((token) => title.includes(token));
  });
}

function extractHandleHoleSpec(candidates) {
  for (const c of candidates) {
    if (/Handle Lock Nut/i.test(c.title)) {
      const m = c.title.match(/\bM([78])\b/i);
      if (m) return `M${m[1]}`;
    }
  }
  return '';
}

function extractKnobBearingSpec(candidates) {
  for (const c of candidates) {
    const html = fetchUrl(c.url);
    if (/SHG-740ZZ/i.test(html) || /HRCB-740ZHi/i.test(html)) {
      return 'SHG-740ZZ / HRCB-740ZHi';
    }
    if (/4\s*[xX]\s*7\s*[xX]\s*2\.5/.test(html)) {
      return '4x7x2.5（stock）';
    }
  }
  return '';
}

function extractCustomSpoolCompatibility(candidates) {
  const hits = [];
  for (const c of candidates) {
    hits.push(c.title.replace(/^\[[^\]]+\]\s*/,''));
  }
  return [...new Set(hits)].slice(0, 3).join(' / ');
}

function extractCustomKnobCompatibility(candidates) {
  const hits = [];
  for (const c of candidates) {
    hits.push(c.title.replace(/^\[[^\]]+\]\s*/,''));
  }
  return [...new Set(hits)].slice(0, 3).join(' / ');
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
  const detailSheet = 'baitcasting_reel_detail';
  const masterRows = XLSX.utils.sheet_to_json(wb.Sheets[masterSheet], { defval: '' });
  const detailHeaders = XLSX.utils.sheet_to_json(wb.Sheets[detailSheet], { header: 1, defval: '' })[0] || [];
  const detailRows = XLSX.utils.sheet_to_json(wb.Sheets[detailSheet], { defval: '' });
  const masterById = new Map(masterRows.map((row) => [normalizeText(row.id), row]));
  const indexRows = fs.existsSync(INDEX_FILE) ? JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')) : [];
  const candidateRichIds = new Set(indexRows.filter((row) => Array.isArray(row.candidates) && row.candidates.length).map((row) => normalizeText(row.reel_id)));

  const detailByReel = new Map();
  for (const row of detailRows) {
    const key = normalizeText(row.reel_id);
    if (!detailByReel.has(key)) detailByReel.set(key, []);
    detailByReel.get(key).push(row);
  }

  const touchedRefs = [];
  const updates = [];

  const groups = [...detailByReel.entries()].filter(([reelId]) => candidateRichIds.has(normalizeText(reelId)));
  const scopedGroups = Number.isFinite(LIMIT) && LIMIT > 0 ? groups.slice(0, LIMIT) : groups;

  for (let gi = 0; gi < scopedGroups.length; gi += 1) {
    const [reelId, rows] = scopedGroups[gi];
    const master = masterById.get(reelId);
    if (!master) continue;
    const candidates = collectCandidates(master);
    if (!candidates.length) continue;

    const hole = extractHandleHoleSpec(fieldRelevantCandidates(master, candidates, 'hole'));
    const bearing = extractKnobBearingSpec(fieldRelevantCandidates(master, candidates, 'bearing'));
    const spoolCompat = extractCustomSpoolCompatibility(fieldRelevantCandidates(master, candidates, 'spool'));
    const knobCompat = extractCustomKnobCompatibility(fieldRelevantCandidates(master, candidates, 'knob'));

    let changedCount = 0;
    rows.forEach((row) => {
      const rowIndex = detailRows.findIndex((x) => x.id === row.id);
      const maybeSet = (field, value) => {
        const text = normalizeText(value);
        if (!text || normalizeText(row[field])) return;
        row[field] = text;
        const colIndex = detailHeaders.indexOf(field);
        if (colIndex !== -1) touchedRefs.push(`${encodeColumn(colIndex)}${rowIndex + 2}`);
        changedCount += 1;
      };
      maybeSet('handle_hole_spec', hole);
      maybeSet('knob_bearing_spec', bearing);
      maybeSet('custom_spool_compatibility', spoolCompat);
      maybeSet('custom_knob_compatibility', knobCompat);
    });

    if (changedCount) {
      updates.push({
        reel_id: reelId,
        model: master.model,
        changedCount,
        handle_hole_spec: hole,
        knob_bearing_spec: bearing,
        custom_spool_compatibility: spoolCompat,
        custom_knob_compatibility: knobCompat,
        sample_source: candidates.slice(0, 5),
      });
    }

    if ((gi + 1) % 5 === 0) {
      console.log(`detail_stage3 processed ${gi + 1}/${scopedGroups.length}`);
    }
  }

  wb.Sheets[detailSheet] = XLSX.utils.json_to_sheet(detailRows, { header: detailHeaders });
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

  console.log(JSON.stringify({ updated_reels: updates.length, updates: updates.slice(0, 20) }, null, 2));
}

main();
