const path = require('path');
const xlsx = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const FILE_PATH = gearDataPaths.resolveExcel('reel.xlsx');
const SHEET_NAME = 'reel';
const HEADER = [
    'id',
    'brand_id',
    'model',
    'model_cn',
    'model_year',
    'alias',
    'type_tips',
    'type',
    'images',
    'created_at',
    'updated_at',
    'series_positioning',
    'main_selling_points',
    'official_reference_price',
    'market_status',
];

function main() {
    const workbook = xlsx.readFile(FILE_PATH);
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[SHEET_NAME], { defval: '' });

    let shimanoFixed = 0;
    let daiwaFixed = 0;

    const nextRows = rows.map((row) => {
        const id = String(row.id || '');
        if (id.startsWith('SRE') && Number(row.brand_id) !== 1) {
            shimanoFixed += 1;
            return { ...row, brand_id: 1 };
        }
        if (id.startsWith('DRE') && Number(row.brand_id) !== 2) {
            daiwaFixed += 1;
            return { ...row, brand_id: 2 };
        }
        return row;
    });

    const nextWorkbook = xlsx.utils.book_new();
    const nextSheet = xlsx.utils.json_to_sheet(nextRows, { header: HEADER });
    xlsx.utils.book_append_sheet(nextWorkbook, nextSheet, SHEET_NAME);
    xlsx.writeFile(nextWorkbook, FILE_PATH);

    console.log(
        `[fix_rate_excel_reel_brand_ids] updated shimano=${shimanoFixed} daiwa=${daiwaFixed} file=${FILE_PATH}`,
    );
}

main();
