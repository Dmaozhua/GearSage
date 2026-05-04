# Daiwa 台湾水滴轮 基线收口 v1

版本：v1.4  
状态：当前官网基线已覆盖正式中间层，白名单玩家字段 stage1 已完成，玩家辅助字段 stage2 已补强，JP 独有 IM Z 已补入  
更新时间：2026-05-03

---

## 1. 当前范围

来源站点：

- Daiwa 当前台湾官网列表  
  `https://www.daiwa.com/tw/product/productlist?category1=%E6%8D%B2%E7%B7%9A%E5%99%A8&choshu=&page=1&category2=%E8%B7%AF%E4%BA%9E%E9%BC%93%E5%BC%8F%E6%8D%B2%E7%B7%9A%E5%99%A8`
- Daiwa 日本官网独有 IM Z 商品页  
  `https://www.daiwa.com/jp/product/utqvf9l`  
  `https://www.daiwa.com/jp/product/30bvi7i`  
  `https://www.daiwa.com/jp/product/tz71iel`

当前正式中间层：

- [daiwa_baitcasting_reel_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_import.xlsx)

当前 review 表：

- [daiwa_baitcasting_reel_review.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_reel_review.xlsx)

当前规范化缓存：

- [daiwa_tw_baitcasting_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_baitcasting_normalized.json)

当前主商品：

- `35`

当前 detail：

- `161`

---

## 2. 当前已收住的流程

当前台湾官网水滴轮链路已经成立，并已从旧台湾站补齐到当前 `daiwa.com/tw` 商品列表：

1. 列表页抓主商品
2. 详情页抓官方标题、描述、產品規格表和主图
3. 主图下载并写 CDN 格式 `images`
4. 当前官网结构化规格表优先；旧站规格图 OCR / family parser 仅作为历史链路参考
5. 按家族定点校正缺失 / 错位商品
6. detail 回写正式中间层

这条链路当前已经不是概念验证，而是可复用流程。

2026-05-03 追加日本官网独有 `IM Z` 三个主商品：

- `DRE5032 / IM Z LIMITBREAKER TW HD-C`
- `DRE5033 / IM Z TW 200-C`
- `DRE5034 / IM Z TW100-C`

追加时只按这 3 个官方详情页定点补入，没有重跑既有 Daiwa 水滴轮全表。

---

## 3. 当前主图状态

当前主图已经闭环：

- 正式表主商品：`35`
- 本地目录：
  - `/Users/tommy/Pictures/images/daiwa_reels`
- 当前命中：
  - `35 / 35` 本地已下载；新增 3 张 CDN 目标 URL 已写入表内，需静态资源同步后线上可访问

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

- `series_positioning = 35 / 35`
- `main_selling_points = 35 / 35`
- `player_positioning = 35 / 35`
- `player_selling_points = 35 / 35`

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

- `GEAR RATIO = 161 / 161`
- `MAX DRAG = 161 / 161`
- `WEIGHT = 161 / 161`
- `cm_per_turn = 161 / 161`
- `bearing_count_roller = 161 / 161`
- `usage_environment = 143 / 161`
- `market_reference_price = 161 / 161`
- `product_code = 155 / 161`

说明：

- `product_code` 仍有少量空值
- 多数空值来自原图本身缺失或 OCR 无法稳定确认

---

## 6. 当前扩展字段状态

### 已加入并开始使用

- `spool_diameter_mm`
- `spool_width_mm`
- `spool_weight_g`
- `drag_click`
- `spool_depth_normalized`
- `gear_ratio_normalized`
- `brake_type_normalized`
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

- `Nylon_no_m = 4 / 161`
- `Nylon_lb_m = 110 / 161`
- `fluorocarbon_lb_m = 22 / 161`
- `pe_no_m = 112 / 161`
- `handle_length_mm = 157 / 161`
- `spool_diameter_mm = 149 / 161`
- `spool_width_mm = 124 / 161`
- `spool_weight_g = 30 / 161`
- `drag_click = 78 / 161`
- `spool_depth_normalized = 161 / 161`
- `gear_ratio_normalized = 161 / 161`
- `brake_type_normalized = 120 / 161`
- `handle_knob_type = 137 / 161`
- `handle_knob_exchange_size = 117 / 161`
- `body_material = 136 / 161`
- `body_material_tech = 161 / 161`
- `gear_material = 89 / 161`
- `official_environment = 161 / 161`
- `player_environment = 161 / 161`
- `handle_style = 161 / 161`
- `is_handle_double = 161 / 161`
- `is_sw_edition = 161 / 161`
- `fit_style_tags = 161 / 161`
- `min_lure_weight_hint = 161 / 161`

---

## 7. 当前 `spool_weight_g` 口径

`spool_weight_g` 当前不是全量字段，只补热门且证据较硬的家族。

当前已补：

- `DRE5004 / RYOGA`
- `DRE5010 / ALPHAS BF TW`
- `DRE5011 / STEEZ SV TW`
- `DRE5018 / ZILLION SV TW`
- `DRE5024 / STEEZ CT SV TW`
- `DRE5030 / TATULA TW 200`

当前规则：

- 允许用白名单站的 `genuine / original / standard weight` 回填
- 不接受只凭兼容关系的模糊推断
- 不因为“看起来应该差不多”而写值

---

## 8. 当前白名单状态

当前白名单字段已经补了一轮，并打黄底。

2026-05-03 已完成白名单玩家字段 stage1：

- 主要来源：JapanTackle 精确系列页。
- 只回写 `baitcasting_reel_detail` 中原本为空、证据明确的字段。
- 本轮新增可信字段值 `62` 个，涉及 `8` 个主商品家族。
- 回写字段：
  - `drag_click`
  - `body_material`
  - `body_material_tech`
- `spool_weight_g` 本轮没有找到可接受的原厂 / genuine 线杯重量硬证据，继续留空。
- 证据文件：
  - [daiwa_baitcasting_whitelist_player_fields_evidence.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_whitelist_player_fields_evidence.json)
  - [daiwa_baitcasting_whitelist_player_fields_report.md](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_whitelist_player_fields_report.md)

2026-05-03 已完成玩家辅助字段 stage2：

- 主要来源：Daiwa 官方正文 / 规格缓存、Daiwa 区域官网精确型号页、JapanTackle stage1 已确认链路。
- 只回写 `baitcasting_reel_detail` 中原本为空、证据或规则明确的字段。
- 本轮新增空字段补值 `537` 个；之后对 `spool_depth_normalized` 做了 `43` 个桶位修正，避免把船钓窄深杯误判为浅杯、或把 100 规格 PE 容量误判过深。
- 回写 / 派生字段：
  - `gear_ratio_normalized`
  - `spool_depth_normalized`
  - `brake_type_normalized`
  - `drag_click`
  - `body_material`
  - `body_material_tech`
  - `spool_weight_g`
- `spool_weight_g` 本轮只新增 `DRE5030 / TATULA TW 200`，不从改装兼容页推断原厂线杯重量。
- 证据文件：
  - [daiwa_baitcasting_player_fields_stage2_evidence.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_player_fields_stage2_evidence.json)
  - [daiwa_baitcasting_player_fields_stage2_report.md](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_baitcasting_player_fields_stage2_report.md)

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
