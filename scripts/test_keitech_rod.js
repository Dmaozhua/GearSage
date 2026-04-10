const axios = require('axios');
const cheerio = require('cheerio');

async function test(url) {
    try {
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        
        console.log('---', url, '---');
        console.log('Title:', $('title').text());
        
        // Let's find specs tables
        $('table').each((i, table) => {
            console.log('Table', i);
            $(table).find('tr').each((j, tr) => {
                const row = [];
                $(tr).find('th, td').each((k, td) => {
                    row.push($(td).text().trim().replace(/\s+/g, ' '));
                });
                console.log('  Row:', row.join(' | '));
            });
        });

    } catch(e) {
        console.error(e.message);
    }
}
async function run() {
    await test('https://keitech.co.jp/pages/629/');
    await test('https://keitech.co.jp/pages/600/');
    await test('https://keitech.co.jp/pages/589/');
}
run();