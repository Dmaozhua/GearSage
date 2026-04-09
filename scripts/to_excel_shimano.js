const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_spinning_reel_normalized.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx');

function main() {
    console.log('[To Excel] Starting conversion for', inputFile);
    
    if (!fs.existsSync(inputFile)) {
        console.error('[!] Error: File not found.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    
    let reelIdCounter = 1000;
    let detailIdCounter = 10000;
    
    const reelsMap = new Map();
    const variantsMap = new Map();
    
    const now = new Date();
    const currentTime = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0');

    data.forEach((item, i) => {
        const brandPrefix = 'SH';
        
        let cleanModel = item.model_name.replace(/(?:\s|-)*\d+(?:\s*[/,]\s*\d+)+\s*/g, '')
                                   .replace(/\s*\(\d+(?:\s*,\s*\d+)+\)\s*/g, '')
                                   .replace(/[\/\(\)\[\]]/g, '')
                                   .replace(/\s+/g, '-')
                                   .replace(/-+$/g, '')
                                   .toUpperCase();
        
        const masterKey = `R-${brandPrefix}-${cleanModel}`;
        
        if (!reelsMap.has(masterKey)) {
            reelsMap.set(masterKey, {
                id: `SRE${reelIdCounter++}`,
                brand_id: BRAND_IDS.SHIMANO,
                model: item.model_name,
                model_cn: '',
                model_year: item.model_year || '',
                alias: '',
                type_tips: '',
                type: item.kind,
                images: item.local_image_path || item.main_image_url || '', 
                created_at: currentTime,
                updated_at: currentTime,
                series_positioning: '',
                main_selling_points: '',
                official_reference_price: '', // calculate below
                market_status: '在售'
            });
        }
        
        if (item.variants && item.variants.length > 0) {
            item.variants.forEach(v => {
                const skuId = `${masterKey}-${v.variant_name.replace(/\s+/g, '-').toUpperCase()}`;
                const specs = v.specs || {};
                
                if (!variantsMap.has(skuId)) {
                    variantsMap.set(skuId, {
                        id: `SRED${detailIdCounter++}`,
                        reel_id: reelsMap.get(masterKey).id,
                        "SKU": v.variant_name,
                        "GEAR RATIO": specs.gear_ratio || '',
                        "DRAG": '', // Shimano usually just has max drag
                        "MAX DRAG": specs.max_drag_kg || '',
                        "MAX_DURABILITY": specs.max_durability_kg || '',
                        "WEIGHT": specs.weight_g || '',
                        "spool_diameter_per_turn_mm": specs.spool_diameter_stroke_mm || '',
                        "Nylon_no_m": specs.nylon_no_m || '',
                        "Nylon_lb_m": specs.nylon_lb_m || '',
                        "fluorocarbon_no_m": specs.fluoro_no_m || '',
                        "fluorocarbon_lb_m": specs.fluoro_lb_m || '',
                        "pe_no_m": specs.pe_no_m || '',
                        "cm_per_turn": specs.cm_per_turn || '',
                        "handle_length_mm": specs.handle_length_mm || '',
                        "bearing_count_roller": specs.bearings || '',
                        "market_reference_price": specs.price || '',
                        "product_code": specs.product_code || '',
                        "created_at": currentTime,
                        "updated_at": currentTime,
                        "drag_click": '',
                        "spool_depth_normalized": '',
                        "gear_ratio_normalized": '',
                        "brake_type_normalized": '',
                        "fit_style_tags": '',
                        "min_lure_weight_hint": '',
                        "is_compact_body": '',
                        "handle_style": ''
                    });
                }
            });
        }
    });

    // Calculate official_reference_price
    for (const [masterId, reel] of reelsMap.entries()) {
        let prices = [];
        for (const variant of variantsMap.values()) {
            if (variant.reel_id === reel.id) {
                let p = variant.market_reference_price ? variant.market_reference_price.replace(/[^\d]/g, '') : '';
                if (p) prices.push(parseInt(p));
            }
        }
        if (prices.length > 0) {
            let minP = Math.min(...prices);
            let maxP = Math.max(...prices);
            if (minP === maxP) {
                reel.official_reference_price = `¥${minP.toLocaleString()}`;
            } else {
                reel.official_reference_price = `¥${minP.toLocaleString()} - ¥${maxP.toLocaleString()}`;
            }
        }
    }

    const reelsRows = Array.from(reelsMap.values());
    const variantsRows = Array.from(variantsMap.values());

    const wb = XLSX.utils.book_new();
    
    const wsReels = XLSX.utils.json_to_sheet(reelsRows, { header: HEADERS.reelMaster });
    XLSX.utils.book_append_sheet(wb, wsReels, SHEET_NAMES.reel);
    
    const wsVariants = XLSX.utils.json_to_sheet(variantsRows, { header: HEADERS.spinningReelDetail });
    XLSX.utils.book_append_sheet(wb, wsVariants, SHEET_NAMES.spinningReelDetail);
    
    XLSX.writeFile(wb, outputFile);
    console.log('[To Excel] Done! Saved to:', outputFile);
}

main();
