const path = require('path');
const XLSX = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'GearSage-client/pkgGear/data_raw/mustad_hook_import.xlsx');
const TARGET_HOOK = path.join(ROOT, 'GearSage-client/rate/excel/hook.xlsx');
const TARGET_DETAIL = path.join(ROOT, 'GearSage-client/rate/excel/hook_detail.xlsx');
const PREFIX = 'MHK';

function norm(v) {
  return String(v === 0 ? '0' : (v || '')).trim();
}

function readRows(filePath, sheetName) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    throw new Error(`sheet missing: ${filePath}#${sheetName}`);
  }
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function writeRows(filePath, sheetName, rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filePath);
}

function mergeSlice(existingRows, incomingRows, matchField, prefix) {
  const incomingSlice = incomingRows.filter((row) => norm(row[matchField]).startsWith(prefix));
  const existingById = new Map();

  existingRows.forEach((row) => {
    const id = norm(row.id);
    if (id) existingById.set(id, row);
  });

  const mergedById = new Map();
  let replaced = 0;
  let added = 0;

  incomingSlice.forEach((incoming) => {
    const id = norm(incoming.id);
    if (!id || mergedById.has(id)) return;

    if (existingById.has(id)) {
      replaced += 1;
      const merged = { ...existingById.get(id) };
      Object.keys(incoming).forEach((key) => {
        if (norm(incoming[key]) !== '') {
          merged[key] = incoming[key];
        }
      });
      mergedById.set(id, merged);
    } else {
      added += 1;
      mergedById.set(id, incoming);
    }
  });

  const output = [];
  existingRows.forEach((row) => {
    const id = norm(row.id);
    if (id && mergedById.has(id)) output.push(mergedById.get(id));
    else output.push(row);
  });

  mergedById.forEach((row, id) => {
    if (!existingById.has(id)) output.push(row);
  });

  return { rows: output, incoming: incomingSlice.length, replaced, added };
}

function main() {
  const sourceHookRows = readRows(SRC, 'hook');
  const sourceDetailRows = readRows(SRC, 'hook_detail');
  const targetHookRows = readRows(TARGET_HOOK, 'hook');
  const targetDetailRows = readRows(TARGET_DETAIL, 'hook_detail');

  const beforeHook = targetHookRows.filter((row) => norm(row.id).startsWith(PREFIX)).length;
  const beforeDetail = targetDetailRows.filter((row) => norm(row.hookId).startsWith(PREFIX)).length;

  const hookMerged = mergeSlice(targetHookRows, sourceHookRows, 'id', PREFIX);
  const detailMerged = mergeSlice(targetDetailRows, sourceDetailRows, 'hookId', PREFIX);

  writeRows(TARGET_HOOK, 'hook', hookMerged.rows);
  writeRows(TARGET_DETAIL, 'hook_detail', detailMerged.rows);

  const afterHookRows = readRows(TARGET_HOOK, 'hook');
  const afterDetailRows = readRows(TARGET_DETAIL, 'hook_detail');

  const afterHook = afterHookRows.filter((row) => norm(row.id).startsWith(PREFIX)).length;
  const afterDetail = afterDetailRows.filter((row) => norm(row.hookId).startsWith(PREFIX)).length;

  console.log(
    JSON.stringify(
      {
        prefix: PREFIX,
        source: {
          hook: sourceHookRows.length,
          hook_detail: sourceDetailRows.length,
        },
        hook: {
          before: beforeHook,
          after: afterHook,
          incoming: hookMerged.incoming,
          replaced: hookMerged.replaced,
          added: hookMerged.added,
          total_after: afterHookRows.length,
        },
        hook_detail: {
          before: beforeDetail,
          after: afterDetail,
          incoming: detailMerged.incoming,
          replaced: detailMerged.replaced,
          added: detailMerged.added,
          total_after: afterDetailRows.length,
        },
      },
      null,
      2
    )
  );
}

main();
