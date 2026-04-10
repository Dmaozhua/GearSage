const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const RAW_DATA_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/keitech_lure_normalized.json');
const OUTPUT_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/keitech_lure_import.xlsx');

function normalizeText(text) {
    if (!text) return '';
    return String(text).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function main() {
    console.log(`[To Excel] Starting Keitech Lure conversion from ${RAW_DATA_PATH}`);

    if (!fs.existsSync(RAW_DATA_PATH)) {
        console.error(`[Error] Raw data file not found: ${RAW_DATA_PATH}`);
        console.log(`[Info] Please scrape Keitech data and place it at this location first.`);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf-8'));
    
    const masterRows = [];
    const softDetailRows = [];
    const wireDetailRows = [];
    const jigDetailRows = [];
    
    // Keitech IDs
    let masterIdCounter = 1000;
    let detailIdCounter = 10000;

    for (const item of rawData) {
        // Map Keitech categories to GearSage internal types
        const category = normalizeText(item.category || '').toLowerCase();
        
        let targetDetailRows = null;
        let systemType = '';
        
        if (category.includes('swin baits') || category.includes('swim baits') || category.includes('soft baits')) {
            targetDetailRows = softDetailRows;
            systemType = 'soft';
        } else if (category.includes('wire baits')) {
            targetDetailRows = wireDetailRows;
            systemType = 'wire';
        } else if (category.includes('rubber jigs')) {
            targetDetailRows = jigDetailRows;
            systemType = 'jig';
        } else if (category.includes('terminal tackle')) {
            // Usually not lures, skip or log
            console.log(`[Skip] Skipping terminal tackle: ${item.model}`);
            continue;
        } else {
            console.warn(`[Warning] Unknown category "${category}" for item ${item.model}, defaulting to soft`);
            targetDetailRows = softDetailRows;
            systemType = 'soft';
        }

        const masterId = `KL${masterIdCounter++}`;
        
        // Push to Master
        masterRows.push({
            id: masterId,
            brand_id: BRAND_IDS.KEITECH,
            model: normalizeText(item.model),
            model_cn: normalizeText(item.model_cn || item.model),
            model_year: '',
            alias: '',
            type_tips: item.type_tips || '',
            system: systemType,
            water_column: item.water_column || '',
            action: item.action || '',
            images: item.local_image_path || item.main_image_url || '', // Use local image path, fallback to remote
            official_link: item.source_url || '',
            created_at: item.scraped_at || new Date().toISOString(),
            updated_at: item.scraped_at || new Date().toISOString(),
            description: normalizeText(item.description || ''),
        });

        // Push to Detail (Variants)
        if (item.variants && item.variants.length > 0) {
            for (const v of item.variants) {
                const detailId = `KLD${detailIdCounter++}`;
                
                const detailObj = {
                    id: detailId,
                    lure_id: masterId,
                    SKU: normalizeText(v.sku || v.name || v.size),
                    WEIGHT: normalizeText(v.weight || ''),
                    length: normalizeText(v.length || ''),
                    size: normalizeText(v.size || ''),
                    sinkingspeed: '',
                    referenceprice: normalizeText(v.price || ''),
                    created_at: item.scraped_at || new Date().toISOString(),
                    updated_at: item.scraped_at || new Date().toISOString(),
                    COLOR: normalizeText(v.color || ''),
                    AdminCode: '',
                    hook_size: normalizeText(v.hook_size || ''),
                    depth: '',
                    action: '',
                    subname: '',
                    'other.1': '',
                };

                // Add 'quantity (入数)' for soft baits specifically
                if (systemType === 'soft') {
                    detailObj['quantity (入数)'] = normalizeText(v.quantity || '');
                }

                targetDetailRows.push(detailObj);
            }
        }
    }

    const wb = XLSX.utils.book_new();

    // Append Master
    XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(masterRows, { header: HEADERS.lureMaster }),
        SHEET_NAMES.lure
    );

    // Append Details
    if (softDetailRows.length > 0) {
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.json_to_sheet(softDetailRows, { header: HEADERS.softLureDetail }),
            SHEET_NAMES.softLureDetail
        );
    }
    if (wireDetailRows.length > 0) {
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.json_to_sheet(wireDetailRows, { header: HEADERS.wireLureDetail }),
            SHEET_NAMES.wireLureDetail
        );
    }
    if (jigDetailRows.length > 0) {
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.json_to_sheet(jigDetailRows, { header: HEADERS.jigLureDetail }),
            SHEET_NAMES.jigLureDetail
        );
    }

    XLSX.writeFile(wb, OUTPUT_PATH);
    console.log(`[To Excel] Conversion complete. Saved to ${OUTPUT_PATH}`);
    console.log(`Summary: Master=${masterRows.length}, Soft=${softDetailRows.length}, Wire=${wireDetailRows.length}, Jig=${jigDetailRows.length}`);
}

main();
