import json
import os
import re
import time
import urllib.parse
from curl_cffi import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_DIR = os.path.join(BASE_DIR, "GearSage-client", "pkgGear", "data_raw")

# Target image directories as requested by user
ROD_IMAGE_DIR = "/Users/tommy/GearSage/temp_images/shimano_rods"
REEL_IMAGE_DIR = "/Users/tommy/GearSage/temp_images/shimano_reels"
LINE_IMAGE_DIR = "/Users/tommy/GearSage/temp_images/shimano_lines"
LURE_IMAGE_DIR = "/Users/tommy/GearSage/temp_images/shimano_lures"

FINAL_ROD_DIR = "/Users/tommy/Pictures/images/shimano_rods"
FINAL_REEL_DIR = "/Users/tommy/Pictures/images/shimano_reels"
FINAL_LINE_DIR = "/Users/tommy/Pictures/images/shimano_lines"
FINAL_LURE_DIR = "/Users/tommy/Pictures/images/shimano_lures"

os.makedirs(ROD_IMAGE_DIR, exist_ok=True)
os.makedirs(REEL_IMAGE_DIR, exist_ok=True)
os.makedirs(LINE_IMAGE_DIR, exist_ok=True)
os.makedirs(LURE_IMAGE_DIR, exist_ok=True)

def sanitize_filename(name):
    # Replace invalid filename characters with underscore
    return re.sub(r'[\\/*?:"<>|]', "_", name).strip()

def download_image(url, save_path, final_path):
    if os.path.exists(final_path) or os.path.exists(save_path):
        print(f"Exists, skipping: {final_path}")
        return True
        
    print(f"Downloading {url} -> {save_path}")
    headers = {
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "https://fish.shimano.com/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url, impersonate="chrome", headers=headers, timeout=15)
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(response.content)
            time.sleep(1) # Rate limit
            return True
        else:
            print(f"Failed to download {url}: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def process_file(json_filename, kind="rod"):
    json_path = os.path.join(DATA_DIR, json_filename)
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return
        
    print(f"Processing {json_filename}...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    updated = False
    
    for item in data:
        main_img_url = item.get("main_image_url")
        if not main_img_url:
            continue
            
        model_name = item.get("model_name", "unknown")
        safe_name = sanitize_filename(model_name)
        ext = ".jpg"
        if "png" in main_img_url.lower():
            ext = ".png"
        elif "webp" in main_img_url.lower():
            ext = ".webp"
            
        filename = f"{safe_name}_main{ext}"
        
        if kind == "rod":
            abs_save_path = os.path.join(ROD_IMAGE_DIR, filename)
            final_path = os.path.join(FINAL_ROD_DIR, filename)
            rel_save_path = f"images/shimano_rods/{filename}"
        elif kind == "reel":
            abs_save_path = os.path.join(REEL_IMAGE_DIR, filename)
            final_path = os.path.join(FINAL_REEL_DIR, filename)
            rel_save_path = f"images/shimano_reels/{filename}"
        elif kind == "line":
            abs_save_path = os.path.join(LINE_IMAGE_DIR, filename)
            final_path = os.path.join(FINAL_LINE_DIR, filename)
            rel_save_path = f"images/shimano_lines/{filename}"
        elif kind == "lure":
            abs_save_path = os.path.join(LURE_IMAGE_DIR, filename)
            final_path = os.path.join(FINAL_LURE_DIR, filename)
            rel_save_path = f"images/shimano_lures/{filename}"
        else:
            continue
            
        success = download_image(main_img_url, abs_save_path, final_path)
        if success:
            item["local_image_path"] = rel_save_path
            updated = True
                
    if updated:
        print(f"Saving updated {json_filename}...")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # process_file("shimano_rod_normalized.json", kind="rod")
    # process_file("shimano_spinning_reel_normalized.json", kind="reel")
    # process_file("shimano_baitcasting_reel_normalized.json", kind="reel")
    # process_file("shimano_line_normalized.json", kind="line")
    process_file("shimano_lure_normalized.json", kind="lure")
    print("Done!")
