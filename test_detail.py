from scrapling import Fetcher

fetcher = Fetcher()
page = fetcher.get("https://www.daiwa.com/jp/product/adbrdfh")

print("Has HTML?", len(page.content) if hasattr(page, 'content') else "no content attr")
print("Has text?", len(page.text) if hasattr(page, 'text') else "no text attr")

tables = page.css("table")
for i, table in enumerate(tables):
    rows = table.css("tr")
    if not rows: continue
    
    headers = ["".join(th.css("::text").getall()).strip() for th in rows[0].css("th, td")]
    print(f"Table {i} headers: {headers}")

