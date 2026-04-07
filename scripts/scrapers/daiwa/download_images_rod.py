import os
import json
import time
from curl_cffi import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

def download_single_image(item, img_dir):
    img_url = item.get("main_image_url")
    local_path_rel = item.get("local_image_path")
    
    if not img_url or not local_path_rel:
        return
        
    filename = os.path.basename(local_path_rel)
    local_path = os.path.join(img_dir, filename)
    
    if os.path.exists(local_path):
        print(f"Skipping (already exists): {filename}")
        return
        
    print(f"Downloading: {filename} from {img_url}")
    try:
        r = requests.get(img_url, impersonate="chrome", timeout=15)
        if r.status_code == 200:
            with open(local_path, "wb") as img_f:
                img_f.write(r.content)
            # time.sleep(0.5)
        else:
            print(f"  Failed: HTTP {r.status_code}")
    except Exception as e:
        print(f"  Error downloading {img_url}: {e}")

def download_daiwa_rod_images():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "../../../GearSage-client/pkgGear/data_raw/daiwa_rod_normalized.json")
    img_dir = os.path.join(base_dir, "../../../GearSage-client/pkgGear/images/daiwa_rods")
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return
        
    os.makedirs(img_dir, exist_ok=True)
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(download_single_image, item, img_dir) for item in data]
        for future in as_completed(futures):
            future.result()

if __name__ == "__main__":
    download_daiwa_rod_images()
