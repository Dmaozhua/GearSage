const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const INPUT_FILE = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_baitcasting_reel_normalized.json');
const OUTPUT_FILE = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx');
const WHITELIST_EXPERIMENT_CONFIG = path.resolve(
  __dirname,
  './config/whitelist_experiments/shimano_baitcasting_reel.json'
);
const ENABLE_WHITELIST_ENRICHMENT = process.env.GS_ENABLE_SHIMANO_BC_WHITELIST_ENRICHMENT === '1';
const TEMPLATE_FILES = [
  OUTPUT_FILE,
  path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx'),
];

const BRAND_ID = 1;
const MASTER_SHEET = 'reel';
const DETAIL_SHEET = 'baitcasting_reel_detail';
const MASTER_PREFIX = 'SRE';
const DETAIL_PREFIX = 'SRED';

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeModelKey(value) {
  return normalizeText(value).toUpperCase();
}

function normalizeSkuKey(value) {
  return normalizeText(value).toUpperCase();
}

function parsePriceNumber(value) {
  const digits = normalizeText(value).replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function formatPriceRange(prices) {
  const valid = prices.filter((value) => Number.isFinite(value));
  if (!valid.length) return '';
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  return min === max
    ? `¥${min.toLocaleString()}`
    : `¥${min.toLocaleString()} - ¥${max.toLocaleString()}`;
}

function parseIdNumber(value, prefix) {
  const match = String(value || '').match(new RegExp(`^${prefix}(\\d+)$`));
  return match ? Number(match[1]) : null;
}

function loadTemplateSheet(workbook, sheetName) {
  if (!workbook || !workbook.Sheets[sheetName]) return { headers: [], rows: [] };
  const headerRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
  const headers = headerRows[0] || [];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  return { headers, rows };
}

function loadTemplateWorkbook() {
  for (const file of TEMPLATE_FILES) {
    if (fs.existsSync(file)) {
      return XLSX.readFile(file);
    }
  }
  return null;
}

function loadWhitelistExperimentReportPath() {
  if (!fs.existsSync(WHITELIST_EXPERIMENT_CONFIG)) {
    return {};
  }

  const config = JSON.parse(fs.readFileSync(WHITELIST_EXPERIMENT_CONFIG, 'utf8'));
  return {
    jsonReport: config && config.outputs && config.outputs.json_report
      ? path.resolve(REPO_ROOT, config.outputs.json_report)
      : '',
    approvedPatchJson: config && config.outputs && config.outputs.approved_patch_json
      ? path.resolve(REPO_ROOT, config.outputs.approved_patch_json)
      : '',
  };
}

function loadExperimentProposals() {
  if (!ENABLE_WHITELIST_ENRICHMENT) {
    return new Map();
  }

  const experimentFiles = loadWhitelistExperimentReportPath();
  const approvedPatchFile = experimentFiles.approvedPatchJson;
  if (!approvedPatchFile || !fs.existsSync(approvedPatchFile)) {
    return new Map();
  }

  const report = JSON.parse(fs.readFileSync(approvedPatchFile, 'utf8'));
  const proposals = new Map();

  for (const patchRow of report.patch_rows || []) {
    const detailId = normalizeText(patchRow.detail_id);
    if (!detailId) continue;

    const next = proposals.get(detailId) || {};
    if (normalizeText(patchRow.field_key) === 'body_material') {
      next.body_material = normalizeText(patchRow.approved_value);
      next.body_material_tech = normalizeText(patchRow.body_material_tech);
    }
    if (normalizeText(patchRow.field_key) === 'gear_material') {
      next.gear_material = normalizeText(patchRow.approved_value);
    }
    if (Object.keys(next).length) {
      proposals.set(detailId, next);
    }
  }

  return proposals;
}

function parseEnvironment(value) {
  const text = normalizeText(value);
  if (!text) return '';
  if (text.includes('海鲈') || /SEABASS|SALTWATER/i.test(text)) return '海水路亚';
  if (text.includes('海水')) return '海水路亚';
  if (text.includes('船钓')) return '船钓';
  if (text.includes('淡水')) return '淡水路亚';
  return text;
}

function parseSpoolDimensions(value) {
  const match = normalizeText(value).match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (!match) return { diameter: '', width: '' };
  return {
    diameter: match[1],
    width: match[2],
  };
}

function buildLineCapacityDisplay(specs) {
  const parts = [];
  const push = (label, value) => {
    const normalized = normalizeText(value);
    if (normalized) {
      parts.push(`${label}${normalized}`);
    }
  };
  push('尼龙号 ', specs.nylon_no_m);
  push('尼龙lb ', specs.nylon_lb_m);
  push('氟碳号 ', specs.fluoro_no_m);
  push('氟碳lb ', specs.fluoro_lb_m);
  push('PE ', specs.pe_no_m);
  return parts.join(' / ');
}

function extractMaxCapacityMeters(specs) {
  const values = [specs.nylon_no_m, specs.nylon_lb_m, specs.fluoro_no_m, specs.fluoro_lb_m, specs.pe_no_m]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .flatMap((value) => Array.from(value.matchAll(/-(\d+(?:\.\d+)?)/g)).map((match) => Number(match[1])));
  return values.length ? Math.max(...values) : null;
}

function normalizeGearRatio(ratioValue) {
  const ratio = Number.parseFloat(normalizeText(ratioValue));
  if (!Number.isFinite(ratio)) return '';
  if (ratio >= 8.1) return '超高速比';
  if (ratio >= 7.1) return '高速比';
  if (ratio <= 5.5) return '低速比';
  return '中速比';
}

function normalizeSpoolDepth(item, variant) {
  const text = [item.model_name, variant.variant_name, item.description].map(normalizeText).join(' ').toUpperCase();
  if (/BFS|SHALLOW/.test(text)) return '浅杯';

  const specs = variant.specs || {};
  const maxMeters = extractMaxCapacityMeters(specs);
  const dims = parseSpoolDimensions(specs.spool_diameter_stroke_mm);
  const diameter = Number.parseFloat(dims.diameter);
  const width = Number.parseFloat(dims.width);

  if ((Number.isFinite(diameter) && diameter <= 32) || (maxMeters !== null && maxMeters <= 80)) {
    return '浅杯';
  }

  if (item.category_path === 'baitfune') {
    return '深杯';
  }

  if (item.category_path === 'baitsalt') {
    if (
      /TIAGRA|TALICA|TYRNOS|TORIUM|JIGGER|大物|拖曳|拖钓|深海|离岛/.test(text) ||
      (maxMeters !== null && maxMeters >= 300) ||
      (Number.isFinite(diameter) && diameter >= 60) ||
      (Number.isFinite(width) && width >= 30)
    ) {
      return '深杯';
    }
    return '中杯';
  }

  if (item.category_path === 'baitlurecasting') {
    if (
      /MD|MONSTER|BIG BAIT|大物|重饵/.test(text) &&
      ((maxMeters !== null && maxMeters >= 180) || (Number.isFinite(width) && width >= 21))
    ) {
      return '深杯';
    }
     return '中杯';
  }

  if (item.category_path === 'baitlurecasting' || item.category_path === 'baitsalt') {
    return '中杯';
  }

  return '';
}

function normalizeBrakeType(item, variant) {
  const text = [item.model_name, variant.variant_name, item.description].map(normalizeText).join(' ').toUpperCase();
  if (/DC|I-DC|4X8/.test(text)) return 'DC';
  if (/BFS|FTB/.test(text)) return '磁力';
  if (/SVS|VBS/.test(text)) return '离心';
  if (item.category_path === 'baitlurecasting') return '离心';
  return '';
}

function deriveFitStyleTags(item, variant) {
  const tags = [];
  const push = (value) => {
    const text = normalizeText(value);
    if (text && !tags.includes(text)) tags.push(text);
  };

  const text = [item.model_name, variant.variant_name, item.description].map(normalizeText).join(' ').toUpperCase();
  const environment = parseEnvironment(item.official_environment);
  const gearRatioNormalized = normalizeGearRatio(variant.specs && variant.specs.gear_ratio);

  if (/BFS/.test(text)) {
    push('轻饵精细');
  } else if (environment === '淡水路亚') {
    push('淡水泛用');
  }

  if (environment === '海水路亚') push('海水近岸');
  if (environment === '船钓') push('船钓大物');

  if (/MD|MONSTER|大物|巨物/.test(text)) {
    push(environment === '淡水路亚' ? '重饵方向' : '海水大物');
  }

  if (/远投|LONG CAST|飞行弹道/.test(text) || normalizeBrakeType(item, variant) === 'DC') {
    push('远投');
  }

  if (gearRatioNormalized === '高速比' || gearRatioNormalized === '超高速比') {
    push('快收方向');
  }
  if (gearRatioNormalized === '低速比') {
    push('慢卷方向');
  }

  return tags.join(' / ');
}

function deriveMainSellingPoints(description, existingValue) {
  return normalizeText(existingValue);
}

function deriveSeriesPositioning(item, existingValue, prices) {
  return normalizeText(existingValue);
}

function buildMasterImages(existingRow, item) {
  if (normalizeText(existingRow && existingRow.images)) return normalizeText(existingRow.images);
  return normalizeText(item.main_image_url);
}

function dedupeAndGroup(data) {
  const groups = new Map();

  for (const item of data) {
    const modelKey = normalizeModelKey(item.model_name);
    if (!modelKey) continue;

    const current = groups.get(modelKey) || {
      model_name: item.model_name,
      model_year: '',
      description: '',
      official_environment: '',
      category_path: '',
      main_image_url: '',
      source_urls: [],
      variants: [],
      scraped_at: '',
    };

    if (!normalizeText(current.description) || normalizeText(item.description).length > normalizeText(current.description).length) {
      current.description = normalizeText(item.description);
    }
    if (!normalizeText(current.model_year) && normalizeText(item.model_year)) current.model_year = normalizeText(item.model_year);
    if (!normalizeText(current.official_environment) && normalizeText(item.official_environment)) current.official_environment = normalizeText(item.official_environment);
    if (!normalizeText(current.category_path) && normalizeText(item.category_path)) current.category_path = normalizeText(item.category_path);
    if (!normalizeText(current.main_image_url) && normalizeText(item.main_image_url)) current.main_image_url = normalizeText(item.main_image_url);
    if (!normalizeText(current.scraped_at) && normalizeText(item.scraped_at)) current.scraped_at = normalizeText(item.scraped_at);
    current.source_urls.push(item.source_url || item.url || '');

    const seenSku = new Set(current.variants.map((variant) => normalizeSkuKey(variant.variant_name)));
    for (const variant of item.variants || []) {
      const skuKey = normalizeSkuKey(variant.variant_name);
      if (!skuKey || seenSku.has(skuKey)) continue;
      seenSku.add(skuKey);
      current.variants.push(variant);
    }

    groups.set(modelKey, current);
  }

  return Array.from(groups.values());
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('[To Excel] Missing input file:', INPUT_FILE);
    process.exit(1);
  }

  const normalized = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const grouped = dedupeAndGroup(normalized);
  const experimentProposals = loadExperimentProposals();
  console.log(`[To Excel] whitelist enrichment ${ENABLE_WHITELIST_ENRICHMENT ? 'enabled' : 'disabled'} via GS_ENABLE_SHIMANO_BC_WHITELIST_ENRICHMENT`);

  const templateWorkbook = loadTemplateWorkbook();
  const templateMaster = loadTemplateSheet(templateWorkbook, MASTER_SHEET);
  const templateDetail = loadTemplateSheet(templateWorkbook, DETAIL_SHEET);

  const masterHeaders = templateMaster.headers.length
    ? templateMaster.headers
    : ['id', 'brand_id', 'is_show', 'model', 'model_cn', 'model_year', 'alias', 'type_tips', 'type', 'images', 'created_at', 'updated_at', 'series_positioning', 'main_selling_points', 'official_reference_price', 'market_status', 'Description'];
  const detailHeaders = templateDetail.headers.length
    ? templateDetail.headers
    : ['id', 'reel_id', 'SKU', 'GEAR RATIO', 'MAX DRAG', 'WEIGHT', 'spool_diameter_per_turn_mm', 'Nylon_lb_m', 'fluorocarbon_lb_m', 'pe_no_m', 'cm_per_turn', 'handle_length_mm', 'bearing_count_roller', 'market_reference_price', 'product_code', 'created_at', 'updated_at', 'spool_diameter_mm', 'spool_width_mm', 'spool_weight_g', 'spool_axis_type', 'knob_size', 'knob_bearing_spec', 'custom_spool_compatibility', 'custom_knob_compatibility', 'official_environment', 'line_capacity_display', 'handle_knob_type', 'handle_knob_exchange_size', 'body_material', 'body_material_tech', 'gear_material', 'battery_capacity', 'battery_charge_time', 'continuous_cast_count', 'usage_environment', 'DRAG', 'Nylon_no_m', 'fluorocarbon_no_m', 'drag_click', 'spool_depth_normalized', 'gear_ratio_normalized', 'brake_type_normalized', 'fit_style_tags', 'min_lure_weight_hint', 'is_compact_body', 'handle_style', 'MAX_DURABILITY', 'type', 'is_sw_edition'];

  const existingMastersByModel = new Map(
    templateMaster.rows.map((row) => [normalizeModelKey(row.model), row])
  );
  const existingMastersById = new Map(
    templateMaster.rows.map((row) => [normalizeText(row.id), row])
  );
  const existingDetailsByKey = new Map();
  for (const row of templateDetail.rows) {
    const master = existingMastersById.get(normalizeText(row.reel_id));
    const modelKey = normalizeModelKey(master && master.model);
    const skuKey = normalizeSkuKey(row.SKU);
    if (!modelKey || !skuKey) continue;
    existingDetailsByKey.set(`${modelKey}::${skuKey}`, row);
  }

  const existingMasterIds = templateMaster.rows
    .map((row) => parseIdNumber(row.id, MASTER_PREFIX))
    .filter((value) => Number.isFinite(value));
  const existingDetailIds = templateDetail.rows
    .map((row) => parseIdNumber(row.id, DETAIL_PREFIX))
    .filter((value) => Number.isFinite(value));

  let nextMasterId = existingMasterIds.length ? Math.max(...existingMasterIds) + 1 : 5000;
  let nextDetailId = existingDetailIds.length ? Math.max(...existingDetailIds) + 1 : 50000;

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const masterRows = [];
  const detailRows = [];
  const masterIdByModel = new Map();

  for (const item of grouped) {
    const modelKey = normalizeModelKey(item.model_name);
    const existingMaster = existingMastersByModel.get(modelKey) || {};
    const masterId = normalizeText(existingMaster.id) || `${MASTER_PREFIX}${nextMasterId++}`;
    const prices = (item.variants || [])
      .map((variant) => parsePriceNumber(variant.specs && variant.specs.price))
      .filter((value) => Number.isFinite(value));

    const masterRow = {};
    for (const header of masterHeaders) masterRow[header] = '';

    masterRow.id = masterId;
    masterRow.brand_id = BRAND_ID;
    masterRow.is_show = normalizeText(existingMaster.is_show) || '1';
    masterRow.model = normalizeText(item.model_name);
    masterRow.model_cn = normalizeText(existingMaster.model_cn);
    masterRow.model_year = normalizeText(item.model_year) || normalizeText(existingMaster.model_year);
    masterRow.alias = normalizeText(existingMaster.alias);
    masterRow.type_tips = normalizeText(existingMaster.type_tips);
    masterRow.type = 'baitcasting';
    masterRow.images = buildMasterImages(existingMaster, item);
    masterRow.created_at = normalizeText(existingMaster.created_at) || normalizeText(item.scraped_at) || now;
    masterRow.updated_at = normalizeText(item.scraped_at) || now;
    masterRow.series_positioning = deriveSeriesPositioning(item, existingMaster.series_positioning, prices);
    masterRow.main_selling_points = deriveMainSellingPoints(item.description, existingMaster.main_selling_points);
    masterRow.official_reference_price = formatPriceRange(prices);
    masterRow.market_status = normalizeText(existingMaster.market_status) || '在售';
    masterRow.Description = normalizeText(item.description) || normalizeText(existingMaster.Description);

    masterRows.push(masterRow);
    masterIdByModel.set(modelKey, masterId);

    for (const variant of item.variants || []) {
      const sku = normalizeText(variant.variant_name);
      const detailKey = `${modelKey}::${normalizeSkuKey(sku)}`;
      const existingDetail = existingDetailsByKey.get(detailKey) || {};
      const specs = variant.specs || {};
      const spool = parseSpoolDimensions(specs.spool_diameter_stroke_mm);
      const officialEnvironment = parseEnvironment(item.official_environment);
      const gearRatioNormalized = normalizeGearRatio(specs.gear_ratio);
      const brakeType = normalizeBrakeType(item, variant);
      const fitStyleTags = deriveFitStyleTags(item, variant);
      const spoolDepth = normalizeSpoolDepth(item, variant);
      const lineCapacityDisplay = buildLineCapacityDisplay(specs);
      const usageEnvironment = normalizeText(existingDetail.usage_environment) || officialEnvironment;
      const isSwEdition = officialEnvironment && officialEnvironment !== '淡水路亚' ? '是' : normalizeText(existingDetail.is_sw_edition);
      const isCompactBody = /紧凑/.test([item.description, item.model_name, variant.variant_name].join(' ')) ? '是' : normalizeText(existingDetail.is_compact_body);

      const detailRow = {};
      for (const header of detailHeaders) detailRow[header] = '';

      detailRow.id = normalizeText(existingDetail.id) || `${DETAIL_PREFIX}${nextDetailId++}`;
      const experimentDetail = experimentProposals.get(detailRow.id) || {};
      detailRow.reel_id = masterIdByModel.get(modelKey);
      detailRow.SKU = sku;
      detailRow['GEAR RATIO'] = normalizeText(specs.gear_ratio);
      detailRow['MAX DRAG'] = normalizeText(specs.max_drag_kg);
      detailRow.WEIGHT = normalizeText(specs.weight_g);
      detailRow.spool_diameter_per_turn_mm = normalizeText(specs.spool_diameter_stroke_mm);
      detailRow.Nylon_lb_m = normalizeText(specs.nylon_lb_m);
      detailRow.fluorocarbon_lb_m = normalizeText(specs.fluoro_lb_m);
      detailRow.pe_no_m = normalizeText(specs.pe_no_m);
      detailRow.cm_per_turn = normalizeText(specs.cm_per_turn);
      detailRow.handle_length_mm = normalizeText(specs.handle_length_mm);
      detailRow.bearing_count_roller = normalizeText(specs.bearings);
      detailRow.market_reference_price = normalizeText(specs.price);
      detailRow.product_code = normalizeText(specs.product_code);
      detailRow.created_at = normalizeText(existingDetail.created_at) || normalizeText(item.scraped_at) || now;
      detailRow.updated_at = normalizeText(item.scraped_at) || now;
      detailRow.spool_diameter_mm = spool.diameter || normalizeText(existingDetail.spool_diameter_mm);
      detailRow.spool_width_mm = spool.width || normalizeText(existingDetail.spool_width_mm);
      detailRow.spool_weight_g = normalizeText(existingDetail.spool_weight_g);
      detailRow.spool_axis_type = normalizeText(existingDetail.spool_axis_type);
      detailRow.knob_size = normalizeText(existingDetail.knob_size);
      detailRow.knob_bearing_spec = normalizeText(existingDetail.knob_bearing_spec);
      detailRow.custom_spool_compatibility = normalizeText(existingDetail.custom_spool_compatibility);
      detailRow.custom_knob_compatibility = normalizeText(existingDetail.custom_knob_compatibility);
      detailRow.official_environment = officialEnvironment || normalizeText(existingDetail.official_environment);
      detailRow.line_capacity_display = lineCapacityDisplay || normalizeText(existingDetail.line_capacity_display);
      detailRow.handle_knob_type = normalizeText(existingDetail.handle_knob_type);
      detailRow.handle_knob_exchange_size = normalizeText(existingDetail.handle_knob_exchange_size);
      detailRow.body_material = normalizeText(existingDetail.body_material) || normalizeText(experimentDetail.body_material);
      detailRow.body_material_tech = normalizeText(existingDetail.body_material_tech) || normalizeText(experimentDetail.body_material_tech);
      detailRow.gear_material = normalizeText(existingDetail.gear_material) || normalizeText(experimentDetail.gear_material);
      detailRow.battery_capacity = normalizeText(existingDetail.battery_capacity);
      detailRow.battery_charge_time = normalizeText(existingDetail.battery_charge_time);
      detailRow.continuous_cast_count = normalizeText(existingDetail.continuous_cast_count);
      detailRow.usage_environment = usageEnvironment;
      detailRow.DRAG = normalizeText(existingDetail.DRAG);
      detailRow.Nylon_no_m = normalizeText(specs.nylon_no_m);
      detailRow.fluorocarbon_no_m = normalizeText(specs.fluoro_no_m);
      detailRow.drag_click = normalizeText(existingDetail.drag_click);
      detailRow.spool_depth_normalized = spoolDepth || normalizeText(existingDetail.spool_depth_normalized);
      detailRow.gear_ratio_normalized = gearRatioNormalized || normalizeText(existingDetail.gear_ratio_normalized);
      detailRow.brake_type_normalized = brakeType || normalizeText(existingDetail.brake_type_normalized);
      detailRow.fit_style_tags = fitStyleTags || normalizeText(existingDetail.fit_style_tags);
      detailRow.min_lure_weight_hint = normalizeText(existingDetail.min_lure_weight_hint);
      detailRow.is_compact_body = isCompactBody;
      detailRow.handle_style = normalizeText(existingDetail.handle_style);
      detailRow.MAX_DURABILITY = normalizeText(specs.max_durability_kg);
      detailRow.type = 'baitcasting';
      detailRow.is_sw_edition = isSwEdition;

      detailRows.push(detailRow);
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(masterRows, { header: masterHeaders }),
    MASTER_SHEET
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(detailRows, { header: detailHeaders }),
    DETAIL_SHEET
  );

  XLSX.writeFile(workbook, OUTPUT_FILE);
  console.log(`[To Excel] Saved ${masterRows.length} master rows and ${detailRows.length} detail rows to ${OUTPUT_FILE}`);
}

main();
