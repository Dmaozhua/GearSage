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
    
    data.forEach((item, i) => {
        // Master Row (reel)
        // reel_id should match the id in the reel table. If not exist, must be added to reel.
        const brandPrefix = item.brand ? item.brand.substring(0, 2).toUpperCase() : 'XX';
        const masterId = `R-${brandPrefix}-${item.model.replace(/\s+/g, '-').toUpperCase()}`;
        
        reelsRows.push({
            id: masterId,
            brand_id: 1, // Assume 1 is Daiwa in brand.xlsx, update dynamically later if needed
            model: item.model,
            model_cn: '', // Requires manual input or translation
            model_year: item.model_year || '',
            alias: '',
            type_tips: '', // Leave empty as requested
            type: item.kind, // spinning or baitcasting from the updated scraping rules
            images: item.local_image_path || '', // Use the downloaded local image path instead of joined remote URLs
            main_selling_points: item.main_selling_points ? item.main_selling_points.join(' | ') : '',
            created_at: '',
            updated_at: ''
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
            if (actualSku.includes('XH') || actualSku.includes('XG')) gear_ratio_normalized = '超高齿比 (XH/XG)';
            else if (actualSku.includes('H') || actualSku.includes('HG')) gear_ratio_normalized = '高齿比 (H/HG)';
            else if (actualSku.includes('P') || actualSku.includes('PG')) gear_ratio_normalized = '低齿比 (P/PG)';
            else gear_ratio_normalized = '标准齿比';
            
            variantsRows.push({
                id: '', // Empty for manual fill or auto-generate later
                reel_id: masterId,
                SKU: actualSku,
                'SIZE FAMILY': v.specs.size_family || '',
                'SPOOL DEPTH (GSC)': spool_depth_normalized,
                'GEAR RATIO (GSC)': gear_ratio_normalized,
                'GEAR RATIO': v.specs.gear_ratio,
                'DRAG': '', // Usually calculated or same as max drag
                'MAX DRAG': v.specs.max_drag_kg,
                'WEIGHT': v.specs.weight_g,
                'spool_diameter_per_turn_mm': '',
                'Nylon_no_m': '',
                'Nylon_lb_m': v.specs.line_capacity_nylon,
                'fluorocarbon_no_m': '',
                'fluorocarbon_lb_m': '',
                'pe_no_m': v.specs.line_capacity_pe,
                'cm_per_turn': v.specs.cm_per_turn,
                'handle_length_mm': v.specs.handle_length_mm,
                'bearing_count_roller': v.specs.bearing_count_roller,
                'market_reference_price': v.specs.market_reference_price,
                'product_code': v.sku, // JAN code from the scraped data
                'created_at': '',
                'updated_at': ''
            });
        });
    });

    const wb = XLSX.utils.book_new();
    
    const wsReels = XLSX.utils.json_to_sheet(reelsRows);
    XLSX.utils.book_append_sheet(wb, wsReels, "Reels Master");
    
    const wsVariants = XLSX.utils.json_to_sheet(variantsRows);
    XLSX.utils.book_append_sheet(wb, wsVariants, "Reels Variants");
    
    XLSX.writeFile(wb, outputFile);
    
    console.log(`[To Excel] Conversion complete. Saved to ${outputFile}`);
}

main();
