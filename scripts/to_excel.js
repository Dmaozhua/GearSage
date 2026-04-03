const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_reel_normalized.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_reels_import.xlsx');

function main() {
    console.log('[To Excel] Starting conversion for', inputFile);
    
    if (!fs.existsSync(inputFile)) {
        console.error('[!] Error: File not found.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    
    // We want to create two sheets: "reels" (master) and "variants" (details)
    const reelsRows = [];
    const variantsRows = [];
    
    // Get current time formatted as YYYY-MM-DD HH:mm:ss
    const now = new Date();
    const currentTime = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0');

    data.forEach((item, i) => {
        // Master Row (reel)
        // reel_id should match the id in the reel table. If not exist, must be added to reel.
        const brandPrefix = item.brand ? item.brand.substring(0, 2).toUpperCase() : 'XX';
        
        // Clean up the model name to generate a better ID
        // 1. Remove size/number ranges like "4000/5000/6000" or "-4000_5000_6000"
        // 2. Remove special characters like slashes or parentheses
        // 3. Replace spaces with hyphens
        let cleanModel = item.model.replace(/(?:\s|-)*\d+(?:\s*[/,]\s*\d+)+\s*/g, '') // remove " 4000/5000/6000 " or " 8000 / 10000 " or "-4000/5000"
                                   .replace(/\s*\(\d+(?:\s*,\s*\d+)+\)\s*/g, '') // remove " (4000,5000) " or " ( 4000 , 5000 ) "
                                   .replace(/[\/\(\)\[\]]/g, '') // remove remaining special chars
                                   .replace(/\s+/g, '-') // spaces to hyphens
                                   .replace(/-+$/g, '') // trim trailing hyphens
                                   .toUpperCase();
        // Append year if available to make it more unique and avoid collisions
        let yearSuffix = item.model_year ? `-${item.model_year}` : '';
        const masterId = `R-${brandPrefix}-${cleanModel}${yearSuffix}`;
        
        let displayModel = item.model.replace(/(?:\s|-)*\d+(?:\s*[/,]\s*\d+)+\s*/g, '') // remove " 4000/5000/6000 " or " 8000 / 10000 " or "-4000/5000"
                                     .replace(/\s*\(\d+(?:\s*,\s*\d+)+\)\s*/g, '') // remove " (4000,5000) "
                                     .trim();

        // --- Calculate Official Reference Price Range from Variants ---
        let prices = [];
        if (item.variants && item.variants.length > 0) {
            for (let v of item.variants) {
                if (v.specs && v.specs.market_reference_price) {
                    let p = v.specs.market_reference_price.toString().replace(/[^\d]/g, '');
                    if (p) prices.push(parseInt(p));
                }
            }
        }
        let official_reference_price = '';
        if (prices.length > 0) {
            let minP = Math.min(...prices);
            let maxP = Math.max(...prices);
            if (minP === maxP) {
                official_reference_price = `¥${minP.toLocaleString()}`;
            } else {
                official_reference_price = `¥${minP.toLocaleString()} - ¥${maxP.toLocaleString()}`;
            }
        }
        
        reelsRows.push({
            id: masterId,
            brand_id: 1, // Assume 1 is Daiwa in brand.xlsx, update dynamically later if needed
            model: displayModel,
            model_cn: '', // Requires manual input or translation
            model_year: item.model_year || '',
            alias: '',
            series_positioning: '', // 留空待填或后续由LLM补充
            type_tips: '', // Leave empty as requested
            type: item.kind, // spinning or baitcasting from the updated scraping rules
            images: item.local_image_path || '', // Use the downloaded local image path instead of joined remote URLs
            main_selling_points: item.main_selling_points ? item.main_selling_points.join(' | ') : '',
            official_reference_price: official_reference_price,
            market_status: '在售',
            created_at: currentTime,
            updated_at: currentTime
        });
        
        // Variants Rows
        item.variants.forEach(v => {
            // For Daiwa, the JAN code is often marked as '*' in tables when the actual item name should be used as SKU
            // The user wants SKU to be the specific model name (e.g., LT2000S-H) rather than a barcode or '*'.
            
            // Helper to convert full-width to half-width
            const toHalfWidth = (str) => {
                return str.replace(/[\uFF01-\uFF5E]/g, function(ch) {
                    return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
                }).replace(/\u3000/g, ' '); // full width space to half width space
            };

            let actualSku = toHalfWidth(v.name).trim();
            
            // --- Layer 3: GearSage Traits (Derived) ---
            let spool_depth_normalized = '';
            if (actualSku.includes('SS')) spool_depth_normalized = '极浅杯 (SS)';
            else if (actualSku.match(/S($|-)/)) spool_depth_normalized = '浅杯 (S)';
            else if (actualSku.match(/D($|-)/)) spool_depth_normalized = '深杯 (D)';
            else spool_depth_normalized = '标准杯';
            
            let gear_ratio_normalized = '';
            if (actualSku.includes('XH') || actualSku.includes('XG')) gear_ratio_normalized = '超高速比 (XH/XG)';
            else if (actualSku.includes('H') || actualSku.includes('HG')) gear_ratio_normalized = '高速比 (H/HG)';
            else if (actualSku.includes('P') || actualSku.includes('PG')) gear_ratio_normalized = '低速比 (P/PG)';
            else gear_ratio_normalized = '标准速比';
            
            let brake_type_normalized = '';
            // "主要适用于水滴轮，纺车轮可标记为“无”或默认不填"
            if (item.kind === 'spinning') {
                brake_type_normalized = '';
            }

            variantsRows.push({
                id: '',
                master_id: masterId,
                sku: actualSku,
                name: v.name,
                year: item.model_year || '',
                size_family: v.specs ? (v.specs.size_family || '') : '',
                gear_ratio: v.specs ? (v.specs.gear_ratio || '') : '',
                weight_g: v.specs ? (v.specs.weight_g || '') : '',
                max_drag_kg: v.specs ? (v.specs.max_drag_kg || '') : '',
                drag_click: v.specs ? (v.specs.drag_click || '') : '',
                line_capacity_pe: v.specs ? (v.specs.line_capacity_pe || '') : '',
                line_capacity_nylon: v.specs ? (v.specs.line_capacity_nylon || '') : '',
                cm_per_turn: v.specs ? (v.specs.cm_per_turn || '') : '',
                handle_length_mm: v.specs ? (v.specs.handle_length_mm || '') : '',
                bearing_count_roller: v.specs ? (v.specs.bearing_count_roller || '') : '',
                market_reference_price: v.specs ? (v.specs.market_reference_price || '') : '',
                spool_depth_normalized: spool_depth_normalized,
                gear_ratio_normalized: gear_ratio_normalized,
                brake_type_normalized: brake_type_normalized
            });
        });
    });

    const wb = XLSX.utils.book_new();
    
    const reelsHeader = [
        "id", "brand_id", "model", "model_cn", "model_year", "alias", 
        "series_positioning", "type_tips", "type", "images", "main_selling_points", 
        "official_reference_price", "market_status",
        "created_at", "updated_at"
    ];
    const wsReels = XLSX.utils.json_to_sheet(reelsRows, { header: reelsHeader });
    XLSX.utils.book_append_sheet(wb, wsReels, "Reels Master");
    
    const variantsHeader = [
        "id", "master_id", "sku", "name", "year", "size_family",
        "gear_ratio", "weight_g", "max_drag_kg", "drag_click",
        "line_capacity_pe", "line_capacity_nylon",
        "cm_per_turn", "handle_length_mm", "bearing_count_roller",
        "market_reference_price", "spool_depth_normalized", "gear_ratio_normalized", "brake_type_normalized"
    ];
    const wsVariants = XLSX.utils.json_to_sheet(variantsRows, { header: variantsHeader });
    XLSX.utils.book_append_sheet(wb, wsVariants, "Reels Variants");
    // variants header updated
    
    XLSX.writeFile(wb, outputFile);
    
    console.log(`[To Excel] Conversion complete. Saved to ${outputFile}`);
}

main();
