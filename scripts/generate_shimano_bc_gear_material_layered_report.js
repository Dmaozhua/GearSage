const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IDENTITY_PATCH = gearDataPaths.resolveDataRaw('identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json');
const RECHECK_VIEW = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_field_recheck_view.xlsx');
const OUTPUT_MD = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_gear_material_layered_decision_report.md');
const OUTPUT_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_gear_material_layered_decision_report.xlsx');

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadIdentityRows() {
  const payload = JSON.parse(fs.readFileSync(IDENTITY_PATCH, 'utf8'));
  return payload.patch_rows || [];
}

function loadRecheckRows() {
  const workbook = XLSX.readFile(RECHECK_VIEW);
  return XLSX.utils.sheet_to_json(workbook.Sheets.recheck_view, { defval: '' });
}

function getRepresentativeRows(recheckRows) {
  const firstByReel = new Map();
  for (const row of recheckRows) {
    const key = normalizeText(row.reel_id);
    if (!firstByReel.has(key)) firstByReel.set(key, row);
  }
  return firstByReel;
}

function buildRows(identityRows, representativeByReel) {
  const identityByReel = new Map(identityRows.map((row) => [normalizeText(row.reel_id), row]));

  const rows = [
    {
      reel_id: 'SRE5003',
      decision_bucket: 'cross_source_inferred',
      candidate_value: 'Brass',
      source_type: 'cross_source_inferred',
      source_site: 'TackleTour | JapanTackle',
      source_url: 'https://www.tackletour.com/reviewshimano23antaresmddcxgpg2.html | https://www.japantackle.com/casting-reels/shimano/shimano-21antaresdc.html',
      evidence_text: 'TackleTour 2023 Antares DC MD review states the main gear is brass; JapanTackle 2021 Antares DC page confirms the exact 2021 sample identity and same Antares DC family context but does not directly state gear material.',
      final_recommended_value: 'Brass',
      final_target_layer: 'inferred',
      review_note: 'Strong inference only. One source provides exact material, the second source only anchors the 2021 Antares DC sample and family/platform context. This is not official and should not be upgraded to direct_write.',
    },
    {
      reel_id: 'SRE5004',
      decision_bucket: 'direct_write',
      candidate_value: 'Brass',
      source_type: 'whitelist_direct',
      source_site: 'TackleTour',
      source_url: 'https://www.tackletour.com/reviewshimano23antaresmddcxgpg2.html',
      evidence_text: 'TackleTour 2023 Antares DC MD review says the main gear is brass.',
      final_recommended_value: 'Brass',
      final_target_layer: 'player',
      review_note: 'Year-aligned exact material phrase from an existing white-listed source. Suitable for direct_write into non-official layer.',
    },
    {
      reel_id: 'SRE5015',
      decision_bucket: 'direct_write',
      candidate_value: 'Duralumin drive gear',
      source_type: 'whitelist_direct',
      source_site: 'JapanTackle',
      source_url: 'https://japantackle.com/metaniumdc2024.html',
      evidence_text: 'JapanTackle 2024 Metanium DC page explicitly says Duralumin drive gear.',
      final_recommended_value: 'Duralumin drive gear',
      final_target_layer: 'player',
      review_note: 'Year-aligned exact material phrase from an existing white-listed source. Suitable for direct_write into non-official layer.',
    },
    {
      reel_id: 'SRE5019',
      decision_bucket: 'manual_required',
      candidate_value: '',
      source_type: 'manual_required',
      source_site: 'JapanTackle | TackleTour',
      source_url: 'https://japantackle.com/casting-reels/shimano/reg0000334.html | https://www.tackletour.com/previewshimanocalcuttaconquestbfs.html',
      evidence_text: 'JapanTackle has no exact gear material phrase. TackleTour mentions precisely cut micro module gear, which is a technology phrase, not a material.',
      final_recommended_value: '',
      final_target_layer: 'blank',
      review_note: 'Current evidence does not include an exact material phrase. Must remain blank.',
    },
    {
      reel_id: 'SRE5025',
      decision_bucket: 'direct_write',
      candidate_value: 'Aluminum main gear',
      source_type: 'whitelist_direct',
      source_site: 'TackleTour',
      source_url: 'https://www.tackletour.com/reviewshimano22aldebaranbfspg2.html',
      evidence_text: 'TackleTour 2022 Aldebaran BFS review states the main gear is aluminum.',
      final_recommended_value: 'Aluminum main gear',
      final_target_layer: 'player',
      review_note: 'Year-aligned exact material phrase from an existing white-listed source. Suitable for direct_write into non-official layer.',
    },
  ];

  return rows.map((row) => {
    const rep = representativeByReel.get(row.reel_id) || {};
    const identity = identityByReel.get(row.reel_id) || {};
    return {
      detail_id: normalizeText(rep.detail_id),
      reel_id: row.reel_id,
      model_year: normalizeText(identity.model_year) || normalizeText(rep.model_year),
      SKU: normalizeText(rep.SKU),
      canonical_alias: normalizeText(identity.canonical_alias) || normalizeText(rep.canonical_alias),
      normalized_alias: normalizeText(identity.normalized_alias) || normalizeText(rep.normalized_alias),
      candidate_value: row.candidate_value,
      source_type: row.source_type,
      source_site: row.source_site,
      source_url: row.source_url,
      evidence_text: row.evidence_text,
      decision_bucket: row.decision_bucket,
      final_recommended_value: row.final_recommended_value,
      final_target_layer: row.final_target_layer,
      review_note: row.review_note,
    };
  }).sort((a, b) => a.reel_id.localeCompare(b.reel_id));
}

function buildSummary(rows) {
  const count = (bucket) => rows.filter((row) => row.decision_bucket === bucket).length;
  return [
    { metric: 'direct_write_count', value: count('direct_write') },
    { metric: 'cross_source_inferred_count', value: count('cross_source_inferred') },
    { metric: 'manual_required_count', value: count('manual_required') },
  ];
}

function renderMarkdown(rows, summaryRows) {
  const escapeCell = (value) => String(value || '-').replace(/\|/g, '\\|');
  const lines = [
    '# Shimano baitcasting reel gear_material 分层判定报告',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_identity_patch: \`${path.relative(REPO_ROOT, IDENTITY_PATCH)}\``,
    `- input_recheck_view: \`${path.relative(REPO_ROOT, RECHECK_VIEW)}\``,
    '',
    '当前只处理 5 个 Shimano baitcasting reel 样本，不扩样本，不改现有 whitelist patch。',
    '',
    '## 三档规则结果',
    '',
    ...summaryRows.map((row) => `- ${row.metric}: ${row.value}`),
    '',
    '## 样本逐条结论',
    '',
    '| detail_id | reel_id | model_year | SKU | canonical_alias | normalized_alias | candidate_value | source_type | source_site | decision_bucket | final_recommended_value | final_target_layer |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${[
      row.detail_id,
      row.reel_id,
      row.model_year,
      row.SKU,
      row.canonical_alias,
      row.normalized_alias,
      row.candidate_value || '-',
      row.source_type,
      row.source_site,
      row.decision_bucket,
      row.final_recommended_value || '-',
      row.final_target_layer,
    ].map(escapeCell).join(' | ')} |`),
    '',
    '## 21 Antares DC 为什么是 inferred，不是 official',
    '',
    '- 来源一：[TackleTour 23 Antares DC MD review](https://www.tackletour.com/reviewshimano23antaresmddcxgpg2.html) 明确给出 `main gear is brass`。',
    '- 来源二：[JapanTackle 21 Antares DC](https://www.japantackle.com/casting-reels/shimano/shimano-21antaresdc.html) 锚定了当前 `21 Antares DC` 样本本身，但没有直接给出 gear material。',
    '- 这两个来源可以组成“强推断”，但还不是 `21 Antares DC` 本年款的直接官方或直接白名单明示，因此只能进 `cross_source_inferred`，不能进 `official`，也不该伪装成 direct_write。',
    '',
    '## Bucket 结论',
    '',
    `- direct_write: ${rows.filter((row) => row.decision_bucket === 'direct_write').map((row) => row.reel_id).join('、')}`,
    `- cross_source_inferred: ${rows.filter((row) => row.decision_bucket === 'cross_source_inferred').map((row) => row.reel_id).join('、')}`,
    `- manual_required: ${rows.filter((row) => row.decision_bucket === 'manual_required').map((row) => row.reel_id).join('、')}`,
    '',
  ];
  return lines.join('\n');
}

function writeWorkbook(rows, summaryRows) {
  ensureDirForFile(OUTPUT_XLSX);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'gear_material_decision');
  XLSX.writeFile(wb, OUTPUT_XLSX);
}

function main() {
  const identityRows = loadIdentityRows();
  const representativeByReel = getRepresentativeRows(loadRecheckRows());
  const rows = buildRows(identityRows, representativeByReel);
  const summaryRows = buildSummary(rows);
  const markdown = renderMarkdown(rows, summaryRows);

  ensureDirForFile(OUTPUT_MD);
  fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');
  writeWorkbook(rows, summaryRows);

  console.log(`gear material layered report markdown -> ${OUTPUT_MD}`);
  console.log(`gear material layered report workbook -> ${OUTPUT_XLSX}`);
}

main();
