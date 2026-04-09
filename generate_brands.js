const xlsx = require('xlsx');
const wb = xlsx.readFile('/Users/tommy/Documents/GearData/rate/excel/brand.xlsx');
const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

let result = 'const BRAND_IDS = {\n';
data.forEach(row => {
    let key = row.name_en || row.name;
    // Normalize key: uppercase, replace non-alphanumeric with underscore
    key = key.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '');
    
    // special handling for Chinese chars
    if (row.name === '鸦语') key = 'YAYU';
    
    result += `    ${key}: ${row.id},\n`;
});
result += '};';
console.log(result);
