const XLSX = require('xlsx');

const FILE = 'GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx';

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function variantTokensFromRow(row) {
  const text = [row.SKU, row.reel_id, row.type, row.custom_spool_compatibility, row.custom_knob_compatibility]
    .map(normalizeText)
    .join(' ')
    .toUpperCase();
  const src = [row.SKU].map(normalizeText).join(' ').toUpperCase();
  const tokens = [];
  const push = (v) => { if (!tokens.includes(v)) tokens.push(v); };
  if (/\bBFS\b/.test(src)) push('BFS');
  if (/\bMGL\b/.test(src)) push('MGL');
  if (/\bLD\b/.test(src)) push('LD');
  if (/\bCT\b/.test(src)) push('CT');
  if (/\bFT\b/.test(src)) push('FT');
  if (/\bXT\b/.test(src)) push('XT');
  if (/SHALLOW/.test(src)) push('SHALLOW');
  if (/\bSS\b/.test(src)) push('SS');
  return tokens;
}

function filterCompatValue(value, requiredTokens) {
  const text = normalizeText(value);
  if (!text || !requiredTokens.length) return text;
  const parts = text.split(' / ').map((part) => normalizeText(part)).filter(Boolean);
  const kept = parts.filter((part) => {
    const upper = part.toUpperCase();
    return requiredTokens.every((token) => upper.includes(token));
  });
  return kept.join(' / ');
}

function main() {
  const wb = XLSX.readFile(FILE);
  const sheet = 'baitcasting_reel_detail';
  const headers = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' })[0] || [];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' });
  let changed = 0;

  for (const row of rows) {
    const tokens = variantTokensFromRow(row);
    if (!tokens.length) continue;
    for (const field of ['custom_spool_compatibility', 'custom_knob_compatibility']) {
      const next = filterCompatValue(row[field], tokens);
      if (next !== normalizeText(row[field])) {
        row[field] = next;
        changed += 1;
      }
    }
  }

  wb.Sheets[sheet] = XLSX.utils.json_to_sheet(rows, { header: headers });
  XLSX.writeFile(wb, FILE);
  console.log(JSON.stringify({ changed }, null, 2));
}

main();
