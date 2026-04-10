const fs = require('fs');
const xlsx = require('xlsx');

function removePrefix(filePath, sheetName, idPrefix) {
    if (!fs.existsSync(filePath)) return;
    const wb = xlsx.readFile(filePath);
    if (!wb.Sheets[sheetName]) return;
    
    let rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    const originalCount = rows.length;
    rows = rows.filter(r => !String(r.id || '').startsWith(idPrefix) && !String(r.lure_id || '').startsWith(idPrefix));
    
    if (rows.length < originalCount) {
        console.log(`Removed ${originalCount - rows.length} rows with prefix ${idPrefix} from ${filePath} - ${sheetName}`);
        const ws = xlsx.utils.json_to_sheet(rows);
        wb.Sheets[sheetName] = ws;
        xlsx.writeFile(wb, filePath);
    }
}

removePrefix('GearSage-client/rate/excel/lure.xlsx', 'lure', 'YAM');
removePrefix('GearSage-client/rate/excel/soft_lure_detail.xlsx', 'soft_lure_detail', 'YAM');
