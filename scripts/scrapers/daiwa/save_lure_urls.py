import os
import json
import urllib.parse
from bs4 import BeautifulSoup
from curl_cffi import requests
import time
import random

def scrape_daiwa_lure_urls():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(base_dir, exist_ok=True)
    
    categories = [
        "%E3%83%90%E3%82%B9", # Bass
        "%E3%83%8D%E3%82%A4%E3%83%86%E3%82%A3%E3%83%96%E3%83%88%E3%83%A9%E3%82%A6%E3%83%88%EF%BC%88%E8%87%AA%E7%84%B6%E6%B8%93%E6%B5%81%EF%BC%89", # Native Trout
        "%E3%82%A8%E3%83%AA%E3%82%A2%E3%83%88%E3%83%A9%E3%82%A6%E3%83%88" # Area Trout
    ]
    
    all_urls = []
    
    for cat in categories:
        page = 1
        while True:
            url = f"https://www.daiwa.com/jp/product/productlist?category1=%E3%83%AB%E3%82%A2%E3%83%BC&page={page}&category2={cat}&search=1"
            print(f"Fetching: {url}")
            
            try:
                r = requests.get(url, impersonate="chrome")
                soup = BeautifulSoup(r.text, 'html.parser')
                
                # Look for standard links
                links = soup.select('a')
                new_found = 0
                for a in links:
                    href = a.get('href')
                    if href and href.startswith('/jp/product/') and href != '/jp/product/' and 'productlist' not in href:
                        full_url = urllib.parse.urljoin("https://www.daiwa.com", href)
                        if full_url not in all_urls:
                            all_urls.append(full_url)
                            new_found += 1
                
                print(f"  Found {new_found} new URLs on page {page}")
                if new_found == 0:
                    break
                
                page += 1
                time.sleep(random.uniform(1, 2))
            except Exception as e:
                print(f"Error fetching {url}: {e}")
                break
            
    urls_file = os.path.join(base_dir, "daiwa_lure_urls.json")
    with open(urls_file, "w", encoding="utf-8") as f:
        json.dump(all_urls, f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(all_urls)} URLs to {urls_file}")

if __name__ == "__main__":
    scrape_daiwa_lure_urls()