const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');

const REPO_ROOT = '/Users/tommy/GearSage';
const IMPORT_FILE = path.join(REPO_ROOT, 'GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx');
const HIGHLIGHT_PAYLOAD = path.join(REPO_ROOT, 'GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import_highlights.json');
const HIGHLIGHT_HELPER = path.join(REPO_ROOT, 'scripts/patch_xlsx_highlights.py');
const SHIMANO_SUPPORT_SEARCH_URL = 'https://www.shimanofishingservice.jp/price.php';
const SHIMANO_SUPPORT_BASE_URL = 'https://www.shimanofishingservice.jp/';

const MASTER_SHEET = 'reel';
const DETAIL_SHEET = 'spinning_reel_detail';

const MASTER_ENRICHMENT = {
  STELLA: {
    series_positioning: '旗舰全能',
    main_selling_points: 'Infinity Evolution / 顺滑耐久 / 旗舰级进化',
    player_positioning: '纺车旗舰',
    player_selling_points: 'INFINITY体系 / 细节打磨 / 全能顶级手感',
  },
  Vanquish: {
    series_positioning: '轻量竞技旗舰',
    main_selling_points: 'MGL 系列高端 / Feather like operation / 轻快响应',
    player_positioning: '轻量竞技旗舰',
    player_selling_points: '低惯性 / 高感度 / 细腻操控 / 淡水技巧向',
  },
  TWINPOWER: {
    series_positioning: '次旗舰全能',
    main_selling_points: 'Core Solid / 稳定顺滑 / 高负荷耐久',
    player_positioning: '次旗舰全能',
    player_selling_points: '金属机身转子 / 高负荷稳定 / 轻盐泛用',
  },
  VANFORD: {
    series_positioning: '轻量快响应泛用',
    main_selling_points: 'Quick response / 轻量转子 / stop-and-go tactics',
    player_positioning: '轻量快响应泛用',
    player_selling_points: '轻快启停 / 敏感钓法适配 / Bass 与 Trout 泛用',
  },
  STRADIC: {
    series_positioning: '全能主力',
    main_selling_points: 'workhorse / 旗舰技术下放 / 淡海水泛用',
    player_positioning: '全能主力纺车轮',
    player_selling_points: '耐久顺滑 / 适用面广 / 甜蜜点价位',
  },
};

const DETAIL_ENRICHMENT = {
  STELLA: {
    official_environment: '淡海水泛用',
    player_environment: '淡海水泛用',
    body_material: 'Magnesium',
    is_sw_edition: '0',
  },
  Vanquish: {
    official_environment: '淡水路亚',
    player_environment: '淡水轻量泛用',
    body_material: 'Magnesium',
    body_material_tech: 'HAGANE 机身',
    is_sw_edition: '0',
  },
  TWINPOWER: {
    official_environment: '淡海水泛用',
    player_environment: '淡海水泛用',
    body_material: 'Aluminum alloy',
    body_material_tech: 'CORESOLID BODY',
    is_sw_edition: '0',
  },
  VANFORD: {
    official_environment: '淡水路亚',
    player_environment: '淡水轻量泛用',
    body_material_tech: 'CI4+ 碳纤维强化机身',
    is_sw_edition: '0',
  },
  STRADIC: {
    official_environment: '淡海水泛用',
    player_environment: '淡海水泛用',
    body_material: 'Aluminum alloy',
    body_material_tech: 'HAGANE 机身',
    is_sw_edition: '0',
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

function inferModelYear(master, detailRows) {
  if (normalizeText(master.model_year)) return normalizeText(master.model_year);
  const candidate = detailRows.find((row) => {
    const code = normalizeText(row.product_code);
    return code && code !== '-';
  });
  if (!candidate) return '';
  const support = resolveSupportLinks(candidate.product_code);
  const text = `${support.title} ${support.Specs_link}`;
  const fourDigit = text.match(/\b(20\d{2})\b/);
  if (fourDigit) return fourDigit[1];
  const twoDigit = text.match(/(?:manual_|^|\s)(\d{2})(?=[a-zA-Z\u30A0-\u30FF\u4E00-\u9FFF])/);
  if (twoDigit) return `20${twoDigit[1]}`;
  return '';
}

function buildAlias(modelYear, model) {
  const year = normalizeText(modelYear);
  if (!year) return '';
  return `${year.slice(-2)} ${normalizeText(model)}`;
}

function isDoubleHandleSpinning(sku) {
  return /DH(?:PG|HG|XG)?$/i.test(normalizeText(sku)) ? '1' : '0';
}

function getSpinningHandleStyle(sku) {
  return isDoubleHandleSpinning(sku) === '1' ? '双摇臂' : '单摇臂';
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
    const master = masterRows[i];
    if (!MASTER_ENRICHMENT[master.model]) continue;

    const familyDetailRows = detailRows.filter((row) => row.reel_id === master.id);
    const modelYear = inferModelYear(master, familyDetailRows);
    if (modelYear) master.model_year = modelYear;
    const alias = buildAlias(modelYear, master.model);
    if (alias) master.alias = alias;

    const masterExtra = MASTER_ENRICHMENT[master.model];
    for (const [key, value] of Object.entries(masterExtra)) {
      master[key] = value;
      const colIndex = masterHeaders.indexOf(key);
      if (colIndex !== -1) masterRefs.push(`${encodeColumn(colIndex)}${i + 2}`);
    }
  }

  const masterById = new Map(masterRows.map((row) => [row.id, row]));

  for (let i = 0; i < detailRows.length; i += 1) {
    const row = detailRows[i];
    const master = masterById.get(row.reel_id);
    if (!master || !DETAIL_ENRICHMENT[master.model]) continue;

    row.is_handle_double = isDoubleHandleSpinning(row.SKU);
    row.handle_style = getSpinningHandleStyle(row.SKU);

    const detailExtra = DETAIL_ENRICHMENT[master.model];
    for (const [key, value] of Object.entries(detailExtra)) {
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

  const payload = {
    sheets: [
      { sheet_xml: 'xl/worksheets/sheet1.xml', refs: masterRefs },
      { sheet_xml: 'xl/worksheets/sheet2.xml', refs: detailRefs },
    ],
  };
  fs.writeFileSync(HIGHLIGHT_PAYLOAD, JSON.stringify(payload, null, 2), 'utf8');
  execFileSync('python3', [HIGHLIGHT_HELPER, IMPORT_FILE, HIGHLIGHT_PAYLOAD], { stdio: 'inherit' });

  console.log(JSON.stringify({
    updated_master_families: Object.keys(MASTER_ENRICHMENT),
    updated_detail_families: Object.keys(DETAIL_ENRICHMENT),
    master_refs: masterRefs.length,
    detail_refs: detailRefs.length,
  }, null, 2));
}

main();
