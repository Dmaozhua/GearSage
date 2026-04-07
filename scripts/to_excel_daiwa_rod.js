const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_rod_normalized.json');
const outputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_rod_import.xlsx');

if (!fs.existsSync(inputFile)) {
    console.error(`[Error] Input file not found: ${inputFile}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

const rodRows = [];
const detailRows = [];

let rodIdCounter = 1;
let detailIdCounter = 1;

for (const item of data) {
    const currentRodId = rodIdCounter++;
    
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
        'brand_id': '', 
        'model': item.model_name,
        'model_cn': '',
        'model_year': modelYear,
        'alias': '',
        'type_tips': 'ROD',
        'images': item.local_image_path || item.main_image_url || '',
        'created_at': '',
        'updated_at': ''
    });
    
    for (const v of item.variants) {
        const raw = v.raw_specs || {};
        
        // 将全角英数字符和标点符号转换为半角，全角空格转为半角空格，以便于正则匹配
        let code = v.variant_name.toUpperCase();
        code = code.replace(/[\uff01-\uff5e]/g, function(ch) {
            return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
        }).replace(/\u3000/g, ' ');
        
        let rodType = '';
        const modelName = item.model_name;
        if (modelName.includes('月下美人')) {
            // 月下美人系列中，枪柄通常带有 B，且 B 通常在连字符前面（如 63XULB-T・W）或结尾
            rodType = (code.includes('B-') || code.endsWith('B') || code.includes('B・')) ? 'C' : 'S';
        } else {
            const typeMatch = code.match(/^[A-Z]*([CS])\d/);
            if (typeMatch) {
                rodType = typeMatch[1];
            } else {
                if (code.endsWith('B') || code.includes('BAIT') || code.startsWith('C')) {
                    rodType = 'C';
                } else if (code.endsWith('S') || code.includes('SPIN') || code.startsWith('S')) {
                    rodType = 'S';
                }
            }
        }

        let parsedPower = '';
        const powerBase = "X{0,3}U{0,2}L|ML|M|MH|X{0,3}H";
        const powerRegex = new RegExp(`\\d{2,3}((${powerBase})(?:\\+)?(?:\\/(?:${powerBase})(?:\\+)?)?)`);
        const pMatch = code.match(powerRegex);
        if (pMatch) {
            parsedPower = pMatch[1];
        }
        
        const row = {
            'id': detailIdCounter++,
            'rod_id': currentRodId,
            'TYPE': rodType,
            'SKU': v.variant_name,
            'TOTAL LENGTH': raw['全長（m）'] || raw['全長（m）/（ft.）'] || raw['全長(m)'] || '',
            'POWER': parsedPower,
            'Action': raw['調子'] || '',
            'PIECES': raw['継数'] || raw['継数（本）'] || raw['継数(本)'] || '',
            'CLOSELENGTH': raw['仕舞寸法（cm）'] || raw['仕舞（cm）'] || raw['仕舞(cm)'] || '',
            'WEIGHT': raw['標準自重（ｇ）'] || raw['自重（g）'] || raw['自重(g)'] || '',
            'Tip Diameter': raw['先径/元径（mm）'] || raw['先径/元径(mm)'] || raw['先径（mm）'] || '',
            'LURE WEIGHT': raw['ルアー重量（ｇ）'] || raw['ルアー重量（g）'] || raw['ルアー重量(g)'] || '',
            'Line Wt N F': raw['適合ライン ナイロン （lb.）'] || raw['適合ライン（lb.）'] || raw['適合ライン(lb.)'] || '',
            'PE Line Size': raw['適合ライン PE（号）'] || raw['適合ラインPE（号）'] || raw['適合ラインPE(号)'] || '',
            'Handle Length': '',
            'Reel Seat Position': '',
            'CONTENT CARBON': raw['カーボン含有率（％）'] || raw['カーボン含有率(%)'] || '',
            'Market Reference Price': raw['メーカー希望本体価格（円）'] || raw['価格（円）'] || '',
            'AdminCode': raw['JAN'] || raw['JANコード'] || '',
            'Service Card': '',
            ' Jig Weight': raw['ジグ重量（g）'] || raw['ジグ重量(g)'] || '',
            'Squid Jig Size': raw['エギサイズ（号）'] || raw['エギサイズ(号)'] || '',
            'Sinker Rating': raw['錘負荷（号）'] || raw['錘負荷(号)'] || '',
            'created_at': '',
            'updated_at': ''
        };

        // Add any remaining keys from raw_specs that we haven't explicitly mapped
        const mappedKeys = [
            'アイテム', '説明', '全長（m）', '全長（m）/（ft.）', '全長(m)', '調子', '継数', '継数（本）', '継数(本)',
            '仕舞寸法（cm）', '仕舞（cm）', '仕舞(cm)', '標準自重（ｇ）', '自重（g）', '自重(g)',
            '先径/元径（mm）', '先径/元径(mm)', '先径（mm）', 'ルアー重量（ｇ）', 'ルアー重量（g）', 'ルアー重量(g)',
            '適合ライン ナイロン （lb.）', '適合ライン（lb.）', '適合ライン(lb.)', '適合ライン PE（号）', '適合ラインPE（号）', '適合ラインPE(号)',
            'カーボン含有率（％）', 'カーボン含有率(%)', 'メーカー希望本体価格（円）', '価格（円）', 'JAN', 'JANコード',
            'ジグ重量（g）', 'ジグ重量(g)', 'エギサイズ（号）', 'エギサイズ(号)', '錘負荷（号）', '錘負荷(号)'
        ];

        for (const [key, value] of Object.entries(raw)) {
            if (!mappedKeys.includes(key) && key !== '*') {
                row[key] = value;
            }
        }
        
        detailRows.push(row);
    }
}

const wb = xlsx.utils.book_new();

const rodSheet = xlsx.utils.json_to_sheet(rodRows);
xlsx.utils.book_append_sheet(wb, rodSheet, 'rod');

const detailSheet = xlsx.utils.json_to_sheet(detailRows);
xlsx.utils.book_append_sheet(wb, detailSheet, 'rod_detail');

xlsx.writeFile(wb, outputFile);
console.log(`[To Excel] Done! Saved to: ${outputFile}`);