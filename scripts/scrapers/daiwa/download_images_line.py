import json
import os
import concurrent.futures
import sys
from pathlib import Path
from curl_cffi import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from gear_data_paths import DATA_RAW_DIR, resolve_data_raw

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_DIR = str(DATA_RAW_DIR)
INPUT_FILE = os.path.join(DATA_DIR, "daiwa_line_normalized.json")
IMAGE_DIR = str(resolve_data_raw("images", "daiwa_lines"))

os.makedirs(IMAGE_DIR, exist_ok=True)

def download_image(item):
    main_image_url = item.get("main_image_url")
    local_image_path = item.get("local_image_path")
    
    if not main_image_url or not local_image_path:
        return
        
    full_local_path = str(resolve_data_raw(local_image_path))
    
    if os.path.exists(full_local_path):
        print(f"Skipping (already exists): {local_image_path}")
        return

    print(f"Downloading: {main_image_url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    
    try:
        response = requests.get(main_image_url, headers=headers, impersonate="chrome", timeout=15)
        if response.status_code == 200:
            with open(full_local_path, "wb") as f:
                f.write(response.content)
            print(f"Saved to: {local_image_path}")
        else:
            print(f"Failed to download (Status {response.status_code}): {main_image_url}")
    except Exception as e:
        print(f"Error downloading {main_image_url}: {e}")

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Input file not found: {INPUT_FILE}")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    print(f"Starting image download for {len(data)} lines...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(download_image, data)
            
    print("All image downloads finished.")

if __name__ == "__main__":
    main()
