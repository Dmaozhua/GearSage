const fs = require('fs');
const path = require('path');

const RATE_DIR = path.join(__dirname, '../rate');
const OUT_FILE = path.join(__dirname, '../pkgGear/data/gear_data.js');

function parseCSV(content) {
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];
    
    // Simple CSV parser that handles quotes
    const parseLine = (line) => {
        const result = [];
        let current = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Skip header line
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        if (values.length > 0) {
            data.push(values);
        }
    }
    return data;
}

function readCSV(filename) {
    try {
        const filePath = path.join(RATE_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`Warning: File ${filename} not found.`);
            return [];
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return parseCSV(content);
    } catch (e) {
        console.error(`Error reading ${filename}:`, e);
        return [];
    }
}

// Data Processing
const brandsData = readCSV('brand.csv');
const brands = brandsData.map(row => ({
    id: row[0],
    name: row[1],
    name_en: row[2],
    description: row[3],
    country: row[6],
    site_url: row[7]
}));

const reelsData = readCSV('reel.csv');
const reels = reelsData.map(row => ({
    id: row[0],
    brand_id: row[1],
    model: row[2],
    model_cn: row[3],
    year: row[4],
    type: row[5]
}));

const spinningReelDetailsData = readCSV('spinning_reel_detail.csv');
const spinningReelDetails = spinningReelDetailsData.map(row => ({
    id: row[0],
    reel_id: row[1],
    sku: row[2],
    gear_ratio: row[3],
    drag: row[4],
    max_drag: row[5],
    weight: row[6],
    spool_dim: row[7],
    line_cap_nylon: row[9] || row[8], // Prefer lb-m if available, or just take whatever
    line_cap_pe: row[12],
    retrieve: row[13],
    handle_length: row[14],
    bearings: row[15],
    price: row[16],
    product_code: row[17],
    images: row[18]
}));

const baitcastingReelDetailsData = readCSV('baitcasting_reel_detail.csv');
const baitcastingReelDetails = baitcastingReelDetailsData.map(row => ({
    id: row[0],
    reel_id: row[1],
    model_variant: row[2],
    gear_ratio: row[3],
    max_drag: row[4],
    weight: row[5],
    spool_dim: row[6],
    line_cap_nylon: row[7], // lb-m
    line_cap_pe: row[9],
    retrieve: row[10],
    handle_length: row[11],
    bearings: row[12],
    price: row[13],
    product_code: row[14]
}));

const rodsData = readCSV('rod.csv');
const rods = rodsData.map(row => ({
    id: row[0],
    brand_id: row[1],
    model: row[2],
    type: row[3],
    length: row[4],
    sections: row[5],
    power: row[6],
    action: row[7],
    line_weight: row[8],
    lure_weight: row[9],
    price: row[10]
}));

const spinningRodDetailsData = readCSV('spinning_rod_detail.csv');
const spinningRodDetails = spinningRodDetailsData.map(row => ({
    id: row[0],
    rod_id: row[1],
    guide_type: row[2],
    handle_length: row[3],
    reel_seat: row[4]
}));

const castingRodDetailsData = readCSV('casting_rod_detail.csv');
const castingRodDetails = castingRodDetailsData.map(row => ({
    id: row[0],
    rod_id: row[1],
    trigger_type: row[2],
    handle_length: row[3],
    reel_seat: row[4]
}));

const luresData = readCSV('lure.csv');
const lures = luresData.map(row => ({
    id: row[0],
    brand_id: row[1],
    model: row[2],
    type: row[3],
    length: row[4],
    weight: row[5],
    color: row[6],
    price: row[7]
}));

const hardLureDetailsData = readCSV('hard_lure_detail.csv');
const hardLureDetails = hardLureDetailsData.map(row => ({
    id: row[0],
    lure_id: row[1],
    depth: row[2],
    buoyancy: row[3],
    rattle: row[4]
}));

const softLureDetailsData = readCSV('soft_lure_detail.csv');
const softLureDetails = softLureDetailsData.map(row => ({
    id: row[0],
    lure_id: row[1],
    scented: row[2],
    tail_type: row[3],
    rig_type: row[4]
}));

// Helper to join data
function getBrandName(brandId) {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.name : '';
}

function processItems(items, detailsList, detailKey = 'details') {
    return items.map(item => {
        // Find all details for this item
        const itemDetails = detailsList.filter(d => {
             // Foreign key is usually reel_id, rod_id, lure_id
             // We check all possible keys
             return d.reel_id === item.id || d.rod_id === item.id || d.lure_id === item.id;
        });
        
        // If there are details, merge them differently?
        // Actually, for this app, we want a list of products.
        // A "Reel" (Model) has multiple "Details" (Variants).
        // So we should structure it as: Reel -> { ...info, variants: [ ...details ] }
        
        return {
            ...item,
            brand_name: getBrandName(item.brand_id),
            variants: itemDetails
        };
    });
}

const reelsProcessed = [
    ...processItems(reels.filter(r => r.type === 'spinning'), spinningReelDetails),
    ...processItems(reels.filter(r => r.type === 'baitcasting'), baitcastingReelDetails)
];

const rodsProcessed = [
    ...processItems(rods.filter(r => r.type === 'spinning'), spinningRodDetails),
    ...processItems(rods.filter(r => r.type === 'baitcasting'), castingRodDetails)
];

const luresProcessed = [
    ...processItems(lures.filter(l => l.type === 'hard'), hardLureDetails),
    ...processItems(lures.filter(l => l.type === 'soft'), softLureDetails)
];

const outputData = {
    reels: reelsProcessed,
    rods: rodsProcessed,
    lures: luresProcessed
};

const fileContent = `module.exports = ${JSON.stringify(outputData, null, 2)};`;

fs.writeFileSync(OUT_FILE, fileContent);
console.log('Data conversion complete.');
