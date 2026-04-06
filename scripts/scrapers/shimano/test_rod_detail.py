import json
import urllib.parse
from bs4 import BeautifulSoup
from curl_cffi import requests

def test_rod_detail(url):
    r = requests.get(url, impersonate="chrome")
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Title
    title_elem = soup.select_one('.product-detail__title')
    title = title_elem.text.strip() if title_elem else "Unknown"
    
    # Features / selling points
    features = []
    for f in soup.select('.product-detail__features li'):
        features.append(f.text.strip())
        
    print(f"Title: {title}")
    print(f"Features: {features}")
    
    # Tables
    # Shimano often has spec tables with headers like '型号', '全长(m)', '节数(根)', etc.
    tables = soup.select('table.spec-table, table.product-spec')
    if not tables:
        tables = soup.select('table')
    
    results = []
    for table in tables:
        headers = []
        for th in table.select('th'):
            headers.append(th.text.strip())
            
        rows = table.select('tbody tr')
        if not rows:
            rows = table.select('tr')
            
        for row in rows:
            cells = row.select('td')
            if not cells or len(cells) != len(headers):
                continue
                
            row_data = {}
            for i, cell in enumerate(cells):
                row_data[headers[i]] = cell.text.strip()
            results.append(row_data)
            
    print(json.dumps(results[:2], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    with open("scripts/scrapers/shimano/shimano_bass_rod_urls.json", "r") as f:
        urls = json.load(f)
    test_rod_detail(urls[0])
