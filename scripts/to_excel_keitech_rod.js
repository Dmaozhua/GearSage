const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, HEADERS, SHEET_NAMES } = require('./gear_export_schema');

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

function convertToExcel() {
    const dataPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/keitech_rod_normalized.json');
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
            model_year: '',
            alias: '',
            type_tips: 'casting', // Most Keitech rods are casting (ベイトモデル)
            fit_style_tags: fitStyleTags(item),
            images: item.local_image_path || item.main_image_url || '',
            created_at: item.scraped_at || '',
            updated_at: item.scraped_at || '',
            Description: item.description || '',
        });

        if (item.variants && item.variants.length > 0) {
            item.variants.forEach((variant, vIndex) => {
                const detailId = `${rodId}D${String(vIndex + 1).padStart(3, '0')}`;
                
                rodDetailData.push({
                    id: detailId,
                    rod_id: rodId,
                    TYPE: 'casting',
                    SKU: variant.sku || '',
                    'TOTAL LENGTH': variant.total_length || '',
                    Action: variant.action || '',
                    PIECES: variant.pieces || '',
                    CLOSELENGTH: '',
                    WEIGHT: variant.weight || '',
                    'Tip Diameter': '',
                    'LURE WEIGHT': variant.lure_weight || '',
                    'Line Wt N F': variant.line_wt || '',
                    'PE Line Size': '',
                    'Handle Length': '',
                    'Reel Seat Position': '',
                    'CONTENT CARBON': '',
                    'Market Reference Price': variant.price || '',
                    AdminCode: '',
                    'Service Card': '',
                    ' Jig Weight': '',
                    'Squid Jig Size': '',
                    'Sinker Rating': '',
                    created_at: item.scraped_at || '',
                    updated_at: item.scraped_at || '',
                    POWER: '',
                    'LURE WEIGHT (oz)': '',
                    'Sale Price': '',
                    'Joint Type': '',
                    'Code Name': '',
                    'Fly Line': '',
                    'Grip Type': '',
                    'Reel Size': '',
                    Description: '',
                    'Extra Spec 1': '',
                    'Extra Spec 2': ''
                });
            });
        }
    });

    const wb = xlsx.utils.book_new();

    const wsMaster = xlsx.utils.json_to_sheet(rodMasterData, { header: HEADERS.rodMaster });
    xlsx.utils.book_append_sheet(wb, wsMaster, SHEET_NAMES.rod);

    const wsDetail = xlsx.utils.json_to_sheet(rodDetailData, { header: HEADERS.rodDetail });
    xlsx.utils.book_append_sheet(wb, wsDetail, SHEET_NAMES.rodDetail);

    const outPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/keitech_rod_import.xlsx');
    xlsx.writeFile(wb, outPath);
    console.log(`Excel generated at ${outPath}`);
}

convertToExcel();
