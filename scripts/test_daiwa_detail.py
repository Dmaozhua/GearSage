from scrapling import Fetcher

def main():
    fetcher = Fetcher()
    page = fetcher.get("https://www.daiwa.com/jp/product/olqf9k0")
    for a in page.css(".p-breadcrumb__list-item a, .breadcrumb a, .topicpath a, .p-product-header__category"):
        print("Breadcrumb:", "".join(a.css("::text").getall()).strip())
main()
