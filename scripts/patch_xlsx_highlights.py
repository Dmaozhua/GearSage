import json
import os
import shutil
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET


NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
ET.register_namespace("", NS)


def qn(tag: str) -> str:
    return f"{{{NS}}}{tag}"


def ensure_yellow_style(styles_root: ET.Element) -> str:
    fills = styles_root.find(qn("fills"))
    if fills is None:
      raise RuntimeError("styles.xml missing fills")
    cell_xfs = styles_root.find(qn("cellXfs"))
    if cell_xfs is None:
      raise RuntimeError("styles.xml missing cellXfs")

    fill = ET.Element(qn("fill"))
    pattern = ET.SubElement(fill, qn("patternFill"), {"patternType": "solid"})
    ET.SubElement(pattern, qn("fgColor"), {"rgb": "FFF59D"})
    ET.SubElement(pattern, qn("bgColor"), {"rgb": "FFF59D"})
    fills.append(fill)
    fills.set("count", str(len(list(fills))))

    style_id = str(len(list(cell_xfs)))
    xf = ET.Element(
        qn("xf"),
        {
            "numFmtId": "0",
            "fontId": "0",
            "fillId": str(len(list(fills)) - 1),
            "borderId": "0",
            "xfId": "0",
            "applyFill": "1",
        },
    )
    cell_xfs.append(xf)
    cell_xfs.set("count", str(len(list(cell_xfs))))
    return style_id


def patch_sheet(sheet_root: ET.Element, refs: set[str], style_id: str) -> None:
    for cell in sheet_root.iterfind(f".//{qn('c')}"):
        ref = cell.attrib.get("r")
        if ref in refs:
            cell.set("s", style_id)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: patch_xlsx_highlights.py workbook.xlsx highlights.json")

    workbook_path = sys.argv[1]
    payload_path = sys.argv[2]

    with open(payload_path, "r", encoding="utf8") as f:
        payload = json.load(f)

    temp_fd, temp_path = tempfile.mkstemp(suffix=".xlsx")
    os.close(temp_fd)

    try:
        with zipfile.ZipFile(workbook_path, "r") as zin:
            files = {name: zin.read(name) for name in zin.namelist()}

        styles_root = ET.fromstring(files["xl/styles.xml"])
        style_id = ensure_yellow_style(styles_root)
        files["xl/styles.xml"] = ET.tostring(styles_root, encoding="utf-8", xml_declaration=True)

        for sheet_cfg in payload.get("sheets", []):
            sheet_xml = sheet_cfg["sheet_xml"]
            refs = set(sheet_cfg.get("refs", []))
            if not refs or sheet_xml not in files:
                continue
            sheet_root = ET.fromstring(files[sheet_xml])
            patch_sheet(sheet_root, refs, style_id)
            files[sheet_xml] = ET.tostring(sheet_root, encoding="utf-8", xml_declaration=True)

        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for name, data in files.items():
                zout.writestr(name, data)

        shutil.move(temp_path, workbook_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    main()
