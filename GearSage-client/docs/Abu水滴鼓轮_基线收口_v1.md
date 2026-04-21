# Abu 水滴/鼓轮 基线收口 v1

## 范围

- 品牌：Abu Garcia
- 品类：水滴轮 + 鼓轮
- 来源站点：Abu Garcia 官网 Shopify 产品页
- 列表入口：
  - `https://www.abugarcia.com/collections/reels?filter.p.product_type=Low+Profile+Baitcast+Reels&sort_by=manual`
  - `https://www.abugarcia.com/collections/reels?filter.p.product_type=Low+Profile+Baitcast+Reels&page=2&sort_by=manual`
  - `https://www.abugarcia.com/collections/reels?filter.p.product_type=Round+Baitcast+Reels&sort_by=manual`

## 当前交付文件

- 正式中间层：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_baitcasting_reel_import.xlsx`
- 规范化缓存：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_baitcasting_reels_normalized.json`
- 审查表：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_baitcasting_reel_review.xlsx`

## 当前规模

- 主商品：41
- detail：93

## 主图

主图已经闭环：

- 本地目录：
  - `/Users/tommy/Pictures/images/abu_reels`
- 对账结果：
  - `41 / 41`

正式表 `images` 已统一写为 CDN 路径。

## 抓取方式

这条链不是 OCR 型链路，核心是 Shopify 结构化抓取。

当前抓取层组合：

1. 列表页抓产品链接
2. 详情页抓 `mntn_product_data`
3. 抓 `ProductVariantsMetafields`
4. 抓 compare table
5. 抓 `description`
6. 抓 `features`

## 当前已稳定字段

### 主商品层

- `model`
- `type_tips`
- `type`
- `images`
- `Description`
- `main_selling_points`
- `series_positioning`
- `player_positioning`
- `player_selling_points`

### detail 层

- `SKU`
- `GEAR RATIO`
- `MAX DRAG`
- `Nylon_lb_m`
- `fluorocarbon_lb_m`（仅少数组）
- `pe_no_m`
- `bearing_count_roller`
- `market_reference_price`
- `product_code`
- `body_material`
- `body_material_tech`
- `gear_material`
- `usage_environment`
- `drag_click`
- `fit_style_tags`
- `min_lure_weight_hint`
- `handle_style`
- `MAX_DURABILITY`

## 当前统一口径

### type

- `Low Profile Baitcast Reels` -> `baitcasting`
- `Round Baitcast Reels` -> `drum`

### MAX DRAG

优先顺序：

1. 页面直接展示的 `kg`
2. 如果只有 `lb`，再换算为 `kg`

例如：

- `18lb | 8.1kg -> 8.1`

### 容线量

- `Mono Capacity / Mono Cap` -> `Nylon_lb_m`
- `Fluoro Capacity / Fluoro Cap` -> `fluorocarbon_lb_m`
- `Braid Capacity / Braid Cap` -> `pe_no_m`

当前保留官网 `yds/lbs` 口径，不做单位换算。

### Retrieve

- 若是 `Right / Left`，视为手向，不写 `cm_per_turn`
- 若是明显 `xx in` / `IPT`，才换算写入 `cm_per_turn`

## 白名单 / 玩家层

当前白名单第一轮已经完成，并已在正式表和 review 表打黄底。

### 主商品黄底字段

- `series_positioning`
- `player_positioning`
- `player_selling_points`

### detail 黄底字段

- `body_material`
- `body_material_tech`
- `gear_material`
- `usage_environment`
- `drag_click`
- `fit_style_tags`
- `min_lure_weight_hint`
- `handle_style`
- `MAX_DURABILITY`

## 白名单来源

主来源：

- 官网 `Description`
- 官网 `Features`

这条线当前不依赖站外白名单作为主要数据源。

## 当前覆盖情况

### 主商品

- `series_positioning = 41 / 41`
- `player_positioning = 41 / 41`
- `player_selling_points = 41 / 41`

### detail

- `body_material = 64 / 93`
- `body_material_tech = 91 / 93`
- `gear_material = 39 / 93`
- `usage_environment = 91 / 93`
- `drag_click = 9 / 93`
- `fit_style_tags = 91 / 93`
- `min_lure_weight_hint = 57 / 93`
- `handle_style = 93 / 93`
- `MAX_DURABILITY = 53 / 93`

当前覆盖是保守策略：

- 有明确 `Features` 证据才写
- 无硬证据不硬填

## 合理空值

这些字段当前大量为空是合理的：

- `WEIGHT`
- `spool_diameter_mm`
- `spool_width_mm`
- `spool_weight_g`
- `handle_length_mm`
- `handle_knob_type`
- `handle_knob_exchange_size`
- `battery_*`
- `continuous_cast_count`

原因：

- 官网当前页面没有稳定给出
- 或暂时没有可靠统一映射

## 当前脚本

- 抓取 / 导出：
  - `/Users/tommy/GearSage/scripts/build_abu_baitcasting_import.js`
- 白名单回灌：
  - `/Users/tommy/GearSage/scripts/apply_abu_baitcasting_whitelist_stage1.js`
- 审查表导出：
  - `/Users/tommy/GearSage/scripts/export_abu_baitcasting_review.js`
- 白名单黄底：
  - `/Users/tommy/GearSage/scripts/highlight_abu_baitcasting_whitelist_headers.py`

## 当前判断

Abu 水滴/鼓轮当前已经达到：

- 官网抓取可用
- 低姿态 / 鼓轮 `type` 已分开
- 主图闭环
- 白名单第一轮可用
- 审查表可用

可作为当前 Abu 水滴/鼓轮中间层基线版本。

## 下一步建议

不建议继续盲补长尾字段。

如果继续，应优先：

1. 人工验收式定点修正
2. 主字段错位核查
3. 再决定是否补更深层白名单
