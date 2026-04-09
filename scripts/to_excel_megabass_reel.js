const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const RAW_DATA_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_reel_normalized.json');
const OUTPUT_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_reel_import.xlsx');

function normalizeText(text) {
    if (!text) return '';
    return text.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function processReel() {
    if (!fs.existsSync(RAW_DATA_PATH)) {
        console.error(`Raw data not found: ${RAW_DATA_PATH}`);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf-8'));
    
    const reelMaster = [];
    const reelDetail = [];
    
    // Using counter to ensure unique IDs, Megabass reel starts with MRE and 5000-8999
    let currentId = 5000;
    let detailIdCounter = 50000;
    
    for (const item of rawData) {
        // Skip items without variants
        if (!item.variants || item.variants.length === 0) continue;
        
        const masterId = `MRE${currentId++}`;
        const isSpinning = item.source_url.includes('spinning') || item.source_url.includes('gaus');
        
        let imageFilename = '';
        if (item.main_image_url) {
            const parts = item.main_image_url.split('/');
            imageFilename = parts[parts.length - 1];
        }
        const localImagePath = imageFilename ? `/Users/tommy/Pictures/images/megabass_reels/${imageFilename}` : '';
        
        // Push to Master
        reelMaster.push({
            id: masterId,
            brand_id: BRAND_IDS.MEGABASS,
            model: item.model,
            model_cn: item.model,
            model_year: '',
            alias: '',
            type_tips: '',
            type: isSpinning ? 'spinning' : 'baitcasting',
            images: localImagePath,
            created_at: item.scraped_at,
            updated_at: item.scraped_at,
            series_positioning: '',
            main_selling_points: '',
            official_reference_price: '',
            market_status: ''
        });

        // Push to Detail
        for (const v of item.variants) {
            const specs = v.specs || {};
            const gearRatio = specs['gear ratio'] || specs['gear ratio:'] || '';
            const weight = specs['weight'] || specs['weight:'] || '';
            const maxDrag = specs['drag max'] || specs['max drag'] || '';
            const bearings = specs['bearings'] || specs['bearing'] || '';
            const price = specs['price'] || '';
            
            // Clean up price
            let priceClean = price.replace(/[^\d,]/g, '').replace(/,/g, '');
            
            // Try to extract nylon line capacity
            let lineNylon = specs['line'] || specs['line capacity'] || specs['line capa'] || '';
            let linePe = specs['pe'] || specs['pe line'] || '';
            
            const detailId = `MRED${detailIdCounter++}`;
            
            const detailObj = {
                id: detailId,
                reel_id: masterId,
                SKU: v.name,
                'GEAR RATIO': normalizeText(gearRatio),
                'MAX DRAG': normalizeText(maxDrag).replace(/kg/i, '').trim(),
                WEIGHT: normalizeText(weight).replace(/g/i, '').trim(),
                Nylon_lb_m: normalizeText(lineNylon),
                pe_no_m: normalizeText(linePe),
                cm_per_turn: normalizeText(specs['line /handle turn'] || specs['line/handle turn'] || specs['retrieve'] || ''),
                handle_length_mm: normalizeText(specs['handle'] || ''),
                bearing_count_roller: normalizeText(bearings),
                market_reference_price: priceClean,
                created_at: item.scraped_at,
                updated_at: item.scraped_at,
            };
            
            if (isSpinning) {
                detailObj.DRAG = '';
                detailObj.Nylon_no_m = '';
                detailObj.fluorocarbon_no_m = '';
                detailObj.fluorocarbon_lb_m = '';
                detailObj.spool_diameter_per_turn_mm = '';
                detailObj.product_code = '';
                reelDetail.push({ ...detailObj, type: 'spinning' });
            } else {
                detailObj.fluorocarbon_lb_m = '';
                detailObj.spool_diameter_mm = '';
                detailObj.spool_width_mm = '';
                detailObj.spool_diameter_per_turn_mm = '';
                detailObj.product_code = '';
                reelDetail.push({ ...detailObj, type: 'baitcasting' });
            }
        }
    }

    const wb = xlsx.utils.book_new();
    
    // Master Sheet
    const masterSheet = xlsx.utils.json_to_sheet(reelMaster, { header: HEADERS.reelMaster });
    xlsx.utils.book_append_sheet(wb, masterSheet, SHEET_NAMES.reel);
    
    const spinningDetails = reelDetail.filter(d => d.type === 'spinning');
    const baitcastingDetails = reelDetail.filter(d => d.type === 'baitcasting');
    
    const spinningSheet = xlsx.utils.json_to_sheet(spinningDetails, { header: HEADERS.spinningReelDetail });
    xlsx.utils.book_append_sheet(wb, spinningSheet, SHEET_NAMES.spinningReelDetail);
    
    const baitcastingSheet = xlsx.utils.json_to_sheet(baitcastingDetails, { header: HEADERS.baitcastingReelDetail });
    xlsx.utils.book_append_sheet(wb, baitcastingSheet, SHEET_NAMES.baitcastingReelDetail);

    xlsx.writeFile(wb, OUTPUT_PATH);
    console.log(`Generated Excel file at: ${OUTPUT_PATH}`);
}

processReel();
