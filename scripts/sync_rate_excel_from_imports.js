const path = require('path');
const xlsx = require('xlsx');
const { HEADERS } = require('./gear_export_schema');

const ROOT = path.resolve(__dirname, '..');
const RATE_EXCEL_DIR = path.join(ROOT, 'GearSage-client/rate/excel');
const DATA_RAW_DIR = path.join(ROOT, 'GearSage-client/pkgGear/data_raw');

const TASKS = [
    {
        targetFile: 'lure.xlsx',
        targetSheet: 'lure',
        headerKey: 'lureMaster',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'ML' },
        ],
    },
    {
        targetFile: 'hardbait_lure_detail.xlsx',
        targetSheet: 'hard_lure_detail',
        headerKey: 'hardbaitLureDetail',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'ML' },
        ],
    },
    {
        targetFile: 'metal_lure_detail.xlsx',
        targetSheet: 'metal_lure_detail',
        headerKey: 'metalLureDetail',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'metal_lure_detail', matchField: 'lure_id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'metal_lure_detail', matchField: 'lure_id', prefix: 'DL' },
        ],
    },
    {
        targetFile: 'soft_lure_detail.xlsx',
        targetSheet: 'soft_lure_detail',
        headerKey: 'softLureDetail',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'ML' },
        ],
    },
    {
        targetFile: 'wire_lure_detail.xlsx',
        targetSheet: 'wire_lure_detail',
        headerKey: 'wireLureDetail',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'wire_lure_detail', matchField: 'lure_id', prefix: 'DL' },
        ],
    },
    {
        targetFile: 'jig_lure_detail.xlsx',
        targetSheet: 'jig_lure_detail',
        headerKey: 'jigLureDetail',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'ML' },
        ],
    },
    {
        targetFile: 'line.xlsx',
        targetSheet: 'line',
        headerKey: 'lineMaster',
        replacements: [
            { sourceFile: 'shimano_line_import.xlsx', sourceSheet: 'line', matchField: 'id', prefix: 'SLN' },
            { sourceFile: 'daiwa_line_import.xlsx', sourceSheet: 'line', matchField: 'id', prefix: 'DLN' },
        ],
    },
    {
        targetFile: 'line_detail.xlsx',
        targetSheet: 'line_detail',
        headerKey: 'lineDetail',
        replacements: [
            { sourceFile: 'shimano_line_import.xlsx', sourceSheet: 'line_detail', matchField: 'line_id', prefix: 'SLN' },
            { sourceFile: 'daiwa_line_import.xlsx', sourceSheet: 'line_detail', matchField: 'line_id', prefix: 'DLN' },
        ],
    },
    {
        targetFile: 'reel.xlsx',
        targetSheet: 'reel',
        headerKey: 'reelMaster',
        replacements: [
            { sourceFiles: ['shimano_spinning_reels_import.xlsx', 'shimano_baitcasting_reels_import.xlsx'], sourceSheet: 'reel', matchField: 'id', prefix: 'SRE' },
            { sourceFile: 'daiwa_baitcasting_reel_import.xlsx', sourceSheet: 'reel', matchField: 'id', prefix: 'DRE' },
            { sourceFile: 'megabass_reel_import.xlsx', sourceSheet: 'reel', matchField: 'id', prefix: 'MRE' },
        ],
    },
    {
        targetFile: 'spinning_reel_detail.xlsx',
        targetSheet: 'spinning_reel_detail',
        headerKey: 'spinningReelDetail',
        replacements: [
            { sourceFile: 'shimano_spinning_reels_import.xlsx', sourceSheet: 'spinning_reel_detail', matchField: 'reel_id', prefix: 'SRE' },
            { sourceFile: 'megabass_reel_import.xlsx', sourceSheet: 'spinning_reel_detail', matchField: 'reel_id', prefix: 'MRE' },
        ],
    },
    {
        targetFile: 'baitcasting_reel_detail.xlsx',
        targetSheet: 'baitcasting_reel_detail',
        headerKey: 'baitcastingReelDetail',
        replacements: [
            { sourceFile: 'shimano_baitcasting_reels_import.xlsx', sourceSheet: 'baitcasting_reel_detail', matchField: 'reel_id', prefix: 'SRE' },
            { sourceFile: 'daiwa_baitcasting_reel_import.xlsx', sourceSheet: 'baitcasting_reel_detail', matchField: 'reel_id', prefix: 'DRE' },
            { sourceFile: 'megabass_reel_import.xlsx', sourceSheet: 'baitcasting_reel_detail', matchField: 'reel_id', prefix: 'MRE' },
        ],
    },
    {
        targetFile: 'rod.xlsx',
        targetSheet: 'rod',
        headerKey: 'rodMaster',
        replacements: [
            { sourceFile: 'shimano_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'SR' },
            { sourceFile: 'daiwa_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'DR' },
            { sourceFile: 'megabass_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'MR' },
        ],
    },
    {
        targetFile: 'rod_detail.xlsx',
        targetSheet: 'rod_detail',
        headerKey: 'rodDetail',
        replacements: [
            { sourceFile: 'shimano_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'SR' },
            { sourceFile: 'daiwa_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'DR' },
            { sourceFile: 'megabass_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'MR' },
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
            let incomingRows = [];
            const sourceFiles = replacement.sourceFiles || [replacement.sourceFile];
            for (const file of sourceFiles) {
                const sourcePath = path.join(DATA_RAW_DIR, file);
                incomingRows = incomingRows.concat(readRows(sourcePath, replacement.sourceSheet));
            }
            const result = replaceSlice(rows, incomingRows, replacement.matchField, replacement.prefix);
            rows = result.rows;
            
            report.push({
                targetFile: task.targetFile,
                targetSheet: task.targetSheet,
                prefix: replacement.prefix,
                sourceFile: sourceFiles.join(', '),
                sourceSheet: replacement.sourceSheet,
                before: countPrefix(readRows(targetPath, task.targetSheet), replacement.matchField, replacement.prefix),
                incoming: incomingRows.length,
                replaced: result.replacedCount,
                after: countPrefix(rows, replacement.matchField, replacement.prefix),
            });
        }

        writeSheet(targetPath, task.targetSheet, HEADERS[task.headerKey], rows);
    }

    console.table(report);
}

main();
