const fs = require('fs');
const xlsx = require('xlsx');

function cleanupFile(filePath, sheetName, columnsToRemove) {
    console.log('Cleaning up', filePath);
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[sheetName];
    if (!ws) {
        console.log('Sheet not found:', sheetName);
        return;
    }
    
    let data = xlsx.utils.sheet_to_json(ws, { defval: '' });
    let removed = false;
    
    data.forEach(row => {
        columnsToRemove.forEach(col => {
            if (row.hasOwnProperty(col)) {
                delete row[col];
                removed = true;
            }
        });
    });
    
    if (removed) {
        const newWs = xlsx.utils.json_to_sheet(data);
        wb.Sheets[sheetName] = newWs;
        xlsx.writeFile(wb, filePath);
        console.log('Removed columns and saved:', filePath);
    } else {
        console.log('No columns needed removal.');
    }
}

cleanupFile('GearSage-client/rate/excel/lure.xlsx', 'lure', ['official_link', 'Description']);
cleanupFile('GearSage-client/rate/excel/soft_lure_detail.xlsx', 'soft_lure_detail', [
    'Size', 'Market Reference Price', 'Quantity', 'Hook', 'Hook Size', 
    'Ring Size', 'Material', 'Sale Price', 'Description'
]);
