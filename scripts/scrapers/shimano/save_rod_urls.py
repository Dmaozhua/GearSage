import json
import os
import urllib.parse
import re
from bs4 import BeautifulSoup
from curl_cffi import requests

def save_shimano_rod_urls():
    base_dir = os.path.dirname(__file__)
    
    target_urls = [
        "https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnRod&pcat2=cg2SHIFCnRodBass&pcat3=&pcat4=&fs=&series=&price_min=&price_max=",
        "https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnRod&pcat2=cg2SHIFCnRodSW&pcat3=cg3SHIFCnRodLightGame&pcat4=&fs=&series=&price_min=&price_max=",
        "https://fish.shimano.com/zh-CN/product/list.html?pcat2=cg2SHIFCnRodSW&pcat1=cg1SHIFCnRod&pcat3=&pcat4=&fs=&series=&price_min=&price_max=&page=1"
    ]
    
    urls = []
    
    for url in target_urls:
        r = requests.get(url, impersonate="chrome")
        soup = BeautifulSoup(r.text, 'html.parser')
        links = soup.select('a[href*="/product/rod/"]')
        
        for a in links:
            href = a.get('href')
            if href and href.endswith('.html'):
                # Check if it's a product detail page under any category
                # e.g. /product/rod/bass/bass/..., /product/rod/saltwater/lightgame/...
                if re.search(r'/product/rod/[a-z]+/[a-z]+/[a-z0-9_]+(-[a-z0-9_]+)*\.html$', href):
                    full_url = urllib.parse.urljoin("https://fish.shimano.com", href)
                    if full_url not in urls:
                        urls.append(full_url)
                
    # To keep it backward compatible, we keep the same file name or merge
    urls_file = os.path.join(base_dir, "shimano_bass_rod_urls.json")
    if os.path.exists(urls_file):
        with open(urls_file, "r", encoding="utf-8") as f:
            existing_urls = json.load(f)
            for eu in existing_urls:
                if eu not in urls:
                    urls.append(eu)
                    
    with open(urls_file, "w", encoding="utf-8") as f:
        json.dump(urls, f, indent=2)
    print(f"Saved {len(urls)} rod URLs.")

if __name__ == "__main__":
    save_shimano_rod_urls()
