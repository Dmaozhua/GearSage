const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const IMPORT_FILE = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx';
const DOWNLOAD_DIR = '/Users/tommy/Pictures/images/shimano_reels';

const FORBIDDEN_TOKENS = {
  STELLA: ['SW'],
  TWINPOWER: ['SW', 'XD'],
  STRADIC: ['SW'],
  EXSENCE: ['XR', 'BB', 'DC'],
  Vanquish: ['CE'],
  'Sephia XR': ['SS', 'BB', 'CI4PLUS', 'CI4+'],
  'Soare XR': ['BB'],
  'SPHEROS SW': [],
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fetch(url) {
  return require('child_process').execFileSync(
    'curl',
    ['-L', '-A', 'Mozilla/5.0', '--max-time', '20', url],
    { maxBuffer: 20 * 1024 * 1024 }
  );
}

function parseSearchResults(html) {
  const regex =
    /<a href="([^"]+)" class="product-image">\s*<img src="([^"]+)"\s+alt="([^"]+)"/gms;
  const out = [];
  let match;
  while ((match = regex.exec(html))) {
    out.push({
      href: normalizeText(match[1]),
      image: normalizeText(match[2]),
      title: decodeHtml(match[3]),
    });
  }
  return out;
}

function tokenizeModel(model) {
  return normalizeText(model)
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.toUpperCase());
}

function scoreCandidate(model, candidate) {
  const title = candidate.title.toUpperCase();
  const tokens = tokenizeModel(model);
  if (!tokens.length) return -1;
  if (!tokens.every((token) => title.includes(token))) return -1;

  const forbidden = FORBIDDEN_TOKENS[model] || [];
  if (forbidden.some((token) => title.includes(token))) return -1;

  let score = 100;
  const year = (title.match(/\b(20\d{2}|\d{2})\b/) || [])[1] || '';
  if (year) score += 5;
  return score;
}

function buildSearchQueries(model) {
  const base = normalizeText(model);
  return [...new Set([base.toLowerCase(), base.replace(/\s+/g, '').toLowerCase()])];
}

function main() {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  const wb = XLSX.readFile(IMPORT_FILE);
  const reel = XLSX.utils.sheet_to_json(wb.Sheets['reel'], { defval: '' });

  const jobs = reel.map((row) => {
    const imageUrl = normalizeText(row.images);
    const filename = decodeURIComponent(imageUrl.split('/').pop() || '');
    return { id: row.id, model: row.model, filename, localPath: path.join(DOWNLOAD_DIR, filename) };
  });

  const missing = jobs.filter((job) => !fs.existsSync(job.localPath));
  const start = Number(process.env.START || 0);
  const limit = Number(process.env.LIMIT || missing.length);
  const batch = missing.slice(start, start + limit);
  const results = [];

  for (const job of batch) {
    const queries = buildSearchQueries(job.model);
    let chosen = null;

    for (const query of queries) {
      const url = `https://japantackle.com/catalogsearch/result/index/?q=${encodeURIComponent(query)}`;
      const html = fetch(url).toString('utf8');
      const candidates = parseSearchResults(html)
        .map((candidate) => ({ ...candidate, score: scoreCandidate(job.model, candidate) }))
        .filter((candidate) => candidate.score >= 100)
        .sort((a, b) => b.score - a.score);
      if (candidates.length) {
        chosen = candidates[0];
        break;
      }
    }

    if (!chosen) {
      results.push({ ...job, status: 'missing', reason: 'no_search_match' });
      continue;
    }

    const imageBuffer = fetch(chosen.image);
    fs.writeFileSync(job.localPath, imageBuffer);
    results.push({
      ...job,
      status: 'downloaded',
      source_title: chosen.title,
      source_url: chosen.href,
      source_image: chosen.image,
    });
  }

  const summary = {
    total: jobs.length,
    already_present: jobs.length - missing.length,
    attempted: batch.length,
    downloaded: results.filter((r) => r.status === 'downloaded').length,
    missing: results.filter((r) => r.status === 'missing').length,
    results,
  };

  const out = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reels_image_download_stage1.json';
  fs.writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
