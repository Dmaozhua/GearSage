const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { execFileSync } = require('child_process');

const NORMALIZED_FILE = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reel_normalized.json';
const IMPORT_FILE = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx';

function normalizeSpace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function cleanDescription(rawText) {
  const text = String(rawText || '').replaceAll('阅读更多', '').replaceAll('减少显示', '');
  const lines = [];
  for (const line of text.split(/\n+/)) {
    const normalized = normalizeSpace(line);
    if (!normalized) continue;
    if (normalized === '※本页面相关产品数据为禧玛诺自身产品对比，内部测试所得。') continue;
    lines.push(normalized);
  }
  return lines.join('\n').trim();
}

function fetchDescription(url) {
  const html = execFileSync('python3', ['-c', `
from curl_cffi import requests
from bs4 import BeautifulSoup
import sys
url = sys.argv[1]
r = requests.get(url, impersonate='chrome', verify=False, timeout=30)
soup = BeautifulSoup(r.text, 'html.parser')
el = soup.select_one('.product__description_section__content') or soup.select_one('.product__description_section')
print(el.get_text('\\n', strip=True) if el else '')
`, url], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return cleanDescription(html);
}

function buildMasterKey(item) {
  const rawUrl = String(item.url || '').trim();
  if (!rawUrl) return `R-SH-${String(item.model_name || '').trim().toUpperCase()}`;
  try {
    const pathname = new URL(rawUrl).pathname;
    const pageToken = path.basename(pathname, '.html').toUpperCase();
    return `R-SH-${pageToken}`;
  } catch {
    return `R-SH-${String(item.model_name || '').trim().toUpperCase()}`;
  }
}

function main() {
  const normalized = JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf8'));
  const wb = XLSX.readFile(IMPORT_FILE);
  const headers = XLSX.utils.sheet_to_json(wb.Sheets.reel, { header: 1, defval: '' })[0] || [];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.reel, { defval: '' });

  let reelIdCounter = 1000;
  const keyToId = new Map();
  const descriptionById = new Map();

  for (const item of normalized) {
    const key = buildMasterKey(item);
    if (!keyToId.has(key)) keyToId.set(key, `SRE${reelIdCounter++}`);
    let desc = cleanDescription(item.description || '');
    if (!desc || desc.includes('本页面相关产品数据为禧玛诺自身产品对比')) {
      desc = fetchDescription(item.url);
    }
    descriptionById.set(keyToId.get(key), desc);
  }

  let updated = 0;
  for (const row of rows) {
    const next = descriptionById.get(row.id);
    if (typeof next === 'string' && next && row.Description !== next) {
      row.Description = next;
      updated += 1;
    }
  }

  wb.Sheets.reel = XLSX.utils.json_to_sheet(rows, { header: headers });
  XLSX.writeFile(wb, IMPORT_FILE, { cellStyles: true });
  console.log(JSON.stringify({ updated }, null, 2));
}

main();
