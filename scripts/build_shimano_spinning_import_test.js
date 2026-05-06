const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = '/Users/tommy/GearSage';
const SOURCE_IMPORT = gearDataPaths.resolveDataRaw('shimano_spinning_reels_import.xlsx');
const NORMALIZED_FILE = gearDataPaths.resolveDataRaw('shimano_spinning_reel_normalized.json');
const OUTPUT_FILE = gearDataPaths.resolveDataRaw('shimano_spinning_reels_import_test.xlsx');
const HIGHLIGHT_HELPER = path.join(REPO_ROOT, 'scripts/patch_xlsx_highlights.py');
const HIGHLIGHT_PAYLOAD = gearDataPaths.resolveDataRaw('.shimano_spinning_import_test_highlights.json');

const MASTER_SHEET = 'reel';
const DETAIL_SHEET = 'spinning_reel_detail';
const CDN_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/';
const SHIMANO_SUPPORT_SEARCH_URL = 'https://www.shimanofishingservice.jp/price.php';
const SHIMANO_SUPPORT_BASE_URL = 'https://www.shimanofishingservice.jp/';

const TARGET_MODELS = ['STELLA', 'Vanquish', 'TWINPOWER', 'VANFORD', 'STRADIC'];

const MASTER_HEADERS = [
  'id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias',
  'type_tips', 'type', 'images', 'created_at', 'updated_at',
  'series_positioning', 'main_selling_points', 'official_reference_price', 'market_status',
  'Description', 'market_reference_price', 'player_positioning', 'player_selling_points',
];

const DETAIL_HEADERS = [
  'id', 'reel_id', 'SKU', 'GEAR RATIO', 'DRAG', 'MAX DRAG', 'WEIGHT',
  'spool_diameter_per_turn_mm', 'Nylon_no_m', 'Nylon_lb_m', 'fluorocarbon_no_m',
  'fluorocarbon_lb_m', 'pe_no_m', 'cm_per_turn', 'handle_length_mm', 'bearing_count_roller',
  'body_material', 'body_material_tech', 'gear_material', 'official_environment',
  'line_capacity_display', 'market_reference_price', 'product_code', 'created_at', 'updated_at',
  'drag_click', 'spool_depth_normalized', 'gear_ratio_normalized', 'brake_type_normalized',
  'fit_style_tags', 'min_lure_weight_hint', 'is_compact_body', 'handle_style',
  'MAX_DURABILITY', 'type', 'is_sw_edition', 'variant_description', 'Description',
  'player_environment', 'is_handle_double', 'EV_link', 'Specs_link',
];

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
    is_sw_edition: '0',
    official_environment: '淡海水泛用',
    player_environment: '淡海水泛用',
    body_material: 'Magnesium',
  },
  Vanquish: {
    is_sw_edition: '0',
    official_environment: '淡水路亚',
    player_environment: '淡水轻量泛用',
    body_material: 'Magnesium',
    body_material_tech: 'HAGANE 机身',
  },
  TWINPOWER: {
    is_sw_edition: '0',
    official_environment: '淡海水泛用',
    player_environment: '淡海水泛用',
    body_material: 'Aluminum alloy',
    body_material_tech: 'CORESOLID BODY',
  },
  VANFORD: {
    is_sw_edition: '0',
    official_environment: '淡水路亚',
    player_environment: '淡水轻量泛用',
    body_material_tech: 'CI4+ 碳纤维强化机身',
  },
  STRADIC: {
    is_sw_edition: '0',
    official_environment: '淡海水泛用',
    player_environment: '淡海水泛用',
    body_material: 'Aluminum alloy',
    body_material_tech: 'HAGANE 机身',
  },
};

function encodeColumn(index) {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function ensureHeaders(rows, headers) {
  for (const row of rows) {
    for (const header of headers) {
      if (!(header in row)) row[header] = '';
    }
  }
}

function buildSheet(rows, headers) {
  const aoa = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))];
  return XLSX.utils.aoa_to_sheet(aoa);
}

function isCompactSpinningBody(sku) {
  return /(?:^|\s)C\d/i.test(normalizeText(sku)) ? '是' : '';
}

function isDoubleHandleSpinning(sku) {
  return /DH(?:PG|HG|XG)?$/i.test(normalizeText(sku)) ? '1' : '0';
}

function getSpinningHandleStyle(sku) {
  return isDoubleHandleSpinning(sku) === '1' ? '双摇臂' : '单摇臂';
}

function getSpoolDepthNormalized(sku) {
  const text = normalizeText(sku).toUpperCase();
  const lastToken = text.split(/\s+/).pop() || '';
  const match = lastToken.match(/^(?:C)?\d{3,4}(SSS|SS|MS|S|M)?/);
  const depthCode = match?.[1] || '';

  switch (depthCode) {
    case 'SSS':
      return '特超浅线杯';
    case 'SS':
      return '超浅线杯';
    case 'S':
      return '浅线杯';
    case 'MS':
      return '中浅线杯';
    case 'M':
      return '中线杯';
    default:
      return '标准';
  }
}

function buildLineCapacityDisplay(row) {
  if (normalizeText(row.pe_no_m)) return `PE ${normalizeText(row.pe_no_m)}`;
  if (normalizeText(row.fluorocarbon_lb_m)) return `FC ${normalizeText(row.fluorocarbon_lb_m)}`;
  if (normalizeText(row.fluorocarbon_no_m)) return `FC ${normalizeText(row.fluorocarbon_no_m)}`;
  if (normalizeText(row.Nylon_lb_m)) return `Nylon ${normalizeText(row.Nylon_lb_m)}`;
  if (normalizeText(row.Nylon_no_m)) return `Nylon ${normalizeText(row.Nylon_no_m)}`;
  return '';
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

function toCdnImageUrl(normalizedItem, sourceMaster) {
  const existing = normalizeText(sourceMaster.images);
  if (existing.startsWith('https://static.gearsage.club/')) return existing;
  const localPath = normalizeText(normalizedItem.local_image_path);
  if (localPath) return `${CDN_PREFIX}${localPath}`;
  return normalizeText(normalizedItem.main_image_url);
}

function main() {
  const sourceWb = XLSX.readFile(SOURCE_IMPORT);
  const sourceMasterRows = XLSX.utils.sheet_to_json(sourceWb.Sheets[MASTER_SHEET], { defval: '' });
  const sourceDetailRows = XLSX.utils.sheet_to_json(sourceWb.Sheets[DETAIL_SHEET], { defval: '' });
  const normalized = JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf8'));

  const normalizedMap = new Map(normalized.map((item) => [item.model_name, item]));
  const sourceMasterMap = new Map(sourceMasterRows.map((row) => [row.model, row]));

  const testMasters = [];
  const testDetails = [];
  const masterHighlightedCells = [];
  const detailHighlightedCells = [];

  for (const model of TARGET_MODELS) {
    const sourceMaster = sourceMasterMap.get(model);
    const normalizedItem = normalizedMap.get(model);
    if (!sourceMaster || !normalizedItem) continue;

    const detailRows = sourceDetailRows
      .filter((row) => row.reel_id === sourceMaster.id)
      .map((row) => ({ ...row }));

    const modelYear = inferModelYear(sourceMaster, detailRows);
    const alias = buildAlias(modelYear, sourceMaster.model);

    const masterRow = { ...sourceMaster };
    ensureHeaders([masterRow], MASTER_HEADERS);
    masterRow.model_year = modelYear;
    masterRow.alias = alias;
    masterRow.images = toCdnImageUrl(normalizedItem, sourceMaster);
    masterRow.Description = normalizeText(normalizedItem.description);
    masterRow.market_reference_price = '';
    masterRow.player_positioning = '';
    masterRow.player_selling_points = '';
    const enrichment = MASTER_ENRICHMENT[model];
    if (enrichment) {
      for (const [key, value] of Object.entries(enrichment)) {
        masterRow[key] = value;
      }
    }
    testMasters.push(masterRow);

    for (const row of detailRows) {
      ensureHeaders([row], DETAIL_HEADERS);
      row.type = 'spinning';
      row.drag_click = '1';
      row.is_compact_body = isCompactSpinningBody(row.SKU);
      row.is_handle_double = isDoubleHandleSpinning(row.SKU);
      row.handle_style = getSpinningHandleStyle(row.SKU);
      row.spool_depth_normalized = getSpoolDepthNormalized(row.SKU);
      row.line_capacity_display = buildLineCapacityDisplay(row);
      row.body_material = '';
      row.body_material_tech = '';
      row.gear_material = '';
      row.official_environment = '';
      row.gear_ratio_normalized = '';
      row.brake_type_normalized = '';
      row.fit_style_tags = '';
      row.min_lure_weight_hint = '';
      row.is_sw_edition = '';
      row.variant_description = '';
      row.Description = '';
      row.player_environment = '';

      const support = resolveSupportLinks(row.product_code);
      row.EV_link = support.EV_link;
      row.Specs_link = support.Specs_link;

      const detailEnrichment = DETAIL_ENRICHMENT[model];
      if (detailEnrichment) {
        for (const [key, value] of Object.entries(detailEnrichment)) {
          row[key] = value;
        }
      }

      testDetails.push(row);
    }
  }

  testMasters.sort((a, b) => TARGET_MODELS.indexOf(a.model) - TARGET_MODELS.indexOf(b.model));
  testDetails.sort((a, b) => {
    const ai = TARGET_MODELS.indexOf(testMasters.find((row) => row.id === a.reel_id)?.model || '');
    const bi = TARGET_MODELS.indexOf(testMasters.find((row) => row.id === b.reel_id)?.model || '');
    if (ai !== bi) return ai - bi;
    return normalizeText(a.id).localeCompare(normalizeText(b.id));
  });

  for (const [rowIndex, row] of testDetails.entries()) {
    const master = testMasters.find((masterRow) => masterRow.id === row.reel_id);
    const detailEnrichment = master ? DETAIL_ENRICHMENT[master.model] : null;
    if (!detailEnrichment) continue;
    for (const key of Object.keys(detailEnrichment)) {
      detailHighlightedCells.push({
        rowIndex: rowIndex + 2,
        colIndex: DETAIL_HEADERS.indexOf(key),
      });
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSheet(testMasters, MASTER_HEADERS), MASTER_SHEET);
  XLSX.utils.book_append_sheet(wb, buildSheet(testDetails, DETAIL_HEADERS), DETAIL_SHEET);
  XLSX.writeFile(wb, OUTPUT_FILE, { cellStyles: true });

  for (const [rowIndex, row] of testMasters.entries()) {
    const enrichment = MASTER_ENRICHMENT[row.model];
    if (!enrichment) continue;
    for (const key of Object.keys(enrichment)) {
      masterHighlightedCells.push({
        rowIndex: rowIndex + 2,
        colIndex: MASTER_HEADERS.indexOf(key),
      });
    }
  }

  const payload = {
    sheets: [
      {
        sheet_xml: 'xl/worksheets/sheet1.xml',
        refs: masterHighlightedCells.map(({ rowIndex, colIndex }) => `${encodeColumn(colIndex)}${rowIndex}`),
      },
      {
        sheet_xml: 'xl/worksheets/sheet2.xml',
        refs: detailHighlightedCells.map(({ rowIndex, colIndex }) => `${encodeColumn(colIndex)}${rowIndex}`),
      },
    ],
  };
  fs.writeFileSync(HIGHLIGHT_PAYLOAD, JSON.stringify(payload, null, 2), 'utf8');
  execFileSync('python3', [HIGHLIGHT_HELPER, OUTPUT_FILE, HIGHLIGHT_PAYLOAD], {
    stdio: 'inherit',
  });
  fs.unlinkSync(HIGHLIGHT_PAYLOAD);

  console.log(`[spinning-test] exported ${testMasters.length} masters / ${testDetails.length} details -> ${OUTPUT_FILE}`);
}

main();
