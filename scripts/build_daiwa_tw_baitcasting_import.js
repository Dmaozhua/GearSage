const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer-core');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const LIST_URL = 'https://www.daiwaseiko.com.tw/product-list/reel/double_shaft//';
const OUTPUT_FILE = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_import.xlsx';
const OUTPUT_JSON = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_baitcasting_normalized.json';
const IMAGE_DIR = '/Users/tommy/Pictures/images/daiwa_reels';
const STATIC_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/images/daiwa_reels/';
const BROWSER = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OCR_SWIFT = '/Users/tommy/GearSage/scripts/ocr_apple_vision.swift';
const SPEC_CACHE_DIR = '/tmp/daiwa_tw_bc_spec_ocr';
const TARGET_MODELS = new Set(
  String(process.env.DAIWA_BC_TARGET_MODELS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
);

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanModelText(text) {
  return normalizeText(String(text || '').split('\n')[0])
    .replace(/\s*¥.*$/, '')
    .replace(/^\d{2}\s*/, '')
    .replace(/\s+\d{2}\s*\/\s*\d{2}$/, '')
    .trim();
}

function sanitizeFilename(name) {
  return String(name || '').replace(/[\\/*?:"<>|]/g, '_').trim();
}

function extractYear(text) {
  const m = normalizeText(text).match(/\b(20\d{2}|\d{2})\b/);
  if (!m) return '';
  const raw = m[1];
  return raw.length === 4 ? raw : `20${raw}`;
}

function buildAlias(year, model) {
  return year ? `${year.slice(-2)} ${normalizeText(model)}` : '';
}

function formatPrice(value) {
  const text = normalizeText(value).replace(/[^\d]/g, '');
  if (!text) return '';
  return `¥${Number(text).toLocaleString('en-US')}`;
}

function getBaitcastingSpoolWeight(model, sku = '') {
  const text = normalizeText(model);
  const skuText = normalizeText(sku).toUpperCase();
  if (/ALPHAS BF TW/i.test(text)) return '11.0';
  if (/STEEZ SV TW/i.test(text)) return '11.0';
  if (/ZILLION SV TW/i.test(text)) return '13.0';
  if (/STEEZ CT SV TW/i.test(text)) return '8.0';
  if (/RYOGA/i.test(text)) {
    if (/^(SV\s*)?100/i.test(skuText)) return '14.0';
    if (/^150/i.test(skuText)) return '17.0';
  }
  return '';
}

function downloadFile(url, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  execFileSync('curl', ['-k', '-L', '-A', 'Mozilla/5.0', '--max-time', '45', '-o', outPath, url], {
    stdio: 'ignore',
  });
}

async function downloadFileWithBrowser(url, outPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: BROWSER,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const base64 = await page.evaluate(async (targetUrl) => {
      const resp = await fetch(targetUrl);
      if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
      const buf = await resp.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    }, url);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
  } finally {
    await browser.close();
  }
}

async function saveImageFromPage(page, url, outPath) {
  const base64 = await page.evaluate(async (targetUrl) => {
    const resp = await fetch(targetUrl);
    if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
    const buf = await resp.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }, url);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
}

function ocrImage(imagePath) {
  try {
    return execFileSync('swift', [OCR_SWIFT, imagePath], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch {
    return '';
  }
}

function ocrImageJson(imagePath) {
  try {
    return JSON.parse(
      execFileSync('swift', [OCR_SWIFT, imagePath, '--json'], {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      })
    );
  } catch {
    return null;
  }
}

function uniquePreserve(values) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const normalized = normalizeText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function extractMainSellingPoints(introText, maxCount = 4) {
  const sentences = String(introText || '')
    .split(/[。.!！?？]/)
    .map((s) => normalizeText(s))
    .filter((s) => s.length >= 12);
  return uniquePreserve(sentences).slice(0, maxCount).join(' / ');
}

function normalizeRatio(value) {
  const text = normalizeText(value).replace(/:1$/, '');
  if (/^\d\.\d$/.test(text)) return text;
  if (/^\d{2}$/.test(text)) return `${text[0]}.${text[1]}`;
  return text;
}

function normalizeCapacityToken(value) {
  const text = normalizeText(value).replace(/[:/]/g, '-').replace(/(\d)\s+(\d)/g, '$1-$2');
  return /^\d+(?:\.\d+)?-\d+$/.test(text) ? text : '';
}

function normalizeBaitcastingSku(text, model) {
  const raw = normalizeText(text)
    .replace(/\s+\d{2,4}$/, '');
  if (!raw) return '';
  const compactRaw = raw.replace(/\s+/g, '').toUpperCase();
  const compactModel = normalizeText(model).replace(/\s+/g, '').toUpperCase();

  if (compactModel && compactRaw.startsWith(compactModel)) {
    const tail = raw.match(/(\d+[A-Z-]*)$/i);
    if (tail) return tail[1].toUpperCase();
  }

  if (/^[A-Z]{1,4}\s+\d+[A-Z-]*$/i.test(raw)) return raw.toUpperCase();
  if (/^\d+[A-Z-]+$/i.test(raw)) return raw.toUpperCase();
  if (/^\d+[RLHPX-]*$/i.test(raw)) return raw.toUpperCase();
  if (/^[A-Z]+\s*\d+[A-Z-]*$/i.test(raw)) return raw.toUpperCase();
  return raw.toUpperCase();
}

function isBcVariantAnchor(text, model) {
  const value = normalizeText(text);
  if (!value) return false;
  if (!/[0-9]/.test(value)) return false;
  if (/^(型號|重量|收線長|齒輪比|齒|標準捲線量|手把|軸承|最大|握丸|機體|齒輪|使用|建議|JAN|發售時間)/.test(value)) return false;
  if (/^[0-9.,/ -]+$/.test(value)) return false;
  if (value.length > 30) return false;
  if (normalizeText(model) && normalizeText(value) === normalizeText(model)) return false;
  return true;
}

function dedupeAnchorsByY(anchors) {
  const out = [];
  for (const item of anchors.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.y - item.y) < 0.03) {
      if (String(item.text).length > String(last.text).length) out[out.length - 1] = item;
      continue;
    }
    out.push(item);
  }
  return out;
}

function parsePriceAndCode(texts) {
  const joined = texts.join(' ');
  const priceMatch = joined.match(/\b(\d{1,3}(?:,\d{3})|\d{4,6})\b/);
  const codeMatch = joined.match(/\b([0-9A-Z]{7,14})\b/g);
  return {
    official_reference_price: priceMatch ? formatPrice(priceMatch[1]) : '',
    product_code: codeMatch && codeMatch.length ? codeMatch[codeMatch.length - 1] : '',
  };
}

function inferCapacityHeaders(headerItems) {
  const bands = [
    { key: 'cap1', min: 0.18, max: 0.26 },
    { key: 'cap2', min: 0.26, max: 0.33 },
    { key: 'cap3', min: 0.33, max: 0.40 },
  ];
  const mapping = {};
  for (const band of bands) {
    const text = uniquePreserve(
      headerItems
        .filter((item) => item.x >= band.min && item.x < band.max)
        .map((item) => item.text)
    ).join(' ');
    if (/尼|ナイロン/i.test(text) && /lb|ib/i.test(text)) mapping[band.key] = 'Nylon_lb_m';
    else if (/尼|ナイロン/i.test(text) && /號|号/i.test(text)) mapping[band.key] = 'Nylon_no_m';
    else if (/氟|フロロ/i.test(text) && /lb|ib/i.test(text)) mapping[band.key] = 'fluorocarbon_lb_m';
    else if (/氟|フロロ/i.test(text) && /號|号/i.test(text)) mapping[band.key] = 'fluorocarbon_no_m';
    else if (/PE/i.test(text)) mapping[band.key] = 'pe_no_m';
  }
  return mapping;
}

function parseUsageEnvironment(text) {
  const normalized = normalizeText(text);
  if (!normalized) return '';
  if (/海水/.test(normalized) && /淡水/.test(normalized)) return '淡海水';
  if (/海水/.test(normalized)) return '海水';
  if (/淡水/.test(normalized)) return '淡水';
  return normalized;
}

function parseBodyMaterial(text) {
  const normalized = normalizeText(text);
  if (!normalized) return '';
  if (/鋁|铝|ALUMINUM/i.test(normalized)) return '鋁';
  if (/黃銅|铜|BRASS/i.test(normalized)) return '黃銅';
  return normalized;
}

function itemsFromOcr(ocr) {
  return (ocr?.items || [])
    .map((item) => ({
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      text: normalizeText(item.text),
    }))
    .filter((item) => item.text);
}

function buildAnchorGroups(items, anchors, startY = 0.3) {
  const sorted = anchors.sort((a, b) => a.y - b.y || a.x - b.x);
  const midpoints = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    midpoints.push((sorted[i].y + sorted[i + 1].y) / 2);
  }
  return sorted.map((anchor, idx) => {
    const top = idx === 0 ? startY : midpoints[idx - 1];
    const bottom = idx === sorted.length - 1 ? 1.02 : midpoints[idx];
    return {
      anchor,
      items: items.filter((item) => item.y >= top && item.y < bottom),
    };
  });
}

function bandTexts(group, min, max) {
  return uniquePreserve(group.items.filter((item) => item.x >= min && item.x < max).map((item) => item.text));
}

function bandFirst(group, min, max, matcher = null) {
  const texts = bandTexts(group, min, max);
  if (!matcher) return texts[0] || '';
  return texts.find((text) => matcher.test(text)) || '';
}

function parsePriceCodeFromBand(group, min, max) {
  const joined = bandTexts(group, min, max).join(' ');
  const price = formatPrice((joined.match(/\b(\d{1,3}(?:,\d{3})|\d{4,6})\b/) || [])[1] || '');
  const codes = joined.match(/\b([0-9A-Z]{7,14})\b/g) || [];
  return {
    official_reference_price: price,
    product_code: codes.length ? codes[codes.length - 1] : '',
  };
}

function parseSilverWolfPeSpecial(ocr, model, introText) {
  const items = itemsFromOcr(ocr);
  const anchors = items.filter((item) => item.x < 0.08 && item.y > 0.5 && /^[0-9.]+[RL]$/i.test(item.text));
  if (anchors.length !== 2) return [];
  const groups = buildAnchorGroups(items, anchors, 0.48);
  return groups.map((group) => {
    const priceCode = parsePriceCodeFromBand(group, 0.74, 1.01);
    return {
      sku: normalizeBaitcastingSku(group.anchor.text, model),
      description: '',
      specs: {
        gear_ratio: normalizeRatio(bandFirst(group, 0.22, 0.30)),
        weight_g: bandFirst(group, 0.08, 0.14, /^\d+$/),
        max_drag_kg: bandFirst(group, 0.60, 0.66, /^\d+(?:\.\d+)?$/),
        retrieve_per_turn_cm: bandFirst(group, 0.15, 0.22, /^\d+$/),
        handle_length_mm: bandFirst(group, 0.42, 0.49, /^\d+$/),
        bearing_count_roller: bandFirst(group, 0.51, 0.58, /\d+\/\d+/),
        pe_no_m: bandTexts(group, 0.31, 0.40).map(normalizeCapacityToken).filter(Boolean).join(' / '),
        spool_diameter_mm: bandFirst(group, 0.67, 0.74, /^\d+$/),
        spool_width_mm: '',
        handle_knob_type: '',
        handle_knob_exchange_size: '',
        body_material: /鎂|Mg/i.test(introText) ? '鎂' : '鋁',
        gear_material: /黃銅|BRASS/i.test(introText) ? '黃銅' : '',
        usage_environment: '海水',
        drag_click: /出線聲|DRAG CLICK/i.test(introText) ? '1' : '',
        ...priceCode,
      },
    };
  });
}

function parseTatulaBf(ocr, model, introText) {
  const items = itemsFromOcr(ocr);
  const anchors = items.filter((item) => item.x < 0.06 && item.y > 0.5 && /^81[RL]$/i.test(item.text));
  if (anchors.length !== 2) return [];
  const groups = buildAnchorGroups(items, anchors, 0.48);
  return groups.map((group) => {
    const priceCode = parsePriceCodeFromBand(group, 0.83, 1.01);
    const spoolSize = bandFirst(group, 0.55, 0.62, /\d+\/\d+/);
    const [spoolDiameter, spoolWidth] = /^\d+\/\d+$/.test(spoolSize) ? spoolSize.split('/') : ['', ''];
    return {
      sku: normalizeBaitcastingSku(group.anchor.text, model),
      description: '',
      specs: {
        gear_ratio: normalizeRatio(bandFirst(group, 0.145, 0.19, /^\d+(?:\.\d+)?$/)),
        weight_g: bandFirst(group, 0.04, 0.09, /^\d+$/),
        max_drag_kg: bandFirst(group, 0.50, 0.55, /^\d+(?:\.\d+)?$/),
        retrieve_per_turn_cm: bandFirst(group, 0.10, 0.145, /^\d+$/),
        handle_length_mm: bandFirst(group, 0.40, 0.45, /^\d+$/),
        bearing_count_roller: bandFirst(group, 0.45, 0.50, /\d+\/\d+/),
        Nylon_lb_m: bandTexts(group, 0.19, 0.25).map(normalizeCapacityToken).filter(Boolean).join(' / '),
        pe_no_m: bandTexts(group, 0.25, 0.33).map(normalizeCapacityToken).filter(Boolean).join(' / '),
        spool_diameter_mm: spoolDiameter,
        spool_width_mm: spoolWidth,
        handle_knob_type: normalizeText(bandTexts(group, 0.61, 0.67).join(' ')),
        handle_knob_exchange_size: normalizeText(bandTexts(group, 0.67, 0.71).join(' ')).toUpperCase(),
        body_material: '鋁',
        gear_material: /黃銅|BRASS/i.test(introText) ? '黃銅' : '黃銅',
        usage_environment: '海水',
        drag_click: /出線警示音|DRAG CLICK/i.test(introText) ? '1' : '',
        ...priceCode,
      },
    };
  });
}

function parseGekkabijinBf(ocr, model, introText) {
  const items = itemsFromOcr(ocr);
  const anchors = items.filter((item) => item.x < 0.16 && item.y > 0.45 && /8\.5[RL]/i.test(item.text));
  if (anchors.length !== 2) return [];
  const groups = buildAnchorGroups(items, anchors, 0.42);
  return groups.map((group) => {
    const priceCode = parsePriceCodeFromBand(group, 0.80, 1.01);
    return {
      sku: normalizeText(group.anchor.text)
        .replace(/^\d{2}/, '')
        .replace(/^月下美人\s*BF\s*TW\s*/i, '')
        .trim()
        .toUpperCase(),
      description: '',
      specs: {
        gear_ratio: normalizeRatio(bandFirst(group, 0.39, 0.45, /^\d+(?:\.\d+)?$/)),
        weight_g: bandFirst(group, 0.25, 0.31, /^\d+$/),
        max_drag_kg: bandFirst(group, 0.69, 0.73, /^\d+(?:\.\d+)?$/),
        retrieve_per_turn_cm: bandFirst(group, 0.33, 0.38, /^\d+$/),
        handle_length_mm: bandFirst(group, 0.54, 0.58, /^\d+$/),
        bearing_count_roller: bandFirst(group, 0.60, 0.66, /\d+\/\d+/),
        pe_no_m: bandTexts(group, 0.45, 0.52).map(normalizeCapacityToken).filter(Boolean).join(' / '),
        spool_diameter_mm: bandFirst(group, 0.74, 0.79, /^\d+$/),
        spool_width_mm: '',
        handle_knob_type: '',
        handle_knob_exchange_size: '',
        body_material: /鎂|Mg/i.test(introText) ? '鎂' : '鋁',
        gear_material: '',
        usage_environment: '海水',
        drag_click: /出線警示音|DRAG CLICK/i.test(introText) ? '1' : '',
        ...priceCode,
      },
    };
  });
}

function parseSteezSvLight(ocr, model, introText) {
  const items = itemsFromOcr(ocr);
  const anchors = items.filter((item) => item.x < 0.12 && item.y > 0.3 && /^(100H|100HL|100XXH|100XXHL(?:\s+\d+)?)$/i.test(item.text));
  if (anchors.length !== 4) return [];
  const groups = buildAnchorGroups(items, anchors, 0.30);
  return groups.map((group) => {
    const priceCode = parsePriceCodeFromBand(group, 0.81, 1.01);
    const spoolSize = bandFirst(group, 0.59, 0.67, /\d+\/\d+(?:\.\d+)?/);
    const [spoolDiameter, spoolWidth] = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(spoolSize) ? spoolSize.split('/') : ['', ''];
    return {
      sku: normalizeBaitcastingSku(group.anchor.text, model),
      description: '',
      specs: {
        gear_ratio: normalizeRatio(bandFirst(group, 0.19, 0.24, /^\d+(?:\.\d+)?$/)),
        weight_g: bandFirst(group, 0.07, 0.12, /^\d+$/) || (group.anchor.text.match(/\b(1[0-9]{2}|[2-9][0-9]{2})\b/) || [])[1] || '',
        max_drag_kg: bandFirst(group, 0.55, 0.59, /^\d+(?:\.\d+)?$/),
        retrieve_per_turn_cm: bandFirst(group, 0.13, 0.18, /^\d+$/),
        handle_length_mm: bandFirst(group, 0.42, 0.46, /^\d+$/),
        bearing_count_roller: bandFirst(group, 0.48, 0.53, /\d+\/\d+/),
        Nylon_lb_m: bandTexts(group, 0.33, 0.42).map(normalizeCapacityToken).filter(Boolean).join(' / '),
        pe_no_m: bandTexts(group, 0.25, 0.33).map(normalizeCapacityToken).filter(Boolean).join(' / '),
        spool_diameter_mm: spoolDiameter,
        spool_width_mm: spoolWidth,
        handle_knob_type: '高抓握 I形輕量',
        handle_knob_exchange_size: normalizeText(bandTexts(group, 0.73, 0.76).join(' ')).toUpperCase(),
        body_material: '鋁',
        gear_material: '',
        usage_environment: '海水',
        drag_click: /出線警示音|DRAG CLICK/i.test(introText) ? '1' : '',
        ...priceCode,
      },
    };
  });
}

function parseRyoga() {
  return [
    ['SV 100P', '5.3', '265', '56', '12-100 / 14-90 / 16-80', '2-150 / 3-90', '90', '8/1', '6.0', '34', '24', 'HG-I形 強力大型', 'S', '鋁', '黃銅', '海水', '¥67,500', '4550133217210'],
    ['SV 100PL', '5.3', '265', '56', '12-100 / 14-90 / 16-80', '2-150 / 3-90', '90', '8/1', '6.0', '34', '24', 'HG-I形 強力大型', 'S', '鋁', '黃銅', '海水', '¥67,500', '4550133217227'],
    ['SV 100', '6.3', '265', '67', '12-100 / 14-90 / 16-80', '2-150 / 3-90', '90', '8/1', '6.0', '34', '24', 'HG-I形 強力大型', 'S', '鋁', '黃銅', '海水', '¥67,500', '4550133217234'],
    ['SV 100L', '6.3', '265', '67', '12-100 / 14-90 / 16-80', '2-150 / 3-90', '90', '8/1', '6.0', '34', '24', 'HG-I形 強力大型', 'S', '鋁', '黃銅', '海水', '¥67,500', '4550133217241'],
    ['150P', '5.3', '285', '59', '16-125 / 20-100 / 25-80', '2-230 / 3-150 / 4-100', '90', '8/1', '6.0', '36', '27', 'HG-I形 強力大型', 'S', '鋁', '黃銅', '海水', '¥68,000', '4550133217258'],
    ['150PL', '5.3', '285', '59', '16-125 / 20-100 / 25-80', '2-230 / 3-150 / 4-100', '90', '8/1', '6.0', '36', '27', 'HG-I形 強力大型', 'S', '鋁', '黃銅', '海水', '¥68,000', '4550133217265'],
    ['150H', '7.3', '290', '82', '16-125 / 20-100 / 25-80', '2-230 / 3-150 / 4-100', '100', '8/1', '6.0', '36', '27', '強力輕量 M中型', 'S', '鋁', '黃銅', '海水', '¥68,000', '4550133217272'],
    ['150HL', '7.3', '290', '82', '16-125 / 20-100 / 25-80', '2-230 / 3-150 / 4-100', '100', '8/1', '6.0', '36', '27', '強力輕量 M中型', 'S', '鋁', '黃銅', '海水', '¥68,000', '4550133217289'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseSaltiga10(ocr, model, introText) {
  const items = itemsFromOcr(ocr);
  const anchors = items.filter((item) => item.x < 0.18 && item.y > 0.3 && /25SALTIGA 10(?:L|H|HL)?/i.test(item.text));
  if (anchors.length !== 4) return [];
  const groups = buildAnchorGroups(items, anchors, 0.30);
  return groups.map((group) => {
    const allText = bandTexts(group, 0.0, 1.01).join(' ');
    const priceCode = parsePriceCodeFromBand(group, 0.79, 1.01);
    const mergedPriceCode = {
      official_reference_price: priceCode.official_reference_price || formatPrice((allText.match(/\b(\d{1,3}(?:,\d{3})|\d{4,6})\b/) || [])[1] || ''),
      product_code: priceCode.product_code || ((allText.match(/\b(\d{13})\b/) || [])[1] || ''),
    };
    const spoolSize = bandFirst(group, 0.62, 0.69, /\d+\/\d+/);
    const [spoolDiameter, spoolWidth] = /^\d+\/\d+$/.test(spoolSize) ? spoolSize.split('/') : ['', ''];
    return {
      sku: normalizeText(group.anchor.text)
        .replace(/^\d{2}/, '')
        .replace(/^SALTIGA\s*/i, '')
        .replace(/\s+\d{3,4}$/, '')
        .trim()
        .toUpperCase(),
      description: '',
      specs: {
        gear_ratio: normalizeRatio(bandFirst(group, 0.27, 0.32, /^\d+(?:\.\d+)?$/)),
        weight_g: bandFirst(group, 0.13, 0.18, /^\d+$/) || ((group.anchor.text.match(/\b(1[0-9]{2}|[2-9][0-9]{2})\b/) || [])[1] || ''),
        max_drag_kg: bandFirst(group, 0.57, 0.61, /^\d+(?:\.\d+)?$/),
        retrieve_per_turn_cm: bandFirst(group, 0.19, 0.24, /^\d+$/),
        handle_length_mm: normalizeText(bandTexts(group, 0.42, 0.48).join(' / ')),
        bearing_count_roller: bandFirst(group, 0.50, 0.55, /\d+\/\d+/),
        pe_no_m: bandTexts(group, 0.33, 0.41).map(normalizeCapacityToken).filter(Boolean).join(' / '),
        spool_diameter_mm: spoolDiameter,
        spool_width_mm: spoolWidth,
        handle_knob_type: 'TSP',
        handle_knob_exchange_size: 'L',
        body_material: '鋁',
        gear_material: '',
        usage_environment: '海水',
        drag_click: '',
        ...mergedPriceCode,
      },
    };
  });
}

function parseSaltiga35() {
  return [
    ['35', '5.1', '705', '104', '3-600 / 4-500 / 6-300', '100-110', '8/2', '13', '31', '65', 'T形動力（L）', 'L', '鋁', '海水', '¥86,500', '4550133125652'],
    ['35L', '5.1', '705', '104', '3-600 / 4-500 / 6-300', '100-110', '8/2', '13', '31', '65', 'T形動力（L）', 'L', '鋁', '海水', '¥86,500', '4550133125669'],
    ['35H', '5.8', '705', '118', '3-600 / 4-500 / 6-300', '100-110', '8/2', '13', '31', '65', 'T形動力（L）', 'L', '鋁', '海水', '¥86,500', '4550133208065'],
    ['35HL', '5.8', '705', '118', '3-600 / 4-500 / 6-300', '100-110', '8/2', '13', '31', '65', 'T形動力（L）', 'L', '鋁', '海水', '¥86,500', '4550133208072'],
  ].map(([sku, ratio, wt, cm, pe, handle, bear, max, dia, width, knob, exchange, body, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: '',
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseSteezLimitedCt() {
  return [
    ['70XH', '8.5', '160', '80', '8-25~50 / 10-20~40', '1.0-120 / 1.2-100 / 1.5-80', '85', '12/1', '4.5', '30', '21', '高抓握 I形輕型', 'S', '鋁', '海水', '¥82,500', '4550133503139'],
    ['70XHL', '8.5', '160', '80', '8-25~50 / 10-20~40', '1.0-120 / 1.2-100 / 1.5-80', '85', '12/1', '4.5', '30', '21', '高抓握 I形輕型', 'S', '鋁', '海水', '¥82,500', '4550133503146'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: '',
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseSaltiga300() {
  return [
    ['300', '6.3', '420', '86', '1.5-500 / 2.0-400 / 3.0-250', '75-85', '11/1', '10', '24', '44', 'TSP', 'L', '鋁', '海水', '¥63,000', '4550133352850'],
    ['300L', '6.3', '420', '86', '1.5-500 / 2.0-400 / 3.0-250', '75-85', '11/1', '10', '24', '44', 'TSP', 'L', '鋁', '海水', '¥63,000', '4550133352867'],
    ['300H', '7.3', '420', '100', '1.5-500 / 2.0-400 / 3.0-250', '75-85', '11/1', '10', '24', '44', 'TSP', 'L', '鋁', '海水', '¥63,000', '4550133352874'],
    ['300HL', '7.3', '420', '100', '1.5-500 / 2.0-400 / 3.0-250', '75-85', '11/1', '10', '24', '44', 'TSP', 'L', '鋁', '海水', '¥63,000', '4550133352881'],
  ].map(([sku, ratio, wt, cm, pe, handle, bear, max, dia, width, knob, exchange, body, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: '',
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseTatulaSvTw100() {
  return [
    ['100', '6.3', '195', '63', '12-40~80 / 14-35~70', '85', '7/1', '5', '32', '24', '高抓力 I型燈形', 'S', '鋁', '黃銅', '海水', '¥32,400', '4550133256578'],
    ['100L', '6.3', '195', '63', '12-40~80 / 14-35~70', '85', '7/1', '5', '32', '24', '高抓力 I型燈形', 'S', '鋁', '黃銅', '海水', '¥32,400', '4550133256585'],
    ['100H', '7.1', '195', '71', '12-40~80 / 14-35~70', '85', '7/1', '5', '32', '24', '高抓力 I型燈形', 'S', '鋁', '黃銅', '海水', '¥32,400', '4550133256592'],
    ['100HL', '7.1', '195', '71', '12-40~80 / 14-35~70', '85', '7/1', '5', '32', '24', '高抓力 I型燈形', 'S', '鋁', '黃銅', '海水', '¥32,400', '4550133256608'],
    ['100XH', '8.1', '195', '81', '12-40~80 / 14-35~70', '85', '7/1', '5', '32', '24', '高抓力 I型燈形', 'S', '鋁', '黃銅', '海水', '¥32,400', '4550133256615'],
    ['100XHL', '8.1', '195', '81', '12-40~80 / 14-35~70', '85', '7/1', '5', '32', '24', '高抓力 I型燈形', 'S', '鋁', '黃銅', '海水', '¥32,400', '4550133256622'],
  ].map(([sku, ratio, wt, cm, nylon, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseSteezAiiTw() {
  return [
    ['100', '6.3', '190', '67', '14-100 / 16-90', '1.5-180 / 2-150', '90', '10/1', '6', '34', '24', '', '', '鋁', '', '海水', '¥54,000', '4550133309700'],
    ['100L', '6.3', '190', '67', '14-100 / 16-90', '1.5-180 / 2-150', '90', '10/1', '6', '34', '24', '', '', '鋁', '', '海水', '¥54,000', '4550133309717'],
    ['100H', '7.1', '190', '90', '14-100 / 16-90', '1.5-180 / 2-150', '90', '10/1', '6', '34', '24', '', '', '鋁', '', '海水', '¥54,000', '4550133309724'],
    ['100XH', '8.5', '190', '90', '14-100 / 16-90', '1.5-180 / 2-150', '90', '10/1', '5.5', '34', '24', '', '', '鋁', '', '海水', '¥54,000', '4550133309748'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseZillionTwHd() {
  return [
    ['1000HL', '7.1', '200', '75', '16-100 / 20-80', '1.5-200 / 2-155', '100', '10/1', '6', '', '', '', '', '鋁', '', '淡海水', '¥54,500', '3215650'],
    ['1000XH', '8.1', '200', '86', '16-100 / 20-80', '1.5-200 / 2-155', '100', '10/1', '6', '', '', '', '', '鋁', '', '淡海水', '¥54,500', '3215667'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseSaltigaIc() {
  return [
    ['100', '6.3', '310', '70', '1-400 / 2-200', '', '70', '11/1', '7', '', '', '', '', '', '', '淡海水', '¥70,400', '3034688'],
    ['100L', '6.3', '310', '70', '1-400 / 2-200', '', '70', '11/1', '7', '', '', '', '', '', '', '淡海水', '¥70,400', '3034695'],
    ['300', '6.3', '385', '84', '2-400 / 3-250', '', '75-85', '11/1', '10', '', '', '', '', '', '', '淡海水', '¥71,500', '3034701'],
    ['300L', '6.3', '385', '84', '2-400 / 3-250', '', '75-85', '11/1', '10', '', '', '', '', '', '', '淡海水', '¥71,500', '3034718'],
    ['300H-SJ', '7.3', '405', '98', '2-400 / 3-250', '', '85-95', '11/1', '10', '', '', '', '', '', '', '淡海水', '¥71,500', '3034725'],
    ['300HL-SJ', '7.3', '405', '98', '2-400 / 3-250', '', '85-95', '11/1', '10', '', '', '', '', '', '', '淡海水', '¥71,500', '3034732'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseZillionSvTw() {
  return [
    ['1000P', '5.5', '175', '59', '14/45-90 / 16/40-80', '', '90', '8/1', '5', '', '', '', '', '', '', '海水', '¥45,400', '3072512'],
    ['1000', '6.3', '175', '67', '14/45-90 / 16/40-80', '', '90', '8/1', '5', '', '', '', '', '', '', '海水', '¥45,400', '3072536'],
    ['1000L', '6.3', '175', '67', '14/45-90 / 16/40-80', '', '90', '8/1', '5', '', '', '', '', '', '', '海水', '¥45,400', '3072543'],
    ['1000H', '7.1', '175', '75', '14/45-90 / 16/40-80', '', '90', '8/1', '5', '', '', '', '', '', '', '海水', '¥45,400', '3072550'],
    ['1000HL', '7.1', '175', '75', '14/45-90 / 16/40-80', '', '90', '8/1', '5', '', '', '', '', '', '', '海水', '¥45,400', '3072567'],
    ['1000XH', '8.5', '175', '90', '14/45-90 / 16/40-80', '', '90', '8/1', '5', '', '', '', '', '', '', '海水', '¥45,400', '3072574'],
    ['1000XHL', '8.5', '175', '90', '14/45-90 / 16/40-80', '', '90', '8/1', '5', '', '', '', '', '', '', '海水', '¥45,400', '3072581'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseAlphasSv() {
  return [
    ['800H', '7.1', '175', '71', '12/45-90 / 14/40-80 / 8/40-80 / 10/30-65 / 12/25-55', '', '85', '7/1', '4.5', '32', '21', '', '', '', '', '海水', '¥33,700', '4550133072598'],
    ['800S-XHL', '8.5', '175', '85', '12/45-90 / 14/40-80 / 8/40-80 / 10/30-65 / 12/25-55', '', '85', '7/1', '4.5', '32', '21', '', '', '', '', '海水', '¥33,700', '4550133289460'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseLightGameIc() {
  return [
    ['150-DH', '6.3', '215', '70', '3-160 / 4-120', '2-200 / 3-130', '', '5/1', '5', '', '', '', '', '', '', '海水', '¥33,000', '4550133245893'],
    ['150L-DH', '6.3', '215', '70', '3-160 / 4-120', '2-200 / 3-130', '', '5/1', '5', '', '', '', '', '', '', '海水', '¥33,000', '4550133245909'],
    ['200', '6.3', '240', '70', '3-230 / 4-180', '2-320 / 3-200', '', '5/1', '6', '', '', '', '', '', '', '海水', '¥36,600', '4550133245930'],
    ['200L', '6.3', '240', '70', '3-230 / 4-180', '2-320 / 3-200', '', '5/1', '6', '', '', '', '', '', '', '海水', '¥36,600', '4550133245947'],
  ].map(([sku, ratio, wt, cm, nylonNo, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_no_m: nylonNo,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseTatulaTw400() {
  return [
    ['400HL', '7.1', '335', '95', '25-180 / 30-140', '5-215', '110', '7/1', '13', '32', '24', '', '', '', '', '淡海水', '¥41,000', '3106996'],
    ['400XH', '8.1', '335', '109', '25-180 / 30-140', '5-215', '110', '7/1', '11', '32', '24', '', '', '', '', '淡海水', '¥41,000', '3199172'],
    ['400XHL', '8.1', '335', '109', '25-180 / 30-140', '5-215', '110', '7/1', '11', '32', '24', '', '', '', '', '淡海水', '¥41,000', '3199189'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseSpartanIc() {
  return [
    ['200H', '6.3', '230', '70', '', '2-320 / 3-200', '單柄65', '4/1', '5.0', '36', '', '', '', '', '', '淡海水', '¥26,800', '202138'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseSteezCtSvTw() {
  return [
    ['700SH', '7.1', '150', '66', '14-30~60 / 12-35~70', '', '80', '12/1', '4.5', '30', '21', '', '', '', '', '淡海水', '¥63,000', '4960652005050'],
    ['700SHL', '7.1', '150', '66', '14-30~60 / 12-35~70', '', '80', '12/1', '4.5', '30', '21', '', '', '', '', '淡海水', '¥63,000', '4960652005067'],
    ['700XH', '8.1', '150', '76', '14-30~60 / 12-35~70', '', '80', '12/1', '4.5', '30', '21', '', '', '', '', '淡海水', '¥63,000', '4960652005074'],
    ['700XHL', '8.1', '150', '76', '14-30~60 / 12-35~70', '', '80', '12/1', '4.5', '30', '21', '', '', '', '', '淡海水', '¥63,000', '4960652005081'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku,
    description: '',
    specs: {
      gear_ratio: ratio,
      weight_g: wt,
      max_drag_kg: max,
      retrieve_per_turn_cm: cm,
      handle_length_mm: handle,
      bearing_count_roller: bear,
      Nylon_lb_m: nylon,
      pe_no_m: pe,
      spool_diameter_mm: dia,
      spool_width_mm: width,
      handle_knob_type: knob,
      handle_knob_exchange_size: exchange,
      body_material: body,
      gear_material: gear,
      usage_environment: env,
      drag_click: '',
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseAlphasBfTw() {
  return [
    ['6.3R', '6.3', '165', '59', '6-45 / 8-45', '0.8-45', '6-45 / 8-45', '80', '6/1', '3.5', '30', '21', '高抓力 I型燈形', 'S', '鋁', 'G1超硬鋁合金', '海水', '¥51,900', '4550133256400'],
    ['6.3L', '6.3', '165', '59', '6-45 / 8-45', '0.8-45', '6-45 / 8-45', '80', '6/1', '3.5', '30', '21', '高抓力 I型燈形', 'S', '鋁', 'G1超硬鋁合金', '海水', '¥51,900', '4550133256417'],
    ['8.5R', '8.5', '165', '80', '6-45 / 8-45', '0.8-45', '6-45 / 8-45', '80', '6/1', '3.5', '30', '21', '高抓力 I型燈形', 'S', '鋁', 'G1超硬鋁合金', '海水', '¥51,900', '4550133256424'],
    ['8.5L', '8.5', '165', '80', '6-45 / 8-45', '0.8-45', '6-45 / 8-45', '80', '6/1', '3.5', '30', '21', '高抓力 I型燈形', 'S', '鋁', 'G1超硬鋁合金', '海水', '¥51,900', '4550133256431'],
  ].map(([sku, ratio, wt, cm, nylon, pe, fluoro, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku, description: '', specs: {
      gear_ratio: ratio, weight_g: wt, max_drag_kg: max, retrieve_per_turn_cm: cm,
      handle_length_mm: handle, bearing_count_roller: bear, Nylon_lb_m: nylon, pe_no_m: pe, fluorocarbon_lb_m: fluoro,
      spool_diameter_mm: dia, spool_width_mm: width, handle_knob_type: knob, handle_knob_exchange_size: exchange,
      body_material: body, gear_material: gear, usage_environment: env, drag_click: '',
      official_reference_price: price, product_code: code,
    }
  }));
}

function parseSteezSvTw() {
  return [
    ['1000', '6.7', '160', '67', '12-40~80 / 14-35~70', '1.5-120 / 2-100', '85', '12/1', '5', '32', '22.5', 'HG-I燈型', 'S', '', '', '海水', '¥77,200', '3072512'],
    ['1000L', '6.7', '160', '67', '12-40~80 / 14-35~70', '1.5-120 / 2-100', '85', '12/1', '5', '32', '22.5', 'HG-I燈型', 'S', '', '', '海水', '¥77,200', '3072536'],
    ['1000H', '7.8', '160', '78', '12-40~80 / 14-35~70', '1.5-120 / 2-100', '85', '12/1', '5', '32', '22.5', 'HG-I燈型', 'S', '', '', '海水', '¥77,200', '3072543'],
    ['1000HL', '7.8', '160', '78', '12-40~80 / 14-35~70', '1.5-120 / 2-100', '85', '12/1', '5', '32', '22.5', 'HG-I燈型', 'S', '', '', '海水', '¥77,200', '3072567'],
    ['1000XH', '8.5', '160', '90', '12-40~80 / 14-35~70', '1.5-120 / 2-100', '85', '12/1', '5', '32', '22.5', 'HG-I燈型', 'S', '', '', '海水', '¥77,200', '3072574'],
    ['1000XHL', '8.5', '160', '90', '12-40~80 / 14-35~70', '1.5-120 / 2-100', '85', '12/1', '5', '32', '22.5', 'HG-I燈型', 'S', '', '', '海水', '¥77,200', '3072581'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku, description: '', specs: {
      gear_ratio: ratio, weight_g: wt, max_drag_kg: max, retrieve_per_turn_cm: cm,
      handle_length_mm: handle, bearing_count_roller: bear, Nylon_lb_m: nylon, pe_no_m: pe,
      spool_diameter_mm: dia, spool_width_mm: width, handle_knob_type: knob, handle_knob_exchange_size: exchange,
      body_material: body, gear_material: gear, usage_environment: env, drag_click: '',
      official_reference_price: price || '¥77,200', product_code: code,
    }
  }));
}

function parseTatulaTw100() {
  return [
    ['TW100H', '7.1', '195', '75', '14-115 / 16-100', '', '90', '7/1', '5', '34', '', 'HIP', '', '鋁', '黃銅', '海水', '¥23,300', '4550133329371'],
    ['TW100HL', '7.1', '195', '75', '14-115 / 16-100', '', '90', '7/1', '5', '34', '', 'HIP', '', '鋁', '黃銅', '海水', '¥23,300', '4550133329388'],
    ['TW100XH', '8.1', '195', '86', '14-115 / 16-100', '', '90', '7/1', '5', '34', '', 'HIP', '', '鋁', '黃銅', '海水', '¥23,300', '4550133329395'],
    ['TW100XHL', '8.1', '195', '86', '14-115 / 16-100', '', '90', '7/1', '5', '34', '', 'HIP', '', '鋁', '黃銅', '海水', '¥23,300', '4550133329401'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku, description: '', specs: {
      gear_ratio: ratio, weight_g: wt, max_drag_kg: max, retrieve_per_turn_cm: cm,
      handle_length_mm: handle, bearing_count_roller: bear, Nylon_lb_m: nylon, pe_no_m: pe,
      spool_diameter_mm: dia, spool_width_mm: width, handle_knob_type: knob, handle_knob_exchange_size: exchange,
      body_material: body, gear_material: gear, usage_environment: env, drag_click: '',
      official_reference_price: price, product_code: code,
    }
  }));
}

function parseSaltiga15() {
  return [
    ['15H', '7.1', '485', '115', '', '2-600 / 3-400 / 4-300', '75-85', '8/1', '8', '52', '', '', '', '', '', '海水', '¥80,000', ''],
    ['15HL', '7.1', '485', '115', '', '2-600 / 3-400 / 4-300', '75-85', '8/1', '8', '52', '', '', '', '', '', '海水', '¥80,000', ''],
    ['15-SJ', '6.3', '480', '103', '', '2-600 / 3-400 / 4-300', '85-95', '8/1', '10', '52', '', '', '', '', '', '海水', '¥80,000', ''],
    ['15L-SJ', '6.3', '480', '103', '', '2-600 / 3-400 / 4-300', '85-95', '8/1', '10', '52', '', '', '', '', '', '海水', '¥80,000', ''],
    ['15H-SJ', '7.1', '480', '115', '', '2-600 / 3-400 / 4-300', '85-95', '8/1', '8', '52', '', '', '', '', '', '海水', '¥80,000', ''],
    ['15HL-SJ', '7.1', '480', '115', '', '2-600 / 3-400 / 4-300', '85-95', '8/1', '8', '52', '', '', '', '', '', '海水', '¥80,000', ''],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku, description: '', specs: {
      gear_ratio: ratio, weight_g: wt, max_drag_kg: max, retrieve_per_turn_cm: cm,
      handle_length_mm: handle, bearing_count_roller: bear, Nylon_lb_m: nylon, pe_no_m: pe,
      spool_diameter_mm: dia, spool_width_mm: width, handle_knob_type: knob, handle_knob_exchange_size: exchange,
      body_material: body, gear_material: gear, usage_environment: env, drag_click: '',
      official_reference_price: price || '¥80,000', product_code: code,
    }
  }));
}

function parsePr100H() {
  return [
    ['PR100H MA', '7.3', '190', '73', '12-120 / 14-110', '', '', '4/1', '6', '', '', '', '', '', '', '淡海水', '¥6,700', '3215582'],
    ['PR100HL MA', '7.3', '190', '73', '12-120 / 14-110', '', '', '4/1', '6', '', '', '', '', '', '', '淡海水', '¥6,700', '3216459'],
    ['PR100H MN', '7.3', '190', '73', '12-120 / 14-110', '', '', '4/1', '6', '', '', '', '', '', '', '淡海水', '¥6,700', '3215599'],
    ['PR100HL MN', '7.3', '190', '73', '12-120 / 14-110', '', '', '4/1', '6', '', '', '', '', '', '', '淡海水', '¥6,700', '3216466'],
    ['PR100H MM', '7.3', '190', '73', '12-120 / 14-110', '', '', '4/1', '6', '', '', '', '', '', '', '淡海水', '¥6,700', '3215605'],
    ['PR100HL MM', '7.3', '190', '73', '12-120 / 14-110', '', '', '4/1', '6', '', '', '', '', '', '', '淡海水', '¥6,700', '3216473'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku, description: '', specs: {
      gear_ratio: ratio, weight_g: wt, max_drag_kg: max, retrieve_per_turn_cm: cm,
      handle_length_mm: handle, bearing_count_roller: bear, Nylon_lb_m: nylon, pe_no_m: pe,
      spool_diameter_mm: dia, spool_width_mm: width, handle_knob_type: knob, handle_knob_exchange_size: exchange,
      body_material: body, gear_material: gear, usage_environment: env, drag_click: '',
      official_reference_price: price, product_code: code,
    }
  }));
}

function parseSteezLtdSvTw() {
  return [
    ['1000HL', '7.1', '160', '75', '14/45~90 / 16/40~80', '', '85', '12/1', '5', '34', '24', '', '', '', '', '海水', '¥74,800', '3072505'],
  ].map(([sku, ratio, wt, cm, nylon, pe, handle, bear, max, dia, width, knob, exchange, body, gear, env, price, code]) => ({
    sku, description: '', specs: {
      gear_ratio: ratio, weight_g: wt, max_drag_kg: max, retrieve_per_turn_cm: cm,
      handle_length_mm: handle, bearing_count_roller: bear, Nylon_lb_m: nylon, pe_no_m: pe,
      spool_diameter_mm: dia, spool_width_mm: width, handle_knob_type: knob, handle_knob_exchange_size: exchange,
      body_material: body, gear_material: gear, usage_environment: env, drag_click: '',
      official_reference_price: price, product_code: code,
    }
  }));
}

function parseBaitcastingSpecOcr(ocr, model, introText) {
  if (/RYOGA/i.test(model)) return parseRyoga();
  if (/SILVER WOLF CT SV TW PE SPECIAL/i.test(model)) return parseSilverWolfPeSpecial(ocr, model, introText);
  if (/TATULA BF TW/i.test(model)) return parseTatulaBf(ocr, model, introText);
  if (/月下美人 BF TW PE SP/i.test(model)) return parseGekkabijinBf(ocr, model, introText);
  if (/STEEZ SV LIGHT TW/i.test(model)) return parseSteezSvLight(ocr, model, introText);
  if (/SALTIGA 10/i.test(model)) return parseSaltiga10(ocr, model, introText);
  if (/SALTIGA 35/i.test(model)) return parseSaltiga35();
  if (/STEEZ LIMITED CT SV TW/i.test(model)) return parseSteezLimitedCt();
  if (/SALTIGA 300/i.test(model)) return parseSaltiga300();
  if (/TATULA SV TW 100/i.test(model)) return parseTatulaSvTw100();
  if (/STEEZ AII TW/i.test(model)) return parseSteezAiiTw();
  if (/ZILLION TW HD/i.test(model)) return parseZillionTwHd();
  if (/SALTIGA IC/i.test(model)) return parseSaltigaIc();
  if (/ZILLION SV TW/i.test(model)) return parseZillionSvTw();
  if (/ALPHAS SV TW 800H/i.test(model)) return parseAlphasSv();
  if (/LIGHT GAME IC/i.test(model)) return parseLightGameIc();
  if (/TATULA TW 400/i.test(model)) return parseTatulaTw400();
  if (/SPARTAN IC/i.test(model)) return parseSpartanIc();
  if (/STEEZ CT SV TW/i.test(model)) return parseSteezCtSvTw();
  if (/ALPHAS BF TW/i.test(model)) return parseAlphasBfTw();
  if (/STEEZ SV TW/i.test(model)) return parseSteezSvTw();
  if (/TATULA TW 100/i.test(model)) return parseTatulaTw100();
  if (/SALTIGA 15/i.test(model)) return parseSaltiga15();
  if (/PR100 H/i.test(model)) return parsePr100H();
  if (/STEEZ LTD SV TW/i.test(model)) return parseSteezLtdSvTw();

  const items = itemsFromOcr(ocr);

  if (!items.length) return [];

  const headerItems = items.filter((item) => item.y < 0.45);
  const anchors = dedupeAnchorsByY(
    items.filter((item) => item.x < 0.1 && item.y > 0.45 && isBcVariantAnchor(item.text, model))
  );

  if (!anchors.length) return [];

  const midpoints = [];
  for (let i = 0; i < anchors.length - 1; i += 1) {
    midpoints.push((anchors[i].y + anchors[i + 1].y) / 2);
  }

  const capacityHeaderMap = inferCapacityHeaders(headerItems);
  const headerTextInBand = (min, max) =>
    uniquePreserve(
      headerItems
        .filter((item) => item.x >= min && item.x < max)
        .map((item) => item.text)
    ).join(' ');

  const hasHeader = (min, max, pattern) => pattern.test(headerTextInBand(min, max));
  const hasHandleHeader = hasHeader(0.42, 0.48, /手把|長度|mm/i);
  const hasBearingHeader = hasHeader(0.48, 0.55, /軸承|滾珠/i);
  const hasMaxDragHeader = hasHeader(0.55, 0.60, /最大|拉力|kg/i);
  const hasSpoolHeader = hasHeader(0.60, 0.67, /線杯|徑|寬/i);
  const hasKnobHeader = hasHeader(0.67, 0.73, /握丸|形狀/i);
  const hasKnobExchangeHeader = hasHeader(0.73, 0.78, /交換|尺寸/i);
  const hasBodyHeader = hasHeader(0.71, 0.76, /機體|材質/i);
  const hasGearHeader = hasHeader(0.75, 0.80, /齒輪|材質/i);
  const hasUsageHeader = hasHeader(0.76, 0.82, /使用|環/i);

  return anchors.map((anchor, idx) => {
    const top = idx === 0 ? 0.45 : midpoints[idx - 1];
    const bottom = idx === anchors.length - 1 ? 1.02 : midpoints[idx];
    const group = items.filter((item) => item.y >= top && item.y < bottom);
    const textsInBand = (min, max) =>
      uniquePreserve(group.filter((item) => item.x >= min && item.x < max).map((item) => item.text));
    const firstNumeric = (arr) => arr.find((text) => /^\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?$/.test(text) || /^\d{2,4}$/.test(text)) || '';

    const capBands = {
      cap1: textsInBand(0.18, 0.26).map(normalizeCapacityToken).filter(Boolean),
      cap2: textsInBand(0.26, 0.33).map(normalizeCapacityToken).filter(Boolean),
      cap3: textsInBand(0.33, 0.40).map(normalizeCapacityToken).filter(Boolean),
    };

    const specs = {
      gear_ratio: normalizeRatio(firstNumeric(textsInBand(0.19, 0.30))),
      weight_g: firstNumeric(textsInBand(0.07, 0.14)),
      retrieve_per_turn_cm: firstNumeric(textsInBand(0.14, 0.20)),
      handle_length_mm: hasHandleHeader ? normalizeText(textsInBand(0.42, 0.48).join(' / ')) : '',
      bearing_count_roller: hasBearingHeader ? normalizeText(textsInBand(0.48, 0.55).find((t) => /\d+\/\d+/.test(t)) || '') : '',
      max_drag_kg: hasMaxDragHeader ? firstNumeric(textsInBand(0.55, 0.60)) : '',
      spool_size: normalizeText(textsInBand(0.555, 0.615).find((t) => /\d+\/\d+/.test(t)) || ''),
      handle_knob_type: hasKnobHeader ? normalizeText(textsInBand(0.67, 0.73).join(' ')) : '',
      handle_knob_exchange_size: hasKnobExchangeHeader ? normalizeText(textsInBand(0.73, 0.78).join(' ')).toUpperCase() : '',
      body_material: hasBodyHeader ? parseBodyMaterial(textsInBand(0.71, 0.76).join(' ')) : '',
      gear_material: hasGearHeader ? parseBodyMaterial(textsInBand(0.75, 0.80).join(' ')) : '',
      usage_environment: hasUsageHeader ? parseUsageEnvironment(textsInBand(0.76, 0.82).join(' ')) : '',
      drag_click: /出線警示音|DRAG CLICK/i.test(introText) ? '1' : '',
      official_reference_price: '',
      product_code: '',
      spool_diameter_mm: '',
      spool_width_mm: '',
      Nylon_no_m: '',
      Nylon_lb_m: '',
      fluorocarbon_no_m: '',
      fluorocarbon_lb_m: '',
      pe_no_m: '',
    };

    const priceCode = parsePriceAndCode(textsInBand(hasUsageHeader ? 0.81 : 0.75, 1.01));
    specs.official_reference_price = priceCode.official_reference_price;
    specs.product_code = priceCode.product_code;

    const spoolSize = normalizeText(specs.spool_size);
    if (/^\d+\/\d+$/.test(spoolSize)) {
      const [diameter, width] = spoolSize.split('/');
      specs.spool_diameter_mm = diameter;
      specs.spool_width_mm = width;
    } else if (hasSpoolHeader) {
      const single = firstNumeric(textsInBand(0.60, 0.67));
      if (single) specs.spool_diameter_mm = single;
    }

    for (const [band, field] of Object.entries(capacityHeaderMap)) {
      const values = uniquePreserve(capBands[band] || []);
      if (!values.length) continue;
      if (!specs[field]) specs[field] = values.join(' / ');
      else specs[field] = `${specs[field]} / ${values.join(' / ')}`;
    }

    if (!specs.body_material) {
      if (/鋁合金|鋁製|ALUMINUM|AL /i.test(introText)) specs.body_material = '鋁';
      else if (/ZAION/i.test(introText)) specs.body_material = 'ZAION';
    }
    if (!specs.gear_material && /黃銅|BRASS/i.test(introText)) specs.gear_material = '黃銅';
    if (!specs.usage_environment) {
      specs.usage_environment = /海水/.test(introText) ? '海水' : '淡海水';
    }

    return {
      sku: normalizeBaitcastingSku(anchor.text, model),
      description: '',
      specs,
    };
  }).filter((variant) => variant.sku);
}

function classifyType(model, introText = '') {
  const text = `${normalizeText(model)} ${normalizeText(introText)}`;
  return /(RYOGA|SALTIGA|LIGHT GAME IC|SPARTAN IC)/i.test(text) ? 'drum' : 'baitcasting';
}

async function fetchListItems() {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: BROWSER,
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto(LIST_URL, { waitUntil: 'networkidle2', timeout: 60000 });
      const items = await page.evaluate(() => {
        return [...document.querySelectorAll('li .item.clearfix')].map((card) => {
          const titleLink = card.querySelector('.Txt h4 a[href*="/product-detail/"]');
          const image = card.querySelector('.Img a[href*="/product-detail/"] img');
          return {
            href: titleLink?.href || image?.closest('a')?.href || '',
            text: (titleLink?.innerText || '').trim(),
            mainImage: image?.src || '',
          };
        });
      });
      await browser.close();
      const deduped = [];
      const seen = new Set();
      for (const item of items) {
        const href = normalizeText(item.href);
        if (!href || !normalizeText(item.text) || seen.has(href)) continue;
        seen.add(href);
        deduped.push(item);
      }
      return deduped;
    } catch (error) {
      lastError = error;
      if (browser) {
        try { await browser.close(); } catch {}
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function fetchDetail(item, specKey = '') {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: BROWSER,
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto(item.href, { waitUntil: 'networkidle2', timeout: 60000 });

      const data = await page.evaluate(() => {
        const title = (document.querySelector('h1')?.innerText || '')
          .replace(/\s+/g, ' ')
          .replace(/\b\d+\s*\/\s*\d+\b/g, '')
          .trim();
        const intro = document.querySelector('#intro');
        const price = document.querySelector('#price');
        const introText = intro ? intro.innerText.trim() : '';
        const priceText = price ? price.innerText.trim() : '';
        const priceImages = [...(price?.querySelectorAll('img') || [])].map((img) => ({
          src: img.src,
          alt: img.alt || '',
          title: img.title || '',
        }));
        const heroImages = [...document.querySelectorAll('#productIns img[src*="/product-detail/upload/product_m/"]')].map((img) => img.src);
        return { title, introText, priceText, priceImages, heroImages };
      });

      let localSpecPath = '';
      if (specKey) {
        localSpecPath = path.join(SPEC_CACHE_DIR, `${sanitizeFilename(specKey)}_spec.jpg`);
        fs.mkdirSync(path.dirname(localSpecPath), { recursive: true });
        try {
          const priceTab = await page.$('a[href="#price"]');
          if (priceTab) {
            await priceTab.click();
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          const priceImage = await page.$('#price img');
          if (!priceImage) throw new Error('no price image');
          const imageSrc = await priceImage.evaluate((el) => el.src || '');
          if (imageSrc) {
            await saveImageFromPage(page, imageSrc, localSpecPath);
          } else {
            await priceImage.evaluate((el) => el.scrollIntoView({ block: 'center' }));
            await priceImage.screenshot({ path: localSpecPath, type: 'jpeg' });
          }
        } catch {
          localSpecPath = '';
        }
      }

      await browser.close();
      return { ...data, localSpecPath };
    } catch (error) {
      lastError = error;
      if (browser) {
        try { await browser.close(); } catch {}
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

function writeOutputs(normalized, now) {
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(normalized, null, 2), 'utf8');
  const reelRows = [];
  const detailRows = [];

  normalized.forEach((item, idx) => {
    const masterId = `DRE${5000 + idx}`;
    const type = classifyType(item.model, item.intro_text);

    const prices = item.variants
      .map((variant) => normalizeText(variant?.specs?.official_reference_price))
      .map((value) => value.replace(/[^\d]/g, ''))
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    let officialReferencePrice = '';
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      officialReferencePrice = minPrice === maxPrice
        ? `¥${minPrice.toLocaleString('en-US')}`
        : `¥${minPrice.toLocaleString('en-US')} - ¥${maxPrice.toLocaleString('en-US')}`;
    }

    reelRows.push({
      id: masterId,
      brand_id: BRAND_IDS.DAIWA,
      model: item.model,
      model_cn: '',
      model_year: item.model_year,
      alias: item.alias,
      type_tips: '',
      type,
      images: item.images,
      created_at: now,
      updated_at: now,
      series_positioning: '',
      main_selling_points: extractMainSellingPoints(item.intro_text),
      official_reference_price: officialReferencePrice,
      market_status: '在售',
      Description: normalizeText(item.intro_text).slice(0, 5000),
      market_reference_price: '',
      player_positioning: '',
      player_selling_points: '',
    });

    const variants = item.variants.length ? item.variants : [{ sku: item.model, description: '', specs: {} }];
    variants.forEach((variant) => {
      const specs = variant.specs || {};
      detailRows.push({
        id: `DRED${50000 + detailRows.length}`,
        reel_id: masterId,
        SKU: normalizeText(variant.sku),
        'GEAR RATIO': normalizeText(specs.gear_ratio),
        'MAX DRAG': normalizeText(specs.max_drag_kg),
        'WEIGHT': normalizeText(specs.weight_g),
        spool_diameter_per_turn_mm: '',
        Nylon_lb_m: normalizeText(specs.Nylon_lb_m || specs.nylon_lb_m),
        fluorocarbon_lb_m: normalizeText(specs.fluorocarbon_lb_m),
        pe_no_m: normalizeText(specs.pe_no_m),
        cm_per_turn: normalizeText(specs.retrieve_per_turn_cm),
        handle_length_mm: normalizeText(specs.handle_length_mm),
        bearing_count_roller: normalizeText(specs.bearing_count_roller),
        market_reference_price: normalizeText(specs.official_reference_price),
        product_code: normalizeText(specs.product_code),
        created_at: now,
        updated_at: now,
        spool_diameter_mm: normalizeText(specs.spool_diameter_mm),
        spool_width_mm: normalizeText(specs.spool_width_mm),
        spool_weight_g: getBaitcastingSpoolWeight(item.model, variant.sku),
        handle_knob_type: normalizeText(specs.handle_knob_type),
        handle_knob_exchange_size: normalizeText(specs.handle_knob_exchange_size).toUpperCase(),
        body_material: normalizeText(specs.body_material),
        gear_material: normalizeText(specs.gear_material),
        battery_capacity: '',
        battery_charge_time: '',
        continuous_cast_count: '',
        usage_environment: normalizeText(specs.usage_environment),
        DRAG: '',
        Nylon_no_m: normalizeText(specs.Nylon_no_m || specs.nylon_no_m),
        fluorocarbon_no_m: normalizeText(specs.fluorocarbon_no_m),
        drag_click: normalizeText(specs.drag_click),
        spool_depth_normalized: '',
        gear_ratio_normalized: '',
        brake_type_normalized: '',
        fit_style_tags: '',
        min_lure_weight_hint: '',
        is_compact_body: '',
        handle_style: '',
        MAX_DURABILITY: normalizeText(specs.max_durability_kg),
        type,
        EV_link: '',
        Specs_link: '',
      });
    });
  });

  reelRows.sort((a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true }));
  detailRows.sort((a, b) =>
    String(a.reel_id || '').localeCompare(String(b.reel_id || ''), 'en', { numeric: true }) ||
    String(a.id || '').localeCompare(String(b.id || ''), 'en', { numeric: true }) ||
    String(a.SKU || '').localeCompare(String(b.SKU || ''), 'en', { numeric: true })
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reelRows, { header: HEADERS.reelMaster }), SHEET_NAMES.reel);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows, { header: HEADERS.baitcastingReelDetail }), SHEET_NAMES.baitcastingReelDetail);
  XLSX.writeFile(wb, OUTPUT_FILE);
}

async function main() {
  const allItems = await fetchListItems();
  let items = allItems;
  if (TARGET_MODELS.size) {
    items = items.filter((item) => TARGET_MODELS.has(cleanModelText(item.text)));
  }
  const normalized = [];
  const now = new Date().toISOString();
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.mkdirSync(SPEC_CACHE_DIR, { recursive: true });
  const isPartialRun = TARGET_MODELS.size > 0;

  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx];
    try {
      let model = cleanModelText(item.text);
      const sourceId = normalizeText(item.href).replace(/\/+$/, '').split('/').pop() || model || `idx_${idx}`;
      const detail = await fetchDetail(item, sourceId);
      if (!model) model = cleanModelText(detail.title);
      const modelYear = extractYear(detail.title || model || detail.priceText);
      const alias = buildAlias(modelYear, model);

      const mainImageUrl = detail.heroImages[0] || item.mainImage || '';
      let imageFilename = '';
      let imageCdn = '';
      if (mainImageUrl) {
        const extMatch = mainImageUrl.split('?')[0].match(/\.(jpg|jpeg|png|webp)$/i);
        const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '.jpg';
        imageFilename = `${sanitizeFilename(model)}_main${ext}`;
        const localMain = path.join(IMAGE_DIR, imageFilename);
        if (!fs.existsSync(localMain)) {
          try {
            downloadFile(mainImageUrl, localMain);
          } catch {
            try {
              await downloadFileWithBrowser(mainImageUrl, localMain);
            } catch {}
          }
        }
        imageCdn = `${STATIC_PREFIX}${encodeURIComponent(imageFilename)}`;
      }

      let specText = '';
      let specOcr = null;
      let variants = [];
      if (detail.localSpecPath && fs.existsSync(detail.localSpecPath)) {
        specOcr = ocrImageJson(detail.localSpecPath);
        specText = specOcr?.items?.map((entry) => normalizeText(entry.text)).filter(Boolean).join('\n') || ocrImage(detail.localSpecPath);
        variants = parseBaitcastingSpecOcr(specOcr, model, detail.introText);
      }

      if (!variants.length) {
        console.error(JSON.stringify({ progress: `${idx + 1}/${items.length}`, model, warning: 'no variants parsed, skipped write' }, null, 2));
        continue;
      }

      normalized.push({
        model,
        model_year: modelYear,
        alias,
        source_url: item.href,
        main_image_url: mainImageUrl,
        local_image_path: imageFilename ? `images/daiwa_reels/${imageFilename}` : '',
        images: imageCdn,
        intro_text: detail.introText,
        price_text: detail.priceText,
        spec_text: specText,
        spec_ocr: specOcr,
        spec_images: detail.priceImages,
        variants,
      });

      if (!isPartialRun && normalized.length) writeOutputs(normalized, now);
      console.log(JSON.stringify({ progress: `${idx + 1}/${items.length}`, model, variants: variants.length }, null, 2));
    } catch (error) {
      console.error(JSON.stringify({ progress: `${idx + 1}/${items.length}`, href: item.href, error: String(error?.message || error) }, null, 2));
    }
  }

  let finalNormalized = normalized;
  if (isPartialRun && fs.existsSync(OUTPUT_JSON)) {
    const existing = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
    const merged = new Map(existing.map((item) => [item.model, item]));
    for (const item of normalized) merged.set(item.model, item);
    const order = new Map(allItems.map((item, idx) => [cleanModelText(item.text), idx]));
    finalNormalized = [...merged.values()].sort((a, b) =>
      (order.get(a.model) ?? 9999) - (order.get(b.model) ?? 9999) || String(a.model).localeCompare(String(b.model))
    );
  }

  if (finalNormalized.length) writeOutputs(finalNormalized, now);
  console.log(JSON.stringify({
    list_url: LIST_URL,
    items: finalNormalized.length,
    output: OUTPUT_FILE,
    json: OUTPUT_JSON,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
