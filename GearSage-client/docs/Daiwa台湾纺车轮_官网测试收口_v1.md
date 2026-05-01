# Daiwa 台湾纺车轮 官网测试收口 v1

版本：v1.1  
状态：旧站 OCR 测试链路已收口；当前官网链路已迁移到结构化表抓取  
更新时间：2026-04-30

---

## 1. 当前口径

旧测试链来源：

- 台湾旧站列表  
  `https://www.daiwaseiko.com.tw/product-list/reel/spinning_reel/`

旧测试文件：

- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import_test.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import_test.xlsx)
- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_test_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_test_normalized.json)

当前正式链来源：

- Daiwa 当前台湾官网列表  
  `https://www.daiwa.com/tw/product/productlist?category1=%E6%8D%B2%E7%B7%9A%E5%99%A8&category2=%E7%B4%A1%E8%BB%8A%E5%BC%8F%E6%8D%B2%E7%B7%9A%E5%99%A8`

当前正式文件：

- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import.xlsx)
- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_current_official_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_current_official_normalized.json)
- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_current_official_audit.md](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_current_official_audit.md)

当前主商品数量：

- `33`

当前 detail 数量：

- `261`

---

## 2. 流程结论

台湾官网仍然是 Daiwa 纺车轮主抓取源，但当前优先级已经从旧站 OCR 切到新站结构化规格表。

当前成立的链路：

1. 列表页抓 33 个主商品链接。
2. 详情页抓 `產品規格` 表格。
3. 按表头映射 Shimano reel 当前中间层字段。
4. 主商品主图写入 CDN 格式 `images`。
5. 输出 normalized JSON 和 audit。
6. 先生成 dry-run Excel，审计通过后用 `--commit` 覆盖正式中间层。

当前脚本：

- [/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_current_import.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_current_import.js)
- [/Users/tommy/GearSage/scripts/apply_daiwa_tw_spinning_player_fields.js](/Users/tommy/GearSage/scripts/apply_daiwa_tw_spinning_player_fields.js)

图片口径：

- 本地主图目录：`/Users/tommy/Pictures/images/daiwa_reels`
- 每个主商品对应一张 main 图。
- 导入表 `images` 不写本地路径，只写未来资源存储 URL：`https://static.gearsage.club/gearsage/Gearimg/images/daiwa_reels/<主图文件名>`
- 本地已有可用主图时默认复用；需要重新下载时使用 `--force-images`。

---

## 3. 当前已收稳的字段

### 3.1 主表

当前主表已经收住：

- `model`
- `model_year`
- `alias`
- `images`
- `Description`
- `official_reference_price`

当前主表状态：

- `master_desc_empty = 0`
- `master_year_empty = 2`
- `master_alias_empty = 2`

说明：

- `MR 750 / 1000`、`TAMAN MONSTER` 当前官网 SKU 未提供可确认年份，保守留空。

### 3.2 detail 核心字段

当前 detail 已经收住：

- `GEAR RATIO`
- `WEIGHT`
- `cm_per_turn`
- `line_capacity_display`
- `market_reference_price`
- `product_code`
- `MAX DRAG`

当前统计：

- `detail_ratio_empty = 0`
- `detail_weight_empty = 0`
- `detail_cm_empty = 0`
- `detail_price_empty = 14`
- `detail_code_empty = 0`
- `detail_line_empty = 0`
- `detail_max_empty = 7`

说明：

- 价格和最大拉力空值来自官网表本身未给值，或只给 `實用耐力(kg)`；不做猜测补齐。

### 3.3 追加收住的字段

当前已补进的官网字段和派生字段包括：

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

玩家字段当前覆盖：

- `reel.player_positioning = 33 / 33`
- `reel.player_selling_points = 33 / 33`
- `spinning_reel_detail.player_environment = 261 / 261`

白名单辅助站可用性：

- JapanTackle：可稳定支持少数精确系列的玩家定位 / 卖点判断。
- JDMFishing：当前没有稳定型号级页面，不参与写入。
- TackleTour：有历史评测背景，但年份太旧，不绑定当前型号。

本轮报告：

- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_player_fields_report.md](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_player_fields_report.md)

当前补到的原则：

- 官网表明确给值才写官网规格字段。
- 与 Shimano reel 中间层一致的派生字段可以保守派生。
- 玩家字段只写用户视角定位 / 卖点，不写来源说明，证据保留在 sidecar / report。
- 官网没给、schema 没有，或者证据不足的字段留空。

---

## 4. 防污染机制

当前不再允许全表无差别重建覆盖旧结果。

已落地机制：

- 新链路输出 dry-run Excel。
- 同步输出 audit。
- 正式覆盖只能通过同一脚本 `--commit`。
- 旧站 OCR 锁文件只作为历史测试链路记录。

旧锁文件：

- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_reels_locks.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_reels_locks.json)

---

## 5. 当前合理空值

当前仍为空的字段，并不等于漏抓。

典型合理空值：

- 部分规格表没有 `spool_diameter_mm`。
- 部分规格表没有 `body_material` / `body_material_tech`。
- 当前 Daiwa 页面没有拆解图入口，`EV_link` 留空。
- 当前 Daiwa 页面没有碳线容量列，`fluorocarbon_no_m` / `fluorocarbon_lb_m` 留空。
- 当前 spinning schema 没有 `handle_knob_exchange_size`，官网原始值只保留在 normalized JSON。

当前口径：

- 没有明确证据就留空。
- 不为了表格“更满”去猜值。

---

## 6. 当前验收判断

当前这份正式表可以作为：

**Daiwa 台湾纺车轮 当前官网正式基线**

验收判断：

- 主商品层：通过。
- 官网抓取链：通过。
- 结构化规格表解析：通过。
- detail 核心字段：通过。
- dry-run / audit / commit 机制：通过。

保留事项：

- 少量 detail 空值属于合理空值。
- 后续新增字段时，应先确认 schema 是否接收，再进入白名单补充。

---

## 7. 相关脚本

当前正式链路：

- [/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_current_import.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_current_import.js)

历史旧站 OCR 测试链路：

- [/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_import_test.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_import_test.js)
- [/Users/tommy/GearSage/scripts/rebuild_daiwa_tw_spinning_import_test_from_cache.js](/Users/tommy/GearSage/scripts/rebuild_daiwa_tw_spinning_import_test_from_cache.js)
- [/Users/tommy/GearSage/scripts/ocr_apple_vision.swift](/Users/tommy/GearSage/scripts/ocr_apple_vision.swift)
