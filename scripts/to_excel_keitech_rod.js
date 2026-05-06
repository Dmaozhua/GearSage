const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, HEADERS, SHEET_NAMES } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

function fitStyleTags(item) {
    if (item.fit_style_tags) return item.fit_style_tags;
    const text = [
        item.model,
        item.model_cn,
        item.description,
        ...(item.variants || []).flatMap((variant) => [
            variant.sku,
            variant.pieces,
            variant.total_length,
        ]),
    ].filter(Boolean).join(' ').toLowerCase();
    const tags = ['bass'];
    const hasThreePlus = (item.variants || []).some((variant) => {
        const match = String(variant.pieces || '').match(/\b([3-9]|10)\b/);
        return match && Number(match[1]) >= 3;
    });
    const hasTwoPieceOnly = /\b2[- ]?(?:pc|pcs|piece)\b|\btwo[- ]piece\b|2\s*(?:ピース|本|節|节)/.test(text);
    if (hasThreePlus || (/\btravel\b|\bmobile\b|\bpack\s*rod\b|\bmulti[- ]?piece\b|パック|モバイル|テレスコ|telescopic|多节|多節|振出|旅行|便携|携帯/i.test(text) && !hasTwoPieceOnly)) {
        tags.push('旅行');
    }
    return ['bass', '溪流', '海鲈', '根钓', '岸投', '船钓', '旅行'].filter((tag) => tags.includes(tag)).join(',');
}

function firstValue(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return '';
}

function convertToExcel() {
    const dataPath = gearDataPaths.resolveDataRaw('keitech_rod_normalized.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data file not found:', dataPath);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    const brandId = BRAND_IDS['KEITECH']; // 35
    if (!brandId) {
        console.error('Brand ID for Keitech not found');
        return;
    }

    const rodMasterData = [];
    const rodDetailData = [];

    rawData.forEach((item, index) => {
        const rodId = `KR${String(index + 1).padStart(3, '0')}`; // Base ID
        
        rodMasterData.push({
            id: rodId,
            brand_id: brandId,
            model: item.model || '',
            model_cn: item.model_cn || '',
            model_year: item.model_year || '',
            alias: item.alias || '',
            type_tips: item.type_tips || 'casting',
            fit_style_tags: fitStyleTags(item),
            images: item.local_image_path || item.main_image_url || '',
            created_at: item.scraped_at || '',
            updated_at: item.scraped_at || '',
            series_positioning: item.series_positioning || '',
            main_selling_points: item.main_selling_points || '',
            official_reference_price: item.official_reference_price || '',
            market_status: item.market_status || '',
            Description: item.Description || item.description || '',
            player_positioning: item.player_positioning || '',
            player_selling_points: item.player_selling_points || '',
        });

        if (item.variants && item.variants.length > 0) {
            item.variants.forEach((variant, vIndex) => {
                const detailId = `${rodId}D${String(vIndex + 1).padStart(3, '0')}`;
                
                rodDetailData.push({
                    id: detailId,
                    rod_id: rodId,
                    TYPE: firstValue(variant.TYPE, variant.type, 'C'),
                    SKU: variant.sku || '',
                    POWER: variant.POWER || '',
                    'TOTAL LENGTH': firstValue(variant['TOTAL LENGTH'], variant.total_length),
                    Action: firstValue(variant.Action, variant.action),
                    PIECES: firstValue(variant.PIECES, variant.pieces),
                    CLOSELENGTH: variant.CLOSELENGTH || '',
                    WEIGHT: firstValue(variant.WEIGHT, variant.weight),
                    'Tip Diameter': variant['Tip Diameter'] || '',
                    'LURE WEIGHT': firstValue(variant['LURE WEIGHT'], variant.lure_weight),
                    'Line Wt N F': firstValue(variant['Line Wt N F'], variant.line_wt),
                    'PE Line Size': variant['PE Line Size'] || '',
                    'Handle Length': variant['Handle Length'] || '',
                    'Reel Seat Position': variant['Reel Seat Position'] || '',
                    'CONTENT CARBON': variant['CONTENT CARBON'] || '',
                    'Market Reference Price': firstValue(variant['Market Reference Price'], variant.price),
                    AdminCode: variant.AdminCode || '',
                    'Service Card': variant['Service Card'] || '',
                    ' Jig Weight': variant[' Jig Weight'] || '',
                    'Squid Jig Size': variant['Squid Jig Size'] || '',
                    'Sinker Rating': variant['Sinker Rating'] || '',
                    created_at: item.scraped_at || '',
                    updated_at: item.scraped_at || '',
                    'LURE WEIGHT (oz)': variant['LURE WEIGHT (oz)'] || '',
                    'Sale Price': variant['Sale Price'] || '',
                    'Joint Type': variant['Joint Type'] || '',
                    'Code Name': variant['Code Name'] || '',
                    'Fly Line': variant['Fly Line'] || '',
                    'Grip Type': variant['Grip Type'] || '',
                    'Reel Size': variant['Reel Size'] || '',
                    guide_layout_type: variant.guide_layout_type || '',
                    guide_use_hint: variant.guide_use_hint || '',
                    recommended_rig_pairing: variant.recommended_rig_pairing || '',
                    hook_keeper_included: variant.hook_keeper_included || '',
                    sweet_spot_lure_weight_real: variant.sweet_spot_lure_weight_real || '',
                    official_environment: variant.official_environment || '',
                    player_environment: variant.player_environment || '',
                    player_positioning: variant.player_positioning || '',
                    player_selling_points: variant.player_selling_points || '',
                    Description: variant.Description || variant.description || '',
                    product_technical: variant.product_technical || '',
                    'Extra Spec 1': variant['Extra Spec 1'] || '',
                    'Extra Spec 2': variant['Extra Spec 2'] || ''
                });
            });
        }
    });

    const wb = xlsx.utils.book_new();

    const wsMaster = xlsx.utils.json_to_sheet(rodMasterData, { header: HEADERS.rodMaster });
    xlsx.utils.book_append_sheet(wb, wsMaster, SHEET_NAMES.rod);

    const wsDetail = xlsx.utils.json_to_sheet(rodDetailData, { header: HEADERS.rodDetail });
    xlsx.utils.book_append_sheet(wb, wsDetail, SHEET_NAMES.rodDetail);

    const outPath = gearDataPaths.resolveDataRaw('keitech_rod_import.xlsx');
    xlsx.writeFile(wb, outPath);
    console.log(`Excel generated at ${outPath}`);
}

convertToExcel();
