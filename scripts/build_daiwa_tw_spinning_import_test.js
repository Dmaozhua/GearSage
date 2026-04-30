const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const LIST_URL = 'https://www.daiwaseiko.com.tw/product-list/reel/spinning_reel/';
const OUTPUT_FILE = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import_test.xlsx';
const OUTPUT_JSON = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_test_normalized.json';
const LOCK_FILE = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_reels_locks.json';
const IMAGE_DIR = '/Users/tommy/Pictures/images/daiwa_reels';
const STATIC_PREFIX = 'https://static.gearsage.club/gearsage/Gearimg/images/daiwa_reels/';
const BROWSER = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OCR_SWIFT = '/Users/tommy/GearSage/scripts/ocr_apple_vision.swift';
const UNLOCK_REELS = new Set(
  String(process.env.DAIWA_UNLOCK_REELS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanModelText(text) {
  return normalizeText(String(text || '').split('\n')[0])
    .replace(/\s*¥.*$/, '')
    .replace(/^\d{2}\s*/, '')
    .replace(/【[^】]+】/g, '')
    .trim();
}

function sanitizeFilename(name) {
  return String(name || '').replace(/[\\/*?:"<>|]/g, '_').trim();
}

function buildStableDaiwaSpinningDetailId(masterId, sku, index = 0) {
  const normalizedMasterId = normalizeText(masterId);
  const normalizedSku = normalizeText(sku).toUpperCase();
  const hash = crypto
    .createHash('sha1')
    .update(`${normalizedMasterId}::${normalizedSku || index}`)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();
  return `DRED${normalizedMasterId.replace(/^DRE/, '')}_${hash}`;
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

function buildLineCapacityDisplay(specs) {
  const parts = [];
  const nylonNo = normalizeText(specs.nylon_no_m);
  const nylonLb = normalizeText(specs.nylon_lb_m);
  const pe = normalizeText(specs.pe_no_m);
  if (nylonNo) parts.push(`Nylon ${nylonNo}`);
  if (nylonLb) parts.push(`Nylon ${nylonLb}`);
  if (pe) parts.push(`PE ${pe}`);
  return parts.join(' / ');
}

function isDaiwaDoubleHandleSku(sku) {
  const text = normalizeText(sku).toUpperCase();
  return /(?:^|-)DH(?:$|-|PG$|HG$|XH$|XG$)/.test(text) || /DH$/.test(text);
}

function getDaiwaSpinningHandleStyle(sku) {
  return isDaiwaDoubleHandleSku(sku) ? '双摇臂' : '单摇臂';
}

function isDaiwaCompactBodySku(sku) {
  const text = normalizeText(sku).toUpperCase();
  return /(?:FC\s+)?LT[0-9A-Z]+-C[A-Z]*(?:-[A-Z]+)*$/.test(text);
}

function formatPrice(value) {
  const text = normalizeText(value).replace(/[^\d]/g, '');
  if (!text) return '';
  return `¥${Number(text).toLocaleString('en-US')}`;
}

function downloadFile(url, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  execFileSync('curl', ['-L', '-A', 'Mozilla/5.0', '--max-time', '30', '-o', outPath, url], {
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

function mergeVariants(authoritativeVariants, existingVariants) {
  const existingMap = new Map((existingVariants || []).map((variant) => [normalizeSkuText(variant.sku), variant]));
  return (authoritativeVariants || []).map((variant) => {
    const existing = existingMap.get(normalizeSkuText(variant.sku));
    return existing
      ? { ...variant, description: existing.description || variant.description || '', specs: existing.specs || variant.specs || {} }
      : variant;
  });
}

function isVariantSku(text) {
  const value = normalizeSkuText(text);
  return (/^FC LT[\dA-Z-]+$/i.test(value) || /^LT[\dA-Z-]+$/i.test(value) || /^(?=.*[A-Z])[0-9A-Z-]{4,20}$/i.test(value)) && !/^\d+$/.test(value);
}

function normalizeSkuText(text) {
  let value = normalizeText(text)
    .replace(/^20\d{2}\s+/, '')
    .replace(/^\d{2}\s+/, '')
    .trim();
  if (!/^FC\s+LT/i.test(value)) {
    value = value.replace(/^[A-ZＡ-Ｚ][A-ZＡ-Ｚ\s]+(?=(?:FC\s+)?LT[\dA-Z-]+)/i, '').trim();
  }
  const fcMatch = value.match(/\bFC\s*LT[\dA-Z-]+/i);
  if (fcMatch) return fcMatch[0].replace(/\s+/g, ' ').trim();
  const ltMatch = value.match(/\bLT[\dA-Z-]+/i);
  if (ltMatch) return ltMatch[0].trim();
  const brokenLtMatch = value.match(/\bL1(?=\d{4}[A-Z-]*)/i);
  if (brokenLtMatch) {
    return value.replace(/\bL1(?=\d{4}[A-Z-]*)/i, 'LT').trim();
  }
  const genericMatch = value.match(/\b\d{4,5}[A-Z-]*\b/i);
  if (genericMatch && /[A-Z]/i.test(genericMatch[0])) return genericMatch[0].trim();
  return value;
}

function normalizeRatioText(text) {
  const value = normalizeText(text).replace(/:1$/, '');
  if (/^\d\.\d$/.test(value)) return value;
  if (/^\d{2}$/.test(value) && Number(value) >= 40 && Number(value) <= 99) {
    return `${value[0]}.${value[1]}`;
  }
  return value;
}

function normalizeCapacityToken(text) {
  const value = normalizeText(text)
    .replace(/[:/]/g, '-')
    .replace(/(\d)\s+(\d)/g, '$1-$2');
  return /^\d+(?:\.\d+)?-\d+$/.test(value) ? value : '';
}

function parseBearingCluster(text) {
  const value = normalizeText(text).replace(/\|/g, '');
  if (!value) return { bearing: '', extraDrag: '' };
  const bbMatch = value.match(/\b([0-9S]{1,3}B[0-9SB\s]*\+1)\b/i);
  if (bbMatch) {
    const bearing = bbMatch[1].replace(/\s+/g, '').replace(/^SBB\+1$/i, '5BB+1').replace(/^58B\+1$/i, '5BB+1').replace(/^588\+1$/i, '5BB+1');
    const after = value.slice(value.indexOf(bbMatch[1]) + bbMatch[1].length);
    const extra = (after.match(/\b(\d{1,2}(?:\.\d)?)\b/) || [])[1] || '';
    return { bearing, extraDrag: extra };
  }
  const compact = value.replace(/\s+/g, '');
  let match = compact.match(/^(\d)\/(\d)(\d{1,2})$/);
  if (match) return { bearing: `${match[1]}/${match[2]}`, extraDrag: match[3] };
  match = compact.match(/^(\d)\/(\d)$/);
  if (match) return { bearing: `${match[1]}/${match[2]}`, extraDrag: '' };
  match = compact.match(/^(\d)(\d)$/);
  if (match) return { bearing: `${match[1]}/${match[2]}`, extraDrag: '' };
  match = compact.match(/^(\d)\/$/);
  if (match) return { bearing: `${match[1]}/1`, extraDrag: '' };
  return { bearing: '', extraDrag: '' };
}

function collectBetween(lines, startMatcher, endMatchers, valueMatcher) {
  const startIndex = lines.findIndex((line) => startMatcher(line));
  if (startIndex === -1) return [];
  const out = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (endMatchers.some((matcher) => matcher(line))) break;
    if (!valueMatcher || valueMatcher(line)) out.push(line);
  }
  return out;
}

function findIndex(lines, predicate) {
  return lines.findIndex(predicate);
}

function detectCapacityLayout(lines, standardStart, priceStart) {
  if (standardStart === -1) return { columns: 0, order: [] };
  const scope = lines.slice(standardStart + 1, priceStart !== -1 ? priceStart : undefined);
  const headerText = scope.slice(0, 8).join(' ');
  return detectCapacityLayoutFromHeaderText(headerText);
}

function extractTokens(scopeLines, pattern) {
  const out = [];
  for (const line of scopeLines) {
    const matches = [...line.matchAll(pattern)];
    for (const match of matches) {
      out.push(match[0]);
    }
  }
  return out;
}

function collectWindow(lines, startIndex, endIndex, valueMatcher) {
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return [];
  return lines.slice(startIndex + 1, endIndex).filter((line) => !valueMatcher || valueMatcher(line));
}

function detectCapacityLayoutFromHeaderText(headerText) {
  if (/PE（[^）]*-m）|PE（[^）]*m）/i.test(headerText) && !/尼|lb|Ib/i.test(headerText)) {
    return { columns: 1, order: ['pe_no_m'], pairWithinField: true };
  }
  if (/尼龍（Ib-m）PE（號-m）|尼龍（lb-m）PE（號-m）/.test(headerText)) {
    return { columns: 2, order: ['Nylon_lb_m', 'pe_no_m'], pairWithinField: false };
  }
  if (/尼能（號-m）尼能（lb-m）PE/.test(headerText) || /號-m.*lb-m.*PE/.test(headerText)) {
    return { columns: 3, order: ['Nylon_no_m', 'Nylon_lb_m', 'pe_no_m'], pairWithinField: false };
  }
  return { columns: 0, order: [] };
}

function groupOCRRows(ocr) {
  const items = (ocr?.items || [])
    .map((item) => ({
      ...item,
      text: normalizeText(item.text),
      cy: item.y + item.h / 2,
    }))
    .filter((item) => item.text);
  const rows = [];
  for (const item of items.sort((a, b) => a.cy - b.cy || a.x - b.x)) {
    let row = rows.find((entry) => Math.abs(entry.cy - item.cy) < 0.012);
    if (!row) {
      row = { cy: item.cy, items: [] };
      rows.push(row);
    } else {
      row.cy = (row.cy * row.items.length + item.cy) / (row.items.length + 1);
    }
    row.items.push(item);
  }
  return rows
    .map((row) => ({ ...row, items: row.items.sort((a, b) => a.x - b.x) }))
    .sort((a, b) => a.cy - b.cy);
}

function extractCapacityTokensFromText(text) {
  return [...normalizeText(text).matchAll(/\d+(?:\.\d+)?[\/-]\d+/g)]
    .map((match) => normalizeCapacityToken(match[0]))
    .filter(Boolean);
}

function parseSpecOcr(ocr, variants, specText = '') {
  const rows = groupOCRRows(ocr);
  const variantCount = variants.length;
  if (!rows.length || !variantCount) return [];

  const dataRows = rows.filter((row) =>
    row.items.some((item) => isVariantSku(item.text))
  );
  if (!dataRows.length) return [];

  const headerRows = rows.filter((row) => row.cy < dataRows[0].cy);
  const headerText = headerRows.map((row) => row.items.map((item) => item.text).join(' ')).join(' ');
  const layout = detectCapacityLayoutFromHeaderText(headerText);
  const globalCapacityTokens = [...String(specText || '').matchAll(/\d+(?:\.\d+)?[\/-]\d+/g)]
    .map((match) => normalizeCapacityToken(match[0]))
    .filter(Boolean);

  return variants.slice(0, dataRows.length).map((variant, idx) => {
    const row = dataRows[idx];
    const rowText = row.items.map((item) => item.text).join(' ');
    let weight = '';
    let retrieve = '';
    let ratio = '';
    for (const cell of row.items) {
      const text = cell.text;
      if (!weight && /^\d{2,4}$/.test(text) && Number(text) >= 100) {
        weight = text;
        continue;
      }
      if (weight && !retrieve && /^\d{2,3}$/.test(text) && Number(text) <= 180) {
        retrieve = text;
        continue;
      }
      if (retrieve && !ratio && /^(\d\.\d(?::1)?|\d{2})$/.test(text)) {
        ratio = normalizeRatioText(text);
        break;
      }
    }
    const capacityTokens = row.items.flatMap((item) => extractCapacityTokensFromText(item.text)).filter(Boolean);

    let nylonNo = '';
    let nylonLb = '';
    let pe = '';
    if (layout.columns === 1 && globalCapacityTokens.length >= variantCount * 2) {
      pe = [globalCapacityTokens[idx * 2], globalCapacityTokens[idx * 2 + 1]].filter(Boolean).join(' / ');
    } else if (layout.columns === 1) {
      pe = capacityTokens.join(' / ');
    } else if (layout.columns === 2) {
      [nylonLb = '', pe = ''] = capacityTokens;
    } else if (layout.columns === 3) {
      [nylonNo = '', nylonLb = '', pe = ''] = capacityTokens;
    } else if (capacityTokens.length === 2) {
      [nylonLb = '', pe = ''] = capacityTokens;
    } else if (capacityTokens.length === 6) {
      nylonLb = capacityTokens.slice(0, 3).join(' / ');
      pe = capacityTokens.slice(3, 6).join(' / ');
    }

    const handleMinX = layout.columns === 1 ? 0.34 : layout.columns === 2 ? 0.45 : 0.50;
    const handleMaxX = layout.columns === 1 ? 0.44 : layout.columns === 2 ? 0.56 : 0.61;
    let handle = row.items.find((item) => /^\d{2,3}$/.test(item.text) && Number(item.text) >= 35 && Number(item.text) <= 120 && item.x >= handleMinX && item.x < handleMaxX)?.text || '';
    if (!handle) {
      const fallbackHandle = rowText.match(/\d+(?:\.\d+)?-\d+\s+(\d{2,3})(?=\s+\d+\/\d+)/);
      handle = fallbackHandle ? fallbackHandle[1] : '';
    }
    const bearingCandidate = row.items
      .filter((item) => item.x >= 0.47 && item.x <= 0.70)
      .map((item) => item.text)
      .join(' ');
    const parsedBearing = parseBearingCluster(bearingCandidate || rowText);
    let bearing = parsedBearing.bearing || (rowText.match(/\d+\/\d+/) || [])[0] || '';
    let maxDrag = '';
    if (parsedBearing.extraDrag) {
      maxDrag = parsedBearing.extraDrag;
    } else if (bearing && /BB\+1$/i.test(bearing)) {
      const afterBearing = rowText.split(bearing).slice(1).join(bearing);
      const maxMatch = afterBearing.match(/\b(\d{1,2}(?:\.\d)?)\b/);
      if (maxMatch) maxDrag = maxMatch[1];
    } else if (bearing) {
      const afterBearing = rowText.split(bearing).slice(1).join(bearing);
      const maxMatch = afterBearing.match(/\b(\d{1,2}(?:\.\d)?)\b/);
      if (maxMatch) maxDrag = maxMatch[1];
    }
    const priceMatch = rowText.match(/(\d{1,3}(?:,\d{3})?|\d{4,6})(?=\s+\d{6,13}\b)/);
    const productCodeMatch = rowText.match(/\b\d{6,13}\b(?!.*\b\d{6,13}\b)/);

    return {
      ...variant,
      sku: normalizeSkuText(variant.sku),
      specs: {
        ...(variant.specs || {}),
        weight_g: weight,
        retrieve_per_turn_cm: retrieve,
        gear_ratio: ratio,
        bearing_count_roller: bearing,
        handle_length_mm: handle,
        max_drag_kg: maxDrag,
        nylon_no_m: nylonNo,
        nylon_lb_m: nylonLb,
        pe_no_m: pe,
        official_reference_price: formatPrice(priceMatch ? priceMatch[1] : ''),
        product_code: productCodeMatch ? productCodeMatch[0] : '',
      },
    };
  });
}

function deriveVariantsFromSpecText(specText) {
  const lines = String(specText || '')
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter(Boolean);
  const standardStart = findIndex(lines, (line) => line.includes('標準捲線量'));
  const skuStart = findIndex(lines, (line) => line.includes('型號'));
  const lineCandidates = skuStart === -1
    ? []
    : lines
        .slice(skuStart + 1, standardStart === -1 ? undefined : standardStart)
        .map((line) => normalizeSkuText(line))
        .filter((line) => isVariantSku(line));
  const textCandidates = [...String(specText || '').matchAll(/(?:FC\s*LT[\dA-Z-]+|[A-Z]+\s+LT[\dA-Z-]+|LT[\dA-Z-]+|L1\d{4}[A-Z-]*)/gi)]
    .map((match) => normalizeSkuText(match[0]))
    .filter((line) => isVariantSku(line));
  return uniquePreserve([...lineCandidates, ...textCandidates]).map((sku) => ({ sku: normalizeSkuText(sku), description: '', specs: {} }));
}

function parseSpecText(specText, variants) {
  const lines = String(specText || '')
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter(Boolean);
  const variantCount = variants.length;
  if (!variantCount) return [];

  const weightStart = findIndex(lines, (line) => line.includes('重量'));
  const retrieveStart = findIndex(lines, (line) => line.includes('收線長'));
  const ratioStart = findIndex(lines, (line, idx) => line.includes('齒輪比') || (line === '齒' && lines[idx + 1] === '輪' && lines[idx + 2] === '比'));
  const standardStart = findIndex(lines, (line) => line.includes('標準捲線量'));
  const handleStart = findIndex(lines, (line, idx) =>
    (line.includes('手把') && line.includes('長度')) ||
    (line === '手把' && lines[idx + 1] === '長度') ||
    (line.startsWith('手把') && lines[idx + 1] === '長度')
  );
  const bearingStart = findIndex(lines, (line) => line.includes('軸承') || line.includes('滾珠/滾輪'));
  const priceStart = findIndex(lines, (line) => line.includes('建議'));
  const janStart = findIndex(lines, (line) => line.includes('JAN'));

  const skuStart = findIndex(lines, (line) => line.includes('型號'));
  const preStandard = lines.slice(skuStart + 1, standardStart === -1 ? undefined : standardStart);
  const parsedWeights = [];
  const parsedRetrieves = [];
  const parsedRatios = [];
  let cursor = 0;

  while (cursor < preStandard.length && parsedWeights.length < variantCount) {
    const batchSkus = [];
    while (cursor < preStandard.length) {
      const line = preStandard[cursor];
      if (isVariantSku(line)) {
        batchSkus.push(line);
        cursor += 1;
      } else {
        break;
      }
    }
    if (!batchSkus.length) {
      cursor += 1;
      continue;
    }
    const batchCount = Math.min(batchSkus.length, variantCount - parsedWeights.length);

    const takeValues = (predicate) => {
      const out = [];
      while (cursor < preStandard.length && out.length < batchCount) {
        const line = preStandard[cursor];
        if (predicate(line)) out.push(line);
        cursor += 1;
      }
      return out;
    };

    parsedWeights.push(...takeValues((line) => /^\d{2,4}$/.test(line) && Number(line) >= 100));
    parsedRetrieves.push(...takeValues((line) => /^\d{2,3}$/.test(line) && Number(line) <= 180));
    parsedRatios.push(...takeValues((line) => /^\d\.\d$/.test(line)));
  }

  const weights = parsedWeights.slice(0, variantCount);
  const retrieves = parsedRetrieves.slice(0, variantCount);
  const ratios = parsedRatios.slice(0, variantCount);

  const standardScope = standardStart !== -1 ? lines.slice(standardStart + 1, priceStart !== -1 ? priceStart : undefined) : [];
  let handleLengths = extractTokens(
    bearingStart !== -1 ? standardScope.slice(0, standardScope.findIndex((line) => line.includes('軸承') || line.includes('滾珠/滾輪'))) : standardScope,
    /\b\d{2,3}\b/g
  )
    .filter((line) => Number(line) >= 35 && Number(line) <= 120);
  if (handleLengths.length >= variantCount) {
    handleLengths = handleLengths.slice(0, variantCount);
  } else {
    handleLengths = [];
  }

  const bearingMatches = [...String(specText || '').matchAll(/(?:\d+（)?(\d+\/\d+)(?:）)?/g)].map((m) => m[1]);
  const bearings = bearingMatches.slice(0, variantCount);

  const pairScope = priceStart !== -1 ? lines.slice(priceStart + 1) : [];
  const pairMatches = pairScope.flatMap((line) => [...line.matchAll(/(\d{1,3}(?:,\d{3})?|\d{4,6})\s+(\d{7,13})/g)]);
  let prices = pairMatches.map((m) => m[1]);
  let productCodes = pairMatches.map((m) => m[2]);

  if (!productCodes.length) {
    const janScope = janStart !== -1 ? lines.slice(janStart + 1) : lines;
    const janTokens = janScope.flatMap((line) => [...line.matchAll(/\b(\d{7,13})\b/g)].map((m) => m[1]));
    productCodes = janTokens.slice(0, variantCount);
  }

  if (!prices.length) {
    const priceScope = priceStart !== -1
      ? lines.slice(priceStart + 1, janStart !== -1 ? janStart : undefined)
      : lines;
    prices = priceScope
      .filter((line) => /^(?:\d{1,3},\d{3}|\d{3,6})$/.test(line))
      .filter((line) => !/^\d{7,13}$/.test(line));
    if (!prices.length) {
      prices = [...String(specText || '').matchAll(/\b(\d{1,3},\d{3}|\d{3,6})\b/g)]
        .map((m) => m[1])
        .filter((line) => !/^\d{7,13}$/.test(line));
    }
  }
  prices = prices.slice(0, variantCount);
  productCodes = productCodes.slice(0, variantCount);

  const maxDrags = [];

  const lineRows = [];
  if (standardStart !== -1) {
    const scope = lines.slice(standardStart + 1);
    const capacityTokens = extractTokens(scope, /\b\d+(?:\.\d+)?-\d+\b/g);
    const layout = detectCapacityLayout(lines, standardStart, priceStart);
    const columns = layout.columns;
    const order = layout.order;
    const pairWithinField = layout.pairWithinField;
    for (let i = 0; i < capacityTokens.length; i += columns) {
      if (!columns) break;
      if (columns === 3 && capacityTokens.length < variantCount * 3) break;
      const row = { nylon_no_m: '', nylon_lb_m: '', pe_no_m: '' };
      if (columns === 1 && pairWithinField) {
        row.pe_no_m = [capacityTokens[i], capacityTokens[i + 1]].filter(Boolean).join(' / ');
        i += 1;
      } else {
        order.forEach((field, offset) => {
          if (field === 'Nylon_no_m') row.nylon_no_m = capacityTokens[i + offset] || '';
          if (field === 'Nylon_lb_m') row.nylon_lb_m = capacityTokens[i + offset] || '';
          if (field === 'pe_no_m') row.pe_no_m = capacityTokens[i + offset] || '';
        });
      }
      lineRows.push(row);
      if (lineRows.length >= variantCount) break;
    }
  }

  return variants.map((variant, idx) => ({
    ...variant,
    specs: {
      weight_g: weights[idx] || '',
      retrieve_per_turn_cm: retrieves[idx] || '',
      gear_ratio: ratios[idx] || '',
      bearing_count_roller: bearings[idx] || '',
      handle_length_mm: handleLengths[idx] || '',
      max_drag_kg: maxDrags[idx] || '',
      nylon_no_m: lineRows[idx]?.nylon_no_m || '',
      nylon_lb_m: lineRows[idx]?.nylon_lb_m || '',
      pe_no_m: lineRows[idx]?.pe_no_m || '',
      official_reference_price: formatPrice(prices[idx]),
      product_code: productCodes[idx] || '',
    },
  }));
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
        try {
          await browser.close();
        } catch {}
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
        const title = document.querySelector('.pNameItem .articleTitle')?.innerText?.trim() || '';
        const modelLine = [...document.querySelectorAll('.pNameItem p')].map((p) => p.innerText.trim());
        const intro = document.querySelector('#intro .textEditor');
        const price = document.querySelector('#price .textEditor');

        const introText = intro ? intro.innerText.trim() : '';
        const priceText = price ? price.innerText.trim() : '';
        const priceImages = [...(price?.querySelectorAll('img') || [])].map((img) => ({
          src: img.src,
          alt: img.alt || '',
          title: img.title || '',
        }));

        let variantRows = [];
        if (intro) {
          const tables = [...intro.querySelectorAll('table')];
          for (const table of tables) {
            const rows = [...table.querySelectorAll('tr')].map((tr) =>
              [...tr.querySelectorAll('th,td')].map((cell) => cell.innerText.replace(/\s+/g, ' ').trim())
            );
            if (!rows.length) continue;
            const header = rows[0].join(' | ');
            if (!header.includes('型號') || !header.includes('說明')) continue;
            variantRows = rows.slice(1).filter((row) => row.length >= 2 && row[0] && row[1]).map((row) => ({
              sku: row[0],
              description: row[1],
            }));
            break;
          }
        }

        return { title, modelLine, introText, priceText, priceImages, variantRows };
      });
      let localSpecPath = '';
      if (specKey) {
        localSpecPath = path.join('/tmp/daiwa_tw_spec_ocr', `${sanitizeFilename(specKey)}_spec.jpg`);
        fs.mkdirSync(path.dirname(localSpecPath), { recursive: true });
        try {
          const priceTab = await page.$('a[href="#price"]');
          if (priceTab) {
            await priceTab.click();
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
          const priceImage = await page.$('#price .textEditor img');
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
        try {
          await browser.close();
        } catch {}
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
  const lockedReels = fs.existsSync(LOCK_FILE)
    ? new Set((JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')).reel_ids || []).filter((id) => !UNLOCK_REELS.has(id)))
    : new Set();

  normalized.forEach((item, idx) => {
    const masterId = `DRE${1000 + idx}`;
    reelRows.push({
      id: masterId,
      brand_id: BRAND_IDS.DAIWA,
      model: item.model,
      model_cn: '',
      model_year: item.model_year,
      alias: item.alias,
      type_tips: '',
      type: 'spinning',
      images: item.images,
      created_at: now,
      updated_at: now,
      series_positioning: '',
      main_selling_points: normalizeText(item.intro_text).slice(0, 5000),
      official_reference_price: item.official_reference_price,
      market_status: '在售',
      Description: normalizeText(item.intro_text).slice(0, 5000),
      market_reference_price: '',
      player_positioning: '',
      player_selling_points: '',
    });

    const variants = item.variants.length ? item.variants : [{ sku: item.model, description: normalizeText(item.intro_text).slice(0, 5000), specs: {} }];
    variants.forEach((variant, detailIndex) => {
      const specs = variant.specs || {};
      detailRows.push({
        id: buildStableDaiwaSpinningDetailId(masterId, variant.sku, detailIndex),
        reel_id: masterId,
        SKU: normalizeText(variant.sku),
        'GEAR RATIO': normalizeText(specs.gear_ratio),
        DRAG: '',
        'MAX DRAG': normalizeText(specs.max_drag_kg),
        'WEIGHT': normalizeText(specs.weight_g),
        spool_diameter_per_turn_mm: '',
        spool_diameter_mm: normalizeText(specs.spool_diameter_mm),
        Nylon_no_m: normalizeText(specs.nylon_no_m),
        Nylon_lb_m: normalizeText(specs.nylon_lb_m),
        fluorocarbon_no_m: '',
        fluorocarbon_lb_m: '',
        pe_no_m: normalizeText(specs.pe_no_m),
        cm_per_turn: normalizeText(specs.retrieve_per_turn_cm),
        handle_length_mm: normalizeText(specs.handle_length_mm),
        bearing_count_roller: normalizeText(specs.bearing_count_roller),
        body_material: normalizeText(specs.body_material),
        body_material_tech: '',
        gear_material: '',
        handle_knob_type: normalizeText(specs.handle_knob_type),
        official_environment: '',
        line_capacity_display: buildLineCapacityDisplay(specs),
        market_reference_price: normalizeText(specs.official_reference_price) || item.official_reference_price,
        product_code: normalizeText(specs.product_code),
        created_at: now,
        updated_at: now,
        drag_click: '',
        spool_depth_normalized: '',
        gear_ratio_normalized: '',
        brake_type_normalized: '',
        fit_style_tags: '',
        min_lure_weight_hint: '',
        is_compact_body: isDaiwaCompactBodySku(variant.sku) ? '是' : '',
        handle_style: getDaiwaSpinningHandleStyle(variant.sku),
        MAX_DURABILITY: '',
        type: 'spinning',
        is_sw_edition: '',
        variant_description: normalizeText(variant.description),
        Description: normalizeText(variant.description),
        player_environment: '',
        is_handle_double: isDaiwaDoubleHandleSku(variant.sku) ? '1' : '0',
        EV_link: '',
        Specs_link: '',
      });
    });
  });

  let finalReelRows = reelRows;
  let finalDetailRows = detailRows;
  if (fs.existsSync(OUTPUT_FILE) && lockedReels.size) {
    const existing = XLSX.readFile(OUTPUT_FILE);
    const existingReelRows = XLSX.utils.sheet_to_json(existing.Sheets[SHEET_NAMES.reel], { defval: '' });
    const existingDetailRows = XLSX.utils.sheet_to_json(existing.Sheets[SHEET_NAMES.spinningReelDetail], { defval: '' });
    finalReelRows = [
      ...existingReelRows.filter((row) => lockedReels.has(String(row.id || ''))),
      ...reelRows.filter((row) => !lockedReels.has(String(row.id || ''))),
    ];
    finalDetailRows = [
      ...existingDetailRows.filter((row) => lockedReels.has(String(row.reel_id || ''))),
      ...detailRows.filter((row) => !lockedReels.has(String(row.reel_id || ''))),
    ];
  }
  finalReelRows.sort((a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true }));
  finalDetailRows.sort((a, b) =>
    String(a.reel_id || '').localeCompare(String(b.reel_id || ''), 'en', { numeric: true }) ||
    String(a.id || '').localeCompare(String(b.id || ''), 'en', { numeric: true }) ||
    String(a.SKU || '').localeCompare(String(b.SKU || ''), 'en', { numeric: true })
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finalReelRows, { header: HEADERS.reelMaster }), SHEET_NAMES.reel);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finalDetailRows, { header: HEADERS.spinningReelDetail }), SHEET_NAMES.spinningReelDetail);
  XLSX.writeFile(wb, OUTPUT_FILE);
}

async function main() {
  const items = await fetchListItems();
  const normalized = [];
  const now = new Date().toISOString();

  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx];
    try {
      let model = cleanModelText(item.text);
      const sourceId = normalizeText(item.href).replace(/\/+$/, '').split('/').pop() || model || `idx_${idx}`;
      const price = (item.text.match(/¥\s*([^\n]+)/) || [])[0] || '';
      const detail = await fetchDetail(item, sourceId);
      if (!model) model = cleanModelText(detail.title);
      const modelYear = extractYear(detail.title || model || detail.priceText);
      const alias = buildAlias(modelYear, model);

      const filename = `${sanitizeFilename(model)}_main.jpg`;
      const localMain = path.join(IMAGE_DIR, filename);
      if (item.mainImage && !fs.existsSync(localMain)) {
        try {
          downloadFile(item.mainImage, localMain);
        } catch {
          try {
            await downloadFileWithBrowser(item.mainImage, localMain);
          } catch {}
        }
      }

      let variants = detail.variantRows;
      let specText = '';
      let specOcr = null;
      let localSpecPath = detail.localSpecPath || '';
      if (detail.priceImages.length) {
        const specImage = detail.priceImages[0];
        localSpecPath = detail.localSpecPath || path.join('/tmp/daiwa_tw_spec_ocr', `${sanitizeFilename(sourceId)}_spec.jpg`);
        fs.mkdirSync(path.dirname(localSpecPath), { recursive: true });
        if (!fs.existsSync(localSpecPath)) {
          try {
            downloadFile(specImage.src, localSpecPath);
          } catch {
            try {
              await downloadFileWithBrowser(specImage.src, localSpecPath);
            } catch {}
          }
        }
        try {
          specOcr = ocrImageJson(localSpecPath);
          specText = specOcr?.items?.map((entry) => normalizeText(entry.text)).filter(Boolean).join('\n') || ocrImage(localSpecPath);
          const derivedVariants = deriveVariantsFromSpecText(specText);
          if (derivedVariants.length) {
            variants = mergeVariants(derivedVariants, variants);
          }
          const parsed = parseSpecOcr(specOcr, variants, specText);
          const fallback = parsed.length ? parsed : parseSpecText(specText, variants);
          if (fallback.length) variants = fallback;
        } catch {}
      }

      normalized.push({
        model,
        model_year: modelYear,
        alias,
        source_url: item.href,
        main_image_url: item.mainImage,
        local_image_path: `images/daiwa_reels/${filename}`,
        local_spec_path: localSpecPath || '',
        images: `${STATIC_PREFIX}${encodeURIComponent(filename)}`,
        intro_text: detail.introText,
        price_text: detail.priceText,
        spec_text: specText,
        spec_ocr: specOcr,
        spec_images: detail.priceImages,
        variants,
        official_reference_price: price,
      });

      writeOutputs(normalized, now);
      console.log(JSON.stringify({ progress: `${idx + 1}/${items.length}`, model }, null, 2));
    } catch (error) {
      console.error(JSON.stringify({ progress: `${idx + 1}/${items.length}`, href: item.href, error: String(error?.message || error) }, null, 2));
    }
  }

  writeOutputs(normalized, now);
  console.log(JSON.stringify({
    list_url: LIST_URL,
    items: normalized.length,
    output: OUTPUT_FILE,
    json: OUTPUT_JSON,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
