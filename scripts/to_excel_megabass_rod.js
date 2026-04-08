const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_rod_raw.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_rod_import.xlsx');

if (!fs.existsSync(inputFile)) {
    console.error(`[Error] Input file not found: ${inputFile}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

const rodRows = [];
const detailRows = [];

let rodIdCounter = 1;
let detailIdCounter = 1;

// Group by series_name
const seriesMap = new Map();

for (const item of data) {
    // Skip accessories that are not rods
    if (!item.specs || (!item.specs['Length'] && !item.specs['継数'])) {
        continue;
    }
    
    if (!seriesMap.has(item.series_name)) {
        seriesMap.set(item.series_name, {
            id: rodIdCounter++,
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
        'brand_id': '', // Megabass ID? leave empty for import
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
            'id': detailIdCounter++,
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
            'updated_at': ''
        };

        // Add remaining unmapped specs
        const mappedKeys = ['Length', 'Action', 'Taper', '継数', 'Weight', 'Lure', 'Lure capa', 'Line', 'Line capa', 'カーボン含有率', 'Price', 'Subname'];
        for (const [k, v] of Object.entries(specs)) {
            if (!mappedKeys.includes(k) && !v.includes('Closed Length')) {
                row[k] = v;
            }
        }

        detailRows.push(row);
    }
}

const wb = xlsx.utils.book_new();

const rodSheet = xlsx.utils.json_to_sheet(rodRows);
xlsx.utils.book_append_sheet(wb, rodSheet, 'rod');

const detailSheet = xlsx.utils.json_to_sheet(detailRows);
xlsx.utils.book_append_sheet(wb, detailSheet, 'rod_detail');

xlsx.writeFile(wb, outputFile);
console.log(`[To Excel] Done! Saved to: ${outputFile}`);
