# Shimano baitcasting reel first real apply execution plan v1

- generated_at: 2026-04-16
- scope: current 5 Shimano baitcasting reel samples / current 6 fields only

这份文档定义第一次真实 apply 的执行口径，但当前阶段仍然只做到：

- 入口脚本已落地
- plan / preview / audit 已生成
- 还没有真正执行 `--apply`

## 1. 本轮进入真实 apply 的字段

本轮进入 baseline 写入候选的字段：

- `model_year`
- `alias`
- `body_material`
- `body_material_tech`
- `gear_material`

说明：

- `model_year`
  - master 层
  - `fill_blank_only`
- `alias`
  - master 层
  - baseline 单列写 `normalized_alias`
  - `canonical_alias` 留 sidecar
- `body_material`
  - detail 层
  - 走受控替换
- `body_material_tech`
  - detail 层
  - 走受控替换 / 补空
- `gear_material`
  - detail 层
  - direct / inferred / confirmed_blank 都进入 apply 语义

## 2. 本轮 sidecar-only 的字段

本轮明确 sidecar-only：

- `version_signature`

原因：

- baseline 当前没有接收列
- 本轮已拍板：
  - 不加新列
  - 不做临时映射
  - 不借别的列落值

所以 `version_signature` 当前只进：

- apply audit
- consumer sidecar

不进 baseline。

## 3. 为什么 `version_signature` 本轮不进 baseline

因为当前更重要的是保持执行链可信，而不是为了“全部落进去”去做临时绕路。

如果现在为了推进 apply 把 `version_signature`：

- 写进别的列
- 和 alias 共用
- 写进 description

那后面会把字段语义搞乱，也会破坏审计性。

所以当前最安全的决定就是：

- `version_signature = sidecar-only`

## 4. 真实 apply 的输入 / 输出 / 回滚点 / 审计输出

### 输入

- apply input builder：  
  [`2026-04-16_shimano_baitcasting_reel_apply_input_v1.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.json)
- baseline import 副本：  
  [`shimano_baitcasting_reels_import_副本.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx)
- consumer 状态映射：  
  [`2026-04-16_shimano_baitcasting_reel_apply_consumer_state_mapping_v1.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_consumer_state_mapping_v1.xlsx)

### 输出

- apply plan：  
  [`2026-04-16_shimano_baitcasting_reel_first_real_apply_plan_v1.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_first_real_apply_plan_v1.json)
- apply preview：  
  [`2026-04-16_shimano_baitcasting_reel_first_real_apply_preview_v1.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_first_real_apply_preview_v1.xlsx)  
  [`2026-04-16_shimano_baitcasting_reel_first_real_apply_preview_v1.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_first_real_apply_preview_v1.md)
- apply audit：  
  [`2026-04-16_shimano_baitcasting_reel_first_real_apply_audit_v1.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_first_real_apply_audit_v1.json)

### 回滚点

当前回滚点非常清楚：

- 源 baseline workbook 不直接改
- 真实 apply 即使执行，也只写 candidate result workbook

也就是说，回滚动作就是：

- 丢弃 candidate result workbook
- 保留原始 baseline import 副本不动

### 审计输出

审计当前至少保留：

- `canonical_alias`
- `version_signature`
- `gear_material inferred` 语义
- `gear_material confirmed_blank` 语义

## 5. 真实 apply 执行入口

入口脚本：

- [`run_shimano_bc_first_real_apply_entry.js`](/Users/tommy/GearSage/scripts/run_shimano_bc_first_real_apply_entry.js)

执行约束：

- 默认只生成：
  - plan
  - preview
  - audit
  - checklist
- 只有显式带 `--apply` 才允许写 candidate result workbook

当前阶段没有执行 `--apply`。

## 6. 本轮 overwrite policy

- `model_year`
  - `fill_blank_only`
- `alias`
  - `controlled_replace_legacy_blank_or_noise`
- `body_material`
  - `controlled_replace_legacy_value`
- `body_material_tech`
  - `fill_blank_or_controlled_replace_if_review_confirmed`
- `gear_material`
  - direct/inferred：
    - 按 builder 行的 policy 执行
  - confirmed_blank：
    - 不回填
    - 保持空
    - sidecar 标注为 intentional blank

## 7. 当前阶段结论

当前第一次真实 apply 前，已经准备好的东西是：

- builder
- consumer
- preview
- audit
- checklist

当前唯一明确未进 baseline 的字段是：

- `version_signature`

所以本轮真正执行第一次真实 apply 的前提，只剩：

- 你确认接受 `version_signature sidecar-only`
- 并且确认当前 preview 没有需要再调整的写入字段
