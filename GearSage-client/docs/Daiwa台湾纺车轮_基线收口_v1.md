# Daiwa 台湾纺车轮 基线收口 v1

版本：v1  
状态：阶段性验收通过  
更新时间：2026-04-21

---

## 1. 当前范围

来源站点：

- 台湾官网列表  
  `https://www.daiwaseiko.com.tw/product-list/reel/spinning_reel/`

当前正式中间层：

- [daiwa_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import.xlsx)

测试基线来源：

- [daiwa_spinning_reels_import_test.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import_test.xlsx)
- [daiwa_tw_spinning_test_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_test_normalized.json)

当前主商品：

- `33`

当前 detail：

- `219`

---

## 2. 当前已收住的流程

当前台湾官网纺车轮链路已经成立：

1. 列表页抓主商品
2. 详情页抓：
   - `產品說明`
   - `詳細規格`
3. 规格图 OCR
4. 按家族定点 parser
5. detail 回写中间层
6. 主图落地并写 CDN 格式 `images`

这条链路当前不是概念验证，而是已经可复用。

---

## 3. 当前主表状态

主表当前已经补齐：

- `model`
- `model_year`
- `alias`
- `images`
- `Description`

当前统计：

- `master_desc_empty = 0`
- `master_year_empty = 0`
- `master_alias_empty = 0`

---

## 4. 当前 detail 核心状态

当前 detail 已稳定承接：

- `GEAR RATIO`
- `WEIGHT`
- `cm_per_turn`
- `Nylon_lb_m`
- `pe_no_m`
- `line_capacity_display`
- `bearing_count_roller`
- `MAX DRAG`
- `market_reference_price`
- `product_code`

当前统计：

- `detail_ratio_empty = 1`
- `detail_weight_empty = 0`
- `detail_cm_empty = 14`
- `detail_price_empty = 0`
- `detail_code_empty = 0`
- `detail_line_empty = 0`
- `detail_max_empty = 1`

说明：

- `detail_ratio_empty = 1`
  - 当前主要保留在 `SF-2500SS`
- `detail_cm_empty = 14`
  - 多数来自原图本身没有 `cm_per_turn` 的组

---

## 5. 当前新增承接字段

当前已加入并开始使用的字段：

- `spool_diameter_mm`
- `body_material`
- `handle_knob_type`

当前口径：

- 官网图明确给值才写
- 官网图没给就空
- 不为了“补满”猜值

---

## 6. 当前合理空值

以下空值当前视为合理空值：

- 一些海水大号组没有 `handle_length_mm`
- 一些老款 / 简版图没有 `cm_per_turn`
- 部分组官网图没有：
  - `spool_diameter_mm`
  - `body_material`
  - `handle_knob_type`

这些当前不应强行补满。

---

## 7. 防污染机制

当前已经不允许再按全表试错式重建。

已落地机制：

- 按 `reel_id` / 定点 family rebuild
- 已验过的 `reel_id` 锁住
- 默认不再被后续 parser 覆盖

锁文件：

- [daiwa_tw_spinning_reels_locks.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_reels_locks.json)

当前：

- `locked_count = 33`

即：

- `DRE1000 ~ DRE1032` 已全部锁定

---

## 8. 当前验收判断

当前这份正式中间层可以视为：

**Daiwa 台湾纺车轮官网基线**

验收判断：

- 主表：通过
- 官网抓取链：通过
- OCR + family parser：通过
- detail 核心字段：通过
- 防污染机制：通过

保留事项：

- 少量空值属于合理空值
- 后续若继续做，优先走白名单字段，不应先回头全局重跑 parser

---

## 9. 下一步建议

当前最合理的下一步只有两种：

1. 进入白名单字段阶段
2. 切下一个 Daiwa 品类

不建议继续做的事：

- 回到全表 parser 试错
- 为了补满继续猜值
- 解锁已冻结的 reel 再重跑
