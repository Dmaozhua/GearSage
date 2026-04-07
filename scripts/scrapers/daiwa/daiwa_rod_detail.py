import os
import json
import re
from curl_cffi import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()

def process_url(i, url, total):
    print(f"[{i+1}/{total}] Fetching: {url}")
    try:
        r = requests.get(url, impersonate="chrome", timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Model Name
        h1 = soup.select_one("h1")
        model_name = h1.get_text(strip=True) if h1 else ""
        if not model_name:
            print(f"  [{i+1}] Skipping, no model name found.")
            return None
            
        # Main image
        main_image_url = ""
        main_img_tag = soup.select_one(".product-detail-visual img") or soup.select_one("meta[property='og:image']")
        if main_img_tag:
            if main_img_tag.name == 'meta':
                main_image_url = main_img_tag.get('content', '')
            else:
                main_image_url = main_img_tag.get('src', '')
        
        if main_image_url and not main_image_url.startswith('http'):
            import urllib.parse
            main_image_url = urllib.parse.urljoin("https://www.daiwa.com", main_image_url)
            
        # Local image path logic
        local_image_path = ""
        if main_image_url:
            match = re.search(r'([a-zA-Z0-9_-]+\.(jpg|png|jpeg|webp))', main_image_url, re.IGNORECASE)
            if match:
                filename = match.group(1)
            else:
                filename = main_image_url.split('/')[-1].split('?')[0]
            local_image_path = f"images/daiwa_rods/{sanitize_filename(model_name)}_{filename}"
        
        variants = []
        
        # Find the spec table
        tables = soup.select("table")
        spec_table = None
        for t in tables:
            tr0 = t.select("tr")
            if not tr0:
                continue
            headers = [th.get_text(strip=True) for th in tr0[0].select("th, td")]
            # Look for both Item and Length to ensure it's the right table
            if any("アイテム" in h for h in headers) and any("全長" in h for h in headers):
                spec_table = t
                break
                
        if spec_table:
            headers = [th.get_text(strip=True) for th in spec_table.select("tr")[0].select("th, td")]
            
            for tr in spec_table.select("tr")[1:]:
                cells = [td.get_text(strip=True) for td in tr.select("td, th")]
                if len(cells) != len(headers):
                    continue
                    
                specs = dict(zip(headers, cells))
                
                item_name = specs.get('アイテム', '')
                if not item_name:
                    continue
                    
                variants.append({
                    "variant_name": item_name,
                    "raw_specs": specs
                })
        
        return {
            "model_name": model_name,
            "url": url,
            "main_image_url": main_image_url,
            "local_image_path": local_image_path,
            "variants": variants
        }
        
    except Exception as e:
        print(f"  [{i+1}] Error: {e}")
        return None

def scrape_daiwa_rods():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    urls_file = os.path.join(base_dir, "../../../../GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_urls.json")
    
    if not os.path.exists(urls_file):
        print(f"Error: {urls_file} not found.")
        return
        
    with open(urls_file, "r", encoding="utf-8") as f:
        test_urls = json.load(f)
        
    results = []
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_url, i, url, len(test_urls)): i for i, url in enumerate(test_urls)}
        for future in as_completed(futures):
            res = future.result()
            if res:
                results.append(res)
            
    out_path = os.path.join(base_dir, "../../../../GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_normalized.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"\nDone! Scraped {len(results)} Daiwa rods. Saved to {out_path}")

if __name__ == "__main__":
    scrape_daiwa_rods()
