const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const { SHEET_NAMES, HEADERS } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');
const SHIMANO_BRAND_ID = 1;

function classifyLure(modelName, buoyancy) {
    let typeTips = 'special_lure';
    let system = 'hardbait';
    let waterColumn = 'Variable';
    let action = 'wobble_roll';

    const nameLower = modelName.toLowerCase();
    const typeLower = (buoyancy || '').toLowerCase();

    if (nameLower.includes('クランク') || nameLower.includes('crank')) {
        typeTips = 'crank';
        system = 'hardbait';
        action = 'wobble_roll';
        waterColumn = 'Mid (0.5–2m)';
        if (nameLower.includes('ハイパー') || nameLower.includes('hyper')) {
            waterColumn = 'Deep (2m+)';
        }
    } else if (nameLower.includes('ミノー') || nameLower.includes('minnow')) {
        typeTips = typeLower.includes('サスペンド') || typeLower.includes('sp') ? 'suspending_minnow' : 'minnow';
        system = 'hardbait';
        action = 'jerk_dart';
        waterColumn = 'Mid (0.5–2m)';
    } else if (nameLower.includes('スプーン') || nameLower.includes('spoon')) {
        typeTips = 'spoon';
        system = 'metal';
        action = 'flutter_fall';
        waterColumn = 'Variable';
    } else if (nameLower.includes('プロップ') || nameLower.includes('prop')) {
        typeTips = 'spy_bait';
        system = 'hardbait';
        action = 'spin_flash';
        waterColumn = 'Subsurface (0–0.5m)';
    } else if (nameLower.includes('ポッパー') || nameLower.includes('popper')) {
        typeTips = 'popper';
        system = 'hardbait';
        action = 'walk_pop';
        waterColumn = 'Topwater';
    } else if (nameLower.includes('ペンシル') || nameLower.includes('pencil')) {
        if (typeLower.includes('シンキング') || typeLower.includes('s')) {
            typeTips = 'sinking_pencil';
            waterColumn = 'Variable';
            action = 'glide';
        } else {
            typeTips = 'topwater_pencil';
            waterColumn = 'Topwater';
            action = 'walk_pop';
        }
        system = 'hardbait';
    } else if (nameLower.includes('ジョイント') || nameLower.includes('joint') || nameLower.includes('アプナス')) {
        typeTips = 'swimbait';
        system = 'hardbait';
        action = 'glide';
        waterColumn = 'Subsurface (0–0.5m)';
    } else if (nameLower.includes('バイブ') || nameLower.includes('vib')) {
        typeTips = 'vib';
        system = 'hardbait';
        action = 'vibration';
        waterColumn = 'Variable';
    } else if (nameLower.includes('スピナーベイト') || nameLower.includes('spinnerbait')) {
        typeTips = 'spinnerbait';
        system = 'wire';
        action = 'spin_flash';
        waterColumn = 'Variable';
    } else if (nameLower.includes('バズベイト') || nameLower.includes('buzzbait')) {
        typeTips = 'buzzbait';
        system = 'wire';
        action = 'spin_flash';
        waterColumn = 'Topwater';
    } else if (nameLower.includes('ジグ') || nameLower.includes('jig')) {
        typeTips = 'finesse_jig';
        system = 'jig';
        if (typeLower.includes('メタル') || typeLower.includes('metal')) {
            system = 'metal';
        }
        action = 'flutter_fall';
        waterColumn = 'Bottom';
    } else if (nameLower.includes('フラッター') || nameLower.includes('flutter') || nameLower.includes('ふく魚')) {
        typeTips = 'topwater_walker';
        system = 'hardbait';
        action = 'wobble_roll';
        waterColumn = 'Topwater';
    }

    // Adjust water column based on buoyancy type
    if (typeLower.includes('フローティング') || typeLower.includes('f')) {
        if (waterColumn === 'Variable') waterColumn = 'Subsurface (0–0.5m)';
    }
    if (typeLower.includes('シンキング') || typeLower.includes('s')) {
        if (waterColumn === 'Topwater') waterColumn = 'Variable';
    }

    return { typeTips, system, waterColumn, action };
}

const dataPath = gearDataPaths.resolveDataRaw('shimano_lure_normalized.json');
const outputPath = gearDataPaths.resolveDataRaw('shimano_lure_import.xlsx');

const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

const lureRows = [];
const hardbaitDetailRows = [];
const metalDetailRows = [];
const softDetailRows = [];
const wireDetailRows = [];
const jigDetailRows = [];

let lureIdCounter = 1000;
let detailIdCounter = 10000;

for (const item of data) {
    const currentLureId = `SL${lureIdCounter++}`;
    
    // Shimano typically model year is not easily parsed from the name like Daiwa
    const modelYear = '';
    
    // Get buoyancy from first variant if available
    let typeStr = '';
    if (item.variants && item.variants.length > 0 && item.variants[0].specs) {
        typeStr = item.variants[0].specs.buoyancy || item.variants[0].specs.sinkingspeed || '';
    }
    
    const classification = classifyLure(item.model_name, typeStr);
    
    // If the original scraper gave us some hints, we might use it, but user wants to use our function
    let typeTips = classification.typeTips;
    let system = classification.system;
    
    // Some Shimano specific fallbacks
    if (item.lure_type === 'multi_joint-bait') {
        typeTips = 'swimbait';
        system = 'hardbait';
    } else if (item.lure_type === 'spoon' || item.lure_type === 'metal_jig') {
        system = 'metal';
        if (item.lure_type === 'spoon') typeTips = 'spoon';
    }

    lureRows.push({
        'id': currentLureId,
        'brand_id': SHIMANO_BRAND_ID,
        'model': item.model_name,
        'model_cn': '',
        'model_year': modelYear,
        'alias': '',
        'type_tips': typeTips,
        'system': system,
        'water_column': classification.waterColumn,
        'action': classification.action,
        'images': item.local_image_path || item.main_image_url || '',
        'created_at': '',
        'updated_at': '',
        'description': item.description || ''
    });

    for (const v of item.variants) {
        const specs = v.specs || {};
        const currentDetailId = `SLD${detailIdCounter++}`;
        
        const detailRow = {
            'id': currentDetailId,
            'lure_id': currentLureId,
            'SKU': v.variant_name,
            'WEIGHT': specs.weight || '',
            'length': specs.length || '',
            'size': '',
            'sinkingspeed': specs.buoyancy || specs.sinkingspeed || '',
            'referenceprice': specs.price || '',
            'COLOR': specs.color || '',
            'AdminCode': specs.product_code || '',
            'created_at': '',
            'updated_at': ''
        };
        
        if (system === 'metal') {
            metalDetailRows.push(detailRow);
        } else if (system === 'soft') {
            softDetailRows.push(detailRow);
        } else if (system === 'wire') {
            wireDetailRows.push(detailRow);
        } else if (system === 'jig') {
            jigDetailRows.push(detailRow);
        } else {
            hardbaitDetailRows.push(detailRow);
        }
    }
}

const wb = xlsx.utils.book_new();

const wsLure = xlsx.utils.json_to_sheet(lureRows, { header: HEADERS.lureMaster });
xlsx.utils.book_append_sheet(wb, wsLure, SHEET_NAMES.lure);

if (hardbaitDetailRows.length > 0) {
    const wsHardbait = xlsx.utils.json_to_sheet(hardbaitDetailRows, { header: HEADERS.hardbaitLureDetail });
    xlsx.utils.book_append_sheet(wb, wsHardbait, SHEET_NAMES.hardbaitLureDetail);
}

if (metalDetailRows.length > 0) {
    const wsMetal = xlsx.utils.json_to_sheet(metalDetailRows, { header: HEADERS.metalLureDetail });
    xlsx.utils.book_append_sheet(wb, wsMetal, SHEET_NAMES.metalLureDetail);
}

if (softDetailRows.length > 0) {
    const wsSoft = xlsx.utils.json_to_sheet(softDetailRows, { header: HEADERS.softLureDetail });
    xlsx.utils.book_append_sheet(wb, wsSoft, SHEET_NAMES.softLureDetail);
}

if (wireDetailRows.length > 0) {
    const wsWire = xlsx.utils.json_to_sheet(wireDetailRows, { header: HEADERS.wireLureDetail });
    xlsx.utils.book_append_sheet(wb, wsWire, SHEET_NAMES.wireLureDetail);
}

if (jigDetailRows.length > 0) {
    const wsJig = xlsx.utils.json_to_sheet(jigDetailRows, { header: HEADERS.jigLureDetail });
    xlsx.utils.book_append_sheet(wb, wsJig, SHEET_NAMES.jigLureDetail);
}

xlsx.writeFile(wb, outputPath);
console.log(`[To Excel] Done! Saved to: ${outputPath}`);
