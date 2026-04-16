# Shimano baitcasting reel apply consumer 适配方案 v1

- generated_at: 2026-04-16
- scope: current 5 Shimano baitcasting reel samples / current 6 fields only

这份方案只解决：

- 现有 apply consumer 怎么从旧输入读值
- 当前 builder 输出应该怎么进入 consumer
- 在不推进真实 apply 的前提下，怎么先把 consumer 逻辑收口到可 dry-run 验证

不包含：

- 真实 apply
- 最终总表修改
- 导库
- 数据库写入
- 样本扩展
- 新字段扩展

## 1. 旧 consumer 当前怎么读旧输入

当前旧 consumer 的代表脚本是：

- [`apply_shimano_bc_approved_patch.js`](/Users/tommy/GearSage/scripts/apply_shimano_bc_approved_patch.js)

它当前的输入假设是：

- 读取 `approved patch`
- 以 `detail_id` 为主要目标键
- 校验：
  - `reel_id`
  - `SKU`
  - `model_year`
- 主要围绕 detail 层字段工作
- 对 `body_material` / `gear_material` 这类旧 patch 字段更熟悉

它当前不擅长的点是：

- 不能消费 master-scope builder rows
- 不能表达 `dual_alias`
- 不能表达 `inferred`
- 不能表达 `confirmed_blank`
- 不能显式消费 `body_material_tech`
- 遇到 `version_signature` 时没有 baseline 列可写

## 2. 现在要怎么读 builder 输出

builder 输出是：

- [`2026-04-16_shimano_baitcasting_reel_apply_input_v1.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.json)
- [`2026-04-16_shimano_baitcasting_reel_apply_input_v1.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.xlsx)

consumer 在当前阶段应改成：

1. 先读 builder rows，而不是直接读 approved patch
2. 按 `target_scope` 分流：
   - `master`
   - `detail`
3. 再按 `apply_input_layer` 进入不同处理逻辑
4. 最后根据：
   - `target_baseline_column`
   - `overwrite_policy`
   - `source_type`
   - `evidence_type`
   决定 dry-run 结果

## 3. 状态到 consumer 内部逻辑的映射

### 3.1 master_identity_value

适用字段：

- `model_year`
- `version_signature`

consumer 处理：

- 按 `reel_id + field_key` 聚合
- `model_year`
  - 正常进入 master 写入候选
  - 当前建议：`fill_blank_only`
- `version_signature`
  - 当前 baseline 缺列
  - 本阶段不做临时映射
  - 只能：
    - `hold`
    - `skip baseline write`
    - 保留在 consumer sidecar / audit 层

### 3.2 master_dual_alias_value

适用字段：

- `alias`

consumer 处理：

- builder 行里同时保留：
  - `canonical_alias`
  - `normalized_alias`
- baseline 当前单列 `alias` 只写：
  - `normalized_alias`
- `canonical_alias` 不丢，保留在：
  - consumer audit metadata
  - dry-run 输出

这条规则对应当前 `dual_source_kept` 语义，不把双来源压扁成不可追溯的单值。

### 3.3 detail_confirmed_value

适用字段：

- `body_material`
- `body_material_tech`
- direct `gear_material`

consumer 处理：

- 正常进入 detail 写入候选
- 遵守 `overwrite_policy`
- 不再依赖旧 patch 对字段做隐式猜测

特别说明：

- `body_material_tech`
  - 当前必须显式消费
  - 不能继续依赖旧 patch 顺带解释

### 3.4 detail_inferred_value

适用字段：

- `SRE5003 gear_material`

consumer 处理：

- 可以消费
- 但必须保留：
  - `apply_input_layer = detail_inferred_value`
  - `source_type / evidence_type`
  - 非 official 语义

也就是说：

- 可以进入未来 apply 输入
- 但不能在 consumer 内被降格成普通 confirmed value
- 更不能被提升成 official

### 3.5 detail_confirmed_blank

适用字段：

- `SRE5019 gear_material`

consumer 处理：

- 这是“已确认留空”
- 不是 scrape miss
- 不是待补值
- 不是失败

所以 consumer 必须显式把它识别成：

- `confirmed blank`
- `no_backfill`
- `blank is intentional`

这样下轮 dry-run 才不会把它重新当成漏抓。

## 4. 哪些字段写 master，哪些写 detail

写 master：

- `model_year`
- `alias`
- `version_signature`

写 detail：

- `body_material`
- `body_material_tech`
- `gear_material`

## 5. inferred / confirmed_blank / dual_alias 的具体口径

### inferred

- 当前只在 `SRE5003 gear_material` 使用
- 进入 consumer，但必须保持：
  - `inferred`
  - `non-official`

### confirmed_blank

- 当前只在 `SRE5019 gear_material` 使用
- 进入 consumer，但结果是：
  - 保持空
  - 保留“已确认空值”语义

### dual_alias

- 当前 alias 的稳定状态是：
  - `canonical_alias`
  - `normalized_alias`
- baseline 单列只接 `normalized_alias`
- `canonical_alias` 必须保留在审计层

## 6. version_signature 缺列时，当前阶段怎么处理

当前阶段的安全处理是：

- **挂起 baseline 写入**
- **跳过真实列映射**
- **保留 sidecar / audit 记录**

不建议：

- 临时写进别的列
- 把它和 alias 或 description 混用
- 为了推进 dry-run 而做字段挪用

一句话说：

`version_signature` 当前应该 `hold/skip baseline write`，而不是临时映射。

## 7. baseline 旧值当前建议

当前建议继续保持：

- **受控替换**

不建议：

- 先做大面积清理

原因：

- baseline 旧值仍有审计意义
- 当前 review / conflict 结论已经足够支持逐字段受控替换
- 大面积清理会让“为什么改掉旧值”变得更难追

## 8. 当前阶段结论

在 consumer 适配阶段，我们要先完成的是：

- 让 consumer 正确理解 builder 状态

不是：

- 直接真实 apply

当前最安全的推进顺序是：

1. builder 输出稳定
2. consumer 能消费 builder 状态
3. 只保留 `version_signature` 这类 baseline 结构缺口
4. 再进入下一轮 dry-run
5. 最后才讨论第一次真实 apply
