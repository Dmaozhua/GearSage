const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const DATA_RAW_DIR = path.join(ROOT, 'GearSage-client/pkgGear/data_raw');
const RATE_EXCEL_DIR = path.join(ROOT, 'GearSage-client/rate/excel');
const REPORT_PATH = path.join(DATA_RAW_DIR, 'rate_excel_diff_report.md');

const IGNORED_FIELDS = new Set(['created_at', 'updated_at']);
const MAX_ID_SAMPLES = 10;
const MAX_FIELD_SAMPLES = 20;

const TASKS = [
    {
        name: 'shimano_lure',
        importFile: 'shimano_lure_import.xlsx',
        master: {
            importSheet: 'lure',
            targetFile: 'lure.xlsx',
            targetSheet: 'lure',
            filter: (row) => Number(row.brand_id) === 1,
            rowKey: 'id',
            ignoreRateOnlyHeaders: ['official_link'],
            ignoreHeaderOrder: true,
        },
        details: [
            { importSheet: 'hardbait_lure_detail', targetFile: 'hardbait_lure_detail.xlsx', targetSheet: 'hard_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'metal_lure_detail', targetFile: 'metal_lure_detail.xlsx', targetSheet: 'metal_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
        ],
    },
    {
        name: 'daiwa_lure',
        importFile: 'daiwa_lure_import.xlsx',
        master: {
            importSheet: 'lure',
            targetFile: 'lure.xlsx',
            targetSheet: 'lure',
            filter: (row) => Number(row.brand_id) === 2,
            rowKey: 'id',
            ignoreRateOnlyHeaders: ['official_link'],
            ignoreHeaderOrder: true,
        },
        details: [
            { importSheet: 'hardbait_lure_detail', targetFile: 'hardbait_lure_detail.xlsx', targetSheet: 'hard_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'metal_lure_detail', targetFile: 'metal_lure_detail.xlsx', targetSheet: 'metal_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'soft_lure_detail', targetFile: 'soft_lure_detail.xlsx', targetSheet: 'soft_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'wire_lure_detail', targetFile: 'wire_lure_detail.xlsx', targetSheet: 'wire_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'jig_lure_detail', targetFile: 'jig_lure_detail.xlsx', targetSheet: 'jig_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
        ],
    },
    {
        name: 'megabass_lure',
        importFile: 'megabass_lure_import.xlsx',
        master: {
            importSheet: 'lure',
            targetFile: 'lure.xlsx',
            targetSheet: 'lure',
            filter: (row) => Number(row.brand_id) === 7,
            rowKey: 'id',
            ignoreRateOnlyHeaders: ['official_link'],
            ignoreHeaderOrder: true,
        },
        details: [
            { importSheet: 'hardbait_lure_detail', targetFile: 'hardbait_lure_detail.xlsx', targetSheet: 'hard_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'soft_lure_detail', targetFile: 'soft_lure_detail.xlsx', targetSheet: 'soft_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'jig_lure_detail', targetFile: 'jig_lure_detail.xlsx', targetSheet: 'jig_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
        ],
    },
    {
        name: 'keitech_lure',
        importFile: 'keitech_lure_import.xlsx',
        master: {
            importSheet: 'lure',
            targetFile: 'lure.xlsx',
            targetSheet: 'lure',
            filter: (row) => Number(row.brand_id) === 35,
            rowKey: 'id',
            ignoreFields: ['model_cn', 'official_link'],
            ignoreRateOnlyHeaders: ['official_link'],
        },
        details: [
            { importSheet: 'soft_lure_detail', targetFile: 'soft_lure_detail.xlsx', targetSheet: 'soft_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'wire_lure_detail', targetFile: 'wire_lure_detail.xlsx', targetSheet: 'wire_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
            { importSheet: 'jig_lure_detail', targetFile: 'jig_lure_detail.xlsx', targetSheet: 'jig_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
        ],
    },
    {
        name: 'yamamoto_lure',
        importFile: 'yamamoto_lure_import.xlsx',
        master: {
            importSheet: 'lure',
            targetFile: 'lure.xlsx',
            targetSheet: 'lure',
            filter: (row) => Number(row.brand_id) === 21,
            rowKey: 'id',
            ignoreRateOnlyHeaders: ['official_link'],
            ignoreHeaderOrder: true,
        },
        details: [
            { importSheet: 'soft_lure_detail', targetFile: 'soft_lure_detail.xlsx', targetSheet: 'soft_lure_detail', foreignKey: 'lure_id', rowKey: 'id' },
        ],
    },
    {
        name: 'shimano_line',
        importFile: 'shimano_line_import.xlsx',
        master: {
            importSheet: 'line',
            targetFile: 'line.xlsx',
            targetSheet: 'line',
            filter: (row) => Number(row.brand_id) === 1,
            rowKey: 'id',
        },
        details: [
            { importSheet: 'line_detail', targetFile: 'line_detail.xlsx', targetSheet: 'line_detail', foreignKey: 'line_id', rowKey: 'id' },
        ],
    },
    {
        name: 'daiwa_line',
        importFile: 'daiwa_line_import.xlsx',
        master: {
            importSheet: 'line',
            targetFile: 'line.xlsx',
            targetSheet: 'line',
            filter: (row) => Number(row.brand_id) === 2,
            rowKey: 'id',
        },
        details: [
            { importSheet: 'line_detail', targetFile: 'line_detail.xlsx', targetSheet: 'line_detail', foreignKey: 'line_id', rowKey: 'id' },
        ],
    },
    {
        name: 'shimano_rod',
        importFile: 'shimano_rod_import.xlsx',
        master: {
            importSheet: 'rod',
            targetFile: 'rod.xlsx',
            targetSheet: 'rod',
            filter: (row) => Number(row.brand_id) === 1,
            rowKey: 'id',
        },
        details: [
            { importSheet: 'rod_detail', targetFile: 'rod_detail.xlsx', targetSheet: 'rod_detail', foreignKey: 'rod_id', rowKey: 'id' },
        ],
    },
    {
        name: 'daiwa_rod',
        importFile: 'daiwa_rod_import.xlsx',
        master: {
            importSheet: 'rod',
            targetFile: 'rod.xlsx',
            targetSheet: 'rod',
            filter: (row) => Number(row.brand_id) === 2,
            rowKey: 'id',
        },
        details: [
            { importSheet: 'rod_detail', targetFile: 'rod_detail.xlsx', targetSheet: 'rod_detail', foreignKey: 'rod_id', rowKey: 'id' },
        ],
    },
    {
        name: 'megabass_rod',
        importFile: 'megabass_rod_import.xlsx',
        master: {
            importSheet: 'rod',
            targetFile: 'rod.xlsx',
            targetSheet: 'rod',
            filter: (row) => Number(row.brand_id) === 7,
            rowKey: 'id',
        },
        details: [
            { importSheet: 'rod_detail', targetFile: 'rod_detail.xlsx', targetSheet: 'rod_detail', foreignKey: 'rod_id', rowKey: 'id' },
        ],
    },
    {
        name: 'keitech_rod',
        importFile: 'keitech_rod_import.xlsx',
        master: {
            importSheet: 'rod',
            targetFile: 'rod.xlsx',
            targetSheet: 'rod',
            filter: (row) => Number(row.brand_id) === 35,
            rowKey: 'id',
        },
        details: [
            { importSheet: 'rod_detail', targetFile: 'rod_detail.xlsx', targetSheet: 'rod_detail', foreignKey: 'rod_id', rowKey: 'id' },
        ],
    },
    {
        name: 'daiwa_spinning_reel',
        importFile: 'daiwa_reels_import.xlsx',
        master: {
            importSheet: 'reel',
            targetFile: 'reel.xlsx',
            targetSheet: 'reel',
            filter: (row) => normalizeValue(row.id).startsWith('DRE') && normalizeValue(row.type) === 'spinning',
            rowKey: 'id',
        },
        details: [
            { importSheet: 'spinning_reel_detail', targetFile: 'spinning_reel_detail.xlsx', targetSheet: 'spinning_reel_detail', foreignKey: 'reel_id', rowKey: 'id' },
        ],
    },
    {
        name: 'shimano_spinning_reel',
        importFile: 'shimano_spinning_reels_import.xlsx',
        master: {
            importSheet: 'reel',
            targetFile: 'reel.xlsx',
            targetSheet: 'reel',
            filter: (row) => normalizeValue(row.id).startsWith('SRE') && normalizeValue(row.type) === 'spinning',
            rowKey: 'id',
        },
        details: [
            { importSheet: 'spinning_reel_detail', targetFile: 'spinning_reel_detail.xlsx', targetSheet: 'spinning_reel_detail', foreignKey: 'reel_id', rowKey: 'id' },
        ],
    },
    {
        name: 'shimano_baitcasting_reel',
        importFile: 'shimano_baitcasting_reels_import.xlsx',
        master: {
            importSheet: 'reel',
            targetFile: 'reel.xlsx',
            targetSheet: 'reel',
            filter: (row) => normalizeValue(row.id).startsWith('SRE') && normalizeValue(row.type) === 'baitcasting',
            rowKey: 'id',
        },
        details: [
            { importSheet: 'baitcasting_reel_detail', targetFile: 'baitcasting_reel_detail.xlsx', targetSheet: 'baitcasting_reel_detail', foreignKey: 'reel_id', rowKey: 'id' },
        ],
    },
    {
        name: 'daiwa_baitcasting_reel',
        importFile: 'daiwa_baitcasting_reel_import.xlsx',
        master: {
            importSheet: 'reel',
            targetFile: 'reel.xlsx',
            targetSheet: 'reel',
            filter: (row) => normalizeValue(row.id).startsWith('DRE') && normalizeValue(row.type) === 'baitcasting',
            rowKey: 'id',
        },
        details: [
            { importSheet: 'baitcasting_reel_detail', targetFile: 'baitcasting_reel_detail.xlsx', targetSheet: 'baitcasting_reel_detail', foreignKey: 'reel_id', rowKey: 'id' },
        ],
    },
    {
        name: 'megabass_reel',
        importFile: 'megabass_reel_import.xlsx',
        master: {
            importSheet: 'reel',
            targetFile: 'reel.xlsx',
            targetSheet: 'reel',
            filter: (row) => normalizeValue(row.id).startsWith('MRE'),
            rowKey: 'id',
        },
        details: [
            { importSheet: 'spinning_reel_detail', targetFile: 'spinning_reel_detail.xlsx', targetSheet: 'spinning_reel_detail', foreignKey: 'reel_id', rowKey: 'id' },
            { importSheet: 'baitcasting_reel_detail', targetFile: 'baitcasting_reel_detail.xlsx', targetSheet: 'baitcasting_reel_detail', foreignKey: 'reel_id', rowKey: 'id' },
        ],
    },
];

function readSheet(filePath, sheetName) {
    const workbook = xlsx.readFile(filePath);
    const targetSheet = sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheet];
    if (!sheet) {
        throw new Error(`Sheet not found: ${filePath}#${targetSheet}`);
    }
    return xlsx.utils.sheet_to_json(sheet, { defval: '' });
}

function normalizeValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value).trim();
}

function buildMap(rows, keyField) {
    return new Map(rows.map((row) => [normalizeValue(row[keyField]), row]));
}

function compareRows(importRows, targetRows, rowKey, options = {}) {
    const ignoreFields = new Set(options.ignoreFields || []);
    const importMap = buildMap(importRows, rowKey);
    const targetMap = buildMap(targetRows, rowKey);

    const importIds = [...importMap.keys()].filter(Boolean);
    const targetIds = [...targetMap.keys()].filter(Boolean);

    const missingInRate = importIds.filter((id) => !targetMap.has(id));
    const extraInRate = targetIds.filter((id) => !importMap.has(id));

    const diffSamples = [];
    const changedRows = [];
    const targetOnlyValueSamples = [];
    const sharedHeaders = Array.from(
        new Set([
            ...Object.keys(importRows[0] || {}),
            ...Object.keys(targetRows[0] || {}),
        ]),
    ).filter((field) => field !== rowKey && !IGNORED_FIELDS.has(field) && !ignoreFields.has(field));
    const importHeaderSet = new Set(Object.keys(importRows[0] || {}));
    const targetOnlyHeaders = Object.keys(targetRows[0] || {}).filter(
        (field) => field !== rowKey && !IGNORED_FIELDS.has(field) && !importHeaderSet.has(field),
    );

    for (const id of importIds) {
        if (!targetMap.has(id)) {
            continue;
        }

        const importRow = importMap.get(id);
        const targetRow = targetMap.get(id);
        const changedFields = [];

        for (const field of sharedHeaders) {
            const importValue = normalizeValue(importRow[field]);
            const targetValue = normalizeValue(targetRow[field]);
            if (importValue !== targetValue) {
                changedFields.push(field);
                if (diffSamples.length < MAX_FIELD_SAMPLES) {
                    diffSamples.push({
                        id,
                        field,
                        importValue,
                        rateValue: targetValue,
                    });
                }
            }
        }

        if (changedFields.length > 0) {
            changedRows.push({ id, fields: changedFields });
        }

        for (const field of targetOnlyHeaders) {
            const targetValue = normalizeValue(targetRow[field]);
            if (!targetValue) {
                continue;
            }
            if (targetOnlyValueSamples.length < MAX_FIELD_SAMPLES) {
                targetOnlyValueSamples.push({
                    id,
                    field,
                    rateValue: targetValue,
                });
            }
        }
    }

    return {
        importCount: importRows.length,
        rateCount: targetRows.length,
        missingInRate,
        extraInRate,
        changedRows,
        diffSamples,
        targetOnlyValueSamples,
    };
}

function headerDiff(importRows, targetRows, options = {}) {
    const ignoreHeaderFields = new Set(options.ignoreHeaderFields || []);
    const ignoreRateOnlyHeaders = new Set(options.ignoreRateOnlyHeaders || []);
    const ignoreHeaderOrder = Boolean(options.ignoreHeaderOrder);
    const importHeaders = Object.keys(importRows[0] || {});
    const targetHeaders = Object.keys(targetRows[0] || {});
    const filteredImportHeaders = importHeaders.filter((header) => !ignoreHeaderFields.has(header));
    const filteredTargetHeaders = targetHeaders.filter((header) => !ignoreHeaderFields.has(header));
    return {
        importHeaders: filteredImportHeaders,
        targetHeaders: filteredTargetHeaders,
        sameOrder: ignoreHeaderOrder || JSON.stringify(filteredImportHeaders) === JSON.stringify(filteredTargetHeaders),
        importOnly: filteredImportHeaders.filter((header) => !filteredTargetHeaders.includes(header)),
        rateOnly: filteredTargetHeaders.filter((header) => !filteredImportHeaders.includes(header) && !ignoreRateOnlyHeaders.has(header)),
    };
}

function formatIdList(ids) {
    if (ids.length === 0) {
        return 'none';
    }
    const sample = ids.slice(0, MAX_ID_SAMPLES);
    const suffix = ids.length > sample.length ? ` ... (+${ids.length - sample.length} more)` : '';
    return `${sample.join(', ')}${suffix}`;
}

function reportBlock(title, compareResult, headers) {
    const lines = [];
    const hasIssues =
        !headers.sameOrder ||
        headers.importOnly.length > 0 ||
        headers.rateOnly.length > 0 ||
        compareResult.missingInRate.length > 0 ||
        compareResult.extraInRate.length > 0 ||
        compareResult.changedRows.length > 0;

    lines.push(`#### ${title}`);
    lines.push(`- status: ${hasIssues ? 'DIFF' : 'OK'}`);
    lines.push(`- rows: import=${compareResult.importCount}, rate=${compareResult.rateCount}`);
    lines.push(`- missing in rate: ${compareResult.missingInRate.length} (${formatIdList(compareResult.missingInRate)})`);
    lines.push(`- extra in rate: ${compareResult.extraInRate.length} (${formatIdList(compareResult.extraInRate)})`);
    lines.push(`- changed rows: ${compareResult.changedRows.length}`);

    if (!headers.sameOrder || headers.importOnly.length > 0 || headers.rateOnly.length > 0) {
        lines.push(`- header order match: ${headers.sameOrder}`);
        lines.push(`- import-only headers: ${headers.importOnly.length ? headers.importOnly.join(', ') : 'none'}`);
        lines.push(`- rate-only headers: ${headers.rateOnly.length ? headers.rateOnly.join(', ') : 'none'}`);
    }

    if (compareResult.diffSamples.length > 0) {
        lines.push('- sample field diffs:');
        for (const sample of compareResult.diffSamples) {
            lines.push(`  - ${sample.id} :: ${sample.field} | import="${sample.importValue}" | rate="${sample.rateValue}"`);
        }
    }

    if (compareResult.targetOnlyValueSamples.length > 0) {
        lines.push('- populated rate-only fields:');
        for (const sample of compareResult.targetOnlyValueSamples) {
            lines.push(`  - ${sample.id} :: ${sample.field} | rate="${sample.rateValue}"`);
        }
    }

    return lines.join('\n');
}

function main() {
    const now = new Date().toISOString();
    const taskReports = [];

    for (const task of TASKS) {
        const importPath = path.join(DATA_RAW_DIR, task.importFile);
        if (!fs.existsSync(importPath)) {
            taskReports.push({
                name: task.name,
                missing: true,
                lines: [`## ${task.name}`, `- import workbook missing: ${importPath}`],
            });
            continue;
        }

        const importMasterRows = readSheet(importPath, task.master.importSheet);
        const targetMasterRowsAll = readSheet(path.join(RATE_EXCEL_DIR, task.master.targetFile), task.master.targetSheet);
        const targetMasterRows = targetMasterRowsAll.filter(task.master.filter);
        const masterHeaders = headerDiff(importMasterRows, targetMasterRows, task.master);
        const masterCompare = compareRows(importMasterRows, targetMasterRows, task.master.rowKey, task.master);
        const masterIds = new Set(importMasterRows.map((row) => normalizeValue(row.id)).filter(Boolean));

        const sections = [
            `## ${task.name}`,
            reportBlock('master', masterCompare, masterHeaders),
        ];

        for (const detail of task.details) {
            const importDetailRows = readSheet(importPath, detail.importSheet);
            const targetDetailRowsAll = readSheet(path.join(RATE_EXCEL_DIR, detail.targetFile), detail.targetSheet);
            const targetDetailRows = targetDetailRowsAll.filter((row) => masterIds.has(normalizeValue(row[detail.foreignKey])));
            const detailHeaders = headerDiff(importDetailRows, targetDetailRows, detail);
            const detailCompare = compareRows(importDetailRows, targetDetailRows, detail.rowKey, detail);
            sections.push(reportBlock(detail.importSheet, detailCompare, detailHeaders));
        }

        taskReports.push({
            name: task.name,
            missing: false,
            lines: sections,
        });
    }

    const summary = taskReports.reduce(
        (acc, report) => {
            if (report.missing) {
                acc.missing += 1;
            } else if (report.lines.join('\n').includes('status: DIFF')) {
                acc.diff += 1;
            } else {
                acc.ok += 1;
            }
            return acc;
        },
        { ok: 0, diff: 0, missing: 0 },
    );

    const output = [
        '# rate/excel diff report',
        '',
        `generated_at: ${now}`,
        '',
        `summary: ok=${summary.ok}, diff=${summary.diff}, missing_import=${summary.missing}`,
        '',
        ...taskReports.flatMap((report) => [...report.lines, '']),
    ].join('\n');

    fs.writeFileSync(REPORT_PATH, output, 'utf8');
    console.log(output);
    console.log(`\n[report_rate_excel_diffs] wrote ${REPORT_PATH}`);
}

main();
