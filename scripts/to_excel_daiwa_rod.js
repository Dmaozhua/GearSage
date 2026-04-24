const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { BRAND_IDS, SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_rod_normalized.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_rod_import.xlsx');
const urlsFileArgIndex = process.argv.indexOf('--urls-file');
const urlsFile = urlsFileArgIndex >= 0 ? process.argv[urlsFileArgIndex + 1] : '';

if (!fs.existsSync(inputFile)) {
    console.error(`[Error] Input file not found: ${inputFile}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
let filteredData = data;
if (urlsFile && fs.existsSync(urlsFile)) {
    const allowUrls = new Set(JSON.parse(fs.readFileSync(urlsFile, 'utf-8')));
    filteredData = data.filter((item) => allowUrls.has(item.url));
}

let existingRodByModel = new Map();
if (fs.existsSync(outputFile)) {
    try {
        const existingWb = xlsx.readFile(outputFile);
        const existingRodRows = xlsx.utils.sheet_to_json(existingWb.Sheets.rod || {}, { defval: '' });
        existingRodByModel = new Map(existingRodRows.map((row) => [row.model, row]));
    } catch (err) {
        console.warn(`[Warn] Failed to load existing rod sheet from ${outputFile}: ${err.message}`);
    }
}

const rodRows = [];
const detailRows = [];

let rodIdCounter = 1000;
let detailIdCounter = 10000;

for (const item of filteredData) {
    const currentRodId = `DR${rodIdCounter++}`;
    const existingRod = existingRodByModel.get(item.model_name) || {};
    
    let modelYear = '';
    const yearMatch = item.model_name.match(/(?:19|20)\d{2}/);
    if (yearMatch) {
        modelYear = yearMatch[0];
    } else {
        const shortYear = item.model_name.match(/\b(18|19|20|21|22|23|24|25)\b/);
        if (shortYear) {
            modelYear = '20' + shortYear[0];
        }
    }
    
    rodRows.push({
        'id': currentRodId,
        'brand_id': BRAND_IDS.DAIWA,
        'model': item.model_name,
        'created_at': '',
        'updated_at': '',
        'series_positioning': '',
        'main_selling_points': '',
        'official_reference_price': '',
        'market_status': '',
        'Description': item.series_description || item.description || '',
        'player_positioning': '',
        'player_selling_points': '',
        'model_cn': existingRod.model_cn || '',
        'model_year': existingRod.model_year || modelYear,
        'alias': existingRod.alias || '',
        'type_tips': existingRod.type_tips || '',
        'images': existingRod.images || item.local_image_path || item.main_image_url || ''
    });
    
    for (const v of item.variants) {
        const raw = v.raw_specs || {};
        
        // 将全角英数字符和标点符号转换为半角，全角空格转为半角空格，以便于正则匹配
        let code = v.variant_name.toUpperCase();
        code = code.replace(/[\uff01-\uff5e]/g, function(ch) {
            return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
        }).replace(/\u3000/g, ' ');
        
        let rodType = '';
        
        // 规则 1：尝试匹配长度数字前面的 C 或 S (例如 C610M -> C，SC C66M -> C)
        const typeMatch = code.match(/(?:^|[^A-Z])([CS])\d{2,4}/);
        
        if (typeMatch) {
            rodType = typeMatch[1];
        } else {
            // 规则 2：根据特殊字符/后缀判断兜底匹配，如果没有匹配到枪柄标识，则默认为直柄 S
            if (code.endsWith('B') || code.includes('B-') || code.includes('B・') || code.includes('BAIT')) {
                rodType = 'C';
            } else {
                rodType = 'S';
            }
        }

        let parsedPower = '';
        const powerBase = "(?:X{1,3}UL|S{1,2}UL|X{1,3}H|ML|MH|UL|M|H|L)";
        // Match power after digits, optionally preceded by 'T' (e.g., TMHB, TMLRB)
        const powerRegexAfter = new RegExp(`\\d{1,4}T?((${powerBase})(?:\\+)?(?:\\/(?:${powerBase})(?:\\+)?)?)`);
        // Match power before digits
        const powerRegexBefore = new RegExp(`(?:^|\\s|\\b)T?((${powerBase})(?:\\+)?(?:\\/(?:${powerBase})(?:\\+)?)?)\\s*-?\\s*\\d{2,4}`);
        
        const pMatchAfter = code.match(powerRegexAfter);
        const pMatchBefore = code.match(powerRegexBefore);
        
        if (pMatchAfter) {
            parsedPower = pMatchAfter[1];
        } else if (pMatchBefore) {
            parsedPower = pMatchBefore[1];
        }
        
        const row = {
            'id': `DRD${detailIdCounter++}`,
            'rod_id': currentRodId,
            'TYPE': rodType,
            'SKU': v.variant_name,
            'TOTAL LENGTH': raw['全長（m）'] || raw['全長（m）/（ft.）'] || raw['全長(m)'] || '',
            'POWER': parsedPower,
            'Action': raw['テーパー'] || raw['調子'] || '',
            'PIECES': raw['継数'] || raw['継数（本）'] || raw['継数(本)'] || '',
            'CLOSELENGTH': raw['仕舞寸法（cm）'] || raw['仕舞（cm）'] || raw['仕舞(cm)'] || '',
            'WEIGHT': raw['標準自重（ｇ）'] || raw['自重（g）'] || raw['自重(g)'] || '',
            'Tip Diameter': raw['先径/元径（mm）'] || raw['先径/元径(mm)'] || raw['先径（mm）'] || '',
            'LURE WEIGHT': raw['ルアー重量（ｇ）'] || raw['ルアー重量（g）'] || raw['ルアー重量(g)'] || '',
            'LURE WEIGHT (oz)': raw['ルアー重量（oz）'] || '',
            'Line Wt N F': raw['適合ライン ナイロン （lb.）'] || raw['適合ライン（lb.）'] || raw['適合ライン(lb.)'] || '',
            'PE Line Size': raw['適合ライン PE（号）'] || raw['適合ラインPE（号）'] || raw['適合ラインPE(号)'] || '',
            'Handle Length': '',
            'Reel Seat Position': '',
            'CONTENT CARBON': raw['カーボン含有率（％）'] || raw['カーボン含有率(%)'] || '',
            'Market Reference Price': raw['メーカー希望本体価格（円）'] || raw['価格（円）'] || '',
            'Sale Price': raw['販売価格（円）'] || '',
            'AdminCode': raw['JAN'] || raw['JANコード'] || '',
            'Service Card': '',
            ' Jig Weight': raw['ルアー重量（ｇ）（ジグ）'] || raw['ジグ重量（g）'] || raw['ジグ重量(g)'] || '',
            'Squid Jig Size': raw['対応エギサイズ'] || raw['エギサイズ（号）'] || raw['エギサイズ(号)'] || '',
            'Sinker Rating': raw['錘負荷（号）'] || raw['錘負荷(号)'] || '',
            'Joint Type': raw['ジョイント仕様'] || '',
            'Code Name': raw['コードネーム'] || '',
            'Fly Line': raw['フライライン(No#=#)'] || '',
            'Grip Type': raw['グリップタイプ'] || '',
            'Reel Size': raw['リールサイズ'] || '',
            'created_at': '',
            'updated_at': '',
            'Extra Spec 1': '',
            'Extra Spec 2': '',
            'guide_layout_type': '',
            'guide_use_hint': '',
            'hook_keeper_included': '',
            'sweet_spot_lure_weight_real': '',
            'official_environment': '',
            'player_environment': '',
            'player_positioning': '',
            'player_selling_points': '',
            'Description': v.variant_description || ''
        };

        // Keep export schema stable: fold the first two unmapped notes into generic extra fields.
        const mappedKeys = [
            'アイテム', '説明', '全長（m）', '全長（m）/（ft.）', '全長(m)', 'テーパー', '調子', '継数', '継数（本）', '継数(本)',
            '仕舞寸法（cm）', '仕舞（cm）', '仕舞(cm)', '標準自重（ｇ）', '自重（g）', '自重(g)',
            '先径/元径（mm）', '先径/元径(mm)', '先径（mm）', 'ルアー重量（ｇ）', 'ルアー重量（g）', 'ルアー重量(g)', 'ルアー重量（oz）',
            '適合ライン ナイロン （lb.）', '適合ライン（lb.）', '適合ライン(lb.)', '適合ライン PE（号）', '適合ラインPE（号）', '適合ラインPE(号)',
            'カーボン含有率（％）', 'カーボン含有率(%)', 'メーカー希望本体価格（円）', '価格（円）', '販売価格（円）', 'JAN', 'JANコード',
            'ルアー重量（ｇ）（ジグ）', 'ジグ重量（g）', 'ジグ重量(g)', '対応エギサイズ', 'エギサイズ（号）', 'エギサイズ(号)', '錘負荷（号）', '錘負荷(号)',
            'ジョイント仕様', 'コードネーム', 'フライライン(No#=#)', 'グリップタイプ', 'リールサイズ'
        ];
        const extraNotes = [];
        for (const [key, value] of Object.entries(raw)) {
            if (!mappedKeys.includes(key) && key !== '*' && value) {
                extraNotes.push(`${key}: ${value}`);
            }
        }
        row['Extra Spec 1'] = extraNotes[0] || row['Extra Spec 1'];
        row['Extra Spec 2'] = extraNotes[1] || row['Extra Spec 2'];
        
        detailRows.push(row);
    }
}

const wb = xlsx.utils.book_new();

const rodSheet = xlsx.utils.json_to_sheet(rodRows, { header: HEADERS.rodMaster });
xlsx.utils.book_append_sheet(wb, rodSheet, SHEET_NAMES.rod);

const detailSheet = xlsx.utils.json_to_sheet(detailRows, { header: HEADERS.rodDetail });
xlsx.utils.book_append_sheet(wb, detailSheet, SHEET_NAMES.rodDetail);

xlsx.writeFile(wb, outputFile);
console.log(`[To Excel] Done! Saved to: ${outputFile}`);
console.log({ items: filteredData.length });
