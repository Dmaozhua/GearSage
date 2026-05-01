# Spinning Reel 抓取导入复用流程 v1

版本：v1  
状态：可复用流程  
更新时间：2026-05-01

---

## 1. 适用范围

这份文档用于后续新线程复用 spinning reel 抓取、补字段、导出中间层流程。

当前参考样板：

- Shimano spinning reel：字段口径样板
- Daiwa Taiwan spinning reel：当前官网结构化抓取样板

当前样板文件：

- [shimano_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_spinning_reels_import.xlsx)
- [daiwa_spinning_reels_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import.xlsx)

当前样板脚本：

- [build_daiwa_tw_spinning_current_import.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_current_import.js)
- [apply_daiwa_tw_spinning_player_fields.js](/Users/tommy/GearSage/scripts/apply_daiwa_tw_spinning_player_fields.js)

---

## 2. 新线程推荐提示词

可以直接把下面这段给新 agent：

```text
阅读 GearSage 中 spinning reel 的抓取和导入流程文档，复用当前 Daiwa Taiwan spinning reel 的流程到新的品牌/官网。

必读文件：
- /Users/tommy/GearSage/AGENTS.md
- /Users/tommy/GearSage/GearSage-client/docs/Spinning_Reel_抓取导入复用流程_v1.md
- /Users/tommy/GearSage/GearSage-client/docs/reel_字段速查表_v1.md
- /Users/tommy/GearSage/GearSage-client/docs/Reel_基线收口总览_v1.md
- /Users/tommy/GearSage/GearSage-client/docs/Daiwa台湾纺车轮_基线收口_v1.md
- /Users/tommy/GearSage/scripts/gear_export_schema.js
- /Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_current_import.js
- /Users/tommy/GearSage/scripts/apply_daiwa_tw_spinning_player_fields.js

目标：
1. 先理解当前 schema、字段含义、图片规则、白名单/player 字段规则。
2. 对目标官网先做小样本结构探测，不要直接全量覆盖。
3. 能结构化抓表格就优先结构化抓取；只有官网没有结构化数据时才考虑 OCR。
4. 先输出 normalized JSON、audit、dry-run xlsx。
5. 审计通过后再用 --commit 覆盖正式 import。
6. 主图下载到 /Users/tommy/Pictures/images/<brand>_reels；表格 images 只写 https://static.gearsage.club/gearsage/Gearimg/images/<brand>_reels/<主图文件名>。
7. 玩家字段先生成 sidecar/report，确认没有来源词泄漏后再写入 import。
8. 最后做字段 QA：数量、表头、行顺序、SKU、规格字段错列、图片 URL、本地图片、玩家字段来源词。
```

---

## 3. 必读文件职责

### 项目和字段规则

- [AGENTS.md](/Users/tommy/GearSage/AGENTS.md)
  - 项目行为、可信装备库原则、不要猜值。
- [reel_字段速查表_v1.md](/Users/tommy/GearSage/GearSage-client/docs/reel_字段速查表_v1.md)
  - reel 主表和 spinning detail 字段含义。
- [gear_export_schema.js](/Users/tommy/GearSage/scripts/gear_export_schema.js)
  - 导出表头和 sheet 名唯一来源。

### 当前 reel 基线

- [Reel_基线收口总览_v1.md](/Users/tommy/GearSage/GearSage-client/docs/Reel_基线收口总览_v1.md)
  - 当前哪些 reel 线已收口、哪些空值合理。
- [Daiwa台湾纺车轮_基线收口_v1.md](/Users/tommy/GearSage/GearSage-client/docs/Daiwa台湾纺车轮_基线收口_v1.md)
  - 当前可复用的结构化抓取、图片、玩家字段、QA 口径。

### 可复用脚本样板

- [build_daiwa_tw_spinning_current_import.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_spinning_current_import.js)
  - list/detail 抓取、结构化规格表解析、图片下载、dry-run/audit/commit。
- [apply_daiwa_tw_spinning_player_fields.js](/Users/tommy/GearSage/scripts/apply_daiwa_tw_spinning_player_fields.js)
  - 主表玩家字段补充、白名单证据 sidecar、来源词防泄漏。

---

## 4. 标准执行阶段

### Step 1：读取 schema 和样板表

先读：

- `HEADERS.reelMaster`
- `HEADERS.spinningReelDetail`
- 当前 Shimano / Daiwa spinning import 表头

不要新增列，除非先明确当前最终表能接住。

### Step 2：官网结构探测

先做小样本：

1. 列表页能否直接拿到主商品链接、标题、价格、主图。
2. 详情页是否有规格表。
3. 规格表是否可用 HTML table 解析。
4. 详情页是否有说明书、爆炸图、售后 PDF。
5. 详情页是否有主描述和 SKU 级说明。

优先级：

1. HTML table / JSON 数据
2. 页面内结构化文本
3. 图片 OCR

不要一开始就上全量 OCR。

### Step 3：生成 normalized JSON

normalized JSON 至少保留：

- `model`
- `url`
- `imageUrl`
- `description`
- `manualLink`
- `variants`
- `rawSpecs`
- 必要时保留 `rawSku`

如果做了 SKU 纠错或归一，必须同时保留原始 `rawSku`。

### Step 4：字段映射到 import

主表必填/优先字段：

- `id`
- `brand_id`
- `model`
- `model_year`
- `alias`
- `type = spinning`
- `images`
- `Description`
- `official_reference_price`
- `market_status`

detail 核心字段：

- `SKU`
- `GEAR RATIO`
- `WEIGHT`
- `cm_per_turn`
- `MAX DRAG`
- `Nylon_no_m`
- `Nylon_lb_m`
- `pe_no_m`
- `handle_length_mm`
- `bearing_count_roller`
- `market_reference_price`
- `product_code`

spinning 补充字段：

- `spool_diameter_mm`
- `body_material`
- `body_material_tech`
- `gear_material`
- `handle_knob_type`
- `line_capacity_display`
- `spool_depth_normalized`
- `gear_ratio_normalized`
- `is_compact_body`
- `handle_style`
- `is_handle_double`
- `is_sw_edition`
- `MAX_DURABILITY`
- `Specs_link`
- `EV_link`

原则：

- 官网明确给值才写官方规格字段。
- 派生字段只按稳定规则写。
- 不能确认就留空。

---

## 5. 图片规则

本地路径：

```text
/Users/tommy/Pictures/images/<brand>_reels
```

导入表 `images`：

```text
https://static.gearsage.club/gearsage/Gearimg/images/<brand>_reels/<主图文件名>
```

规则：

- 一个主商品一张 main 图。
- 本地文件只是将来上传资源存储的暂存文件。
- `images` 不写 `/Users/...`，不写 `file://`。
- 文件名建议：`<model>_main.<ext>`。
- 支持强制重下参数，例如 `--force-images`。

QA 必查：

- `images` 前缀正确。
- 33/全部主商品本地图片都存在且非空。
- 表格没有本地路径残留。

---

## 6. SKU 和官网文本清洗

保留原始值，同时做必要归一。

允许清洗：

- 全角转半角。
- 全角连字符统一为 `-`。
- 末尾 `。`、`.` 清理。
- 官网机器翻译造成的明确型号污染，必须限定在当前系列内修正。

Daiwa Taiwan 已知例子：

- `Seltate / Sertate` -> `CERTATE`
- `Soltiga` -> `SALTIGA`
- `Revlos / Rebros` -> `REVROS`
- `Emeraldus` -> `EMERALDAS`
- `Worldspin / 世界旋轉` -> `WORLD SPIN`
- `長光束 / 長樑` -> `LONGBEAM`
- `Moonbeam / Tsukishibijin` -> `月下美人`

不允许：

- 只凭猜测改 SKU。
- 用低置信外站标题覆盖官网 SKU。
- 清洗后丢失原始 `rawSku`。

---

## 7. 玩家字段和白名单

玩家字段包括：

- `reel.player_positioning`
- `reel.player_selling_points`
- `spinning_reel_detail.player_environment`
- 后续如 schema 接住，再考虑 detail 层 `player_positioning` / `player_selling_points`

白名单用途：

- 只做辅助证据。
- 不覆盖官方字段。
- 不把来源说明写进 `player_*`。
- 证据保留在 sidecar JSON / report。

当前 Daiwa spinning 辅助站结论：

- JapanTackle：少数精确系列可用。
- JDMFishing：当前没有稳定型号级证据。
- TackleTour：历史评测可做背景，但不能绑定当前型号。

字段文字要求：

- `player_positioning`：一句玩家视角定位。
- `player_selling_points`：真实使用价值摘要。
- 不写 `官网`、`官方`、`白名单`、`JapanTackle`、`来源`、`证据`。
- 不把官方 marketing 文案直接搬进去。

---

## 8. Dry-run / Commit 机制

标准输出：

- normalized JSON
- audit JSON
- audit MD
- dry-run xlsx
- 正式 import xlsx

推荐命名：

```text
<brand>_spinning_reels_current_official_normalized.json
<brand>_spinning_reels_current_official_audit.md
<brand>_spinning_reels_import_current_official_dry_run.xlsx
<brand>_spinning_reels_import.xlsx
```

流程：

1. 默认只写 dry-run。
2. 审计通过后再 `--commit`。
3. 需要刷新图片时加 `--force-images`。

---

## 9. QA 清单

每次覆盖正式 import 前后都要查：

### 表结构

- `reel` sheet 存在。
- `spinning_reel_detail` sheet 存在。
- 表头等于 `HEADERS.reelMaster` / `HEADERS.spinningReelDetail`。
- master/detail 数量符合官网当前列表。

### 行对应

- master 顺序与 normalized 产品顺序一致。
- 每个 `reel_id` 的 detail 数等于 normalized variants 数。
- detail ID 无重复。
- detail `SKU` 与 normalized 清洗后 SKU 一致。

### 字段错列

逐字段反查 normalized：

- `GEAR RATIO`
- `WEIGHT`
- `cm_per_turn`
- `MAX DRAG`
- `MAX_DURABILITY`
- `pe_no_m`
- `Nylon_no_m`
- `Nylon_lb_m`
- `handle_length_mm`
- `bearing_count_roller`
- `spool_diameter_mm`
- `handle_knob_type`
- `body_material`
- `body_material_tech`
- `gear_material`
- `market_reference_price`
- `product_code`

要求 mapping mismatch 为 `0`。

### SKU 异常

检查：

- 官网机器翻译词残留。
- 尾部标点。
- 中英文混乱但可确认应归一的系列名。

### 图片

- `images` 不含本地路径。
- CDN 前缀正确。
- 本地对应图片存在且非空。

### 玩家字段

- 覆盖率符合预期。
- 不含来源词。
- 不跨场景错配，例如：
  - 木虾不写成船钓铁板。
  - 远投投钓不写成海鲈泛用。
  - Bass 专向不写成海水强力。

---

## 10. 不建议做的事

- 不为补满而猜值。
- 不把白名单站内容写成官方字段。
- 不把低证据兼容页直接回填。
- 不在稳定链路上反复全量试错。
- 不新增 schema 列后直接写表，必须先确认最终表接收。

---

## 11. 当前 Daiwa Taiwan 复用命令

生成 dry-run：

```bash
node scripts/build_daiwa_tw_spinning_current_import.js
```

覆盖正式 import：

```bash
node scripts/build_daiwa_tw_spinning_current_import.js --commit
```

强制刷新图片并覆盖正式 import：

```bash
node scripts/build_daiwa_tw_spinning_current_import.js --commit --force-images
```

补主表玩家字段：

```bash
node scripts/apply_daiwa_tw_spinning_player_fields.js
```

---

## 12. 复用到其他品牌时要改的地方

至少改：

- `LIST_URL`
- `SITE_ORIGIN`
- `BRAND_IDS`
- `OUTPUT_FILE` / `OUTPUT_JSON` / `AUDIT`
- `IMAGE_DIR`
- `STATIC_PREFIX`
- list 解析器
- detail 规格表解析器
- SKU 清洗规则
- 官方环境 / 玩家环境派生规则
- 白名单辅助站策略

不要改：

- `HEADERS.reelMaster`
- `HEADERS.spinningReelDetail`
- dry-run / audit / commit 的三段流程
- 图片最终写 CDN URL 的规则
- QA 清单
