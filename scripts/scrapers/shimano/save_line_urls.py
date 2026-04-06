import json
import os
import urllib.parse
import re
from bs4 import BeautifulSoup
from curl_cffi import requests

def save_shimano_line_urls():
    base_dir = os.path.dirname(__file__)
    
    url = "https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnLine&pcat2=&pcat3=&pcat4=&fs=&series=&price_min=&price_max="
    
    urls = []
    
    r = requests.get(url, impersonate="chrome")
    soup = BeautifulSoup(r.text, 'html.parser')
    
    links = soup.select('a[href*="/product/line/"]')
    
    for a in links:
        href = a.get('href')
        if href and href.endswith('.html'):
            if re.search(r'/product/line/[a-z]+/[a-z0-9_]+(-[a-z0-9_]+)*\.html$', href):
                full_url = urllib.parse.urljoin("https://fish.shimano.com", href)
                if full_url not in urls:
                    urls.append(full_url)
                
    urls_file = os.path.join(base_dir, "shimano_line_urls.json")
                    
    with open(urls_file, "w", encoding="utf-8") as f:
        json.dump(urls, f, indent=2)
    print(f"Saved {len(urls)} line URLs to {urls_file}")

if __name__ == "__main__":
    save_shimano_line_urls()
