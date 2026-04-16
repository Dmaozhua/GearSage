const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const WHITELIST_REVIEW = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_review_filled.xlsx'
);
const WHITELIST_PATCH = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_patch.json'
);
const STRATEGY_DOC = path.resolve(
  REPO_ROOT,
  'GearSage-client/docs/装备字段取值策略表_v1.md'
);
const OUTPUT_MD = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_field_source_layer_recommendation.md'
);
const OUTPUT_XLSX = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_field_source_layer_recommendation.xlsx'
);

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadReviewRows() {
  const workbook = XLSX.readFile(WHITELIST_REVIEW);
  return XLSX.utils.sheet_to_json(workbook.Sheets.review_candidates, { defval: '' });
}

function loadPatchRows() {
  const payload = JSON.parse(fs.readFileSync(WHITELIST_PATCH, 'utf8'));
  return payload.patch_rows || [];
}

function collectFieldStats(reviewRows, patchRows) {
  const stats = {};
  for (const row of reviewRows) {
    const field = normalizeText(row.field_key);
    if (!field) continue;
    const entry = stats[field] || {
      candidate_count: 0,
      approved_count: 0,
      manual_override_count: 0,
      source_sites: new Set(),
      risks: new Set(),
    };
    entry.candidate_count += 1;
    if (normalizeText(row.review_status) === 'approved') entry.approved_count += 1;
    if (normalizeText(row.review_status) === 'approved_manual_override') entry.manual_override_count += 1;
    if (normalizeText(row.source_site)) entry.source_sites.add(normalizeText(row.source_site));
    if (normalizeText(row.rejected_candidate_reason)) entry.risks.add(normalizeText(row.rejected_candidate_reason));
    stats[field] = entry;
  }

  for (const row of patchRows) {
    const field = normalizeText(row.field_key);
    if (!field) continue;
    const entry = stats[field] || {
      candidate_count: 0,
      approved_count: 0,
      manual_override_count: 0,
      source_sites: new Set(),
      patch_count: 0,
      player_count: 0,
      official_count: 0,
      risks: new Set(),
    };
    entry.patch_count = (entry.patch_count || 0) + 1;
    if (normalizeText(row.body_material_player)) entry.player_count = (entry.player_count || 0) + 1;
    if (normalizeText(row.body_material_official)) entry.official_count = (entry.official_count || 0) + 1;
    stats[field] = entry;
  }

  return stats;
}

function buildRecommendations(stats) {
  return [
    {
      field_key: 'model_year',
      recommended_source_layer: 'dual',
      current_display_priority: 'official > player',
      suitable_for_automation: 'yes_after_identity_review',
      current_main_risk: 'archive or title year may be noisy if page includes campaign text',
      continue_expand_experiment: 'no_first_stabilize_alias_rules',
      current_observation: 'Identity layer already hit all 5 sample years and should be the downstream binding base.',
    },
    {
      field_key: 'alias',
      recommended_source_layer: 'dual',
      current_display_priority: 'official canonical alias > player normalized alias',
      suitable_for_automation: 'partial_review_required',
      current_main_risk: 'page title may mix campaign text, archive labels, or extra descriptors',
      continue_expand_experiment: 'no_first_normalize_current_sample',
      current_observation: 'All 5 samples have alias candidates, but at least one sample still needs manual cleanup.',
    },
    {
      field_key: 'version_signature',
      recommended_source_layer: 'dual',
      current_display_priority: 'identity_normalized signature',
      suitable_for_automation: 'yes_in_identity_stage',
      current_main_risk: 'sku count or year token can drift if identity source is wrong',
      continue_expand_experiment: 'no_first_hold_current_binding_shape',
      current_observation: 'Current sample signatures are stable enough to support whitelist binding after identity review.',
    },
    {
      field_key: 'body_material',
      recommended_source_layer: 'dual',
      current_display_priority: 'official > player',
      suitable_for_automation: 'partial_review_required',
      current_main_risk: 'marketing or technology wording often gets mistaken for pure material',
      continue_expand_experiment: 'no_first_finish_source_split_and_review_loop',
      current_observation: `Current review has ${stats.body_material?.candidate_count || 0} candidate rows, with ${stats.body_material?.manual_override_count || 0} manual overrides. Dual-source design is necessary.`,
    },
    {
      field_key: 'body_material_tech',
      recommended_source_layer: 'dual',
      current_display_priority: 'official > player',
      suitable_for_automation: 'partial_review_required',
      current_main_risk: 'technology phrases may be incomplete, mixed with material, or inconsistent across years',
      continue_expand_experiment: 'no_first_stabilize_tech_phrase_normalization',
      current_observation: 'This field should absorb HAGANE / CORESOLID / fully machined style wording so body_material stays pure.',
    },
    {
      field_key: 'gear_material',
      recommended_source_layer: 'player',
      current_display_priority: 'player',
      suitable_for_automation: 'conditional_exact_material_only',
      current_main_risk: 'generic gear marketing text is easy to over-read as material',
      continue_expand_experiment: 'no_first_collect_more_exact_hits',
      current_observation: `Current review has ${stats.gear_material?.candidate_count || 0} candidate rows, all from player-side evidence, and only exact material phrases should pass.`,
    },
  ];
}

function renderMarkdown(recommendations) {
  const strategyDocExists = fs.existsSync(STRATEGY_DOC);
  const lines = [
    '# Shimano baitcasting reel 字段来源分层建议表',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_review: \`${path.relative(REPO_ROOT, WHITELIST_REVIEW)}\``,
    `- input_patch: \`${path.relative(REPO_ROOT, WHITELIST_PATCH)}\``,
    `- strategy_doc_loaded: ${strategyDocExists ? 'yes' : 'no'}`,
    '',
    '当前只围绕这轮 Shimano baitcasting reel 已涉及字段给建议，不扩到别的字段。',
    '',
    '| field_key | 推荐来源层级 | 当前推荐显示优先级 | 是否适合自动化补值 | 当前主要风险 | 是否建议继续扩大实验范围 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...recommendations.map((row) => `| ${row.field_key} | ${row.recommended_source_layer} | ${row.current_display_priority} | ${row.suitable_for_automation} | ${row.current_main_risk} | ${row.continue_expand_experiment} |`),
    '',
    '## 字段观察',
    '',
    ...recommendations.map((row) => `- \`${row.field_key}\`: ${row.current_observation}`),
    '',
    '## 当前建议归类',
    '',
    '- official：当前这轮没有单独建议只走 official 的字段。',
    '- player：`gear_material`',
    '- dual：`model_year`、`alias`、`version_signature`、`body_material`、`body_material_tech`',
    '',
    '## 备注',
    '',
    '- 当前流程顺序固定为：`identity enrichment -> whitelist 字段补值 -> review/patch -> apply（后置）`。',
    '- `model_year` 不应再被当成人工前置 blocker，而应先在 identity enrichment 阶段补齐。',
    '- `body_material` 保持纯材质值，`body_material_tech` 承接技术/结构表达。',
    '',
  ];
  return lines.join('\n');
}

function writeWorkbook(recommendations) {
  ensureDirForFile(OUTPUT_XLSX);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(recommendations), 'field_recommendation');
  XLSX.writeFile(workbook, OUTPUT_XLSX);
}

function main() {
  const reviewRows = loadReviewRows();
  const patchRows = loadPatchRows();
  const stats = collectFieldStats(reviewRows, patchRows);
  const recommendations = buildRecommendations(stats);
  const markdown = renderMarkdown(recommendations);

  ensureDirForFile(OUTPUT_MD);
  fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');
  writeWorkbook(recommendations);

  console.log(`field source markdown -> ${OUTPUT_MD}`);
  console.log(`field source workbook -> ${OUTPUT_XLSX}`);
}

main();
