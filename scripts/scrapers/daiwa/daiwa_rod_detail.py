import os
import json
import sys
import unicodedata
import re
import difflib
from curl_cffi import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()

def clean_text(text):
    return re.sub(r'\s+', ' ', (text or '')).strip()

def looks_like_update_list(text):
    t = clean_text(text)
    return bool(re.match(r'^\d{4}\.\d{2}＝', t))

def looks_like_useless_heading(text):
    t = clean_text(text)
    if len(t) < 8:
        return True
    if 'アイテム紹介' in t:
        return True
    if t.startswith('型號：'):
        return True
    return False

def process_url(i, url, total):
    print(f"[{i+1}/{total}] Fetching: {url}")
    try:
        r = requests.get(url, impersonate="chrome", timeout=15, verify=False)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Model Name
        h1 = soup.select_one("h1")
        model_name = h1.get_text(strip=True) if h1 else ""
        if not model_name:
            print(f"  [{i+1}] Skipping, no model name found.")
            return None
            
        # Main image
        main_image_url = ""
        main_img_tag = soup.select_one(".product-detail-visual img") or soup.select_one("meta[property='og:image']")
        if main_img_tag:
            if main_img_tag.name == 'meta':
                main_image_url = main_img_tag.get('content', '')
            else:
                main_image_url = main_img_tag.get('src', '')
        
        if main_image_url and not main_image_url.startswith('http'):
            import urllib.parse
            main_image_url = urllib.parse.urljoin("https://www.daiwa.com", main_image_url)
            
        # Local image path logic
        local_image_path = ""
        if main_image_url:
            match = re.search(r'([a-zA-Z0-9_-]+\.(jpg|png|jpeg|webp))', main_image_url, re.IGNORECASE)
            if match:
                filename = match.group(1)
            else:
                filename = main_image_url.split('/')[-1].split('?')[0]
            local_image_path = f"images/daiwa_rods/{sanitize_filename(model_name)}_{filename}"
            
        # Series Description / master description
        series_description = ""
        desc_parts = []
        for text_div in soup.select(".containerText .text, .mainParts_text .text, .mainParts_text .d1, .product-detail-info__description"):
            text = clean_text(text_div.get_text(separator=" ", strip=True))
            if not text or looks_like_update_list(text):
                continue
            desc_parts.append(text)

        heading_candidates = []
        for heading in soup.select(".mainParts_heading .font_Midashi"):
            text = clean_text(heading.get_text(separator=" ", strip=True))
            if not text or looks_like_useless_heading(text):
                continue
            heading_candidates.append(text)

        if heading_candidates:
            if desc_parts:
                series_description = "\n\n".join([heading_candidates[0], desc_parts[0]])
            else:
                series_description = heading_candidates[0]
        else:
            series_description = "\n\n".join(desc_parts)
        if not series_description:
            meta_desc = soup.select_one("meta[name='description']") or soup.select_one("meta[property='og:description']")
            if meta_desc:
                series_description = clean_text(meta_desc.get("content", ""))
        
        variants = []
        
        # Find the spec table and variant description table
        tables = soup.select("table")
        spec_table = None
        variant_desc_map = {}
        
        for t in tables:
            tr0 = t.select("tr")
            if not tr0:
                continue
            headers = [th.get_text(strip=True) for th in tr0[0].select("th, td")]
            # Look for both Item and Length to ensure it's the right table
            if any("アイテム" in h for h in headers) and any("全長" in h for h in headers):
                spec_table = t
            else:
                # Potential variant description table
                for tr in t.select("tr"):
                    cells = tr.select("td, th")
                    if len(cells) >= 2:
                        name_cell = cells[0].get_text(strip=True)
                        desc_cell = cells[1].get_text(separator=" ", strip=True)
                        if name_cell and len(desc_cell) > 10 and name_cell != "アイテム":
                            variant_desc_map[name_cell] = desc_cell
        
        # Look in free text with "■" markers
        for container in soup.select(".d1, .area, .text, .container"):
            text = container.get_text(separator="\n", strip=True)
            if "■" in text:
                parts = text.split("■")
                for part in parts:
                    part = part.strip()
                    if not part: continue
                    
                    lines = part.split('\n', 1)
                    if len(lines) >= 2:
                        key_line = lines[0].strip()
                        desc_text = lines[1].replace("\n", " ").strip()
                        
                        # Check if it looks like a valid model name key (contains digits)
                        if key_line and len(desc_text) > 10 and any(c.isdigit() for c in key_line):
                            if key_line not in variant_desc_map:
                                variant_desc_map[key_line] = desc_text
                
        # Look in h2.font_Midashi followed by section.text
        for h2 in soup.select("h2.font_Midashi"):
            h2_text = h2.get_text(separator=" ", strip=True)
            parent_section = h2.find_parent("section")
            if parent_section:
                desc_parts = []
                curr = parent_section.find_next_sibling("section")
                while curr and not curr.find("h2", class_="font_Midashi"):
                    text_div = curr.select_one(".text")
                    if text_div:
                        desc_parts.append(text_div.get_text(separator=" ", strip=True))
                    curr = curr.find_next_sibling("section")
                if desc_parts:
                    desc_text = " ".join(desc_parts)
                    if len(desc_text) > 10 and any(c.isdigit() for c in h2_text):
                        if h2_text not in variant_desc_map:
                            variant_desc_map[h2_text] = desc_text
                            
        # Look in tables for '説明' or '特徴'
        for table in soup.select("table"):
            headers_td = [th.get_text(strip=True) for th in table.select("th")]
            if 'アイテム' in headers_td and ('説明' in headers_td or '特徴' in headers_td):
                idx_name = headers_td.index('アイテム')
                idx_desc = headers_td.index('説明') if '説明' in headers_td else headers_td.index('特徴')
                for tr in table.select("tr")[1:]:
                    cells = tr.select("td")
                    if len(cells) > max(idx_name, idx_desc):
                        # Some tables have item name and sub-name separated by <br>, let's extract properly
                        k_html = str(cells[idx_name])
                        # The key might be inside <br> tags, e.g., <td>■ジグ＆ワーミング<br />C65M/ML-SV･ST<br />26スペクター</td>
                        lines = re.split(r'<br\s*/?>', cells[idx_name].decode_contents())
                        # Look for alphanumeric patterns in the lines
                        for line in lines:
                            clean_line = BeautifulSoup(line, 'html.parser').get_text(strip=True)
                            if clean_line and re.search(r'[A-Z0-9]{3,}', clean_line):
                                k = clean_line
                                break
                        else:
                            k = cells[idx_name].get_text(strip=True)
                            
                        v = cells[idx_desc].get_text(strip=True)
                        if k and v:
                            variant_desc_map[k] = v

        if spec_table:
            headers = [th.get_text(strip=True) for th in spec_table.select("tr")[0].select("th, td")]
            
            for tr in spec_table.select("tr")[1:]:
                cells = [td.get_text(strip=True) for td in tr.select("td, th")]
                if len(cells) != len(headers):
                    continue
                    
                specs = dict(zip(headers, cells))
                
                item_name = specs.get('アイテム', '')
                if not item_name:
                    continue
                    
                import unicodedata
                
                def normalize_key(k):
                    k_norm = unicodedata.normalize('NFKC', k).upper().replace(" ", "").replace("　", "").replace("■", "")
                    k_norm = re.sub(r'[ー―‐－]', '-', k_norm)
                    return k_norm
                
                item_name_norm = normalize_key(item_name)
                
                # Look up the variant description
                v_desc = variant_desc_map.get(item_name, "")
                if not v_desc:
                    v_desc = variant_desc_map.get(unicodedata.normalize('NFKC', item_name), "")
                
                if not v_desc:
                    best_match_k = ""
                    best_match_v = ""
                    for k, v in variant_desc_map.items():
                        k_norm = normalize_key(k)
                        # We try the unsplit key first, as well as the split ones
                        sub_keys = [k_norm] + re.split(r'[/,、]', k_norm)
                        for sub_k in sub_keys:
                            sub_k = sub_k.strip()
                            if not sub_k: continue
                            
                            # Extract the SKU prefix from the description key (e.g. "C610MH" from "C610MHワイヤーベイト")
                            match_prefix = re.match(r"^[A-Z0-9\-\+\/・]+", sub_k)
                            sub_k_prefix = match_prefix.group(0) if match_prefix else sub_k
                            sub_k_prefix = sub_k_prefix.strip('-/・')
                            
                            # Additional checks for cases like "AGS130M-4-ROCKDANCECUSTOMF-"
                            dash_parts = sub_k.split('-')
                            possible_matches = [sub_k, sub_k_prefix]
                            if len(dash_parts) > 0 and dash_parts[0]:
                                possible_matches.append(dash_parts[0])
                            if len(dash_parts) > 1 and dash_parts[0] and dash_parts[1]:
                                possible_matches.append(f"{dash_parts[0]}-{dash_parts[1]}")
                                
                            matched = False
                            for pm in possible_matches:
                                if pm in item_name_norm or item_name_norm in pm:
                                    matched = True
                                    break
                            
                            if matched:
                                # Prioritize exact match or longest match
                                if not best_match_k or len(sub_k) > len(best_match_k):
                                    best_match_k = sub_k
                                    best_match_v = v
                    if best_match_v:
                        v_desc = best_match_v
                    
                    if not v_desc:
                        # Fallback: fuzzy matching with >= 0.8 ratio
                        # Extract the alphanumeric suffix from the item name (e.g. "C664LFS" from "ブラックレーベルC664LFS")
                        suffix_match = re.search(r"([A-Z0-9\-\+\/・]+)$", item_name_norm)
                        target_for_fuzzy = suffix_match.group(1) if suffix_match else item_name_norm
                        
                        best_ratio = 0
                        best_match_v_fuzzy = ""
                        for k, v in variant_desc_map.items():
                            k_norm = normalize_key(k)
                            sub_keys = [k_norm] + re.split(r'[/,、]', k_norm)
                            for sub_k in sub_keys:
                                sub_k = sub_k.strip()
                                if not sub_k: continue
                                
                                match_prefix = re.match(r"^[A-Z0-9\-\+\/・]+", sub_k)
                                sub_k_prefix = match_prefix.group(0) if match_prefix else sub_k
                                sub_k_prefix = sub_k_prefix.strip('-/・')
                                
                                ratio = difflib.SequenceMatcher(None, sub_k_prefix, target_for_fuzzy).ratio()
                                if ratio >= 0.80 and ratio > best_ratio:
                                    best_ratio = ratio
                                    best_match_v_fuzzy = v
                                    
                        if best_match_v_fuzzy:
                            v_desc = best_match_v_fuzzy

                variants.append({
                    "variant_name": item_name,
                    "variant_description": v_desc,
                    "raw_specs": specs
                })
        
        return {
            "model_name": model_name,
            "series_description": series_description,
            "url": url,
            "main_image_url": main_image_url,
            "local_image_path": local_image_path,
            "variants": variants
        }
        
    except Exception as e:
        print(f"  [{i+1}] Error: {e}")
        return None

def scrape_daiwa_rods():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    urls_file = os.path.join(base_dir, "../../../../GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_urls.json")
    
    if not os.path.exists(urls_file):
        print(f"Error: {urls_file} not found.")
        return
        
    with open(urls_file, "r", encoding="utf-8") as f:
        test_urls = json.load(f)
        
    results = []
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_url, i, url, len(test_urls)): i for i, url in enumerate(test_urls)}
        for future in as_completed(futures):
            res = future.result()
            if res:
                results.append(res)
            
    out_path = os.path.join(base_dir, "../../../../GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_normalized.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"\nDone! Scraped {len(results)} Daiwa rods. Saved to {out_path}")

if __name__ == "__main__":
    scrape_daiwa_rods()
