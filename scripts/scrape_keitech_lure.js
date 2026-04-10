const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://keitech.co.jp';
const OUTPUT_PATH = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/keitech_lure_normalized.json');

const CATEGORIES = [
    { name: 'swin baits', url: '/pages/462/' },
    { name: 'soft baits', url: '/pages/466/' },
    { name: 'wire baits', url: '/pages/555/' },
    { name: 'rubber jigs', url: '/pages/540/' },
    // Tungsten Jigs (many are rubber jigs)
    { name: 'rubber jigs', url: '/pages/496/' }
];

async function fetchHtml(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        return data;
    } catch (e) {
        console.error(`Error fetching ${url}:`, e.message);
        return null;
    }
}

const IMAGE_DIR = path.join(__dirname, '../GearSage-client/pkgGear/images/lure/KEITECH');
if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Helper to download image
async function downloadImage(url, filename) {
    if (!url) return '';
    try {
        const filepath = path.join(IMAGE_DIR, filename);
        if (fs.existsSync(filepath)) {
            return `pkgGear/images/lure/KEITECH/${filename}`; // Return relative path
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
            writer.on('finish', () => resolve(`pkgGear/images/lure/KEITECH/${filename}`));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download image ${url}: ${error.message}`);
        return '';
    }
}

async function scrapeKeitech() {
    console.log("Starting Keitech Lure scraping...");
    const products = [];
    const productUrls = new Set();
    
    // 1. Gather all product URLs from categories
    for (const cat of CATEGORIES) {
        console.log(`Fetching category: ${cat.name} (${cat.url})`);
        const catHtml = await fetchHtml(BASE_URL + cat.url);
        if (!catHtml) continue;
        
        const $ = cheerio.load(catHtml);
        
        // Find all links in the main content area that look like products
        $('#page-content a').each((i, el) => {
            const href = $(el).attr('href');
            // Keitech product pages usually have a numeric ID, e.g., /pages/39/
            if (href && href.match(/\/pages\/\d+\/?$/) && !href.includes(cat.url)) {
                const fullUrl = href.startsWith('http') ? href : BASE_URL + href;
                if (!productUrls.has(fullUrl)) {
                    productUrls.add(fullUrl);
                    products.push({
                        url: fullUrl,
                        category: cat.name
                    });
                }
            }
        });
    }
    
    console.log(`Found ${products.length} products. Starting detail extraction...`);
    
    const results = [];
    
    // 2. Extract details for each product
    for (let i = 0; i < products.length; i++) {
        const prod = products[i];
        console.log(`[${i+1}/${products.length}] Scraping ${prod.url}`);
        
        const prodHtml = await fetchHtml(prod.url);
        if (!prodHtml) continue;
        
        const $ = cheerio.load(prodHtml);
        
        // Model Name
        let modelName = $('.block-title').first().text().replace(/Detail|Size|Color Chart|RIG|関連コラム/g, '').trim();
        if (!modelName) modelName = $('h1').text().trim() || $('h2').first().text().trim();
        
        // Main Image
        let mainImage = '';
        $('#page-content img').each((i, el) => {
            const src = $(el).attr('src');
            if (src && !src.includes('dummy') && !src.includes('logo') && !src.includes('banner')) {
                mainImage = src;
                return false; // Break
            }
        });
        if (mainImage && !mainImage.startsWith('http')) mainImage = BASE_URL + mainImage;
        
        // Description
        let description = '';
        $('#page-content div.b_text, #page-content div.text').each((i, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text.length > 50 && !text.includes('価格') && !text.includes('重量')) {
                description = text;
                return false; // Break
            }
        });
        
        // Helper to convert full-width numbers/letters to half-width
        const toHalfWidth = (str) => {
            if (!str) return '';
            return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/．/g, '.').replace(/”/g, '"');
        };

        // Parse Sizes
        const variants = [];
        $('#page-content h3.record-title, #page-content h4.record-title').each((i, el) => {
            const titleText = $(el).text().trim();
            if (titleText.includes('"') || titleText.includes('入り') || titleText.includes('oz') || titleText.includes('インチ') || titleText.includes('g') || titleText.includes('サイズ')) {
                const recordText = $(el).closest('.record').text().replace(/\s+/g, ' ');
                
                // Try to extract size, qty, weight, hook, price
                // e.g. 2.5"（ １０尾入り／パック ）１尾重量：１.３ｇ推奨フックサイズ：オフセットワームフック ＃４価格：620円
                const sizeMatch = recordText.match(/^([^（(]+)(?:（|\(|入り|重量)/);
                const qtyMatch = recordText.match(/[（\(]\s*([0-9０-９]+)\s*[尾個]入り/);
                const weightMatch = recordText.match(/重量：([^推価]+)/) || recordText.match(/([0-9０-９\.\/]+(?:g|oz))/i);
                const priceMatch = recordText.match(/価格：([0-9,]+)円/);

                let size = sizeMatch ? sizeMatch[1].trim() : titleText;
                if (size.includes('尾入り') || size.includes('重量')) size = titleText.split('（')[0].trim();
                
                const variant = {
                    size: toHalfWidth(size),
                    quantity: qtyMatch ? toHalfWidth(qtyMatch[1]) : '',
                    weight: weightMatch ? toHalfWidth(weightMatch[1].trim()) : '',
                    price: priceMatch ? priceMatch[1].replace(/,/g, '') : '',
                    color: ''
                };
                
                // Only push if it has at least some valid spec (weight, price, or qty)
                // or if the size explicitly has inches/oz/g
                if (variant.weight || variant.price || variant.quantity || /[0-9]+(?:"|oz|g|cm|mm)/i.test(variant.size)) {
                    variants.push(variant);
                }
            }
        });
        
        // If the regex didn't catch sizes (e.g. for jigs or different format), just add a generic variant
        if (variants.length === 0) {
            variants.push({
                sku: modelName,
                size: '',
                weight: '',
                price: '',
                color: ''
            });
        }
        
        // Try to get colors
        const colors = [];
        // Look for texts after Color Chart
        const colorRegex = /([0-9A-Za-z]+)：([^※\s]+)/g;
        // Just extract basic color names if possible, but Keitech colors are complex. 
        // For now, we attach colors to the variants or just keep the variants as sizes.
        // In GearSage, usually we need Size x Color combinations, but if colors are many, 
        // we might just generate Size variants. The user can enrich colors later.
        
        // Download image if available
        let localImagePath = '';
        if (mainImage) {
            const filename = path.basename(new URL(mainImage).pathname);
            localImagePath = await downloadImage(mainImage, filename);
            console.log(`Downloaded image: ${localImagePath}`);
        }

        const product = {
            brand: 'KEITECH',
            category: prod.category,
            model: modelName,
            model_cn: modelName,
            source_url: prod.url,
            main_image_url: mainImage,
            local_image_path: localImagePath,
            description: description,
            variants: variants,
            scraped_at: new Date().toISOString()
        };

        // Map type_tips, water_column, action based on category
        if (prod.category.includes('swin baits') || prod.category.includes('swim baits')) {
            product.type_tips = 'swimbait';
            product.water_column = 'Variable';
            product.action = 'wobble_roll';
        } else if (prod.category.includes('soft baits')) {
            product.type_tips = 'worm';
            product.water_column = 'Variable';
            product.action = 'variable';
        } else if (prod.category.includes('wire baits')) {
            product.type_tips = 'spinnerbait'; // Assuming mostly spinnerbaits, could also be buzzbait
            product.water_column = 'Variable';
            product.action = 'spin_flash';
        } else if (prod.category.includes('rubber jigs')) {
            product.type_tips = 'rubber_jig';
            product.water_column = 'Bottom';
            product.action = 'flutter_fall';
        } else {
            product.type_tips = 'worm';
            product.water_column = 'Variable';
            product.action = 'variable';
        }

        results.push(product);
        
        // Optional: slight delay to be polite
        await new Promise(r => setTimeout(r, 500));
    }
    
    // 3. Save to JSON
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
    
    console.log(`\nScraping complete. Data saved to ${OUTPUT_PATH}`);
}

scrapeKeitech();
