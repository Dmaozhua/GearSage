import os
import json
import re
import sys
from pathlib import Path
from curl_cffi import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from gear_data_paths import resolve_data_raw

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
            local_image_path = f"images/daiwa_lures/{sanitize_filename(model_name)}_{filename}"
        
        variants = []
        
        # Find the spec table
        tables = soup.select("table")
        spec_table = None
        for t in tables:
            headers = [th.get_text(strip=True) for th in t.select("th")]
            if any("自重" in h or "サイズ" in h or "フック" in h or "入数" in h for h in headers):
                spec_table = t
                break
                
        if spec_table:
            headers = [th.get_text(strip=True) for th in spec_table.select("tr")[0].select("th, td")]
            
            # Check for color rows vs main rows
            for tr in spec_table.select("tr")[1:]:
                cells = [td.get_text(strip=True) for td in tr.select("td, th")]
                if len(cells) != len(headers):
                    continue
                    
                specs = dict(zip(headers, cells))
                
                item_name = specs.get('アイテム', '')
                if not item_name:
                    continue
                    
                # Split color from item name if separated by ideographic space
                parts = re.split(r'[\u3000\s]+', item_name)
                color = parts[-1] if len(parts) > 1 else ""
                base_sku = parts[0]
                
                variant_name = item_name
                weight = specs.get('標準自重（g）', '') or specs.get('自重（g）', '')
                length = specs.get('サイズ（mm）', '') or specs.get('サイズ(mm)', '') or specs.get('サイズ（inch）', '') or specs.get('サイズ(inch)', '') or specs.get('サイズ', '')
                buoyancy = specs.get('タイプ', '')
                price = specs.get('メーカー希望本体価格（円）', '') or specs.get('価格（円）', '')
                jan = specs.get('JAN', '') or specs.get('JANコード', '')
                quantity = specs.get('入数', '') or specs.get('入数（本）', '') or specs.get('入数(本)', '')
                
                variants.append({
                    "variant_name": variant_name,
                    "specs": {
                        "model": base_sku,
                        "color": color,
                        "buoyancy": buoyancy,
                        "length": length,
                        "weight": weight,
                        "price": price,
                        "product_code": jan,
                        "quantity": quantity
                    }
                })
        
        return {
            "model_name": model_name,
            "url": url,
            "lure_type": "", # Determine later
            "main_image_url": main_image_url,
            "local_image_path": local_image_path,
            "variants": variants
        }
        
    except Exception as e:
        print(f"  [{i+1}] Error: {e}")
        return None

def scrape_daiwa_lures():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    urls_file = os.path.join(base_dir, "daiwa_lure_urls.json")
    
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
            
    # Output to the same directory structure
    out_path = str(resolve_data_raw("daiwa_lure_normalized.json"))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"\nDone! Scraped {len(results)} Daiwa lures. Saved to {out_path}")

if __name__ == "__main__":
    scrape_daiwa_lures()
