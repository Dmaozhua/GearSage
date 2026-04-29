# Megabass 鱼竿 字段补充修复流程记录 v1

版本：v1  
状态：Megabass rod 字段补充阶段性收口  
更新时间：2026-04-29  

---

## 1. 当前范围

来源站点：

- Megabass bass rod 列表  
  `https://www.megabass.co.jp/site/freshwater/bass_rod/`

当前正式导入表：

- [megabass_rod_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_import.xlsx)

当前主要中间层：

- [megabass_rod_raw.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_raw.json)
- [megabass_bass_rod_discovery.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_bass_rod_discovery.json)
- [megabass_rod_official_order.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_official_order.json)

本轮结果：

- 官网 bass rod 发现：`10` 个系列，`173` 个商品 URL
- 旧 raw 中 bass URL 与当前官网发现结果一致：新增 `0`，缺失 `0`
- 官网 rod 展示顺序：bass `10` 个系列、trout `5` 个系列，共 `192` 个商品 URL
- 正式导入表：`rod = 15`，`rod_detail = 186`
- `rod.series_positioning`：`15 / 15`
- `rod.main_selling_points`：`15 / 15`
- `rod.images`：`15 / 15`，已统一为未来资源存储 URL
- `rod.type_tips`：`15 / 15`，本轮优化并以黄色底色标记
- `rod.player_positioning`：`15 / 15`
- `rod.player_selling_points`：`15 / 15`
- `rod_detail.POWER`：`178 / 186`；`DESTROYER T.S / MR1001` 的 8 个子型号按人工复核决定保留为空，不再从 `TS...X / TS...XS / TS...X+` 后缀推断 POWER
- `rod_detail.LURE WEIGHT`：`186 / 186`；其中官网只有 oz 的型号已换算为 g，原始 oz 保留在 `LURE WEIGHT (oz)`；Tracking Buddy 的线材/拖钓标注保留官网文本
- `rod_detail.Description`：`186 / 186`
- `rod_detail.recommended_rig_pairing`：`186 / 186`，字段位于 `guide_use_hint` 后、`hook_keeper_included` 前；用于承接当前子型号最适合的钓组/饵型，并按“最擅长 -> 合适”排序
- `rod_detail.player_environment`：`186 / 186`
- `rod_detail.player_positioning`：`186 / 186`
- `rod_detail.player_selling_points`：`186 / 186`
- `rod_detail.Handle Length`：`43 / 186`，来自白名单规格表并以黄色底色标记
- `rod_detail.Grip Type`：`7 / 186`，只保留白名单规格中可读的 `EVA / Split / Full` 握把信息并以黄色底色标记；`Cast A/B/C...` 这类零售商模板码已清除
- `rod_detail.guide_use_hint`：`186 / 186`，已改为可直接阅读的中文使用说明；其中白名单修正 `2` 个单元格并以黄色底色标记
- `rod_detail.guide_layout_type`：`52 / 186`，其中白名单新增 `39` 个单元格并以黄色底色标记
- `rod_detail.hook_keeper_included`：`2 / 186`，来自 Hook Up Tackle Levante 页面 exact text，并以黄色底色标记

当前合理空值：

- `AdminCode = 0 / 186`  
  当前 Megabass rod raw 和官网规格没有稳定 JAN / product code 字段，不硬填。
- `official_environment = 0 / 186`  
  不把玩家场景推断写成官方环境。
- `hook_keeper_included = 2 / 186`  
  仅白名单页面能明确确认的 Levante 匹配型号写 `1`，其余不系列推断。
- `sweet_spot_lure_weight_real = 0 / 186`  
  不从官方 lure range 推断真实玩家甜区。

---

## 2. 本轮流程结论

本轮采用 Daiwa Taiwan rods 收口后的低风险流程：

1. 先读已有流程文档和 Megabass 旧脚本、旧 raw、旧导入表。
2. 对当前官网 bass rod 列表做发现对比，只写 sidecar，不覆盖正式 raw。
3. 确认当前官网 bass rod 与旧 raw 的 bass 部分 URL 一致。
4. 重新抓取 bass + trout rod 的官网展示顺序 sidecar。
5. 在 `megabass_rod_import.xlsx` 上做定点字段补充。
6. 按官网系列顺序和系列内商品展示顺序重排 `rod` / `rod_detail`。
7. 保存 Excel 后恢复 `rod_detail` 分组底色。
8. 做字段覆盖、power 半级、场景误判、排序和底色验证。

关键原则：

- 不重新全量覆盖已经进入检查阶段的导入表。
- 官网发现脚本只做清单对比，不直接重写 `megabass_rod_raw.json`。
- 排序修复只重排行，不改已有 ID，不改字段内容。
- 玩家字段来自官网描述、SKU、规格和稳定规则推断，不污染官方字段。
- `guide_layout_type / guide_use_hint` 不再使用 `special / finesse / versatile` 这类内部标签，正式表里写“结构是什么 + 对使用有什么帮助”。
- `recommended_rig_pairing` 先读子型号 `Description`，再用白名单辅助站做补充/校验；没有可靠来源时只做保守推断，不把 MH/H 或 X 后缀直接等同于 Big Bait。
- 保存 xlsx 后必须恢复 `rod_detail` 分组底色。

---

## 3. 脚本链路

### 3.1 官网 bass rod 发现

脚本：

- [discover_bass_rods_stage1.py](/Users/tommy/GearSage/scripts/scrapers/megabass/discover_bass_rods_stage1.py)

作用：

- 访问 Megabass bass rod 列表。
- 抓取系列页和每个系列下的 product URL。
- 输出 sidecar：
  - `megabass_bass_rod_discovery.json`

运行：

```bash
python3 scripts/scrapers/megabass/discover_bass_rods_stage1.py
```

注意：

- 该脚本不覆盖 `megabass_rod_raw.json`。
- 本轮发现结果显示 bass rod URL 与旧 raw 中 bass 部分一致。
- 后续排序以 `megabass_rod_official_order.json` 为准，不以旧 raw 顺序为准。

### 3.2 官网 rod 展示顺序

脚本：

- [discover_rods_official_order_stage2.py](/Users/tommy/GearSage/scripts/scrapers/megabass/discover_rods_official_order_stage2.py)

作用：

- 访问 Megabass bass rod 和 trout rod 列表。
- 按官网 DOM 展示顺序保留系列顺序。
- 进入每个系列页，按 `ul.page_series__lineup` 下的商品卡片顺序保留 product URL。
- 输出 sidecar：
  - `megabass_rod_official_order.json`

运行：

```bash
python3 scripts/scrapers/megabass/discover_rods_official_order_stage2.py
```

注意：

- 这是排序修复的唯一顺序来源。
- 该脚本不覆盖 raw，也不覆盖导入表。

### 3.3 字段补充回写

脚本：

- [apply_megabass_rod_field_completion_stage1.js](/Users/tommy/GearSage/scripts/apply_megabass_rod_field_completion_stage1.js)

作用：

- 读取 `megabass_rod_raw.json` 和 `megabass_rod_import.xlsx`。
- 补齐新导入表头中的缺失列。
- 补充主表：
  - `series_positioning`
  - `main_selling_points`
  - `official_reference_price`
  - `market_status`
  - `player_positioning`
  - `player_selling_points`
- 补充子表：
  - 半级 `POWER`，例如 `F4.1/2`
  - `LURE WEIGHT`：已有 g 保留；只有 oz 的官网数据按 `1 oz = 28.3495g` 换算为 g
  - `LURE WEIGHT (oz)`：保留官网原始 oz 文本
  - 缺失 `Description`
  - `player_environment`
  - `player_positioning`
  - `player_selling_points`
  - `guide_use_hint`：可读中文说明，例如“轻线精细：小饵低负荷出线更顺，竿尖信号和细线控线更直接...”
  - 有明确描述支撑时的 `guide_layout_type`：可读中文说明，例如“双脚导环/双线绑扎：提升高负荷抛投和搏鱼时的导环支撑...”

运行：

```bash
node scripts/apply_megabass_rod_field_completion_stage1.js
```

重要限制：

- 该脚本会保存 `megabass_rod_import.xlsx`。
- 进入人工复核后，不应反复运行覆盖人工调整的玩家字段。
- 如果后续只修某个字段，应另写定点脚本，只改目标字段。

### 3.4 按官网顺序重排

脚本：

- [reorder_megabass_rod_import_by_official_order_stage3.js](/Users/tommy/GearSage/scripts/reorder_megabass_rod_import_by_official_order_stage3.js)

作用：

- 读取 `megabass_rod_official_order.json`、`megabass_rod_raw.json` 和 `megabass_rod_import.xlsx`。
- 用 raw 中的 `model_name -> url` 关联正式表 SKU 与官网 URL。
- 按官网系列顺序重排 `rod`。
- 按官网系列内商品展示顺序重排 `rod_detail`。
- 保留原有 `MR* / MRD*` ID，不重编号。
- 写完后恢复 `rod_detail` 分组底色。

运行：

```bash
node scripts/reorder_megabass_rod_import_by_official_order_stage3.js
```

本轮验证：

- `missing_order_details = 0`
- `order_mismatch_series = 0`
- `LEVANTE` 已按官网从 `F1-65LV / F2-66LV / F3-69LV ...` 开始排序。

### 3.5 底色恢复

脚本：

- [shade_megabass_rod_detail_groups_stage2.py](/Users/tommy/GearSage/scripts/shade_megabass_rod_detail_groups_stage2.py)
- [run_megabass_rod_detail_group_shading.js](/Users/tommy/GearSage/scripts/run_megabass_rod_detail_group_shading.js)

底色：

- `FFF8F3C8`
- `FFE8F1FB`

硬规则：

- 任何脚本只要保存 `megabass_rod_import.xlsx`，最后都要恢复 `rod_detail` 分组底色。

### 3.6 白名单玩家证据 sidecar

脚本：

- [collect_rod_player_evidence_stage4.js](/Users/tommy/GearSage/scripts/scrapers/megabass/collect_rod_player_evidence_stage4.js)

输出：

- [megabass_rod_whitelist_player_evidence.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_whitelist_player_evidence.json)

当前来源：

- Megabass 官网仍是官方字段的唯一主来源。
- Tackle Warehouse：用于型号级零售规格、导环数、手柄长度、部分玩家技法语境。
- The Hook Up Tackle：用于 Levante 旧款零售描述中的 Fuji Alconite guides、hook keeper 等组件语境。
- PLAT：仅保留 `TS78X` 页面上的 retailer product code 证据，不写入 `AdminCode`。

当前结果：

- 来源页 `13` 个，成功解析 `13` 个。
- evidence `46` 条：
  - `tacklewarehouse.com = 43`
  - `thehookuptackle.com = 2`
  - `plat.co.jp = 1`

硬规则：

- 该脚本只写 sidecar，不修改 `megabass_rod_import.xlsx`。
- 匹配规则为“配置系列相同 + 型号归一后精确相同”，不做模糊标题匹配。
- `TS78X+` 与 `TS78X` 不能合并，`+` 后缀视为型号的一部分。
- 第三方页面只作为玩家/零售证据，不能直接覆盖官方字段；需要人工复核后再决定是否定点回写。

### 3.7 白名单证据回填

脚本：

- [apply_megabass_rod_whitelist_evidence_stage5.py](/Users/tommy/GearSage/scripts/apply_megabass_rod_whitelist_evidence_stage5.py)

输出报告：

- [megabass_rod_whitelist_backfill_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_whitelist_backfill_report.json)

回填规则：

- 只读取 `megabass_rod_whitelist_player_evidence.json`。
- 只处理 Tackle Warehouse / The Hook Up Tackle 可精确匹配到 `rod_detail.id` 的证据。
- 本次写入或覆盖的单元格统一填充黄色 `FFFFFF00`，方便人工审核。
- `AdminCode` 不使用 PLAT 的 retailer product code 回填，避免把零售商编码误当官方 JAN / product code。

本次回填：

- 改动子型号：`43`
- 改动单元格：`175`，已剔除不可读的 Tackle Warehouse handle-template 代码
- `Handle Length`：`43`
- `Grip Type`：`7`
- `guide_layout_type`：`39`
- `guide_use_hint`：`2`
- `hook_keeper_included`：`2`
- `player_positioning`：`41`
- `player_selling_points`：`41`

后续清理：

- [fix_megabass_rod_grip_type_codes_stage6.py](/Users/tommy/GearSage/scripts/fix_megabass_rod_grip_type_codes_stage6.py)
- Tackle Warehouse 的 `Cast A / Cast B / Spin A...` 是零售商握把模板编号，不是用户可直接理解的握把类型。
- 本轮已清除 `36` 个不透明模板码，只保留：
  - `EVA casting grip = 2`
  - `Split casting grip = 4`
  - `Full casting grip = 1`

### 3.8 主表玩家字段优化

脚本：

- [optimize_megabass_rod_master_player_fields_stage7.py](/Users/tommy/GearSage/scripts/optimize_megabass_rod_master_player_fields_stage7.py)

输出报告：

- [megabass_rod_master_field_optimization_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_master_field_optimization_report.json)

优化字段：

- `type_tips`
- `player_positioning`
- `player_selling_points`

规则：

- `type_tips` 按“对象鱼 / 竿型或结构 / 核心用途”写短标签。
- `player_positioning` 和 `player_selling_points` 以 Megabass 官网系列定位为主。
- 有白名单型号级规格的 bass 系列，使用 Tackle Warehouse / The Hook Up Tackle 证据压实覆盖面，例如轻量、moving bait、swimbait、旅行多节等。
- trout 系列不套用 bass 零售页证据，按官网系列和子型号规格保持鳟鱼语境。
- 本次修改的主表单元格填充黄色 `FFFFFF00`。

本次结果：

- 改动系列：`15`
- 改动主表单元格：`45`
- `type_tips = 15`
- `player_positioning = 15`
- `player_selling_points = 15`
- 后续清理 `player_selling_points` 中的生产过程措辞：`7` 个单元格；正式表不再出现“白名单规格 / 白名单证据”等面向内部流程的表述

### 3.9 主表主图本地归档与 images URL 规范化

脚本：

- [refresh_megabass_rod_master_images_stage8.py](/Users/tommy/GearSage/scripts/refresh_megabass_rod_master_images_stage8.py)

输出报告：

- [megabass_rod_master_images_refresh_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_master_images_refresh_report.json)

本地目标目录：

- `/Users/tommy/Pictures/images/megabass_rods`

旧图复用目录：

- `/Users/tommy/Pictures/images_old_copy/megabass_rods`

表格 `images` 写入规则：

- `https://static.gearsage.club/gearsage/Gearimg/images/megabass_rods/{主图文件名}`

本次结果：

- 主商品：`15`
- 目标目录主图：`15`
- 从旧图目录复用复制：`15`
- 官网重新下载：`0`
- 缺失：`0`
- `images` 单元格文本变更：`0`，因为当前表格已经是目标静态 URL 规范

### 3.10 子型号 recommended_rig_pairing 回填

脚本：

- [apply_megabass_rod_recommended_rig_pairing_stage9.py](/Users/tommy/GearSage/scripts/apply_megabass_rod_recommended_rig_pairing_stage9.py)

输出报告：

- [megabass_rod_recommended_rig_pairing_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_recommended_rig_pairing_report.json)
- [megabass_rod_variant_usage_facts.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_variant_usage_facts.json)
- [megabass_rod_usage_consistency_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_usage_consistency_report.json)

字段规则：

- `recommended_rig_pairing` 插入在 `guide_use_hint` 后、`hook_keeper_included` 前。
- 内容按“最擅长 -> 合适”排序，不使用固定枚举；官网出现的新饵型/钓组可扩充。
- 优先读取本地 Megabass 官网 `Description` 里的明确钓组/饵型词，例如 Frog、Punching、Texas、Free Rig、Down Shot、Crankbait、Shad、Minnow、Spinnerbait、Chatterbait、Swimbait、Big Bait、Trout Minnow 等。
- 官网没有明确词时，才使用白名单辅助站 exact SKU 证据；白名单只补充/校验，不覆盖明确官网信息。
- 无可靠来源时，基于 SKU、power、action、lure weight、type、玩家字段做保守推断；不因 `MH/H`、`X` 后缀自动写 Big Bait。
- 术语归类沿用 Daiwa Taiwan rod 的收口口径：`刀片铅头钩` 归 Chatterbait，`泳饵铅头钩` 归 Swim Jig，`橡胶铅头钩` 归 Rubber Jig，`无铅头钩组` 归 No Sinker。

本次结果：

- 覆盖率：`186 / 186`
- 来源分布：
- `official_description = 161`
- `whitelist_specs = 6`
- `conservative_specs = 19`
- 首次写入新增字段并回填 `186` 个 `recommended_rig_pairing` 单元格。
- 首次一致性修正中，因 `recommended_rig_pairing` 与原 `guide_use_hint` 方向冲突，定点修正 `59` 个 `guide_use_hint`；没有改动 `Description`。
- 后续复核将 `Minnow` 复数表达纳入识别，并去掉包含关系冗余，例如已有 `Small Rubber Jig` 时不再重复 `Rubber Jig`、已有 `Deep Crankbait` 时不再重复 `Crankbait`；最终复核改动 `43` 个 `recommended_rig_pairing` 单元格。
- `megabass_rod_recommended_rig_pairing_report.json` 已写入 `source_audit` 和 `source_rows`，可按 Excel 行号复核每个子型号的来源等级。
- 保存后已运行 `shade_megabass_rod_detail_groups_stage2.py`，恢复 `rod_detail` 分组底色。

### 3.11 guide_use_hint / recommended_rig_pairing 描述承接复核

脚本：

- [apply_megabass_rod_usage_hint_enrichment_stage10.py](/Users/tommy/GearSage/scripts/apply_megabass_rod_usage_hint_enrichment_stage10.py)

输出报告：

- [megabass_rod_usage_hint_enrichment_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_usage_hint_enrichment_report.json)

复核规则：

- 对 `rod_detail` 全量 `186` 个子型号复核 `guide_use_hint` 与 `recommended_rig_pairing`。
- 当 SKU / Code Name / Description 明确出现饵型或钓组时，优先按该子型号描述承接，不套系列页或整页内容。
- 将日文/英文描述中的 `ライトリグ / 軽量リグ / bait finesse / small rubber jig / light plug / topwater / jerkbait / deep crank / bladed jig / MAGDRAFT / magnum-size lure / metal type lure` 等表达拆成用户可读的具体钓组/饵型。
- 非 GreatHunting 系列中出现的 `trout` 仅按对象鱼处理，不再误写成 `Trout Minnow` 饵型。
- `guide_use_hint` 不再使用 14 个粗模板复用，改为按主饵、辅饵、精准落点、远投控线、障碍区控鱼、咬口/线张力反馈、玻纤/低弹性追随、实心竿梢等描述信号组合生成。

本次结果：

- 最终来源分布：
  - `description_explicit = 178`
  - `conservative_specs = 5`
  - `whitelist_specs = 2`
  - `official_description = 1`
- `guide_use_hint` 全量重写为描述承接版：`186 / 186`
- `guide_use_hint` 唯一文本数从 `14` 扩展到 `139`
- `recommended_rig_pairing` 首轮描述复核调整 `77` 个单元格；后续修正 Valkyrie 多鱼种目标鱼误判等问题，再调整 `4` 个单元格
- 保存后已运行 `shade_megabass_rod_detail_groups_stage2.py`，恢复 `rod_detail` 分组底色

### 3.12 rod_detail 三个玩家字段精修

脚本：

- [apply_megabass_rod_detail_player_fields_stage11.py](/Users/tommy/GearSage/scripts/apply_megabass_rod_detail_player_fields_stage11.py)

输出报告：

- [megabass_rod_detail_player_fields_stage11_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_detail_player_fields_stage11_report.json)

精修字段：

- `player_environment`
- `player_positioning`
- `player_selling_points`

字段口径：

- 只写玩家视角，不写“官网确认 / 白名单显示 / 来源是...”等内部来源说明。
- `recommended_rig_pairing` 作为主线，Description 和规格只作为边界，防止场景越界。
- 混合路线按首位饵型优先，再写辅线逻辑；例如 `Spinnerbait / Vibration / Deep Crankbait / No Sinker` 写移动饵搜索与软饵补充，不误写成单纯 finesse。
- Valkyrie World Expedition 按多鱼种远征处理，区分小型 Plug、港湾岸投/Metal Jig、大型饵强力；不把目标鱼 `trout` 误写成 GreatHunting 鳟鱼竿语境。
- GreatHunting 按山溪、本流湖泊、X-GLASS 小型硬饵、Tracking Buddy 拖钓拆分。

本次结果：

- 初次全量精修：`186` 行、`558` 个单元格。
- 二次主线路由修正：`37` 行、`96` 个单元格，修正硬饵主线被软饵标签抢占的问题。
- 小型 Plug + Bait Finesse 辅线修正：`2` 行、`4` 个单元格。
- 最终覆盖率：
  - `player_environment = 186 / 186`
  - `player_positioning = 186 / 186`
  - `player_selling_points = 186 / 186`
- 最终 unique 数：
  - `player_environment = 30`
  - `player_positioning = 33`
  - `player_selling_points = 103`
- 保存后已运行 `shade_megabass_rod_detail_groups_stage2.py`，恢复 `rod_detail` 分组底色。

### 3.13 player_selling_points 专业表达复修

脚本：

- [refine_megabass_rod_player_selling_points_stage12.py](/Users/tommy/GearSage/scripts/refine_megabass_rod_player_selling_points_stage12.py)

输出报告：

- [megabass_rod_player_selling_points_stage12_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/megabass_rod_player_selling_points_stage12_report.json)

复修范围：

- 只写 `rod_detail.player_selling_points`。
- 不改 `player_environment / player_positioning`，不改官网字段、规格字段、`Description`、`recommended_rig_pairing`、`guide_use_hint`。

复修口径：

- 去除 `不发散 / 不发虚 / 不拖泥带水 / 有底气 / 余量高` 等口语化表达。
- 去除 `官网 / 白名单 / 来源 / 证据 / 参考规格` 等内部来源链表达。
- 将原来的短语堆叠改为较完整的专业句式，围绕主推荐饵型、辅饵路线、控线/落点/泳层/负荷承接/咬口反馈等真实使用价值展开。
- Description 中的远投、精准落点、线张力、低弹性、实心竿梢、强力负荷等信号只作为边界和补充，不直接搬官方卖点。

本次结果：

- `player_selling_points` 覆盖率：`186 / 186`
- `player_selling_points` unique 数：`132`
- 完整文本最高重复：`3`
- 口语词和来源词残留：`0`
- `更容易 / 更适合 / 适合 / 兼顾` 高频机械连接词残留：`0`
- 保存后已运行 `shade_megabass_rod_detail_groups_stage2.py`，恢复 `rod_detail` 分组底色。

---

## 4. 本轮验证

验证项：

- 官网 bass rod discovery 与旧 raw bass URL 对比：新增 `0`，缺失 `0`
- 官网 rod official order 覆盖正式表子商品：缺失 `0`
- 15 个系列的子商品顺序与官网展示顺序对比：异常 `0`
- `rod` 表头已扩展到当前 `gear_export_schema.js` 的 rod master 表头
- `rod_detail` 表头已扩展到当前 `gear_export_schema.js` 的 rod detail 表头
- `POWER` 空值：`8`，均为 `MR1001 / DESTROYER T.S` 的人工保留空值
- `F*.1/2` 半级 power 截断：`0`
- `guide_layout_type / guide_use_hint` 旧枚举残留：`0`
- 白名单玩家证据 sidecar 已生成：`46` 条；其中通过定点脚本回填 `43` 个子型号
- 白名单证据已定点回填并清理不透明握把模板码：最终 `175` 个单元格以黄色底色标记
- 主表 `type_tips / player_positioning / player_selling_points` 已优化：`45` 个单元格以黄色底色标记
- 主表主图已归档到 `/Users/tommy/Pictures/images/megabass_rods`：`15` 张；`images` URL 格式校验异常 `0`
- `recommended_rig_pairing` 覆盖率：`186 / 186`
- `recommended_rig_pairing` 来源分布：官网 `Description` 明确词 `161`，白名单 exact SKU 补充 `6`，保守推断 `19`
- `General Lure / Light Rig / Hardbait / Soft Bait` 等过泛残留：`0`
- `Description / recommended_rig_pairing / guide_use_hint` 一致性检查：异常 `0`
- Stage 10 复核后 `recommended_rig_pairing / guide_use_hint` 覆盖率：`186 / 186`
- Stage 10 复核后 `guide_use_hint` 唯一文本数：`139`
- Stage 10 复核后非 GreatHunting 系列误写鳟鱼语境：`0`
- Stage 10 复核后“重点是 / 重点在 / 使用重点”等口头禅残留：`0`
- Stage 11 三个玩家字段覆盖率：`186 / 186`
- Stage 11 三个玩家字段 unique 数：`player_environment = 30`，`player_positioning = 33`，`player_selling_points = 103`
- Stage 11 玩家字段与 `recommended_rig_pairing` 主线冲突：`0`
- Stage 11 bass / Valkyrie / GreatHunting 场景误写：`0`
- Stage 11 来源说明、空泛词、旧模板残留：`0`
- Stage 12 `player_selling_points` 覆盖率：`186 / 186`
- Stage 12 `player_selling_points` unique 数：`132`，完整文本最高重复 `3`
- Stage 12 口语词、来源词、机械连接词残留：`0`
- bass 记录未误落到鳟鱼、船钓、木虾、海水场景
- trout 记录保留鳟鱼场景
- `rod_detail` 分组底色已恢复并交替

---

## 5. 后续注意

- 若要扩展 Megabass trout rod，也应先做 trout discovery sidecar，再判断是否需要更新 raw。
- 白名单站证据已独立到 evidence sidecar；后续若继续扩展，应按字段做定点脚本，并在回写前人工确认来源是否适用于当前日本官网型号。
- `AdminCode`、`official_environment`、`sweet_spot_lure_weight_real` 仍需等待稳定来源，不应为补满而硬填；`hook_keeper_included` 仅在白名单页面明确写出 hook keeper 时回填。
