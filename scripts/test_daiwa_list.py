from scrapling import Fetcher

def main():
    fetcher = Fetcher()
    page = fetcher.get("https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AA%E3%83%BC%E3%83%AB")
    print("Filters:")
    for label in page.css("label"):
        print("".join(label.css("::text").getall()).strip())
    print("Links:")
    for a in page.css("a"):
        href = a.attrib.get('href', '')
        if 'category2' in href:
            print("".join(a.css("::text").getall()).strip(), href)

main()
