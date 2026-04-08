const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// We output a single excel file with multiple sheets, or two separate ones?
// Usually, we've been outputting one file with multiple sheets, e.g., 'Rods Master' and 'Rod Variants'.
// Let's output two sheets: "rod" and "rod_detail" as requested.

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_rod_normalized.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_rod_import.xlsx');

if (!fs.existsSync(inputFile)) {
    console.error(`[Error] Input file not found: ${inputFile}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

const rodRows = [];
const detailRows = [];

let rodIdCounter = 1000;
let detailIdCounter = 10000;

for (const item of data) {
    const currentRodId = `SR${rodIdCounter++}`;
    
    // Model year extraction (just try to find a 2 digit year in title)
    // Shimano titles usually don't have year in the name directly but we'll try
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
    
    rodRows.push({
        'id': currentRodId,
        'brand_id': '', // Fill manually or map to Shimano ID
        'model': item.model_name,
        'model_cn': '',
        'model_year': modelYear,
        'alias': '',
        'type_tips': 'BASS',
        'description': item.description || '',
        'images': item.local_image_path || item.main_image_url || '',
        'created_at': '',
        'updated_at': ''
    });
    
    for (const v of item.variants) {
        const specs = v.specs || {};
        const code = (v.raw_specs['型号'] || v.raw_specs['货号'] || '').toUpperCase();
        let rodType = '';
        if (/^2\d{2}/.test(code) || /^S\d{2}/.test(code) || /SJR/.test(code) || /\d+S\b/.test(code) || /^TW\d{2}/.test(code) || /^DP\d{2}/.test(code)) {
            rodType = 'S';
        } else if (/^1\d{2}/.test(code) || /^[BC]\d{2}/.test(code) || /BFS/.test(code) || /MBR/.test(code) || /\d+C\b/.test(code) || /^DP B\d{2}/.test(code) || /^\d{2,3}X*H$/.test(code)) {
            rodType = 'C';
        }
        
        let parsedPower = '';
        // Convert to half-width for power regex
        let cleanCode = v.variant_name.toUpperCase();
        cleanCode = cleanCode.replace(/[\uff01-\uff5e]/g, function(ch) {
            return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
        }).replace(/\u3000/g, ' ');
        
        const powerBase = "(?:X{1,3}UL|S{1,2}UL|X{1,3}H|ML|MH|UL|M|H|L)";
        const powerRegex = new RegExp(`\\d{2,4}((${powerBase})(?:\\+)?(?:\\/(?:${powerBase})(?:\\+)?)?)`);
        const pMatch = cleanCode.match(powerRegex);
        if (pMatch) {
            parsedPower = pMatch[1];
        }
        
        detailRows.push({
            'id': `SRD${detailIdCounter++}`,
            'rod_id': currentRodId,
            'TYPE': rodType, // S for Spinning, C for Casting
            'SKU': v.variant_name,
            'TOTAL LENGTH': specs.total_length_m || '',
            'POWER': parsedPower,
            'Action': specs.action || '',
            'PIECES': specs.pieces || '',
            'CLOSELENGTH': specs.close_length_cm || '',
            'WEIGHT': specs.weight_g || '',
            'Tip Diameter': specs.tip_diameter_mm || '',
            'LURE WEIGHT': specs.lure_weight_g || '',
            'Line Wt N F': specs.nylon_fluoro_lb || '',
            'PE Line Size': specs.pe_no || '',
            'Handle Length': specs.handle_length_mm || '',
            'Reel Seat Position': specs.reel_seat_position_mm || '',
            'CONTENT CARBON': specs.carbon_content_percent || '',
            'Market Reference Price': specs.price || '',
            'AdminCode': specs.product_code || '',
            'Service Card': specs.service_card || '',
            ' Jig Weight': specs.jig_weight_g || '',
            'Squid Jig Size': specs.squid_jig_no || '',
            'Sinker Rating': '',
            'created_at': '',
            'updated_at': ''
        });
    }
}

const wb = xlsx.utils.book_new();

const rodSheet = xlsx.utils.json_to_sheet(rodRows, { header: ["id","brand_id","model","model_cn","model_year","alias","type_tips","images","created_at","updated_at"] });
xlsx.utils.book_append_sheet(wb, rodSheet, 'rod');

const detailSheet = xlsx.utils.json_to_sheet(detailRows, { header: ["id","rod_id","TYPE","SKU","TOTAL LENGTH","Action","PIECES","CLOSELENGTH","WEIGHT","Tip Diameter","LURE WEIGHT","Line Wt N F","PE Line Size","Handle Length","Reel Seat Position","CONTENT CARBON","Market Reference Price","AdminCode","Service Card"," Jig Weight","Squid Jig Size","Sinker Rating","created_at","updated_at"] });
xlsx.utils.book_append_sheet(wb, detailSheet, 'rod_detail');

xlsx.writeFile(wb, outputFile);
console.log(`[To Excel] Done! Saved to: ${outputFile}`);
