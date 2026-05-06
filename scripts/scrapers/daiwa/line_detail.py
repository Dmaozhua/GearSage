import json
import os
import re
import time
import concurrent.futures
import sys
from pathlib import Path
from curl_cffi import requests
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from gear_data_paths import DATA_RAW_DIR

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_DIR = str(DATA_RAW_DIR)
INPUT_FILE = os.path.join(DATA_DIR, "daiwa_line_urls.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "daiwa_line_normalized.json")

def sanitize_filename(name):
    # Remove invalid characters for filenames
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()

def extract_main_image(soup):
    images = soup.select('.product-detail-visual img, meta[property="og:image"]')
    for img in images:
        src = img.get('src') or img.get('content')
        if src and not src.endswith('.svg') and not 'no-image' in src.lower():
            if src.startswith('//'):
                src = 'https:' + src
            elif src.startswith('/'):
                src = 'https://www.daiwa.com' + src
            return src
    return ""

def process_url(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print(f"Fetching: {url}")
    try:
        response = requests.get(url, headers=headers, impersonate="chrome", timeout=15)
        if response.status_code != 200:
            print(f"Error {response.status_code} fetching {url}")
            return None
    except Exception as e:
        print(f"Request failed for {url}: {e}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Model name
    model_name_elem = soup.select_one('.product-detail-info__name, h1')
    if not model_name_elem:
        return None
    model_name = model_name_elem.get_text(separator=' ', strip=True)
    # clean up Japanese part and English part if they are concatenated
    # usually Daiwa has something like "UVF MORETHAN SENSOR 12 BRAID EX+SiUVF モアザンセンサー12ブレイドEX＋Si"
    
    # Description
    desc_elem = soup.select_one('.product-detail-info__description')
    if desc_elem:
        description = desc_elem.get_text(separator='\n', strip=True)
    else:
        # Fallback to meta description
        meta_desc = soup.select_one('meta[name="description"]') or soup.select_one('meta[property="og:description"]')
        description = meta_desc.get('content', '').strip() if meta_desc else ""
    
    # Image
    main_image_url = extract_main_image(soup)
    local_image_path = ""
    if main_image_url:
        filename = main_image_url.split('/')[-1].split('?')[0]
        local_image_path = f"images/daiwa_lines/{sanitize_filename(model_name)}_{filename}"

    # Determine line_type
    # Prioritize explicit type naming in model_name
    title_upper = model_name.upper()
    line_type = ""
    
    if re.search(r'(?<![A-Z])PE(?![A-Z])', title_upper) or "ブレイド" in title_upper or "BRAID" in title_upper:
        line_type = "PE"
    elif "フロロ" in title_upper or "FLUORO" in title_upper:
        line_type = "Fluorocarbon"
    elif "ナイロン" in title_upper or "NYLON" in title_upper:
        line_type = "Nylon"
    elif "エステル" in title_upper or "ESTER" in title_upper:
        line_type = "Ester"
    else:
        # Fallback to description
        desc_upper = description.upper()
        if re.search(r'(?<![A-Z])PE(?![A-Z])', desc_upper) or "ブレイド" in desc_upper or "BRAID" in desc_upper:
            line_type = "PE"
        elif "フロロ" in desc_upper or "FLUORO" in desc_upper:
            line_type = "Fluorocarbon"
        elif "ナイロン" in desc_upper or "NYLON" in desc_upper:
            line_type = "Nylon"
        elif "エステル" in desc_upper or "ESTER" in desc_upper:
            line_type = "Ester"

    variants = []
    
    tables = soup.select("table")
    for t in tables:
        rows = t.select("tr")
        if len(rows) < 2:
            continue
            
        headers = [th.get_text(strip=True) for th in rows[0].select("th, td")]
        # Ensure it's a spec table by checking for common headers
        if not any(h in ["アイテム", "号数", "強力（lb）", "巻糸量（m）", "JAN", "カラー"] for h in headers):
            continue
            
        for tr in rows[1:]:
            cells = [td.get_text(strip=True) for td in tr.select("td, th")]
            # Sometimes there are colspan/rowspan issues, skip rows that don't match header length
            if len(cells) != len(headers):
                continue
                
            specs = dict(zip(headers, cells))
            
            variant_name = specs.get("アイテム", specs.get("号数", ""))
            if not variant_name:
                continue
                
            # Try to map fields
            color = specs.get("カラー", "")
            length_m = specs.get("巻糸量（m）", specs.get("巻糸量(m)", specs.get("糸巻量（m）", "")))
            size_no = specs.get("号数", specs.get("参考（号）", specs.get("号", "")))
            max_lb = specs.get("強力（lb）", specs.get("強力（lb.）", specs.get("強力(lb)", "")))
            max_kg = specs.get("強力（kg）", specs.get("強力(kg)", ""))
            price = specs.get("メーカー希望本体価格（円）", specs.get("価格（円）", ""))
            jan = specs.get("JAN", specs.get("JANコード", ""))
            
            # Clean up variant name if it has \u3000
            variant_name = variant_name.replace('\u3000', ' ')
            
            variants.append({
                "variant_name": variant_name,
                "specs": {
                    "color": color,
                    "length_m": length_m,
                    "size_no": size_no,
                    "max_strength_lb": max_lb,
                    "max_strength_kg": max_kg,
                    "avg_strength_lb": "",
                    "avg_strength_kg": "",
                    "price": price,
                    "product_code": jan
                },
                "raw_specs": specs
            })

    return {
        "brand": "daiwa",
        "kind": "line",
        "line_type": line_type,
        "url": url,
        "model_name": model_name,
        "description": description,
        "main_image_url": main_image_url,
        "local_image_path": local_image_path,
        "variants": variants
    }

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Input file not found: {INPUT_FILE}")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        urls = json.load(f)

    # Filter out empty URLs
    urls = [u for u in urls if len(u.strip()) > 35] # https://www.daiwa.com/jp/product/...
    print(f"Loaded {len(urls)} valid URLs to scrape.")
    
    # Test with 10 URLs first
    # test_urls = urls[:10]
    # For full scrape
    test_urls = urls
    
    results = []
    
    # Using ThreadPoolExecutor for parallel requests
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_url = {executor.submit(process_url, url): url for url in test_urls}
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            try:
                data = future.result()
                if data:
                    results.append(data)
            except Exception as exc:
                print(f"{url} generated an exception: {exc}")

    print(f"Successfully scraped {len(results)} items.")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
