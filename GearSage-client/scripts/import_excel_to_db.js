const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const tcb = require('@cloudbase/node-sdk');
const xlsx = require('xlsx');

// Initialize CloudBase
// Ensure you have logged in via CLI `tcb login` or set TCB_SECRET_ID and TCB_SECRET_KEY env vars
const app = tcb.init({
    env: 'cloud1-1g9eeb3p33faac61', // Environment ID from app.js
    secretId: process.env.TCB_SECRET_ID,
    secretKey: process.env.TCB_SECRET_KEY
});

// Check for credentials
try {
    const auth = app.auth();
    // We don't need to sign in explicitly for admin operations if credentials are set,
    // but accessing the database will trigger the check.
} catch (e) {
    // This might not catch it immediately until an operation is performed
}

const db = app.database();
const _ = db.command;

const EXCEL_DIR = path.join(__dirname, '../rate/excel');
const SEARCH_DATA_DIR = path.join(__dirname, '../pkgGear/searchData');
const SEARCH_DATA_FILE = path.join(SEARCH_DATA_DIR, 'Data.js');

async function main() {
    try {
        console.log('Starting Excel import process...');
        
        // Check environment requirements
        if (!process.env.TCB_SECRET_ID && !process.env.TCB_SECRET_KEY) {
            // Try a simple operation to check if we are logged in via CLI
            try {
                // Just check if we can list collections or something simple? 
                // Actually, just let it fail later but warn now.
                // console.warn('Warning: TCB_SECRET_ID and TCB_SECRET_KEY are not set. Ensure you have run "tcb login".');
            } catch (e) {}
        }
        
        if (!fs.existsSync(EXCEL_DIR)) {
            console.error(`Directory not found: ${EXCEL_DIR}`);
            return;
        }

        const files = fs.readdirSync(EXCEL_DIR).filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));

        if (files.length === 0) {
            console.log('No Excel files found in', EXCEL_DIR);
            return;
        }

        console.log(`Found ${files.length} Excel files to process.`);

        for (const file of files) {
            await processFile(file);
        }

        console.log('All files processed successfully.');

        // Generate Search Data
        await generateSearchData();

    } catch (err) {
        if (err.message.includes('missing secretId or secretKey')) {
            console.error('ERROR: Missing CloudBase credentials.');
            console.error('Please run "tcb login" in your terminal or set TCB_SECRET_ID and TCB_SECRET_KEY environment variables.');
        } else {
            console.error('Fatal error in main process:', err);
        }
    } finally {
        // Ensure process exits
        process.exit(0);
    }
}

async function generateSearchData() {
    console.log('\n----------------------------------------');
    console.log('Generating Search Data (Data.js)...');

    if (!fs.existsSync(SEARCH_DATA_DIR)) {
        fs.mkdirSync(SEARCH_DATA_DIR, { recursive: true });
        console.log(`Created directory: ${SEARCH_DATA_DIR}`);
    }

    const targetFiles = [
        { file: 'reel.xlsx', type: 'reel' },
        { file: 'rod.xlsx', type: 'rod' },
        { file: 'lure.xlsx', type: 'lure' }
    ];

    let searchData = [];
    let currentId = 1;

    for (const target of targetFiles) {
        const filePath = path.join(EXCEL_DIR, target.file);
        if (!fs.existsSync(filePath)) {
            console.warn(`Warning: ${target.file} not found, skipping search data generation for this type.`);
            continue;
        }

        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            console.log(`Processing ${target.file} for search data... Found ${data.length} records.`);

            data.forEach(row => {
                // Construct name: model_year + model + model_cn
                // Using space as separator for readability in search
                const nameParts = [
                    row.model_year,
                    row.model,
                    row.model_cn
                ].filter(val => val !== undefined && val !== null && String(val).trim() !== '');
                
                const name = nameParts.join(' ');
                const alias = row.alias ? String(row.alias).trim() : '';
                const typeTips = row.type_tips ? String(row.type_tips).trim() : '';

                if (name) {
                    searchData.push({
                        type: target.type,
                        id: currentId++,
                        name: name,
                        alias: alias,
                        type_tips: typeTips
                    });
                }
            });

        } catch (err) {
            console.error(`Error processing ${target.file} for search data:`, err.message);
        }
    }

    // Write to Data.js
    try {
        if (fs.existsSync(SEARCH_DATA_FILE)) {
            fs.unlinkSync(SEARCH_DATA_FILE);
            console.log('Deleted existing Data.js');
        }

        const content = `module.exports = ${JSON.stringify(searchData, null, 2)};`;
        fs.writeFileSync(SEARCH_DATA_FILE, content, 'utf8');
        console.log(`Successfully generated Data.js with ${searchData.length} entries at ${SEARCH_DATA_FILE}`);
    } catch (err) {
        console.error('Failed to write Data.js:', err.message);
    }
}

async function processFile(fileName) {
    console.log(`\n----------------------------------------`);
    console.log(`Processing file: ${fileName}`);
    const filePath = path.join(EXCEL_DIR, fileName);
    
    // Determine collection name: bz_rate_ + filename (without extension)
    const baseName = path.parse(fileName).name;
    const collectionName = `bz_rate_${baseName}`;
    
    console.log(`Target Collection: ${collectionName}`);

    // Ensure collection exists
    try {
        await db.createCollection(collectionName);
        console.log(`Created collection: ${collectionName}`);
    } catch (err) {
        // Ignore if collection already exists
        if (!err.message.includes('Collection already exists') && !err.code?.includes('EXIST')) {
             // Some SDKs might throw different errors or just work. 
             // If createCollection fails, we log warning but proceed, maybe it exists.
             // But if it failed with other reason, we might still fail later.
             // Let's assume it might exist.
             // console.log(`Collection creation note: ${err.message}`);
        }
    }

    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assume data is in the first sheet
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    // header: 0 means use the first row as keys
    const data = xlsx.utils.sheet_to_json(sheet);
    
    if (data.length === 0) {
        console.log(`No data found in ${fileName}, skipping.`);
        return;
    }

    console.log(`Read ${data.length} records.`);

    // Process each row sequentially to avoid overwhelming the database connection
    // Optimization: Fetch all existing IDs to minimize read operations
    console.log('Fetching existing records for comparison...');
    const existingMap = await fetchExistingIds(collectionName);
    console.log(`Found ${existingMap.size} existing records in database.`);

    let successCount = 0;
    let errorCount = 0;
    let addedCount = 0;
    let updatedCount = 0;

    for (const [index, row] of data.entries()) {
        try {
            const result = await upsertRecordOptimized(collectionName, row, existingMap);
            if (result === 'added') addedCount++;
            if (result === 'updated') updatedCount++;
            successCount++;
        } catch (err) {
            if (err.message.includes('missing secretId or secretKey')) {
                throw err; // Re-throw to main handler
            }
            console.error(`Failed to upsert record at index ${index} (id=${row.id}):`, err.message);
            errorCount++;
        }
        
        // Log progress every 50 records
        if ((index + 1) % 50 === 0) {
            console.log(`Processed ${index + 1}/${data.length} records...`);
        }
    }

    console.log(`Finished ${fileName}. Total: ${data.length}, Added: ${addedCount}, Updated: ${updatedCount}, Errors: ${errorCount}`);
}

async function fetchExistingIds(collectionName) {
    const map = new Map();
    const MAX_LIMIT = 1000;
    let page = 0;
    
    while (true) {
        try {
            const res = await db.collection(collectionName)
                .field({ id: true }) // Only fetch id and _id
                .skip(page * MAX_LIMIT)
                .limit(MAX_LIMIT)
                .get();
            
            if (res.data.length === 0) break;
            
            res.data.forEach(doc => {
                if (doc.id !== undefined && doc.id !== null) {
                    // Ensure key is string for consistent matching if excel has string IDs
                    map.set(String(doc.id), doc._id);
                }
            });
            
            if (res.data.length < MAX_LIMIT) break;
            page++;
        } catch (err) {
            if (err.message.includes('missing secretId or secretKey')) {
                throw new Error('missing secretId or secretKey of tencent cloud');
            }
            // If collection doesn't exist, it might throw error or return empty
            // We assume empty if error
            console.warn(`Error fetching existing IDs for ${collectionName} (might be new collection):`, err.message);
            break;
        }
    }
    return map;
}

async function upsertRecordOptimized(collectionName, row, existingMap) {
    if (!row.hasOwnProperty('id')) {
        console.warn(`Row missing 'id' in ${collectionName}, adding as new record.`);
        row.created_at = db.serverDate();
        row.updated_at = db.serverDate();
        await db.collection(collectionName).add(row);
        return 'added';
    }

    const id = String(row.id); // Convert to string for map lookup
    const docId = existingMap.get(id);

    if (docId) {
        // Update existing record
        const updateData = { ...row };
        delete updateData._id; // Never update _id
        updateData.updated_at = db.serverDate();

        await db.collection(collectionName).doc(docId).update(updateData);
        return 'updated';
    } else {
        // Insert new record
        const insertData = { ...row };
        insertData.created_at = db.serverDate();
        insertData.updated_at = db.serverDate();
        
        await db.collection(collectionName).add(insertData);
        return 'added';
    }
}

// Deprecated
async function upsertRecord(collectionName, row) {

    // The requirement is to update fields based on the Excel data.
    // We assume 'id' is the unique key based on the provided documentation.
    
    if (!row.hasOwnProperty('id')) {
        console.warn(`Row missing 'id' in ${collectionName}, adding as new record.`);
        // Add timestamps for new record
        row.created_at = db.serverDate();
        row.updated_at = db.serverDate();
        await db.collection(collectionName).add(row);
        return;
    }

    const id = row.id;
    
    // Check if record exists by querying 'id' field
    // Note: This assumes 'id' is a field in the document, distinct from '_id'
    const res = await db.collection(collectionName).where({
        id: id
    }).get();

    if (res.data.length > 0) {
        // Update existing record
        const docId = res.data[0]._id;
        
        // Prepare update data
        const updateData = { ...row };
        delete updateData._id; // Never update _id
        
        // Update timestamp
        updateData.updated_at = db.serverDate();

        await db.collection(collectionName).doc(docId).update(updateData);
    } else {
        // Insert new record
        const insertData = { ...row };
        insertData.created_at = db.serverDate();
        insertData.updated_at = db.serverDate();
        
        await db.collection(collectionName).add(insertData);
    }
}

// Execute main function
main();
