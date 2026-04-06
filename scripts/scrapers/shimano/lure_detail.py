import json
import os
import re
import time
import random
from bs4 import BeautifulSoup
from curl_cffi import requests

# Base directories
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "../../../GearSage-client/pkgGear/data_raw")
os.makedirs(DATA_DIR, exist_ok=True)

OUTPUT_FILE = os.path.join(DATA_DIR, "shimano_lure_normalized.json")

def clean_text(text):
    if not text:
        return ""
    text = text.replace('\xa0', ' ').replace('\u3000', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def scrape_shimano_lures():
    urls_file = os.path.join(BASE_DIR, "shimano_lure_urls.json")
    if not os.path.exists(urls_file):
        print(f"URLs file not found: {urls_file}")
        return
        
    with open(urls_file, "r", encoding="utf-8") as f:
        detail_urls = json.load(f)
        
    print(f"Loaded {len(detail_urls)} lure URLs.")
    
    # We will process all detail URLs
    test_urls = detail_urls # Full scrape
    
    results = []
    
    for idx, url in enumerate(test_urls):
        print(f"[{idx+1}/{len(test_urls)}] Fetching: {url}")
        
        try:
            r = requests.get(url, impersonate="chrome")
            if r.status_code != 200:
                print(f"  HTTP {r.status_code}")
                continue
                
            soup = BeautifulSoup(r.text, 'html.parser')
            
            # Model Name
            model_name_tag = soup.find('h1')
            model_name = clean_text(model_name_tag.get_text()) if model_name_tag else 'Unknown'
            
            # Lure Type from URL (freshwaterlure/minnow)
            url_parts = url.split('/')
            lure_type = ''
            if 'lure' in url_parts:
                lure_idx = url_parts.index('lure')
                if len(url_parts) > lure_idx + 2:
                    lure_type = url_parts[lure_idx + 2] # e.g. minnow, crankbait
            
            # Main Image
            main_img = soup.find('img', class_='product-image')
            main_image_url = ""
            if not main_img:
                # Look for image in figure or specific src
                for img in soup.find_all('img'):
                    src = img.get('src', '')
                    if 'main' in src.lower() and ('/product/' in src or 'Shimanofish' in src):
                        main_image_url = src
                        break
            if main_image_url and main_image_url.startswith('/'):
                main_image_url = "https://fish.shimano.com" + main_image_url
                
            # Spec Tables
            spec_tables = soup.find_all('table')
            variants = []
            
            for table in spec_tables:
                headers = []
                first_row = table.find('tr')
                if not first_row:
                    continue
                    
                th_elements = first_row.find_all(['th', 'td'])
                if not th_elements:
                    continue
                    
                for th in th_elements:
                    headers.append(clean_text(th.get_text()))
                    
                if '型号' not in headers and '颜色' not in headers and '商品编码' not in headers:
                    continue
                    
                rows = table.find_all('tr')
                for tr in rows[1:]:
                    cells = tr.find_all(['td', 'th'])
                    if len(cells) != len(headers):
                        continue
                        
                    specs = {}
                    for i, cell in enumerate(cells):
                        header_key = headers[i]
                        val = clean_text(cell.get_text())
                        
                        # Handle images in color column
                        if not val and cell.find('img'):
                            img_alt = cell.find('img').get('alt', '')
                            if img_alt:
                                val = clean_text(img_alt)
                                
                        if header_key == '型号':
                            specs['model'] = val
                        elif header_key == '颜色':
                            specs['color'] = val
                        elif header_key == '类型':
                            specs['buoyancy'] = val
                        elif header_key == '全长（mm）' or header_key == '长度（mm）':
                            specs['length'] = val
                        elif header_key == '重量（g）':
                            specs['weight'] = val
                        elif header_key == '市场参考价':
                            specs['price'] = val
                        elif header_key == '商品编码':
                            specs['product_code'] = val
                        else:
                            specs[header_key] = val
                            
                    if 'model' in specs:
                        variant_name = specs['model']
                        if 'color' in specs:
                            variant_name += f" {specs['color']}"
                        
                        variants.append({
                            "variant_name": variant_name,
                            "specs": specs
                        })
                        
            # Use main_image_url to extract local path filename
            local_image_path = ""
            if main_image_url:
                # e.g. .../PRD_a155F00000Cbxc0QAB_main.jpg/jcr:content/renditions/cq5dam.web.481.481.jpeg
                # Try to find PRD_... part
                match = re.search(r'(PRD_[^/]+\.(jpg|png|jpeg|webp))', main_image_url, re.IGNORECASE)
                if match:
                    filename = match.group(1)
                else:
                    filename = main_image_url.split('/')[-1].split('?')[0]
                local_image_path = f"images/shimano_lures/{filename}"
                
            item_data = {
                "model_name": model_name,
                "url": url,
                "lure_type": lure_type,
                "main_image_url": main_image_url,
                "local_image_path": local_image_path,
                "variants": variants
            }
            results.append(item_data)
            
            time.sleep(random.uniform(0.5, 1.0))
            
        except Exception as e:
            print(f"Error processing {url}: {e}")
            
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"\nDone! Scraped {len(test_urls)} lures. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    scrape_shimano_lures()
