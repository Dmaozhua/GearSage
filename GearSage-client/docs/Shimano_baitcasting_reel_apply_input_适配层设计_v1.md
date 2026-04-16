# Shimano baitcasting reel apply input 适配层设计 v1

- generated_at: 2026-04-16T12:45:47.787Z
- scope: current 5 Shimano baitcasting reel samples / current 6 fields only

这份设计只解决“当前确认状态如何进入 apply 输入”，不修改现有 whitelist patch，不推进真实 apply。

## 目标

- 把 identity / review / conflict-tagged 状态翻译成一层可进入 apply 前验证的输入层
- 不直接拿现有 patch 硬写 baseline
- 把 master / detail 字段分别包装成可控的 apply input 状态

## 重点回答

### 1. master 字段 `model_year / alias / version_signature` 怎么进入 apply 输入

- `model_year`：进入 `master_identity_value` 状态，master-scope，值直接取当前 identity-resolved year。
- `alias`：进入 `master_dual_alias_value` 状态，apply input 同时保留 `canonical_alias` 与 `normalized_alias`；对当前 baseline 单列，默认映射 `normalized_alias`。
- `version_signature`：进入 `master_identity_value` 状态，但当前 baseline 缺列，所以只能先表达在 apply input 里，不能直接落 baseline。

### 2. `alias = dual_source_kept` 怎么映射到当前 baseline 单列

- baseline 当前只有一个 `alias` 列，所以建议：
  - apply input 内保留双层：`canonical_alias` + `normalized_alias`
  - baseline 单列默认写 `normalized_alias`
  - `canonical_alias` 保留在 apply input metadata / audit layer，不丢弃

### 3. `accepted_inferred` 怎么在 apply 输入层表达，避免误当 official

- 进入 `detail_inferred_value` 状态
- apply input 里显式标注来源层是 `inferred`
- 不允许在 apply input 阶段降格成普通 direct value，更不允许升成 `official`

### 4. `accepted_manual_blank` 怎么在 apply 输入层显式表达，避免下次又被当成漏抓

- 进入 `detail_confirmed_blank` 状态
- apply input 里显式写入“这是已确认留空”而不是“无值”
- 这样后续 dry-run / apply 才不会把它重新识别成 scrape miss

### 5. baseline 旧值建议先清理还是允许受控替换

- 当前建议：**允许受控替换，不建议先做大面积预清理**
- 原因：
  - baseline 旧值仍有审计意义
  - 当前 5 个样本已经有 review / conflict 结论，可以逐字段受控替换
  - 直接先清理会让“旧值为什么被替换”这条证据链变弱

## apply input 最小状态集

- `master_identity_value`
- `master_dual_alias_value`
- `detail_confirmed_value`
- `detail_inferred_value`
- `detail_confirmed_blank`

补充说明：

- `version_signature` 目前还额外需要 `blocked_missing_baseline_column` 这个映射结果，不是因为状态不够，而是 baseline 结构还没接住它。

## 当前 5 个样本的 apply input simulation

- 可直接转成 apply input：SRE5003:body_material、SRE5004:body_material、SRE5015:body_material、SRE5019:body_material、SRE5025:body_material
- 需要新增 apply input 状态字段：SRE5003:alias、SRE5003:body_material_tech、SRE5003:gear_material、SRE5003:model_year、SRE5004:alias、SRE5004:body_material_tech、SRE5004:gear_material、SRE5004:model_year、SRE5015:alias、SRE5015:body_material_tech、SRE5015:gear_material、SRE5015:model_year、SRE5019:alias、SRE5019:body_material_tech、SRE5019:gear_material、SRE5019:model_year、SRE5025:alias、SRE5025:body_material_tech、SRE5025:gear_material、SRE5025:model_year
- 因 baseline 缺列不能直接映射：SRE5003:version_signature、SRE5004:version_signature、SRE5015:version_signature、SRE5019:version_signature、SRE5025:version_signature

## 状态清单

| apply_input_layer | applies_to_fields | status_examples | notes |
| --- | --- | --- | --- |
| master_dual_alias_value | alias | requires_new_apply_input_state | Keep canonical_alias='21 Antares DC Japan model 2021' in apply metadata, but map normalized_alias='21 Antares DC' into current single alias column. \| Keep canonical_alias='23 Antares DC MD Monster Drive 2023' in apply metadata, but map normalized_alias='23 Antares DC MD Monster Drive' into current single alias column. |
| detail_direct_value | body_material | ready_with_controlled_replace | Baseline currently holds legacy value 'Hagane aluminum alloy body', so this field needs controlled replacement rather than blank fill. \| Baseline currently holds legacy value 'Fully machined aluminum body and side plates', so this field needs controlled replacement rather than blank fill. |
| detail_confirmed_value | body_material, body_material_tech, gear_material | ready_with_controlled_replace, requires_new_apply_input_state | body_material_tech is confirmed in review support layer and should enter apply input explicitly rather than depending on old body patch payload. \| Baseline currently holds legacy value 'metal frames', so this field needs controlled replacement rather than blank fill. |
| detail_inferred_value | gear_material | requires_new_apply_input_state | Keep this as inferred/non-official inside apply input. Do not promote it to official or plain direct value. |
| master_identity_value | model_year, version_signature | blocked_missing_baseline_column, requires_new_apply_input_state | Use identity-resolved model_year as master-scoped apply input. This value should be packaged outside the current detail-only patch. \| version_signature needs a new baseline master column or a sidecar apply state. It cannot map directly today. |
| detail_confirmed_blank | gear_material | requires_new_apply_input_state | This blank is intentional. Apply input must carry explicit confirmed_blank state so it is not treated as missing scrape. |

## 实现状态

这份设计对应的 builder 已经落地：

- builder 脚本：  
  [`build_shimano_bc_apply_input.js`](/Users/tommy/GearSage/scripts/build_shimano_bc_apply_input.js)
- apply input JSON：  
  [`2026-04-16_shimano_baitcasting_reel_apply_input_v1.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.json)
- apply input workbook：  
  [`2026-04-16_shimano_baitcasting_reel_apply_input_v1.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.xlsx)
- apply input summary：  
  [`2026-04-16_shimano_baitcasting_reel_apply_input_summary_v1.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_summary_v1.md)

builder 已经能把当前 5 个样本、当前 6 个字段的稳定状态包装出来。

但 builder 驱动的第三轮 dry-run 预检查也说明：

- 当前 apply consumer 还不能直接消费这些新状态
- `version_signature` 仍然缺 baseline 接收列

所以当前阶段已经从“只有设计”推进到了：

- **设计 + builder 实现完成**
- **consumer 适配已进入可 dry-run 阶段**

## consumer 适配进展

当前 consumer 适配输出物：

- 适配方案：  
  [`Shimano_baitcasting_reel_apply_consumer_适配方案_v1.md`](/Users/tommy/GearSage/GearSage-client/docs/Shimano_baitcasting_reel_apply_consumer_适配方案_v1.md)
- consumer 状态映射：  
  [`2026-04-16_shimano_baitcasting_reel_apply_consumer_state_mapping_v1.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_consumer_state_mapping_v1.xlsx)
- consumer-driven dry-run：  
  [`2026-04-16_shimano_baitcasting_reel_consumer_driven_dry_run_v1.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_consumer_driven_dry_run_v1.md)

当前 consumer-driven dry-run 说明：

- `consumer_result_type:consumable = 120`
- `consumer_result_type:blocked_baseline_schema_gap = 24`
- `blocked_consumer_support_rows = 0`

这表示：

- builder 产出的状态集已经被 consumer 适配层正确识别
- 当前剩余问题不再是状态消费问题
- 剩余问题只在 baseline 结构：
  - `version_signature` 缺列
