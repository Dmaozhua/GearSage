const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const DAIWA_BRAND_ID = 2;

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_line_normalized.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_line_import.xlsx');

if (!fs.existsSync(inputFile)) {
    console.error(`[Error] Input file not found: ${inputFile}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

const lineRows = [];
const detailRows = [];

let lineIdCounter = 1000;
let detailIdCounter = 10000;

function classifyLine(item) {
    let lineType = item.line_type || '';
    const textContent = (item.model_name + ' ' + (item.description || '')).toUpperCase();
    
    // Check main title first to prioritize explicit type naming
    const titleUpper = item.model_name.toUpperCase();
    if (/(?<![A-Z])PE(?![A-Z])/.test(titleUpper) || titleUpper.includes('ブレイド') || titleUpper.includes('BRAID')) {
        lineType = 'PE';
    } else if (titleUpper.includes('フロロ') || titleUpper.includes('FLUORO')) {
        lineType = 'Fluorocarbon';
    } else if (titleUpper.includes('ナイロン') || titleUpper.includes('NYLON')) {
        lineType = 'Nylon';
    } else if (titleUpper.includes('エステル') || titleUpper.includes('ESTER')) {
        lineType = 'Ester';
    } else {
        // Fallback to text content if not found in title
        if (/(?<![A-Z])PE(?![A-Z])/.test(textContent) || textContent.includes('ブレイド') || textContent.includes('BRAID')) {
            lineType = 'PE';
        } else if (textContent.includes('フロロ') || textContent.includes('FLUORO')) {
            lineType = 'Fluorocarbon';
        } else if (textContent.includes('ナイロン') || textContent.includes('NYLON')) {
            lineType = 'Nylon';
        } else if (textContent.includes('エステル') || textContent.includes('ESTER')) {
            lineType = 'Ester';
        }
    }
    return lineType;
}

for (const item of data) {
    if (!item || !item.model_name) continue;
    
    const currentLineId = `DLN${lineIdCounter++}`;
    
    let modelYear = '';
    const yearMatch = item.model_name.match(/(?:19|20)\d{2}/);
    if (yearMatch) {
        modelYear = yearMatch[0];
    } else {
        const shortYear = item.model_name.match(/\b(18|19|20|21|22|23|24|25)\b/);
        if (shortYear) {
            modelYear = '20' + shortYear[0];
        }
    }
    
    lineRows.push({
        'id': currentLineId,
        'brand_id': DAIWA_BRAND_ID,
        'model': item.model_name,
        'model_cn': '',
        'model_year': modelYear,
        'alias': '',
        'type_tips': classifyLine(item), // PE, Nylon, Fluorocarbon, Ester
        'images': item.local_image_path || item.main_image_url || '',
        'created_at': '',
        'updated_at': '',
        'description': item.description || '' // 扩充字段：如有字段不全，新字段扩充在后面
    });
    
    for (const v of item.variants) {
        const specs = v.specs || {};
        
        detailRows.push({
            'id': `DLND${detailIdCounter++}`,
            'line_id': currentLineId,
            'SKU': v.variant_name,
            'COLOR': specs.color || '',
            'LENGTH(m)': specs.length_m || '',
            'SIZE NO.': specs.size_no || '',
            'MAX STRENGTH(lb)': specs.max_strength_lb || '',
            'MAX STRENGTH(kg)': specs.max_strength_kg || '',
            'AVG STRENGTH(lb)': specs.avg_strength_lb || '',
            'AVG STRENGTH(kg)': specs.avg_strength_kg || '',
            'Market Reference Price': specs.price || '',
            'AdminCode': specs.product_code || '',
            'created_at': '',
            'updated_at': ''
        });
    }
}

const wb = xlsx.utils.book_new();

const lineSheet = xlsx.utils.json_to_sheet(lineRows, { header: ["id","brand_id","model","model_cn","model_year","alias","type_tips","images","created_at","updated_at","description"] });
xlsx.utils.book_append_sheet(wb, lineSheet, 'line');

const detailSheet = xlsx.utils.json_to_sheet(detailRows, { header: ["id","line_id","SKU","COLOR","LENGTH(m)","SIZE NO.","MAX STRENGTH(lb)","MAX STRENGTH(kg)","AVG STRENGTH(lb)","AVG STRENGTH(kg)","Market Reference Price","AdminCode","created_at","updated_at"] });
xlsx.utils.book_append_sheet(wb, detailSheet, 'line_detail');

xlsx.writeFile(wb, outputFile);
console.log(`[To Excel] Done! Saved to: ${outputFile}`);
