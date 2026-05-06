const path = require('path');
const xlsx = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const EXCEL_DIR = gearDataPaths.excelDir;

const FILES = {
    lure: 'lure.xlsx',
    hardbait: 'hardbait_lure_detail.xlsx',
    metal: 'metal_lure_detail.xlsx',
    soft: 'soft_lure_detail.xlsx',
    wire: 'wire_lure_detail.xlsx',
    jig: 'jig_lure_detail.xlsx',
    rodDetail: 'rod_detail.xlsx',
};

const LEGACY_BRAND_PREFIX = {
    4: 'LF',
    5: 'YY',
    6: 'OSP',
};

const LURE_HEADERS = ['id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias', 'type_tips', 'system', 'water_column', 'action', 'images', 'created_at', 'updated_at', 'description'];
const DETAIL_HEADERS = {
    hardbait: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size', 'depth', 'action', 'subname', 'other.1'],
    metal: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size'],
    soft: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size', 'depth', 'action', 'subname', 'other.1', 'quantity (入数)'],
    wire: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size', 'depth', 'action', 'subname', 'other.1'],
    jig: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size', 'depth', 'action', 'subname', 'other.1'],
};
const ROD_DETAIL_HEADERS = ['id', 'rod_id', 'TYPE', 'SKU', 'POWER', 'TOTAL LENGTH', 'Action', 'PIECES', 'CLOSELENGTH', 'WEIGHT', 'Tip Diameter', 'LURE WEIGHT', 'Line Wt N F', 'PE Line Size', 'Handle Length', 'Reel Seat Position', 'CONTENT CARBON', 'Market Reference Price', 'AdminCode', 'Service Card', ' Jig Weight', 'Squid Jig Size', 'Sinker Rating', 'created_at', 'updated_at', 'LURE WEIGHT (oz)', 'Sale Price', 'Joint Type', 'Code Name', 'Fly Line', 'Grip Type', 'Reel Size', 'Description', 'Extra Spec 1', 'Extra Spec 2'];

function readRows(fileName, sheetName) {
    const filePath = path.join(EXCEL_DIR, fileName);
    const wb = xlsx.readFile(filePath);
    const targetSheet = sheetName || wb.SheetNames[0];
    return {
        filePath,
        sheetName: targetSheet,
        rows: xlsx.utils.sheet_to_json(wb.Sheets[targetSheet], { defval: '' }),
    };
}

function writeRows(filePath, sheetName, headers, rows) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows, { header: headers });
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    xlsx.writeFile(wb, filePath);
}

function buildLegacyLureIdMap(lureRows) {
    const map = new Map();
    const report = [];

    for (const [brandIdText, prefix] of Object.entries(LEGACY_BRAND_PREFIX)) {
        const brandId = Number(brandIdText);
        const legacyRows = lureRows
            .filter((row) => typeof row.id === 'number' && Number(row.brand_id) === brandId)
            .sort((a, b) => Number(a.id) - Number(b.id));

        legacyRows.forEach((row, index) => {
            const nextId = `${prefix}${1000 + index}`;
            map.set(Number(row.id), nextId);
            report.push({
                oldId: row.id,
                newId: nextId,
                brandId,
                model: row.model,
            });
        });
    }

    return { map, report };
}

function normalizeLureRows(rows, idMap) {
    return rows.map((row) => {
        if (typeof row.id !== 'number') {
            return row;
        }
        const nextId = idMap.get(Number(row.id));
        return nextId ? { ...row, id: nextId } : row;
    });
}

function normalizeDetailRows(rows, idMap, detailPrefixCounters) {
    return rows.map((row) => {
        if (typeof row.lure_id !== 'number') {
            return row;
        }

        const oldLureId = Number(row.lure_id);
        const newLureId = idMap.get(oldLureId);
        if (!newLureId) {
            return row;
        }

        const masterPrefix = newLureId.replace(/\d+$/, '');
        const detailPrefix = `${masterPrefix}D`;
        detailPrefixCounters[detailPrefix] ||= 10000;
        const nextDetailId = `${detailPrefix}${detailPrefixCounters[detailPrefix]++}`;

        return {
            ...row,
            id: nextDetailId,
            lure_id: newLureId,
        };
    });
}

function normalizeRodDetailRows(rows) {
    return rows.map((row) => {
        const nextRow = { ...row };
        nextRow['Extra Spec 1'] = row.__EMPTY || '';
        nextRow['Extra Spec 2'] = row.__EMPTY_1 || '';
        delete nextRow.__EMPTY;
        delete nextRow.__EMPTY_1;
        return nextRow;
    });
}

function main() {
    const lure = readRows(FILES.lure, 'lure');
    const hardbait = readRows(FILES.hardbait, 'hard_lure_detail');
    const metal = readRows(FILES.metal, 'metal_lure_detail');
    const soft = readRows(FILES.soft, 'soft_lure_detail');
    const wire = readRows(FILES.wire, 'wire_lure_detail');
    const jig = readRows(FILES.jig, 'jig_lure_detail');
    const rodDetail = readRows(FILES.rodDetail, 'rod_detail');

    const { map: legacyIdMap, report } = buildLegacyLureIdMap(lure.rows);
    const detailPrefixCounters = {};

    const nextLureRows = normalizeLureRows(lure.rows, legacyIdMap);
    const nextHardbaitRows = normalizeDetailRows(hardbait.rows, legacyIdMap, detailPrefixCounters);
    const nextMetalRows = normalizeDetailRows(metal.rows, legacyIdMap, detailPrefixCounters);
    const nextSoftRows = normalizeDetailRows(soft.rows, legacyIdMap, detailPrefixCounters);
    const nextWireRows = normalizeDetailRows(wire.rows, legacyIdMap, detailPrefixCounters);
    const nextJigRows = normalizeDetailRows(jig.rows, legacyIdMap, detailPrefixCounters);
    const nextRodDetailRows = normalizeRodDetailRows(rodDetail.rows);

    writeRows(lure.filePath, lure.sheetName, LURE_HEADERS, nextLureRows);
    writeRows(hardbait.filePath, hardbait.sheetName, DETAIL_HEADERS.hardbait, nextHardbaitRows);
    writeRows(metal.filePath, metal.sheetName, DETAIL_HEADERS.metal, nextMetalRows);
    writeRows(soft.filePath, soft.sheetName, DETAIL_HEADERS.soft, nextSoftRows);
    writeRows(wire.filePath, wire.sheetName, DETAIL_HEADERS.wire, nextWireRows);
    writeRows(jig.filePath, jig.sheetName, DETAIL_HEADERS.jig, nextJigRows);
    writeRows(rodDetail.filePath, rodDetail.sheetName, ROD_DETAIL_HEADERS, nextRodDetailRows);

    console.table(report);
    console.log('[normalize_rate_excel_keys] Updated lure master/detail IDs and rod_detail extra columns');
}

main();
