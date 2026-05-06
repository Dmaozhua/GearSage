import json
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from curl_cffi import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from gear_data_paths import DATA_RAW_DIR

ENTRYPOINTS = [
    ("Bass Rod", "https://www.megabass.co.jp/site/freshwater/bass_rod/"),
    ("Trout Rod", "https://www.megabass.co.jp/site/freshwater/trout_rod/"),
]

DATA_DIR = DATA_RAW_DIR
OUTPUT_PATH = DATA_DIR / "megabass_rod_official_order.json"

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


def discover_series(entry_url):
    soup = fetch_soup(entry_url)
    body = soup.select_one("div.category_home__body") or soup
    rows = []
    seen = set()

    for anchor in body.select("a"):
        href = anchor.get("href") or ""
        label = clean_text(anchor.get_text(" ", strip=True))
        if not href.startswith("https://www.megabass.co.jp/site/freshwater/"):
            continue
        if normalize_url(href) == normalize_url(entry_url):
            continue
        if any(token in href for token in ["lure", "reel", "custom_parts"]):
            continue
        key = normalize_url(href)
        if key in seen:
            continue
        seen.add(key)
        rows.append({"series_label": label, "series_url": key})

    return rows


def discover_products(series_url):
    soup = fetch_soup(series_url)
    anchors = soup.select("ul.page_series__lineup a[href*='/products/']")
    if not anchors:
        anchors = [a for a in soup.select("a") if "/products/" in (a.get("href") or "")]
    return ordered_unique(urljoin(series_url, anchor.get("href") or "") for anchor in anchors)


def main():
    all_series = []
    for category, entry_url in ENTRYPOINTS:
        series_rows = discover_series(entry_url)
        print(f"[order] {category}: {len(series_rows)} series")
        for series_index, row in enumerate(series_rows, start=1):
            products = discover_products(row["series_url"])
            all_series.append(
                {
                    "category": category,
                    "series_index": len(all_series),
                    **row,
                    "product_count": len(products),
                    "product_urls": products,
                }
            )
            print(f"[order]   {series_index:02d}/{len(series_rows)} {row['series_label']}: {len(products)}")
            time.sleep(0.25)

    payload = {
        "entrypoints": [{"category": c, "url": u} for c, u in ENTRYPOINTS],
        "series_count": len(all_series),
        "product_count": sum(row["product_count"] for row in all_series),
        "series": all_series,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[order] wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
