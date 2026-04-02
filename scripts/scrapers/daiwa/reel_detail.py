import json
import os
import hashlib
from datetime import datetime
from urllib.parse import urljoin
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
    if model:
        model = model.strip()
    else:
        model = "Unknown"
        
    # Images
    # Looking for high res images in specific containers or just all media images
    raw_images = page.css("img::attr(src)").getall()
    images = []
    for img in raw_images:
        if "media" in img and ("001_product_photo" in img or "main" in img):
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
            
            # Use safe_get with possible variations of column names
            sku = safe_get(row_data, ["JAN", "JANコード"])
            name = safe_get(row_data, ["アイテム", "品名"], model)
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
                "specs": {
                    "gear_ratio": gear_ratio,
                    "weight_g": weight_val,
                    "max_drag_kg": max_drag,
                    "line_capacity_pe": pe_capacity,
                    "line_capacity_nylon": nylon_capacity,
                    "cm_per_turn": cm_per_turn,
                    "handle_length_mm": handle_length,
                    "bearing_count_roller": bearing_count,
                    "market_reference_price": price
                }
            })
            
    # Fix datetime warning
    from datetime import timezone
    scraped_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    return {
        "brand": "Daiwa",
        "kind": kind,
        "model": model,
        "model_year": None,
        "source_url": url,
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
    
    # ONLY PROCESS FIRST 2 URLs FOR DEMONSTRATION PURPOSES
    limit = 2
    print(f"[*] Processing first {limit} URLs for Phase 2 demonstration...")
    
    for url in urls[:limit]:
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
