import json
import os
import urllib.parse
import re
from bs4 import BeautifulSoup
from curl_cffi import requests

def save_shimano_lure_urls():
    base_dir = os.path.dirname(__file__)
    
    url = "https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnLure&pcat2=cg2SHIFCnLureFreshwater&pcat3=&pcat4=&fs=&series=&price_min=&price_max="
    
    categories = [
        "cg2SHIFCnLureFreshwater",
        "cg2SHIFCnLureTrout"
    ]
    
    urls = []
    
    for pcat2 in categories:
        print(f"Fetching category {pcat2}...")
        for page in range(1, 10):
            paged_url = f"https://fish.shimano.com/zh-CN/product/list.html?pcat2={pcat2}&pcat1=cg1SHIFCnLure&pcat3=&pcat4=&fs=&series=&price_min=&price_max=&page={page}"
            print(f"  Fetching page {page}...")
            r = requests.get(paged_url, impersonate="chrome")
            soup = BeautifulSoup(r.text, 'html.parser')
            
            links = soup.select('a[href*="/product/lure/"]')
            found_new = False
            
            for a in links:
                href = a.get('href')
                if href and href.endswith('.html'):
                    if re.search(r'/product/lure/[a-z0-9_-]+/[a-z0-9_-]+/[a-z0-9_-]+\.html$', href) or re.search(r'/product/lure/[a-z0-9_-]+/[a-z0-9_-]+\.html$', href):
                        full_url = urllib.parse.urljoin("https://fish.shimano.com", href)
                        if full_url not in urls:
                            urls.append(full_url)
                            found_new = True
            if not found_new:
                break
                
    urls_file = os.path.join(base_dir, "shimano_lure_urls.json")
                    
    with open(urls_file, "w", encoding="utf-8") as f:
        json.dump(urls, f, indent=2)
    print(f"Saved {len(urls)} lure URLs to {urls_file}")

if __name__ == "__main__":
    save_shimano_lure_urls()
