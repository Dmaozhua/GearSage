import datetime
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse

from bs4 import BeautifulSoup
from curl_cffi import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_DIR = os.path.join(BASE_DIR, "GearSage-client/pkgGear/data_raw")
OUTPUT_FILE = os.path.join(DATA_DIR, "shimano_baitcasting_reel_normalized.json")

DEFAULT_ENTRY_URL = "https://fish.shimano.com/zh-CN/product/reel.html"
LIST_URL = "https://fish.shimano.com/zh-CN/product/list.html?pcat1=cg1SHIFCnReel&pcat2=cg2SHIFCnReelBaitcasting&pcat3=&pcat4=&fs=&series=&price_min=&price_max="
SITE_ROOT = "https://fish.shimano.com"


def normalize_space(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def clean_description(raw_text):
    text = str(raw_text or "")
    text = text.replace("阅读更多", "").replace("减少显示", "")
    lines = []
    for line in text.splitlines():
        normalized = normalize_space(line)
        if not normalized:
            continue
        if normalized == "※本页面相关产品数据为禧玛诺自身产品对比，内部测试所得。":
            continue
        lines.append(normalized)
    return "\n".join(lines).strip()


def safe_get(url):
    return requests.get(url, impersonate="chrome", verify=False)


def resolve_baitcasting_list_url(entry_url):
    normalized = normalize_space(entry_url)
    if not normalized:
        return LIST_URL
    if "cg2SHIFCnReelBaitcasting" in normalized:
        return normalized

    try:
        response = safe_get(normalized)
        response.raise_for_status()
        match = re.search(
            r'(/zh-CN/product/list\.html\?[^"\']*cg2SHIFCnReelBaitcasting[^"\']*)',
            response.text,
            re.IGNORECASE,
        )
        if match:
            return urllib.parse.urljoin(SITE_ROOT, match.group(1))
    except Exception:
        pass

    return LIST_URL


def get_baitcasting_urls(entry_url):
    list_url = resolve_baitcasting_list_url(entry_url)
    first = safe_get(list_url)
    first.raise_for_status()
    first_soup = BeautifulSoup(first.text, "html.parser")

    pages = {1}
    for link in first_soup.select('a[href*="page="]'):
        href = link.get("href") or ""
        match = re.search(r"page=(\d+)", href)
        if match:
            pages.add(int(match.group(1)))

    detail_urls = []
    seen = set()

    for page in sorted(pages):
        page_url = list_url if page == 1 else f"{list_url}&page={page}"
        response = safe_get(page_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        for anchor in soup.select('a[href*="/product/reel/baitcasting/"]'):
            href = anchor.get("href")
            if not href or not href.endswith(".html"):
                continue
            full_url = urllib.parse.urljoin(SITE_ROOT, href)
            if full_url in seen:
                continue
            seen.add(full_url)
            detail_urls.append(full_url)

    return detail_urls


def pick_main_image(page_soup):
    og_image = page_soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        return urllib.parse.urljoin(SITE_ROOT, og_image.get("content"))

    for img in page_soup.find_all("img"):
        src = img.get("src") or ""
        if "_main" in src:
            return urllib.parse.urljoin(SITE_ROOT, src)

    return ""


def find_specs_table(page_soup):
    for table in page_soup.find_all("table"):
        header_text = normalize_space(table.get_text(" ", strip=True))
        if "型号" in header_text and "齿轮比" in header_text:
            return table
    return None


def normalize_header(header):
    return (
        normalize_space(header)
        .replace("（", "(")
        .replace("）", ")")
        .replace(" ", "")
        .lower()
    )


def extract_environment(page_title):
    parts = [normalize_space(part) for part in str(page_title or "").split("|")]
    if len(parts) >= 2:
        return parts[1]
    return ""


def scrape_shimano_bc_reels():
    os.makedirs(DATA_DIR, exist_ok=True)

    entry_url = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SHIMANO_REEL_ENTRY_URL", DEFAULT_ENTRY_URL)
    detail_urls = get_baitcasting_urls(entry_url)
    print(f"Using entry URL: {entry_url}")
    print(f"Fetched {len(detail_urls)} baitcasting URLs from list pages.")

    results = []

    for index, url in enumerate(detail_urls, start=1):
        print(f"[{index}/{len(detail_urls)}] Scraping {url}")
        try:
            response = safe_get(url)
            if response.status_code != 200:
                print(f"  -> skip status={response.status_code}")
                continue

            page_soup = BeautifulSoup(response.text, "html.parser")

            title_el = page_soup.find("h1")
            title = normalize_space(title_el.get_text()) if title_el else ""
            if not title or title.startswith("Resource at "):
                print("  -> skip invalid product page")
                continue

            page_title_el = page_soup.find("title")
            page_title = normalize_space(page_title_el.get_text()) if page_title_el else ""

            desc_el = (
                page_soup.select_one(".product__description_section__content")
                or page_soup.select_one(".product__description_section")
            )
            desc = clean_description(desc_el.get_text("\n", strip=True) if desc_el else "")

            year_matches = re.findall(r"(20\d{2})年", f"{page_title}\n{desc}")
            model_year = max(year_matches) if year_matches else ""

            main_img = pick_main_image(page_soup)
            specs_table = find_specs_table(page_soup)
            if specs_table is None:
                print("  -> skip missing specs table")
                continue

            headers = [normalize_space(th.get_text()) for th in specs_table.find_all("th")]
            body_rows = specs_table.find_all("tr")[1:]
            variants = []

            for row in body_rows:
                cells = [normalize_space(td.get_text()) for td in row.find_all(["td", "th"])]
                if len(cells) != len(headers) or not any(cells):
                    continue

                raw_specs = dict(zip(headers, cells))
                normalized_specs = {normalize_header(h): c for h, c in zip(headers, cells)}
                variant_suffix = normalized_specs.get("型号", "")

                spool_combo = (
                    normalized_specs.get("线杯径(mm)/幅(mm)", "")
                    or normalized_specs.get("线杯径(mm)/一转(mm)", "")
                )

                variants.append(
                    {
                        "variant_name": f"{title} {variant_suffix}".strip(),
                        "sku_suffix": variant_suffix,
                        "specs": {
                            "gear_ratio": normalized_specs.get("齿轮比", ""),
                            "max_drag_kg": normalized_specs.get("最大卸力(kg)", ""),
                            "max_durability_kg": normalized_specs.get("最大耐久力(kg)", ""),
                            "weight_g": normalized_specs.get("重量(g)", ""),
                            "spool_diameter_stroke_mm": spool_combo,
                            "nylon_no_m": normalized_specs.get("尼龙线容线量(号-m)", ""),
                            "nylon_lb_m": normalized_specs.get("尼龙线容线量(lb-m)", "")
                            or normalized_specs.get("尼龙线容线量(磅-m)", ""),
                            "fluoro_no_m": normalized_specs.get("氟碳线容线量(号-m)", ""),
                            "fluoro_lb_m": normalized_specs.get("氟碳线容线量(lb-m)", "")
                            or normalized_specs.get("氟碳线容线量(磅-m)", ""),
                            "pe_no_m": normalized_specs.get("pe线容线量(号-m)", ""),
                            "cm_per_turn": normalized_specs.get("最大收线长(cm/手把转一圈)", ""),
                            "handle_length_mm": normalized_specs.get("手把长度(mm)", ""),
                            "bearings": normalized_specs.get("培林数/罗拉", ""),
                            "price": normalized_specs.get("市场参考价", ""),
                            "product_code": normalized_specs.get("商品编码", ""),
                        },
                        "raw_specs": raw_specs,
                    }
                )

            category_match = re.search(r"/baitcasting/([^/]+)/", url)
            category_path = category_match.group(1) if category_match else ""

            results.append(
                {
                    "brand": "shimano",
                    "kind": "baitcasting",
                    "source_url": url,
                    "url": url,
                    "model_name": title,
                    "model_year": model_year,
                    "description": desc,
                    "page_title": page_title,
                    "official_environment": extract_environment(page_title),
                    "category_path": category_path,
                    "main_image_url": main_img,
                    "variants": variants,
                    "scraped_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "raw_data_hash": hashlib.sha256(response.text.encode("utf-8")).hexdigest(),
                }
            )
            time.sleep(0.4)
        except Exception as exc:
            print(f"  -> error {exc}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(results, file, ensure_ascii=False, indent=2)

    print(f"Done! Scraped {len(results)} baitcasting reels. Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    scrape_shimano_bc_reels()
