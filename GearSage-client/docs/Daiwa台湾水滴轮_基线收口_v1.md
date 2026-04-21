# Daiwa 台湾水滴轮 基线收口 v1

版本：v1  
状态：阶段性验收通过  
更新时间：2026-04-21

---

## 1. 当前范围

来源站点：

- 台湾官网列表  
  `https://www.daiwaseiko.com.tw/product-list/reel/double_shaft//`

当前正式中间层：

- [daiwa_baitcasting_reel_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_import.xlsx)

当前 review 表：

- [daiwa_baitcasting_reel_review.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_review.xlsx)

当前规范化缓存：

- [daiwa_tw_baitcasting_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_baitcasting_normalized.json)

当前主商品：

- `25`

当前 detail：

- `98`

---

## 2. 当前已收住的流程

当前台湾官网水滴轮链路已经成立：

1. 列表页抓主商品
2. 详情页分离：
   - `#intro`
   - `#price`
3. 主图下载并写 CDN 格式 `images`
4. `詳細規格` 图 OCR
5. 按家族定点 parser
6. detail 回写正式中间层

这条链路当前已经不是概念验证，而是可复用流程。

---

## 3. 当前主图状态

当前主图已经闭环：

- 正式表主商品：`25`
- 本地目录：
  - `/Users/tommy/Pictures/images/daiwa_reels`
- 当前命中：
  - `25 / 25`

当前不需要再从：

- `/Users/tommy/Pictures/images_old_copy/daiwa_reels`

补图。

---

## 4. 当前主表状态

主商品层当前已经补齐：

- `series_positioning`
- `main_selling_points`
- `player_positioning`
- `player_selling_points`

当前统计：

- `series_positioning = 25 / 25`
- `main_selling_points = 25 / 25`
- `player_positioning = 25 / 25`
- `player_selling_points = 25 / 25`

---

## 5. 当前 detail 核心状态

当前 detail 已稳定承接：

- `GEAR RATIO`
- `MAX DRAG`
- `WEIGHT`
- `cm_per_turn`
- `bearing_count_roller`
- `usage_environment`
- `market_reference_price`
- `product_code`

当前统计：

- `GEAR RATIO = 98 / 98`
- `MAX DRAG = 98 / 98`
- `WEIGHT = 98 / 98`
- `cm_per_turn = 98 / 98`
- `bearing_count_roller = 98 / 98`
- `usage_environment = 98 / 98`
- `market_reference_price = 98 / 98`
- `product_code = 92 / 98`

说明：

- `product_code` 仍有少量空值
- 多数空值来自原图本身缺失或 OCR 无法稳定确认

---

## 6. 当前扩展字段状态

### 已加入并开始使用

- `spool_diameter_mm`
- `spool_width_mm`
- `spool_weight_g`
- `handle_knob_type`
- `handle_knob_exchange_size`
- `body_material`
- `body_material_tech`
- `gear_material`
- `official_environment`
- `player_environment`
- `handle_style`
- `is_handle_double`
- `is_sw_edition`
- `fit_style_tags`
- `min_lure_weight_hint`

### 当前统计

- `Nylon_no_m = 4 / 98`
- `Nylon_lb_m = 67 / 98`
- `fluorocarbon_lb_m = 4 / 98`
- `pe_no_m = 62 / 98`
- `handle_length_mm = 88 / 98`
- `spool_diameter_mm = 73 / 98`
- `spool_width_mm = 58 / 98`
- `spool_weight_g = 29 / 98`
- `handle_knob_type = 48 / 98`
- `handle_knob_exchange_size = 43 / 98`
- `body_material = 52 / 98`
- `body_material_tech = 98 / 98`
- `gear_material = 24 / 98`
- `official_environment = 98 / 98`
- `player_environment = 98 / 98`
- `handle_style = 98 / 98`
- `is_handle_double = 98 / 98`
- `is_sw_edition = 98 / 98`
- `fit_style_tags = 98 / 98`
- `min_lure_weight_hint = 98 / 98`

---

## 7. 当前 `spool_weight_g` 口径

`spool_weight_g` 当前不是全量字段，只补热门且证据较硬的家族。

当前已补：

- `DRE5004 / RYOGA`
- `DRE5010 / ALPHAS BF TW`
- `DRE5011 / STEEZ SV TW`
- `DRE5018 / ZILLION SV TW`
- `DRE5024 / STEEZ CT SV TW`

当前规则：

- 允许用白名单站的 `genuine / original / standard weight` 回填
- 不接受只凭兼容关系的模糊推断
- 不因为“看起来应该差不多”而写值

---

## 8. 当前白名单状态

当前白名单字段已经补了一轮，并打黄底。

主表黄底字段：

- `series_positioning`
- `player_positioning`
- `player_selling_points`

detail 黄底字段：

- `body_material_tech`
- `official_environment`
- `player_environment`
- `is_sw_edition`
- `handle_style`
- `is_handle_double`
- `fit_style_tags`
- `min_lure_weight_hint`

---

## 9. 当前合理空值

以下空值当前视为合理空值：

- 一些家族原图没有 `握丸形狀`
- 一些家族原图没有 `線杯尺寸（徑mm/寬mm）`
- 一些家族没有 `fluorocarbon_lb_m`
- 一些鼓轮 / 船钓计数器不适合统一写 `min_lure_weight_hint`
- `spool_weight_g` 目前只补证据硬的热门家族

这些当前不应为了“补满”继续猜值。

---

## 10. 当前验收判断

当前这份正式中间层可以视为：

**Daiwa 台湾水滴轮官网基线**

验收判断：

- 主图链：通过
- 官网抓取链：通过
- `#intro / #price` 分离：通过
- family parser 主干家族：通过
- 白名单主层：通过
- 关键 detail 字段：通过

保留事项：

- 仍可能存在零散单条实错，需要按 `DRE5xxx` 定点修
- `spool_weight_g` 只补到热门且证据硬的一层
- 不建议再回到全表通用 parser 试错

---

## 11. 下一步建议

当前最合理的下一步只有两种：

1. 切下一个 Daiwa 品类或品牌
2. 做一次目录清理 / 临时文件与脚本收口

不建议继续做的事：

- 再次全表通用 parser 试错
- 为了补满继续猜值
- 把 `spool_weight_g` 扩到证据不足的家族
