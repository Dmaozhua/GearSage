const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

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
        let mainImage = $('.b_image img').first().attr('src') || $('img').first().attr('src');
        if (mainImage && !mainImage.startsWith('http')) mainImage = BASE_URL + mainImage;
        
        // Description
        const description = $('.b_text').first().text().replace(/\s+/g, ' ').trim();
        
        // Parse Sizes
        const variants = [];
        const sizesText = $('#page-content').text().replace(/\s+/g, ' ');
        
        // Simple regex to find patterns like: 2"（１２尾入り／パック）１尾重量：０.９g推奨フックサイズ：オフセットワームフック #６価格：620円
        // Or for jigs: 重量：3/8oz.
        const sizeRegex = /([0-9\.]+(?:"|oz|g|cm|mm))[^0-9]*(?:（([^）]+)）)?[^重]*重量：([0-9\.a-zA-Z\/]+)[^推]*推奨フックサイズ：([^価]+)?価格：([0-9,]+)円/g;
        
        let match;
        let foundVariants = false;
        while ((match = sizeRegex.exec(sizesText)) !== null) {
            foundVariants = true;
            variants.push({
                size: match[1].trim(),
                quantity: match[2] ? match[2].trim() : '',
                weight: match[3].trim(),
                hook_size: match[4] ? match[4].trim() : '',
                price: match[5].trim(),
                color: '' // Colors are usually separate, we'll leave it blank or just use one generic variant per size
            });
        }
        
        // If the regex didn't catch sizes (e.g. for jigs or different format), just add a generic variant
        if (!foundVariants) {
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
        
        results.push({
            brand: 'KEITECH',
            category: prod.category,
            model: modelName,
            model_cn: modelName,
            source_url: prod.url,
            main_image_url: mainImage,
            description: description,
            variants: variants,
            scraped_at: new Date().toISOString()
        });
        
        // Optional: slight delay to be polite
        await new Promise(r => setTimeout(r, 500));
    }
    
    // 3. Save to JSON
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
    
    console.log(`\nScraping complete. Data saved to ${OUTPUT_PATH}`);
}

scrapeKeitech();
