const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/yamamoto_lure_normalized.json');
const IMAGE_DIR = path.join(__dirname, '../GearSage-client/pkgGear/images/lure/YAMAMOTO');

if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Categories mapped to our standard
const CATEGORY_MAP = {
    'fuzzy-series': { system: 'soft', type_tips: 'weightless_soft_bait', water_column: 'Variable', action: 'worm' },
    'senkos': { system: 'soft', type_tips: 'weightless_soft_bait', water_column: 'Variable', action: 'worm' },
    'worms': { system: 'soft', type_tips: 'weightless_soft_bait', water_column: 'Bottom', action: 'worm' },
    'grubs': { system: 'soft', type_tips: 'weightless_soft_bait', water_column: 'Subsurface (0–0.5m)', action: 'wobble_roll' },
    'craws-and-creature': { system: 'soft', type_tips: 'weightless_soft_bait', water_column: 'Bottom', action: 'crawl_creature' },
    'swim-baits': { system: 'soft', type_tips: 'swimbait', water_column: 'Variable', action: 'wobble_roll' },
};

const BASE_URL = 'https://www.yamamotobaits.com';

async function downloadImage(url, filename) {
    if (!url) return '';
    try {
        const filepath = path.join(IMAGE_DIR, filename);
        if (fs.existsSync(filepath)) {
            return `pkgGear/images/lure/YAMAMOTO/${filename}`;
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
            writer.on('finish', () => resolve(`pkgGear/images/lure/YAMAMOTO/${filename}`));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download image ${url}: ${error.message}`);
        return '';
    }
}

async function getProductLinks(category) {
    const url = `${BASE_URL}/${category}/`;
    console.log(`Fetching category: ${category}...`);
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(data);
        const links = [];
        
        // Find product links using BigCommerce product title selector or generic product anchor
        $('.bc-product__title-link, .product a, article a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/products/')) {
                if (href.startsWith('http')) {
                    links.push(href);
                } else {
                    links.push(`${BASE_URL}${href}`);
                }
            }
        });
        
        return [...new Set(links)]; // remove duplicates
    } catch (error) {
        console.error(`Error fetching category ${category}: ${error.message}`);
        return [];
    }
}

function parseLengthWeightAndPack(str) {
    let size = '', weight = '', qty = '';
    str = str || '';
    
    // Extract quantity (e.g. "8pk", "10 pk", "5 pack")
    const qtyMatch = str.match(/(\d+)\s*(?:pk|pack|pcs|pc)/i);
    if (qtyMatch) qty = qtyMatch[1];
    
    // Extract size (e.g. 2.7", 4", 5.5")
    const sizeMatch = str.match(/([\d\.]+)\s*(?:"|in|inch|inches)/i);
    if (sizeMatch) size = sizeMatch[1];
    
    // Extract weight if any (e.g. 3/8oz, 1/2 oz)
    const weightMatch = str.match(/([\d\.\/]+)\s*(?:oz|g)/i);
    if (weightMatch) weight = weightMatch[1];
    
    return { size, weight, qty };
}

function decodeHtml(html) {
    return html.replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&');
}

async function scrapeProduct(url, catConfig) {
    console.log(`Scraping product: ${url}`);
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(data);
        
        const title = $('.bc-product-single__title, .bc-product__title, h1').first().text().trim();
        if (!title) return null;
        
        const descriptionHtml = $('.suma-post-content, .bc-product__description, .product-description, #tab-description').html() || '';
        const description = cheerio.load(descriptionHtml).text().replace(/\s+/g, ' ').trim();
        
        let mainImageUrl = $('.bc-product__gallery-image img').attr('src') || $('meta[property="og:image"]').attr('content') || '';
        
        // Get variations data from data-variants attribute
        let variants = [];
        const variantDataAttr = $('[data-variants]').attr('data-variants');
        
        if (variantDataAttr) {
            try {
                const decodedJson = decodeHtml(variantDataAttr);
                const parsedVariants = JSON.parse(decodedJson);
                
                parsedVariants.forEach(v => {
                    let sizeLabel = '', colorLabel = '';
                    if (v.options) {
                        v.options.forEach(opt => {
                            const optName = (opt.option_display_name || '').toLowerCase();
                            if (optName.includes('size') || optName.includes('length') || optName.includes('weight')) {
                                sizeLabel = opt.label;
                            } else if (optName.includes('color')) {
                                colorLabel = opt.label;
                            }
                        });
                    }
                    
                    const { size, weight, qty } = parseLengthWeightAndPack(sizeLabel || title);
                    
                    // We might not want to create a variant for every single color unless necessary, 
                    // but we'll collect the unique sizes as variants.
                    
                    variants.push({
                        sku: v.sku || '',
                        color: colorLabel,
                        size_raw: sizeLabel,
                        length: size,
                        weight: weight,
                        quantity: qty,
                        price: v.price || '',
                        image: v.image ? v.image.url : ''
                    });
                });
            } catch (e) {
                console.log('Error parsing data-variants', e.message);
            }
        }
        
        // Filter to unique sizes for variants (we don't want 50 colors as 50 rows in the detail table)
        const uniqueVariants = [];
        const seenSizes = new Set();
        
        variants.forEach(v => {
            const key = `${v.size_raw}`;
            if (!seenSizes.has(key)) {
                seenSizes.add(key);
                uniqueVariants.push(v);
            }
        });
        
        if (uniqueVariants.length === 0) {
            // Fallback if no variants found
            const { size, weight, qty } = parseLengthWeightAndPack(title);
            uniqueVariants.push({
                sku: '',
                color: '',
                size_raw: '',
                length: size,
                weight: weight,
                quantity: qty,
                price: $('.bc-product__pricing').text().replace(/\s+/g, '').replace(/[^\d\.]/g, ''),
                image: ''
            });
        }
        
        // Download main image
        let localImagePath = '';
        if (mainImageUrl) {
            // Remove query params from image url
            mainImageUrl = mainImageUrl.split('?')[0];
            const filename = `yamamoto_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
            localImagePath = await downloadImage(mainImageUrl, filename);
        }
        
        return {
            brand: 'Gary Yamamoto',
            name: title,
            source_url: url,
            description: description,
            main_image_url: mainImageUrl,
            local_image_path: localImagePath,
            system: catConfig.system,
            type_tips: catConfig.type_tips,
            water_column: catConfig.water_column,
            action: catConfig.action,
            variants: uniqueVariants,
            scraped_at: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`Error scraping ${url}: ${error.message}`);
        return null;
    }
}

async function main() {
    const allData = [];
    
    for (const [category, config] of Object.entries(CATEGORY_MAP)) {
        const links = await getProductLinks(category);
        console.log(`Found ${links.length} products in ${category}`);
        
        for (const link of links) {
            // delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000));
            const productData = await scrapeProduct(link, config);
            if (productData) {
                allData.push(productData);
            }
        }
    }
    
    console.log(`Scraped ${allData.length} products total.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`Data saved to ${OUTPUT_FILE}`);
}

main();