const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function testProduct() {
    const url = 'https://www.yamamotobaits.com/products/shibo-swimmer/';
    console.log(`\nFetching product page: ${url}...`);
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
            }
        });
        const $ = cheerio.load(data);
        
        fs.writeFileSync('test_product.html', data);
        console.log('Saved to test_product.html');
        
        const title = $('.bc-product-single__title, .bc-product__title, h1').first().text().trim();
        console.log('Title:', title);
        
        // Find variations data embedded in the DOM
        let productDataJson = null;
        
        // Check script tags for data
        $('script').each((i, el) => {
            const text = $(el).html() || '';
            if (text.includes('var bc_product =') || text.includes('var product =')) {
                console.log('Found product JS variable');
            }
        });
        
        // Let's look for form data
        const form = $('form[data-js="bc-form-cart"]');
        if (form.length) {
            const formData = form.attr('data-product');
            if (formData) {
                try {
                    const parsed = JSON.parse(formData);
                    console.log('Found data-product on form. Variants:', parsed.variants?.length);
                    if (parsed.variants && parsed.variants.length > 0) {
                        console.log('First variant:', parsed.variants[0]);
                    }
                } catch(e) {}
            }
        }
        
        // Look for bc-product-single element again, try different selectors
        const bcData = $('[data-js="bc-product-single"]').attr('data-product');
        if (bcData) {
            console.log('Found data-product on wrapper. parsing...');
            const parsed = JSON.parse(bcData);
            console.log('First variant:', parsed.variants ? parsed.variants[0] : 'None');
        }
        
    } catch (e) {
        console.error('Error fetching product:', e.message);
    }
}

testProduct();