import json
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from curl_cffi import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from gear_data_paths import DATA_RAW_DIR

START_URL = "https://www.megabass.co.jp/site/freshwater/bass_rod/"
DATA_DIR = DATA_RAW_DIR
OUTPUT_PATH = DATA_DIR / "megabass_bass_rod_discovery.json"

HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.8,en;q=0.6,zh-CN;q=0.5",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122 Safari/537.36",
}


def fetch_soup(url):
    response = requests.get(
        url,
        headers=HEADERS,
        impersonate="chrome",
        timeout=25,
        verify=False,
    )
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")


def clean_text(value):
    return " ".join(str(value or "").split())


def normalize_url(url):
    return str(url or "").split("#", 1)[0].rstrip("/") + "/"


def ordered_unique(values):
    seen = set()
    out = []
    for value in values:
        key = normalize_url(value)
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(key)
    return out


def discover_series():
    soup = fetch_soup(START_URL)
    body = soup.select_one("div.category_home__body") or soup
    seen = set()
    series = []

    for anchor in body.select("a"):
        href = anchor.get("href") or ""
        label = clean_text(anchor.get_text(" ", strip=True))
        if not href.startswith("https://www.megabass.co.jp/site/freshwater/"):
            continue
        if href == START_URL:
            continue
        if any(token in href for token in ["lure", "reel", "custom_parts"]):
            continue
        key = normalize_url(href)
        if key in seen:
            continue
        seen.add(key)
        series.append({"series_label": label, "series_url": key})

    return series


def discover_products(series):
    rows = []
    for index, item in enumerate(series, start=1):
        soup = fetch_soup(item["series_url"])
        anchors = soup.select("ul.page_series__lineup a[href*='/products/']")
        if not anchors:
            anchors = [anchor for anchor in soup.select("a") if "/products/" in (anchor.get("href") or "")]
        product_urls = ordered_unique(urljoin(item["series_url"], anchor.get("href") or "") for anchor in anchors)
        rows.append({**item, "product_urls": product_urls, "product_count": len(product_urls)})
        print(f"[discover] {index:02d}/{len(series)} {item['series_label']}: {len(product_urls)}")
        time.sleep(0.25)
    return rows


def main():
    series = discover_series()
    rows = discover_products(series)
    payload = {
        "source_url": START_URL,
        "series_count": len(rows),
        "product_count": sum(row["product_count"] for row in rows),
        "series": rows,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[discover] wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
