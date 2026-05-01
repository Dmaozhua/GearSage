# Daiwa 台湾纺车轮 基线收口 v1

版本：v1.1  
状态：当前官网基线已覆盖正式中间层  
更新时间：2026-04-30

---

## 1. 当前范围

来源站点：

- Daiwa 当前台湾官网列表  
  `https://www.daiwa.com/tw/product/productlist?category1=%E6%8D%B2%E7%B7%9A%E5%99%A8&category2=%E7%B4%A1%E8%BB%8A%E5%BC%8F%E6%8D%B2%E7%B7%9A%E5%99%A8`

当前正式中间层：

- [daiwa_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import.xlsx)

当前抓取产物：

- [daiwa_spinning_reels_current_official_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_current_official_normalized.json)
- [daiwa_spinning_reels_current_official_audit.md](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_current_official_audit.md)
- [daiwa_spinning_reels_import_current_official_dry_run.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import_current_official_dry_run.xlsx)

当前主商品：

- `33`

当前 detail：

- `261`

---

## 2. 当前已收住的流程

当前台湾官网纺车轮链路已经成立，并已从旧站 OCR 链路切换为当前官网结构化规格表链路：

1. 列表页抓主商品。
2. 详情页抓官方标题、描述、`產品規格` 结构化表格、`使用說明書` PDF。
3. 按规格表表头映射 detail 字段。
4. 生成 normalized JSON 和 audit。
5. dry-run Excel 审计通过后覆盖正式中间层。
6. 主图落地并写 CDN 格式 `images`。

当前脚本：

- [build_daiwa_tw_spinning_current_import.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_current_import.js)
- [apply_daiwa_tw_spinning_player_fields.js](/Users/tommy/GearSage/scripts/apply_daiwa_tw_spinning_player_fields.js)

图片口径：

- 本地主图目录：`/Users/tommy/Pictures/images/daiwa_reels`
- 每个主商品下载一张对应 main 图。
- 导入表 `images` 只写未来资源存储 URL：`https://static.gearsage.club/gearsage/Gearimg/images/daiwa_reels/<主图文件名>`
- 需要强制刷新本地主图时使用脚本参数 `--force-images`。

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
- `master_year_empty = 2`
- `master_alias_empty = 2`

说明：

- `MR 750 / 1000`、`TAMAN MONSTER` 当前官网 SKU 未提供可确认年份，保守留空。

---

## 4. 当前 detail 核心状态

当前 detail 已稳定承接：

- `GEAR RATIO`
- `WEIGHT`
- `cm_per_turn`
- `Nylon_no_m`
- `Nylon_lb_m`
- `pe_no_m`
- `line_capacity_display`
- `bearing_count_roller`
- `MAX DRAG`
- `market_reference_price`
- `product_code`

当前统计：

- `detail_ratio_empty = 0`
- `detail_weight_empty = 0`
- `detail_cm_empty = 0`
- `detail_price_empty = 14`
- `detail_code_empty = 0`
- `detail_line_empty = 0`
- `detail_max_empty = 7`

说明：

- `detail_price_empty = 14` 主要来自官网标为“请确认详细说明页面，或洽询店铺门市”的旧款 / 普及款。
- `detail_max_empty = 7` 来自官网规格表本身未给最大拉力，或只给 `實用耐力(kg)` 的远投组。

---

## 5. 当前新增承接字段

当前已加入并开始使用的字段：

- `spool_diameter_mm`
- `body_material`
- `body_material_tech`
- `gear_material`
- `handle_knob_type`
- `official_environment`
- `player_environment`
- `spool_depth_normalized`
- `gear_ratio_normalized`
- `is_compact_body`
- `handle_style`
- `is_handle_double`
- `is_sw_edition`
- `MAX_DURABILITY`
- `Specs_link`

玩家字段当前状态：

- `reel.player_positioning = 33 / 33`
- `reel.player_selling_points = 33 / 33`
- `spinning_reel_detail.player_environment = 261 / 261`

白名单辅助站结果：

- JapanTackle：可用于少数精确系列辅助证据，当前命中 `SALTIGA 4000/5000/6000`、`EXIST`、`CERTATE SW 4000/5000/6000`、`CERTATE`。
- JDMFishing：当前探测只得到分类 / 广告页，没有稳定型号级证据，不写入。
- TackleTour：可找到历史 Certate 评测，但年份过旧，只作为 sidecar 背景，不绑定当前 2024 / 2026 型号。

本轮证据报告：

- [daiwa_spinning_reels_player_fields_report.md](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_player_fields_report.md)

当前口径：

- 官网结构化规格表明确给值才写规格字段。
- 当前 spinning schema 没有 `handle_knob_exchange_size` 列，官网原始值保留在 normalized JSON，不写入正式表。
- 环境、杯深、摇臂、速比、SW 标记按 Shimano reel 当前中间层口径做保守派生。
- 玩家字段只写用户视角定位和卖点，不写 `官网`、`白名单`、`JapanTackle` 等来源说明；证据只放 sidecar / report。
- 官网没给的字段继续留空，不为了“补满”猜值。

---

## 6. 当前合理空值

以下空值当前视为合理空值：

- 部分组官网表没有：
  - `spool_diameter_mm`
  - `body_material`
  - `body_material_tech`
- 官网没有提供 Daiwa 拆解图入口，`EV_link` 继续留空。
- 官网没有碳线容量列，`fluorocarbon_no_m` / `fluorocarbon_lb_m` 继续留空。
- 部分旧款官网没有价格或最大拉力，按官网空值保留。

这些当前不应强行补满。

---

## 7. 防污染机制

当前已经不允许再按全表试错式重建。

已落地机制：

- 当前官网链路先写 dry-run Excel。
- 同步写 audit，确认 master/detail 数量和字段覆盖率。
- 正式覆盖必须用同一脚本 `--commit`。
- 旧站 OCR 锁文件只作为历史测试链路记录，不再作为当前官网结构化链路的主控制点。

历史锁文件：

- [daiwa_tw_spinning_reels_locks.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_reels_locks.json)

历史测试链路中：

- `locked_count = 33`
- `DRE1000 ~ DRE1032`

---

## 8. 当前验收判断

当前这份正式中间层可以视为：

**Daiwa 台湾纺车轮当前官网基线**

验收判断：

- 主表：通过
- 当前官网抓取链：通过
- 结构化规格表解析：通过
- detail 核心字段：通过
- dry-run / audit / commit 机制：通过

保留事项：

- 少量空值属于合理空值。
- 后续若继续做，优先走白名单字段或补 schema，不应回到旧 OCR/parser 全局重跑。

---

## 9. 下一步建议

当前最合理的下一步只有两种：

1. 进入白名单字段阶段。
2. 切下一个 Daiwa 品类。

不建议继续做的事：

- 回到全表 parser 试错。
- 为了补满继续猜值。
- 解锁已冻结的 reel 再重跑。
