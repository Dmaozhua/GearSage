const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

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
    } else if (nameLower.includes('ワーム') || nameLower.includes('worm') || nameLower.includes('ホグ') || nameLower.includes('hog') || nameLower.includes('シュリンプ') || nameLower.includes('shrimp') || nameLower.includes('バグ') || nameLower.includes('bug') || nameLower.includes('カーリー') || nameLower.includes('curly') || nameLower.includes('シャッドテール') || nameLower.includes('shad') || nameLower.includes('グラブ') || nameLower.includes('grub') || nameLower.includes('ツインテール') || nameLower.includes('twin_tail') || nameLower.includes('ストレート') || nameLower.includes('straight') || nameLower.includes('スティック') || nameLower.includes('stick') || nameLower.includes('ソフト') || nameLower.includes('soft')) {
        typeTips = 'worm';
        if (nameLower.includes('ホグ') || nameLower.includes('hog') || nameLower.includes('シュリンプ') || nameLower.includes('shrimp') || nameLower.includes('バグ') || nameLower.includes('bug')) {
            typeTips = 'creature_bug';
        } else if (nameLower.includes('シャッド') || nameLower.includes('shad')) {
            typeTips = 'swimbait';
        }
        system = 'soft';
        action = 'variable';
        waterColumn = 'Variable';
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

function generateDaiwaLureExcel() {
    const rawDataPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_lure_normalized.json');
    if (!fs.existsSync(rawDataPath)) {
        console.error(`File not found: ${rawDataPath}`);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'));

    const lureRows = [];
    const hardbaitDetailRows = [];
    const metalDetailRows = [];
    const softDetailRows = [];
    const wireDetailRows = [];
    const jigDetailRows = [];

    // Fields required for lure table
    // id, brand_id, model, model_cn, model_year, alias, type_tips, system, water_column, action, images, created_at, updated_at
    
    // Fields for soft/hardbait/metal/wire lure_detail tables
    // id, lure_id, size, weight, hook_size, color_name, color_code, product_code, price, created_at, updated_at
    
    let lureIdCounter = 1000; // Start at 1000 to avoid clash with Shimano test data
    let detailIdCounter = 10000;

    rawData.forEach(item => {
        if (!item.variants || item.variants.length === 0) return;
        if (item.model_name.includes("製品情報Products")) return;

        const currentLureId = `DL${lureIdCounter++}`;
        
        const typeStr = (item.variants[0].specs.buoyancy || '').toLowerCase();
        const classification = classifyLure(item.model_name, typeStr);
        const system = classification.system;

        // Add main lure row
        lureRows.push({
            'id': currentLureId,
            'brand_id': '', // Will be filled in DB
            'model': item.model_name,
            'model_cn': '',
            'model_year': '',
            'alias': '',
            'type_tips': classification.typeTips,
            'system': system,
            'water_column': classification.waterColumn,
            'action': classification.action,
            'images': item.local_image_path || item.main_image_url || '',
            'created_at': '',
            'updated_at': ''
        });

        // Add detail rows
        item.variants.forEach(v => {
            const currentDetailId = `DLD${detailIdCounter++}`;
            const specs = v.specs;
            
            // If size is missing but variant name looks like a size (e.g. "2.3", "3.3"), use it
            let sizeVal = specs.length || '';
            if (!sizeVal && system === 'soft' && v.variant_name) {
                // simple check: if variant name has digits, maybe it's the size
                if (/\d/.test(v.variant_name) && !v.variant_name.includes('g') && !v.variant_name.includes('oz')) {
                    sizeVal = v.variant_name;
                }
            }

            const detailRow = {
                'id': currentDetailId,
                'lure_id': currentLureId,
                'SKU': v.variant_name || specs.color || '',
                'WEIGHT': specs.weight || '',
                'length': sizeVal || '',
                'size': '',
                'sinkingspeed': specs.buoyancy || '',
                'referenceprice': specs.price || '',
                'created_at': '',
                'updated_at': '',
                'COLOR': specs.color || '',
                'AdminCode': specs.product_code || '',
                'hook_size': '', // Hook size was not extracted to specs yet, but we could add it. Left blank for now
                'color_code': '',
                'buoyancy': specs.buoyancy || '' // Additional field appended at the end
            };

            if (system === 'soft') {
                detailRow['quantity (入数)'] = specs.quantity || ''; // Added quantity column for soft lures
            }

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
        });
    });

    // Create workbook
    const wb = xlsx.utils.book_new();

    // Create worksheets
    const wsLure = xlsx.utils.json_to_sheet(lureRows, { header: ["id","brand_id","model","model_cn","model_year","alias","type_tips","system","water_column","action","images","created_at","updated_at"] });
    xlsx.utils.book_append_sheet(wb, wsLure, 'lure');

    if (hardbaitDetailRows.length > 0) {
        const wsHardbait = xlsx.utils.json_to_sheet(hardbaitDetailRows, { header: ["id","lure_id","SKU","WEIGHT","length","size","sinkingspeed","referenceprice","created_at","updated_at"] });
        xlsx.utils.book_append_sheet(wb, wsHardbait, 'hardbait_lure_detail');
    }
    
    if (metalDetailRows.length > 0) {
        const wsMetal = xlsx.utils.json_to_sheet(metalDetailRows, { header: ["id","lure_id","SKU","WEIGHT","length","size","sinkingspeed","referenceprice","created_at","updated_at"] });
        xlsx.utils.book_append_sheet(wb, wsMetal, 'metal_lure_detail');
    }

    if (softDetailRows.length > 0) {
        const wsSoft = xlsx.utils.json_to_sheet(softDetailRows, { header: ["id","lure_id","SKU","WEIGHT","length","size","sinkingspeed","referenceprice","created_at","updated_at"] });
        xlsx.utils.book_append_sheet(wb, wsSoft, 'soft_lure_detail');
    }

    if (wireDetailRows.length > 0) {
        const wsWire = xlsx.utils.json_to_sheet(wireDetailRows, { header: ["id","lure_id","SKU","WEIGHT","length","size","sinkingspeed","referenceprice","created_at","updated_at"] });
        xlsx.utils.book_append_sheet(wb, wsWire, 'wire_lure_detail');
    }

    if (jigDetailRows.length > 0) {
        const wsJig = xlsx.utils.json_to_sheet(jigDetailRows, { header: ["id","lure_id","SKU","WEIGHT","length","size","sinkingspeed","referenceprice","created_at","updated_at"] });
        xlsx.utils.book_append_sheet(wb, wsJig, 'jig_lure_detail');
    }

    const outputPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_lure_import.xlsx');
    xlsx.writeFile(wb, outputPath);
    console.log(`Exported ${lureRows.length} main models and details to ${outputPath}`);
}

generateDaiwaLureExcel();
