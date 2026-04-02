from scrapling import Fetcher

def main():
    fetcher = Fetcher()
    page1 = fetcher.get("https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AA%E3%83%BC%E3%83%AB&category2=%E3%82%B9%E3%83%94%E3%83%8B%E3%83%B3%E3%82%B0%E3%83%AA%E3%83%BC%E3%83%AB")
    print("Spinning results:", len(page1.css("li a")))
    
    page2 = fetcher.get("https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AA%E3%83%BC%E3%83%AB&category2=%E3%83%99%E3%82%A4%E3%83%88%E3%83%BB%E4%B8%A1%E8%BB%B8%E3%83%AA%E3%83%BC%E3%83%AB")
    print("Baitcasting results:", len(page2.css("li a")))

main()
