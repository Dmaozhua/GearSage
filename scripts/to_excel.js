const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

const inputFile = gearDataPaths.resolveDataRaw('daiwa_reel_normalized.json');
const outputFile = gearDataPaths.resolveDataRaw('daiwa_spinning_reels_import.xlsx');

function normalizeText(value) {
    return String(value || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildStableDaiwaSpinningDetailId(masterId, sku, index = 0) {
    const normalizedMasterId = normalizeText(masterId);
    const normalizedSku = normalizeText(sku).toUpperCase();
    const hash = crypto
        .createHash('sha1')
        .update(`${normalizedMasterId}::${normalizedSku || index}`)
        .digest('hex')
        .slice(0, 10)
        .toUpperCase();
    return `DRED${normalizedMasterId.replace(/^DRE/, '')}_${hash}`;
}

function main() {
    console.log('[To Excel] Starting conversion for', inputFile);

    if (!fs.existsSync(inputFile)) {
        console.error('[!] Error: File not found.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    const reelsRows = [];
    const variantsRows = [];

    let reelIdCounter = 1000;
    const currentTime = new Date().toISOString();

    data.forEach((item) => {
        if (normalizeText(item.kind) !== 'spinning') {
            return;
        }

        const masterId = `DRE${reelIdCounter++}`;
        const displayModel = normalizeText(item.model)
            .replace(/(?:\s|-)*\d+(?:\s*[/,]\s*\d+)+\s*/g, '')
            .replace(/\s*\(\d+(?:\s*,\s*\d+)+\)\s*/g, '')
            .trim();

        const prices = (Array.isArray(item.variants) ? item.variants : [])
            .map((variant) => normalizeText(variant && variant.specs && variant.specs.official_reference_price))
            .map((value) => value.replace(/[^\d]/g, ''))
            .filter(Boolean)
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));

        let officialReferencePrice = '';
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            officialReferencePrice = minPrice === maxPrice
                ? `¥${minPrice.toLocaleString()}`
                : `¥${minPrice.toLocaleString()} - ¥${maxPrice.toLocaleString()}`;
        }

        reelsRows.push({
            id: masterId,
            brand_id: BRAND_IDS.DAIWA,
            model: displayModel,
            model_cn: '',
            model_year: normalizeText(item.model_year),
            alias: '',
            type_tips: '',
            type: 'spinning',
            images: normalizeText(item.local_image_path),
            created_at: normalizeText(item.scraped_at) || currentTime,
            updated_at: normalizeText(item.scraped_at) || currentTime,
            series_positioning: '',
            main_selling_points: Array.isArray(item.main_selling_points) ? item.main_selling_points.join(' | ') : '',
            official_reference_price: officialReferencePrice,
            market_status: '在售'
        });

        const seenSkus = new Set();
        (Array.isArray(item.variants) ? item.variants : []).forEach((variant) => {
            const rawSku = normalizeText(variant.name);
            const skuList = rawSku
                .split(/[\/\n,]+/)
                .map((sku) => normalizeText(sku))
                .filter(Boolean);

            skuList.forEach((actualSku) => {
                if (seenSkus.has(actualSku)) {
                    return;
                }
                seenSkus.add(actualSku);

                const specs = variant.specs || {};
                const suffix = actualSku.match(/\d{3,5}[A-Za-z]*(.*)/);
                const suffixText = suffix && suffix[1] ? suffix[1].toUpperCase() : '';

                let spoolDepth = '标准杯';
                const sizeSpoolMatch = actualSku.match(/\d{3,5}([A-Za-z]*)/);
                if (sizeSpoolMatch && sizeSpoolMatch[1]) {
                    const spoolStr = sizeSpoolMatch[1].toUpperCase();
                    if (spoolStr.includes('SS')) spoolDepth = '超浅杯 (SS)';
                    else if (spoolStr.includes('S')) spoolDepth = '浅杯 (S)';
                    else if (spoolStr.includes('D')) spoolDepth = '深杯 (D)';
                }

                let gearRatioNormalized = '中速比';
                const tempSuffix = suffixText.replace('DH', '');
                if (tempSuffix.includes('XH')) gearRatioNormalized = '超高速比 (XH)';
                else if (tempSuffix.includes('H')) gearRatioNormalized = '高速比 (H)';
                else if (tempSuffix.includes('P')) gearRatioNormalized = '低速比 (P)';

                let handleStyle = '';
                if (suffixText.includes('DH')) handleStyle = '双摇臂 (DH)';
                else if (suffixText.includes('OT')) handleStyle = '折叠摇臂 (OT)';
                else if (suffixText.includes('LB')) handleStyle = '手刹把 (LB)';
                else if (suffixText.includes('QD')) handleStyle = '快速卸力 (QD)';

                variantsRows.push({
                    id: buildStableDaiwaSpinningDetailId(masterId, actualSku, variantsRows.length),
                    reel_id: masterId,
                    type: 'spinning',
                    SKU: actualSku,
                    'GEAR RATIO': normalizeText(specs.gear_ratio),
                    DRAG: '',
                    'MAX DRAG': normalizeText(specs.max_drag_kg),
                    WEIGHT: normalizeText(specs.weight_g),
                    spool_diameter_per_turn_mm: '',
                    Nylon_no_m: '',
                    Nylon_lb_m: normalizeText(specs.line_capacity_nylon),
                    fluorocarbon_no_m: '',
                    fluorocarbon_lb_m: '',
                    pe_no_m: normalizeText(specs.line_capacity_pe),
                    cm_per_turn: normalizeText(specs.retrieve_per_turn_cm),
                    handle_length_mm: normalizeText(specs.handle_length_mm),
                    bearing_count_roller: normalizeText(specs.bearing_count_main),
                    market_reference_price: normalizeText(specs.official_reference_price),
                    product_code: '',
                    created_at: normalizeText(item.scraped_at) || currentTime,
                    updated_at: normalizeText(item.scraped_at) || currentTime,
                    drag_click: normalizeText(specs.drag_click),
                    spool_depth_normalized: spoolDepth,
                    gear_ratio_normalized: gearRatioNormalized,
                    brake_type_normalized: '',
                    fit_style_tags: '',
                    min_lure_weight_hint: '',
                    is_compact_body: suffixText.includes('C') ? '是' : '',
                    handle_style: handleStyle,
                    MAX_DURABILITY: normalizeText(specs.max_durability_kg),
                });
            });
        });
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(reelsRows, { header: HEADERS.reelMaster }),
        SHEET_NAMES.reel,
    );
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(variantsRows, { header: HEADERS.spinningReelDetail }),
        SHEET_NAMES.spinningReelDetail,
    );

    XLSX.writeFile(workbook, outputFile);
    console.log(`[To Excel] Conversion complete. Saved to ${outputFile}`);
}

main();
