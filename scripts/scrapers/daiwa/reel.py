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
    daiwa_reels_url = None
    
    # Find Daiwa reel URL from config
    for entry in config.get("daiwa", {}).get("entry_points", []):
        if entry.get("kind") == "reel":
            daiwa_reels_url = entry.get("url")
            break
            
    if not daiwa_reels_url:
        print("Error: Daiwa reel entry point not found in source_config.json")
        return []

    print(f"[*] Starting extraction for Daiwa Reels List: {daiwa_reels_url}")
    
    fetcher = Fetcher()
    page = fetcher.get(daiwa_reels_url)
    
    # Extract links that match the product detail pattern
    links = page.css("li a")
    product_urls = []
    
    for a in links:
        href = a.attrib.get('href')
        # Daiwa product detail pages look like /jp/product/adbrdfh
        # Exclude 'productlist' to avoid pagination or category links
        if href and '/jp/product/' in href and 'productlist' not in href:
            full_url = urljoin("https://www.daiwa.com", href)
            # Remove query params or hashes to ensure uniqueness
            clean_url = full_url.split('?')[0].split('#')[0]
            if clean_url not in product_urls:
                product_urls.append(clean_url)
                
    return product_urls

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    urls = extract_reel_urls()
    
    if urls:
        print(f"[*] Extracted {len(urls)} unique detail URLs.")
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump({"brand": "Daiwa", "kind": "reel", "total": len(urls), "urls": urls}, f, indent=2)
        print(f"[*] Saved URLs to {OUTPUT_FILE}")
    else:
        print("[!] No URLs found.")

if __name__ == "__main__":
    main()
