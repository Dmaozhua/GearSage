import json
import os
import re
from curl_cffi import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_product_links(url):
    print(f"Fetching links from {url}")
    response = requests.get(url, impersonate="chrome")
    soup = BeautifulSoup(response.text, 'html.parser')
    
    lure_links = []
    
    groups = soup.select('.category_home__category__group')
    for group in groups:
        title_tag = group.select_one('.category_home__category__group__header__title')
        if title_tag:
            category_title = title_tag.get_text(strip=True)
            links = group.select('a.category_home__category__block')
            for link in links:
                href = link.get('href')
                if href and '/products/' in href:
                    lure_links.append((href, category_title))
                
    return lure_links

def scrape_detail(url, category=""):
    full_url = url if url.startswith('http') else "https://www.megabass.co.jp" + url
    try:
        r = requests.get(full_url, impersonate="chrome", timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Product Name
        name_tag = soup.select_one('h1')
        model_name = name_tag.get_text(strip=True) if name_tag else ''
        
        if not model_name:
            return None
            
        # Description: prioritize Chinese, then English, then Japanese
        desc_tag = None
        summary_block = soup.select_one('.page_products__summary')
        
        def has_text(tag):
            if not tag: return False
            import bs4
            text = ''
            for e in tag.descendants:
                if isinstance(e, bs4.element.NavigableString):
                    parent = e.parent
                    if parent.name not in ['script', 'style'] and 'language_nav' not in parent.get('class', []) and 'page_products__summary__lang' not in parent.get('class', []):
                        text += str(e)
            return len(text.strip()) > 10

        if summary_block:
            for selector in ['.__zh', '.__zh-CN', '.__zh-cn']:
                tag = summary_block.select_one(selector)
                if has_text(tag):
                    desc_tag = tag
                    break
            if not desc_tag:
                tag = summary_block.select_one('.__en')
                if has_text(tag):
                    desc_tag = tag
            if not desc_tag:
                tag = summary_block.select_one('.__ja')
                if has_text(tag):
                    desc_tag = tag
                    
        if not desc_tag:
            zh_tags = [t for t in soup.select('.__zh') + soup.select('.__zh-CN') + soup.select('.__zh-cn') if has_text(t)]
            if zh_tags:
                desc_tag = max(zh_tags, key=lambda t: len(t.get_text(strip=True)))
                
        if not desc_tag:
            en_tags = [t for t in soup.select('.__en') if has_text(t)]
            if en_tags:
                desc_tag = max(en_tags, key=lambda t: len(t.get_text(strip=True)))
                
        if not desc_tag:
            ja_tags = [t for t in soup.select('.__ja') if has_text(t)]
            if ja_tags:
                desc_tag = max(ja_tags, key=lambda t: len(t.get_text(strip=True)))
                
        if not desc_tag and summary_block and has_text(summary_block):
            desc_tag = summary_block
            
        if not desc_tag:
            tag = soup.select_one('.product_text')
            if has_text(tag): desc_tag = tag
            
        if not desc_tag:
            tag = soup.select_one('.page_products__concept')
            if has_text(tag): desc_tag = tag
            
        description = ''
        if not desc_tag:
            meta_desc = soup.select_one('meta[name="description"]')
            if meta_desc:
                description = meta_desc.get('content', '').strip()
        else:
            for tag in desc_tag(['script', 'style', '.language_nav']):
                tag.decompose()
            for el in desc_tag.select('.page_products__summary__lang'):
                el.decompose()
            description = desc_tag.get_text(separator=' ', strip=True)

        
        # Image
        img_tag = soup.select_one('.page_products__slider img')
        if not img_tag:
            img_tag = soup.select_one('img[src*="/products/"]')
        main_image_url = img_tag['src'] if img_tag else ''
        
        # Specs
        th_list = soup.select('.page_products__spec__table th, .page_products__spec__table__th')
        td_list = soup.select('.page_products__spec__table td, .page_products__spec__table__td')
        if not th_list:
            th_list = soup.select('th')
            td_list = soup.select('td')
            
        base_specs = {}
        for th, td in zip(th_list, td_list):
            k = th.get_text(strip=True).lower()
            v = td.get_text(strip=True)
            if 'length' in k:
                base_specs['length'] = v
            elif 'weight' in k or 'lure' in k:
                base_specs['weight'] = v
            elif 'type' in k:
                base_specs['buoyancy'] = v
            elif 'price' in k:
                base_specs['price'] = v
            else:
                base_specs[k] = v
                
        # Colors
        colors_tags = soup.select('.page_products__variation__block__title')
        if not colors_tags:
            colors_tags = soup.select('.page_products__color__name')
        if not colors_tags:
            colors_tags = soup.select('.color_name')
            
        colors = [c.get_text(strip=True) for c in colors_tags]
        
        variants = []
        if colors:
            for color in colors:
                specs = base_specs.copy()
                specs['color'] = color
                variants.append({
                    "variant_name": f"{model_name} {color}",
                    "specs": specs
                })
        else:
            specs = base_specs.copy()
            specs['color'] = ''
            variants.append({
                "variant_name": model_name,
                "specs": specs
            })
            
        return {
            "model_name": model_name,
            "url": full_url,
            "lure_type": "",
            "megabass_category": category,
            "description": description,
            "main_image_url": main_image_url,
            "local_image_path": "", # Will not download images for now
            "variants": variants
        }
    except Exception as e:
        print(f"Error processing {full_url}: {e}")
        return None

def scrape_megabass_lures():
    urls = [
        "https://www.megabass.co.jp/site/freshwater/bass_lure/",
        "https://www.megabass.co.jp/site/freshwater/trout_lure/"
    ]
    
    all_links_with_cat = []
    for u in urls:
        links_with_cat = get_product_links(u)
        all_links_with_cat.extend(links_with_cat)
        
    # Deduplicate by url while keeping category
    seen_urls = set()
    unique_links = []
    for url, cat in all_links_with_cat:
        if url not in seen_urls:
            seen_urls.add(url)
            unique_links.append((url, cat))
            
    print(f"Total unique product links to scrape: {len(unique_links)}")
    
    results = []
    max_workers = 10
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_url = {executor.submit(scrape_detail, url, cat): url for url, cat in unique_links}
        for i, future in enumerate(as_completed(future_to_url)):
            url = future_to_url[future]
            try:
                data = future.result()
                if data:
                    results.append(data)
                print(f"[{i+1}/{len(unique_links)}] Processing {url}")
            except Exception as e:
                print(f"[{i+1}/{len(unique_links)}] Error processing {url}: {e}")
                
    base_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(base_dir, "GearSage-client/pkgGear/data_raw/megabass_lure_normalized.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(results)} lures to {out_path}")

if __name__ == "__main__":
    scrape_megabass_lures()
