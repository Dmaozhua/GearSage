const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.megabass.co.jp';

async function fetchHtml(url) {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        return data;
    } catch (e) {
        console.error(`Error fetching ${url}:`, e.message);
        return null;
    }
}

async function scrapeMegabassReel() {
    console.log("Fetching main page...");
    const html = await fetchHtml('https://www.megabass.co.jp/site/freshwaterlist/');
    if (!html) return;
    
    const $ = cheerio.load(html);
    const categoryLinks = [];
    $('.category_home__category__list.__reel a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && !href.includes('custom_parts')) { // Skip custom parts
            categoryLinks.push(href);
        }
    });
    
    console.log("Found categories:", categoryLinks);
    
    let productUrls = new Set();
    for (const catUrl of categoryLinks) {
        console.log(`Fetching category: ${catUrl}`);
        const catHtml = await fetchHtml(catUrl);
        if (!catHtml) continue;
        const $cat = cheerio.load(catHtml);
        $cat('a').each((i, el) => {
            const href = $cat(el).attr('href');
            if (href && href.includes('/products/') && !href.includes('/category/') && !href.includes('custom_parts')) {
                productUrls.add(href.startsWith('http') ? href : BASE_URL + href);
            }
        });
    }
    
    productUrls = Array.from(productUrls);
    console.log(`Found ${productUrls.length} products. Extracting details...`);
    
    const results = [];
    
    for (let i = 0; i < productUrls.length; i++) {
        const url = productUrls[i];
        console.log(`[${i+1}/${productUrls.length}] Scraping ${url}`);
        const prodHtml = await fetchHtml(url);
        if (!prodHtml) continue;
        const $p = cheerio.load(prodHtml);
        
        const modelName = $p('h1.page_products__title, h1.product__title, .item-title, h1').first().text().trim() || url.split('/').filter(Boolean).pop();
        let mainImage = $p('.page_products__slider__block img, .product__slider__main img, .item-image img, .main-image img').first().attr('src');
        if (!mainImage) {
            mainImage = $p('meta[property="og:image"]').attr('content');
        }
        if (mainImage && !mainImage.startsWith('http')) mainImage = BASE_URL + mainImage;
        
        const specs = {};
        
        // Handle new dl format
        $p('.page_products__spec__table__row').each((j, el) => {
            const key = $p(el).find('.page_products__spec__table__th span').text().trim().toLowerCase();
            const val = $p(el).find('.page_products__spec__table__td span').text().trim();
            if (key && val) specs[key] = val;
        });
        
        // Handle old table format
        $p('.product__spec__table tr, .spec-table tr, table tr').each((j, el) => {
            const key = $p(el).find('th').text().trim().toLowerCase();
            const val = $p(el).find('td').text().trim();
            if (key && val && !specs[key]) specs[key] = val;
        });
        
        let typeTips = url.includes('spinning') ? 'spinning' : 'baitcasting';
        
        const productData = {
            brand: 'MEGABASS',
            kind: 'reel',
            model: modelName,
            source_url: url,
            main_image_url: mainImage || '',
            variants: [
                {
                    name: modelName,
                    specs: specs
                }
            ],
            scraped_at: new Date().toISOString()
        };
        
        // Sometimes they have multiple variants in a table
        const variantRows = $p('.product__variation__table tr, .variation-table tr').slice(1); // skip header
        if (variantRows.length > 0) {
            const headers = [];
            $p('.product__variation__table th, .variation-table th').each((j, el) => {
                headers.push($p(el).text().trim().toLowerCase());
            });
            const variants = [];
            variantRows.each((j, el) => {
                const tds = $p(el).find('td');
                const vSpecs = { ...specs };
                let vName = modelName;
                tds.each((k, td) => {
                    const h = headers[k];
                    const v = $p(td).text().trim();
                    if (h === 'model' || h === 'item' || h === 'name') vName = v;
                    else vSpecs[h] = v;
                });
                variants.push({
                    name: vName,
                    specs: vSpecs
                });
            });
            if (variants.length > 0) {
                productData.variants = variants;
            }
        }
        
        results.push(productData);
    }
    
    const outPath = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/megabass_reel_normalized.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`Saved ${results.length} items to ${outPath}`);
}

scrapeMegabassReel().catch(console.error);
