from scrapling import Fetcher

def main():
    fetcher = Fetcher()
    page = fetcher.get("https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AA%E3%83%BC%E3%83%AB")
    for a in page.css("a"):
        text = a.css("::text").get()
        if text and "スピニングリール" in text:
            print("Spinning:", a.attrib.get("href"))
        elif text and "ベイト" in text:
            print("Baitcasting:", a.attrib.get("href"))

main()
