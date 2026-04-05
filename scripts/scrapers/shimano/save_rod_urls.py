import json
import os
import urllib.parse
import re
from bs4 import BeautifulSoup
from curl_cffi import requests

def save_shimano_rod_urls():
    base_dir = os.path.dirname(__file__)
    
    url = "https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnRod&pcat2=cg2SHIFCnRodBass&pcat3=&pcat4=&fs=&series=&price_min=&price_max="
    r = requests.get(url, impersonate="chrome")
    soup = BeautifulSoup(r.text, 'html.parser')
    links = soup.select('a[href*="/product/rod/"]')
    
    urls = []
    for a in links:
        href = a.get('href')
        if href and href.endswith('.html'):
            # Check if it's a product detail page (e.g. a075f00004awdnkqa1.html or p-majestic.html)
            # The detail pages are always under /product/rod/bass/(bass|trout|fly)/...
            if re.search(r'/product/rod/bass/[a-z]+/[a-z0-9_]+(-[a-z0-9_]+)*\.html$', href):
                full_url = urllib.parse.urljoin("https://fish.shimano.com", href)
                if full_url not in urls:
                    urls.append(full_url)
                
    with open(os.path.join(base_dir, "shimano_bass_rod_urls.json"), "w", encoding="utf-8") as f:
        json.dump(urls, f, indent=2)
    print(f"Saved {len(urls)} bass rod URLs.")

if __name__ == "__main__":
    save_shimano_rod_urls()
