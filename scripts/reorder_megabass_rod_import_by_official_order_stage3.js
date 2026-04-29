const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { HEADERS, SHEET_NAMES } = require('./gear_export_schema');
const { runMegabassRodDetailGroupShading } = require('./run_megabass_rod_detail_group_shading');

const RAW_FILE = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_rod_raw.json');
const ORDER_FILE = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_rod_official_order.json');
const XLSX_FILE = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_rod_import.xlsx');

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(value) {
  const text = String(value || '').split('#')[0].trim();
  if (!text) return '';
  return text.replace(/\/+$/, '') + '/';
}

function normalizeSku(value) {
  return n(value).toUpperCase();
}

function alignHeaders(rows, headers) {
  return rows.map((row) => {
    const out = {};
    for (const header of headers) out[header] = row[header] ?? '';
    for (const [key, value] of Object.entries(row)) {
      if (!(key in out)) out[key] = value;
    }
    return out;
  });
}

function main() {
  const rawRows = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const officialOrder = JSON.parse(fs.readFileSync(ORDER_FILE, 'utf8'));
  const wb = xlsx.readFile(XLSX_FILE, { cellDates: false });
  const rodRows = xlsx.utils.sheet_to_json(wb.Sheets[SHEET_NAMES.rod], { defval: '' });
  const detailRows = xlsx.utils.sheet_to_json(wb.Sheets[SHEET_NAMES.rodDetail], { defval: '' });

  const urlOrder = new Map();
  const urlSeriesOrder = new Map();
  for (const series of officialOrder.series || []) {
    for (const [productIndex, productUrl] of (series.product_urls || []).entries()) {
      const url = normalizeUrl(productUrl);
      const absoluteIndex = Number(series.series_index) * 10000 + productIndex;
      urlOrder.set(url, absoluteIndex);
      urlSeriesOrder.set(url, Number(series.series_index));
    }
  }

  const rawBySku = new Map();
  for (const item of rawRows) {
    rawBySku.set(normalizeSku(item.model_name), item);
  }

  const oldDetailIndex = new Map(detailRows.map((row, index) => [n(row.id), index]));
  const oldRodIndex = new Map(rodRows.map((row, index) => [n(row.id), index]));

  function detailOrder(row) {
    const raw = rawBySku.get(normalizeSku(row.SKU));
    const url = normalizeUrl(raw?.url);
    const order = urlOrder.get(url);
    if (order !== undefined) return order;
    return 900000 + (oldDetailIndex.get(n(row.id)) ?? 0);
  }

  const sortedDetails = [...detailRows].sort((a, b) => {
    const delta = detailOrder(a) - detailOrder(b);
    if (delta !== 0) return delta;
    return (oldDetailIndex.get(n(a.id)) ?? 0) - (oldDetailIndex.get(n(b.id)) ?? 0);
  });

  const rodMinOrder = new Map();
  for (const row of sortedDetails) {
    const rodId = n(row.rod_id);
    if (!rodMinOrder.has(rodId)) rodMinOrder.set(rodId, detailOrder(row));
  }

  const sortedRods = [...rodRows].sort((a, b) => {
    const delta = (rodMinOrder.get(n(a.id)) ?? 900000) - (rodMinOrder.get(n(b.id)) ?? 900000);
    if (delta !== 0) return delta;
    return (oldRodIndex.get(n(a.id)) ?? 0) - (oldRodIndex.get(n(b.id)) ?? 0);
  });

  const missingOrder = sortedDetails.filter((row) => {
    const raw = rawBySku.get(normalizeSku(row.SKU));
    return !urlOrder.has(normalizeUrl(raw?.url));
  });

  const nextWb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    nextWb,
    xlsx.utils.json_to_sheet(alignHeaders(sortedRods, HEADERS.rodMaster), { header: HEADERS.rodMaster }),
    SHEET_NAMES.rod,
  );
  xlsx.utils.book_append_sheet(
    nextWb,
    xlsx.utils.json_to_sheet(alignHeaders(sortedDetails, HEADERS.rodDetail), { header: HEADERS.rodDetail }),
    SHEET_NAMES.rodDetail,
  );
  xlsx.writeFile(nextWb, XLSX_FILE);
  runMegabassRodDetailGroupShading();

  console.log({
    file: XLSX_FILE,
    masters: sortedRods.length,
    details: sortedDetails.length,
    order_series: officialOrder.series_count,
    order_products: officialOrder.product_count,
    missing_order_details: missingOrder.length,
    first_masters: sortedRods.slice(0, 5).map((row) => `${row.id}:${row.model}`),
    first_details: sortedDetails.slice(0, 12).map((row) => `${row.rod_id}:${row.SKU}`),
  });
}

main();
