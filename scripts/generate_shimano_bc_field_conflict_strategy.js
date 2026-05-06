const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_MD = path.resolve(
  REPO_ROOT,
  'GearSage-client/docs/Shimano_baitcasting_reel_字段数据冲突解决策略_v1.md'
);
const OUTPUT_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_field_conflict_resolution_strategy_v1.xlsx');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const priorityLegend = [
  {
    priority_rank: 1,
    source_tier: 'official',
    recommended: 'yes',
    meaning: 'Official page or official structured field with year/version binding intact.',
  },
  {
    priority_rank: 2,
    source_tier: 'review_confirmed_manual',
    recommended: 'yes',
    meaning: 'Human-reviewed and explicitly confirmed value for the bound sample/year/SKU.',
  },
  {
    priority_rank: 3,
    source_tier: 'direct_write',
    recommended: 'yes',
    meaning: 'Current-round exact material/field phrase from an allowed whitelist source, year-aligned.',
  },
  {
    priority_rank: 4,
    source_tier: 'cross_source_inferred',
    recommended: 'conditional',
    meaning: 'Strong inference from two high-confidence sources; never treated as official.',
  },
  {
    priority_rank: 5,
    source_tier: 'player',
    recommended: 'conditional',
    meaning: 'Existing player-layer value without stronger current-round review support.',
  },
  {
    priority_rank: 6,
    source_tier: 'old_baseline_candidate',
    recommended: 'no',
    meaning: 'Legacy import or old candidate value. Retain only for audit and comparison.',
  },
];

const fieldRules = [
  {
    field_key: 'model_year',
    allow_dual_source_coexist: 'no',
    requires_single_resolved_truth: 'yes',
    storage_retention_policy: 'Retain all raw evidence in identity layer, but resolved model_year stays single-valued.',
    display_priority_strategy: 'Show resolved model_year only.',
    conflict_priority_order: 'official > review_confirmed_manual > player > old_baseline_candidate',
    suspend_to_manual_when: 'Two year values conflict at same priority, or year only appears in noisy title without URL/SKU support.',
    notes: 'direct_write / cross_source_inferred are not recommended source tiers for model_year in this round.',
  },
  {
    field_key: 'alias',
    allow_dual_source_coexist: 'yes',
    requires_single_resolved_truth: 'canonical=yes, normalized=yes',
    storage_retention_policy: 'Keep raw title, canonical_alias, normalized_alias, and alias_noise_tags together.',
    display_priority_strategy: 'Audit/detail uses canonical_alias; binding/search uses normalized_alias.',
    conflict_priority_order: 'official > review_confirmed_manual > player > old_baseline_candidate',
    suspend_to_manual_when: 'Noise stripping still leaves ambiguous alias, or normalized alias collides across year/version.',
    notes: 'Alias is intentionally split into canonical and normalized forms; conflict is resolved separately for each.',
  },
  {
    field_key: 'version_signature',
    allow_dual_source_coexist: 'no',
    requires_single_resolved_truth: 'yes',
    storage_retention_policy: 'Retain SKU evidence list plus one resolved version_signature.',
    display_priority_strategy: 'Show resolved signature only.',
    conflict_priority_order: 'official > review_confirmed_manual > player > old_baseline_candidate',
    suspend_to_manual_when: 'SKU family list conflicts with model_year/reel_id binding, or signature mixes multiple generations.',
    notes: 'Used as an identity binding helper, not a marketing field.',
  },
  {
    field_key: 'body_material',
    allow_dual_source_coexist: 'yes',
    requires_single_resolved_truth: 'yes',
    storage_retention_policy: 'Keep official and player-layer values separately; retain rejected candidate text for audit.',
    display_priority_strategy: 'official > review_confirmed_manual > direct_write > player > old_baseline_candidate',
    conflict_priority_order: 'official > review_confirmed_manual > direct_write > player > old_baseline_candidate',
    suspend_to_manual_when: 'Main value contains tech wording, same-priority sources disagree on material core, or year binding differs.',
    notes: 'Only pure material core values are allowed in body_material.',
  },
  {
    field_key: 'body_material_tech',
    allow_dual_source_coexist: 'yes',
    requires_single_resolved_truth: 'yes',
    storage_retention_policy: 'Keep normalized body-specific tech expression in resolved field; keep raw evidence text separately.',
    display_priority_strategy: 'official > review_confirmed_manual > direct_write > player > old_baseline_candidate',
    conflict_priority_order: 'official > review_confirmed_manual > direct_write > player > old_baseline_candidate',
    suspend_to_manual_when: 'Phrase belongs to brake/gear/spool subsystem, or multiple body-tech phrases conflict at same priority.',
    notes: 'body_material_tech may contain multiple normalized body-tech fragments combined into one resolved phrase.',
  },
  {
    field_key: 'gear_material',
    allow_dual_source_coexist: 'yes',
    requires_single_resolved_truth: 'yes',
    storage_retention_policy: 'Keep official, inferred, and player-layer values separately; archive old baseline candidate only for audit.',
    display_priority_strategy: 'official > review_confirmed_manual > direct_write > cross_source_inferred > player > old_baseline_candidate',
    conflict_priority_order: 'official > review_confirmed_manual > direct_write > cross_source_inferred > player > old_baseline_candidate',
    suspend_to_manual_when: 'No exact material phrase, year cannot be aligned, only tech/marketing phrase exists, or same-tier evidence disagrees.',
    notes: 'gear_material is a high-cost special field; cross_source_inferred can exist but must never be promoted to official.',
  },
];

const conflictTypeRules = [
  {
    conflict_type: 'same_field_multi_source',
    rule: 'Compare only evidence already bound to the same reel_id + model_year + SKU/detail_id. Higher source tier wins; same-tier disagreement goes to manual.',
    example: 'SRE5004 body_material_tech can accept JapanTackle Hagane body once bound to 2023 ANTARES DC MD detail rows.',
  },
  {
    conflict_type: 'same_field_different_evidence_level',
    rule: 'Exact structured/material wording beats tech/marketing wording. review_confirmed_manual beats unresolved raw candidate at lower tier.',
    example: 'SRE5015 body_material review_manual Magnesium beats old candidate Core solid metal body.',
  },
  {
    conflict_type: 'cross_year_conflict',
    rule: 'Never spread by model only. Values must remain bound to reel_id + model_year + SKU/detail_id. If year differs, do not merge; keep both or suspend to manual.',
    example: 'ANTARES DC 2021 inferred brass must not be generalized to ANTARES DC MD 2023 direct_write brass.',
  },
  {
    conflict_type: 'baseline_vs_new_review',
    rule: 'old_baseline_candidate never wins over a reviewed current-round value. If baseline is semantically same after normalization, keep current resolved value and archive baseline only.',
    example: 'SRE5004 old baseline metal frames loses to review-confirmed Magnesium + HAGANE 机身.',
  },
];

const simulations = [
  {
    sample_id: 'SRE5003',
    field_key: 'gear_material',
    simulated_conflict: 'TackleTour gives brass; JapanTackle anchors 2021 identity but has no direct gear material; no official value.',
    competing_values: 'cross_source_inferred: Brass | official: blank | old_baseline_candidate: blank',
    resolved_value: 'Brass',
    resolved_layer: 'inferred',
    decision: 'cross_source_inferred wins; official remains blank.',
    manual_trigger: 'no',
  },
  {
    sample_id: 'SRE5004',
    field_key: 'body_material_tech',
    simulated_conflict: 'Current review support confirms Hagane body while earlier review support view was blank.',
    competing_values: 'review_confirmed_manual: HAGANE 机身 | old_baseline_candidate: blank',
    resolved_value: 'HAGANE 机身',
    resolved_layer: 'player/review_support',
    decision: 'review_confirmed_manual wins because it is body-specific and year-aligned.',
    manual_trigger: 'no',
  },
  {
    sample_id: 'SRE5015',
    field_key: 'body_material',
    simulated_conflict: 'Whitelist candidate says Core solid metal body; manual review splits material and tech.',
    competing_values: 'old_baseline_candidate: Core solid metal body | review_confirmed_manual: Magnesium',
    resolved_value: 'Magnesium',
    resolved_layer: 'player',
    decision: 'review_confirmed_manual wins; tech wording is moved to body_material_tech.',
    manual_trigger: 'no',
  },
  {
    sample_id: 'SRE5019',
    field_key: 'gear_material',
    simulated_conflict: 'JapanTackle has no exact material; TackleTour only mentions micro module gear tech.',
    competing_values: 'direct_write: none | cross_source_inferred: unsupported | old_baseline_candidate: blank',
    resolved_value: 'blank',
    resolved_layer: 'blank',
    decision: 'manual_required; no exact material phrase.',
    manual_trigger: 'yes',
  },
  {
    sample_id: 'SRE5025',
    field_key: 'alias',
    simulated_conflict: 'Raw title includes campaign noise 2026 Spring Trout Special while normalized alias strips it.',
    competing_values: 'canonical_alias: 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 | normalized_alias: 22 Aldebaran BFS',
    resolved_value: 'canonical_alias kept for audit; normalized_alias kept for binding',
    resolved_layer: 'identity_dual',
    decision: 'dual coexist is allowed for alias; canonical and normalized serve different purposes.',
    manual_trigger: 'no',
  },
];

function renderMarkdown() {
  const lines = [
    '# 字段数据冲突解决策略 v1',
    '',
    '- scope: Shimano baitcasting reel 当前 5 个样本',
    '- status: review-layer policy only',
    `- generated_at: ${new Date().toISOString()}`,
    '',
    '这份策略只服务当前 Shimano baitcasting reel 这轮 identity enrichment / whitelist review / recheck 视图，不扩到全品类，不直接驱动 apply。',
    '',
    '## 默认优先级草案',
    '',
    '建议采用以下默认优先级：',
    '',
    '1. `official`',
    '2. `review_confirmed_manual`',
    '3. `direct_write`',
    '4. `cross_source_inferred`',
    '5. `player`',
    '6. `old_baseline_candidate`',
    '',
    '说明：',
    '',
    '- `official` 只代表当前样本、当前年款、当前版本绑定下的官方来源。',
    '- `review_confirmed_manual` 用于人工复核后明确确认的值，优先级高于当前轮未复核的 whitelist 候选。',
    '- `direct_write` 只代表年款对齐、白名单站直写的当前轮结果。',
    '- `cross_source_inferred` 允许存在，但不能伪装成 `official`。',
    '- `player` 代表已有玩家层值，但没有比当前轮更高的确认层支持。',
    '- `old_baseline_candidate` 只保留审计意义，不应在冲突时胜出。',
    '',
    '## 字段规则表',
    '',
    '| field_key | 允许双来源共存 | 必须唯一真值 | 存储层保留策略 | 显示层优先级策略 | 冲突时优先级顺序 | 直接挂起转人工条件 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...fieldRules.map((row) => `| ${[
      row.field_key,
      row.allow_dual_source_coexist,
      row.requires_single_resolved_truth,
      row.storage_retention_policy,
      row.display_priority_strategy,
      row.conflict_priority_order,
      row.suspend_to_manual_when,
    ].map((value) => String(value).replace(/\|/g, '\\|')).join(' | ')} |`),
    '',
    '## 冲突类型处理',
    '',
    '| conflict_type | 规则 | 示例 |',
    '| --- | --- | --- |',
    ...conflictTypeRules.map((row) => `| ${[
      row.conflict_type,
      row.rule,
      row.example,
    ].map((value) => String(value).replace(/\|/g, '\\|')).join(' | ')} |`),
    '',
    '## 当前 5 个样本 conflict simulation',
    '',
    '| sample_id | field_key | simulated_conflict | competing_values | resolved_value | resolved_layer | decision | manual_trigger |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...simulations.map((row) => `| ${[
      row.sample_id,
      row.field_key,
      row.simulated_conflict,
      row.competing_values,
      row.resolved_value,
      row.resolved_layer,
      row.decision,
      row.manual_trigger,
    ].map((value) => String(value).replace(/\|/g, '\\|')).join(' | ')} |`),
    '',
    '## 当前结论',
    '',
    '- 建议双路共存：`alias`、`body_material`、`body_material_tech`、`gear_material`',
    '- 必须唯一真值：`model_year`、`version_signature`，以及所有字段的当前显示层 resolved value',
    '- `gear_material` 继续维持“高成本特殊字段”口径，允许 `cross_source_inferred` 存在，但只能进入 `inferred` 路径。',
    '- `old_baseline_candidate` 在当前策略下只保留审计意义，不参与最终显示层胜出。',
    '',
  ];

  return lines.join('\n');
}

function writeWorkbook() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(priorityLegend), 'priority_legend');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(fieldRules), 'field_rules');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(conflictTypeRules), 'conflict_type_rules');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(simulations), 'conflict_simulation');
  XLSX.writeFile(workbook, OUTPUT_XLSX);
}

function main() {
  ensureDir(OUTPUT_MD);
  ensureDir(OUTPUT_XLSX);
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(), 'utf8');
  writeWorkbook();
  console.log(`conflict strategy markdown -> ${OUTPUT_MD}`);
  console.log(`conflict strategy workbook -> ${OUTPUT_XLSX}`);
}

main();
