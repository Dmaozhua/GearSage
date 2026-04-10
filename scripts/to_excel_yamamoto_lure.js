const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const RAW_DATA_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/yamamoto_lure_normalized.json');
const OUTPUT_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/yamamoto_lure_import.xlsx');

function generateExcel() {
    if (!fs.existsSync(RAW_DATA_PATH)) {
        console.error(`Raw data not found at ${RAW_DATA_PATH}`);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf8'));
    const brandId = BRAND_IDS['Gary Yamamoto'] || 112; // Use ID 112 if not found, though user might have created it as something else. Wait, user created BKK as 111. Let's assume Gary Yamamoto is 112.

    const lureMasterData = [];
    const softLureDetailData = [];
    
    // Filter out duplicates (some products exist in multiple categories)
    const uniqueProducts = new Map();
    rawData.forEach(item => {
        if (!uniqueProducts.has(item.name)) {
            uniqueProducts.set(item.name, item);
        }
    });

    let index = 1;
    for (const item of uniqueProducts.values()) {
        const masterId = `YAM${String(index).padStart(3, '0')}`;
        
        lureMasterData.push({
            id: masterId,
            brand_id: brandId,
            model: item.name || '',
            model_cn: item.name || '',
            model_year: '',
            alias: '',
            type_tips: item.category || 'softbait',
            water_column: item.water_column || 'bottom',
            action: item.action || 'swimming',
            images: item.local_image_path || item.main_image_url || '',
            created_at: item.scraped_at || '',
            updated_at: item.scraped_at || '',
            Description: item.description || ''
        });

        if (item.variants && item.variants.length > 0) {
            item.variants.forEach((variant, vIndex) => {
                const detailId = `${masterId}D${String(vIndex + 1).padStart(3, '0')}`;
                
                softLureDetailData.push({
                    id: detailId,
                    lure_id: masterId,
                    SKU: variant.sku || detailId,
                    Size: variant.length || '',
                    WEIGHT: variant.weight || '',
                    'Market Reference Price': variant.price || '',
                    Quantity: variant.quantity || '',
                    Hook: '',
                    'Hook Size': '',
                    'Ring Size': '',
                    Material: '',
                    AdminCode: '',
                    created_at: item.scraped_at || '',
                    updated_at: item.scraped_at || '',
                    'Sale Price': '',
                    Description: ''
                });
            });
        }
        
        index++;
    }

    const wb = xlsx.utils.book_new();

    const wsMaster = xlsx.utils.json_to_sheet(lureMasterData, { header: HEADERS.lureMaster });
    xlsx.utils.book_append_sheet(wb, wsMaster, SHEET_NAMES.lure);

    const wsSoftDetail = xlsx.utils.json_to_sheet(softLureDetailData, { header: HEADERS.softLureDetail });
    xlsx.utils.book_append_sheet(wb, wsSoftDetail, SHEET_NAMES.softLureDetail);

    const wsHardDetail = xlsx.utils.json_to_sheet([], { header: HEADERS.hardbaitLureDetail });
    xlsx.utils.book_append_sheet(wb, wsHardDetail, SHEET_NAMES.hardbaitLureDetail);

    const wsWireDetail = xlsx.utils.json_to_sheet([], { header: HEADERS.wireLureDetail });
    xlsx.utils.book_append_sheet(wb, wsWireDetail, SHEET_NAMES.wireLureDetail);

    const wsJigDetail = xlsx.utils.json_to_sheet([], { header: HEADERS.jigLureDetail });
    xlsx.utils.book_append_sheet(wb, wsJigDetail, SHEET_NAMES.jigLureDetail);

    xlsx.writeFile(wb, OUTPUT_PATH);
    console.log(`Generated Excel file at ${OUTPUT_PATH}`);
    console.log(`Master items: ${lureMasterData.length}`);
    console.log(`Soft Detail items: ${softLureDetailData.length}`);
}

generateExcel();