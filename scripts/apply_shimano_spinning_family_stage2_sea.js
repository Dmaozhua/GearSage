const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = '/Users/tommy/GearSage';
const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_spinning_reels_import.xlsx');
const HIGHLIGHT_PAYLOAD = gearDataPaths.resolveDataRaw('shimano_spinning_reels_import_highlights.json');
const HIGHLIGHT_HELPER = path.join(REPO_ROOT, 'scripts/patch_xlsx_highlights.py');
const SHIMANO_SUPPORT_SEARCH_URL = 'https://www.shimanofishingservice.jp/price.php';
const SHIMANO_SUPPORT_BASE_URL = 'https://www.shimanofishingservice.jp/';

const MASTER_SHEET = 'reel';
const DETAIL_SHEET = 'spinning_reel_detail';

const MASTER_BY_ID = {
  SRE1000: {
    model_year: '2026',
    alias: '26 STELLA SW',
    series_positioning: '海水旗舰',
    main_selling_points: 'SW旗舰 / 高负荷耐久 / 远近海全能',
    player_positioning: '海水旗舰纺车轮',
    player_selling_points: '拖拽上限高 / 远海近海兼顾 / 高负荷顺滑',
  },
  SRE1001: {
    model_year: '2020',
    alias: '20 STELLA SW',
    series_positioning: '海水旗舰',
    main_selling_points: 'SW旗舰 / 强度与顺滑兼备 / 大物对应',
    player_positioning: '海水旗舰纺车轮',
    player_selling_points: '大物信心 / 老旗舰口碑 / 负荷稳定',
  },
  SRE1004: {
    model_year: '2021',
    alias: '21 TWINPOWER SW',
    series_positioning: '海水次旗舰',
    main_selling_points: '高负荷耐久 / SW 实战 / 旗舰技术下放',
    player_positioning: '海水次旗舰纺车轮',
    player_selling_points: '耐久可靠 / 近海远海泛用 / 性价比高于旗舰',
  },
  SRE1008: {
    series_positioning: '海水主力',
    main_selling_points: '远海近海兼用 / 大物泛用 / 经典 SW 主力',
    player_positioning: '海水主力纺车轮',
    player_selling_points: '大物泛用 / 结实耐用 / 经典口碑',
  },
  SRE1012: {
    model_year: '2022',
    alias: '22 STRADIC SW',
    series_positioning: '海水轻量主力',
    main_selling_points: 'SW 轻量化 / 14000 规格 / 旗舰技术下放',
    player_positioning: '海水轻量主力',
    player_selling_points: '轻量但能打 / 近海大物 / 性价比好',
  },
  SRE1014: {
    model_year: '2024',
    alias: '24 STRADIC SW',
    series_positioning: '海水主力',
    main_selling_points: '新一代 SW 主力 / 旗舰技术下放 / 近海远投泛用',
    player_positioning: '海水主力纺车轮',
    player_selling_points: '轻量顺滑 / 海水路亚泛用 / 入手门槛更低',
  },
};

const DETAIL_BY_MASTER = {
  SRE1000: {
    official_environment: '海水路亚',
    player_environment: '海水重型路亚',
    is_sw_edition: '1',
  },
  SRE1001: {
    official_environment: '海水路亚',
    player_environment: '海水重型路亚',
    is_sw_edition: '1',
  },
  SRE1004: {
    official_environment: '海水路亚',
    player_environment: '海水泛用 / 大物',
    is_sw_edition: '1',
  },
  SRE1008: {
    official_environment: '海水路亚',
    player_environment: '海水泛用 / 大物',
    is_sw_edition: '1',
  },
  SRE1012: {
    official_environment: '海水路亚',
    player_environment: '海水路亚',
    is_sw_edition: '1',
  },
  SRE1014: {
    official_environment: '海水路亚',
    player_environment: '海水路亚',
    is_sw_edition: '1',
  },
};

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
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

function postShimanoSupportSearch(searchText) {
  const term = normalizeText(searchText);
  if (!term) return '';
  return execFileSync(
    'curl',
    [
      '-L',
      '-A',
      'Mozilla/5.0',
      '-X',
      'POST',
      SHIMANO_SUPPORT_SEARCH_URL,
      '--data',
      `prc=&cmd=search&sid=jp&search_text=${encodeURIComponent(term)}`,
    ],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
}

function toAbsoluteUrl(base, maybeRelative) {
  const text = normalizeText(maybeRelative);
  if (!text) return '';
  try {
    return new URL(text, base).href;
  } catch (error) {
    return text;
  }
}

function extractShimanoSupportLinks(html, productCode) {
  const code = normalizeText(productCode);
  if (!code || !html) return { EV_link: '', Specs_link: '', title: '' };
  const esc = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactBlock = new RegExp(
    `<span class="table-name_heading">([^<]+)</span>[\\s\\S]*?<p class="table_td table-code">${esc}</p>[\\s\\S]*?<a href="([^"]*parts_price\\.php\\?scode=${esc}[^"]*)"[^>]*>[\\s\\S]*?<a href="([^"]*manual[^"]+\\.pdf)"`,
    'i'
  );
  const match = html.match(exactBlock);
  if (!match) return { EV_link: '', Specs_link: '', title: '' };
  return {
    title: normalizeText(match[1]),
    EV_link: toAbsoluteUrl(SHIMANO_SUPPORT_BASE_URL, match[2]),
    Specs_link: toAbsoluteUrl(SHIMANO_SUPPORT_BASE_URL, match[3]),
  };
}

function resolveSupportLinks(productCode) {
  const code = normalizeText(productCode);
  if (!code || code === '-') return { EV_link: '', Specs_link: '', title: '' };
  try {
    const html = postShimanoSupportSearch(code);
    return extractShimanoSupportLinks(html, code);
  } catch (error) {
    return { EV_link: '', Specs_link: '', title: '' };
  }
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const masterHeaders = XLSX.utils.sheet_to_json(wb.Sheets[MASTER_SHEET], { header: 1, defval: '' })[0] || [];
  const detailHeaders = XLSX.utils.sheet_to_json(wb.Sheets[DETAIL_SHEET], { header: 1, defval: '' })[0] || [];
  const masterRows = XLSX.utils.sheet_to_json(wb.Sheets[MASTER_SHEET], { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(wb.Sheets[DETAIL_SHEET], { defval: '' });
  const masterRefs = [];
  const detailRefs = [];

  for (let i = 0; i < masterRows.length; i += 1) {
    const row = masterRows[i];
    const patch = MASTER_BY_ID[row.id];
    if (!patch) continue;
    for (const [key, value] of Object.entries(patch)) {
      row[key] = value;
      if (['series_positioning', 'main_selling_points', 'player_positioning', 'player_selling_points'].includes(key)) {
        const colIndex = masterHeaders.indexOf(key);
        if (colIndex !== -1) masterRefs.push(`${encodeColumn(colIndex)}${i + 2}`);
      }
    }
  }

  for (let i = 0; i < detailRows.length; i += 1) {
    const row = detailRows[i];
    const patch = DETAIL_BY_MASTER[row.reel_id];
    if (!patch) continue;
    for (const [key, value] of Object.entries(patch)) {
      row[key] = value;
      const colIndex = detailHeaders.indexOf(key);
      if (colIndex !== -1) detailRefs.push(`${encodeColumn(colIndex)}${i + 2}`);
    }
    const support = resolveSupportLinks(row.product_code);
    if (support.EV_link) row.EV_link = support.EV_link;
    if (support.Specs_link) row.Specs_link = support.Specs_link;
  }

  wb.Sheets[MASTER_SHEET] = XLSX.utils.json_to_sheet(masterRows, { header: masterHeaders });
  wb.Sheets[DETAIL_SHEET] = XLSX.utils.json_to_sheet(detailRows, { header: detailHeaders });
  XLSX.writeFile(wb, IMPORT_FILE, { cellStyles: true });

  fs.writeFileSync(HIGHLIGHT_PAYLOAD, JSON.stringify({
    sheets: [
      { sheet_xml: 'xl/worksheets/sheet1.xml', refs: masterRefs },
      { sheet_xml: 'xl/worksheets/sheet2.xml', refs: detailRefs },
    ],
  }, null, 2), 'utf8');
  execFileSync('python3', [HIGHLIGHT_HELPER, IMPORT_FILE, HIGHLIGHT_PAYLOAD], { stdio: 'inherit' });

  console.log(JSON.stringify({
    updatedMasterIds: Object.keys(MASTER_BY_ID),
    updatedDetailMasterIds: Object.keys(DETAIL_BY_MASTER),
    masterRefs: masterRefs.length,
    detailRefs: detailRefs.length,
  }, null, 2));
}

main();
