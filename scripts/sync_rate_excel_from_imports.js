const path = require('path');
const xlsx = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const RATE_EXCEL_DIR = path.join(ROOT, 'GearSage-client/rate/excel');
const DATA_RAW_DIR = path.join(ROOT, 'GearSage-client/pkgGear/data_raw');

const HEADERS = {
    lure: ['id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias', 'type_tips', 'system', 'water_column', 'action', 'images', 'created_at', 'updated_at', 'description'],
    line: ['id', 'brand_id', 'model', 'model_cn', 'model_year', 'alias', 'type_tips', 'images', 'created_at', 'updated_at', 'description'],
    hardbait_lure_detail: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size', 'depth', 'action', 'subname', 'other.1'],
    metal_lure_detail: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size'],
    soft_lure_detail: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size', 'depth', 'action', 'subname', 'other.1', 'quantity (入数)'],
    wire_lure_detail: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size', 'depth', 'action', 'subname', 'other.1'],
    jig_lure_detail: ['id', 'lure_id', 'SKU', 'WEIGHT', 'length', 'size', 'sinkingspeed', 'referenceprice', 'created_at', 'updated_at', 'COLOR', 'AdminCode', 'hook_size', 'depth', 'action', 'subname', 'other.1'],
    line_detail: ['id', 'line_id', 'SKU', 'COLOR', 'LENGTH(m)', 'SIZE NO.', 'MAX STRENGTH(lb)', 'MAX STRENGTH(kg)', 'AVG STRENGTH(lb)', 'AVG STRENGTH(kg)', 'Market Reference Price', 'AdminCode', 'created_at', 'updated_at'],
};

const TASKS = [
    {
        targetFile: 'lure.xlsx',
        targetSheet: 'lure',
        headerKey: 'lure',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'DL' },
        ],
    },
    {
        targetFile: 'hardbait_lure_detail.xlsx',
        targetSheet: 'hard_lure_detail',
        headerKey: 'hardbait_lure_detail',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'DL' },
        ],
    },
    {
        targetFile: 'metal_lure_detail.xlsx',
        targetSheet: 'metal_lure_detail',
        headerKey: 'metal_lure_detail',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'metal_lure_detail', matchField: 'lure_id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'metal_lure_detail', matchField: 'lure_id', prefix: 'DL' },
        ],
    },
    {
        targetFile: 'soft_lure_detail.xlsx',
        targetSheet: 'soft_lure_detail',
        headerKey: 'soft_lure_detail',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'DL' },
        ],
    },
    {
        targetFile: 'wire_lure_detail.xlsx',
        targetSheet: 'wire_lure_detail',
        headerKey: 'wire_lure_detail',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'wire_lure_detail', matchField: 'lure_id', prefix: 'DL' },
        ],
    },
    {
        targetFile: 'jig_lure_detail.xlsx',
        targetSheet: 'hard_lure_detail',
        headerKey: 'jig_lure_detail',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'DL' },
        ],
    },
    {
        targetFile: 'line.xlsx',
        targetSheet: 'line',
        headerKey: 'line',
        replacements: [
            { sourceFile: 'shimano_line_import.xlsx', sourceSheet: 'line', matchField: 'id', prefix: 'SLN' },
            { sourceFile: 'daiwa_line_import.xlsx', sourceSheet: 'line', matchField: 'id', prefix: 'DLN' },
        ],
    },
    {
        targetFile: 'line_detail.xlsx',
        targetSheet: 'line_detail',
        headerKey: 'line_detail',
        replacements: [
            { sourceFile: 'shimano_line_import.xlsx', sourceSheet: 'line_detail', matchField: 'line_id', prefix: 'SLN' },
            { sourceFile: 'daiwa_line_import.xlsx', sourceSheet: 'line_detail', matchField: 'line_id', prefix: 'DLN' },
        ],
    },
];

function readRows(filePath, sheetName) {
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];
    return xlsx.utils.sheet_to_json(ws, { defval: '' });
}

function replaceSlice(rows, incomingRows, matchField, prefix) {
    let inserted = false;
    let replacedCount = 0;
    const output = [];

    for (const row of rows) {
        const value = String(row[matchField] || '');
        if (value.startsWith(prefix)) {
            replacedCount += 1;
            if (!inserted) {
                output.push(...incomingRows);
                inserted = true;
            }
            continue;
        }
        output.push(row);
    }

    if (!inserted && incomingRows.length > 0) {
        output.push(...incomingRows);
    }

    return { rows: output, replacedCount };
}

function countPrefix(rows, matchField, prefix) {
    return rows.filter((row) => String(row[matchField] || '').startsWith(prefix)).length;
}

function writeSheet(filePath, sheetName, header, rows) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows, { header });
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    xlsx.writeFile(wb, filePath);
}

function main() {
    const report = [];

    for (const task of TASKS) {
        const targetPath = path.join(RATE_EXCEL_DIR, task.targetFile);
        let rows = readRows(targetPath, task.targetSheet);

        for (const replacement of task.replacements) {
            const sourcePath = path.join(DATA_RAW_DIR, replacement.sourceFile);
            const incomingRows = readRows(sourcePath, replacement.sourceSheet);
            const before = countPrefix(rows, replacement.matchField, replacement.prefix);
            const result = replaceSlice(rows, incomingRows, replacement.matchField, replacement.prefix);
            rows = result.rows;
            const after = countPrefix(rows, replacement.matchField, replacement.prefix);

            report.push({
                targetFile: task.targetFile,
                targetSheet: task.targetSheet,
                prefix: replacement.prefix,
                sourceFile: replacement.sourceFile,
                sourceSheet: replacement.sourceSheet,
                before,
                incoming: incomingRows.length,
                replaced: result.replacedCount,
                after,
            });
        }

        writeSheet(targetPath, task.targetSheet, HEADERS[task.headerKey], rows);
    }

    console.table(report);
}

main();
