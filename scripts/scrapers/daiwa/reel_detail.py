import json
import os
import hashlib
import re
import time
import unicodedata
import requests
from datetime import datetime
from urllib.parse import urljoin
from fake_useragent import UserAgent
from scrapling import Fetcher

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
INPUT_FILE = os.path.join(BASE_DIR, "GearSage-client/pkgGear/data_raw/daiwa_reel_urls.json")
OUTPUT_FILE = os.path.join(BASE_DIR, "GearSage-client/pkgGear/data_raw/daiwa_reel_normalized.json")

def load_urls():
    if not os.path.exists(INPUT_FILE):
        return []
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data.get("urls", [])

def extract_text(element):
    """Safely extract and clean text from a node."""
    if not element:
        return ""
    # getall() returns all text nodes inside, join them
    text = "".join(element.css("::text").getall())
    return text.strip()

def parse_detail_page(fetcher, item):
    url = item.get("url") if isinstance(item, dict) else item
    kind = item.get("kind", "reel") if isinstance(item, dict) else "reel"
    
    print(f"[*] Fetching: {url}")
    page = fetcher.get(url)
    
    # Generate hash of raw HTML
    raw_html = getattr(page, 'body', b'')
    if not isinstance(raw_html, bytes):
        raw_html = str(raw_html).encode('utf-8')
    raw_html_hash = hashlib.sha256(raw_html).hexdigest()
    
    # Title (Model)
    model = page.css("h1::text").get()
    master_year = None
    if model:
        model = model.strip()
        # Try to extract year from main model name, e.g. "22EXIST" or "19 CERTATE"
        model_year_match = re.search(r'(?:^|\b)(\d{2})[A-Z\u3040-\u309F\u30A0-\u30FF\s]', model)
        if model_year_match:
            y = int(model_year_match.group(1))
            master_year = str(y + 2000) if y < 50 else str(y + 1900)
    else:
        model = "Unknown"
        
    # Extract main_selling_points
    main_selling_points = []
    main_area = page.css("main")
    if main_area:
        # Collect paragraphs with class "text"
        paragraphs = main_area.css("p.text, div.text")
        for p in paragraphs:
            text = extract_text(p)
            if text and len(text) > 15:
                main_selling_points.append(text)
        
        # If still empty, try to get the first few regular paragraphs under product-intro or main
        if not main_selling_points:
            for p in main_area.css("p"):
                text = extract_text(p)
                # Ignore very short texts or obvious labels
                if text and len(text) > 20 and "JAN" not in text and "自重" not in text:
                    main_selling_points.append(text)
                    if len(main_selling_points) >= 3:
                        break
                        
    # Limit selling points to top 3 paragraphs
    main_selling_points = main_selling_points[:3]
        
    # Download main image (white background product photo)
    # We want the first product display image. Usually these are specific model photos.
    local_image_path = ""
    # Set the base directory for all downloaded gear images
    image_base_dir = "/Users/tommy/Pictures/images"
    image_dir = os.path.join(image_base_dir, "daiwa_reels")
    if not os.path.exists(image_dir):
        os.makedirs(image_dir)

    raw_images = page.css("img::attr(src)").getall()
    images = []
    main_image_url = None
    
    # Filter to find the actual product list images, excluding banners, logos, and the generic "image" placeholder
    for img in raw_images:
        if "media" in img and "001_product_photo" in img:
            full_img = urljoin("https://www.daiwa.com", img)
            if full_img not in images:
                images.append(full_img)
                # The first image in the product list usually has the specific model name and a .jpg/.png extension
                # Avoid the generic folder images like "22EXIST_image" or "banner"
                if not main_image_url and "banner" not in img.lower() and "sub" not in img.lower():
                    # Check if it has a typical image extension, ignoring query params
                    clean_img = img.split('?')[0].lower()
                    if clean_img.endswith('.jpg') or clean_img.endswith('.png') or clean_img.endswith('.webp'):
                        main_image_url = full_img

    # If we didn't find one with an extension, fallback to the first 001_product_photo we found
    if not main_image_url and len(images) > 0:
        main_image_url = images[0]

    # If we found a main image, download it
    if main_image_url:
        try:
            print(f"[*] Downloading main image: {main_image_url}")
            response = requests.get(main_image_url, stream=True, timeout=10)
            if response.status_code == 200:
                # Clean up filename (e.g. use model name)
                safe_model_name = re.sub(r'[^\w\-]', '_', model)
                ext = ".jpg" # Default extension
                if ".png" in main_image_url.lower(): ext = ".png"
                elif ".webp" in main_image_url.lower(): ext = ".webp"
                
                filename = f"{safe_model_name}_main{ext}"
                filepath = os.path.join(image_dir, filename)
                
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(1024):
                        f.write(chunk)
                
                # Store relative path (e.g. "images/daiwa_reels/...") based on the new structure
                # This aligns with the previous convention where images start with "images/..."
                local_image_path = f"images/daiwa_reels/{filename}"
                print(f"[*] Saved main image to {filepath}")
        except Exception as e:
            print(f"[!] Failed to download main image: {e}")
            
    # Include other banners/images
    for img in raw_images:
        if "media" in img and "001_product_photo" not in img and "main" in img:
            full_img = urljoin("https://www.daiwa.com", img)
            if full_img not in images:
                images.append(full_img)
                
    def safe_get(d, keys, default=""):
        for key in keys:
            if key in d:
                return d[key]
        return default

    # Spec Table
    variants = []
    tables = page.css("table")
    for table in tables:
        rows = table.css("tr")
        if not rows:
            continue
            
        headers = [extract_text(th) for th in rows[0].css("th, td")]
        if not headers or "アイテム" not in headers:
            continue
            
        # Parse data rows
        for row in rows[1:]:
            tds = row.css("th, td")
            if not tds:
                continue
                
            row_data = {}
            for i, td in enumerate(tds):
                if i < len(headers):
                    row_data[headers[i]] = extract_text(td)
            
            if len(variants) == 0:
                print("--- Row Data Keys ---")
                print(row_data.keys())
                
            # Use safe_get with possible variations of column names
            sku = safe_get(row_data, ["JAN", "JANコード"])
            
            raw_name = safe_get(row_data, ["アイテム", "品名"], model)
            # Normalize full-width characters to half-width
            raw_name = unicodedata.normalize('NFKC', raw_name)
            
            # Extract year and sub-model
            variant_year = None
            variant_name = raw_name
            
            # Look for 2-digit year at the beginning (e.g. "22EXIST LT2000S-P" or "19 CERTATE LT...")
            # Use (?!\d) to ensure we don't accidentally match the first two digits of a size like "4000"
            year_match = re.match(r"^(\d{2})(?!\d)\s*(.*)", variant_name)
            if year_match:
                year_str = year_match.group(1)
                variant_name = year_match.group(2).strip()
                y = int(year_str)
                variant_year = str(y + 2000) if y < 50 else str(y + 1900)
                
            # Remove the base model name from the variant name if it exists at the start
            if model:
                # e.g. model="EXIST", variant_name="EXIST LT2000S-P" -> "LT2000S-P"
                # Need to escape model and make it case-insensitive
                pattern = re.compile(r"^" + re.escape(model) + r"\s*", re.IGNORECASE)
                clean_variant = pattern.sub("", variant_name).strip()
                if clean_variant:
                    variant_name = clean_variant
                    
            name = variant_name
            
            # Extract size_family (Second Layer Official Spec)
            # e.g., from LT2000S-H extract 2000
            size_family = ""
            size_match = re.search(r'(\d{3,5})', variant_name)
            if size_match:
                size_family = size_match.group(1)

            weight = safe_get(row_data, ["標準自重（ｇ）", "自重（g）", "自重(g)", "標準自重(g)"])
            gear_ratio = safe_get(row_data, ["ギア比", "巻取り長さ（cm/ハンドル1回転）", "巻取り長さ(cm/ハンドル1回転)"]) # Often the first col or ratio col
            if "ギア比" in row_data:
                gear_ratio = row_data["ギア比"]
            max_drag = safe_get(row_data, ["最大ドラグ力（kg）", "最大ドラグ力(kg)"])
            pe_capacity = safe_get(row_data, ["標準巻糸量PE（号ｰm）", "標準糸巻量PE（号-m）", "標準糸巻量 PE（号-m）", "標準糸巻量PE(号-m)"])
            nylon_capacity = safe_get(row_data, ["標準巻糸量ナイロン（lb-m）", "標準糸巻量ナイロン（lb-m）", "標準糸巻量ナイロン(lb-m)", "標準巻糸量ナイロン(lb-m)"])
            cm_per_turn = safe_get(row_data, ["巻取り長さ（cm/ハンドル1回転）", "巻取り長さ(cm/ハンドル1回転)"])
            handle_length = safe_get(row_data, ["ハンドルアーム長（mm）", "ハンドルアーム長(mm)", "ハンドル長（mm）", "ハンドル長(mm)"])
            bearing_count = safe_get(row_data, ["ベアリング（ボール/ローラー）", "ベアリング(ボール/ローラー)"])
            price = safe_get(row_data, ["メーカー希望本体価格（円）", "メーカー希望本体価格(円)"])

            
            # Handle empty weight string conversion to int safely
            weight_val = None
            if weight:
                # Remove non-digit chars if any
                clean_w = ''.join(c for c in weight if c.isdigit() or c == '.')
                if clean_w:
                    try:
                        weight_val = float(clean_w)
                    except:
                        pass
                
            variants.append({
                "sku": sku,
                "name": name,
                "year": variant_year,
                "specs": {
                    "size_family": size_family,
                    "gear_ratio": gear_ratio,
                    "weight_g": weight_val,
                    "max_drag_kg": max_drag,
                    "drag_click": "", # Not typically in Daiwa specs table, leave empty for now
                    "line_capacity_pe": pe_capacity,
                    "line_capacity_nylon": nylon_capacity,
                    "cm_per_turn": cm_per_turn,
                    "handle_length_mm": handle_length,
                    "bearing_count_roller": bearing_count,
                    "market_reference_price": price
                }
            })
            
    # Determine master model_year from variants if not found in model name
    if not master_year:
        for v in variants:
            if v.get("year"):
                master_year = v["year"]
                break

    # Fix datetime warning
    from datetime import timezone
    scraped_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    return {
        "brand": "Daiwa",
        "kind": kind,
        "model": model,
        "model_year": master_year,
        "main_selling_points": main_selling_points,
        "source_url": url,
        "local_image_path": local_image_path,
        "images": images,
        "variants": variants,
        "raw_data_hash": raw_html_hash,
        "scraped_at": scraped_at
    }

def main():
    urls = load_urls()
    if not urls:
        print("[!] No URLs found to process.")
        return
        
    fetcher = Fetcher()
    normalized_data = []
    
    print(f"[*] Processing 3 URLs for testing phase...")
    urls = urls[:3]
    
    for url in urls:
        try:
            data = parse_detail_page(fetcher, url)
            normalized_data.append(data)
        except Exception as e:
            print(f"[!] Error processing {url}: {e}")
            
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(normalized_data, f, indent=2, ensure_ascii=False)
        
    print(f"[*] Phase 2 Complete. Saved {len(normalized_data)} records to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
