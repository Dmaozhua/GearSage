import json
import os
import re
import time
import urllib.parse
import sys
from pathlib import Path
from bs4 import BeautifulSoup
from curl_cffi import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from gear_data_paths import DATA_RAW_DIR

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_DIR = str(DATA_RAW_DIR)
OUTPUT_FILE = os.path.join(DATA_DIR, "shimano_line_normalized.json")

def scrape_shimano_lines():
    urls_file = os.path.join(os.path.dirname(__file__), "shimano_line_urls.json")
    with open(urls_file, "r", encoding="utf-8") as f:
        detail_urls = json.load(f)
    print(f"Loaded {len(detail_urls)} URLs from {urls_file}")
    
    # Load existing to skip
    existing_urls = set()
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
            for item in existing_data:
                existing_urls.add(item.get("url"))
            results = existing_data
    else:
        results = []

    # We will process all detail URLs
    # test_urls = detail_urls[:5] # uncomment for small test
    test_urls = detail_urls # 全量抓取 59 款

    
    for url in test_urls:
        if url in existing_urls:
            continue
            
        print(f"\nScraping detail: {url}")
        try:
            r = requests.get(url, impersonate="chrome")
            if r.status_code != 200:
                print(f"Failed to fetch {url}, status: {r.status_code}")
                continue
                
            page_soup = BeautifulSoup(r.text, 'html.parser')
            
            # Extract basic info
            title_el = page_soup.find('h1')
            title = title_el.get_text(strip=True) if title_el else "Unknown Model"
            
            desc_el = page_soup.select_one('.cmp-text')
            desc = desc_el.get_text(strip=True) if desc_el else ""
            
            main_img = None
            for img in page_soup.find_all('img'):
                if 'main' in img.get('src', ''):
                    main_img = img.get('src')
                    break
                    
            if main_img and not main_img.startswith('http'):
                main_img = urllib.parse.urljoin("https://fish.shimano.com", main_img)
            
            # Find the spec table
            table = page_soup.find('table')
            variants = []
            
            if table:
                headers = [th.get_text(strip=True) for th in table.find_all('th')]
                rows = table.find_all('tr')
                
                # Assuming row 0 is headers
                for row in rows[1:]:
                    cells = [td.get_text(strip=True) for td in row.find_all(['td', 'th'])]
                    if len(cells) == len(headers):
                        raw_specs = {}
                        for h, c in zip(headers, cells):
                            # Normalize brackets for easier matching
                            norm_h = h.replace('（', '(').replace('）', ')').replace(' ', '').lower()
                            raw_specs[norm_h] = c
                            
                        # Extract standard fields
                        variant_name = raw_specs.get('型号', '')
                        
                        # Nylon/PE/Fluoro have slightly different headers
                        variant_data = {
                            "variant_name": f"{title} {raw_specs.get('型号', '')}".strip(),
                            "specs": {
                                "color": raw_specs.get('颜色', ''),
                                "length_m": raw_specs.get('全长(m)', ''),
                                "size_no": raw_specs.get('号数', ''),
                                "max_strength_lb": raw_specs.get('最大强度(lb)', ''),
                                "max_strength_kg": raw_specs.get('最大强度(kg)', ''),
                                "avg_strength_lb": raw_specs.get('平均强度(lb)', ''),
                                "avg_strength_kg": raw_specs.get('平均强度(kg)', ''),
                                "price": raw_specs.get('市场参考价', ''),
                                "product_code": raw_specs.get('商品编码', '')
                            },
                            "raw_specs": dict(zip(headers, cells))
                        }
                        variants.append(variant_data)
            
            # Determine line type from URL
            line_type = ""
            if "/peline/" in url:
                line_type = "PE"
            elif "/nylonline/" in url:
                line_type = "Nylon"
            elif "/fluoroline/" in url:
                line_type = "Fluorocarbon"
            elif "/esterline/" in url:
                line_type = "Ester"

            record = {
                "brand": "shimano",
                "kind": "line",
                "line_type": line_type,
                "url": url,
                "model_name": title,
                "description": desc,
                "main_image_url": main_img,
                "variants": variants
            }
            results.append(record)
            time.sleep(1) # Be polite
            
        except Exception as e:
            print(f"Error processing {url}: {e}")
            
    # Save test output
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"\nDone! Scraped {len(test_urls)} lines. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    scrape_shimano_lines()
