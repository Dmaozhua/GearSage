const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, HEADERS, SHEET_NAMES } = require('./gear_export_schema');

function convertToExcel() {
    const dataPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/keitech_rod_normalized.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data file not found:', dataPath);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    const brandId = BRAND_IDS['KEITECH']; // 35
    if (!brandId) {
        console.error('Brand ID for Keitech not found');
        return;
    }

    const rodMasterData = [];
    const rodDetailData = [];

    rawData.forEach((item, index) => {
        const rodId = `KR${String(index + 1).padStart(3, '0')}`; // Base ID
        
        rodMasterData.push({
            id: rodId,
            brand_id: brandId,
            model: item.model || '',
            model_cn: item.model_cn || '',
            model_year: '',
            alias: '',
            type_tips: 'casting', // Most Keitech rods are casting (ベイトモデル)
            images: item.local_image_path || item.main_image_url || '',
            created_at: item.scraped_at || '',
            updated_at: item.scraped_at || '',
            Description: item.description || '',
        });

        if (item.variants && item.variants.length > 0) {
            item.variants.forEach((variant, vIndex) => {
                const detailId = `${rodId}D${String(vIndex + 1).padStart(3, '0')}`;
                
                rodDetailData.push({
                    id: detailId,
                    rod_id: rodId,
                    TYPE: 'casting',
                    SKU: variant.sku || '',
                    'TOTAL LENGTH': variant.total_length || '',
                    Action: variant.action || '',
                    PIECES: variant.pieces || '',
                    CLOSELENGTH: '',
                    WEIGHT: variant.weight || '',
                    'Tip Diameter': '',
                    'LURE WEIGHT': variant.lure_weight || '',
                    'Line Wt N F': variant.line_wt || '',
                    'PE Line Size': '',
                    'Handle Length': '',
                    'Reel Seat Position': '',
                    'CONTENT CARBON': '',
                    'Market Reference Price': variant.price || '',
                    AdminCode: '',
                    'Service Card': '',
                    ' Jig Weight': '',
                    'Squid Jig Size': '',
                    'Sinker Rating': '',
                    created_at: item.scraped_at || '',
                    updated_at: item.scraped_at || '',
                    POWER: '',
                    'LURE WEIGHT (oz)': '',
                    'Sale Price': '',
                    'Joint Type': '',
                    'Code Name': '',
                    'Fly Line': '',
                    'Grip Type': '',
                    'Reel Size': '',
                    Description: '',
                    'Extra Spec 1': '',
                    'Extra Spec 2': ''
                });
            });
        }
    });

    const wb = xlsx.utils.book_new();

    const wsMaster = xlsx.utils.json_to_sheet(rodMasterData, { header: HEADERS.rodMaster });
    xlsx.utils.book_append_sheet(wb, wsMaster, SHEET_NAMES.rod);

    const wsDetail = xlsx.utils.json_to_sheet(rodDetailData, { header: HEADERS.rodDetail });
    xlsx.utils.book_append_sheet(wb, wsDetail, SHEET_NAMES.rodDetail);

    const outPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/keitech_rod_import.xlsx');
    xlsx.writeFile(wb, outPath);
    console.log(`Excel generated at ${outPath}`);
}

convertToExcel();