const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const INPUT_JSON = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_test_normalized.json';
const OUTPUT_FILE = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import_test.xlsx';
const OCR_SWIFT = '/Users/tommy/GearSage/scripts/ocr_apple_vision.swift';
const LOCK_FILE = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_reels_locks.json';
const TARGET_MODELS = String(process.env.DAIWA_TARGET_MODELS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const TARGET_REEL_IDS = new Set(
  String(process.env.DAIWA_TARGET_REEL_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const UNLOCK_REELS = new Set(
  String(process.env.DAIWA_UNLOCK_REELS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function formatPrice(value) {
  const text = normalizeText(value).replace(/[^\d]/g, '');
  if (!text) return '';
  return `¥${Number(text).toLocaleString('en-US')}`;
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

function sanitizeFilename(name) {
  return String(name || '').replace(/[\\/*?:"<>|]/g, '_').trim();
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
  if (/^0\d-\d+$/.test(value)) {
    return value.replace(/^0(\d)-/, '0.$1-');
  }
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

function parseCertateHdSpecOcr(ocr, variants) {
  const rows = groupOCRRows(ocr);
  const dataRows = rows.filter((row) => row.items.some((item) => isVariantSku(item.text)));
  if (!dataRows.length) return [];
  const overrides = {
    'LT3000': { handle: '60', bearing: '12/1', max: '10', price: '¥82,000', code: '4550133499906' },
    'LT5000D-CXH': { handle: '60', bearing: '12/1', max: '12', price: '¥86,500', code: '4550133499937' },
  };
  return variants.slice(0, dataRows.length).map((variant, idx) => {
    const row = dataRows[idx];
    const rowText = row.items.map((item) => item.text).join(' ');
    const sku = normalizeSkuText(row.items.find((item) => isVariantSku(item.text))?.text || variant.sku);
    const values = row.items.map((item) => item.text);
    const weight = values.find((text) => /^\d{3}$/.test(text) && Number(text) >= 200) || '';
    const retrieve = values.find((text) => /^\d{2,3}$/.test(text) && Number(text) >= 70 && Number(text) <= 110) || '';
    const ratio = normalizeRatioText(values.find((text) => /^\d\.\d$/.test(text)) || '');
    const caps = extractCapacityTokensFromText(rowText);
    const handle = values.find((text) => /^\d{2,3}$/.test(text) && Number(text) >= 55 && Number(text) <= 65) || '';
    const bearing = (rowText.match(/\b12\/1\b/) || [])[0] || '';
    const maxDrag = (rowText.match(/\b12\/1\b\s+(\d{1,2})/) || [])[1] || (rowText.match(/\b(\d{1,2})\b(?=.*HG|EVA|79,500|82,000|83,000|86,500|88,000)/) || [])[1] || '';
    const priceMatch = rowText.match(/(\d{1,3}(?:,\d{3})?)\s+(455\d{10})/);
    const override = overrides[sku] || {};
    return {
      ...variant,
      sku,
      specs: {
        ...(variant.specs || {}),
        weight_g: weight,
        retrieve_per_turn_cm: retrieve,
        gear_ratio: ratio,
        bearing_count_roller: bearing || override.bearing || '',
        handle_length_mm: handle || override.handle || '',
        max_drag_kg: maxDrag || override.max || '',
        nylon_no_m: '',
        nylon_lb_m: caps[0] || '',
        pe_no_m: caps[1] || '',
        official_reference_price: formatPrice(priceMatch ? priceMatch[1] : '') || override.price || '',
        product_code: (priceMatch ? priceMatch[2] : '') || override.code || '',
      },
    };
  });
}

function parseFreamsSpecOcr(ocr, variants) {
  const rows = groupOCRRows(ocr);
  const dataRows = rows.filter((row) => row.items.some((item) => isVariantSku(item.text)));
  if (!dataRows.length) return [];
  const overrides = {
    'LT4000-CXH': { price: '¥22,200' },
    'LT6000D-H': { price: '¥25,100', code: '4550133542060' },
  };
  return variants.slice(0, dataRows.length).map((variant, idx) => {
    const row = dataRows[idx];
    const rowText = row.items.map((item) => item.text).join(' ');
    const skuToken = row.items.find((item) => isVariantSku(item.text))?.text || variant.sku;
    const sku = normalizeSkuText(skuToken);
    const weight = (row.items.find((item) => /^\d{3}$/.test(item.text) && Number(item.text) >= 170 && Number(item.text) <= 330 && item.x >= 0.10 && item.x <= 0.13)?.text || (skuToken.match(/\s(\d{3})$/) || [])[1] || '');
    const retrieve = row.items.find((item) => /^\d{2,3}$/.test(item.text) && Number(item.text) >= 60 && Number(item.text) <= 105 && item.x >= 0.17 && item.x <= 0.19)?.text || '';
    const ratio = normalizeRatioText(row.items.find((item) => /^(\d\.\d|\d{2})$/.test(item.text) && item.x >= 0.23 && item.x <= 0.25)?.text || '');
    const caps = row.items.flatMap((item) => extractCapacityTokensFromText(item.text));
    const handle = row.items.find((item) => /^\d{2}$/.test(item.text) && Number(item.text) >= 40 && Number(item.text) <= 65 && item.x >= 0.53 && item.x <= 0.56)?.text || '';
    const bearing = (rowText.match(/\b5\/1\b/) || [])[0] || '';
    let max = row.items.find((item) => /^(\d{1,2}(?:\.\d)?|100)$/.test(item.text) && item.x >= 0.66 && item.x <= 0.69)?.text || '';
    if (max === '100') max = '10.0';
    const priceMatch = rowText.match(/(\d{1,3}(?:,\d{3})?|\d{4,6})\s+(455\d{10,11})/);
    const override = overrides[sku] || {};
    let price = (formatPrice(priceMatch ? priceMatch[1] : '').replace(/^¥700$/, '¥18,700').replace(/^¥200$/, '¥20,200')) || override.price || '';
    if (sku === 'LT4000-CXH' && price === '¥20,200') price = '¥22,200';
    const productCode = ((priceMatch ? priceMatch[2] : '').replace(/^455013354206$/, '4550133542060')) || override.code || '';
    return {
      ...variant,
      sku,
      specs: {
        ...(variant.specs || {}),
        weight_g: weight,
        retrieve_per_turn_cm: retrieve,
        gear_ratio: ratio,
        bearing_count_roller: bearing,
        handle_length_mm: handle,
        max_drag_kg: max,
        nylon_no_m: caps[0] || '',
        nylon_lb_m: caps[1] || '',
        pe_no_m: caps[2] || '',
        official_reference_price: price,
        product_code: productCode,
      },
    };
  });
}

function parseCaldiaSpecOcr(ocr) {
  const rows = [
    ['FC LT1000S','165','64','5.1','2.5-100','0.3-200','40','6/1','5','¥28,800','4550133442414'],
    ['FC LT2000S','165','67','5.1','3-150','0.4-200','45','6/1','5','¥28,800','4550133442421'],
    ['FC LT2000S-H','165','76','5.8','3-150','0.4-200','45','6/1','5','¥28,800','4550133442438'],
    ['FC LT2500S','170','72','5.1','4-150','0.6-200','45','6/1','5','¥29,300','4550133442445'],
    ['FC LT2500S-H','170','82','5.8','4-150','0.6-200','50','6/1','5','¥29,300','4550133442452'],
    ['LT2500','185','73','5.2','6-150','0.8-200','50','6/1','10','¥29,300','4550133442469'],
    ['LT2500S','180','73','5.2','4-150','0.6-200','50','6/1','5','¥29,300','4550133442476'],
    ['LT2500S-XH','180','87','6.2','4-150','0.6-200','50','6/1','5','¥29,300','4550133442483'],
    ['LT3000S-CXH','195','93','6.2','6-150','0.8-200','55','6/1','10','¥30,300','4550133442490'],
    ['LT3000','210','77','5.2','8-150','1-200','60','6/1','10','¥31,300','4550133442506'],
    ['LT3000-XH','210','93','6.2','8-150','1-200','60','6/1','10','¥31,300','4550133442513'],
    ['LT4000-C','220','82','5.2','12-150','1.5-200','60','6/1','12','¥32,300','4550133442520'],
    ['LT4000-CXH','220','99','6.2','12-150','1.5-200','60','6/1','12','¥32,300','4550133442537'],
    ['LT5000-C','240','87','5.2','20-150','2-300','60','6/1','12','¥33,800','4550133442544'],
    ['LT5000-CXH','240','105','6.2','20-150','2-300','60','6/1','12','¥33,800','4550133458927'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku,
    description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseRevrosSpecOcr(ocr) {
  const rows = [
    ['LT1000S','190','64','5.2','2.5-100','0.3-200','45','4/1','5','¥9,700','4550133399169'],
    ['LT2000S','195','68','5.2','3-150','0.4-200','45','4/1','5','¥9,900','4550133399176'],
    ['LT2000S-XH','195','81','6.2','3-150','0.4-200','45','4/1','5','¥9,900','4550133399183'],
    ['LT2500D','210','75','5.3','12-150','1.2-300','55','4/1','10','¥10,300','4550133399190'],
    ['LT2500S-XH','210','87','6.2','4-150','0.6-200','55','4/1','5','¥10,300','4550133399206'],
    ['LT2500S-DH','225','75','5.3','4-150','0.6-200','55','4/1','5','¥11,300','4550133399213'],
    ['LT3000D-C','220','80','5.3','16-150','1.5-300','55','4/1','10','¥10,700','4550133399220'],
    ['LT3000-CXH','220','93','6.2','8-150','1-200','55','4/1','10','¥10,700','4550133399237'],
    ['LT4000-CXH','250','99','6.2','12-150','1.5-200','60','4/1','12','¥11,100','4550133399244'],
    ['LT5000-CXH','260','105','6.2','20-150','2-300','60','4/1','12','¥11,900','4550133399251'],
    ['LT6000D-H','335','101','5.7','30-150','3-300','60','4/1','12','¥12,500','4550133399268'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku,
    description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseCrossfireSpecOcr(ocr, variants) {
  const rows = groupOCRRows(ocr);
  const dataRows = rows.filter((row) => row.items.some((item) => isVariantSku(item.text)));
  if (!dataRows.length) return [];
  return variants.slice(0, dataRows.length).map((variant, idx) => {
    const row = dataRows[idx];
    const rowText = row.items.map((item) => item.text).join(' ');
    const sku = normalizeSkuText(row.items.find((item) => isVariantSku(item.text))?.text || variant.sku);
    const weight = row.items.find((item) => /^\d{3}$/.test(item.text) && Number(item.text) >= 220 && Number(item.text) <= 290)?.text || '';
    const retrieve = row.items.find((item) => /^\d{2,3}$/.test(item.text) && Number(item.text) >= 77 && Number(item.text) <= 105)?.text || '';
    const ratio = normalizeRatioText(row.items.find((item) => /^(\d\.\d|\d{2})$/.test(item.text) && item.x >= 0.33 && item.x <= 0.36)?.text || '');
    const caps = row.items.flatMap((item) => extractCapacityTokensFromText(item.text));
    const bearing = (rowText.match(/\b3\/1\b/) || [])[0] || '';
    const max = row.items.find((item) => /^\d{1,2}$/.test(item.text) && item.x >= 0.71 && item.x <= 0.73)?.text || '';
    const priceMatch = rowText.match(/(\d{3}(?:,\d{3})?)\s+(819\d{4})/);
    return {
      ...variant,
      sku,
      specs: {
        ...(variant.specs || {}),
        weight_g: weight,
        retrieve_per_turn_cm: retrieve,
        gear_ratio: ratio,
        bearing_count_roller: bearing,
        handle_length_mm: '',
        max_drag_kg: max,
        nylon_no_m: '',
        nylon_lb_m: caps[0] || '',
        pe_no_m: caps[1] || '',
        official_reference_price: formatPrice(priceMatch ? priceMatch[1] : ''),
        product_code: priceMatch ? priceMatch[2] : '',
      },
    };
  });
}

function parseCertateSw24SpecOcr(ocr, variants) {
  const rows = groupOCRRows(ocr);
  const dataRows = rows.filter((row) => row.items.some((item) => /24CERTATE SW/i.test(item.text)));
  if (!dataRows.length) return [];
  return dataRows.map((row, idx) => {
    const rowText = row.items.map((item) => item.text).join(' ');
    const rawSku = row.items.find((item) => /24CERTATE SW/i.test(item.text))?.text || (variants[idx]?.sku || '');
    const sku = normalizeText(rawSku).replace(/^24CERTATE SW\s*/i, '').trim();
    const weight = row.items.find((item) => /^\d{3}$/.test(item.text) && Number(item.text) >= 335 && Number(item.text) <= 375)?.text || '';
    const retrieve = row.items.find((item) => /^\d{2,3}$/.test(item.text) && Number(item.text) >= 82 && Number(item.text) <= 110)?.text || '';
    const ratio = normalizeRatioText(row.items.find((item) => /^(\d\.\d|\d{2})$/.test(item.text) && item.x >= 0.34 && item.x <= 0.36)?.text || '');
    const pe = extractCapacityTokensFromText(rowText)[0] || '';
    const handle = row.items.find((item) => /^\d{2}$/.test(item.text) && (item.text === '65' || item.text === '70'))?.text || '';
    const bearing = normalizeText((row.items.find((item) => /10\/[1L]?/.test(item.text))?.text || '')).replace('/L', '/1').replace(/10\/$/, '10/1');
    const max = row.items.find((item) => /^(12|15)$/.test(item.text) && item.x >= 0.64 && item.x <= 0.66)?.text || '';
    const priceMatch = rowText.match(/(\d{2},\d{3})\s+(4550133\d{6})/);
    return {
      ...(variants.find((v) => normalizeText(v.sku) === sku) || { sku, description: '', specs: {} }),
      sku,
      specs: {
        weight_g: weight,
        retrieve_per_turn_cm: retrieve,
        gear_ratio: ratio,
        bearing_count_roller: bearing,
        handle_length_mm: handle,
        max_drag_kg: max,
        nylon_no_m: '',
        nylon_lb_m: '',
        pe_no_m: pe,
        official_reference_price: formatPrice(priceMatch ? priceMatch[1] : ''),
        product_code: priceMatch ? priceMatch[2] : '',
      },
    };
  });
}

function parseEmeraldasAirSpecOcr(ocr, variants) {
  const rows = groupOCRRows(ocr);
  const dataRows = rows.filter((row) => row.items.some((item) => /LT2500|PC/i.test(item.text)));
  if (!dataRows.length) return [];
  return dataRows.map((row, idx) => {
    const rowText = row.items.map((item) => item.text).join(' ');
    const skuRaw = row.items.find((item) => /LT2500|PC/i.test(item.text))?.text || (variants[idx]?.sku || '');
    const sku = normalizeText(skuRaw).replace(/^PC\./i, 'PC ').replace(/\s+\d{3}$/, '').trim();
    const weight = row.items.find((item) => /^\d{3}$/.test(item.text) && Number(item.text) >= 155 && Number(item.text) <= 185)?.text || ((skuRaw.match(/\s(\d{3})$/) || [])[1] || '');
    const retrieve = row.items.find((item) => /^\d{2}$/.test(item.text) && Number(item.text) >= 72 && Number(item.text) <= 80)?.text || '';
    const ratio = normalizeRatioText(row.items.find((item) => /^\d\.\d$/.test(item.text))?.text || '');
    const pe = extractCapacityTokensFromText(rowText)[0] || '';
    const handle = row.items.find((item) => /^\d{2}$/.test(item.text) && (item.text === '50' || item.text === '55' || item.text === '90'))?.text || '';
    const bearing = (rowText.match(/\b12\/1\b/) || [])[0] || '';
    const max = row.items.find((item) => /^(5|10)$/.test(item.text))?.text || '';
    const priceMatch = rowText.match(/(\d{2},\d{3})\s+(455\d{10})/);
    return {
      ...(variants.find((v) => normalizeText(v.sku).replace(/^PC\./i, 'PC ') === sku) || { sku, description: '', specs: {} }),
      sku,
      specs: {
        weight_g: weight,
        retrieve_per_turn_cm: retrieve,
        gear_ratio: ratio,
        bearing_count_roller: bearing,
        handle_length_mm: handle,
        max_drag_kg: max,
        nylon_no_m: '',
        nylon_lb_m: '',
        pe_no_m: pe,
        official_reference_price: formatPrice(priceMatch ? priceMatch[1] : ''),
        product_code: priceMatch ? priceMatch[2] : '',
      },
    };
  });
}

function parseBallisticHdSpecOcr(ocr, variants) {
  const rows = groupOCRRows(ocr);
  const dataRows = rows.filter((row) => row.items.some((item) => /ARK/i.test(item.text)));
  if (!dataRows.length) return [];
  return dataRows.map((row, idx) => {
    const rowText = row.items.map((item) => item.text).join(' ');
    const sku = normalizeText(row.items.find((item) => /ARK/i.test(item.text))?.text || variants[idx]?.sku || '');
    const weight = row.items.find((item) => /^\d{3}$/.test(item.text) && Number(item.text) >= 275 && Number(item.text) <= 295)?.text || '';
    const ratio = normalizeRatioText(row.items.find((item) => /^(\d\.\d|\d{2})$/.test(item.text))?.text || '');
    const caps = extractCapacityTokensFromText(rowText);
    const bearing = '6/1';
    const max = row.items.find((item) => /^10$/.test(item.text))?.text || '';
    const priceMatch = rowText.match(/(\d[:.,]\d{3})\s+(G\d{6})/i);
    return {
      ...(variants.find((v) => normalizeText(v.sku) === sku) || { sku, description: '', specs: {} }),
      sku,
      specs: {
        weight_g: weight,
        retrieve_per_turn_cm: '',
        gear_ratio: ratio,
        bearing_count_roller: bearing,
        handle_length_mm: '',
        max_drag_kg: max,
        nylon_no_m: '',
        nylon_lb_m: caps[1] || '',
        pe_no_m: caps[0] || '',
        official_reference_price: (priceMatch ? `NT$${priceMatch[1].replace(':', ',').replace('.', ',')}` : ''),
        product_code: priceMatch ? priceMatch[2] : '',
      },
    };
  });
}

function parseLuviasSpecOcr() {
  const rows = [
    ['LT2000S-P','145','64','4.9','3-150','0.4-200','40','9/1','5','¥46,700','4550133388958'],
    ['LT2000S-H','145','76','5.8','3-150','0.4-200','45','9/1','5','¥46,700','4550133388965'],
    ['LT2500S','150','72','5.1','4-150','0.6-200','50','9/1','5','¥47,700','4550133388972'],
    ['LT2500S-DH','165','72','5.1','4-150','0.6-200','90','10/1','5','¥49,700','4550133388989'],
    ['LT2500S-XH','150','87','6.2','4-150','0.6-200','50','9/1','5','¥47,700','4550133388996'],
    ['PC LT2500','170','73','5.2','6-150','0.8-200','50','9/1','10','¥48,900','4550133389009'],
    ['PC LT2500-H','170','80','5.7','6-150','0.8-200','55','9/1','10','¥48,900','4550133389016'],
    ['LT3000-H','175','85','5.7','8-150','1-200','55','9/1','10','¥50,100','4550133389023'],
    ['PC LT3000','205','77','5.2','8-150','1-200','60','9/1','10','¥51,300','4550133389030'],
    ['PC LT3000-XH','205','93','6.2','8-150','1-200','60','9/1','12','¥51,300','4550133389047'],
    ['LT4000-XH','215','99','6.2','12-150','1.5-200','60','9/1','12','¥52,500','4550133389054'],
    ['LT5000D-CXH','225','105','6.2','25-150','2.5-300','60','9/1','12','¥54,500','4550133389061'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku,
    description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseEmeraldasXSpecOcr() {
  const rows = [
    ['LT2500','210','75','5.3','','0.8-200','50','7/1','10','¥20,700','4550133431470'],
    ['LT2500-XH','210','87','6.2','','0.8-200','55','7/1','10','¥20,700','4550133431487'],
    ['LT2500-DH','225','75','5.3','','0.8-200','90','7/1','10','¥22,000','4550133431494'],
    ['LT2500-XH-DH','225','87','6.2','','0.8-200','90','7/1','10','¥22,000','4550133431500'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku,
    description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseGekkabijinXSpecOcr() {
  return [{
    sku: 'LT2000S-P',
    description: '',
    specs: {
      weight_g: '190',
      retrieve_per_turn_cm: '63',
      gear_ratio: '4.8',
      bearing_count_roller: '5/1',
      handle_length_mm: '40',
      max_drag_kg: '5',
      nylon_no_m: '',
      nylon_lb_m: '3-150',
      pe_no_m: '0.4-200',
      official_reference_price: '¥18,700',
      product_code: '4550133393297',
    },
  }];
}

function parseEmeraldasRxSpecOcr() {
  const rows = [
    ['FC LT2500S-H-DH','195','82','5.8','','0.6-200','90','7/1','5','¥34,400','4550133336492'],
    ['LT2500-XH-DH','205','87','6.2','','0.8-200','90','7/1','10','¥34,400','4550133336515'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku,
    description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseAirityStSpecOcr() {
  const rows = [
    ['ST SF1000S-P','130','57','4.6','2.5-100','0.3-200','35','10/1','3','¥63,500','391354'],
    ['ST SF2000SS-P','130','60','4.6','2.5-100','0.3-200','40','10/1','3','¥63,500','391361'],
    ['ST SF2000SS-H','130','74','5.7','2.5-100','0.3-200','45','10/1','3','¥63,500','391378'],
    ['ST SF2500SS-H-QD','135','80','5.7','3-150','0.4-200','45','10/1','5','¥66,000','391385'],
    ['ST LT2000S-P','145','64','4.9','3-150','0.4-200','40','11/1','5','¥63,500','391392'],
    ['ST LT2500S-XH-QD','150','87','6.2','4-150','0.6-200','50','11/1','5','¥66,000','391408'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseCertate24SpecOcr() {
  const rows = [
    ['FC LT2000S-H','170','76','5.8','3-150','0.4-200','45','10/1','5','¥54,600','306556'],
    ['LT2500-H','200','80','5.7','6-150','0.8-200','55','10/1','10','¥55,600','306600'],
    ['LT3000-XH','225','93','6.2','8-150','1-200','60','10/1','10','¥57,600','306631'],
    ['LT4000-CXH','235','99','6.2','12-150','1.5-200','60','10/1','12','¥58,600','306655'],
    ['LT5000D-CXH','245','105','6.2','25-150','2.5-300','60','10/1','12','¥60,600','306662'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseBgSwSpecOcr() {
  const rows = [
    ['4000D-CXH','285','99','6.2','','1.5-430 / 2-300','','5/1','12','¥19,400','4550133347412'],
    ['5000D-CXH','290','105','6.2','','2-350 / 2.5-300','','5/1','12','¥19,400','4550133347429'],
    ['6000D-P','385','86','4.9','','3-300 / 4-220','','5/1','12','¥20,700','4550133347436'],
    ['6000D-H','385','101','5.7','','3-300 / 4-220','','5/1','12','¥20,700','4550133347443'],
    ['8000-P','605','94','4.9','','3-400 / 4-300','','5/1','15','¥23,300','4550133347450'],
    ['8000-H','605','110','5.7','','3-400 / 4-300','','5/1','15','¥23,300','4550133347467'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseExcelerLtSpecOcr() {
  const rows = [
    ['LT1000D-XH','175','77','6.2','6-150','0.6-300','', '5BB+1','5','NT$3,300','177761'],
    ['LT2000D','180','68','5.2','4-230','0.8-250','', '5BB+1','5','NT$3,300','177778'],
    ['LT2500D','195','75','5.3','8-100','1-180','', '5BB+1','10','NT$3,300','177808'],
    ['LT2500-XH','195','87','6.2','4-10','0.6-400','', '5BB+1','10','NT$3,300','177815'],
    ['LT3000D-C','200','80','5.3','6-200','1/260'.replace('/','-'),'', '5BB+1','10','NT$3,300','177839'],
    ['LT4000D-CXH','225','99','6.2','12-200','2-230','', '5BB+1','12','NT$3,300','177877'],
    ['LT5000D-CXH','230','105','6.2','20-150','2.5-300','', '5BB+1','12','NT$3,900','177907'],
    ['LT6000D','305','92','5.1','30-150','3-300','', '5BB+1','12','NT$3,900','177914'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseLexaSpecOcr() {
  const rows = [
    ['LT2500','220','75','5.3','1.5-150','0.8-200','50','5/1','5','¥23,100','4550133228650'],
    ['LT2500S','215','75','5.3','2-100','0.6-200','50','5/1','5','¥23,100','4550133228667'],
    ['LT2500-XH','220','87','6.2','1-150','0.8-200','55','5/1','10','¥23,100','4550133228674'],
    ['LT3000S-C','230','80','5.3','1.5-100','0.8-200','55','5/1','10','¥23,600','4550133228681'],
    ['LT3000S-CXH','230','93','6.2','1.5-150','0.8-200','55','5/1','10','¥23,600','4550133228698'],
    ['LT3000','245','77','5.2','2-100','1-200','60','5/1','10','¥24,100','4550133228704'],
    ['LT3000-XH','245','93','6.2','1.5-150','1-200','60','5/1','10','¥24,100','4550133228711'],
    ['LT4000-C','255','82','5.2','2-100','1.5-200','60','5/1','12','¥24,600','4550133228728'],
    ['LT4000-CXH','255','99','6.2','5-150','1.5-200','60','5/1','12','¥24,600','4550133228735'],
    ['LT5000-C','280','87','5.2','8-150','2-300','60','5/1','12','¥25,100','4550133228742'],
    ['LT5000-CXH','280','105','6.2','12-100','2-300','60','5/1','12','¥25,100','4550133228759'],
    ['LT6000D-H','365','101','5.7','30-150','3-300','65','5/1','12','¥26,100','4550133228766'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseSaltiga23SpecOcr() {
  const rows = [
    ['5000-P','365','82','4.9','','2.5-300','65','12/1','15','¥113,000','4550133431852'],
    ['6000-P','400','86','4.9','','3-300','70','12/1','15','¥115,000','4550133431869'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseAiritySpecOcr() {
  const rows = [
    ['LT2000S-P','145','64','4.9','3-150','0.4-200','40','11/1','5','¥63,500','4550133110566'],
    ['LT4000-XH','200','99','6.2','12-150','1.5-200','60','11/1','10','¥66,000','4550133259241'],
    ['LT5000D-CXH','205','105','6.2','25-150','2.5-300','60','11/1','10','¥68,000','4550133259258'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseExistSpecOcr() {
  const rows = [
    ['LT2000S-H','155','64','4.9','3-150','0.4-200','40','12/1','5','¥102,000','4550133109379'],
    ['LT2500S','155','76','5.8','3-150','0.4-200','42','12/1','5','¥102,000','4550133109386'],
    ['LT2500SDH','160','72','5.1','4-150','0.6-200','45','12/1','5','¥103,000','4550133109393'],
    ['LT2500S-H','160','82','5.8','4-150','0.6-200','45','12/1','5','¥103,000','4550133109409'],
    ['LT2500S-XH','180','87','6.2','4-150','0.6-200','45','12/1','5','¥103,000','4550133109423'],
    ['LT2500DH','170','72','5.1','4-150','0.6-200','90','14/1','5','¥106,000','4550133109416'],
    ['PCLT2500','175','73','5.2','6-150','0.8-200','50','12/1','10','¥104,000','4550133109430'],
    ['LT3000S','180','77','5.2','8-150','1-200','55','12/1','10','¥105,000','4550133109454'],
    ['PCLT3000','190','77','5.2','8-150','1-200','60','12/1','10','¥106,000','4550133109478'],
    ['PCLT3000-XH','190','93','6.2','8-150','1-200','60','12/1','10','¥106,000','4550133109485'],
    ['LT4000','205','82','5.2','12-150','1.5-200','60','12/1','10','¥107,000','4550133109492'],
    ['LT4000-XH','205','99','6.2','12-150','1.5-200','60','12/1','10','¥107,000','4550133109508'],
    ['LT5000-C','220','87','5.2','20-150','2-300','54','12/1','12','¥110,000','4550133109515'],
    ['LT5000-CXH','220','105','6.2','20-150','2-300','54','12/1','12','¥110,000','4550133109522'],
    ['SF-2500SS','140','','','3-150','0.4-200','45','11/1','','¥103,000','4550133173080'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseCaldiaSwSpecOcr() {
  const rows = [
    ['4000D-CXH','290','99','6.2','','1.5-430 / 2-300','60','6/1','12','¥33,300','4550133220661'],
    ['5000-CXH','295','105','6.2','','1.5-430 / 2-300','60','6/1','12','¥33,300','4550133361562'],
    ['5000D-CXH','295','105','6.2','','2-350 / 2.5-300','60','6/1','12','¥33,300','4550133165733'],
    ['6000S-H','430','101','5.7','','2-300 / 2.5-260','65','6/1','12','¥36,300','4550133165740'],
    ['8000-P','635','94','4.9','','3-400 / 4-300','75','6/1','15','¥40,200','4550133361579'],
    ['10000-P','650','103','4.9','','4-400 / 5-300','80','6/1','15','¥40,200','4550133361586'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseBgMqSpecOcr() {
  const rows = [
    ['2500D-H','235','','5.7','','1.2-300','', '6BB+1RB','10','NT$4,500','S45401U'],
    ['3000D-XH','265','','6.2','','1.5-300','', '6BB+1RB','10','NT$4,500','S45601U'],
    ['4000D-XH','285','','6.2','','2-300','', '6BB+1RB','12','NT$4,500','S45701U'],
    ['5000D-H','433','','5.7','','2.5-300','', '6BB+1RB','12','NT$4,600','S45801U'],
    ['6000D-H','430','','5.7','','3-300','', '6BB+1RB','12','NT$4,600','S45901U'],
    ['8000-H','635','','5.7','','4-300','', '6BB+1RB','15','NT$4,700','S48201U'],
    ['10000-H','646','','5.7','','5-300','', '6BB+1RB','15','NT$4,700','S48301U'],
    ['14000-H','640','','5.7','','6-300','', '6BB+1RB','15','NT$4,700','S48501U'],
    ['18000','863','','5.3','','8-300','', '6BB+1RB','20','NT$4,900','S48701U'],
    ['20000','858','','5.3','','10-300','', '6BB+1RB','20','NT$4,900','S48801U'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseCrossfireLtSpecOcr() {
  const rows = [
    ['LT2000-XH','230','81','6.2','5-120 / 6-100','0.8-190 / 1.0-140','', '3/1','5','NT$1,500','G603086'],
    ['LT2500-XH','255','87','6.2','6-150 / 8-100','0.8-200 / 1.0-190','', '3/1','10','NT$1,500','G603109'],
    ['LT3000-CXH','260','93','6.2','9-588 / 12-100','1.2-190 / 1.5-170','', '3/1','10','NT$1,500','G603123'],
    ['LT4000-CXH','295','99','6.2','12-150 / 14-130','1.5-200 / 2.0-170','', '3/1','12','NT$1,550','G603147'],
    ['LT5000-CXH','295','105','6.2','20-150 / 25-150','2.0-300 / 2.5-260','', '3/1','12','NT$1,550','G603161'],
    ['LT6000-H','380','101','5.7','20-170 / 25-150','2.5-300 / 3.0-210','', '3/1','12','NT$1,600','G603185'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseBgRrSpecOcr() {
  const rows = [
    ['LT3000D-XH-ARK','280','93','6.2','12-200 / 16-150','1.5-300 / 2-230','', '5/1','10','NT$4,100','S46620U'],
    ['LT3000D-ARK','280','77','5.2','12-200 / 16-150','1.5-300 / 2-230','', '5/1','10','NT$4,100','S46621U'],
    ['LT4000D-CXH-ARK','290','99','6.2','14-230 / 20-150','2-300 / 2.5-260','', '5/1','12','NT$4,200','S46720U'],
    ['LT5000D-CXH-ARK','295','105','6.2','20-170 / 25-150','2.5-300 / 3-210','', '5/1','12','NT$4,200','S46820U'],
    ['LT5000D-C-ARK','295','87','5.2','20-170 / 25-150','2.5-300 / 3-210','', '5/1','12','NT$4,200','S46821U'],
    ['LT6000D-H-ARK','390','101','5.7','20-250 / 30-150','3-300 / 4-220','', '5/1','12','NT$4,300','S46920U'],
    ['LT6000D-ARK','390','92','5.1','20-250 / 30-150','3-300 / 4-220','', '5/1','12','NT$4,300','S46921U'],
    ['LT8000-P-ARK','615','94','4.9','16-300 / 25-200','4-300 / 5-250','', '5/1','15','NT$4,300','S56201U'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: {
      weight_g: weight,
      retrieve_per_turn_cm: cm,
      gear_ratio: ratio,
      bearing_count_roller: bearing,
      handle_length_mm: handle,
      max_drag_kg: max,
      nylon_no_m: '',
      nylon_lb_m: nylon,
      pe_no_m: pe,
      official_reference_price: price,
      product_code: code,
    },
  }));
}

function parseRevros19SpecOcr() {
  const rows = [
    ['LT1000-XH','185','64','6.2','2.5-100','0.3-200','45','4/1','5','NT$1,300','858359'],
    ['LT2000','185','68','5.2','3-150','0.4-200','45','4/1','5','NT$1,300','858360'],
    ['LT2500','205','75','5.2','12-150','1.2-300','55','4/1','10','NT$1,300','858362'],
    ['LT3000-CXH','215','93','6.2','8-150','1-200','55','4/1','10','NT$1,300','858365'],
    ['LT4000-CXH','240','99','6.2','12-150','1.5-200','60','4/1','12','NT$1,500','858367'],
    ['LT5000-CXH','250','105','6.2','20-150','2-300','60','4/1','12','NT$1,500','858369'],
    ['LT6000-H','320','101','5.7','30-150','3-300','60','4/1','12','NT$1,600','858371'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: { weight_g: weight, retrieve_per_turn_cm: cm, gear_ratio: ratio, bearing_count_roller: bearing, handle_length_mm: handle, max_drag_kg: max, nylon_no_m: '', nylon_lb_m: nylon, pe_no_m: pe, official_reference_price: price, product_code: code }
  }));
}

function parseCrestSpecOcr() {
  const rows = [
    ['LT2000','215','68','5.2','4-150 / 5-120 / 6-100','0.6-200 / 0.8-190 / 1.0-140','45','4/1','5','¥6,400','4960652309394'],
    ['LT3000-CXH','240','93','6.2','8-150 / 10-120 / 12-100','1.0-200 / 1.2-190 / 1.5-170','55','4/1','10','¥6,900','4960652309455'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: { weight_g: weight, retrieve_per_turn_cm: cm, gear_ratio: ratio, bearing_count_roller: bearing, handle_length_mm: handle, max_drag_kg: max, nylon_no_m: '', nylon_lb_m: nylon, pe_no_m: pe, official_reference_price: price, product_code: code }
  }));
}

function parseFinesurf35SpecOcr() {
  const rows = [
    ['細系','595','87','4.1','1.5-200','0.8-250 / 1-200','85','2/1','8','¥9,500','076050'],
    ['太系','600','87','4.1','3-200','1.5-250 / 2-200','85','2/1','8','¥9,500','076067'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: { weight_g: weight, retrieve_per_turn_cm: cm, gear_ratio: ratio, bearing_count_roller: bearing, handle_length_mm: handle, max_drag_kg: max, nylon_no_m: '', nylon_lb_m: nylon, pe_no_m: pe, official_reference_price: price, product_code: code }
  }));
}

function parseCrosscastSpecOcr() {
  const rows = [
    ['4000','650','82','4.1','4-250 / 5-200 / 6-150','', '85','3/1','15','¥10,000','075930'],
    ['4500','640','82','4.1','6-200 / 7-170 / 8-140','', '85','3/1','15','¥10,300','075947'],
    ['5000','640','82','4.1','7-250 / 8-200 / 10-150','', '85','3/1','15','¥10,600','075954'],
    ['5500','635','82','4.1','8-250 / 10-200 / 12-170','', '85','3/1','15','¥11,000','075961'],
    ['6000','630','82','4.1','10-250 / 12-200 / 16-170','', '85','3/1','15','¥11,300','075978'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: { weight_g: weight, retrieve_per_turn_cm: cm, gear_ratio: ratio, bearing_count_roller: bearing, handle_length_mm: handle, max_drag_kg: max, nylon_no_m: '', nylon_lb_m: nylon, pe_no_m: pe, official_reference_price: price, product_code: code }
  }));
}

function parseWindsurf35SpecOcr() {
  const rows = [
    ['細系','550','87','4.1','1.5-200','0.8-250 / 1-200','85','4/1','8','¥18,300','076074'],
    ['太系','550','87','4.1','3-200','1.5-250 / 2-200','85','4/1','8','¥18,300','076081'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: { weight_g: weight, retrieve_per_turn_cm: cm, gear_ratio: ratio, bearing_count_roller: bearing, handle_length_mm: handle, max_drag_kg: max, nylon_no_m: '', nylon_lb_m: nylon, pe_no_m: pe, official_reference_price: price, product_code: code }
  }));
}

function parseMgZSpecOcr() {
  const rows = [
    ['MG Z 2000','235','71','5.3','6-125 / 8-100 / 10-85','', '', '5', '2', 'NT$850', '570432'],
    ['MG Z 2500','265','80','5.3','6-190 / 8-155 / 10-130','', '', '5', '4', 'NT$850', '570449'],
    ['MG Z 3000','265','82','5.3','8-220 / 10-185 / 12-155','', '', '5', '4', 'NT$850', '570456'],
    ['MG Z 4000','395','95','5.3','10-270 / 12-240 / 14-190','', '', '5', '6', 'NT$1,000', '576779'],
    ['MG Z 5000','610','99','4.6','14-370 / 17-280 / 20-220','', '', '5', '8', 'NT$1,100', '583203'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: { weight_g: weight, retrieve_per_turn_cm: cm, gear_ratio: ratio, bearing_count_roller: bearing, handle_length_mm: handle, max_drag_kg: max, nylon_no_m: '', nylon_lb_m: nylon, pe_no_m: pe, official_reference_price: price, product_code: code }
  }));
}

function parseMgSSpecOcr() {
  const rows = [
    ['MG S2000','250','71','5.3','6-125 / 8-100 / 10-85','', '', '2', '2', 'NT$650', '570494'],
    ['MG S2500','285','80','5.3','6-190 / 8-155 / 10-130','', '', '2', '4', 'NT$650', '570500'],
    ['MG S3000','280','82','5.3','8-220 / 10-185 / 12-155','', '', '2', '4', 'NT$650', '570517'],
    ['MG S4000','415','95','5.3','10-270 / 12-240 / 14-190','', '', '2', '6', 'NT$750', '576755'],
  ];
  return rows.map(([sku, weight, cm, ratio, nylon, pe, handle, bearing, max, price, code]) => ({
    sku, description: '',
    specs: { weight_g: weight, retrieve_per_turn_cm: cm, gear_ratio: ratio, bearing_count_roller: bearing, handle_length_mm: handle, max_drag_kg: max, nylon_no_m: '', nylon_lb_m: nylon, pe_no_m: pe, official_reference_price: price, product_code: code }
  }));
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

  const preStandard = lines.slice(findIndex(lines, (line) => line.includes('型號')) + 1, standardStart === -1 ? undefined : standardStart);
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
  const handleLengths = extractTokens(
    bearingStart !== -1 ? standardScope.slice(0, standardScope.findIndex((line) => line.includes('軸承') || line.includes('滾珠/滾輪'))) : standardScope,
    /\b\d{2,3}\b/g
  )
    .filter((line) => Number(line) >= 35 && Number(line) <= 120)
    .slice(0, variantCount);

  const bearingMatches = [...String(specText || '').matchAll(/(?:\d+（)?(\d+\/\d+)(?:）)?/g)].map((m) => m[1]);
  const bearings = bearingMatches.slice(0, variantCount);

  const pairScope = priceStart !== -1 ? lines.slice(priceStart + 1) : [];
  const pairMatches = pairScope.flatMap((line) => [...line.matchAll(/(\d{1,3}(?:,\d{3})?|\d{4,6})\s+(\d{7,13})/g)]);
  const prices = pairMatches.map((m) => m[1]).slice(0, variantCount);
  const productCodes = pairMatches.map((m) => m[2]).slice(0, variantCount);

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

function rebuildFromCache() {
  const data = JSON.parse(fs.readFileSync(INPUT_JSON, 'utf8'));
  const now = new Date().toISOString();
  const reelRows = [];
  const detailRows = [];
  const targetIds = new Set();
  const lockedReels = fs.existsSync(LOCK_FILE)
    ? new Set((JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')).reel_ids || []).filter((id) => !UNLOCK_REELS.has(id)))
    : new Set();

  data.forEach((item, idx) => {
    const masterId = `DRE${1000 + idx}`;
    const hasExplicitReelTargets = TARGET_REEL_IDS.size > 0;
    const hasExplicitModelTargets = TARGET_MODELS.length > 0;
    const isTarget = hasExplicitReelTargets
      ? TARGET_REEL_IDS.has(masterId)
      : hasExplicitModelTargets
        ? TARGET_MODELS.includes(item.model)
        : true;
    if (!isTarget) return;
    targetIds.add(masterId);
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

    let variants = item.variants || [];
    if (item.spec_text) {
      const derivedVariants = deriveVariantsFromSpecText(item.spec_text);
      if (derivedVariants.length) variants = mergeVariants(derivedVariants, variants);
      const sourceId = normalizeText(item.source_url).replace(/\/+$/, '').split('/').pop() || '';
      const localSpecPath = item.local_spec_path || (sourceId ? path.join('/tmp/daiwa_tw_spec_ocr', `${sanitizeFilename(sourceId)}_spec.jpg`) : path.join('/tmp/daiwa_tw_spec_ocr', `${sanitizeFilename(item.model)}_spec.jpg`));
      const specOcr = fs.existsSync(localSpecPath) ? ocrImageJson(localSpecPath) : item.spec_ocr || null;
      const parsed = sourceId === '4550133499890'
        ? parseCertateHdSpecOcr(specOcr, variants)
        : sourceId === 'S45401U'
          ? parseBgMqSpecOcr()
          : sourceId === 'G603086'
            ? parseCrossfireLtSpecOcr()
            : sourceId === '858371'
              ? parseRevros19SpecOcr()
              : sourceId === '309394'
                ? parseCrestSpecOcr()
                : sourceId === '076050'
                  ? parseFinesurf35SpecOcr()
                  : sourceId === '075930'
                    ? parseCrosscastSpecOcr()
                    : sourceId === '076074'
                      ? parseWindsurf35SpecOcr()
                      : sourceId === 'G570449'
                        ? parseMgZSpecOcr()
                        : sourceId === 'G570494'
                          ? parseMgSSpecOcr()
            : sourceId === 'S56201U'
              ? parseBgRrSpecOcr()
        : sourceId === '4550133442421'
          ? parseCaldiaSpecOcr(specOcr)
          : sourceId === '4550133399169'
            ? parseRevrosSpecOcr(specOcr)
            : sourceId === '4550133391354'
              ? parseAirityStSpecOcr()
              : sourceId === '4550133110566'
                ? parseAiritySpecOcr()
                : sourceId === '00061091'
                  ? parseExistSpecOcr()
                  : sourceId === '4550133220661'
                    ? parseCaldiaSwSpecOcr()
              : sourceId === '4550133306556'
                ? parseCertate24SpecOcr()
                : sourceId === '4550133347412'
                  ? parseBgSwSpecOcr()
                  : sourceId === '177761'
                    ? parseExcelerLtSpecOcr()
                    : sourceId === '4550133228650'
                      ? parseLexaSpecOcr()
                      : sourceId === '4550133224027'
                        ? parseSaltiga23SpecOcr()
              : sourceId === '388958'
                ? parseLuviasSpecOcr()
                : sourceId === '431470'
                ? parseEmeraldasXSpecOcr()
                : sourceId === '4550133393297'
                  ? parseGekkabijinXSpecOcr()
                  : sourceId === '4550133336492'
                    ? parseEmeraldasRxSpecOcr()
        : sourceId === '4550133541810'
          ? parseFreamsSpecOcr(specOcr, variants)
          : sourceId === '4000001'
            ? parseCertateSw24SpecOcr(specOcr, variants)
          : sourceId === '4550133442414'
            ? parseEmeraldasAirSpecOcr(specOcr, variants)
            : sourceId === 'G387653'
              ? parseBallisticHdSpecOcr(specOcr, variants)
          : sourceId === '4550'
            ? parseCrossfireSpecOcr(specOcr, variants)
        : parseSpecOcr(specOcr, variants, item.spec_text);
      const fallback = parsed.length ? parsed : parseSpecText(item.spec_text, variants);
      if (fallback.length) variants = fallback;
    }
    if (!variants.length) {
      variants = [{ sku: item.model, description: normalizeText(item.intro_text).slice(0, 5000), specs: {} }];
    }

    variants.forEach((variant) => {
      const specs = variant.specs || {};
      detailRows.push({
        id: `DRED${10000 + detailRows.length}`,
        reel_id: masterId,
        SKU: normalizeText(variant.sku),
        'GEAR RATIO': normalizeText(specs.gear_ratio),
        DRAG: '',
        'MAX DRAG': normalizeText(specs.max_drag_kg),
        WEIGHT: normalizeText(specs.weight_g),
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
  if ((TARGET_MODELS.length || TARGET_REEL_IDS.size) && fs.existsSync(OUTPUT_FILE)) {
    const existing = XLSX.readFile(OUTPUT_FILE);
    const existingReelRows = XLSX.utils.sheet_to_json(existing.Sheets[SHEET_NAMES.reel], { defval: '' });
    const existingDetailRows = XLSX.utils.sheet_to_json(existing.Sheets[SHEET_NAMES.spinningReelDetail], { defval: '' });
    finalReelRows = [
      ...existingReelRows.filter((row) => !targetIds.has(String(row.id || ''))),
      ...reelRows,
    ];
    finalDetailRows = [
      ...existingDetailRows.filter((row) => !targetIds.has(String(row.reel_id || ''))),
      ...detailRows,
    ];
  } else if (fs.existsSync(OUTPUT_FILE) && lockedReels.size) {
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

  console.log(JSON.stringify({
    items: data.length,
    output: OUTPUT_FILE,
    mode: (TARGET_MODELS.length || TARGET_REEL_IDS.size) ? 'targeted-cache-rebuild' : 'cache-rebuild',
    target_models: TARGET_MODELS,
    target_reel_ids: [...TARGET_REEL_IDS],
    target_reels: [...targetIds],
  }, null, 2));
}

rebuildFromCache();
