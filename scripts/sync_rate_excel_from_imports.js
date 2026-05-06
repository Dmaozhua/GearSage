const fs = require('fs');
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
    hookMaster: ['id', 'brand_id', 'model'],
    hookDetail: ['id', 'hookId', 'sku'],
};

const CLEAR_BLANK_FIELD_EXCLUDES = new Set(['created_at', 'updated_at']);

const MASTER_MERGE_POLICIES = {
    reel: {
        strict: ['id', 'brand_id', 'type'],
        importPriority: [
            'model',
            'model_year',
            'alias',
            'images',
            'type_tips',
            'fit_style_tags',
            'series_positioning',
            'main_selling_points',
            'official_reference_price',
            'market_status',
            'Description',
            'product_technical',
        ],
        finalPriority: ['is_show'],
        fillOnly: ['model_cn', 'player_positioning', 'player_selling_points'],
    },
    rod: {
        strict: ['id', 'brand_id'],
        importPriority: [
            'model',
            'model_year',
            'alias',
            'type_tips',
            'fit_style_tags',
            'images',
            'series_positioning',
            'main_selling_points',
            'official_reference_price',
            'market_status',
            'Description',
        ],
        importPriorityIfNonBlank: ['player_positioning', 'player_selling_points'],
        finalPriority: ['is_show'],
        fillOnly: ['model_cn'],
    },
};

const TASKS = [
    {
        targetFile: 'lure.xlsx',
        targetSheet: 'lure',
        headerKey: 'lureMaster',
        mode: 'slice',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'ML' },
            { sourceFile: 'yamamoto_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'YAM' },
            { sourceFile: 'evergreen_lure_import.xlsx', sourceSheet: 'lure', matchField: 'id', prefix: 'EL' },
        ],
    },
    {
        targetFile: 'hardbait_lure_detail.xlsx',
        targetSheet: 'hard_lure_detail',
        headerKey: 'hardbaitLureDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'ML' },
            { sourceFile: 'evergreen_lure_import.xlsx', sourceSheet: 'hardbait_lure_detail', matchField: 'lure_id', prefix: 'EL' },
        ],
    },
    {
        targetFile: 'metal_lure_detail.xlsx',
        targetSheet: 'metal_lure_detail',
        headerKey: 'metalLureDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'shimano_lure_import.xlsx', sourceSheet: 'metal_lure_detail', matchField: 'lure_id', prefix: 'SL' },
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'metal_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'evergreen_lure_import.xlsx', sourceSheet: 'metal_lure_detail', matchField: 'lure_id', prefix: 'EL' },
        ],
    },
    {
        targetFile: 'soft_lure_detail.xlsx',
        targetSheet: 'soft_lure_detail',
        headerKey: 'softLureDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'ML' },
            { sourceFile: 'keitech_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'KL' },
            { sourceFile: 'yamamoto_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'YAM' },
            { sourceFile: 'evergreen_lure_import.xlsx', sourceSheet: 'soft_lure_detail', matchField: 'lure_id', prefix: 'EL' },
        ],
    },
    {
        targetFile: 'wire_lure_detail.xlsx',
        targetSheet: 'wire_lure_detail',
        headerKey: 'wireLureDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'wire_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'keitech_lure_import.xlsx', sourceSheet: 'wire_lure_detail', matchField: 'lure_id', prefix: 'KL' },
            { sourceFile: 'evergreen_lure_import.xlsx', sourceSheet: 'wire_lure_detail', matchField: 'lure_id', prefix: 'EL' },
        ],
    },
    {
        targetFile: 'jig_lure_detail.xlsx',
        targetSheet: 'jig_lure_detail',
        headerKey: 'jigLureDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'daiwa_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'DL' },
            { sourceFile: 'megabass_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'ML' },
            { sourceFile: 'keitech_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'KL' },
            { sourceFile: 'evergreen_lure_import.xlsx', sourceSheet: 'jig_lure_detail', matchField: 'lure_id', prefix: 'EL' },
        ],
    },
    {
        targetFile: 'line.xlsx',
        targetSheet: 'line',
        headerKey: 'lineMaster',
        mode: 'slice',
        replacements: [
            { sourceFile: 'shimano_line_import.xlsx', sourceSheet: 'line', matchField: 'id', prefix: 'SLN' },
            { sourceFile: 'daiwa_line_import.xlsx', sourceSheet: 'line', matchField: 'id', prefix: 'DLN' },
        ],
    },
    {
        targetFile: 'line_detail.xlsx',
        targetSheet: 'line_detail',
        headerKey: 'lineDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'shimano_line_import.xlsx', sourceSheet: 'line_detail', matchField: 'line_id', prefix: 'SLN' },
            { sourceFile: 'daiwa_line_import.xlsx', sourceSheet: 'line_detail', matchField: 'line_id', prefix: 'DLN' },
        ],
    },
    {
        targetFile: 'hook.xlsx',
        targetSheet: 'hook',
        headerKey: 'hookMaster',
        mode: 'slice',
        replacements: [
            { sourceFile: 'gamakatsu_hook_import.xlsx', sourceSheet: 'hook', matchField: 'id', prefix: 'GHK' },
            { sourceFile: 'owner_hook_import.xlsx', sourceSheet: 'hook', matchField: 'id', prefix: 'OHK' },
            { sourceFile: 'mustad_hook_import.xlsx', sourceSheet: 'hook', matchField: 'id', prefix: 'MHK' },
        ],
    },
    {
        targetFile: 'hook_detail.xlsx',
        targetSheet: 'hook_detail',
        headerKey: 'hookDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'gamakatsu_hook_import.xlsx', sourceSheet: 'hook_detail', matchField: 'hookId', prefix: 'GHK' },
            { sourceFile: 'owner_hook_import.xlsx', sourceSheet: 'hook_detail', matchField: 'hookId', prefix: 'OHK' },
            { sourceFile: 'mustad_hook_import.xlsx', sourceSheet: 'hook_detail', matchField: 'hookId', prefix: 'MHK' },
        ],
    },
    {
        targetFile: 'reel.xlsx',
        targetSheet: 'reel',
        headerKey: 'reelMaster',
        mode: 'master_merge',
        policyKey: 'reel',
        replacements: [
            { sourceFiles: ['daiwa_spinning_reels_import.xlsx', 'daiwa_baitcasting_reel_import.xlsx'], sourceSheet: 'reel', matchField: 'id', prefix: 'DRE', pruneMissing: true },
            { sourceFiles: ['shimano_spinning_reels_import.xlsx', 'shimano_baitcasting_reels_import.xlsx'], sourceSheet: 'reel', matchField: 'id', prefix: 'SRE' },
            { sourceFiles: ['abu_spinning_reels_import.xlsx', 'abu_baitcasting_reel_import.xlsx'], sourceSheet: 'reel', matchField: 'id', prefix: 'ARE' },
            { sourceFile: 'megabass_reel_import.xlsx', sourceSheet: 'reel', matchField: 'id', prefix: 'MRE' },
        ],
    },
    {
        targetFile: 'spinning_reel_detail.xlsx',
        targetSheet: 'spinning_reel_detail',
        headerKey: 'spinningReelDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'daiwa_spinning_reels_import.xlsx', sourceSheet: 'spinning_reel_detail', matchField: 'reel_id', prefix: 'DRE', clearBlankFields: true },
            { sourceFile: 'shimano_spinning_reels_import.xlsx', sourceSheet: 'spinning_reel_detail', matchField: 'reel_id', prefix: 'SRE' },
            { sourceFile: 'abu_spinning_reels_import.xlsx', sourceSheet: 'spinning_reel_detail', matchField: 'reel_id', prefix: 'ARE' },
            { sourceFile: 'megabass_reel_import.xlsx', sourceSheet: 'spinning_reel_detail', matchField: 'reel_id', prefix: 'MRE' },
        ],
    },
    {
        targetFile: 'baitcasting_reel_detail.xlsx',
        targetSheet: 'baitcasting_reel_detail',
        headerKey: 'baitcastingReelDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'shimano_baitcasting_reels_import.xlsx', sourceSheet: 'baitcasting_reel_detail', matchField: 'reel_id', prefix: 'SRE' },
            { sourceFile: 'daiwa_baitcasting_reel_import.xlsx', sourceSheet: 'baitcasting_reel_detail', matchField: 'reel_id', prefix: 'DRE', clearBlankFields: true },
            { sourceFile: 'abu_baitcasting_reel_import.xlsx', sourceSheet: 'baitcasting_reel_detail', matchField: 'reel_id', prefix: 'ARE' },
            { sourceFile: 'megabass_reel_import.xlsx', sourceSheet: 'baitcasting_reel_detail', matchField: 'reel_id', prefix: 'MRE' },
        ],
    },
    {
        targetFile: 'rod.xlsx',
        targetSheet: 'rod',
        headerKey: 'rodMaster',
        mode: 'master_merge',
        policyKey: 'rod',
        replacements: [
            { sourceFile: 'shimano_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'SR' },
            { sourceFile: 'daiwa_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'DR', pruneMissing: true, importPriorityIfNonBlank: ['model_cn'] },
            { sourceFile: 'megabass_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'MR' },
            { sourceFile: 'keitech_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'KR' },
            { sourceFile: 'evergreen_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'ER' },
            { sourceFile: 'abu_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'ABR' },
            { sourceFile: 'ark_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'ARKR' },
            { sourceFile: 'dstyle_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'DSR' },
            { sourceFile: 'jackall_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'JR' },
            { sourceFile: 'nories_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'NR' },
            { sourceFile: 'olympic_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'OR' },
            { sourceFile: 'raid_rod_import.xlsx', sourceSheet: 'rod', matchField: 'id', prefix: 'RR' },
        ],
    },
    {
        targetFile: 'rod_detail.xlsx',
        targetSheet: 'rod_detail',
        headerKey: 'rodDetail',
        mode: 'detail_slice',
        replacements: [
            { sourceFile: 'shimano_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'SR' },
            { sourceFile: 'daiwa_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'DR', clearBlankFields: true },
            { sourceFile: 'megabass_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'MR' },
            { sourceFile: 'keitech_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'KR' },
            { sourceFile: 'evergreen_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'ER' },
            { sourceFile: 'abu_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'ABR' },
            { sourceFile: 'ark_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'ARKR' },
            { sourceFile: 'dstyle_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'DSR' },
            { sourceFile: 'jackall_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'JR' },
            { sourceFile: 'nories_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'NR' },
            { sourceFile: 'olympic_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'OR' },
            { sourceFile: 'raid_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'RR' },
        ],
    },
];

function normalizeText(value) {
    return String(value === 0 ? '0' : (value || '')).trim();
}

function readRows(filePath, sheetName, options = {}) {
    const { strict = false } = options;
    if (!filePath) {
        return [];
    }
    if (!fs.existsSync(filePath)) {
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

function ensureHeaders(row, header) {
    const output = {};
    header.forEach((key) => {
        output[key] = row[key] === undefined ? '' : row[key];
    });
    return output;
}

function buildRowMap(rows) {
    const map = new Map();
    rows.forEach((row) => {
        const id = normalizeText(row.id);
        if (id) {
            map.set(id, row);
        }
    });
    return map;
}

function countPrefix(rows, matchField, prefix) {
    return rows.filter((row) => normalizeText(row[matchField]).startsWith(prefix)).length;
}

function filterIncomingSlice(rows, matchField, prefix) {
    return rows.filter((row) => normalizeText(row[matchField]).startsWith(prefix));
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

function findConflictingIncomingIds(rows, matchField) {
    const seen = new Map();
    const conflicts = [];
    rows.forEach((row) => {
        const id = normalizeText(row.id);
        const gearId = normalizeText(row[matchField]);
        if (!id || !gearId) {
            return;
        }
        if (!seen.has(id)) {
            seen.set(id, gearId);
            return;
        }
        const previousGearId = seen.get(id);
        if (previousGearId !== gearId) {
            conflicts.push(`${id}:${previousGearId}->${gearId}`);
        }
    });
    return conflicts;
}

function resolveClearBlankFields(clearBlankFields, headerKey) {
    if (!clearBlankFields) {
        return new Set();
    }
    if (clearBlankFields === true) {
        return new Set(
            (HEADERS[headerKey] || []).filter((field) => !CLEAR_BLANK_FIELD_EXCLUDES.has(field)),
        );
    }
    return new Set(clearBlankFields.filter((field) => !CLEAR_BLANK_FIELD_EXCLUDES.has(field)));
}

function mergeSliceRows(rows, incomingRows, matchField, prefix) {
    const output = [];
    const existingById = buildRowMap(rows);
    const processedIds = new Set();
    const mergedRows = [];

    for (const incoming of incomingRows) {
        const matchValue = normalizeText(incoming[matchField]);
        if (!matchValue.startsWith(prefix)) {
            continue;
        }
        const id = normalizeText(incoming.id);
        if (!id) {
            mergedRows.push(incoming);
            continue;
        }
        if (processedIds.has(id)) {
            continue;
        }
        processedIds.add(id);

        if (existingById.has(id)) {
            const existing = existingById.get(id);
            const merged = { ...existing };
            Object.keys(incoming).forEach((key) => {
                const value = normalizeText(incoming[key]);
                if (value !== '') {
                    merged[key] = incoming[key];
                }
            });
            mergedRows.push(merged);
        } else {
            mergedRows.push(incoming);
        }
    }

    for (const row of rows) {
        const id = normalizeText(row.id);
        if (id && processedIds.has(id)) {
            const merged = mergedRows.find((item) => normalizeText(item.id) === id);
            if (merged) {
                output.push(merged);
            }
        } else {
            output.push(row);
        }
    }

    for (const row of mergedRows) {
        const id = normalizeText(row.id);
        if (!id || !existingById.has(id)) {
            output.push(row);
        }
    }

    return {
        rows: output,
        replacedCount: mergedRows.filter((row) => existingById.has(normalizeText(row.id))).length,
    };
}

function mergeMasterSlice(rows, incomingRows, matchField, prefix, policy, options = {}) {
    const sliceIncomingRows = filterIncomingSlice(incomingRows, matchField, prefix);
    const incomingById = buildRowMap(sliceIncomingRows);
    const touchedIds = new Set(incomingById.keys());
    const output = [];
    let replacedCount = 0;
    let removedStaleCount = 0;

    for (const row of rows) {
        const id = normalizeText(row.id);
        const inPrefix = normalizeText(row[matchField]).startsWith(prefix);
        if (options.pruneMissing && inPrefix && (!id || !incomingById.has(id))) {
            removedStaleCount += 1;
            continue;
        }
        if (!inPrefix || !id || !incomingById.has(id)) {
            output.push(row);
            continue;
        }

        const incoming = incomingById.get(id);
        const merged = { ...row };

        policy.strict.forEach((field) => {
            const currentValue = normalizeText(row[field]);
            const incomingValue = normalizeText(incoming[field]);
            if (incomingValue && currentValue && incomingValue !== currentValue) {
                throw new Error(
                    `[sync_rate_excel_from_imports] strict mismatch on ${prefix} ${id} field=${field} final=${currentValue} import=${incomingValue}`,
                );
            }
        });

        policy.importPriority.forEach((field) => {
            const incomingValue = normalizeText(incoming[field]);
            if (incomingValue !== '') {
                merged[field] = incoming[field];
            }
        });

        (policy.importPriorityIfNonBlank || []).forEach((field) => {
            const incomingValue = normalizeText(incoming[field]);
            if (incomingValue !== '') {
                merged[field] = incoming[field];
            }
        });

        (options.importPriorityIfNonBlank || []).forEach((field) => {
            const incomingValue = normalizeText(incoming[field]);
            if (incomingValue !== '') {
                merged[field] = incoming[field];
            }
        });

        policy.fillOnly.forEach((field) => {
            const currentValue = normalizeText(row[field]);
            const incomingValue = normalizeText(incoming[field]);
            if (currentValue === '' && incomingValue !== '') {
                merged[field] = incoming[field];
            }
        });

        policy.finalPriority.forEach((field) => {
            merged[field] = row[field];
        });

        output.push(merged);
        replacedCount += 1;
    }

    for (const [id, incoming] of incomingById.entries()) {
        if (rows.some((row) => normalizeText(row.id) === id)) {
            continue;
        }
        output.push({ ...incoming });
    }

    return {
        rows: output,
        replacedCount,
        incomingSliceCount: sliceIncomingRows.length,
        touchedCount: touchedIds.size,
        removedStaleCount,
    };
}

function mergeDetailSlice(rows, incomingRows, matchField, prefix, options = {}) {
    const sliceIncomingRows = filterIncomingSlice(incomingRows, matchField, prefix);
    const existingById = buildRowMap(rows);
    const clearBlankFields = resolveClearBlankFields(options.clearBlankFields, options.headerKey);
    const touchedGearIds = new Set(
        sliceIncomingRows
            .map((row) => normalizeText(row[matchField]))
            .filter(Boolean),
    );

    const replacementRows = [];
    const processedIds = new Set();
    let replacedCount = 0;
    let clearedBlankCount = 0;

    for (const row of sliceIncomingRows) {
        const rowId = normalizeText(row.id);
        const gearId = normalizeText(row[matchField]);
        if (!rowId || !gearId) {
            continue;
        }
        if (processedIds.has(rowId)) {
            continue;
        }
        processedIds.add(rowId);

        if (existingById.has(rowId)) {
            const existing = existingById.get(rowId);
            const merged = { ...existing };
            Object.keys(row).forEach((key) => {
                const incomingValue = normalizeText(row[key]);
                if (incomingValue !== '') {
                    merged[key] = row[key];
                    return;
                }
                if (clearBlankFields.has(key) && normalizeText(merged[key]) !== '') {
                    merged[key] = row[key];
                    clearedBlankCount += 1;
                }
            });
            replacementRows.push(merged);
            replacedCount += 1;
            continue;
        }

        replacementRows.push(row);
    }

    let removedStaleCount = 0;
    const preservedRows = rows.filter((row) => {
        const gearId = normalizeText(row[matchField]);
        if (gearId.startsWith(prefix) && touchedGearIds.has(gearId)) {
            removedStaleCount += 1;
            return false;
        }
        return true;
    });

    return {
        rows: preservedRows.concat(replacementRows),
        replacedCount,
        incomingSliceCount: sliceIncomingRows.length,
        touchedCount: touchedGearIds.size,
        appendedCount: replacementRows.length - replacedCount,
        removedStaleCount,
        clearedBlankCount,
    };
}

function pruneOrphanMasters(masterFile, sheetName, headerKey, touchedPrefixes, importedIds, detailFiles, options = {}) {
    const masterPath = path.join(RATE_EXCEL_DIR, masterFile);
    const masterRows = readRows(masterPath, sheetName, { strict: true });
    const detailGearIds = new Set();

    detailFiles.forEach(({ file, sheet, matchField }) => {
        const detailPath = path.join(RATE_EXCEL_DIR, file);
        const detailRows = readRows(detailPath, sheet, { strict: true });
        detailRows.forEach((row) => {
            const gearId = normalizeText(row[matchField]);
            if (gearId) {
                detailGearIds.add(gearId);
            }
        });
    });

    const nextRows = [];
    let removed = 0;

    masterRows.forEach((row) => {
        const id = normalizeText(row.id);
        if (!id) {
            nextRows.push(row);
            return;
        }
        const touched = touchedPrefixes.some((prefix) => id.startsWith(prefix));
        if (!touched) {
            nextRows.push(row);
            return;
        }
        const existsInImport = importedIds.has(id);
        const hasDetail = detailGearIds.has(id);
        if ((!existsInImport && !hasDetail) || (options.pruneMastersWithoutDetail && !hasDetail)) {
            removed += 1;
            return;
        }
        nextRows.push(row);
    });

    if (removed > 0) {
        writeSheet(masterPath, sheetName, HEADERS[headerKey], nextRows);
    }

    return removed;
}

function collectImportedDetailGearIds(detailSources) {
    const ids = new Set();

    detailSources.forEach(({ sourceFiles, sourceFile, sourceSheet, matchField, prefix }) => {
        const files = sourceFiles || [sourceFile];
        files.forEach((file) => {
            const sourcePath = path.join(DATA_RAW_DIR, file);
            const rows = readRows(sourcePath, sourceSheet, { strict: true });
            filterIncomingSlice(rows, matchField, prefix).forEach((row) => {
                const gearId = normalizeText(row[matchField]);
                if (gearId) {
                    ids.add(gearId);
                }
            });
        });
    });

    return ids;
}

function pruneDetailsOutsideImportedMasters(detailFiles, touchedPrefixes, importedDetailGearIds) {
    const results = [];

    detailFiles.forEach(({ file, sheet, headerKey, matchField }) => {
        const detailPath = path.join(RATE_EXCEL_DIR, file);
        const rows = readRows(detailPath, sheet, { strict: true });
        let removed = 0;
        const nextRows = rows.filter((row) => {
            const gearId = normalizeText(row[matchField]);
            const touched = touchedPrefixes.some((prefix) => gearId.startsWith(prefix));
            if (touched && !importedDetailGearIds.has(gearId)) {
                removed += 1;
                return false;
            }
            return true;
        });

        if (removed > 0) {
            writeSheet(detailPath, sheet, HEADERS[headerKey], nextRows);
        }

        results.push({ file, sheet, removed });
    });

    return results;
}

function getAuthoritativeDetailSources(state) {
    if (state.targetFile === 'reel.xlsx' && state.authoritativePrefixes.includes('DRE')) {
        return [
            { sourceFile: 'daiwa_spinning_reels_import.xlsx', sourceSheet: 'spinning_reel_detail', matchField: 'reel_id', prefix: 'DRE' },
            { sourceFile: 'daiwa_baitcasting_reel_import.xlsx', sourceSheet: 'baitcasting_reel_detail', matchField: 'reel_id', prefix: 'DRE' },
        ];
    }

    if (state.targetFile === 'rod.xlsx' && state.authoritativePrefixes.includes('DR')) {
        return [
            { sourceFile: 'daiwa_rod_import.xlsx', sourceSheet: 'rod_detail', matchField: 'rod_id', prefix: 'DR' },
        ];
    }

    return [];
}

function validateReplacementResult(task, replacement, beforeRows, incomingRows, afterRows) {
    const beforeCount = countPrefix(beforeRows, replacement.matchField, replacement.prefix);
    const afterCount = countPrefix(afterRows, replacement.matchField, replacement.prefix);
    const filteredIncomingRows = filterIncomingSlice(incomingRows, replacement.matchField, replacement.prefix);

    if (filteredIncomingRows.length === 0) {
        throw new Error(
            `[sync_rate_excel_from_imports] empty incoming slice: ${task.targetFile} ${replacement.prefix} ${replacement.sourceSheet}`,
        );
    }

    const conflictingIncomingIds = findConflictingIncomingIds(filteredIncomingRows, replacement.matchField);
    if (conflictingIncomingIds.length > 0) {
        throw new Error(
            `[sync_rate_excel_from_imports] conflicting incoming ids: ${task.targetFile} ${replacement.prefix} ${conflictingIncomingIds.slice(0, 10).join(', ')}`,
        );
    }

    if (task.mode !== 'detail_slice' && !replacement.pruneMissing && afterCount < beforeCount) {
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

    const clearBlankFields = resolveClearBlankFields(replacement.clearBlankFields, task.headerKey);
    if (clearBlankFields.size > 0) {
        const afterById = buildRowMap(afterRows);
        const mismatches = [];

        filteredIncomingRows.forEach((row) => {
            const id = normalizeText(row.id);
            if (!id || !afterById.has(id)) {
                return;
            }
            const mergedRow = afterById.get(id);
            clearBlankFields.forEach((field) => {
                const incomingValue = normalizeText(row[field]);
                const mergedValue = normalizeText(mergedRow[field]);
                if (incomingValue !== mergedValue) {
                    mismatches.push(`${id}:${field} import=${incomingValue || '(blank)'} final=${mergedValue || '(blank)'}`);
                }
            });
        });

        if (mismatches.length > 0) {
            throw new Error(
                `[sync_rate_excel_from_imports] detail exact field mismatch: ${task.targetFile} ${replacement.prefix} ${mismatches.slice(0, 10).join(', ')}`,
            );
        }
    }
}

function writeSheet(filePath, sheetName, header, rows) {
    const normalizedRows = rows.map((row) => ensureHeaders(row, header));
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(normalizedRows, { header });
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    xlsx.writeFile(wb, filePath);
}

function main() {
    const report = [];
    const masterStates = [];

    for (const task of TASKS) {
        const targetPath = path.join(RATE_EXCEL_DIR, task.targetFile);
        let rows = readRows(targetPath, task.targetSheet, { strict: true });
        const importedIdsForTask = new Set();
        const touchedPrefixesForTask = new Set();
        const authoritativeImportedIdsForTask = new Set();
        const authoritativePrefixesForTask = new Set();

        for (const replacement of task.replacements) {
            const sourceFiles = replacement.sourceFiles || [replacement.sourceFile];
            let incomingRows = [];
            const beforeRows = rows;

            for (const file of sourceFiles) {
                const sourcePath = path.join(DATA_RAW_DIR, file);
                incomingRows = incomingRows.concat(readRows(sourcePath, replacement.sourceSheet, { strict: true }));
            }
            filterIncomingSlice(incomingRows, replacement.matchField, replacement.prefix).forEach((row) => {
                const id = normalizeText(row.id);
                if (id) {
                    importedIdsForTask.add(id);
                    if (replacement.pruneMissing) {
                        authoritativeImportedIdsForTask.add(id);
                    }
                }
            });
            touchedPrefixesForTask.add(replacement.prefix);
            if (replacement.pruneMissing) {
                authoritativePrefixesForTask.add(replacement.prefix);
            }

            let result;
            if (task.mode === 'master_merge') {
                result = mergeMasterSlice(
                    rows,
                    incomingRows,
                    replacement.matchField,
                    replacement.prefix,
                    MASTER_MERGE_POLICIES[task.policyKey],
                    {
                        pruneMissing: replacement.pruneMissing === true,
                        importPriorityIfNonBlank: replacement.importPriorityIfNonBlank || [],
                    },
                );
            } else if (task.mode === 'detail_slice') {
                result = mergeDetailSlice(
                    rows,
                    incomingRows,
                    replacement.matchField,
                    replacement.prefix,
                    { headerKey: task.headerKey, clearBlankFields: replacement.clearBlankFields },
                );
            } else {
                result = mergeSliceRows(rows, incomingRows, replacement.matchField, replacement.prefix);
            }

            rows = result.rows;
            validateReplacementResult(task, replacement, beforeRows, incomingRows, rows);

            report.push({
                targetFile: task.targetFile,
                targetSheet: task.targetSheet,
                mode: task.mode,
                prefix: replacement.prefix,
                sourceFile: sourceFiles.join(', '),
                sourceSheet: replacement.sourceSheet,
                before: countPrefix(beforeRows, replacement.matchField, replacement.prefix),
                incoming: filterIncomingSlice(incomingRows, replacement.matchField, replacement.prefix).length,
                replaced: result.replacedCount || 0,
                after: countPrefix(rows, replacement.matchField, replacement.prefix),
                touched: result.touchedCount || 0,
                appended: result.appendedCount || 0,
                removedStale: result.removedStaleCount || 0,
                clearedBlank: result.clearedBlankCount || 0,
            });
        }

        writeSheet(targetPath, task.targetSheet, HEADERS[task.headerKey], rows);

        if (task.mode === 'master_merge' || task.targetFile === 'line.xlsx') {
            masterStates.push({
                targetFile: task.targetFile,
                targetSheet: task.targetSheet,
                headerKey: task.headerKey,
                importedIds: importedIdsForTask,
                touchedPrefixes: [...touchedPrefixesForTask],
                authoritativeImportedIds: authoritativeImportedIdsForTask,
                authoritativePrefixes: [...authoritativePrefixesForTask],
            });
        }
    }

    masterStates.forEach((state) => {
        let authoritativeDetailGearIds = null;

        if (state.authoritativePrefixes.length > 0) {
            authoritativeDetailGearIds = collectImportedDetailGearIds(getAuthoritativeDetailSources(state));
            const detailFiles =
                state.targetFile === 'reel.xlsx'
                    ? [
                        { file: 'spinning_reel_detail.xlsx', sheet: 'spinning_reel_detail', headerKey: 'spinningReelDetail', matchField: 'reel_id' },
                        { file: 'baitcasting_reel_detail.xlsx', sheet: 'baitcasting_reel_detail', headerKey: 'baitcastingReelDetail', matchField: 'reel_id' },
                    ]
                    : state.targetFile === 'rod.xlsx'
                        ? [{ file: 'rod_detail.xlsx', sheet: 'rod_detail', headerKey: 'rodDetail', matchField: 'rod_id' }]
                        : [];
            pruneDetailsOutsideImportedMasters(
                detailFiles,
                state.authoritativePrefixes,
                authoritativeDetailGearIds,
            ).forEach((result) => {
                if (result.removed > 0) {
                    report.push({
                        targetFile: result.file,
                        targetSheet: result.sheet,
                        mode: 'detail_prune',
                        prefix: state.authoritativePrefixes.join(','),
                        sourceFile: '(post-sync)',
                        sourceSheet: '(detail cleanup)',
                        before: 0,
                        incoming: 0,
                        replaced: 0,
                        after: 0,
                        touched: authoritativeDetailGearIds.size,
                        appended: 0,
                        removed: result.removed,
                    });
                }
            });
        }

        if (state.targetFile === 'reel.xlsx') {
            const removed = pruneOrphanMasters(
                state.targetFile,
                state.targetSheet,
                state.headerKey,
                state.touchedPrefixes,
                state.importedIds,
                [
                    { file: 'spinning_reel_detail.xlsx', sheet: 'spinning_reel_detail', matchField: 'reel_id' },
                    { file: 'baitcasting_reel_detail.xlsx', sheet: 'baitcasting_reel_detail', matchField: 'reel_id' },
                ],
                { pruneMastersWithoutDetail: state.authoritativePrefixes.includes('DRE') },
            );
            if (removed > 0) {
                report.push({
                    targetFile: state.targetFile,
                    targetSheet: state.targetSheet,
                    mode: 'master_prune',
                    prefix: state.touchedPrefixes.join(','),
                    sourceFile: '(post-sync)',
                    sourceSheet: '(master cleanup)',
                    before: 0,
                    incoming: 0,
                    replaced: 0,
                    after: 0,
                    touched: state.importedIds.size,
                    appended: 0,
                    removed,
                });
            }
        }
        if (state.targetFile === 'rod.xlsx') {
            const removed = pruneOrphanMasters(
                state.targetFile,
                state.targetSheet,
                state.headerKey,
                state.touchedPrefixes,
                state.importedIds,
                [{ file: 'rod_detail.xlsx', sheet: 'rod_detail', matchField: 'rod_id' }],
                { pruneMastersWithoutDetail: state.authoritativePrefixes.includes('DR') },
            );
            if (removed > 0) {
                report.push({
                    targetFile: state.targetFile,
                    targetSheet: state.targetSheet,
                    mode: 'master_prune',
                    prefix: state.touchedPrefixes.join(','),
                    sourceFile: '(post-sync)',
                    sourceSheet: '(master cleanup)',
                    before: 0,
                    incoming: 0,
                    replaced: 0,
                    after: 0,
                    touched: state.importedIds.size,
                    appended: 0,
                    removed,
                });
            }
        }
        if (state.targetFile === 'line.xlsx') {
            const removed = pruneOrphanMasters(
                state.targetFile,
                state.targetSheet,
                state.headerKey,
                state.touchedPrefixes,
                state.importedIds,
                [{ file: 'line_detail.xlsx', sheet: 'line_detail', matchField: 'line_id' }],
            );
            if (removed > 0) {
                report.push({
                    targetFile: state.targetFile,
                    targetSheet: state.targetSheet,
                    mode: 'master_prune',
                    prefix: state.touchedPrefixes.join(','),
                    sourceFile: '(post-sync)',
                    sourceSheet: '(master cleanup)',
                    before: 0,
                    incoming: 0,
                    replaced: 0,
                    after: 0,
                    touched: state.importedIds.size,
                    appended: 0,
                    removed,
                });
            }
        }
    });

    console.table(report);
}

main();
