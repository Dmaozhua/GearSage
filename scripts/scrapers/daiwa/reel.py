import json
import os
from urllib.parse import urljoin
from scrapling import Fetcher

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
CONFIG_PATH = os.path.join(BASE_DIR, "GearSage-client/pkgGear/source_config.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "GearSage-client/pkgGear/data_raw")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "daiwa_reel_urls.json")

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_reel_urls():
    config = load_config()
    
    entry_points = []
    for entry in config.get("daiwa", {}).get("entry_points", []):
        if entry.get("kind") in ["spinning", "baitcasting"]:
            entry_points.append(entry)
            
    if not entry_points:
        print("Error: Daiwa reel entry points not found in source_config.json")
        return []

    fetcher = Fetcher()
    product_urls = []
    seen_urls = set()
    
    for entry in entry_points:
        url = entry.get("url")
        kind = entry.get("kind")
        print(f"[*] Starting extraction for Daiwa {kind} Reels List: {url}")
        
        page = fetcher.get(url)
        links = page.css("li a")
        
        for a in links:
            href = a.attrib.get('href')
            if href and '/jp/product/' in href and 'productlist' not in href:
                full_url = urljoin("https://www.daiwa.com", href)
                clean_url = full_url.split('?')[0].split('#')[0]
                if clean_url not in seen_urls:
                    seen_urls.add(clean_url)
                    product_urls.append({
                        "url": clean_url,
                        "kind": kind
                    })
                
    return product_urls

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    urls = extract_reel_urls()
    
    if urls:
        print(f"[*] Extracted {len(urls)} unique detail URLs.")
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump({"brand": "Daiwa", "total": len(urls), "urls": urls}, f, indent=2)
        print(f"[*] Saved URLs to {OUTPUT_FILE}")
    else:
        print("[!] No URLs found.")

if __name__ == "__main__":
    main()
