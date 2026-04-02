from scrapling import Fetcher

def main():
    fetcher = Fetcher()
    page = fetcher.get("https://www.daiwa.com/jp/product/olqf9k0")
    tables = page.css("table")
    for table in tables:
        rows = table.css("tr")
        if not rows: continue
        headers = ["".join(th.css("::text").getall()).strip() for th in rows[0].css("th, td")]
        print("HEADERS:", headers)
        if len(rows) > 1:
            tds = ["".join(td.css("::text").getall()).strip() for td in rows[1].css("th, td")]
            print("ROW 1 TDs:", tds)
            break
main()
