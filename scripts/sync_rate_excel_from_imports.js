const path = require('path');
const xlsx = require('xlsx');
const { HEADERS } = require('./gear_export_schema');

const ROOT = path.resolve(__dirname, '..');
const RATE_EXCEL_DIR = path.join(ROOT, 'GearSage-client/rate/excel');
const DATA_RAW_DIR = path.join(ROOT, 'GearSage-client/pkgGear/data_raw');
const REQUIRED_FIELDS_BY_HEADER = {
    reelMaster: ['id', 'brand_id', 'model', 'type'],
    spinningReelDetail: ['id', 'reel_id', 'SKU', 'type'],
    baitcastingReelDetail: ['id', 'reel_id', 'SKU', 'type'],
    rodMaster: ['id', 'brand_id', 'model'],
    rodDetail: ['id', 'rod_id', 'SKU'],
    lureMaster: ['id', 'brand_id', 'model'],
    hardbaitLureDetail: ['id', 'lure_id', 'SKU'],
    metalLureDetail: ['id', 'lure_id', 'SKU'],
    softLureDetail: ['id', 'lure_id', 'SKU'],
    wireLureDetail: ['id', 'lure_id', 'SKU'],
    jigLureDetail: ['id', 'lure_id', 'SKU'],
    lineMaster: ['id', 'brand_id', 'model'],
    lineDetail: ['id', 'line_id', 'SKU'],
};

const TASKS = [
    {
        targetFile: 'lure.xlsx',
        targetSheet: 'lure',
        headerKey: 'lureMaster',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'ML' },
            { sourceFile: 'keitech_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'KL' },
            { sourceFile: 'yamamoto_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'YAM' },
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
            { sourceFile: 'keitech_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'KL' },
            { sourceFile: 'yamamoto_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'YAM' },
        ],
    },
    {
        targetFile: 'wire_lure_detail.xlsx',
        targetSheet: 'wire_lure_detail',
        headerKey: 'wireLureDetail',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'wire_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'keitech_lure_import.xlsx', sourceSheet: 'wire_lure_detail', matchField: 'lure_id', prefix: 'KL' },
        ],
    },
    {
        targetFile: 'jig_lure_detail.xlsx',
        targetSheet: 'jig_lure_detail',
        headerKey: 'jigLureDetail',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'ML' },
            { sourceFile: 'keitech_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'KL' },
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
            { sourceFiles: ['daiwa_reels_import.xlsx', 'daiwa_baitcasting_reel_import.xlsx'], sourceSheet: 'reel', matchField: 'id', prefix: 'DRE' },
            { sourceFiles: ['shimano_spinning_reels_import.xlsx', 'shimano_baitcasting_reels_import.xlsx'], sourceSheet: 'reel', matchField: 'id', prefix: 'SRE' },
            { sourceFile: 'megabass_reel_import.xlsx', sourceSheet: 'reel', matchField: 'id', prefix: 'MRE' },
        ],
    },
    {
        targetFile: 'spinning_reel_detail.xlsx',
        targetSheet: 'spinning_reel_detail',
        headerKey: 'spinningReelDetail',
        replacements: [
            { sourceFile: 'daiwa_reels_import.xlsx', sourceSheet: 'spinning_reel_detail', matchField: 'reel_id', prefix: 'DRE' },
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
            { sourceFile: 'keitech_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'KR' },
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
            { sourceFile: 'keitech_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'KR' },
        ],
    },
];

function normalizeText(value) {
    return String(value === 0 ? '0' : (value || '')).trim();
}

function readRows(filePath, sheetName, options = {}) {
    const { strict = false } = options;
    if (!xlsx || !filePath) {
        return [];
    }
    if (!require('fs').existsSync(filePath)) {
        if (strict) {
            throw new Error(`source workbook missing: ${filePath}`);
        }
        return [];
    }
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[sheetName];
    if (!ws) {
        if (strict) {
            throw new Error(`sheet missing: ${filePath}#${sheetName}`);
        }
        return [];
    }
    return xlsx.utils.sheet_to_json(ws, { defval: '' });
}

function replaceSlice(rows, incomingRows, matchField, prefix) {
    let replacedCount = 0;
    const output = [];
    
    // Map existing rows by ID
    const existingById = new Map();
    for (const row of rows) {
        if (row.id) {
            existingById.set(row.id, row);
        }
    }
    
    const processedIncomingIds = new Set();
    const mergedIncomingRows = [];

    // Process incoming rows
    for (const incoming of incomingRows) {
        // Ensure the incoming row actually belongs to this slice
        const matchValue = String(incoming[matchField] || '');
        if (!matchValue.startsWith(prefix)) {
            continue;
        }
        
        const id = incoming.id;
        if (!id) {
            mergedIncomingRows.push(incoming);
            continue;
        }

        if (processedIncomingIds.has(id)) {
            continue; // Skip duplicates in incoming
        }
        processedIncomingIds.add(id);

        if (existingById.has(id)) {
            replacedCount += 1;
            const existing = existingById.get(id);
            const merged = { ...existing };
            
            // Merge logic: only overwrite if incoming value is not empty
            for (const key of Object.keys(incoming)) {
                const incValue = incoming[key];
                const incStr = String(incValue === 0 ? '0' : (incValue || '')).trim();
                if (incStr !== '') {
                    merged[key] = incValue;
                }
            }
            mergedIncomingRows.push(merged);
        } else {
            mergedIncomingRows.push(incoming);
        }
    }

    // Construct output
    // 1. Keep existing rows, replace the ones we merged in-place to preserve order
    for (const row of rows) {
        const id = row.id;
        if (id && processedIncomingIds.has(id)) {
            const merged = mergedIncomingRows.find(m => m.id === id);
            if (merged) output.push(merged);
        } else {
            // Keep old row exactly as is (prevents deleting untouched data)
            output.push(row);
        }
    }

    // 2. Append brand new rows
    for (const merged of mergedIncomingRows) {
        if (!merged.id || !existingById.has(merged.id)) {
            output.push(merged);
        }
    }

    return { rows: output, replacedCount };
}

function countPrefix(rows, matchField, prefix) {
    return rows.filter((row) => String(row[matchField] || '').startsWith(prefix)).length;
}

function countEmptyRequiredFields(rows, requiredFields) {
    const missing = [];
    rows.forEach((row) => {
        const rowId = normalizeText(row.id) || '(missing id)';
        requiredFields.forEach((field) => {
            if (!normalizeText(row[field])) {
                missing.push(`${rowId}:${field}`);
            }
        });
    });
    return missing;
}

function findDuplicateIds(rows) {
    const counts = new Map();
    rows.forEach((row) => {
        const id = normalizeText(row.id);
        if (!id) {
            return;
        }
        counts.set(id, (counts.get(id) || 0) + 1);
    });
    return [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([id]) => id);
}

function validateReplacementResult(task, replacement, beforeRows, incomingRows, afterRows) {
    const beforeCount = countPrefix(beforeRows, replacement.matchField, replacement.prefix);
    const afterCount = countPrefix(afterRows, replacement.matchField, replacement.prefix);
    const filteredIncomingRows = incomingRows.filter((row) =>
        normalizeText(row[replacement.matchField]).startsWith(replacement.prefix),
    );

    if (filteredIncomingRows.length === 0) {
        throw new Error(
            `[sync_rate_excel_from_imports] empty incoming slice: ${task.targetFile} ${replacement.prefix} ${replacement.sourceSheet}`,
        );
    }

    if (afterCount < beforeCount) {
        throw new Error(
            `[sync_rate_excel_from_imports] slice shrank unexpectedly: ${task.targetFile} ${replacement.prefix} before=${beforeCount} after=${afterCount}`,
        );
    }

    const afterSliceRows = afterRows.filter((row) =>
        normalizeText(row[replacement.matchField]).startsWith(replacement.prefix),
    );
    const duplicateIds = findDuplicateIds(afterSliceRows);
    if (duplicateIds.length > 0) {
        throw new Error(
            `[sync_rate_excel_from_imports] duplicate ids after merge: ${task.targetFile} ${replacement.prefix} ${duplicateIds.slice(0, 10).join(', ')}`,
        );
    }

    const requiredFields = REQUIRED_FIELDS_BY_HEADER[task.headerKey] || [];
    const missingRequired = countEmptyRequiredFields(afterSliceRows, requiredFields);
    if (missingRequired.length > 0) {
        throw new Error(
            `[sync_rate_excel_from_imports] missing required fields after merge: ${task.targetFile} ${replacement.prefix} ${missingRequired.slice(0, 10).join(', ')}`,
        );
    }
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
        let rows = readRows(targetPath, task.targetSheet, { strict: true });

        for (const replacement of task.replacements) {
            let incomingRows = [];
            const sourceFiles = replacement.sourceFiles || [replacement.sourceFile];
            const beforeRows = rows;
            for (const file of sourceFiles) {
                const sourcePath = path.join(DATA_RAW_DIR, file);
                incomingRows = incomingRows.concat(readRows(sourcePath, replacement.sourceSheet, { strict: true }));
            }
            const result = replaceSlice(rows, incomingRows, replacement.matchField, replacement.prefix);
            rows = result.rows;
            validateReplacementResult(task, replacement, beforeRows, incomingRows, rows);
            
            report.push({
                targetFile: task.targetFile,
                targetSheet: task.targetSheet,
                prefix: replacement.prefix,
                sourceFile: sourceFiles.join(', '),
                sourceSheet: replacement.sourceSheet,
                before: countPrefix(beforeRows, replacement.matchField, replacement.prefix),
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
