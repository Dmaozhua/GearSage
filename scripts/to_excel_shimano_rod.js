const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

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

let existingRodByModel = new Map();
if (fs.existsSync(outputFile)) {
    try {
        const existingWb = xlsx.readFile(outputFile);
        const existingRodRows = xlsx.utils.sheet_to_json(existingWb.Sheets.rod || {}, { defval: '' });
        existingRodByModel = new Map(existingRodRows.map((row) => [row.model, row]));
    } catch (err) {
        console.warn(`[Warn] Failed to load existing rod sheet from ${outputFile}: ${err.message}`);
    }
}

const rodRows = [];
const detailRows = [];

let rodIdCounter = 1000;
let detailIdCounter = 10000;
const ROD_FIT_STYLE_TAGS = ['bass', '溪流', '海鲈', '根钓', '岸投', '船钓', '旅行'];

function normalizeText(value) {
    return String(value || '')
        .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
        .replace(/\u3000/g, ' ')
        .toLowerCase();
}

function hasAny(text, patterns) {
    return patterns.some((pattern) => new RegExp(pattern, 'i').test(text));
}

function addTag(tags, tag) {
    if (tag && !tags.includes(tag)) tags.push(tag);
}

function isAccessoryModel(text) {
    return hasAny(text, ['握把', 'landing\\s*shaft', 'landingshaft', '衍生握把', 'x\\s*seat']);
}

function validPieceCount(value) {
    const match = String(value || '').match(/\d+/);
    if (!match) return 0;
    const pieces = Number.parseInt(match[0], 10);
    return pieces >= 3 && pieces <= 10 ? pieces : 0;
}

function inferTravelTag(item, variant) {
    const model = normalizeText(item.model_name);
    if (isAccessoryModel(model)) return '';
    if (hasAny(model, ['\\bpack\\b', 'dream\\s*tour', '\\bmb\\b', 'freegame', 'trastick', 'zoom', '振出', '多节', '旅行', 'travel', 'tour', '3节', '4节', '5节'])) {
        return '旅行';
    }
    const specs = variant.specs || {};
    const raw = variant.raw_specs || {};
    const keys = ['pieces', 'PIECES', '継数', '継数(本)', '节数', '節數'];
    return keys.some((key) => validPieceCount(specs[key]) || validPieceCount(raw[key])) ? '旅行' : '';
}

function tagsByModelName(model) {
    const text = normalizeText(model);
    if (isAccessoryModel(text)) return '';
    if (hasAny(text, ['world\\s*shaula\\s*bg'])) return '海鲈,岸投,船钓';
    if (hasAny(text, ['world\\s*shaula'])) return 'bass,溪流,海鲈,岸投,船钓';
    if (hasAny(text, ['scorpion'])) return 'bass,岸投';
    if (hasAny(text, ['poison', 'zodias', 'expride', 'bantam', 'bass\\s*one', 'lurematic（?bass', 'majestic', 'lesath', 'capture', 'pegas', 'unfix', 'argus\\s*hunter', 'leonis', 'conquest'])) return 'bass';
    if (hasAny(text, ['cardiff', 'trout', 'asquith', 'brookstone', 'lurematic（?trout'])) return '溪流';
    if (hasAny(text, ['soare.*boat'])) return '船钓';
    if (hasAny(text, ['soare'])) return '岸投';
    if (hasAny(text, ['salty\\s*advance.*船钓'])) return '船钓';
    if (hasAny(text, ['salty\\s*advance.*岸钓'])) return '岸投';
    if (hasAny(text, ['salty\\s*advance'])) return '岸投,船钓';
    if (hasAny(text, ['sephia.*(metal\\s*sutte|tip\\s*eging|tip-?run)'])) return '船钓';
    if (hasAny(text, ['sephia'])) return '岸投';
    if (hasAny(text, ['ocea', 'grappler', 'game\\s*type', 'crossmission'])) return '船钓';
    if (hasAny(text, ['coltsniper'])) return '岸投';
    if (hasAny(text, ['(dialuna|moonshot).*bs'])) return '海鲈,船钓';
    if (hasAny(text, ['exsence', 'lunamis', 'dialuna', 'moonshot', 'encounter', 'nessa'])) return '海鲈,岸投';
    if (hasAny(text, ['hard\\s*rocker', 'hardrocker'])) return '根钓,岸投';
    if (hasAny(text, ['brenious', 'dyna\\s*dart'])) return '岸投';
    if (hasAny(text, ['lurematic\\s*mb', 'freegame', 'trastick'])) return 'bass,溪流,岸投';
    if (hasAny(text, ['lurematic.*salt', 'instage'])) return '岸投';
    return '';
}

function mergeFitStyleTags(values) {
    const tags = [];
    for (const value of values) {
        for (const tag of String(value || '').split(',')) {
            const clean = tag.trim();
            if (ROD_FIT_STYLE_TAGS.includes(clean) && !tags.includes(clean)) {
                tags.push(clean);
            }
        }
    }
    return ROD_FIT_STYLE_TAGS.filter((tag) => tags.includes(tag)).join(',');
}

function inferFitStyleTags(item, variant) {
    const model = normalizeText(item.model_name);
    const modelTags = tagsByModelName(model);
    if (modelTags || isAccessoryModel(model)) return mergeFitStyleTags([modelTags, inferTravelTag(item, variant)]);
    const sku = normalizeText(variant.variant_name);
    const desc = normalizeText(`${item.description || ''} ${variant.variant_description || ''}`);
    const text = `${model} ${sku} ${desc}`;
    const tags = [];

    if (hasAny(text, ['poison', 'zodias', 'expride', 'bantam', 'bass one', 'majestic', 'levante', 'bass'])) {
        addTag(tags, 'bass');
    }

    if (hasAny(text, ['world shaula', 'scorpion', 'freegame', 'lurematic'])) {
        addTag(tags, 'bass');
        addTag(tags, '岸投');
    }

    if (hasAny(text, ['cardiff', 'trout', 'native', 'area', 'stream', 'asquith', 'fly', '鳟', '鱒', '溪流', '渓流', '管钓', '管理场', '管理釣'])) {
        addTag(tags, '溪流');
    }

    if (hasAny(text, ['exsence', 'lunamis', 'dialuna', 'moonshot', 'encounter', 'nessa', 'seabass', '海鲈', '海鱸', 'シーバス'])) {
        addTag(tags, '海鲈');
        addTag(tags, '岸投');
    }

    if (hasAny(text, ['hard rocker', 'hardrocker', 'rockfish', 'rock fish', '根鱼', '根魚', '岩鱼', '岩魚'])) {
        addTag(tags, '根钓');
        addTag(tags, '岸投');
    }

    if (hasAny(text, ['sephia', 'eging', 'エギ', '木虾', '木蝦', '乌贼', '烏賊', 'soare', 'ajing', 'mebaru', 'brenious', 'chining', '黑鲷', '黒鯛', 'coltsniper', 'shore', 'surf', '岸投', '岸抛', '岸拋', '港湾', '堤防', 'slsj'])) {
        addTag(tags, '岸投');
    }

    if (hasAny(text, ['ocea', 'grappler', 'game type', 'crossmission', 'light jigging', 'slow j', 'jigger', 'tairaba', '炎月', '船钓', '船釣', 'offshore', 'tip eging', 'tip-run', 'tip run', 'metal sutte', 'ika metal', 'blade jigging'])) {
        addTag(tags, '船钓');
    }

    return mergeFitStyleTags([tags.join(','), inferTravelTag(item, variant)]);
}

function isPlaceholderDescription(text) {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    return !value || /^※本页面相关产品数据为禧玛诺自身产品对比/.test(value) || /^※关于导环规格变更/.test(value);
}

function stripModelPrefixFromSku(sku, model) {
    const value = String(sku || '').trim();
    const prefix = String(model || '').trim();
    if (!value || !prefix || !value.startsWith(prefix)) {
        return value;
    }
    const rest = value.slice(prefix.length);
    if (!rest || (!/^\s/.test(rest) && !'-_/（(［['.includes(rest[0]))) {
        return value;
    }
    return rest.replace(/^[-_/（(［[\s]+/, '').trim() || value;
}

function mergeTechTerms(values) {
    const merged = [];
    for (const value of values) {
        for (const term of String(value || '').split('/').map((part) => part.trim()).filter(Boolean)) {
            if (!merged.includes(term)) merged.push(term);
        }
    }
    return merged.join(' / ');
}

function inferVariantProductTechnical(item, variant, sku, rodType) {
    return mergeTechTerms([variant.product_technical || '']);
}

for (const item of data) {
    const currentRodId = `SR${rodIdCounter++}`;
    const existingRod = existingRodByModel.get(item.model_name) || {};
    const inferredItemTags = inferFitStyleTags(item, { variant_name: '', variant_description: '' });
    const itemFitTags = item.fit_style_tags || mergeFitStyleTags([inferredItemTags].concat((item.variants || []).map((v) => {
        return v.fit_style_tags || inferFitStyleTags(item, v);
    })));
    const existingFitTags = mergeFitStyleTags([existingRod.fit_style_tags]);
    
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
        'brand_id': BRAND_IDS.SHIMANO,
        'model': item.model_name,
        'model_cn': '',
        'model_year': modelYear,
        'alias': '',
        'type_tips': '',
        'fit_style_tags': itemFitTags || existingFitTags,
        'images': item.local_image_path || item.main_image_url || '',
        'created_at': '',
        'updated_at': '',
        'series_positioning': '',
        'main_selling_points': '',
        'official_reference_price': '',
        'market_status': '',
        'Description': isPlaceholderDescription(item.description) ? '' : (item.description || ''),
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
        
        const detailSku = stripModelPrefixFromSku(v.variant_name, item.model_name);

        detailRows.push({
            'id': `SRD${detailIdCounter++}`,
            'rod_id': currentRodId,
            'TYPE': rodType, // S for Spinning, C for Casting
            'SKU': detailSku,
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
            'updated_at': '',
            'guide_layout_type': '',
            'guide_use_hint': '',
            'hook_keeper_included': '',
            'sweet_spot_lure_weight_real': '',
            'official_environment': '',
            'player_environment': '',
            'player_positioning': '',
            'player_selling_points': '',
            'Description': v.variant_description || '',
            'product_technical': inferVariantProductTechnical(item, v, detailSku, rodType),
            'Extra Spec 1': '',
            'Extra Spec 2': ''
        });
    }
}

const wb = xlsx.utils.book_new();

const rodSheet = xlsx.utils.json_to_sheet(rodRows, { header: HEADERS.rodMaster });
xlsx.utils.book_append_sheet(wb, rodSheet, SHEET_NAMES.rod);

const detailSheet = xlsx.utils.json_to_sheet(detailRows, { header: HEADERS.rodDetail });
xlsx.utils.book_append_sheet(wb, detailSheet, SHEET_NAMES.rodDetail);

xlsx.writeFile(wb, outputFile);
console.log(`[To Excel] Done! Saved to: ${outputFile}`);
