from scrapling import Fetcher
fetcher = Fetcher()
page = fetcher.get("https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AA%E3%83%BC%E3%83%AB")
links = page.css("li a")
for a in links:
    href = a.attrib.get('href')
    if href and '/jp/product/' in href and 'productlist' not in href:
        print(href)
