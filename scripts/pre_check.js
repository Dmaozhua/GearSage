const fs = require('fs');
const path = require('path');

const inputFile = path.resolve(__dirname, '../GearSage-client/pkgGear/data_raw/daiwa_reel_normalized.json');

function main() {
    console.log('[Pre-Check] Starting validation for', inputFile);
    
    if (!fs.existsSync(inputFile)) {
        console.error('[!] Error: File not found.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    
    if (!Array.isArray(data)) {
        console.error('[!] Error: Expected an array of objects.');
        process.exit(1);
    }
    
    let validCount = 0;
    let errors = 0;

    data.forEach((item, index) => {
        const issues = [];
        
        if (!item.brand) issues.push('Missing brand');
        if (!item.kind) issues.push('Missing kind');
        if (!item.model) issues.push('Missing model');
        if (!item.source_url) issues.push('Missing source_url');
        if (!item.raw_data_hash) issues.push('Missing raw_data_hash');
        
        if (issues.length > 0) {
            console.error(`[!] Item ${index} (${item.model || 'Unknown'}) has issues:`, issues.join(', '));
            errors++;
        } else {
            validCount++;
        }
    });

    console.log(`[Pre-Check] Validation complete. ${validCount} valid items. ${errors} items with errors.`);
    if (errors > 0) {
        process.exit(1);
    }
}

main();
