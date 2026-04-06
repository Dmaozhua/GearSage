import json
import os
import time
from bs4 import BeautifulSoup
from curl_cffi import requests
from urllib.parse import urljoin

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
OUTPUT_DIR = os.path.join(BASE_DIR, "GearSage-client/pkgGear/data_raw")
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "daiwa_line_urls.json")

URLS = [
    "https://www.daiwa.com/jp/product/productlist?page=1&category1=%E3%83%A9%E3%82%A4%E3%83%B3&search=1&category2=%E3%83%90%E3%82%B9",
    "https://www.daiwa.com/jp/product/productlist?page=1&category1=%E3%83%A9%E3%82%A4%E3%83%B3&search=1&category2=%E3%83%88%E3%83%A9%E3%82%A6%E3%83%88",
    "https://www.daiwa.com/jp/product/productlist?page=1&category1=%E3%83%A9%E3%82%A4%E3%83%B3&search=1&category2=%E3%82%BD%E3%83%AB%E3%83%88%E3%82%A6%E3%82%A9%E3%83%BC%E3%82%BF%E3%83%BC%E3%83%AB%E3%82%A2%E3%83%BC",
    "https://www.daiwa.com/jp/product/productlist?page=1&category1=%E3%83%A9%E3%82%A4%E3%83%B3&search=1&category2=%E6%B8%93%E6%B5%81"
]

def main():
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    all_links = []
    
    for base_url in URLS:
        print(f"Scraping URLs from: {base_url}")
        page = 1
        while True:
            url = base_url.replace("page=1", f"page={page}")
            print(f"  Fetching page {page}...")
            response = requests.get(url, headers=headers, impersonate="chrome")
            if response.status_code != 200:
                print(f"  Failed to fetch page {page}: Status {response.status_code}")
                break
                
            soup = BeautifulSoup(response.text, 'html.parser')
            # Find the product list container
            product_list = soup.select('.productList a')
            if not product_list:
                # Daiwa's layout sometimes uses .c-cardList or similar. Let's try finding product links directly.
                product_list = soup.select('a[href^="/jp/product/"]')
                
            links = []
            for a in product_list:
                href = a.get('href')
                if href and '/product/' in href and 'productlist' not in href:
                    full_url = urljoin("https://www.daiwa.com", href)
                    links.append(full_url)
            
            links = list(set(links)) # deduplicate
            if not links:
                print("  No product links found, ending pagination.")
                break
                
            new_links = [l for l in links if l not in all_links]
            if not new_links:
                print("  No NEW links found, ending pagination.")
                break
                
            print(f"  Found {len(new_links)} new product links.")
            all_links.extend(new_links)
            
            # Since this is a test, let's limit it to 2 pages max per category or just grab all since lines aren't too many
            page += 1
            time.sleep(1)

    print(f"Total unique URLs collected: {len(all_links)}")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_links, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
