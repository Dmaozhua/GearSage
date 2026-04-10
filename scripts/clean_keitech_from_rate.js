const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const RATE_DIR = path.join(__dirname, '../GearSage-client/rate/excel');
const files = [
    'lure.xlsx', 
    'soft_lure_detail.xlsx', 
    'wire_lure_detail.xlsx', 
    'jig_lure_detail.xlsx', 
    'hardbait_lure_detail.xlsx', 
    'metal_lure_detail.xlsx'
];

files.forEach(f => {
    const p = path.join(RATE_DIR, f);
    if (fs.existsSync(p)) {
        const wb = XLSX.readFile(p);
        const sheetName = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        
        // Filter out any IDs starting with KL or KLD (Keitech)
        const filtered = data.filter(r => {
            const id = String(r.id || '');
            return !(id.startsWith('KL') || id.startsWith('KLD'));
        });
        
        if (filtered.length !== data.length) {
            const newWb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWb, XLSX.utils.json_to_sheet(filtered), sheetName);
            XLSX.writeFile(newWb, p);
            console.log(`Cleaned ${data.length - filtered.length} Keitech rows from ${f}`);
        }
    }
});
console.log("Cleanup complete.");
