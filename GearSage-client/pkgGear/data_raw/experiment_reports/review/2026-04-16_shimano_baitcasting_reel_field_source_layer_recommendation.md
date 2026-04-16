# Shimano baitcasting reel 字段来源分层建议表

- generated_at: 2026-04-16T11:02:05.486Z
- input_review: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_review_filled.xlsx`
- input_patch: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_patch.json`
- strategy_doc_loaded: yes

当前只围绕这轮 Shimano baitcasting reel 已涉及字段给建议，不扩到别的字段。

| field_key | 推荐来源层级 | 当前推荐显示优先级 | 是否适合自动化补值 | 当前主要风险 | 是否建议继续扩大实验范围 |
| --- | --- | --- | --- | --- | --- |
| model_year | dual | official > player | yes_after_identity_review | archive or title year may be noisy if page includes campaign text | no_first_stabilize_alias_rules |
| alias | dual | official canonical alias > player normalized alias | partial_review_required | page title may mix campaign text, archive labels, or extra descriptors | no_first_normalize_current_sample |
| version_signature | dual | identity_normalized signature | yes_in_identity_stage | sku count or year token can drift if identity source is wrong | no_first_hold_current_binding_shape |
| body_material | dual | official > player | partial_review_required | marketing or technology wording often gets mistaken for pure material | no_first_finish_source_split_and_review_loop |
| body_material_tech | dual | official > player | partial_review_required | technology phrases may be incomplete, mixed with material, or inconsistent across years | no_first_stabilize_tech_phrase_normalization |
| gear_material | player | player | conditional_exact_material_only | generic gear marketing text is easy to over-read as material | no_first_collect_more_exact_hits |

## 字段观察

- `model_year`: Identity layer already hit all 5 sample years and should be the downstream binding base.
- `alias`: All 5 samples have alias candidates, but at least one sample still needs manual cleanup.
- `version_signature`: Current sample signatures are stable enough to support whitelist binding after identity review.
- `body_material`: Current review has 24 candidate rows, with 14 manual overrides. Dual-source design is necessary.
- `body_material_tech`: This field should absorb HAGANE / CORESOLID / fully machined style wording so body_material stays pure.
- `gear_material`: Current review has 6 candidate rows, all from player-side evidence, and only exact material phrases should pass.

## 当前建议归类

- official：当前这轮没有单独建议只走 official 的字段。
- player：`gear_material`
- dual：`model_year`、`alias`、`version_signature`、`body_material`、`body_material_tech`

## 备注

- 当前流程顺序固定为：`identity enrichment -> whitelist 字段补值 -> review/patch -> apply（后置）`。
- `model_year` 不应再被当成人工前置 blocker，而应先在 identity enrichment 阶段补齐。
- `body_material` 保持纯材质值，`body_material_tech` 承接技术/结构表达。
