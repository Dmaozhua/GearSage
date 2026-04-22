const fs = require('fs');
const { execFileSync, spawnSync } = require('child_process');
const XLSX = require('xlsx');

const IMPORT_FILE = 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx';
const HIGHLIGHT_PAYLOAD = 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_highlights.json';
const HIGHLIGHT_HELPER = 'scripts/patch_xlsx_highlights.py';
const SHIMANO_SUPPORT_SEARCH_URL = 'https://www.shimanofishingservice.jp/price.php';
const SHIMANO_SUPPORT_BASE_URL = 'https://www.shimanofishingservice.jp/';
const PAGE_CACHE = new Map();

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toAbsoluteUrl(base, maybeRelative) {
  const text = normalizeText(maybeRelative);
  if (!text) return '';
  try {
    return new URL(text, base).href;
  } catch (error) {
    return text;
  }
}

function postShimanoSupportSearch(productCode) {
  const code = normalizeText(productCode);
  if (!code) return '';
  if (PAGE_CACHE.has(code)) return PAGE_CACHE.get(code);
  const html = execFileSync(
    'curl',
    ['-s', '-k', '-L', '-A', 'Mozilla/5.0', '-X', 'POST', SHIMANO_SUPPORT_SEARCH_URL, '--data', `prc=&cmd=search&sid=jp&search_text=${encodeURIComponent(code)}`],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  PAGE_CACHE.set(code, html);
  return html;
}

function extractShimanoSupportLinks(html, productCode) {
  const code = normalizeText(productCode);
  if (!code || !html) return { EV_link: '', Specs_link: '' };
  const codePattern = escapeRegExp(code);
  const exactBlock = new RegExp(
    `<p class="table_td table-code">${codePattern}</p>[\\s\\S]*?<a href="([^"]*parts_price\\.php\\?scode=${codePattern}[^"]*)"[^>]*>[\\s\\S]*?<a href="([^"]*manual[^"]+\\.pdf)"`,
    'i'
  );
  const match = html.match(exactBlock);
  if (match) {
    return {
      EV_link: toAbsoluteUrl(SHIMANO_SUPPORT_BASE_URL, match[1]),
      Specs_link: toAbsoluteUrl(SHIMANO_SUPPORT_BASE_URL, match[2]),
    };
  }
  return { EV_link: '', Specs_link: '' };
}

function encodeColumn(index) {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const sheet = 'baitcasting_reel_detail';
  const headers = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' })[0] || [];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' });
  const refs = [];
  const updates = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const code = normalizeText(row.product_code);
    if (!code || (normalizeText(row.EV_link) && normalizeText(row.Specs_link))) continue;
    const html = postShimanoSupportSearch(code);
    const links = extractShimanoSupportLinks(html, code);
    let changed = false;
    if (links.EV_link && !normalizeText(row.EV_link)) {
      row.EV_link = links.EV_link;
      refs.push(`${encodeColumn(headers.indexOf('EV_link'))}${i + 2}`);
      changed = true;
    }
    if (links.Specs_link && !normalizeText(row.Specs_link)) {
      row.Specs_link = links.Specs_link;
      refs.push(`${encodeColumn(headers.indexOf('Specs_link'))}${i + 2}`);
      changed = true;
    }
    if (changed) {
      updates.push({ id: row.id, reel_id: row.reel_id, SKU: row.SKU, product_code: code, EV_link: row.EV_link, Specs_link: row.Specs_link });
    }
  }

  wb.Sheets[sheet] = XLSX.utils.json_to_sheet(rows, { header: headers });
  XLSX.writeFile(wb, IMPORT_FILE);

  let payload = { sheets: [] };
  if (fs.existsSync(HIGHLIGHT_PAYLOAD)) payload = JSON.parse(fs.readFileSync(HIGHLIGHT_PAYLOAD, 'utf8'));
  const sheet2 = payload.sheets.find((s) => s.sheet_xml === 'xl/worksheets/sheet2.xml') || { sheet_xml: 'xl/worksheets/sheet2.xml', refs: [] };
  const set = new Set(sheet2.refs || []);
  refs.forEach((ref) => set.add(ref));
  sheet2.refs = [...set];
  payload.sheets = [sheet2, ...(payload.sheets || []).filter((s) => s.sheet_xml !== 'xl/worksheets/sheet2.xml')];
  fs.writeFileSync(HIGHLIGHT_PAYLOAD, JSON.stringify(payload, null, 2), 'utf8');

  const patchResult = spawnSync('python3', [HIGHLIGHT_HELPER, IMPORT_FILE, HIGHLIGHT_PAYLOAD], { encoding: 'utf8' });
  if (patchResult.status !== 0) throw new Error(`highlight patch failed: ${patchResult.stderr || patchResult.stdout}`);

  console.log(JSON.stringify({ updated_rows: updates.length, sample: updates.slice(0, 30) }, null, 2));
}

main();
