const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { HEADERS, SHEET_NAMES } = require('./gear_export_schema');

const FILE_PATH = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/evergreen_rod_import.xlsx');
const BACKUP_PATH = path.resolve(
  __dirname,
  '../GearSage-client/pkgGear/data_raw/evergreen_rod_import.before_id_dedup.xlsx',
);

function normalize(v) {
  return String(v || '').trim();
}

function rodKey(r) {
  return [
    r.brand_id,
    r.model,
    r.model_cn,
    r.model_year,
    r.alias,
    r.type_tips,
    r.images,
    r.Description,
  ].map(normalize).join('||');
}

function detailKey(d) {
  return [
    d.TYPE,
    d.SKU,
    d['TOTAL LENGTH'],
    d.Action,
    d.PIECES,
    d.CLOSELENGTH,
    d.WEIGHT,
    d['Tip Diameter'],
    d['LURE WEIGHT'],
    d['Line Wt N F'],
    d['PE Line Size'],
    d['Handle Length'],
    d['Reel Seat Position'],
    d['CONTENT CARBON'],
    d['Market Reference Price'],
    d.AdminCode,
    d['Service Card'],
    d[' Jig Weight'],
    d['Squid Jig Size'],
    d['Sinker Rating'],
    d.POWER,
    d['LURE WEIGHT (oz)'],
    d['Sale Price'],
    d['Joint Type'],
    d['Code Name'],
    d['Fly Line'],
    d['Grip Type'],
    d['Reel Size'],
    d.Description,
    d['Extra Spec 1'],
    d['Extra Spec 2'],
  ].map(normalize).join('||');
}

function makeStats(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const k = normalize(r[key]);
    m.set(k, (m.get(k) || 0) + 1);
  }
  let dupRows = 0;
  for (const c of m.values()) {
    if (c > 1) dupRows += c;
  }
  return { total: rows.length, unique: m.size, dupRows };
}

function main() {
  const wb = XLSX.readFile(FILE_PATH);
  const rodRows = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });

  fs.copyFileSync(FILE_PATH, BACKUP_PATH);

  const detailIndexByRodId = new Map();
  detailRows.forEach((d, idx) => {
    const k = normalize(d.rod_id);
    if (!detailIndexByRodId.has(k)) detailIndexByRodId.set(k, []);
    detailIndexByRodId.get(k).push(idx);
  });

  const usedDetailIndex = new Set();
  const pairs = [];

  for (let i = 0; i < rodRows.length; i += 1) {
    const rod = rodRows[i];
    let detail = {};

    if (
      i < detailRows.length &&
      normalize(detailRows[i].rod_id) === normalize(rod.id) &&
      !usedDetailIndex.has(i)
    ) {
      detail = detailRows[i];
      usedDetailIndex.add(i);
    } else {
      const bucket = detailIndexByRodId.get(normalize(rod.id)) || [];
      const picked = bucket.find((idx) => !usedDetailIndex.has(idx));
      if (picked !== undefined) {
        detail = detailRows[picked];
        usedDetailIndex.add(picked);
      }
    }

    pairs.push({ rod, detail });
  }

  const uniquePairs = [];
  const seen = new Set();
  for (const pair of pairs) {
    const key = `${rodKey(pair.rod)}##${detailKey(pair.detail)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniquePairs.push(pair);
  }

  let rodCounter = 1000;
  let detailCounter = 10000;
  const newRodRows = [];
  const newDetailRows = [];

  for (const pair of uniquePairs) {
    const rodId = `ER${rodCounter++}`;
    const detailId = `ERD${detailCounter++}`;

    newRodRows.push({
      id: rodId,
      brand_id: pair.rod.brand_id || 15,
      model: pair.rod.model || '',
      model_cn: pair.rod.model_cn || '',
      model_year: pair.rod.model_year || '',
      alias: pair.rod.alias || '',
      type_tips: pair.rod.type_tips || '',
      images: pair.rod.images || '',
      created_at: '',
      updated_at: '',
      Description: pair.rod.Description || '',
    });

    newDetailRows.push({
      id: detailId,
      rod_id: rodId,
      TYPE: pair.detail.TYPE || '',
      SKU: pair.detail.SKU || '',
      'TOTAL LENGTH': pair.detail['TOTAL LENGTH'] || '',
      Action: pair.detail.Action || '',
      PIECES: pair.detail.PIECES || '',
      CLOSELENGTH: pair.detail.CLOSELENGTH || '',
      WEIGHT: pair.detail.WEIGHT || '',
      'Tip Diameter': pair.detail['Tip Diameter'] || '',
      'LURE WEIGHT': pair.detail['LURE WEIGHT'] || '',
      'Line Wt N F': pair.detail['Line Wt N F'] || '',
      'PE Line Size': pair.detail['PE Line Size'] || '',
      'Handle Length': pair.detail['Handle Length'] || '',
      'Reel Seat Position': pair.detail['Reel Seat Position'] || '',
      'CONTENT CARBON': pair.detail['CONTENT CARBON'] || '',
      'Market Reference Price': pair.detail['Market Reference Price'] || '',
      AdminCode: pair.detail.AdminCode || '',
      'Service Card': pair.detail['Service Card'] || '',
      ' Jig Weight': pair.detail[' Jig Weight'] || '',
      'Squid Jig Size': pair.detail['Squid Jig Size'] || '',
      'Sinker Rating': pair.detail['Sinker Rating'] || '',
      created_at: '',
      updated_at: '',
      POWER: pair.detail.POWER || '',
      'LURE WEIGHT (oz)': pair.detail['LURE WEIGHT (oz)'] || '',
      'Sale Price': pair.detail['Sale Price'] || '',
      'Joint Type': pair.detail['Joint Type'] || '',
      'Code Name': pair.detail['Code Name'] || '',
      'Fly Line': pair.detail['Fly Line'] || '',
      'Grip Type': pair.detail['Grip Type'] || '',
      'Reel Size': pair.detail['Reel Size'] || '',
      Description: pair.detail.Description || pair.rod.Description || '',
      'Extra Spec 1': pair.detail['Extra Spec 1'] || '',
      'Extra Spec 2': pair.detail['Extra Spec 2'] || '',
    });
  }

  const outWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    outWb,
    XLSX.utils.json_to_sheet(newRodRows, { header: HEADERS.rodMaster }),
    SHEET_NAMES.rod,
  );
  XLSX.utils.book_append_sheet(
    outWb,
    XLSX.utils.json_to_sheet(newDetailRows, { header: HEADERS.rodDetail }),
    SHEET_NAMES.rodDetail,
  );
  XLSX.writeFile(outWb, FILE_PATH);

  console.log('[before] rod.id', makeStats(rodRows, 'id'));
  console.log('[before] detail.id', makeStats(detailRows, 'id'));
  console.log('[before] detail.rod_id', makeStats(detailRows, 'rod_id'));
  console.log('[after]  rod.id', makeStats(newRodRows, 'id'));
  console.log('[after]  detail.id', makeStats(newDetailRows, 'id'));
  console.log('[after]  detail.rod_id', makeStats(newDetailRows, 'rod_id'));
  console.log(`[done] backup: ${BACKUP_PATH}`);
  console.log(`[done] updated: ${FILE_PATH}`);
}

main();
