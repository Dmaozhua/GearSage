const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const RAW_DATA_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_reel_normalized.json');
const OUTPUT_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_reel_import.xlsx');
const STATIC_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/images/megabass_reels/';

function normalizeText(text) {
  return String(text || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferType(item) {
  const model = normalizeText(item.model || item.model_name).toUpperCase();
  const url = normalizeText(item.source_url).toLowerCase();
  if (/MONOBLOCK|PAGANI/.test(model)) return 'drum';
  if (model === 'LIN258HM' || model === 'RC-IDATEN 256') return 'spinning';
  if (/^GAUS\b/.test(model)) return 'spinning';
  if (url.includes('/gaus')) return 'spinning';
  return 'baitcasting';
}

function buildImageUrl(item) {
  const localImagePath = normalizeText(item.local_image_path);
  if (localImagePath) {
    const filename = localImagePath.split('/').pop();
    if (filename) return `${STATIC_PREFIX}${encodeURIComponent(filename)}`;
  }
  const mainImageUrl = normalizeText(item.main_image_url);
  if (!mainImageUrl) return '';
  const filename = mainImageUrl.split('/').pop();
  return filename ? `${STATIC_PREFIX}${encodeURIComponent(filename)}` : '';
}

function extractPriceYen(text) {
  const normalized = normalizeText(text);
  const digits = normalized.replace(/[^\d]/g, '');
  if (!digits) return '';
  return `¥${Number(digits).toLocaleString('en-US')}`;
}

function extractWeightG(text) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*g\b/i) || normalized.match(/\((\d+(?:\.\d+)?)g\)/i);
  return match ? match[1] : '';
}

function extractMaxDragKg(text) {
  const normalized = normalizeText(text);
  const kg = normalized.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kg) return kg[1];
  const lb = normalized.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lb) return (Math.round((Number(lb[1]) * 0.45359237) * 10) / 10).toFixed(1).replace(/\.0$/, '');
  return '';
}

function extractRetrieveCm(text) {
  const normalized = normalizeText(text);
  const cm = normalized.match(/(\d+(?:\.\d+)?)\s*cm\b/i);
  if (cm) return cm[1];
  const inches = normalized.match(/(\d+(?:\.\d+)?)\s*in\b/i);
  if (inches) return String(Math.round(Number(inches[1]) * 2.54));
  return '';
}

function looksLikeLineCapacity(text) {
  const normalized = normalizeText(text);
  return /(lb\.?|lb\b).*(yd|yards|m\b)/i.test(normalized);
}

function extractBearings(text) {
  const normalized = normalizeText(text).replace(/\s+/g, '');
  const both = normalized.match(/(\d+)\s*BB[:/, ]*(\d+)\s*RB/i);
  if (both) return `${both[1]}/${both[2]}`;
  const bbOnly = normalized.match(/(\d+)\s*BB\b/i);
  if (bbOnly) return `${bbOnly[1]}/0`;
  const rbOnly = normalized.match(/(\d+)\s*RB\b/i);
  if (rbOnly) return `0/${rbOnly[1]}`;
  return '';
}

function normalizeLineCapacity(text) {
  return normalizeText(text)
    .replace(/\s*,\s*/g, ' / ')
    .replace(/\s+/g, ' ');
}

function buildMasterPrice(item) {
  const prices = (item.variants || [])
    .map((variant) => extractPriceYen(variant?.specs?.price))
    .map((value) => value.replace(/[^\d]/g, ''))
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!prices.length) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? `¥${min.toLocaleString('en-US')}`
    : `¥${min.toLocaleString('en-US')} - ¥${max.toLocaleString('en-US')}`;
}

function processReel() {
  if (!fs.existsSync(RAW_DATA_PATH)) {
    console.error(`Raw data not found: ${RAW_DATA_PATH}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf-8'));
  const reelMaster = [];
  const spinningDetails = [];
  const baitcastingDetails = [];

  let masterCounter = 5000;
  let detailCounter = 50000;

  for (const item of rawData) {
    if (!Array.isArray(item.variants) || item.variants.length === 0) continue;

    const type = inferType(item);
    const masterId = `MRE${masterCounter++}`;
    const createdAt = normalizeText(item.scraped_at);

    reelMaster.push({
      id: masterId,
      brand_id: BRAND_IDS.MEGABASS,
      model: normalizeText(item.model),
      model_cn: '',
      model_year: '',
      alias: '',
      type_tips: '',
      type,
      images: buildImageUrl(item),
      created_at: createdAt,
      updated_at: createdAt,
      series_positioning: '',
      main_selling_points: Array.isArray(item.main_selling_points) ? item.main_selling_points.join(' / ') : '',
      official_reference_price: buildMasterPrice(item),
      market_status: '在售',
      Description: normalizeText(item.intro_text),
      market_reference_price: '',
      player_positioning: '',
      player_selling_points: '',
    });

    for (const variant of item.variants) {
      const specs = variant.specs || {};
      const rawLine = normalizeText(specs.line || specs['line capacity'] || specs['line capa']);
      const rawLineOrHandleTurn = normalizeText(specs['line /handle turn'] || specs['line/handle turn'] || specs.retrieve);
      const resolvedLine = rawLine || (looksLikeLineCapacity(rawLineOrHandleTurn) ? rawLineOrHandleTurn : '');
      const resolvedRetrieve = rawLine ? extractRetrieveCm(rawLineOrHandleTurn) : (looksLikeLineCapacity(rawLineOrHandleTurn) ? '' : extractRetrieveCm(rawLineOrHandleTurn));
      const common = {
        id: `MRED${detailCounter++}`,
        reel_id: masterId,
        SKU: normalizeText(variant.name) || normalizeText(item.model),
        'GEAR RATIO': normalizeText(specs['gear ratio'] || specs['gear ratio:']).replace(/:1$/, ''),
        'MAX DRAG': extractMaxDragKg(specs['drag max'] || specs['max drag']),
        WEIGHT: extractWeightG(specs.weight),
        spool_diameter_per_turn_mm: '',
        cm_per_turn: resolvedRetrieve,
        handle_length_mm: normalizeText(specs.handle),
        bearing_count_roller: extractBearings(specs.bearings || specs.bearing),
        market_reference_price: extractPriceYen(specs.price),
        product_code: '',
        created_at: createdAt,
        updated_at: createdAt,
        drag_click: '',
        spool_depth_normalized: '',
        gear_ratio_normalized: '',
        brake_type_normalized: '',
        fit_style_tags: '',
        min_lure_weight_hint: '',
        is_compact_body: '',
        handle_style: '',
        MAX_DURABILITY: '',
        type,
      };

      if (type === 'spinning') {
        spinningDetails.push({
          ...common,
          DRAG: '',
          spool_diameter_mm: '',
          Nylon_no_m: '',
          Nylon_lb_m: normalizeLineCapacity(resolvedLine),
          fluorocarbon_no_m: '',
          fluorocarbon_lb_m: '',
          pe_no_m: normalizeLineCapacity(specs.pe || specs['pe line']),
          body_material: '',
          body_material_tech: '',
          gear_material: '',
          handle_knob_type: '',
          official_environment: '',
          line_capacity_display: '',
          variant_description: '',
          Description: normalizeText(item.intro_text),
          player_environment: '',
          is_handle_double: '',
          EV_link: '',
          Specs_link: '',
          spool_weight_g: '',
          is_sw_edition: '',
        });
      } else {
        baitcastingDetails.push({
          ...common,
          Nylon_lb_m: normalizeLineCapacity(resolvedLine),
          fluorocarbon_lb_m: '',
          pe_no_m: normalizeLineCapacity(specs.pe || specs['pe line']),
          spool_diameter_mm: '',
          spool_width_mm: '',
          spool_weight_g: '',
          handle_knob_type: '',
          handle_knob_exchange_size: normalizeText(specs.type).includes('LEFT HANDLE / RIGHT HANDLE') ? 'L/R' : '',
          body_material: '',
          body_material_tech: '',
          gear_material: '',
          battery_capacity: '',
          battery_charge_time: '',
          continuous_cast_count: '',
          usage_environment: '',
          DRAG: '',
          Nylon_no_m: '',
          fluorocarbon_no_m: '',
          official_environment: '',
          player_environment: '',
          is_handle_double: '',
          is_sw_edition: '',
          line_capacity_display: '',
        });
      }
    }
  }

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(reelMaster, { header: HEADERS.reelMaster }), SHEET_NAMES.reel);
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(spinningDetails, { header: HEADERS.spinningReelDetail }), SHEET_NAMES.spinningReelDetail);
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(baitcastingDetails, { header: HEADERS.baitcastingReelDetail }), SHEET_NAMES.baitcastingReelDetail);

  xlsx.writeFile(wb, OUTPUT_PATH);
  console.log(`Generated Excel file at: ${OUTPUT_PATH}`);
  console.log(`Master: ${reelMaster.length}, spinning detail: ${spinningDetails.length}, baitcasting detail: ${baitcastingDetails.length}`);
}

processReel();
