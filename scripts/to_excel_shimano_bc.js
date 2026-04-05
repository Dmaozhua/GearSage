const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_baitcasting_reel_test.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx');

function main() {
    console.log('[To Excel] Starting conversion for', inputFile);
    
    if (!fs.existsSync(inputFile)) {
        console.error('[!] Error: File not found.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    
    const reelsRows = [];
    const variantsRows = [];
    
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
        
        const masterId = `R-${brandPrefix}-${cleanModel}`;
        
        reelsRows.push({
            id: masterId,
            brand_id: 2, // Assume 2 is Shimano
            model: item.model_name,
            model_cn: '',
            model_year: '', // Shimano year usually in name or requires extraction
            alias: '',
            type_tips: '',
            type: item.kind,
            images: item.main_image_url || '', 
            created_at: currentTime,
            updated_at: currentTime,
            series_positioning: '',
            main_selling_points: '',
            official_reference_price: '', // calculate below if needed
            market_status: '在售'
        });
        
        if (item.variants && item.variants.length > 0) {
            let prices = [];
            
            item.variants.forEach(v => {
                const skuId = `${masterId}-${v.variant_name.replace(/\s+/g, '-').toUpperCase()}`;
                const specs = v.specs || {};
                
                let p = specs.price ? specs.price.replace(/[^\d]/g, '') : '';
                if (p) prices.push(parseInt(p));
                
                variantsRows.push({
                    id: skuId,
                    reel_id: masterId,
                    "SKU": v.variant_name,
                    "GEAR RATIO": specs.gear_ratio || '',
                    "DRAG": '', // Shimano usually just has max drag
                    "MAX DRAG": specs.max_drag_kg || '',
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
            });
            
            if (prices.length > 0) {
                let minP = Math.min(...prices);
                let maxP = Math.max(...prices);
                if (minP === maxP) {
                    reelsRows[reelsRows.length - 1].official_reference_price = `¥${minP.toLocaleString()}`;
                } else {
                    reelsRows[reelsRows.length - 1].official_reference_price = `¥${minP.toLocaleString()} - ¥${maxP.toLocaleString()}`;
                }
            }
        }
    });

    const wb = XLSX.utils.book_new();
    
    const reelsHeader = [
        "id", "brand_id", "model", "model_cn", "model_year", "alias", 
        "type_tips", "type", "images", "created_at", "updated_at",
        "series_positioning", "main_selling_points", "official_reference_price", "market_status"
    ];
    const wsReels = XLSX.utils.json_to_sheet(reelsRows, { header: reelsHeader });
    XLSX.utils.book_append_sheet(wb, wsReels, "Reels Master");
    
    const variantsHeader = [
        "id", "reel_id", "SKU", "GEAR RATIO", "DRAG", "MAX DRAG", "WEIGHT", 
        "spool_diameter_per_turn_mm", "Nylon_no_m", "Nylon_lb_m", "fluorocarbon_no_m", 
        "fluorocarbon_lb_m", "pe_no_m", "cm_per_turn", "handle_length_mm", "bearing_count_roller", 
        "market_reference_price", "product_code", "created_at", "updated_at",
        "drag_click", "spool_depth_normalized", "gear_ratio_normalized", "brake_type_normalized",
        "fit_style_tags", "min_lure_weight_hint", "is_compact_body", "handle_style"
    ];
    const wsVariants = XLSX.utils.json_to_sheet(variantsRows, { header: variantsHeader });
    XLSX.utils.book_append_sheet(wb, wsVariants, "Reels Variants");
    
    XLSX.writeFile(wb, outputFile);
    console.log('[To Excel] Done! Saved to:', outputFile);
}

main();