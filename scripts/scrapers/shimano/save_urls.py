import json
import os
import urllib.parse
from bs4 import BeautifulSoup
from curl_cffi import requests

def save_shimano_urls():
    base_dir = os.path.dirname(__file__)
    
    # Spinning
    spin_url = "https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnReel&pcat2=cg2SHIFCnReelSpinning&pcat3=&pcat4=&fs=&series=&price_min=&price_max="
    r = requests.get(spin_url, impersonate="chrome")
    soup = BeautifulSoup(r.text, 'html.parser')
    links = soup.select('a[href*="/product/reel/spinning/"]')
    spin_urls = []
    for a in links:
        href = a.get('href')
        if href and href.endswith('.html'):
            full_url = urllib.parse.urljoin("https://fish.shimano.com", href)
            if full_url not in spin_urls:
                spin_urls.append(full_url)
                
    with open(os.path.join(base_dir, "shimano_spinning_urls.json"), "w", encoding="utf-8") as f:
        json.dump(spin_urls, f, indent=2)
    print(f"Saved {len(spin_urls)} spinning URLs.")

    # Baitcasting
    bc_url = "https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnReel&pcat2=cg2SHIFCnReelBaitcasting&pcat3=&pcat4=&fs=&series=&price_min=&price_max="
    r2 = requests.get(bc_url, impersonate="chrome")
    soup2 = BeautifulSoup(r2.text, 'html.parser')
    links2 = soup2.select('a[href*="/product/reel/baitcasting/"]')
    bc_urls = []
    for a in links2:
        href = a.get('href')
        if href and href.endswith('.html'):
            full_url = urllib.parse.urljoin("https://fish.shimano.com", href)
            if full_url not in bc_urls:
                bc_urls.append(full_url)
                
    with open(os.path.join(base_dir, "shimano_baitcasting_urls.json"), "w", encoding="utf-8") as f:
        json.dump(bc_urls, f, indent=2)
    print(f"Saved {len(bc_urls)} baitcasting URLs.")

if __name__ == "__main__":
    save_shimano_urls()
