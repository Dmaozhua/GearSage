import copy
import posixpath
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

XLSX_PATH = Path("/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_import.xlsx")

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

ET.register_namespace("", NS["main"])


def qn(tag: str) -> str:
    return f"{{{NS['main']}}}{tag}"


def read_shared_strings(zf: zipfile.ZipFile):
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    values = []
    for si in root.findall(qn("si")):
        texts = [t.text or "" for t in si.iter(qn("t"))]
        values.append("".join(texts))
    return values


def cell_text(cell, shared_strings):
    t = cell.get("t")
    if t == "s":
        v = cell.find(qn("v"))
        if v is None or v.text is None:
            return ""
        idx = int(v.text)
        return shared_strings[idx] if 0 <= idx < len(shared_strings) else ""
    if t == "inlineStr":
        is_node = cell.find(qn("is"))
        if is_node is None:
            return ""
        return "".join(tn.text or "" for tn in is_node.iter(qn("t")))
    v = cell.find(qn("v"))
    return v.text if v is not None and v.text is not None else ""


def col_ref(cell_ref: str) -> str:
    m = re.match(r"([A-Z]+)", cell_ref or "")
    return m.group(1) if m else ""


def resolve_sheet_path(zf: zipfile.ZipFile, sheet_name: str):
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rel_id = ""
    for sheet in workbook.find(qn("sheets")).findall(qn("sheet")):
        if sheet.get("name") == sheet_name:
            rel_id = sheet.get(f"{{{NS['rel']}}}id")
            break
    if not rel_id:
        raise RuntimeError(f"sheet not found: {sheet_name}")

    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    for rel in rels.findall(f"{{{NS['pkgrel']}}}Relationship"):
        if rel.get("Id") == rel_id:
            target = rel.get("Target") or ""
            if target.startswith("/"):
                return target.lstrip("/")
            return posixpath.normpath(posixpath.join("xl", target))
    raise RuntimeError(f"sheet rel not found: {sheet_name}")


def ensure_fill(styles_root, rgb: str):
    fills = styles_root.find(qn("fills"))
    for idx, fill in enumerate(fills.findall(qn("fill"))):
        pattern = fill.find(qn("patternFill"))
        if pattern is None or pattern.get("patternType") != "solid":
            continue
        fg = pattern.find(qn("fgColor"))
        if fg is not None and fg.get("rgb") == rgb:
            return idx

    fill = ET.Element(qn("fill"))
    pattern = ET.SubElement(fill, qn("patternFill"), {"patternType": "solid"})
    ET.SubElement(pattern, qn("fgColor"), {"rgb": rgb})
    ET.SubElement(pattern, qn("bgColor"), {"indexed": "64"})
    fills.append(fill)
    fills.set("count", str(len(fills.findall(qn("fill")))))
    return len(fills.findall(qn("fill"))) - 1


def style_variants(styles_root, used_styles, fill_ids):
    cell_xfs = styles_root.find(qn("cellXfs"))
    variants = {}
    xf_nodes = cell_xfs.findall(qn("xf"))

    for base in used_styles:
        base_idx = int(base)
        base_xf = xf_nodes[base_idx]
        for fill_id in fill_ids:
            key = (base_idx, fill_id)
            clone = copy.deepcopy(base_xf)
            clone.set("fillId", str(fill_id))
            clone.set("applyFill", "1")
            cell_xfs.append(clone)
            variants[key] = len(cell_xfs.findall(qn("xf"))) - 1

    cell_xfs.set("count", str(len(cell_xfs.findall(qn("xf")))))
    return variants


def main():
    with zipfile.ZipFile(XLSX_PATH, "r") as zf:
        shared_strings = read_shared_strings(zf)
        sheet_path = resolve_sheet_path(zf, "rod_detail")
        sheet_root = ET.fromstring(zf.read(sheet_path))
        styles_root = ET.fromstring(zf.read("xl/styles.xml"))

        sheet_data = sheet_root.find(qn("sheetData"))
        rows = sheet_data.findall(qn("row"))
        if not rows:
            raise RuntimeError("rod_detail sheet empty")

        header_map = {}
        for cell in rows[0].findall(qn("c")):
            header_map[col_ref(cell.get("r"))] = cell_text(cell, shared_strings)
        rod_col = next((col for col, text in header_map.items() if text == "rod_id"), "")
        if not rod_col:
            raise RuntimeError("rod_id column not found")

        used_styles = set()
        current_group = -1
        last_rod_id = None
        row_targets = []

        for row in rows[1:]:
            rod_id = ""
            cells = row.findall(qn("c"))
            for cell in cells:
                if col_ref(cell.get("r")) == rod_col:
                    rod_id = cell_text(cell, shared_strings)
                    break
            if rod_id != last_rod_id:
                current_group += 1
                last_rod_id = rod_id
            row_targets.append((row, current_group))
            for cell in cells:
                used_styles.add(cell.get("s", "0"))

        fill_a = ensure_fill(styles_root, "FFF8F3C8")
        fill_b = ensure_fill(styles_root, "FFE8F1FB")
        variant_map = style_variants(styles_root, used_styles, [fill_a, fill_b])

        for row, group_idx in row_targets:
            fill_id = fill_a if group_idx % 2 == 0 else fill_b
            for cell in row.findall(qn("c")):
                base_style = int(cell.get("s", "0"))
                cell.set("s", str(variant_map[(base_style, fill_id)]))

        updated_entries = {
            sheet_path: ET.tostring(sheet_root, encoding="utf-8", xml_declaration=True),
            "xl/styles.xml": ET.tostring(styles_root, encoding="utf-8", xml_declaration=True),
        }

        out_bytes = {}
        for name in zf.namelist():
            out_bytes[name] = updated_entries.get(name, zf.read(name))

    with zipfile.ZipFile(XLSX_PATH, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, content in out_bytes.items():
            zf.writestr(name, content)

    print({"file": str(XLSX_PATH), "group_rows": len(row_targets), "fills": 2})


if __name__ == "__main__":
    main()
