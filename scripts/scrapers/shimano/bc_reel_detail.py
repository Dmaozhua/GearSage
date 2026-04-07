import json
import os
import urllib.parse
import time
from bs4 import BeautifulSoup
from curl_cffi import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_DIR = os.path.join(BASE_DIR, "GearSage-client/pkgGear/data_raw")
OUTPUT_FILE = os.path.join(DATA_DIR, "shimano_baitcasting_reel_normalized.json")

def scrape_shimano_bc_reels():
    urls_file = os.path.join(os.path.dirname(__file__), "shimano_baitcasting_urls.json")
    if os.path.exists(urls_file):
        with open(urls_file, "r", encoding="utf-8") as f:
            detail_urls = json.load(f)
        print(f"Loaded {len(detail_urls)} URLs from {urls_file}")
    else:
        print("Please run save_urls.py first.")
        return

    # Scrape all detail URLs
    test_urls = detail_urls
    
    results = []
    for url in test_urls:
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
            
            desc_el = page_soup.select_one('.product__description_section')
            if desc_el:
                desc = desc_el.get_text(separator='\n', strip=True)
                desc = desc.replace('阅读更多', '').replace('减少显示', '').strip()
            else:
                desc = ""
            
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
                            # Keep original for 'raw_specs' output if needed, but it's fine to just use normalized
                            
                        # Extract standard fields
                        variant_name = raw_specs.get('型号', '')
                        
                        # Handle different spool dimension namings
                        spool_dim = raw_specs.get('线杯径(mm)/幅(mm)', '') or raw_specs.get('线杯径(mm)/一转(mm)', '')
                        
                        variant_data = {
                            "variant_name": f"{title} {variant_name}" if variant_name else title,
                            "specs": {
                                "gear_ratio": raw_specs.get('齿轮比', ''),
                                "max_drag_kg": raw_specs.get('最大卸力(kg)', ''),
                                "max_durability_kg": raw_specs.get('最大耐久力(kg)', ''),
                                "weight_g": raw_specs.get('重量(g)', ''),
                                "spool_diameter_stroke_mm": spool_dim,
                                "nylon_no_m": raw_specs.get('尼龙线容线量(号-m)', ''),
                                "nylon_lb_m": raw_specs.get('尼龙线容线量(lb-m)', '') or raw_specs.get('尼龙线容线量(磅-m)', ''),
                                "fluoro_no_m": raw_specs.get('氟碳线容线量(号-m)', ''),
                                "fluoro_lb_m": raw_specs.get('氟碳线容线量(lb-m)', '') or raw_specs.get('氟碳线容线量(磅-m)', ''),
                                "pe_no_m": raw_specs.get('pe线容线量(号-m)', ''),
                                "cm_per_turn": raw_specs.get('最大收线长(cm/手把转一圈)', ''),
                                "handle_length_mm": raw_specs.get('手把长度(mm)', ''),
                                "bearings": raw_specs.get('培林数/罗拉', ''),
                                "price": raw_specs.get('市场参考价', ''),
                                "product_code": raw_specs.get('商品编码', '')
                            },
                            "raw_specs": dict(zip(headers, cells)) # Preserve original for debugging
                        }
                        variants.append(variant_data)
            
            record = {
                "brand": "shimano",
                "kind": "baitcasting",
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
        
    print(f"\nDone! Scraped {len(results)} reels. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    scrape_shimano_bc_reels()