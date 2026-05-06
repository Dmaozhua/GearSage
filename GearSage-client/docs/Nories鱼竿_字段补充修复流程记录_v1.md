# Nories 鱼竿字段补充修复流程记录 v1

## 1. 当前批次

- 品牌：`44 Nories`
- 官网入口：`https://nories.com/bass/category/rods/`
- 中间表：`GearSage-client/pkgGear/data_raw/nories_rod_import.xlsx`
- normalized：`GearSage-client/pkgGear/data_raw/nories_rod_normalized.json`

## 2. product_technical Stage 5

### 2.1 字段口径

历史记录：本轮执行时 `product_technical` 曾按 rod 主商品层补充字段处理，用于承接该商品使用的官方技术名合集。

2026-05-06 Shimano 复核后，rod 全局口径已修订为 `rod_detail` SKU 级字段。本轮已按新口径迁移：如果整系列技术完全一致，也按详情行重复写入；如果官网技术模块有型号适用关系，则只写到对应 SKU。

- 只写入 `*_rod_import.xlsx / rod_detail` 详情表。
- `rod` 主表不维护该字段。
- normalized/raw 只在 variant 层保留，item 层不保留。
- 只从品牌官网 / 官方页面获取，优先官网独立产品技术模块；当官网 SKU 描述、规格列表或型号说明明确展示“具体子型号 ↔ 技术/结构”的对应关系时，可只写入对应 SKU。
- 不使用白名单站点、玩家资料、规格推断或跨品牌等价判断补写。
- 多个技术名使用 ` / ` 分隔；不确定时留空。
- 当前列位按全局流程放在 `Description` 后、`Extra Spec 1` 前。

### 2.2 Nories 本次来源

本次只使用 Nories 官网四个主商品页的官方信息：

- `GUIDE SYSTEM`
- `BLANK / BLANKS`
- `GRIP SYSTEM`
- `GRIP END / WEIGHT BALANCER`
- `TELESCOPIC SYSTEM`
- 规格列表中的 `2(telescopic)` 型号对应关系
- `Glass Composite / -Gc / VACUUM` 子型号说明
- `SHORT CARBON SOLID TIP`
- `MOMENT DELAY BLANK`

白名单辅助站不参与 `product_technical` 写值。

### 2.3 执行计划

1. 确认全局 `scripts/gear_export_schema.js` 的 `rodDetail` header 已包含 `product_technical`。
2. 确认最终表同步不再把 `product_technical` 放入 rod master merge。
3. 更新 Nories 构建脚本：`scripts/build_nories_rod_import.py`。
4. 新增专项修补脚本：`scripts/apply_nories_rod_product_technical_stage5.py`。
5. 写入 `nories_rod_normalized.json` variant 层 `product_technical`，并清理 item 层历史字段。
6. 清理 `nories_rod_import.xlsx / rod.product_technical`，写入 `rod_detail.product_technical`。
7. 保存 xlsx 后恢复 `rod_detail` 底色。
8. 输出 report，并检查覆盖率、列位、来源边界和误列。

### 2.4 本次字段值

| model | product_technical 来源口径 |
|---|---|
| `Road Runner VOICE LTT` | 官网 `GUIDE SYSTEM / GRIP SYSTEM / GRIP END` |
| `Road Runner VOICE HARD BAIT SPECIAL` | 官网 `BLANKS / GUIDE SYSTEM / TELESCOPIC SYSTEM / GRIP JOINT / SGt / Glass Composite / VACUUM` |
| `Road Runner STRUCTURE NXS` | 官网 `GUIDE SYSTEM / BLANK / SHORT CARBON SOLID TIP / MOMENT DELAY BLANK / GRIP SYSTEM / 2(telescopic)` |
| `Road Runner VOICE JUNGLE` | 官网 `GUIDE SYSTEM ＆ TELESCOPIC STOPPER / GRIP SYSTEM / REAR GRIP / GUIDE SYSTEM - Spinning Model / 2(telescopic)` |

### 2.5 交付检查

- `rod.product_technical` 必须不存在。
- `rod_detail.product_technical` 按 SKU 写入，覆盖率应为 `55 / 55`。
- 字段内容必须只包含官网技术名词，不写营销长句、钓组/饵型、玩家判断或白名单来源说明。
- `product_technical` 可空规则保留，但当前 Nories 四个主商品均有官网技术模块可写。
