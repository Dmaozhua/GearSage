import os
import json
import time
import requests
import sys
from pathlib import Path
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from gear_data_paths import resolve_data_raw

def get_soup(url):
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.content, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def get_series_links(url):
    soup = get_soup(url)
    if not soup: return []
    body = soup.find('div', class_='category_home__body')
    if not body: return []
    series_links = set()
    for a in body.find_all('a'):
        href = a.get('href', '')
        if href.startswith('https://www.megabass.co.jp/site/freshwater/'):
            series_links.add(href)
    return list(series_links)

def get_product_links(series_url):
    soup = get_soup(series_url)
    if not soup: return [], ""
    
    product_links = set()
    for a in soup.find_all('a'):
        href = a.get('href', '')
        if '/products/' in href:
            product_links.add(href)
            
    # Extract series description
    series_description = ""
    # Try English first
    series_en = soup.select_one('.page_series__document .__en')
    if series_en and series_en.text.strip():
        paragraphs = [p.text.strip().replace('\n', ' ').replace('\r', '') for p in series_en.find_all('p') if p.text.strip()]
        series_description = ' '.join(paragraphs)
        
    # Fallback to Japanese
    if not series_description.strip():
        series_ja = soup.select_one('.page_series__document .__ja')
        if series_ja and series_ja.text.strip():
            paragraphs = [p.text.strip().replace('\n', ' ').replace('\r', '') for p in series_ja.find_all('p') if p.text.strip()]
            series_description = ' '.join(paragraphs)
            
    return list(product_links), series_description

def parse_product(url, category, series_description):
    soup = get_soup(url)
    if not soup: return None

    # Series
    series_el = soup.select_one('.page_products__header__title__main')
    series_name = series_el.text.strip() if series_el else ''

    # Model
    model_el = soup.select_one('.page_products__rod_title__main')
    if not model_el:
        # Fallback to h1 or something if not found
        model_el = soup.select_one('h1')
    model_name = model_el.text.strip() if model_el else ''

    # Specs
    specs = {}
    spec_dts = soup.select('.page_products__spec__table__th')
    spec_dds = soup.select('.page_products__spec__table__td')
    for dt, dd in zip(spec_dts, spec_dds):
        key = dt.text.strip()
        val = dd.text.strip().replace('\n', ' ').replace('\r', '')
        specs[key] = val

    # Images
    images = []
    img_els = soup.select('.page_products__slider__block img')
    for img in img_els:
        src = img.get('src')
        if src: images.append(src)

    # English Description (with fallback to Japanese)
    description_en = ''
    
    # Try to find .__en under summary first
    summary_en = soup.select_one('.page_products__summary .__en')
    if summary_en and summary_en.text.strip():
        paragraphs = []
        for p in summary_en.find_all('p'):
            text = p.text.strip().replace('\n', ' ').replace('\r', '')
            if text and '※The photograph is a prototype' not in text:
                paragraphs.append(text)
        description_en = ' '.join(paragraphs)
    else:
        # Fallback to general .__en
        en_divs = soup.select('.__en')
        if en_divs and en_divs[0].text.strip():
            paragraphs = []
            for p in en_divs[0].find_all('p'):
                text = p.text.strip().replace('\n', ' ').replace('\r', '')
                if text and '※The photograph is a prototype' not in text:
                    paragraphs.append(text)
            description_en = ' '.join(paragraphs)
            
    # If English description is still empty, fallback to Japanese description
    if not description_en.strip():
        summary_ja = soup.select_one('.page_products__summary .__ja')
        if summary_ja:
            paragraphs = []
            for p in summary_ja.find_all('p'):
                text = p.text.strip().replace('\n', ' ').replace('\r', '')
                if text and '※画像はプロトタイプです' not in text:
                    paragraphs.append(text)
            description_en = ' '.join(paragraphs)
        else:
            ja_divs = soup.select('.__ja')
            if ja_divs:
                paragraphs = []
                for p in ja_divs[0].find_all('p'):
                    text = p.text.strip().replace('\n', ' ').replace('\r', '')
                    if text and '※画像はプロトタイプです' not in text:
                        paragraphs.append(text)
                description_en = ' '.join(paragraphs)

    return {
        'url': url,
        'category': category,
        'series_name': series_name,
        'series_description': series_description,
        'model_name': model_name,
        'specs': specs,
        'images': images,
        'description_en': description_en
    }

def main():
    print("Fetching series...")
    bass_series = get_series_links("https://www.megabass.co.jp/site/freshwater/bass_rod/")
    trout_series = get_series_links("https://www.megabass.co.jp/site/freshwater/trout_rod/")
    
    print(f"Found {len(bass_series)} Bass Rod series and {len(trout_series)} Trout Rod series.")

    product_tasks = []
    for s in bass_series:
        product_tasks.append((s, "Bass Rod"))
    for s in trout_series:
        product_tasks.append((s, "Trout Rod"))

    all_product_urls = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_series = {executor.submit(get_product_links, s): cat for s, cat in product_tasks}
        for future in as_completed(future_to_series):
            cat = future_to_series[future]
            links, s_desc = future.result()
            for l in links:
                all_product_urls.append((l, cat, s_desc))
    
    print(f"Found {len(all_product_urls)} total products.")

    results = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_url = {executor.submit(parse_product, url, cat, s_desc): url for url, cat, s_desc in all_product_urls}
        for i, future in enumerate(as_completed(future_to_url)):
            url = future_to_url[future]
            try:
                res = future.result()
                if res:
                    results.append(res)
            except Exception as e:
                print(f"Error parsing {url}: {e}")
            
            if (i+1) % 10 == 0:
                print(f"Parsed {i+1}/{len(all_product_urls)} products...")

    output_path = str(resolve_data_raw("megabass_rod_raw.json"))
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(results)} products to {output_path}")

if __name__ == "__main__":
    main()
