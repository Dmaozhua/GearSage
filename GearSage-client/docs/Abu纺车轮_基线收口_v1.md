# Abu 纺车轮 基线收口 v1

## 范围

- 品牌：Abu Garcia
- 品类：纺车轮
- 来源站点：Abu Garcia 官网 Shopify 产品页
- 列表入口：
  - `https://www.abugarcia.com/collections/reels?filter.p.product_type=Spinning+Reels&sort_by=manual`

## 当前交付文件

- 正式中间层：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_spinning_reels_import.xlsx`
- 规范化缓存：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_spinning_reels_normalized.json`
- 审查表：
  - `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_spinning_reels_review.xlsx`

## 当前规模

- 主商品：12
- detail：45

## 抓取方式

这条链不是 OCR 型链路，核心是 Shopify 结构化抓取。

当前抓取层组合：

1. 列表页抓产品链接
2. 详情页抓 `mntn_product_data`
3. 抓 `ProductVariantsMetafields`
4. 抓页面 compare table
5. 抓页面 `features` / `description`

说明：

- Abu 官网有明显的变体展示态问题。
- 有些字段不在 `ProductVariantsMetafields`，而在 compare table。
- 当前脚本已经按“非空合并”处理：
  - clone specs
  - compare table
  - metafields

## 主图

主图已经完成闭环：

- 本地目录：
  - `/Users/tommy/Pictures/images/abu_reels`
- 对账结果：
  - `12/12`

正式表中的 `images` 已统一写为 CDN 路径：

- `https://static.gearsage.club/gearsage/Gearimg/images/abu_reels/...`

## 当前已稳定字段

### 主商品层

- `model`
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
- `pe_no_m`
- `bearing_count_roller`
- `market_reference_price`
- `product_code`
- `official_environment`
- `player_environment`
- `body_material`
- `body_material_tech`
- `is_sw_edition`
- `handle_style`
- `is_handle_double`
- `fit_style_tags`
- `min_lure_weight_hint`

## 当前已知口径

### MAX DRAG

- 官网若直接给 `kg`，直接写 `kg`
- 官网若只给 `lb`，换算为 `kg`
- 例如：
  - `11lb | 4.9kg -> 4.9`
  - `7lb | 3.1kg -> 3.1`

### 容线量

- `Mono Cap (yds/lbs)` -> `Nylon_lb_m`
- `Braid Cap (yds/lbs)` / `Braid Capacity (yds/lbs)` -> `pe_no_m`

当前不做单位换算到米，只保留官网原始 yds/lbs 口径。

### Retrieve

- Abu compare table 里的 `Retrieve` 当前是左右手信息：
  - `Right/Left`
- 不是每圈收线长度
- 因此当前不写入 `cm_per_turn`

## 白名单 / 玩家层

当前白名单字段已补一轮，并已在正式表和 review 表打黄底。

### 主商品黄底字段

- `series_positioning`
- `player_positioning`
- `player_selling_points`

### detail 黄底字段

- `official_environment`
- `player_environment`
- `body_material`
- `body_material_tech`
- `is_sw_edition`
- `handle_style`
- `is_handle_double`
- `fit_style_tags`
- `min_lure_weight_hint`

## 白名单来源

主来源：

- 官网 `Description`
- 官网 `Features`

辅助来源：

- Tackle Warehouse
- FishUSA
- TackleDirect

辅助来源只用于加强这些字段：

- `series_positioning`
- `player_positioning`
- `player_selling_points`
- `player_environment`
- `fit_style_tags`
- `min_lure_weight_hint`

不用于改写官网硬规格。

## 合理空值

当前这些字段大量为空是合理的：

- `WEIGHT`
- `spool_diameter_mm`
- `handle_length_mm`
- `handle_knob_type`
- `gear_material`
- `fluorocarbon_*`
- `cm_per_turn`

原因：

- 官网当前页面没有稳定提供
- 或字段语义和页面文案不一致
- 当前不做猜值补全

## 当前脚本

- 抓取 / 导出：
  - `/Users/tommy/GearSage/scripts/build_abu_spinning_import.js`
- 白名单回灌：
  - `/Users/tommy/GearSage/scripts/apply_abu_spinning_whitelist_stage1.js`
- 审查表导出：
  - `/Users/tommy/GearSage/scripts/export_abu_spinning_review.js`
- 白名单黄底：
  - `/Users/tommy/GearSage/scripts/highlight_abu_spinning_whitelist_headers.py`

## 当前判断

Abu 纺车轮当前已经达到：

- 官网抓取可用
- 变体 compare table 可用
- 主图闭环
- 白名单第一轮可用
- 审查表可用

可作为当前 Abu 纺车轮中间层基线版本。

## 下一步建议

不建议继续磨 Abu 纺车轮长尾字段。

如果继续，应优先：

1. 人工验收式定点修正
2. 切 Abu 其他 reel 品类
3. 或切下一个品牌
