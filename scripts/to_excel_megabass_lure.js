const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

function splitJigBuoyancyAndHook(specs, system) {
    const buoyancy = specs.buoyancy || '';
    const hook = specs.hook || '';

    if (system === 'jig' && !hook && /hook\s*:/i.test(buoyancy)) {
        return {
            sinkingspeed: '',
            hookSize: buoyancy
        };
    }

    return {
        sinkingspeed: buoyancy,
        hookSize: hook
    };
}

function classifyLure(item) {
    let typeTips = 'special_lure';
    let system = 'hardbait';
    let waterColumn = 'Variable';
    let action = 'wobble_roll';

    const modelName = item.model_name || '';
    const nameLower = modelName.toLowerCase();
    
    const specs = item.variants && item.variants.length > 0 ? item.variants[0].specs : {};
    const typeLower = (specs.buoyancy || '').toLowerCase();
    const depthStr = (specs.depth || '').toLowerCase();
    const qtyStr = (specs['quantity'] || specs['入数'] || '').toLowerCase();
    const megabassCategory = (item.megabass_category || '').toLowerCase();

    const hasQty = qtyStr.length > 0;
    const isSoft = hasQty || nameLower.includes('ワーム') || nameLower.includes('worm') || 
                   nameLower.includes('ホグ') || nameLower.includes('hog') || 
                   nameLower.includes('シュリンプ') || nameLower.includes('shrimp') || 
                   nameLower.includes('バグ') || nameLower.includes('bug') || 
                   nameLower.includes('カーリー') || nameLower.includes('curly') || 
                   nameLower.includes('シャッドテール') || nameLower.includes('shad_tail') || 
                   nameLower.includes('グラブ') || nameLower.includes('grub') || 
                   nameLower.includes('ツインテール') || nameLower.includes('twin_tail') || 
                   nameLower.includes('ストレート') || nameLower.includes('straight') || 
                   nameLower.includes('スティック') || nameLower.includes('stick') || 
                   nameLower.includes('ソフト') || nameLower.includes('soft');

    if (isSoft) {
        typeTips = 'worm';
        system = 'soft';
        action = 'variable';
        waterColumn = 'Variable';

        if (nameLower.includes('ホグ') || nameLower.includes('hog') || nameLower.includes('シュリンプ') || nameLower.includes('shrimp') || nameLower.includes('バグ') || nameLower.includes('bug')) {
            typeTips = 'creature_bug';
        } else if (nameLower.includes('シャッド') || nameLower.includes('shad')) {
            typeTips = 'swimbait';
        }
    } else {
        if (nameLower.includes('クランク') || nameLower.includes('crank') || nameLower.includes('シャッド') || nameLower.includes('shad')) {
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
        } else if (nameLower.includes('ポッパー') || nameLower.includes('popper') || nameLower.includes('pop-x') || nameLower.includes('popx') || nameLower.includes('pop-max') || nameLower.includes('popmax')) {
            typeTips = 'popper';
            system = 'hardbait';
            action = 'walk_pop';
            waterColumn = 'Topwater';
        } else if (nameLower.includes('ペンシル') || nameLower.includes('pencil') || nameLower.includes('dog-x')) {
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
    }

    // Fallback classification using description if still special_lure
    if (typeTips === 'special_lure') {
        const descLower = (item.description || '').toLowerCase();
        if (descLower.includes('ジャーク') || descLower.includes('jerk') || descLower.includes('ミノー') || descLower.includes('minnow')) {
            typeTips = typeLower.includes('サスペンド') || typeLower.includes('sp') ? 'suspending_minnow' : 'minnow';
            system = 'hardbait';
            action = 'jerk_dart';
            waterColumn = 'Mid (0.5–2m)';
        } else if (descLower.includes('クランク') || descLower.includes('crank')) {
            typeTips = 'crank';
            system = 'hardbait';
            action = 'wobble_roll';
            waterColumn = 'Mid (0.5–2m)';
        } else if (descLower.includes('ペンシル') || descLower.includes('pencil')) {
            typeTips = typeLower.includes('シンキング') || typeLower.includes('s') ? 'sinking_pencil' : 'topwater_pencil';
            system = 'hardbait';
            action = typeTips === 'sinking_pencil' ? 'glide' : 'walk_pop';
            waterColumn = typeTips === 'sinking_pencil' ? 'Variable' : 'Topwater';
        } else if (descLower.includes('ポッパー') || descLower.includes('popper')) {
            typeTips = 'popper';
            system = 'hardbait';
            action = 'walk_pop';
            waterColumn = 'Topwater';
        }
    }

    // Apply Megabass category overrides
    if (megabassCategory === 'topwater') {
        waterColumn = 'Topwater';
        system = 'hardbait';
        if (typeTips === 'special_lure' || typeTips === 'sinking_pencil') {
            typeTips = 'topwater_pencil';
            action = 'walk_pop';
        }
    } else if (megabassCategory === 'crankbait') {
        if (typeTips === 'special_lure') {
            typeTips = 'crank';
            action = 'wobble_roll';
        }
    } else if (megabassCategory === 'minnow') {
        if (typeTips === 'special_lure') {
            typeTips = typeLower.includes('サスペンド') || typeLower.includes('sp') ? 'suspending_minnow' : 'minnow';
            action = 'jerk_dart';
        }
    } else if (megabassCategory === 'vibration') {
        if (typeTips === 'special_lure') {
            typeTips = 'vibration';
            action = 'tight_wobble';
        }
    } else if (megabassCategory === 'prop bait') {
        if (typeTips === 'special_lure') {
            typeTips = 'spy_bait';
            action = 'spin_flash';
        }
    } else if (megabassCategory === 'joint bait') {
        if (typeTips === 'special_lure') {
            typeTips = 'swimbait';
            action = 'glide';
        }
    } else if (megabassCategory === 'wire bait') {
        system = 'wirebait';
        if (typeTips === 'special_lure') {
            if (nameLower.includes('バズ') || nameLower.includes('buzz')) {
                typeTips = 'buzzbait';
                waterColumn = 'Topwater';
                action = 'spin_flash';
            } else {
                typeTips = 'spinnerbait';
                action = 'spin_flash';
            }
        }
    } else if (megabassCategory === 'jig') {
        system = 'jig';
        if (typeTips === 'special_lure') {
            typeTips = 'rubber_jig';
            action = 'variable';
            waterColumn = 'Bottom';
        }
    } else if (megabassCategory === 'metal jig') {
        system = 'hardbait';
        if (typeTips === 'special_lure') {
            typeTips = 'metal_jig';
            action = 'variable';
            waterColumn = 'Variable';
        }
    }

    let maxDepth = -1;
    if (depthStr) {
        const matches = depthStr.match(/(\d+\.?\d*)\s*[mｍ]/g);
        if (matches) {
            const depths = matches.map(m => parseFloat(m.replace(/[mｍ\s]/g, '')));
            maxDepth = Math.max(...depths);
        }
    }

    if (maxDepth >= 0) {
        if (maxDepth > 2.0) {
            waterColumn = 'Deep (2m+)';
        } else if (maxDepth >= 0.5) {
            waterColumn = 'Mid (0.5–2m)';
        } else {
            waterColumn = 'Subsurface (0–0.5m)';
        }
    } else {
        if (typeLower.includes('フローティング') || typeLower.includes('f')) {
            if (waterColumn === 'Variable') waterColumn = 'Subsurface (0–0.5m)';
        }
        if (typeLower.includes('シンキング') || typeLower.includes('s')) {
            if (waterColumn === 'Topwater') waterColumn = 'Variable';
        }
    }

    // Force waterColumn back to Topwater if category is explicitly topwater
    if (megabassCategory === 'topwater') {
        waterColumn = 'Topwater';
    }

    return { typeTips, system, waterColumn, action };
}

function generateMegabassLureExcel() {
    const rawDataPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_lure_normalized.json');
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
    
    let lureIdCounter = 1000;
    let detailIdCounter = 10000;

    rawData.forEach(item => {
        if (!item.variants || item.variants.length === 0) return;
        if (item.model_name.includes("製品情報Products")) return;

        const currentLureId = `ML${lureIdCounter++}`;
        
        const typeStr = (item.variants[0].specs.buoyancy || '').toLowerCase();
        const classification = classifyLure(item);
        const system = classification.system;

        // Add main lure row
        lureRows.push({
            'id': currentLureId,
            'brand_id': BRAND_IDS.MEGABASS,
            'model': item.model_name,
            'model_cn': '',
            'model_year': '',
            'alias': '',
            'type_tips': classification.typeTips,
            'system': system,
            'water_column': classification.waterColumn,
            'action': classification.action,
            'images': item.local_image_path || item.main_image_url || '',
            'description': item.description || '', // Added description field
            'created_at': '',
            'updated_at': ''
        });

        // Add detail rows
        item.variants.forEach(v => {
            const currentDetailId = `MLD${detailIdCounter++}`;
            const specs = v.specs;
            const jigSplit = splitJigBuoyancyAndHook(specs, system);
            
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
                'sinkingspeed': jigSplit.sinkingspeed,
                'referenceprice': specs.price || '',
                'created_at': '',
                'updated_at': '',
                'COLOR': specs.color || '',
                'AdminCode': specs.product_code || '',
                'hook_size': jigSplit.hookSize,
                'depth': specs.depth || '', // Added depth
                'action': specs.action || '', // Added action
                'subname': specs.subname || '', // Added subname
                'other.1': specs['other.1'] || '' // Added other.1
            };

            if (system === 'soft') {
                detailRow['quantity (入数)'] = specs['入数'] || specs.quantity || ''; // Added quantity column for soft lures
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

    const outputPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_lure_import.xlsx');
    xlsx.writeFile(wb, outputPath);
    console.log(`Exported ${lureRows.length} main models and details to ${outputPath}`);
}

generateMegabassLureExcel();
