const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://keitech.co.jp';
const IMAGE_DIR = path.join(__dirname, '../GearSage-client/pkgGear/images/rod/KEITECH');

if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Helper to download image
async function downloadImage(url, filename) {
    if (!url) return '';
    try {
        const filepath = path.join(IMAGE_DIR, filename);
        if (fs.existsSync(filepath)) {
            return `pkgGear/images/rod/KEITECH/${filename}`;
        }
        
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000
        });
        
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(`pkgGear/images/rod/KEITECH/${filename}`));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download image ${url}: ${error.message}`);
        return '';
    }
}

function normalizeText(text) {
    if (!text) return '';
    return text.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

async function scrapeKeitechRods() {
    console.log("Starting Keitech Rod scraping...");
    
    // The URLs are fixed from our analysis
    const rodUrls = [
        'https://keitech.co.jp/pages/628/',
        'https://keitech.co.jp/pages/629/',
        'https://keitech.co.jp/pages/600/',
        'https://keitech.co.jp/pages/589/'
    ];

    const results = [];

    for (let i = 0; i < rodUrls.length; i++) {
        const url = rodUrls[i];
        console.log(`[${i+1}/${rodUrls.length}] Scraping ${url}`);
        
        try {
            const res = await axios.get(url, { timeout: 15000 });
            const $ = cheerio.load(res.data);
            
            let modelName = $('title').text().split('｜')[0].trim();
            if (!modelName) modelName = $('h2').first().text().trim();

            const description = normalizeText($('.b_text').first().text());

            let mainImage = '';
            $('img').each((i, el) => {
                const src = $(el).attr('src');
                if (src && src.includes('.jpg') && !src.includes('dummy') && !src.includes('logo')) {
                    mainImage = BASE_URL + src;
                    return false; // break on first valid image
                }
            });

            let localImagePath = '';
            if (mainImage) {
                const filename = path.basename(new URL(mainImage).pathname);
                localImagePath = await downloadImage(mainImage, filename);
                console.log(`Downloaded image: ${localImagePath}`);
            }

            const variants = [];

            $('table').each((i, table) => {
                const rows = [];
                $(table).find('tr').each((j, tr) => {
                    const rowData = [];
                    $(tr).find('th, td').each((k, td) => {
                        rowData.push(normalizeText($(td).text()));
                    });
                    rows.push(rowData);
                });

                if (rows.length === 0) return;

                // The first row contains SKUs starting from col index 2
                // Example: モデルナンバー（ベイトモデル） |  | KTC662NF | KTC663NF ...
                const headerRow = rows[0];
                let startIndex = -1;
                for (let c = 0; c < headerRow.length; c++) {
                    if (headerRow[c].match(/KTC/i)) { // SKUs start with KTC
                        startIndex = c;
                        break;
                    }
                }
                
                if (startIndex === -1) {
                    // Try to guess start index if no KTC
                    if (headerRow.length > 2 && headerRow[2] !== '') {
                        startIndex = 2;
                    } else {
                        return;
                    }
                }

                for (let c = startIndex; c < headerRow.length; c++) {
                    const sku = headerRow[c];
                    if (!sku) continue;

                    const variant = { sku: sku.replace(/【NEW】/g, '').trim() };

                    // Parse other rows
                    for (let r = 1; r < rows.length; r++) {
                        const row = rows[r];
                        // Usually label is in col 0 or 1
                        const label1 = row[0] || '';
                        const label2 = row[1] || '';
                        const label = (label1 + ' ' + label2).trim().toLowerCase();
                        
                        const value = row[c] || '';
                        if (!value) continue;

                        if (label.includes('全長') && !label.includes('グリップ')) variant.total_length = value;
                        if (label.includes('自重')) variant.weight = value;
                        if (label.includes('継数')) variant.pieces = value;
                        if (label.includes('テーパー')) variant.action = value;
                        if (label.includes('cast wt')) variant.lure_weight = value;
                        if (label.includes('line wt')) variant.line_wt = value;
                        if (label.includes('価格')) variant.price = value;
                    }

                    variants.push(variant);
                }
            });

            const product = {
                brand: 'KEITECH',
                category: 'Rods',
                model: modelName,
                model_cn: modelName,
                source_url: url,
                main_image_url: mainImage,
                local_image_path: localImagePath,
                description: description,
                variants: variants,
                scraped_at: new Date().toISOString()
            };

            results.push(product);
            
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`Error scraping ${url}:`, error.message);
        }
    }

    const outPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/keitech_rod_normalized.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`Scraping complete. Data saved to ${outPath}`);
}

scrapeKeitechRods();