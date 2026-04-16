# Shimano baitcasting reel whitelist apply workflow

更新时间：2026-04-16  
适用范围：`pkgGear/data_raw`、`experiment/report/review`  
当前阶段：apply 前闭环验证

---

## 一、目标

这条 workflow 只负责：

- 读取 approved patch
- 对 baseline import 副本做受控 apply 校验
- 输出 diff 报告
- 在显式 `--apply` 时，写出一份 apply 结果 workbook

不包含：

- 改最终总表
- 导库
- 数据库操作
- 扩大实验范围

---

## 二、输入与输出

### 输入

- baseline import 副本：  
  [`shimano_baitcasting_reels_import_副本.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx)
- approved patch：  
  [`2026-04-16_shimano_baitcasting_reel_whitelist_patch.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_patch.json)

### 输出

- apply diff workbook：  
  [`2026-04-16_shimano_baitcasting_reel_whitelist_apply_diff.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_apply_diff.xlsx)
- apply diff markdown：  
  [`2026-04-16_shimano_baitcasting_reel_whitelist_apply_diff.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_apply_diff.md)
- apply result workbook（仅 `--apply` 模式写出）：  
  [`2026-04-16_shimano_baitcasting_reel_whitelist_apply_result.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_apply_result.xlsx)

---

## 三、脚本

脚本位置：  
[`apply_shimano_bc_approved_patch.js`](/Users/tommy/GearSage/scripts/apply_shimano_bc_approved_patch.js)

### 3.1 dry-run

默认模式是 dry-run：

```bash
cd /Users/tommy/GearSage
node scripts/apply_shimano_bc_approved_patch.js
```

效果：

- 不写 baseline import 副本
- 不写 apply result workbook
- 只输出 diff workbook 和 markdown

### 3.2 真实 apply

```bash
cd /Users/tommy/GearSage
node scripts/apply_shimano_bc_approved_patch.js --apply
```

效果：

- 仍然不改最终总表
- 仍然不导库
- 仍然不碰数据库
- 只把 patch 通过校验且目标单元格为空的值，写进一份 apply result workbook

---

## 四、硬约束

### 4.1 只吃 approved patch

apply 脚本只读取：

- approved patch JSON

不能直接读取：

- 原始 experiment 候选
- review 候选表
- 未审核 patch

### 4.2 只允许更新 baseline import 副本中的空值

如果目标字段已有值，apply 会跳过，不覆盖。

### 4.3 绑定键

主绑定键：

- `detail_id`

附加校验：

- `reel_id`
- `model_year`
- `SKU`

如果以下任一条件不满足，行状态会变成 `blocked_validation`：

- `detail_id` 找不到
- `reel_id` 不一致
- `SKU` 不一致
- patch 中 `model_year` 为空
- baseline import 中 `model_year` 为空
- patch 与 baseline 的 `model_year` 不一致

### 4.4 字段写入规则

- `body_material`：写 patch 的 `approved_value`
- `body_material_tech`：写 patch 的 `body_material_tech`
- `gear_material`：写 patch 的 `approved_value`

其中：

- `body_material` 只保留纯材质值，例如 `Magnesium`、`Aluminum alloy`
- `body_material_tech` 单独放技术名/结构表达

---

## 五、diff 报告怎么看

diff 报告会标出每一条 patch row 的状态：

- `would_apply`
- `applied`
- `no_change`
- `blocked_validation`

常见 reason_code：

- `detail_id_not_found`
- `master_row_not_found`
- `reel_id_mismatch`
- `sku_mismatch`
- `patch_model_year_blank`
- `baseline_model_year_blank`
- `model_year_mismatch`

这一步的意义是：

- 在真正 apply 前，看清楚哪些行可以安全进入 baseline import 副本
- 哪些行还卡在 `model_year` 或绑定信息不完整

---

## 六、当前建议

当前建议先持续使用 dry-run，直到：

1. `model_year` 校验问题收干净
2. approved patch 没有字段口径争议
3. diff 报告中不存在不该发生的 `blocked_validation`

在这之前，不要把 apply 结果继续推进到最终总表或数据库。
