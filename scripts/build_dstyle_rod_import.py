import json
import re
import shutil
import ssl
import time
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from openpyxl import Workbook

from gear_data_paths import DATA_RAW_DIR

ROOT = Path("/Users/tommy/GearSage")
DATA_DIR = DATA_RAW_DIR
CACHE_DIR = DATA_DIR / "dstyle_rods_cache"
DETAIL_CACHE_DIR = CACHE_DIR / "details"
IMAGE_DIR = Path("/Users/tommy/Pictures/images/dstyle_rods")
OLD_IMAGE_DIR = Path("/Users/tommy/Pictures/images_old_copy/dstyle_rods")

LIST_URL = "https://dstyle-lure.co.jp/products/"
NORMALIZED_PATH = DATA_DIR / "dstyle_rod_normalized.json"
EVIDENCE_PATH = DATA_DIR / "dstyle_rod_whitelist_evidence.json"
XLSX_PATH = DATA_DIR / "dstyle_rod_import.xlsx"
STATIC_IMAGE_BASE = "https://static.gearsage.club/gearsage/Gearimg/images/dstyle_rods"

BRAND_ID = 114
ROD_PREFIX = "DSR"
DETAIL_PREFIX = "DSRD"


def fit_style_tags_for_item(model, title="", description="", variants=None):
    variants = variants or []
    tags = ["bass"]
    text = n(" ".join([model, title, description])).lower()
    travel_words = ["travel", "pack rod", "パック", "振出", "多節", "多节"]
    has_travel_word = any(word in text for word in travel_words)
    has_gt_two_piece_text = bool(re.search(r"[3-9]\s*(?:piece|pc|ピース|節|节)", text, re.I))
    has_explicit_two_piece_text = bool(re.search(r"2\s*(?:piece|pc|ピース|節|节)", text, re.I))
    has_gt_two_pieces = False
    for variant in variants:
        match = re.search(r"\d+", n(variant.get("pieces")))
        if match and int(match.group(0)) > 2:
            has_gt_two_pieces = True
            break
    if has_gt_two_pieces or has_gt_two_piece_text or (has_travel_word and not has_explicit_two_piece_text):
        tags.append("旅行")
    return ",".join(tags)

ROD_HEADERS = [
    "id", "brand_id", "model", "model_cn", "model_year", "alias",
    "type_tips", "fit_style_tags", "images", "created_at", "updated_at",
    "series_positioning", "main_selling_points", "official_reference_price", "market_status",
    "Description", "player_positioning", "player_selling_points",
]

ROD_DETAIL_HEADERS = [
    "id", "rod_id", "TYPE", "SKU", "POWER", "TOTAL LENGTH", "Action", "PIECES",
    "CLOSELENGTH", "WEIGHT", "Tip Diameter", "LURE WEIGHT", "Line Wt N F",
    "PE Line Size", "Handle Length", "Reel Seat Position", "CONTENT CARBON",
    "Market Reference Price", "AdminCode", "Service Card", " Jig Weight",
    "Squid Jig Size", "Sinker Rating", "created_at", "updated_at",
    "LURE WEIGHT (oz)", "Sale Price", "Joint Type", "Code Name", "Fly Line",
    "Grip Type", "Reel Size", "guide_layout_type", "guide_use_hint",
    "recommended_rig_pairing", "hook_keeper_included", "sweet_spot_lure_weight_real", "official_environment",
    "player_environment", "player_positioning", "player_selling_points",
    "Description", "product_technical", "Extra Spec 1", "Extra Spec 2",
]

WHITELIST_EVIDENCE = {
    "DBTS-61L": {
        "source_site": "tackledb.uosoku.com",
        "source_url": "https://tackledb.uosoku.com/tackle?id=633",
        "matched_category": "バス釣り",
        "target_fish": ["ブラックバス"],
        "matched_field": "七色ダム",
        "matched_lures": ["マイティーストレート 3.8in"],
        "matched_rigs": ["ネコリグ"],
        "supported_fields": ["player_environment", "player_positioning", "player_selling_points", "guide_use_hint"],
        "confidence": "high",
        "notes": "青木大介のネコリグ実例。DBTS-61L は泛用より精細輕量寄りに補正する。",
        "player_environment": "淡水 Bass / 水庫",
        "player_positioning": "Bass 精細輕量",
        "player_selling_points": "ネコリグや細線ライトリグ向けの実例があり、食わせ重視の精細操作に強い",
        "guide_use_hint": "精細ライトリグ：細線で軽量ワームを扱いやすく、ネコリグや小型ワームの操作と軽い咬みを拾いやすい。",
    },
    "DBTS-66ML-S-MIDSP": {
        "source_site": "tackledb.uosoku.com",
        "source_url": "https://tackledb.uosoku.com/tackle?id=10602",
        "matched_category": "バス釣り",
        "target_fish": ["ブラックバス"],
        "matched_field": "よし八池",
        "matched_lures": ["MMZ デカ"],
        "matched_rigs": ["ノーシンカーリグ"],
        "supported_fields": ["player_environment", "player_positioning", "player_selling_points", "guide_use_hint"],
        "confidence": "high",
        "notes": "tackledb が mid strolling と small plug long cast を明示。現行 mid 判定を補強する。",
        "player_environment": "淡水 Bass / 池・野池",
        "player_positioning": "Bass 中層游動 / Midstrolling",
        "player_selling_points": "ミドスト、ノーシンカー、PE 使用の中層操作に向く実例がある",
        "guide_use_hint": "中層游動：PE とリーダーで線弧を作りやすく、ミドスト、ノーシンカー、サイト寄りの操作が安定する。",
    },
    "DBTS-610L-S": {
        "source_site": "tackledb.uosoku.com",
        "source_url": "https://tackledb.uosoku.com/collection?rod=%E3%83%96%E3%83%AB%E3%83%BC%E3%83%88%E3%83%AC%E3%83%83%E3%82%AF+DBTS-610L-S",
        "matched_category": "バス釣り",
        "target_fish": ["ブラックバス"],
        "matched_field": "弁慶堀 / 塩津浜緑地公園",
        "matched_lures": ["C-4ジグ 1.8g", "C-4シュリンプ", "ジジル 85", "シグレ"],
        "matched_rigs": ["ライトリグ", "表層系プラグ"],
        "supported_fields": ["player_environment", "player_positioning", "player_selling_points", "guide_use_hint"],
        "confidence": "medium",
        "notes": "collection 型ページだが、ライトリグから表層プラグ、ロングキャスト適性の補助証拠になる。",
        "player_environment": "淡水 Bass / 岸釣り・ボート",
        "player_positioning": "Bass 精細遠投 / 輕量泛用",
        "player_selling_points": "ライトリグや表層系プラグを距離を出して扱う用途に寄せやすい",
        "guide_use_hint": "軽量遠投：細線でライトリグや表層プラグを遠くへ届けやすく、ロングキャスト後の操作感も保ちやすい。",
    },
    "DBTC-610MH": {
        "source_site": "tackledb.uosoku.com",
        "source_url": "https://tackledb.uosoku.com/tackle?id=7212",
        "matched_category": "バス釣り",
        "target_fish": ["ブラックバス"],
        "matched_field": "武具池",
        "matched_lures": ["ジャックハンマー TG 1/2oz", "ジャスターシャッド 4.2インチ"],
        "matched_rigs": ["ブレーデッドジグ"],
        "supported_fields": ["player_environment", "player_positioning", "player_selling_points", "guide_use_hint"],
        "confidence": "high",
        "notes": "ブレーデッドジグ実例。泛用より巻物/硬餌寄りに補正する。",
        "player_environment": "淡水 Bass / 池・野池",
        "player_positioning": "Bass 巻物 / 硬餌",
        "player_selling_points": "チャターやシャッドテールなど中量級の移動餌を巻きながら使う場面に向く",
        "guide_use_hint": "ブレーデッドジグ：振動系ルアーを巻き続けても姿勢を保ちやすく、障害物接触後の立て直しと追い食いに対応しやすい。",
    },
    "DBTC-68M": {
        "source_site": "tackledb.uosoku.com",
        "source_url": "https://tackledb.uosoku.com/tackle?id=8290",
        "matched_category": "バス釣り",
        "target_fish": ["ブラックバス"],
        "matched_field": "山中湖",
        "matched_lures": ["ソニックサイド", "リアライザー Jr."],
        "matched_rigs": ["硬餌 / 巻物"],
        "supported_fields": ["player_environment", "player_positioning", "player_selling_points", "guide_use_hint"],
        "confidence": "medium",
        "notes": "硬餌実例はあるが、公式はバーサタイル寄り。硬餌を含む泛用として扱う。",
        "player_environment": "淡水 Bass / 湖・ボート",
        "player_positioning": "Bass 硬餌泛用",
        "player_selling_points": "ミドルクラスの硬餌や巻物を含めた泛用ベイトとして使いやすい",
        "guide_use_hint": "硬餌泛用：中量級プラグの巻きと止めを切り替えやすく、湖やボートでのサーチにも使いやすい。",
    },
    "DBTC-71MH-PF": {
        "source_site": "tackledb.uosoku.com",
        "source_url": "https://tackledb.uosoku.com/tackle?id=9724",
        "matched_category": "バス釣り",
        "target_fish": ["ブラックバス"],
        "matched_field": "桜ヶ池",
        "matched_lures": ["スカッターフロッグ"],
        "matched_rigs": ["フロッグ", "パワーフィネス"],
        "supported_fields": ["player_environment", "player_positioning", "player_selling_points", "guide_use_hint"],
        "confidence": "high",
        "notes": "フロッグ用 PE とカバー攻略の実例。強障礙判定を補強する。",
        "player_environment": "淡水 Bass / カバー・池",
        "player_positioning": "Bass 強障礙 / Frog",
        "player_selling_points": "フロッグやカバー周りで太め PE を使い、魚を止めて引き出す用途に向く",
        "guide_use_hint": "Frog / カバー：太め PE の出線と回収を安定させ、フロッグの着水後操作とカバーからの引き離しを支えやすい。",
    },
}

SPEC_IMAGE_PATCHES = {
    "DBTS-68L": {
        "sku": "DBTS-SS-68L",
        "admin_code": "4571527862762",
        "total_length": "6’8″",
        "lure_weight_oz": "1/32~1/4",
        "line_wt_nf": "3~8",
        "pe_line_size": "0.4~0.8",
        "action": "Regular Fast",
        "weight": "93g",
        "market_reference_price": "¥28,500 （税込み¥31,350）",
    },
    "DBTS-SS-63ML": {
        "admin_code": "4571527863554",
        "total_length": "6’3″",
        "lure_weight_oz": "1/16~1/4",
        "line_wt_nf": "4~8",
        "pe_line_size": "0.6~1.2",
        "action": "Fast",
        "weight": "93g",
        "market_reference_price": "¥28,000 （税込み¥30,800）",
    },
    "DBTC-64MH": {
        "sku": "DBTC-SS-64MH",
        "admin_code": "4571527862779",
        "total_length": "6’4″",
        "lure_weight_oz": "3/16~3/4",
        "line_wt_nf": "10~20",
        "pe_line_size": "",
        "action": "Regular Fast",
        "weight": "108g",
        "market_reference_price": "¥29,500 （税込み¥32,450）",
    },
    "DBTC-SS-69MH+": {
        "admin_code": "4571527863561",
        "total_length": "6’9″",
        "lure_weight_oz": "3/16~3/4",
        "line_wt_nf": "10~20",
        "pe_line_size": "",
        "action": "Regular Fast",
        "weight": "131g",
        "market_reference_price": "¥29,500 （税込み¥32,450）",
    },
    "DBTS-612UL+-S": {
        "admin_code": "4571527862540",
        "total_length": "6’1″",
        "lure_weight_oz": "1/32~3/16",
        "line_wt_nf": "2.5~6",
        "pe_line_size": "",
        "action": "Fast",
        "weight": "80g",
        "market_reference_price": "¥28,000 （税込み¥30,800）",
    },
    "DBTS-662L": {
        "admin_code": "4571527862557",
        "total_length": "6’6″",
        "lure_weight_oz": "1/32~1/4",
        "line_wt_nf": "3~8",
        "pe_line_size": "",
        "action": "Fast",
        "weight": "86g",
        "market_reference_price": "¥28,500 （税込み¥31,350）",
    },
    "DBTS-662M": {
        "admin_code": "4571527862564",
        "total_length": "6’6″",
        "lure_weight_oz": "1/16~3/8",
        "line_wt_nf": "4~8",
        "pe_line_size": "0.6~1.5",
        "action": "Fast",
        "weight": "91g",
        "market_reference_price": "¥28,500 （税込み¥31,350）",
    },
    "DBTS-6102ML-S": {
        "admin_code": "4571527862571",
        "total_length": "6’10″",
        "lure_weight_oz": "1/16~3/8",
        "line_wt_nf": "4~8",
        "pe_line_size": "0.4~1",
        "action": "Regular Fast",
        "weight": "85g",
        "market_reference_price": "¥29,000 （税込み¥31,900）",
    },
    "DBTC-6102M": {
        "admin_code": "4571527862588",
        "total_length": "6’10″",
        "lure_weight_oz": "3/16~5/8",
        "line_wt_nf": "8~16",
        "pe_line_size": "",
        "action": "Regular Fast",
        "weight": "113g",
        "market_reference_price": "¥29,000 （税込み¥31,900）",
    },
    "DBTC-6102MH": {
        "admin_code": "4571527862595",
        "total_length": "6’10″",
        "lure_weight_oz": "3/16~3/4",
        "line_wt_nf": "8~20",
        "pe_line_size": "",
        "action": "Regular Fast",
        "weight": "123g",
        "market_reference_price": "¥29,000 （税込み¥31,900）",
    },
    "DBTC-702H": {
        "admin_code": "4571527862601",
        "total_length": "7’0″",
        "lure_weight_oz": "3/16~1",
        "line_wt_nf": "10~20",
        "pe_line_size": "",
        "action": "Regular Fast",
        "weight": "128g",
        "market_reference_price": "¥29,500 （税込み¥32,450）",
    },
    "DBTS-642UL+-MIDSP": {
        "admin_code": "4571527863745",
        "total_length": "6’4″",
        "lure_weight_oz": "1/32~3/16",
        "line_wt_nf": "2.5~6",
        "pe_line_size": "",
        "action": "Regular Fast",
        "weight": "80g",
        "market_reference_price": "¥28,000 （税込み¥30,800）",
    },
    "DBTS-632UL/L-S": {
        "admin_code": "4571527863752",
        "total_length": "6’3″",
        "lure_weight_oz": "1/32~1/4",
        "line_wt_nf": "3~8",
        "pe_line_size": "0.4~1",
        "action": "Fast",
        "weight": "81g",
        "market_reference_price": "¥28,000 （税込み¥30,800）",
    },
    "DBTC-662ML-BF": {
        "admin_code": "4571527863769",
        "total_length": "6’6″",
        "lure_weight_oz": "1/8~1/2",
        "line_wt_nf": "6~12",
        "pe_line_size": "",
        "action": "Regular Fast",
        "weight": "110g",
        "market_reference_price": "¥28,500 （税込み¥31,350）",
    },
    "DBTC-672MH-S": {
        "admin_code": "4571527863776",
        "total_length": "6’7″",
        "lure_weight_oz": "3/16~3/4",
        "line_wt_nf": "8~16",
        "pe_line_size": "",
        "action": "Fast",
        "weight": "117g",
        "market_reference_price": "¥29,000 （税込み¥31,900）",
    },
    "DBTC-6102XH": {
        "admin_code": "4571527863783",
        "total_length": "6’10″",
        "lure_weight_oz": "max4oz",
        "line_wt_nf": "max 30",
        "pe_line_size": "",
        "action": "Regular",
        "weight": "172g",
        "market_reference_price": "¥29,500 （税込み¥32,450）",
    },
    "DBTS-60XUL-S": {
        "admin_code": "4571527862106",
        "total_length": "6’0″",
        "lure_weight_oz": "1/48~1/8",
        "line_wt_nf": "2~5",
        "pe_line_size": "",
        "action": "Fast",
        "weight": "72g",
        "market_reference_price": "¥39,500 （税込み¥43,450）",
    },
    "DBTS-67UL-S": {
        "admin_code": "4571527862113",
        "total_length": "6’7″",
        "lure_weight_oz": "1/48~1/8",
        "line_wt_nf": "2~5",
        "pe_line_size": "",
        "action": "Fast",
        "weight": "78g",
        "market_reference_price": "¥39,500 （税込み¥43,450）",
    },
}

SERIES_VARIANT_ORDER = {
    "BLUE TREK SABER SERIES": [
        "DBTS-SS-63ML",
        "DBTS-SS-68L",
        "DBTC-SS-64MH",
        "DBTC-SS-69MH+",
    ],
}


def n(value):
    return re.sub(r"\s+", " ", str(value or "").replace("\u00a0", " ")).strip()


def full_width_to_ascii(value):
    return "".join(chr(ord(ch) - 0xFEE0) if "！" <= ch <= "～" else ch for ch in str(value or ""))


def request_bytes(url):
    parsed = urlparse(url)
    safe_url = urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            quote(parsed.path),
            parsed.params,
            quote(parsed.query, safe="=&"),
            parsed.fragment,
        )
    )
    ctx = ssl._create_unverified_context()
    req = Request(
        safe_url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        },
    )
    with urlopen(req, timeout=45, context=ctx) as response:
        return response.read()


def cached_html(url, cache_path):
    if cache_path.exists():
        return cache_path.read_text("utf-8", errors="ignore")
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    html = request_bytes(url).decode("utf-8", errors="ignore")
    cache_path.write_text(html, encoding="utf-8")
    time.sleep(0.7)
    return html


def slug_from_url(url):
    return Path(urlparse(url).path.rstrip("/")).name or "dstyle"


def safe_filename(value):
    text = n(full_width_to_ascii(value))
    text = re.sub(r"[^A-Za-z0-9._-]+", "_", text)
    return re.sub(r"_+", "_", text).strip("_") or "dstyle_rod"


def clean_model(title):
    text = n(title)
    text = re.sub(r"（.*?）", "", text)
    text = re.sub(r"\(.*?\)", "", text)
    text = text.split(" / ")[0].strip()
    replacements = {
        "BLUE TREK 2ピースモデル": "BLUE TREK 2 Piece",
        "BLUE TREK ブルートレック": "BLUE TREK",
    }
    return replacements.get(text, text)


def discover_rod_pages():
    html = cached_html(LIST_URL, CACHE_DIR / "products.html")
    soup = BeautifulSoup(html, "html.parser")
    rods = []
    in_rod = False
    seen = set()
    for el in soup.find_all(["h2", "a"]):
        text = n(el.get_text(" ", strip=True))
        if el.name == "h2" and "ROD" in text:
            in_rod = True
            continue
        if el.name == "h2" and in_rod and "ROD" not in text:
            in_rod = False
        if not in_rod or el.name != "a":
            continue
        href = el.get("href", "")
        if "/products/" not in href or not text:
            continue
        url = urljoin(LIST_URL, href)
        if url in seen:
            continue
        seen.add(url)
        rods.append({"title": text, "url": url})
    return rods


def sku_match(text):
    value = n(full_width_to_ascii(text)).replace("＋", "+")
    match = re.search(r"\b(?:DHRS|DHRC|DBTS|DBTC)(?:-[A-Z]{1,3})?-[A-Z0-9+/+-]+", value, re.I)
    return match.group(0).upper() if match else ""


def infer_type(sku, raw_type=""):
    text = f"{sku} {raw_type}".upper()
    if "CAST" in text or "BAIT" in text or "DHRC" in text or "DBTC" in text:
        return "C"
    if "SPIN" in text or "DHRS" in text or "DBTS" in text:
        return "S"
    return ""


def infer_power(sku):
    text = n(full_width_to_ascii(sku)).replace("＋", "+").upper()
    match = re.search(
        r"\d{2,4}((?:XXXH|XXH|XH|SUL|XUL|MH|ML|UL|H|M|L)\+?"
        r"(?:/(?:XXXH|XXH|XH|SUL|XUL|MH|ML|UL|H|M|L)\+?)?(?:-LM)?)",
        text,
    )
    return match.group(1) if match else ""


def parse_model_year(text):
    match = re.search(r"\b(20\d{2})\s*Model\b", n(text), re.I)
    return match.group(1) if match else ""


def code_name_from_heading(text):
    value = full_width_to_ascii(text).replace("＋", "+")
    value = re.sub(r"\b(?:DHRS|DHRC|DBTS|DBTC)(?:-[A-Z]{1,3})?-[A-Z0-9+/+-]+", "", value, flags=re.I)
    value = re.sub(r"/\s*20\d{2}\s*Model", "", value, flags=re.I)
    value = re.sub(r"\b20\d{2}\s*NEW\s*ITEM\b", "", value, flags=re.I)
    return n(value).strip(" /")


def split_line(value):
    text = n(value).replace("～", "~").replace("〜", "~")
    if re.match(r"^PE\b", text, re.I):
        return "", re.sub(r"^PE\s*", "", text, flags=re.I)
    if "/" not in text:
        return text, ""
    left, right = [n(part) for part in text.split("/", 1)]
    return left, re.sub(r"^PE\s*", "", right, flags=re.I)


def normalize_price(parts):
    return n(" ".join(part for part in parts if part)).replace("税込み", "税込")


def table_rows(soup):
    rows = []
    seen = set()
    for table in soup.find_all("table"):
        parsed = []
        for tr in table.find_all("tr"):
            cells = [n(cell.get_text(" ", strip=True)) for cell in tr.find_all(["th", "td"])]
            cells = [cell for cell in cells if cell]
            if cells:
                parsed.append(cells)
        if not parsed:
            continue
        signature = json.dumps(parsed, ensure_ascii=False)
        if signature in seen:
            continue
        seen.add(signature)
        rows.extend(parsed)
    return rows


def variant_from_table_row(row, page_url):
    sku = sku_match(row[0]) or (sku_match(row[1]) if len(row) > 1 else "")
    if not sku:
        return None

    if re.match(r"^\d{12,13}$", row[0]) and len(row) >= 10:
        has_type = row[2].lower() in {"spinning", "baitcasting", "casting", "bait"}
        raw_type = row[2] if has_type else ""
        code_name = "" if has_type else row[2]
        total_length = row[3]
        extra_length = row[4]
        lure_oz = row[5]
        line, pe = split_line(row[6])
        action = row[7]
        weight = row[8]
        price = normalize_price(row[9:10])
        extra_2 = n(" ".join(row[10:])) if len(row) > 10 else ""
        admin_code = row[0]
    else:
        raw_type = ""
        code_name = ""
        total_length = row[1] if len(row) > 1 else ""
        extra_length = row[2] if len(row) > 2 else ""
        lure_oz = row[3] if len(row) > 3 else ""
        line, pe = split_line(row[4] if len(row) > 4 else "")
        action = row[5] if len(row) > 5 else ""
        weight = row[6] if len(row) > 6 else ""
        price = normalize_price(row[7:9])
        extra_2 = ""
        admin_code = ""

    master_description = extract_master_description(soup)
    return {
        "source_url": page_url,
        "sku": sku,
        "type": infer_type(sku, raw_type),
        "power": infer_power(sku),
        "total_length": total_length,
        "action": action,
        "pieces": "",
        "close_length": "",
        "weight": "" if n(weight).lower() == "g" else weight,
        "lure_weight_oz": lure_oz,
        "line_wt_nf": line,
        "pe_line_size": pe,
        "market_reference_price": price,
        "admin_code": admin_code,
        "code_name": code_name,
        "model_year": parse_model_year(extra_2),
        "description": "",
        "extra_spec_1": extra_length,
        "extra_spec_2": extra_2,
    }


def clean_description(text):
    text = n(text)
    text = re.sub(r"^(Detail 詳細|How to 使い方|Movie 動画|Category)\s*", "", text)
    return text[:900]


def variant_sections(soup):
    sections = {}
    current = None
    detail_started = False

    for el in soup.find_all(["h2", "h3", "h4", "h5", "p", "li"]):
        text = n(el.get_text(" ", strip=True))
        if not text:
            continue
        if el.name == "h3" and re.search(r"Detail|How to|Movie|Category", text):
            detail_started = True
        if detail_started:
            continue

        sku = sku_match(text) if el.name in {"h2", "h4"} else ""
        if sku:
            if current:
                sections[current["sku"]] = {
                    "sku": current["sku"],
                    "code_name": current["code_name"],
                    "model_year": current["model_year"],
                    "description": clean_description(" ".join(current["parts"])),
                }
            code_name = code_name_from_heading(text)
            current = {
                "sku": sku,
                "code_name": code_name,
                "model_year": parse_model_year(text),
                "parts": [code_name] if code_name else [],
            }
            continue

        if not current:
            continue
        if el.name in {"h5", "p", "li"} and len(text) >= 4:
            current["parts"].append(text)
        if len(" ".join(current["parts"])) > 850:
            sections[current["sku"]] = {
                "sku": current["sku"],
                "code_name": current["code_name"],
                "model_year": current["model_year"],
                "description": clean_description(" ".join(current["parts"])),
            }
            current = None

    if current:
        parts = []
        sections[current["sku"]] = {
            "sku": current["sku"],
            "code_name": current["code_name"],
            "model_year": current["model_year"],
            "description": clean_description(" ".join(current["parts"])),
        }
    return sections


def extract_master_description(soup):
    pieces = []
    for el in soup.find_all(["h1", "h2", "h3", "h4", "p"]):
        text = n(el.get_text(" ", strip=True))
        if not text or text == "DSTYLE" or sku_match(text):
            if sku_match(text):
                break
            continue
        if re.search(r"PRODUCTS 製品情報|トップページ|Category", text):
            continue
        pieces.append(text)
        if len(" ".join(pieces)) > 500:
            break
    return clean_description(" ".join(pieces))


def pick_main_image(soup, title, page_url):
    candidates = []
    model_key = clean_model(title).lower()
    for order, img in enumerate(soup.find_all("img")):
        raw = img.get("src") or img.get("data-src") or ""
        if not raw:
            continue
        src = urljoin(page_url, raw)
        alt = n(img.get("alt", ""))
        low = src.lower()
        name = Path(urlparse(src).path).name
        if low.startswith("data:"):
            continue
        if re.search(r"logo|banner_sns|icon|instagram|twitter|facebook|blank|loader", low):
            continue
        if re.search(r"600_80|タイトルなし|スペック|spec|x45|svf|air|sensor|seat|_200\b|200\.", name, re.I):
            continue
        score = 1
        if alt and (alt in title or title in alt):
            score = 5
        elif any(part and part in low for part in re.split(r"[\s_/()-]+", model_key)):
            score = 4
        elif "/wp-content/uploads/" in low:
            score = 2
        candidates.append((score, -order, src))
    candidates.sort(reverse=True)
    return candidates[0][2] if candidates else ""


def download_main_image(url, rod_id, model):
    if not url:
        return ""
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(urlparse(url).path).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".jpg"
    filename = f"{rod_id}_{safe_filename(model)}{ext}"
    local_path = IMAGE_DIR / filename
    old_path = OLD_IMAGE_DIR / filename
    for old_file in IMAGE_DIR.glob(f"{rod_id}_*"):
        if old_file != local_path:
            old_file.unlink()
    if old_path.exists():
        shutil.copyfile(old_path, local_path)
        return f"{STATIC_IMAGE_BASE}/{filename}"
    try:
        local_path.write_bytes(request_bytes(url))
        time.sleep(0.4)
        return f"{STATIC_IMAGE_BASE}/{filename}"
    except Exception:
        return ""


def guide_layout_text(page_text):
    text = n(page_text)
    if re.search(r"チタン.*Sic|チタン、Sic|Titanium.*SiC", text, re.I):
        return "鈦框 SiC 導環：降低前端重量，細線操作與咬口回饋更清楚"
    if re.search(r"ステンレス\s*SIC|ステンレスSIC|SiC|Sic", text, re.I):
        return "不鏽鋼 SiC 導環：兼顧耐用與出線穩定，Bass 多技法拋投和控線更可靠"
    return ""


def player_fields(sku, description, rod_type):
    text = f"{sku} {description}".lower()
    env = "淡水 Bass"
    if any(key in text for key in ["frog", "cover", "heavy", "dagger", "big bait", "power finesse", "power fishing", "ビッグベイト", "ビックベイト", "ヘビー", "カバー", "フロッグ", "パワー系"]):
        pos = "Bass 強障礙 / 強力"
        sell = "偏重障礙區、重餌或強力控魚，適合需要更高竿身支撐的場景"
    elif any(key in text for key in ["midsp", "midstroll", "finesse swim", "ミドスト", "ホバスト", "swimming"]):
        pos = "Bass 中層游動 / Midstrolling"
        sell = "中層游動、抖動和細線控餌更明確，適合需要穩定線弧與咬口判斷的釣法"
    elif any(key in text for key in ["fast moving", "ファストムービング", "crank", "クランク", "シャッド", "ミノー", "トップウォーター", "spinner", "スピナーベイト"]):
        pos = "Bass 巻物 / 硬餌"
        sell = "以硬餌和移動餌為主，重視穩定拋投、泳姿追隨與連續收線時的咬口承接"
    elif any(key in text for key in ["bait finesse", "bf"]):
        pos = "Bass BFS / 輕量槍柄"
        sell = "以槍柄系統處理較輕釣組，兼顧拋投準度、控線與障礙邊緣操作"
    elif any(key in text for key in ["finesse", "ul", "light", "shake", "フィネス"]):
        pos = "Bass 精細輕量"
        sell = "輕量軟餌、小型硬餌和高壓場景適配，重點在精準操作與細微咬口回饋"
    else:
        pos = "Bass 泛用"
        sell = "淡水 Bass 多技法覆蓋，適合軟餌、硬餌和移動餌之間切換"
    if rod_type == "C" and "精細" in pos:
        pos = "Bass BFS / 輕量槍柄"
    return env, pos, sell


def guide_use_hint(positioning):
    if "強障礙" in positioning:
        return "Bass 強力場景：拋投、控線和提魚支撐更穩，障礙邊緣或重餌操作時更容易保持主導權。"
    if "Midstrolling" in positioning:
        return "中層游動：線弧和竿尖回彈更容易控制，連續抖動、游動姿態和短咬判斷更清楚。"
    if "BFS" in positioning:
        return "BFS 輕量槍柄：小釣組出線與落點控制更直接，近中距離精準拋投和障礙邊緣控線更穩。"
    if "巻物" in positioning:
        return "硬餌巻物：出線和竿身回彈更穩，連續收線、碰障礙和短咬承接更自然。"
    if "精細" in positioning:
        return "Bass 精細釣法：細線、小釣組出線更順，讀底、抖動和輕咬口回饋更清楚。"
    return "Bass 泛用：出線順暢、兼容多種線徑，軟餌、硬餌、移動餌切換更自然。"


def apply_whitelist_player_fields(variant, env, pos, sell):
    evidence = WHITELIST_EVIDENCE.get(variant.get("sku", ""))
    if not evidence:
        return env, pos, sell, guide_use_hint(pos)
    return (
        evidence["player_environment"],
        evidence["player_positioning"],
        evidence["player_selling_points"],
        evidence["guide_use_hint"],
    )


def apply_spec_image_patch(variant):
    patch = SPEC_IMAGE_PATCHES.get(variant.get("sku", ""))
    if not patch:
        return variant
    out = dict(variant)
    for key, value in patch.items():
        out[key] = value
    return out


def official_variant_sort_key(model, variant, index):
    order = SERIES_VARIANT_ORDER.get(model)
    if not order:
        return index
    try:
        return order.index(variant.get("sku", ""))
    except ValueError:
        return len(order) + index


def parse_detail(page, rod_id):
    html = cached_html(page["url"], DETAIL_CACHE_DIR / f"{slug_from_url(page['url'])}.html")
    soup = BeautifulSoup(html, "html.parser")
    variants = {}
    for row in table_rows(soup):
        variant = variant_from_table_row(row, page["url"])
        if variant:
            variants[variant["sku"]] = variant
    for sku, section in variant_sections(soup).items():
        variant = variants.get(sku, {
            "source_url": page["url"], "sku": sku, "type": infer_type(sku), "power": infer_power(sku),
            "total_length": "", "action": "", "pieces": "", "close_length": "", "weight": "",
            "lure_weight_oz": "", "line_wt_nf": "", "pe_line_size": "", "market_reference_price": "",
            "admin_code": "", "code_name": "", "model_year": "", "description": "",
            "extra_spec_1": "", "extra_spec_2": "",
        })
        variant["description"] = section["description"] or variant.get("description", "")
        variant["code_name"] = variant.get("code_name") or section["code_name"]
        variant["model_year"] = variant.get("model_year") or section["model_year"]
        variant = apply_spec_image_patch(variant)
        variants[sku] = variant

    model = clean_model(page["title"])
    image_url = pick_main_image(soup, page["title"], page["url"])
    variant_list = list(variants.values())
    variant_list = [
        variant
        for _, variant in sorted(
            enumerate(variant_list),
            key=lambda item: official_variant_sort_key(model, item[1], item[0]),
        )
    ]

    return {
        "source_url": page["url"],
        "title": page["title"],
        "model": model,
        "model_cn": page["title"],
        "model_year": "",
        "main_image_url": image_url,
        "images": download_main_image(image_url, rod_id, model),
        "main_selling_points": "",
        "description": master_description,
        "fit_style_tags": fit_style_tags_for_item(model, page["title"], master_description, variant_list),
        "guide_layout_type": guide_layout_text(soup.get_text(" ", strip=True)),
        "variants": variant_list,
    }


def build_normalized():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    DETAIL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    products = []
    for index, page in enumerate(discover_rod_pages(), start=1000):
        rod_id = f"{ROD_PREFIX}{index}"
        item = parse_detail(page, rod_id)
        item["id"] = rod_id
        products.append(item)
        print(f"[dstyle_rod] parsed {rod_id} {item['model']} variants={len(item['variants'])}")
    NORMALIZED_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
    EVIDENCE_PATH.write_text(
        json.dumps(
            [
                {
                    "brand": "Dstyle",
                    "sku": sku,
                    **evidence,
                }
                for sku, evidence in sorted(WHITELIST_EVIDENCE.items())
            ],
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return products


def append_sheet(wb, title, headers, rows):
    ws = wb.create_sheet(title)
    ws.append(headers)
    for row in rows:
        ws.append([row.get(header, "") for header in headers])


def build_xlsx(products):
    rod_rows = []
    detail_rows = []
    detail_counter = 10000
    for item in products:
        descriptions = [v.get("description", "") for v in item["variants"] if v.get("description")]
        master_desc = item["description"] or n(" ".join(descriptions[:2]))
        rod_rows.append({
            "id": item["id"],
            "brand_id": BRAND_ID,
            "model": item["model"],
            "model_cn": item["model_cn"],
            "model_year": item["model_year"],
            "alias": item["title"],
            "type_tips": "",
            "fit_style_tags": item.get("fit_style_tags", "bass"),
            "images": item["images"],
            "created_at": "",
            "updated_at": "",
            "series_positioning": "",
            "main_selling_points": item["main_selling_points"],
            "official_reference_price": "",
            "market_status": "",
            "Description": master_desc,
            "player_positioning": "淡水 Bass 竿系",
            "player_selling_points": "以 Bass 路亞作釣為核心，覆蓋精細、泛用、游動與強力障礙等細分場景",
        })
        for variant in item["variants"]:
            detail_id = f"{DETAIL_PREFIX}{detail_counter}"
            detail_counter += 1
            detail_description = variant.get("description", "") or master_desc
            env, pos, sell = player_fields(variant["sku"], detail_description, variant.get("type", ""))
            env, pos, sell, hint = apply_whitelist_player_fields(variant, env, pos, sell)
            detail_rows.append({
                "id": detail_id,
                "rod_id": item["id"],
                "TYPE": variant.get("type", ""),
                "SKU": variant.get("sku", ""),
                "POWER": variant.get("power", ""),
                "TOTAL LENGTH": variant.get("total_length", ""),
                "Action": variant.get("action", ""),
                "PIECES": variant.get("pieces", ""),
                "CLOSELENGTH": variant.get("close_length", ""),
                "WEIGHT": variant.get("weight", ""),
                "Tip Diameter": "",
                "LURE WEIGHT": "",
                "Line Wt N F": variant.get("line_wt_nf", ""),
                "PE Line Size": variant.get("pe_line_size", ""),
                "Handle Length": "",
                "Reel Seat Position": "",
                "CONTENT CARBON": "",
                "Market Reference Price": variant.get("market_reference_price", ""),
                "AdminCode": variant.get("admin_code", ""),
                "Service Card": "",
                " Jig Weight": "",
                "Squid Jig Size": "",
                "Sinker Rating": "",
                "created_at": "",
                "updated_at": "",
                "LURE WEIGHT (oz)": variant.get("lure_weight_oz", ""),
                "Sale Price": "",
                "Joint Type": "",
                "Code Name": variant.get("code_name", ""),
                "Fly Line": "",
                "Grip Type": "",
                "Reel Size": "",
                "guide_layout_type": item.get("guide_layout_type", ""),
                "guide_use_hint": hint,
                "recommended_rig_pairing": "",
                "hook_keeper_included": "",
                "sweet_spot_lure_weight_real": "",
                "official_environment": "",
                "player_environment": env,
                "player_positioning": pos,
                "player_selling_points": sell,
                "Description": detail_description,
                "product_technical": variant.get("product_technical", ""),
                "Extra Spec 1": variant.get("extra_spec_1", ""),
                "Extra Spec 2": variant.get("extra_spec_2", ""),
            })

    wb = Workbook()
    wb.remove(wb.active)
    append_sheet(wb, "rod", ROD_HEADERS, rod_rows)
    append_sheet(wb, "rod_detail", ROD_DETAIL_HEADERS, detail_rows)
    wb.save(XLSX_PATH)
    print(f"[dstyle_rod] wrote {XLSX_PATH}")
    print({"masters": len(rod_rows), "details": len(detail_rows)})


def main():
    products = build_normalized()
    build_xlsx(products)


if __name__ == "__main__":
    main()
