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
        // Master Row
        // id, category, brand, series, model, displayName, sourceUrl
        const masterId = `R-DAIWA-${i+1}`.padStart(10, '0');
        
        reelsRows.push({
            id: masterId,
            category: item.kind,
            brand: item.brand,
            series: '',
            model: item.model,
            displayName: `${item.brand} ${item.model}`,
            sourceUrl: item.source_url,
            images: item.images.join('|')
        });
        
        // Variants Rows
        item.variants.forEach(v => {
            variantsRows.push({
                master_id: masterId,
                sku: v.sku,
                name: v.name,
                gear_ratio: v.specs.gear_ratio,
                weight_g: v.specs.weight_g,
                max_drag_kg: v.specs.max_drag_kg,
                line_capacity_pe: v.specs.line_capacity_pe
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
