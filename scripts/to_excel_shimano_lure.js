const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const dataPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_lure_normalized.json');
const outputPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_lure_import.xlsx');

const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

const lureRows = [];
const hardbaitDetailRows = [];
const metalDetailRows = [];

let lureIdCounter = 10000;
let detailIdCounter = 10000;

for (const item of data) {
    const currentLureId = lureIdCounter++;
    
    // Shimano typically model year is not easily parsed from the name like Daiwa
    const modelYear = '';
    
    let typeTips = item.lure_type || '';
    if (typeTips === 'multi_joint-bait') typeTips = 'jointed_swimbait';
    
    let system = 'hardbait'; // default for freshwater lures typically hardbait
    if (typeTips === 'spoon' || typeTips === 'metal_jig') {
        system = 'metal';
    }

    lureRows.push({
        'id': currentLureId,
        'brand_id': '',
        'model': item.model_name,
        'model_cn': '',
        'model_year': modelYear,
        'alias': '',
        'type_tips': typeTips,
        'system': system,
        'images': item.local_image_path || item.main_image_url || '',
        'created_at': '',
        'updated_at': ''
    });

    for (const v of item.variants) {
        const specs = v.specs || {};
        
        const detailRow = {
            'id': detailIdCounter++,
            'lure_id': currentLureId,
            'SKU': v.variant_name,
            'WEIGHT': specs.weight || '',
            'length': specs.length || '',
            'size': '',
            'sinkingspeed': specs.buoyancy || '',
            'referenceprice': specs.price || '',
            'COLOR': specs.color || '',
            'AdminCode': specs.product_code || '',
            'created_at': '',
            'updated_at': ''
        };
        
        if (system === 'metal') {
            metalDetailRows.push(detailRow);
        } else {
            hardbaitDetailRows.push(detailRow);
        }
    }
}

const wb = xlsx.utils.book_new();

const wsLure = xlsx.utils.json_to_sheet(lureRows);
xlsx.utils.book_append_sheet(wb, wsLure, "lure");

const wsHardbait = xlsx.utils.json_to_sheet(hardbaitDetailRows);
xlsx.utils.book_append_sheet(wb, wsHardbait, "hardbait_lure_detail");

const wsMetal = xlsx.utils.json_to_sheet(metalDetailRows);
xlsx.utils.book_append_sheet(wb, wsMetal, "metal_lure_detail");

xlsx.writeFile(wb, outputPath);
console.log(`[To Excel] Done! Saved to: ${outputPath}`);
