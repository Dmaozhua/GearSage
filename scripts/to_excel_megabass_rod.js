const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

function normalizeExtraNote(key, value) {
    return /^Other\.\d+$/i.test(key) ? value : `${key}: ${value}`;
}

function assignExtraNote(row, note, preferredSlot) {
    if (!note) return;

    if (preferredSlot === 1) {
        row['Extra Spec 1'] = row['Extra Spec 1'] || note;
        return;
    }

    if (preferredSlot === 2) {
        row['Extra Spec 2'] = row['Extra Spec 2'] || note;
        return;
    }

    if (!row['Extra Spec 1']) {
        row['Extra Spec 1'] = note;
    } else if (!row['Extra Spec 2']) {
        row['Extra Spec 2'] = note;
    }
}

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
const ROD_FIT_STYLE_TAGS = ['bass', '溪流', '海鲈', '根钓', '岸投', '船钓', '旅行'];

function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function addTag(tags, tag) {
    if (ROD_FIT_STYLE_TAGS.includes(tag) && !tags.includes(tag)) tags.push(tag);
}

function mergeFitStyleTags(values) {
    const tags = [];
    for (const value of values) {
        for (const raw of String(value || '').split(',')) {
            addTag(tags, raw.trim());
        }
    }
    return ROD_FIT_STYLE_TAGS.filter((tag) => tags.includes(tag)).join(',');
}

function parsePieces(value) {
    const match = String(value || '').match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
}

function hasTravelContext(item) {
    const specs = item.specs || {};
    const pieceValues = [
        specs['継数'],
        specs.PIECES,
        specs.pieces,
        specs.Piece,
        specs.piece,
    ];
    if (pieceValues.some((value) => {
        const pieces = parsePieces(value);
        return pieces && pieces > 2;
    })) {
        return true;
    }

    const seriesModelText = normalizeText([
        item.series_name,
        item.model_name,
    ].join(' '));
    if (/triza|world expedition|huntsman|mountain stream/.test(seriesModelText)) {
        return true;
    }

    const contextText = normalizeText([
        item.series_name,
        item.series_description,
        item.model_name,
        item.description_en,
    ].join(' '));
    return /multi[- ]?piece|pack rod|パック|モバイル/.test(contextText);
}

function finishFitStyleTags(tags, item) {
    if (hasTravelContext(item)) addTag(tags, '旅行');
    return mergeFitStyleTags(tags);
}

function inferFitStyleTags(item) {
    const text = normalizeText([
        item.series_name,
        item.category,
        item.series_description,
        item.model_name,
        item.description_en,
    ].join(' '));
    const category = normalizeText(item.category);
    const seriesName = normalizeText(item.series_name);
    const tags = [];

    if (/tracking buddy|downrigger|lead core|lake trolling|レイクトローリング/.test(text)) {
        addTag(tags, '船钓');
        return finishFitStyleTags(tags, item);
    }

    if (/valkyrie world expedition/.test(seriesName)) {
        addTag(tags, 'bass');
        addTag(tags, '岸投');
        return finishFitStyleTags(tags, item);
    }

    if (category === 'bass rod') {
        addTag(tags, 'bass');
        return finishFitStyleTags(tags, item);
    }

    if (category === 'trout rod' || /greathunting|great hunting/.test(seriesName)) {
        addTag(tags, '溪流');
        return finishFitStyleTags(tags, item);
    }

    if (/trout rod|trout|渓流|鱒/.test(text)) {
        addTag(tags, '溪流');
        return finishFitStyleTags(tags, item);
    }

    if (/bass rod|bass/.test(text)) {
        addTag(tags, 'bass');
        return finishFitStyleTags(tags, item);
    }

    return '';
}

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
            fit_style_tags: [],
            models: []
        });
    }
    const inferredFitTags = item.fit_style_tags || inferFitStyleTags(item);
    seriesMap.get(item.series_name).fit_style_tags.push(inferredFitTags);
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
        'type_tips': '',
        'fit_style_tags': mergeFitStyleTags(seriesInfo.fit_style_tags),
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
        for (const [k, v] of Object.entries(specs)) {
            if (!mappedKeys.includes(k) && !v.includes('Closed Length')) {
                const note = normalizeExtraNote(k, v);
                if (/^Other\.1$/i.test(k)) {
                    assignExtraNote(row, note, 1);
                } else if (/^Other\.2$/i.test(k)) {
                    assignExtraNote(row, note, 2);
                } else {
                    assignExtraNote(row, note);
                }
            }
        }

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
