import json
import os
import urllib.parse
from bs4 import BeautifulSoup
from curl_cffi import requests

LIST_URLS = [
    "https://www.daiwa.com/jp/product/productlist?page=1&category1=%E3%83%AD%E3%83%83%E3%83%89&search=1&category2=%E3%83%A9%E3%82%A4%E3%83%88SW%E3%83%AB%E3%82%A2%E3%83%BC%EF%BC%88%E3%83%A1%E3%83%90%E3%83%AB%E3%83%BB%E3%82%A2%E3%82%B8%EF%BC%89",
    "https://www.daiwa.com/jp/product/productlist?page=1&category1=%E3%83%AD%E3%83%83%E3%83%89&search=1&category2=%E3%83%90%E3%82%B9",
    "https://www.daiwa.com/jp/product/productlist?page=1&category1=%E3%83%AD%E3%83%83%E3%83%89&search=1&category2=%E3%83%88%E3%83%A9%E3%82%A6%E3%83%88%E3%83%BB%E3%83%95%E3%83%A9%E3%82%A4"
]

all_detail_urls = []

for url in LIST_URLS:
    if len(all_detail_urls) >= 5:
        break
    try:
        resp = requests.get(url, impersonate="chrome")
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        links = soup.select('a')
        for a in links:
            href = a.get('href')
            if href and href.startswith('/jp/product/') and href != '/jp/product/' and 'productlist' not in href:
                full_url = urllib.parse.urljoin("https://www.daiwa.com", href)
                if full_url not in all_detail_urls:
                    all_detail_urls.append(full_url)
                if len(all_detail_urls) >= 5:
                    break
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")

output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_urls.json'))
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_detail_urls[:5], f, indent=2, ensure_ascii=False)

print(f"Saved {len(all_detail_urls[:5])} urls to {output_path}")
