import json
import os
import re
import time
import urllib.parse
from bs4 import BeautifulSoup
from curl_cffi import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_DIR = os.path.join(BASE_DIR, "GearSage-client/pkgGear/data_raw")
OUTPUT_FILE = os.path.join(DATA_DIR, "shimano_rod_normalized.json")

def scrape_shimano_rods():
    urls_file = os.path.join(os.path.dirname(__file__), "shimano_bass_rod_urls.json")
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
    test_urls = detail_urls

    
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
                        
                        variant_data = {
                            "variant_name": f"{title} {variant_name}" if variant_name else title,
                            "specs": {
                                "total_length_m": raw_specs.get('全长(m)', ''),
                                "action": raw_specs.get('调性', ''),
                                "pieces": raw_specs.get('节数', ''),
                                "close_length_cm": raw_specs.get('收竿后长度(cm)', ''),
                                "weight_g": raw_specs.get('重量(g)', ''),
                                "tip_diameter_mm": raw_specs.get('先径(mm)', ''),
                                "lure_weight_g": raw_specs.get('适合假饵重(g)', '') or raw_specs.get('适合路亚重量(g)', ''),
                                "jig_weight_g": raw_specs.get('适合铁板(g)', '') or raw_specs.get('适合铁板重(g)', ''),
                                "squid_jig_no": raw_specs.get('适合木虾(号)', ''),
                                "nylon_fluoro_lb": raw_specs.get('适合尼龙线(lb)', '') or raw_specs.get('适合尼龙・氟碳线(lb)', ''),
                                "pe_no": raw_specs.get('适合pe线(号)', ''),
                                "handle_length_mm": raw_specs.get('握把长度(mm)', ''),
                                "reel_seat_position_mm": raw_specs.get('渔轮座位置(mm)', ''),
                                "carbon_content_percent": raw_specs.get('碳纤维含有率(%)', ''),
                                "price": raw_specs.get('市场参考价', ''),
                                "product_code": raw_specs.get('商品编码', ''),
                                "service_card": raw_specs.get('售后服务卡首次配节参考价(元)', '')
                            },
                            "raw_specs": dict(zip(headers, cells))
                        }
                        variants.append(variant_data)
            
            record = {
                "brand": "shimano",
                "kind": "rod",
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
        
    print(f"\nDone! Scraped {len(results)} rods. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    scrape_shimano_rods()
