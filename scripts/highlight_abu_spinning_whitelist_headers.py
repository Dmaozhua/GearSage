import copy
import re
import zipfile
from io import BytesIO
from pathlib import Path
from gear_data_paths import DATA_RAW_DIR, EXCEL_DIR, resolve_data_raw, resolve_excel
from xml.etree import ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
}

ET.register_namespace("", NS["a"])
ET.register_namespace("r", NS["r"])

IMPORT_FILE = resolve_data_raw('abu_spinning_reels_import.xlsx')
REVIEW_FILE = resolve_data_raw('abu_spinning_reels_review.xlsx')

IMPORT_TARGETS = {
    "reel": {"series_positioning", "player_positioning", "player_selling_points"},
    "spinning_reel_detail": {
        "official_environment",
        "player_environment",
        "body_material",
        "body_material_tech",
        "is_sw_edition",
        "handle_style",
        "is_handle_double",
        "fit_style_tags",
        "min_lure_weight_hint",
    },
}

REVIEW_TARGETS = {
    "master_review": {"series_positioning", "player_positioning", "player_selling_points"},
    "detail_review": {
        "body_material",
        "body_material_tech",
        "official_environment",
        "player_environment",
        "handle_style",
        "is_handle_double",
        "fit_style_tags",
        "min_lure_weight_hint",
    },
}


def col_letters(cell_ref: str) -> str:
    m = re.match(r"([A-Z]+)", cell_ref)
    return m.group(1) if m else ""


def build_shared_strings_map(xml_bytes: bytes):
    root = ET.fromstring(xml_bytes)
    mapping = {}
    for idx, si in enumerate(root.findall("a:si", NS)):
        text = "".join(t.text or "" for t in si.iterfind(".//a:t", NS))
        mapping[idx] = text
    return mapping


def read_cell_text(cell, shared_strings):
    if cell.get("t") == "inlineStr":
        return "".join(t.text or "" for t in cell.iterfind(".//a:t", NS))
    value = cell.find("a:v", NS)
    if value is None:
        return ""
    raw = value.text or ""
    if cell.get("t") == "s":
        return shared_strings.get(int(raw), "")
    return raw


def ensure_yellow_fill(styles_root):
    fills = styles_root.find("a:fills", NS)
    for idx, fill in enumerate(fills.findall("a:fill", NS)):
        pattern = fill.find("a:patternFill", NS)
        if pattern is None or pattern.get("patternType") != "solid":
            continue
        fg = pattern.find("a:fgColor", NS)
        if fg is not None and fg.get("rgb") == "FFFFFF00":
            return idx

    fill = ET.Element(f"{{{NS['a']}}}fill")
    pattern = ET.SubElement(fill, f"{{{NS['a']}}}patternFill", {"patternType": "solid"})
    ET.SubElement(pattern, f"{{{NS['a']}}}fgColor", {"rgb": "FFFFFF00"})
    ET.SubElement(pattern, f"{{{NS['a']}}}bgColor", {"indexed": "64"})
    fills.append(fill)
    fills.set("count", str(len(fills.findall("a:fill", NS))))
    return len(fills.findall("a:fill", NS)) - 1


def ensure_header_style(styles_root, fill_id):
    cell_xfs = styles_root.find("a:cellXfs", NS)
    for idx, xf in enumerate(cell_xfs.findall("a:xf", NS)):
        if xf.get("fillId") == str(fill_id) and xf.get("applyFill") == "1":
            return idx

    base = copy.deepcopy(cell_xfs.findall("a:xf", NS)[0])
    base.set("fillId", str(fill_id))
    base.set("applyFill", "1")
    cell_xfs.append(base)
    cell_xfs.set("count", str(len(cell_xfs.findall("a:xf", NS))))
    return len(cell_xfs.findall("a:xf", NS)) - 1


def workbook_sheet_map(zf):
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.get("Id"): rel.get("Target") for rel in rels.findall("pr:Relationship", NS)}
    mapping = {}
    for sheet in wb.find("a:sheets", NS).findall("a:sheet", NS):
        name = sheet.get("name")
        rid = sheet.get(f"{{{NS['r']}}}id")
        target = rel_map[rid]
        if not target.startswith("worksheets/"):
            target = target.replace("../", "")
        mapping[name] = f"xl/{target}" if not target.startswith("xl/") else target
    return mapping


def patch_workbook(file_path: Path, target_map):
    original = file_path.read_bytes()
    source = zipfile.ZipFile(BytesIO(original), "r")
    files = {name: source.read(name) for name in source.namelist()}
    source.close()

    shared_strings = build_shared_strings_map(files["xl/sharedStrings.xml"]) if "xl/sharedStrings.xml" in files else {}
    styles_root = ET.fromstring(files["xl/styles.xml"])
    fill_id = ensure_yellow_fill(styles_root)
    style_id = ensure_header_style(styles_root, fill_id)
    files["xl/styles.xml"] = ET.tostring(styles_root, encoding="utf-8", xml_declaration=True)

    with zipfile.ZipFile(BytesIO(original), "r") as zf:
        sheet_map = workbook_sheet_map(zf)

    for sheet_name, targets in target_map.items():
        sheet_path = sheet_map[sheet_name]
        root = ET.fromstring(files[sheet_path])
        header_row = root.find("a:sheetData", NS).find("a:row", NS)
        header_cells = header_row.findall("a:c", NS)
        target_cols = set()
        for cell in header_cells:
            text = read_cell_text(cell, shared_strings)
            if text in targets:
                target_cols.add(col_letters(cell.get("r", "")))
                cell.set("s", str(style_id))
        files[sheet_path] = ET.tostring(root, encoding="utf-8", xml_declaration=True)

    out = BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, content in files.items():
            zf.writestr(name, content)
    file_path.write_bytes(out.getvalue())


def main():
    patch_workbook(IMPORT_FILE, IMPORT_TARGETS)
    patch_workbook(REVIEW_FILE, REVIEW_TARGETS)
    print(f"Highlighted whitelist headers in {IMPORT_FILE}")
    print(f"Highlighted whitelist headers in {REVIEW_FILE}")


if __name__ == "__main__":
    main()
