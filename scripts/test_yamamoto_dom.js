const fs = require('fs');
const cheerio = require('cheerio');

const data = fs.readFileSync('test_product.html', 'utf8');
const $ = cheerio.load(data);

// Let's print out all <script> contents that have JSON in them
$('script[type="application/json"]').each((i, el) => {
    console.log(`\n--- JSON Script ${i} ---`);
    console.log($(el).html().substring(0, 500));
});

$('script[type="application/ld+json"]').each((i, el) => {
    console.log(`\n--- LD+JSON Script ${i} ---`);
    console.log($(el).html().substring(0, 500));
});

// Let's check for any div with data attributes
$('*').each((i, el) => {
    const keys = Object.keys(el.attribs || {});
    keys.forEach(k => {
        if (k.startsWith('data-') && el.attribs[k].includes('{"')) {
            console.log(`\n--- Element ${el.tagName} has ${k} ---`);
            console.log(el.attribs[k].substring(0, 200));
        }
    });
});