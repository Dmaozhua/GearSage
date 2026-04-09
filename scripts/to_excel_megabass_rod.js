const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_rod_raw.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_rod_import.xlsx');

if (!fs.existsSync(inputFile)) {
    console.error(`[Error] Input file not found: ${inputFile}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

const rodRows = [];
const detailRows = [];

let rodIdCounter = 1000;
let detailIdCounter = 10000;

// Group by series_name
const seriesMap = new Map();

for (const item of data) {
    // Skip accessories that are not rods
    if (!item.specs || (!item.specs['Length'] && !item.specs['継数'])) {
        continue;
    }
    
    if (!seriesMap.has(item.series_name)) {
        seriesMap.set(item.series_name, {
            id: `MR${rodIdCounter++}`,
            series_name: item.series_name,
            category: item.category,
            series_description: item.series_description || '',
            image: item.local_image_path || (item.images && item.images.length > 0 ? item.images[0] : ''),
            models: []
        });
    }
    seriesMap.get(item.series_name).models.push(item);
}

for (const [seriesName, seriesInfo] of seriesMap.entries()) {
    rodRows.push({
        'id': seriesInfo.id,
        'brand_id': BRAND_IDS.MEGABASS,
        'model': seriesInfo.series_name,
        'model_cn': '',
        'model_year': '',
        'alias': '',
        'Description': seriesInfo.series_description,
        'type_tips': 'ROD',
        'images': seriesInfo.image,
        'created_at': '',
        'updated_at': ''
    });

    for (const item of seriesInfo.models) {
        const specs = item.specs || {};
        let code = item.model_name.toUpperCase();
        
        let rodType = '';
        if (code.match(/VKS|S-|-S|S$|SP|SPINNING|XS|XTS|ULS/)) {
            rodType = 'S';
        } else {
            rodType = 'C';
        }

        let parsedPower = '';
        const powerMatch = code.match(/(F\d(?:[.\/]\d)?|X{1,3}UL|S{1,2}UL|X{1,3}H|ML|MH|UL|M|H|L)(?=-|\b|$)/);
        if (powerMatch) {
            parsedPower = powerMatch[1];
        }

        let closeLength = '';
        for (const [k, v] of Object.entries(specs)) {
            if (v && v.includes('Closed Length')) {
                const clMatch = v.match(/Closed Length\s*:\s*([\d.]+cm)/i);
                if (clMatch) closeLength = clMatch[1];
            }
        }

        let price = specs['Price'] || '';
        const priceMatch = price.match(/([\d,]+)\s*円/);
        if (priceMatch) {
            price = priceMatch[1].replace(/,/g, '');
        }

        let peLine = '';
        let nylonLine = specs['Line'] || specs['Line capa'] || '';
        if (nylonLine.includes('PE')) {
            const peMatch = nylonLine.match(/PE\s*([\d.~MaxMAX\s]+)/i);
            if (peMatch) {
                peLine = peMatch[1].trim();
                nylonLine = nylonLine.replace(peMatch[0], '').trim();
            }
        }

        const row = {
            'id': `MRD${detailIdCounter++}`,
            'rod_id': seriesInfo.id,
            'TYPE': rodType,
            'SKU': item.model_name,
            'TOTAL LENGTH': specs['Length'] || '',
            'POWER': parsedPower,
            'Action': specs['Action'] || specs['Taper'] || '',
            'PIECES': specs['継数'] || '',
            'CLOSELENGTH': closeLength,
            'WEIGHT': specs['Weight'] || '',
            'Tip Diameter': '',
            'LURE WEIGHT': specs['Lure'] || specs['Lure capa'] || '',
            'LURE WEIGHT (oz)': '',
            'Line Wt N F': nylonLine,
            'PE Line Size': peLine,
            'Handle Length': '',
            'Reel Seat Position': '',
            'CONTENT CARBON': specs['カーボン含有率'] || '',
            'Market Reference Price': price,
            'Sale Price': '',
            'AdminCode': '',
            'Service Card': '',
            ' Jig Weight': '',
            'Squid Jig Size': '',
            'Sinker Rating': '',
            'Joint Type': '',
            'Code Name': specs['Subname'] || '',
            'Fly Line': '',
            'Grip Type': '',
            'Reel Size': '',
            'Description': item.description_en || '',
            'created_at': '',
            'updated_at': '',
            'Extra Spec 1': '',
            'Extra Spec 2': ''
        };

        // Keep export schema stable: fold remaining unmapped specs into generic extra-note fields.
        const mappedKeys = ['Length', 'Action', 'Taper', '継数', 'Weight', 'Lure', 'Lure capa', 'Line', 'Line capa', 'カーボン含有率', 'Price', 'Subname'];
        const extraNotes = [];
        for (const [k, v] of Object.entries(specs)) {
            if (!mappedKeys.includes(k) && !v.includes('Closed Length')) {
                extraNotes.push(`${k}: ${v}`);
            }
        }
        row['Extra Spec 1'] = extraNotes[0] || row['Extra Spec 1'];
        row['Extra Spec 2'] = extraNotes[1] || row['Extra Spec 2'];

        detailRows.push(row);
    }
}

const wb = xlsx.utils.book_new();

const rodSheet = xlsx.utils.json_to_sheet(rodRows, { header: HEADERS.rodMaster });
xlsx.utils.book_append_sheet(wb, rodSheet, SHEET_NAMES.rod);

const detailSheet = xlsx.utils.json_to_sheet(detailRows, { header: HEADERS.rodDetail });
xlsx.utils.book_append_sheet(wb, detailSheet, SHEET_NAMES.rodDetail);

xlsx.writeFile(wb, outputFile);
console.log(`[To Excel] Done! Saved to: ${outputFile}`);
