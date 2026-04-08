const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputFile = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_test.json');
const outputFile = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_import.xlsx');

function main() {
    if (!fs.existsSync(inputFile)) {
        console.error(`[!] Input file not found: ${inputFile}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    const reelsRows = [];
    const variantsRows = [];
    
    let reelIdCounter = 5000;
    let detailIdCounter = 50000;

    const currentTime = new Date().toISOString();
    const seenSkus = new Set(); // For deduplication

    data.forEach((item, index) => {
        const brandId = item.brand === 'Daiwa' ? 'B-DAIWA' : '';
        const safeModel = item.model.replace(/\s+/g, '-').toUpperCase();
        let masterYear = item.model_year || '';
        
        const masterId = `DRE${reelIdCounter++}`;
        
        const localImagePath = item.local_image_path || (item.images && item.images.length > 0 ? item.images[0] : '');

        reelsRows.push({
            id: masterId,
            brand_id: brandId,
            model: item.model,
            model_cn: '',
            model_year: masterYear,
            alias: '',
            type_tips: item.kind,
            type: 'baitcasting',
            images: localImagePath,
            created_at: currentTime,
            updated_at: currentTime,
            series_positioning: '',
            main_selling_points: (item.main_selling_points || []).join('\n\n'),
            official_reference_price: '',
            market_status: 'On Sale'
        });

        if (!item.variants) return;

        item.variants.forEach((v) => {
            let rawSku = v.name || 'Unknown';
            let splitSkus = rawSku.split(/[\/,\n]/).map(s => s.trim()).filter(s => s);
            
            splitSkus.forEach((actualSku) => {
                const uniqueKey = `${masterId}-${actualSku}`;
                let isDuplicate = false;
                for (let existing of seenSkus) {
                    const existingActualSku = existing.substring(masterId.length + 1);
                    if (existing === uniqueKey) {
                        isDuplicate = true;
                        break;
                    }
                    // We removed the aggressive endsWith logic because "100" and "100L" are different SKUs.
                    // We just rely on exact uniqueKey matching to prevent exact duplicates, 
                    // which handles the same variant row being listed twice.
                }
                if (isDuplicate) return;
                seenSkus.add(uniqueKey);

                variantsRows.push({
                    id: `DRED${detailIdCounter++}`,
                    reel_id: masterId,
                    SKU: actualSku,
                    'GEAR RATIO': v.specs ? (v.specs.gear_ratio || '') : '',
                    DRAG: '',
                    'MAX DRAG': v.specs ? (v.specs.max_drag_kg || '') : '',
                    'MAX DURABILITY': v.specs ? (v.specs.max_durability_kg || '') : '',
                    WEIGHT: v.specs ? (v.specs.weight_g || '') : '',
                    spool_diameter_per_turn_mm: '',
                    Nylon_no_m: '',
                    Nylon_lb_m: v.specs ? (v.specs.line_capacity_nylon || '') : '',
                    fluorocarbon_no_m: '',
                    fluorocarbon_lb_m: v.specs ? (v.specs.line_capacity_fluorocarbon || '') : '',
                    pe_no_m: v.specs ? (v.specs.line_capacity_pe || '') : '',
                    cm_per_turn: v.specs ? (v.specs.retrieve_per_turn_cm || '') : '',
                    handle_length_mm: v.specs ? (v.specs.handle_length_mm || '') : '',
                    bearing_count_roller: v.specs ? (v.specs.bearing_count_main || '') : '',
                    market_reference_price: v.specs ? (v.specs.official_reference_price || '') : '',
                    product_code: '',
                    created_at: currentTime,
                    updated_at: currentTime,
                    drag_click: v.specs ? (v.specs.drag_click || '') : '',
                    spool_depth_normalized: '',
                    gear_ratio_normalized: '',
                    brake_type_normalized: '',
                    fit_style_tags: '',
                    min_lure_weight_hint: '',
                    is_compact_body: '',
                    handle_style: '',
                    
                    // Baitcasting specific
                    spool_diameter_mm: v.specs ? (v.specs.spool_diameter_mm || '') : '',
                    spool_width_mm: v.specs ? (v.specs.spool_width_mm || '') : '',
                    handle_knob_type: v.specs ? (v.specs.handle_knob_type || '') : '',
                    handle_knob_exchange_size: v.specs ? (v.specs.handle_knob_exchange_size || '') : '',
                    body_material: v.specs ? (v.specs.body_material || '') : '',
                    gear_material: v.specs ? (v.specs.gear_material || '') : '',
                    battery_capacity: v.specs ? (v.specs.battery_capacity || '') : '',
                    battery_charge_time: v.specs ? (v.specs.battery_charge_time || '') : '',
                    continuous_cast_count: v.specs ? (v.specs.continuous_cast_count || '') : '',
                    usage_environment: v.specs ? (v.specs.usage_environment || '') : ''
                });
            });
        });
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
        // 用户指定顺序：前 17 个字段
        "id", "reel_id", "SKU", "GEAR RATIO", "MAX DRAG", "WEIGHT", 
        "spool_diameter_per_turn_mm", "Nylon_lb_m", "fluorocarbon_lb_m", "pe_no_m", 
        "cm_per_turn", "handle_length_mm", "bearing_count_roller", 
        "market_reference_price", "product_code", "created_at", "updated_at",

        // 其他衍生、官网特有以及后续扩充字段统一放在后面
        "spool_diameter_mm", "spool_width_mm", "handle_knob_type", 
        "handle_knob_exchange_size", "body_material", "gear_material", 
        "battery_capacity", "battery_charge_time", "continuous_cast_count", 
        "usage_environment", "DRAG", "Nylon_no_m", "fluorocarbon_no_m", 
        "drag_click", "spool_depth_normalized", "gear_ratio_normalized", 
        "brake_type_normalized", "fit_style_tags", "min_lure_weight_hint", 
        "is_compact_body", "handle_style"
    ];
    const wsVariants = XLSX.utils.json_to_sheet(variantsRows, { header: variantsHeader });
    XLSX.utils.book_append_sheet(wb, wsVariants, "Reels Variants");
    
    XLSX.writeFile(wb, outputFile);
    console.log(`[To Excel] Conversion complete. Saved to ${outputFile}`);
}

main();