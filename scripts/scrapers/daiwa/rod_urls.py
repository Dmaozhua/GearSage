import json
import os
import time
import urllib.parse
import sys
from pathlib import Path
from bs4 import BeautifulSoup
from curl_cffi import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from gear_data_paths import resolve_data_raw

all_detail_urls = []

const_urls = [
    "https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AD%E3%83%83%E3%83%89&category2=%E3%82%B7%E3%83%BC%E3%83%90%E3%82%B9&search=1",
    "https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AD%E3%83%83%E3%83%89&category2=%E3%83%90%E3%82%B9&search=1",
    "https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AD%E3%83%83%E3%83%89&category2=%E3%83%88%E3%83%A9%E3%82%A6%E3%83%88%E3%83%BB%E3%83%95%E3%83%A9%E3%82%A4&search=1",
    "https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AD%E3%83%83%E3%83%89&category2=%E3%83%A9%E3%82%A4%E3%83%88SW%E3%83%AB%E3%82%A2%E3%83%BC%EF%BC%88%E3%83%A1%E3%83%90%E3%83%AB%E3%83%BB%E3%82%A2%E3%82%B8%EF%BC%89&search=1"
]

for base_url in const_urls:
    page = 1
    while True:
        url = f"{base_url}&page={page}"
        print(f"Fetching page {page}: {url}")
        try:
            resp = requests.get(url, impersonate="chrome")
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            links = soup.select('a')
            new_found = 0
            for a in links:
                href = a.get('href')
                if href and href.startswith('/jp/product/') and href != '/jp/product/' and 'productlist' not in href:
                    full_url = urllib.parse.urljoin("https://www.daiwa.com", href)
                    if full_url not in all_detail_urls:
                        all_detail_urls.append(full_url)
                        new_found += 1
            
            print(f"  Found {new_found} new URLs.")
            if new_found == 0:
                print("No more new products found. Stopping pagination.")
                break
                
            page += 1
            time.sleep(1)
            
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")
            break

output_path = str(resolve_data_raw("daiwa_rod_urls.json"))
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_detail_urls, f, indent=2, ensure_ascii=False)

print(f"Saved {len(all_detail_urls)} urls to {output_path}")
