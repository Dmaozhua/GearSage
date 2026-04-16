# 字段数据冲突解决策略 v1

- scope: Shimano baitcasting reel 当前 5 个样本
- status: review-layer policy only
- generated_at: 2026-04-16T12:32:57.953Z

这份策略只服务当前 Shimano baitcasting reel 这轮 identity enrichment / whitelist review / recheck 视图，不扩到全品类，不直接驱动 apply。

## 默认优先级草案

建议采用以下默认优先级：

1. `official`
2. `review_confirmed_manual`
3. `direct_write`
4. `cross_source_inferred`
5. `player`
6. `old_baseline_candidate`

说明：

- `official` 只代表当前样本、当前年款、当前版本绑定下的官方来源。
- `review_confirmed_manual` 用于人工复核后明确确认的值，优先级高于当前轮未复核的 whitelist 候选。
- `direct_write` 只代表年款对齐、白名单站直写的当前轮结果。
- `cross_source_inferred` 允许存在，但不能伪装成 `official`。
- `player` 代表已有玩家层值，但没有比当前轮更高的确认层支持。
- `old_baseline_candidate` 只保留审计意义，不应在冲突时胜出。

## 字段规则表

| field_key | 允许双来源共存 | 必须唯一真值 | 存储层保留策略 | 显示层优先级策略 | 冲突时优先级顺序 | 直接挂起转人工条件 |
| --- | --- | --- | --- | --- | --- | --- |
| model_year | no | yes | Retain all raw evidence in identity layer, but resolved model_year stays single-valued. | Show resolved model_year only. | official > review_confirmed_manual > player > old_baseline_candidate | Two year values conflict at same priority, or year only appears in noisy title without URL/SKU support. |
| alias | yes | canonical=yes, normalized=yes | Keep raw title, canonical_alias, normalized_alias, and alias_noise_tags together. | Audit/detail uses canonical_alias; binding/search uses normalized_alias. | official > review_confirmed_manual > player > old_baseline_candidate | Noise stripping still leaves ambiguous alias, or normalized alias collides across year/version. |
| version_signature | no | yes | Retain SKU evidence list plus one resolved version_signature. | Show resolved signature only. | official > review_confirmed_manual > player > old_baseline_candidate | SKU family list conflicts with model_year/reel_id binding, or signature mixes multiple generations. |
| body_material | yes | yes | Keep official and player-layer values separately; retain rejected candidate text for audit. | official > review_confirmed_manual > direct_write > player > old_baseline_candidate | official > review_confirmed_manual > direct_write > player > old_baseline_candidate | Main value contains tech wording, same-priority sources disagree on material core, or year binding differs. |
| body_material_tech | yes | yes | Keep normalized body-specific tech expression in resolved field; keep raw evidence text separately. | official > review_confirmed_manual > direct_write > player > old_baseline_candidate | official > review_confirmed_manual > direct_write > player > old_baseline_candidate | Phrase belongs to brake/gear/spool subsystem, or multiple body-tech phrases conflict at same priority. |
| gear_material | yes | yes | Keep official, inferred, and player-layer values separately; archive old baseline candidate only for audit. | official > review_confirmed_manual > direct_write > cross_source_inferred > player > old_baseline_candidate | official > review_confirmed_manual > direct_write > cross_source_inferred > player > old_baseline_candidate | No exact material phrase, year cannot be aligned, only tech/marketing phrase exists, or same-tier evidence disagrees. |

## 冲突类型处理

| conflict_type | 规则 | 示例 |
| --- | --- | --- |
| same_field_multi_source | Compare only evidence already bound to the same reel_id + model_year + SKU/detail_id. Higher source tier wins; same-tier disagreement goes to manual. | SRE5004 body_material_tech can accept JapanTackle Hagane body once bound to 2023 ANTARES DC MD detail rows. |
| same_field_different_evidence_level | Exact structured/material wording beats tech/marketing wording. review_confirmed_manual beats unresolved raw candidate at lower tier. | SRE5015 body_material review_manual Magnesium beats old candidate Core solid metal body. |
| cross_year_conflict | Never spread by model only. Values must remain bound to reel_id + model_year + SKU/detail_id. If year differs, do not merge; keep both or suspend to manual. | ANTARES DC 2021 inferred brass must not be generalized to ANTARES DC MD 2023 direct_write brass. |
| baseline_vs_new_review | old_baseline_candidate never wins over a reviewed current-round value. If baseline is semantically same after normalization, keep current resolved value and archive baseline only. | SRE5004 old baseline metal frames loses to review-confirmed Magnesium + HAGANE 机身. |

## 当前 5 个样本 conflict simulation

| sample_id | field_key | simulated_conflict | competing_values | resolved_value | resolved_layer | decision | manual_trigger |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SRE5003 | gear_material | TackleTour gives brass; JapanTackle anchors 2021 identity but has no direct gear material; no official value. | cross_source_inferred: Brass \| official: blank \| old_baseline_candidate: blank | Brass | inferred | cross_source_inferred wins; official remains blank. | no |
| SRE5004 | body_material_tech | Current review support confirms Hagane body while earlier review support view was blank. | review_confirmed_manual: HAGANE 机身 \| old_baseline_candidate: blank | HAGANE 机身 | player/review_support | review_confirmed_manual wins because it is body-specific and year-aligned. | no |
| SRE5015 | body_material | Whitelist candidate says Core solid metal body; manual review splits material and tech. | old_baseline_candidate: Core solid metal body \| review_confirmed_manual: Magnesium | Magnesium | player | review_confirmed_manual wins; tech wording is moved to body_material_tech. | no |
| SRE5019 | gear_material | JapanTackle has no exact material; TackleTour only mentions micro module gear tech. | direct_write: none \| cross_source_inferred: unsupported \| old_baseline_candidate: blank | blank | blank | manual_required; no exact material phrase. | yes |
| SRE5025 | alias | Raw title includes campaign noise 2026 Spring Trout Special while normalized alias strips it. | canonical_alias: 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 \| normalized_alias: 22 Aldebaran BFS | canonical_alias kept for audit; normalized_alias kept for binding | identity_dual | dual coexist is allowed for alias; canonical and normalized serve different purposes. | no |

## 当前结论

- 建议双路共存：`alias`、`body_material`、`body_material_tech`、`gear_material`
- 必须唯一真值：`model_year`、`version_signature`，以及所有字段的当前显示层 resolved value
- `gear_material` 继续维持“高成本特殊字段”口径，允许 `cross_source_inferred` 存在，但只能进入 `inferred` 路径。
- `old_baseline_candidate` 在当前策略下只保留审计意义，不参与最终显示层胜出。
