const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://keitech.co.jp/pages/628/').then(res => {
    const $ = cheerio.load(res.data);
    $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('dummy') && !src.includes('logo')) {
            console.log(src);
        }
    });
});
