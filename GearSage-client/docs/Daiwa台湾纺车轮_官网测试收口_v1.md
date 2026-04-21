# Daiwa 台湾纺车轮 官网测试收口 v1

版本：v1  
状态：阶段性验收通过  
更新时间：2026-04-21

---

## 1. 范围

当前测试链来源：

- 台湾官网列表：
  `https://www.daiwaseiko.com.tw/product-list/reel/spinning_reel/`

当前测试文件：

- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import_test.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import_test.xlsx)
- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_test_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_test_normalized.json)

当前主商品数量：

- `33`

当前 detail 数量：

- `219`

---

## 2. 当前流程结论

台湾站当前已经证明比大陆站更适合作为 Daiwa 纺车轮主抓取源。

当前成立的链路：

1. 列表页抓主商品链接
2. 详情页抓：
   - `產品說明`
   - `產品介紹`
   - `詳細規格`
3. 主商品主图写入 `images`
4. 规格图 OCR
5. detail 参数结构化
6. 中间层导出

当前已经不是概念验证，而是可执行测试链。

---

## 3. 当前已收稳的字段

### 3.1 主表

当前主表已经收住：

- `model`
- `model_year`
- `alias`
- `images`
- `Description`

当前主表状态：

- `master_desc_empty = 0`
- `master_year_empty = 0`
- `master_alias_empty = 0`

### 3.2 detail 核心字段

当前 detail 已经大面积收住：

- `GEAR RATIO`
- `WEIGHT`
- `cm_per_turn`
- `line_capacity_display`
- `market_reference_price`
- `product_code`
- `MAX DRAG`

当前统计：

- `detail_ratio_empty = 1`
- `detail_weight_empty = 0`
- `detail_cm_empty = 14`
- `detail_price_empty = 0`
- `detail_code_empty = 0`
- `detail_line_empty = 0`
- `detail_max_empty = 1`

说明：

- `detail_cm_empty = 14` 主要来自官网图里本来就没有 `cm_per_turn` 的组
- `detail_max_empty = 1` 当前只剩 `SF-2500SS`，继续保守留空

### 3.3 追加收住的字段

当前已补进的官网字段包括：

- `spool_diameter_mm`
- `body_material`
- `handle_knob_type`

当前补到的原则：

- 官网图明确给值才写
- 官网图没给就留空

---

## 4. 防污染机制

当前不再允许全表无差别重建覆盖旧结果。

已落地机制：

- 仅按目标 `reel_id` 或目标 `model` 定点重建
- 已验过的 `reel_id` 进入锁文件，不再被后续 parser 调整覆盖

锁文件：

- [/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_reels_locks.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_spinning_reels_locks.json)

当前：

- `locked_count = 33`

即：

- `DRE1000` 到 `DRE1032` 已全部锁定

---

## 5. 当前合理空值

当前仍为空的字段，并不等于漏抓。

典型合理空值：

- 部分海水大号组没有 `handle_length_mm`
- 部分老款 / 简化规格图没有 `cm_per_turn`
- 部分组没有明确的：
  - `spool_diameter_mm`
  - `body_material`
  - `handle_knob_type`

当前口径：

- 没有明确证据就留空
- 不为了表格“更满”去猜值

---

## 6. 当前验收判断

当前这份测试表可以作为：

**Daiwa 台湾纺车轮 官网测试基线**

验收判断：

- 主商品层：通过
- 官网抓取链：通过
- OCR 规格解析链：通过
- detail 核心字段：通过
- 防污染机制：通过

保留事项：

- 少量 detail 空值属于合理空值
- 后续若进入正式中间层，不应再先改 parser，而应直接复用当前已锁基线

---

## 7. 下一步建议

当前最合理的下一步只有两种：

1. 把当前测试表转成正式中间层
2. 进入白名单字段阶段

不建议继续做的事：

- 再全表重跑 parser
- 为了补满空值继续猜字段
- 在已锁组上反复试错

---

## 8. 相关脚本

- [/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_import_test.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_import_test.js)
- [/Users/tommy/GearSage/scripts/rebuild_daiwa_tw_spinning_import_test_from_cache.js](/Users/tommy/GearSage/scripts/rebuild_daiwa_tw_spinning_import_test_from_cache.js)
- [/Users/tommy/GearSage/scripts/ocr_apple_vision.swift](/Users/tommy/GearSage/scripts/ocr_apple_vision.swift)
