# Daiwa 台湾鱼竿 爬取补充修复导出流程收口 v1

版本：v1  
状态：本次 Daiwa Taiwan rods 阶段性收口  
更新时间：2026-05-06

---

## 1. 当前范围

来源站点：

- 基础 A：Daiwa 台湾官网 lure rod 列表  
  `https://www.daiwaseiko.com.tw/product-list/rod/lure-rod//`
- 补充 B：日本 Daiwa 官网台湾语言站当前列表  
  `https://www.daiwa.com/tw/product/productlist?category1=釣竿&choshu=海水路亞（岸釣）,鱸魚,溪流鱒魚・飛蠅釣&category2=未指定`

当前实际口径：

- A 是历史基础表来源。
- B 用于补充 A 缺少的主商品、补充 A 中主商品缺少的子型号，并用于当前官网数据校验。
- B 不用于全量覆盖 A；A 中已有但 B 当前列表未覆盖的历史商品保留。
- 旧 `daiwaseiko.com.tw` 规格图可作为历史商品修复证据，但后续新增和补缺优先使用 B。

当前正式导入表：

- [daiwa_rod_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_import.xlsx)

当前主要中间层：

- [daiwa_tw_rod_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_rod_normalized.json)
- [daiwa_tw_rod_structured.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_rod_structured.json)
- [daiwa_tw_rod_price_rows.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_tw_rod_price_rows.json)

当前结果：

- 主商品：`75`
- 子型号：`658`
- `rod.images`：`75 / 75`
- `rod.Description`：`75 / 75`
- `rod.player_positioning`：`75 / 75`
- `rod.player_selling_points`：`75 / 75`
- `rod_detail.guide_use_hint`：`658 / 658`
- `rod_detail.recommended_rig_pairing`：`658 / 658`
- `rod_detail.player_environment`：`658 / 658`
- `rod_detail.player_positioning`：`658 / 658`
- `rod_detail.player_selling_points`：`658 / 658`
- `rod_detail` 分组底色：`658 / 658`

当前合理空值：

- `official_environment = 0 / 658`  
  Daiwa 台湾官网没有稳定官方场景字段，不用白名单站污染 official 语义。
- `hook_keeper_included = 0 / 658`  
  白名单站和官网都没有稳定覆盖，不硬填。
- `sweet_spot_lure_weight_real = 0 / 658`  
  白名单站能给规格范围，但不能给真实玩家甜区；不把算法推断写成事实。

---

## 2. 本次流程结论

这次 Daiwa Taiwan rods 不是一次单纯爬取，而是完整走过：

1. 台湾官网列表和详情页抓取
2. 主商品 Description 修复
3. 子型号 Description 补全
4. 规格图 OCR
5. OCR 规格解析和串列修复
6. 导入表生成
7. 针对性补缺、修串列、修特殊型号
8. 主图本地下载和 `images` CDN URL 标准化
9. 玩家字段补充
10. 白名单辅助站抽样验证
11. 表格底色恢复和最终验证

这条流程对后续其他品牌 rod 可复用，但必须保留两个原则：

- **不要重新全量覆盖已经人工检查过的数据。**
- **任何改表步骤结束后都要恢复 `rod_detail` 分组底色。**

### 2.1 本次最终收尾重点

本次最后收尾主要处理两件事：

1. 新增并落地 `recommended_rig_pairing` 字段，同时建立 `Description / recommended_rig_pairing / guide_use_hint` 三个字段的冲突检查和修复流程。
2. 精修 `player_environment / player_positioning / player_selling_points` 三个玩家字段，使它们从“能填满”推进到“玩家视角可读、差异更清楚、不过度依赖官网文案”。

这两个方向都不能靠后期人工逐行纠错完成。当前稳定做法是：

- 先补官方子型号 `Description`，因为这是子型号细分钓组和使用路线的事实基础。
- 再生成 `variant_usage_facts`，把官网描述、规格、已确认白名单证据抽成结构化事实。
- `recommended_rig_pairing` 和 `guide_use_hint` 必须共用同一份事实，不能各自独立生成。
- 最后跑 `run_rod_usage_quality_gate.py`，有 `error` 时不能导出；`warning` 必须人工判断是词典误报还是字段遗漏。
- 玩家字段必须保持玩家/白名单/经验归纳口径。官网只作为不越界的背景约束，不能把官网卖点改写成 `player_*`。

---

## 3. 核心脚本链路

### 3.1 官网抓取到 normalized

脚本：

- [build_daiwa_tw_rod_normalized.py](/Users/tommy/GearSage/scripts/build_daiwa_tw_rod_normalized.py)

作用：

- 抓台湾官网 lure rod 列表。
- 进入详情页解析：
  - `model_name`
  - `model_cn`
  - `title_tw`
  - `description`
  - `main_selling_points`
  - `main_image_url`
  - `price_images`
  - `variant_descriptions`

关键经验：

- `Description` 不能只抓标题，要抓 `#intro` 正文。
- 遇到 `DAIWA 技術 / 產品詳情 / 產品介紹 / 寫真照片 / 發售日期 / 詳細規格` 要截断，避免正文混入规格区。
- 子型号描述通常藏在 `#intro` table 里，不在价格规格图里。
- `main_selling_points` 是标题层，不等于完整 Description。

运行：

```bash
python3 scripts/build_daiwa_tw_rod_normalized.py
```

注意：

- 这是会访问官网的脚本。后续不是必要时不要反复跑。
- 对已经进入人工检查阶段的数据，优先用定点修复脚本，不要用全量抓取结果覆盖导入表。

### 3.2 价格规格图 OCR

脚本：

- [ocr_daiwa_tw_rod_price_images_stage1.py](/Users/tommy/GearSage/scripts/ocr_daiwa_tw_rod_price_images_stage1.py)
- [parse_daiwa_tw_rod_price_ocr_stage2.py](/Users/tommy/GearSage/scripts/parse_daiwa_tw_rod_price_ocr_stage2.py)
- [parse_daiwa_tw_rod_price_rows_stage3.py](/Users/tommy/GearSage/scripts/parse_daiwa_tw_rod_price_rows_stage3.py)
- [parse_daiwa_tw_rod_variants_stage4.py](/Users/tommy/GearSage/scripts/parse_daiwa_tw_rod_variants_stage4.py)

产物：

- `daiwa_tw_rod_price_ocr/`
- `daiwa_tw_rod_price_ocr_lines.json`
- `daiwa_tw_rod_price_rows.json`
- `daiwa_tw_rod_structured.json`

关键经验：

- 台湾官网很多 rod 的规格不是 HTML table，而是图片，需要 OCR。
- OCR 解析必须按家族做定点规则，不能完全依赖通用列位。
- 串列问题主要来自 OCR 表格列错位，例如：
  - `Tip Diameter`
  - `LURE WEIGHT`
  - `LURE WEIGHT (oz)`
  - `PE Line Size`
  - `Action`
  - `PIECES`
- 修串列时只改对应字段，不重写整表。

### 3.3 structured 到导入表

脚本：

- [build_daiwa_tw_rod_import.js](/Users/tommy/GearSage/scripts/build_daiwa_tw_rod_import.js)

作用：

- 把 `daiwa_tw_rod_structured.json` 写成 `daiwa_rod_import.xlsx`。
- 生成 `rod` / `rod_detail` 两个 sheet。
- 推断：
  - `TYPE`
  - `POWER`
  - `model_year`
  - 主表 Description
  - 子型号 Description
- 写完后调用底色脚本。

运行：

```bash
node scripts/build_daiwa_tw_rod_import.js
```

重要限制：

- 这个脚本会重建导入表。进入人工检查和局部修复阶段后，不应随便再跑。
- 如果必须重跑，要先确认哪些人工修复需要重新 apply。

---

## 4. 针对性修复脚本

本次后半段进入人工检查后，修复策略从“重新生成”切换成“定点回写”。

用到的代表脚本：

- [refresh_daiwa_rod_master_descriptions_stage6.py](/Users/tommy/GearSage/scripts/refresh_daiwa_rod_master_descriptions_stage6.py)
- [refresh_daiwa_rod_variant_descriptions_stage4.py](/Users/tommy/GearSage/scripts/refresh_daiwa_rod_variant_descriptions_stage4.py)
- [merge_daiwa_rod_variant_descriptions_stage7.js](/Users/tommy/GearSage/scripts/merge_daiwa_rod_variant_descriptions_stage7.js)
- [refresh_daiwa_tw_variant_desc_tables_stage10.py](/Users/tommy/GearSage/scripts/refresh_daiwa_tw_variant_desc_tables_stage10.py)
- [refresh_daiwa_tw_selected_stage11.py](/Users/tommy/GearSage/scripts/refresh_daiwa_tw_selected_stage11.py)
- [repair_daiwa_tw_rod_admincode_stage8.js](/Users/tommy/GearSage/scripts/repair_daiwa_tw_rod_admincode_stage8.js)

经验：

- 主表 `Description` 曾经只抓到标题，必须抓标题 + 正文。
- 子型号 `Description` 从 `DR1013` 开始有大量缺失，需要从详情页 table 补。
- `DR1017` 子型号数量最终是 `21`，之前只有 `14`。
- `DR1036` 子型号规格用户手动维护过，不能覆盖规格字段；后续只允许按用户确认补玩家字段。
- `DRD10029` 的 SKU 是 `644LFS`，但官网主页 Description 写了 `664LFS`，这是官网文本错误，不要反向改 SKU。
- `DRD10264`、`DRD10265` 节数应为 `7`，不是 `6`。
- `DRD10285` 的 PE 容线量应为空，不应写 `1`。

---

## 5. 主图下载和 images 字段标准

脚本：

- [download_daiwa_tw_rod_main_images_stage13.py](/Users/tommy/GearSage/scripts/download_daiwa_tw_rod_main_images_stage13.py)

本地图片目录：

- `/Users/tommy/Pictures/images/daiwa_rods`

旧图可复用目录：

- `/Users/tommy/Pictures/images_old_copy/daiwa_rods`

导入表 `images` 最终格式：

```text
https://static.gearsage.club/gearsage/Gearimg/images/daiwa_rods/<filename>
```

命名规则：

```text
<rod_id>_<model_slug>.<ext>
```

例如：

```text
DR1000_morethan_BRANZINO_CGS.jpg
```

运行：

```bash
python3 scripts/download_daiwa_tw_rod_main_images_stage13.py
```

经验：

- 一个主商品只保留一张主图。
- 脚本会优先复用本地已有图片，再低频下载。
- `images` 不写本地路径，只写未来资源存储 URL。

---

## 6. 玩家字段补充

脚本：

- [apply_daiwa_tw_rod_player_fields_stage14.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_rod_player_fields_stage14.py)
- [apply_daiwa_tw_player_fields_refine_stage25.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_player_fields_refine_stage25.py)

当前写入字段：

主表：

- `player_positioning`
- `player_selling_points`

子表：

- `player_environment`
- `player_positioning`
- `player_selling_points`
- `guide_layout_type`
- `guide_use_hint`
- `recommended_rig_pairing`

当前不写字段：

- `official_environment`
- `hook_keeper_included`
- `sweet_spot_lure_weight_real`

运行：

```bash
python3 scripts/apply_daiwa_tw_rod_player_fields_stage14.py
```

stage14 当时玩家字段结果（46 主商品 / 338 子型号阶段）：

- `rod.player_positioning = 46 / 46`
- `rod.player_selling_points = 46 / 46`
- `rod_detail.player_environment = 338 / 338`
- `rod_detail.player_positioning = 338 / 338`
- `rod_detail.player_selling_points = 338 / 338`
- `rod_detail.guide_use_hint = 338 / 338`
- `rod_detail.guide_layout_type = 119 / 338`
- `rod_detail.recommended_rig_pairing = 338 / 338`

stage25 精修结果（46 主商品 / 338 子型号阶段）：

- `player_environment`：`338 / 338`，`unique = 40`
- `player_positioning`：`338 / 338`，`unique = 34`
- `player_selling_points`：`338 / 338`，`unique = 91`
- stage25 只允许修改这三个玩家字段，不改 `Description`、规格、导环、推荐钓组、主表字段。
- stage25 写入后重新恢复 `rod_detail` 底色，并重新跑 usage quality gate。

### 6.1 2026-05-06 玩家字段恢复与补全收口

问题：

- 当前导入表一度出现玩家字段为空：
  - `rod_detail.guide_use_hint = 0 / 658`
  - `rod_detail.recommended_rig_pairing = 0 / 658`
  - `rod_detail.player_environment = 0 / 658`
  - `rod_detail.player_positioning = 0 / 658`
  - `rod_detail.player_selling_points = 0 / 658`
- Git 历史确认这些字段曾经写入过，不是未做过，而是在后续重建/导出时被空模板覆盖。
- 当前 `HEAD` 中这些字段也为空，因此不能直接认为是某个单步脚本刚刚清空。

处理原则：

- 只恢复/补充玩家字段和 `guide_use_hint / recommended_rig_pairing`。
- 不覆盖已有非空字段。
- 不修改规格字段、官网字段、`Description`、`images`。
- 不按 `DRD id` 盲目恢复，因为历史中 `DRD` 和 `rod_id` 映射曾变化。
- 每次保存 xlsx 后恢复 `rod_detail` 分组底色。

#### stage41：从历史提交恢复可靠玩家字段

脚本：

- [fix_daiwa_rod_stage41_restore_reliable_player_fields.py](/Users/tommy/GearSage/scripts/fix_daiwa_rod_stage41_restore_reliable_player_fields.py)

来源：

- Git 历史提交：`0d3bfc9`

可靠匹配规则：

1. 主表按唯一 `model` 匹配。
2. 子表优先按唯一 `AdminCode / JAN` 匹配。
3. 子表再按唯一 `model + SKU` 匹配。
4. 匹配不到或不唯一的历史行不恢复。

恢复结果：

- `rod.player_positioning`：恢复 `40`
- `rod.player_selling_points`：恢复 `40`
- `rod_detail.guide_use_hint`：恢复 `332`
- `rod_detail.recommended_rig_pairing`：恢复 `332`
- `rod_detail.player_environment`：恢复 `332`
- `rod_detail.player_positioning`：恢复 `332`
- `rod_detail.player_selling_points`：恢复 `332`
- 子表恢复方式：
  - `AdminCode / JAN`：`316`
  - `model + SKU`：`16`

恢复后额外处理：

- 两条历史 `recommended_rig_pairing = Soft Plastic` 过泛，不保留，清空后留给后续白名单/规则补全。

#### stage42：白名单辅助补全空白玩家字段

脚本：

- [fix_daiwa_rod_stage42_fill_blank_player_fields_whitelist.py](/Users/tommy/GearSage/scripts/fix_daiwa_rod_stage42_fill_blank_player_fields_whitelist.py)

白名单辅助站：

- `https://tackledb.uosoku.com/`
- `https://rodsearch.com/`
- `https://rods.jp/`

写入范围：

- 只填空白字段。
- 不覆盖 stage41 恢复值。
- 不覆盖人工检查过的规格、官网描述、主图和官方字段。

补全依据：

- 当前官网 Description、SKU、POWER、规格边界作为不越界约束。
- 白名单站用于确认玩家场景、目标鱼、常见钓组/饵型和类别边界。
- 无法做到三站全量逐条抓取，避免对白名单站造成压力；按系列和代表型号验证后保守扩展到同系列空白子型号。

补全结果：

- `rod.player_positioning`：补 `35`
- `rod.player_selling_points`：补 `35`
- `rod_detail.guide_use_hint`：补 `326`
- `rod_detail.recommended_rig_pairing`：补 `328`
- `rod_detail.player_environment`：补 `326`
- `rod_detail.player_positioning`：补 `326`
- `rod_detail.player_selling_points`：补 `326`

系列分布：

- `bass`：`134`
- `seabass`：`38`
- `shore_jigging`：`51`
- `light_salt`：`32`
- `chining`：`16`
- `rockfish`：`19`
- `trout`：`38`

#### stage43：新补玩家卖点去模板化

脚本：

- [fix_daiwa_rod_stage43_degeneric_new_player_selling.py](/Users/tommy/GearSage/scripts/fix_daiwa_rod_stage43_degeneric_new_player_selling.py)

问题：

- stage42 补空后，`player_selling_points` 虽然不冲突，但同系列内有部分句式重复较高，读起来像模板。

处理：

- 只改 stage42 新补入的通用模板句。
- 不改 stage41 恢复值。
- 不改任何其他字段。
- 把 `model + SKU + POWER + recommended_rig_pairing` 写进玩家卖点，使同系列子型号读起来能区分。

结果：

- 去模板化修改：`326` 条。
- `player_selling_points` 高频重复句：`0`。

最终覆盖率：

- `rod.player_positioning = 75 / 75`
- `rod.player_selling_points = 75 / 75`
- `rod_detail.guide_use_hint = 658 / 658`
- `rod_detail.recommended_rig_pairing = 658 / 658`
- `rod_detail.player_environment = 658 / 658`
- `rod_detail.player_positioning = 658 / 658`
- `rod_detail.player_selling_points = 658 / 658`

最终 QA：

- 空值：`0`
- `recommended_rig_pairing` 过泛值：`0`
  - 不允许保留 `Soft Plastic / Light Rig / Hardbait / General Lure / Soft Bait` 这类单独泛值。
- `guide_use_hint` 与 `recommended_rig_pairing` 明显软硬饵冲突：`0`
- `guide_use_hint` 旧口头禅 `重點是`：`0`
- `rod_detail` 分组底色已恢复：
  - `FFF8F3C8 = 405`
  - `FFE8F1FB = 253`

复用规则：

- 后续其他品牌如果出现“玩家字段曾经写过但当前为空”，先查 Git 历史或备份，不要重新生成覆盖。
- 恢复历史值时不能只看 detail id，必须用稳定业务键：
  - `AdminCode / JAN / product code`
  - `model + SKU`
  - 必要时加 `TYPE / POWER`
- 白名单补空时只写空白，不覆盖已确认值。
- 白名单站内容不写进 `official_*` 字段。
- `player_selling_points` 不允许整组重复一条模板；至少要包含子型号、规格强弱、主要钓组或使用场景差异。

玩家字段来源口径：

- `player_*` 不是官网字段，不能把官网标题或官方卖点直接搬进去。
- 官网 `Description` 只用于避免玩家字段越界，例如不要把海鲈岸投写成船钓铁板，不要把 eging 写成 bass 泛用。
- 白名单辅助站和玩家语境用于决定玩家视角：适用环境、定位、真实使用中的优点。
- 没有白名单或玩家证据时，允许基于 SKU、规格、已确认钓组和系列语义做保守归纳，但不能写成“官网确认”。
- 字段里不写来源说明，例如 `白名单确认 / tackledb 显示 / 官网写到`。
- `player_selling_points` 不再使用 `XXX 优先 / 重点在 XXX` 这种机械模板。表达应改成“以 XXX 做主轴时...”“搭配起来较自然...”“可以作为主要搭配方向...”等较柔和的玩家说明，避免给用户“绝对适配”的感觉。

重要规则：

- `morethan / lateo` 优先归海鲈岸投，不被描述里的 `EMERALDAS` 技术说明误导。
- `emeraldas / eging` 只在型号或正文明确木虾/乌贼时归木虾。
- `overthere / dragger / SLSJ` 属于岸投/岸拋铁板，不应因为“铁板”二字归船钓。
- `hardrock` 属于岩鱼/rockfish，不应因为“铁板头”归船钓铁板。
- `月下美人` 优先轻型海水，不能被“铁板路亚”字样带到船钓。
- bass 类：
  - `-SB / Swimbait / Big Bait / 大型餌 / 大餌` 才归 `大餌 / 強力`
  - `FR / Frog` 才归 `Frog / 強障礙`
  - `HFB / HRB / MH / H / XH / XXH` 只是强度信号，不自动等于大饵
  - 没有明确大饵描述的 `CxxMH / CxxH` 归 `強力泛用`

### 6.1 `guide_layout_type` 口径

这个字段不是内部枚举，不再写 `special / standard`。

只在有明确导环配置证据时填写；没有证据时宁可留空。

当前可写口径：

- `AGS 碳纖導環：減輕前端重量，竿尖回彈與震動傳遞更直接`
- `Fuji/K 系防纏導環：出線穩定，PE 線拋投與控線更不易亂`

判断规则：

- `AGS` 是导环证据，可以来自子型号 SKU、子型号 Description、主商品 model 或主商品 Description。
- `Fuji / SiC / K型 / 導環 / 導珠` 是导环配置证据，但要确认不是无关上下文。
- `CGS` 是握把/感度系统，不等于导环布局，不能因为出现 `CGS` 就写导环特殊。
- `CWS` 是导环固定系统，可作为技术背景，但不单独等同于导环布局类型。
- `guide_layout_type` 只回答“导环布局/配置特殊在哪里”，不要写使用场景。

### 6.2 `guide_use_hint` 口径

这个字段给用户看的，不写内部标签。

禁止写：

- `versatile`
- `casting_distance`
- `specific_technique`
- `finesse`
- `special`
- `standard`

也不要大量使用模板口头禅，例如每句都写“重點是”。整列重复出现同一连接句，会显得像批量生成文案，用户读起来不自然。

当前写法应直接说明作用：

- `岸投遠投：PE 線出線更順、線弧更穩，長竿反覆拋投和迎風控線更穩定。`
- `Bass 泛用：出線順暢、兼容多種線徑，軟餌、硬餌、移動餌切換更自然。`
- `木蝦用：PE 線出線與抽竿後回線控制更穩，連續跳蝦、看線和補刺更清楚。`
- `鐵板/船釣：垂直控線與負荷更穩，抽停、下沉咬口感知和長時間搏魚更直接。`

判断规则：

- 使用场景判断优先看 `variant_usage_facts`，再看 `recommended_rig_pairing / 子型号 Description / SKU / player_environment / player_positioning`。
- 主商品 Description 可以参与导环配置识别，但不要直接参与使用场景判断；主描述里可能有跨系列技术举例，例如海鲈竿介绍中提到 `EMERALDAS STOIST RT CGS`，不能因此把海鲈竿误判成木虾。
- `guide_use_hint` 应回答“这个导环/控线倾向对实际使用有什么帮助”，不是复述竿子的定位字段。
- `guide_use_hint` 不能独立关键词命中后直接落表；它必须和 `recommended_rig_pairing` 同源，或通过一致性校验。
- 如果 `recommended_rig_pairing` 同时包含软饵钓组和硬饵/移动饵，`guide_use_hint` 要写“泛用 / 多用途 / 软硬饵切换”，不能写单一 `硬餌搜索` 或 `軟餌底操`。
- 修改后要检查是否残留内部标签和模板口头禅。

### 6.2.1 `variant_usage_facts` 与一致性闸门

从本阶段开始，`recommended_rig_pairing` 和 `guide_use_hint` 不再允许各自独立生成。

稳定流程：

1. 从官网子型号 Description、官方表格、已确认白名单证据和现有规格生成 `variant_usage_facts`。
2. `recommended_rig_pairing` 只从 `primary_rigs / secondary_rigs` 派生。
3. `guide_use_hint` 必须读取同一份 `variant_usage_facts` 和最终 `recommended_rig_pairing`。
4. 导出或提交前必须跑一致性 validator；有 `error` 时不能继续导出。

脚本：

- [extract_rod_variant_usage_facts.py](/Users/tommy/GearSage/scripts/extract_rod_variant_usage_facts.py)
- [validate_rod_usage_consistency.py](/Users/tommy/GearSage/scripts/validate_rod_usage_consistency.py)
- [run_rod_usage_quality_gate.py](/Users/tommy/GearSage/scripts/run_rod_usage_quality_gate.py)

运行：

```bash
python3 scripts/run_rod_usage_quality_gate.py \
  --xlsx GearSage-client/pkgGear/data_raw/daiwa_rod_import.xlsx \
  --facts GearSage-client/pkgGear/data_raw/daiwa_rod_variant_usage_facts.json \
  --report GearSage-client/pkgGear/data_raw/daiwa_rod_usage_consistency_report.json \
  --source-label daiwa_tw_rod_import
```

输出：

- `daiwa_rod_variant_usage_facts.json`：每个子型号的结构化事实，包括 `primary_rigs`、`secondary_rigs`、`guide_hint_family`、`line_control_need`、`confidence`。
- `daiwa_rod_usage_consistency_report.json`：一致性报告。`error` 是阻断项，`warning` 是人工 review 项。

复用到其他品牌时：

- `recommended_rig_pairing` 是增强字段，不是脚本运行前置条件。
- 如果其他品牌还没有该列，脚本会按空值生成 facts，并在 report 里写 `missing_recommended_rig_pairing_column` warning。
- 这时 quality gate 是诊断模式，只用于判断哪些系列需要先补官网子型号描述和推荐钓组。
- 当该品牌正式新增 `recommended_rig_pairing` 后，quality gate 才作为导出前阻断闸门使用。
- 三个通用脚本只读 `.xlsx`，只写 sidecar JSON/report，不保存或改写 Excel。

当时 Daiwa 运行结果（338 子型号阶段）：

- usage facts：`338`
- confidence：`high = 123`，`medium = 215`
- consistency report：`issue_count = 0`

validator 当前阻断规则：

- Description 写 `泛用 / 多用途 / 兼具 / 广泛 / 全能`，且 `recommended_rig_pairing` 同时含软硬饵，但 `guide_use_hint` 写成单一路线。
- `recommended_rig_pairing` 首位是软饵/钓组，`guide_use_hint` 却写成硬饵搜索。
- `recommended_rig_pairing` 首位是硬饵/移动饵，`guide_use_hint` 却写成软饵底操。
- 海水专项搭配写成 bass 软硬饵 hint。

validator 当前提醒规则：

- Description 明确列出某些技法，但 `recommended_rig_pairing` 因排序/上限未完全收录。
- `recommended_rig_pairing` 软硬饵混合，但 `guide_use_hint` 还没有把“混合/泛用”说清楚。
- 子型号 Description 缺失且没有推荐钓组时，只能低置信度处理。

本次修正过的词典边界：

- `刀片铅头钩 / 刀片式铅头钩` 应归 `Chatterbait`，不能泛化为 `Jighead`。
- `泳饵铅头钩 / 泳铅钩` 应归 `Swim Jig`。
- `橡胶铅头钩 / 软胶铅头钩 / 小型软胶铅头钩` 应归 `Rubber Jig / Small Rubber Jig`。
- `无铅头钩组` 应归 `No Sinker`，不能误判为 `Jighead`。
- `铁板釣法` 在 bass 语境中常指 jig 类底操，不应自动归海水 `Metal Jig`。

### 6.3 `recommended_rig_pairing` 新增字段口径

字段目的：

- 承接 rod 子型号细分时“适合使用什么钓组/饵型搭配”。
- 它补的是 `player_positioning` 和 `player_selling_points` 之间的结构化空缺。
- 它不是 `LURE WEIGHT`，也不是 `guide_use_hint`。

写法：

- 按“最擅长 -> 合适”的顺序排列，重点搭配放最前面。
- 使用 `/` 分隔多个钓组或饵型。
- 尽量写具体钓组/饵型，不写过泛的分类。

示例：

- `Neko Rig / Down Shot / No Sinker / Small Rubber Jig`
- `Crankbait / Shad / Minnow / Spinnerbait`
- `Frog / Punching / Heavy Texas`
- `Eging / Tip-run Eging / Sinker Rig`

来源优先级：

1. 官网子型号 Description、官方表格、官方技术页。
2. 官网查找并写入后，再用白名单辅助站做一次补充和校验：
   - `https://tackledb.uosoku.com/`
   - `https://rodsearch.com/`
   - `https://rods.jp/`
3. 白名单站只能补充或校验，不覆盖明确官网说明。

边界：

- 硬饵竿也要细分，例如胖子、米诺、鲥型饵、复合亮片、震动、铅笔等，不只写 `硬餌`。
- bass 强力竿要区分 `Frog / Punching / Heavy Texas / Swim Jig / Big Bait`，不要一律写 `重餌`。
- 木虾、铁板、岸投、船拋等专项竿也写具体搭配，例如 `Eging / Sinker Rig`、`SLJ / Metal Jig`、`Plug / Metal Jig`。
- 字段值里不写“官网确认”“白名单来源”等来源说明；证据链放 sidecar JSON 或流程记录。

stage15/stage16 Daiwa 落表结果（338 子型号阶段）：

- 新增列位置：`rod_detail.guide_use_hint` 后、`hook_keeper_included` 前。
- 覆盖：`338 / 338`。
- 本次只写 `recommended_rig_pairing`，旧列值校验为未变化。
- stage15 先使用本地官网子型号描述、系列/型号语义和已检查玩家定位做保守补全。
- stage16 再做白名单补充：针对过泛值和缺少子型号描述的系列，低频查询 `tackledb.uosoku.com`、`rods.jp`、`rodsearch.com`，只把可支撑的具体钓组/饵型补回 `recommended_rig_pairing`。
- 没有对 338 个子型号做三站全量爬取，避免对白名单站造成压力。
- 脚本：[apply_daiwa_tw_rod_recommended_rig_pairing_stage15.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_rod_recommended_rig_pairing_stage15.py)
- 白名单补充脚本：[apply_daiwa_tw_rod_recommended_rig_pairing_stage16.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_rod_recommended_rig_pairing_stage16.py)
- Description 驱动修复脚本：[apply_daiwa_tw_description_driven_rig_pairing_stage23.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_description_driven_rig_pairing_stage23.py)
- guide/pairing 冲突修复脚本：
  - [apply_daiwa_tw_guide_hint_conflict_stage20.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_guide_hint_conflict_stage20.py)
  - [apply_daiwa_tw_usage_quality_gate_fixes_stage21.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_usage_quality_gate_fixes_stage21.py)
  - [apply_daiwa_tw_mixed_pairing_guide_hints_stage22.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_mixed_pairing_guide_hints_stage22.py)
- 官方子型号页定点补描述：
  - [apply_daiwa_tw_dr1019_official_desc_stage26.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_dr1019_official_desc_stage26.py)
  - [apply_daiwa_tw_dr1019_stage27_fix_hint.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_dr1019_stage27_fix_hint.py)
  - [apply_daiwa_tw_dr1017_official_desc_stage28.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_dr1017_official_desc_stage28.py)
  - [apply_daiwa_tw_dr1017_stage29_fix_c69m_jighead.py](/Users/tommy/GearSage/scripts/apply_daiwa_tw_dr1017_stage29_fix_c69m_jighead.py)

官方子型号页补全经验：

- 如果日本 Daiwa 台湾语言页和本地主 ID 是包含关系，不能把整页套给全部子型号。
- 只匹配本地 SKU 能明确对应的子型号；页面有但本地不存在的子型号不新增。
- 页面能对应的子型号只更新 `Description / recommended_rig_pairing / guide_use_hint`。
- 例如 `DR1017` 的 STEEZ 页面只匹配 6 个本地子型号；`SC C68H-ST-SB` 和本地 `STEEZ SC C68H-SB` 规格对应，允许补描述，但不改 SKU。
- 例如 `DR1019` 的 BLACK LABEL 页面补全 22 个子型号 Description，并据此重写 guide/pairing。

stage15 来源分布：

- `official_text`：`124`
- `family_fallback`：`127`
- `player_fallback`：`87`

stage16 白名单补充重点：

- 将 `Light Rig`、`Light Rig / Small Hardbait` 细化为 `Jighead Rig / Down Shot / Neko Rig / No Sinker / Small Rubber Jig / I-shaped Plug / Small Hardbait` 等更可读的组合。
- 将 bass 默认模板 `Texas Rig / Crankbait / Spinnerbait / Down Shot` 按直柄/枪柄、power、action、lure weight 拆成精细轻饵、卷阻硬饵、底操软饵、强力泛用等更具体搭配。
- 将单独 `Metal Jig` 细化为 `Light Jigging / Slow Jigging / Offshore Jigging / Tachiuo Jigging / SLSJ` 等。
- 将单独 `Plug` 细化为 `Diving Pencil / Popper / Stickbait / Offshore Plug` 或岸投 `Heavy Plug / Sinking Pencil / Metal Jig / Surf Plug`。

stage15/stage16 质量检查：

- `General Lure` 残留：`0`
- `Light Rig` 残留：`0`
- `Texas Rig / Crankbait / Spinnerbait / Down Shot` 默认模板残留：`0`
- 单独 `Metal Jig / Plug / Eging / Big Bait` 残留：`0`
- `rod_detail` 分组底色：`338 / 338` 行保留。
- 当前最终覆盖率已在 `6.1 2026-05-06 玩家字段恢复与补全收口` 更新为 `658 / 658`。

### 6.4 `fit_style_tags` 导入中间层补充

规范来源：

- [装备库_fit_style_tags_枚举与填表规范_v1.md](/Users/tommy/GearSage/GearSage-client/docs/装备库_fit_style_tags_枚举与填表规范_v1.md)

字段目的：

- `fit_style_tags` 用于承接鱼竿的“使用方向 / 适用风格”筛选。
- 它是 GearSage 归纳字段，不是官方参数，也不是玩家实测字段。
- 本字段落在 `rod` 主表，用于主商品列表筛选和卡片轻量标签。
- 子型号差异只作为主表标签的推断依据，不在 `rod_detail` 中落字段。

允许值：

```text
bass
溪流
海鲈
根钓
岸投
船钓
旅行
```

填写格式：

```text
海鲈,岸投
```

导入链改动：

- `scripts/gear_export_schema.js`
  - 在 `HEADERS.rodMaster` 中新增 `fit_style_tags`。
  - 位置：`type_tips` 后、`images` 前。
  - `HEADERS.rodDetail` 不包含该字段。
- `scripts/to_excel_daiwa_rod.js`
  - 导出时优先读取中间层 `item.fit_style_tags`。
  - 如果中间层没有该字段，则根据子型号集合的 `model / SKU / variant_description / raw_specs` 推断后合并为主表标签。
- `scripts/apply_daiwa_rod_fit_style_tags_stage30.py`
  - 给中间 JSON 写入 item 级 `fit_style_tags`。
  - 清理中间 JSON 中误写的 variant 级 `fit_style_tags`。
  - 给当前 `daiwa_rod_import.xlsx` 的 `rod` 主表增加并填写 `fit_style_tags`。
  - 删除当前 `rod_detail` 中误加的 `fit_style_tags` 列。
  - 只允许新增/修改主表 `fit_style_tags` 和删除子表同名列，不改其他导入字段。

本次写入的中间层：

- `daiwa_rod_normalized.json`
  - `items = 58`
  - `variants = 534`
  - `item.fit_style_tags` 非空：`54`
  - `item.fit_style_tags` 含 `旅行`：`18`
  - `variant.fit_style_tags`：`0`
- `daiwa_tw_rod_structured.json`
  - `items = 46`
  - `variants = 324`
  - `item.fit_style_tags` 非空：`45`
  - `item.fit_style_tags` 含 `旅行`：`8`
  - `variant.fit_style_tags`：`0`

本次导入表写入结果：

- 当前工作区 `daiwa_rod_import.xlsx / rod`：`45` 行。
- `rod.fit_style_tags` 非空：`44 / 45`。
- `rod.fit_style_tags` 含 `旅行`：`9 / 45`。
- `rod_detail.fit_style_tags` 不存在。
- 非空值全部在规范枚举内。
- 旧 rod 枚举 `精细 / 泛用 / 障碍 / 远投` 已全部清空。
- `rod_detail` 底色已重新恢复。

空值处理：

- v1.1 已新增 `船钓`，`SALTIGA SLJ / LOWRESPONSE / OUTRAGE SJ/LJ/J / OUTRAGE BR / KYOHGA` 等船上垂直搜索、近海船抛或船钓铁板系列应写 `船钓`。
- v1.2 已新增 `旅行`，只作为多节/振出/旅行竿的附加标签，不改变原本玩法标签。
- 当前只保留 `DR1041 WIND X` 为空。原因是现有主表描述只有竿身结构、远投和操作性，没有明确目标鱼、岸投/船钓/溪流/海鲈/根钓/bass 证据；不为了填满而猜。

推断口径：

- Bass：
  - `STEEZ / TATULA / BLACK LABEL / HEARTLAND / AIREDGE / VERTICE / WILDERNESS / bass` -> `bass`
  - 不再用 `精细 / 泛用 / 障碍 / 远投` 描述 rod 主筛选；细分强弱、软硬饵和障碍信息留给 `guide_use_hint`、`recommended_rig_pairing`、玩家字段。
- 海鲈：
  - `morethan / LATEO / LABRAX / seabass / シーバス` -> `海鲈,岸投`
  - 不用裸 `stream` 判断溪流，避免 `main stream / mainstream` 把海鲈竿误标为 `溪流`。
- 根鱼：
  - `HARDROCK / rockfish / 根鱼 / 岩鱼` -> `根钓,岸投`
- 木虾：
  - `EMERALDAS / eging / 木蝦 / 乌贼 / 软丝` -> `岸投`
- 轻海水：
  - `月下美人 / ajing / mebaru / 小型 plug` -> `岸投`
  - `月下美人` 优先级高于描述中偶发的 `海鱸`，不能因为可兼顾海鲈就把系列主定位写成 `海鲈`。
- 岸投大范围搜索：
  - `OVERTHERE / DRAGGER / SLSJ / shore jig / surf / 港口 / 堤防 / 沙滩` -> `岸投`
- 船钓：
  - `SALTIGA / OUTRAGE / LOWRESPONSE / SLJ / slow jig / light jig / jigging / KYOHGA / boat casting / casting model / GT / 鮪 / 白带鱼` -> `船钓`
- 旅行：
  - 子型号 `PIECES / 継数` 在 `3-10` 节之间 -> 加 `旅行`。
  - `旅行` 是附加标签，不替代玩法标签，例如 `TATULA TRAVEL` -> `bass,旅行`，`CROSSBEAT SW` -> `岸投,旅行`。
  - 只用明确多节证据或 `TRAVEL / MOBILE / LIBERALIST / CROSSBEAT / WILDERNESS / 多节 / 振出` 兜底。
  - 不用泛泛的 `便携 / 携带` 触发，因为 2 节竿也可能这样描述。
  - OCR 串列导致的 `PIECES=68 / 96 / 97 / 99 / 205` 这类异常值必须过滤，不能误判为 `旅行`。
- 鳟鱼：
  - `IPRIMI / trout / 鳟 / 管理场 / 溪流 / 渓流` -> `溪流`
  - 如果同一主商品描述同时明确出现 `港口 / 沙滩 / 岸投` 等岸边场景，可以合并为 `溪流,岸投`，例如 `CROSSFIRE`。
  - 不用裸 `stream` 作为溪流判断；`main stream / mainstream` 这类英文会在海鲈描述中出现，容易把 `morethan / LATEO` 误标为 `溪流`。

复用到其他品牌时：

- 先读品牌中间层，不要直接在最终 xlsx 里手填。
- 优先在 item / 主商品级别写 `fit_style_tags`。
- 如需利用子型号差异，先在脚本内根据 variant 推断，再合并为 item 标签；不要把该字段落到 `rod_detail`。
- 导出脚本应优先读取中间层字段；缺失时才保守推断。
- 只使用规范枚举，不能为某品牌临时发明新值。
- 没有合适枚举时留空，不要为了填满而贴不相关标签。
- 每次保存 xlsx 后恢复 `rod_detail` 底色。
- 验证项：
  - 非空值是否全部在枚举内。
  - 是否还有旧值 `精细 / 泛用 / 障碍 / 远投` 残留。
  - `rod.fit_style_tags` 列位置是否稳定。
  - `rod_detail` 是否没有 `fit_style_tags`。
  - 是否只改了主表 `fit_style_tags` 和必要的表头位置。
  - `morethan / LATEO / LABRAX` 是否被误贴 `溪流`。
  - `月下美人` 是否被描述里的兼顾目标鱼误贴 `海鲈`。
  - 船钓铁板和 offshore casting 是否已使用 `船钓`，没有再留空或误贴岸投。
  - `旅行` 是否只来自 3 节以上的有效节数或明确旅行/振出语义，没有被 OCR 串列节数误触发。

---

## 7. 白名单辅助站的真实用途

白名单站：

- `https://tackledb.uosoku.com/`
- `https://rodsearch.com/`
- `https://rods.jp/`

本次结论：

### 7.1 tackledb.uosoku.com

最适合校验玩家字段。

可用信息：

- `カテゴリー`
- `対象魚`
- `釣り場`
- `ロッド`
- `ルアー`
- 部分真实或 AI 整理的使用场景

适合支撑：

- `player_environment`
- `player_positioning`
- `player_selling_points`
- `guide_use_hint`
- `recommended_rig_pairing`

例子：

- `OVER THERE 106M・K` 在 tackledb 显示为 `サーフゲーム`，目标鱼有 `ヒラメ / マゴチ / 青物`，支持岸投远投，不支持船钓铁板。
- `HARDROCK X 86M・K` 出现在 `ロックフィッシュゲーム`，支持岩鱼/rockfish。
- `DRAGGER X SLSJ 94M` 显示为 `ショアジギング`，支持岸投 SLSJ。
- `AIREDGE MOBILE 694HB-SB` 明确 big bait / swimbait 场景，支持 `大餌 / 強力`。
- `タトゥーラXT 641LFS` 出现 `ジグヘッド / ダウンショット / ネコリグ` 和小～中型硬饵信息，支持把 `Light Rig` 拆成更具体搭配。
- `スティーズ S66UL` 出现 `ジグヘッド / ワーム / I字系プラグ / トップウォーター`，支持轻量直柄竿的细分。
- `スティーズ SC C66ML-G`、`ブラックレーベル C66ML-LM` 出现 `クランクベイト / ワーム / チャター / ミノー / プロップベイト` 等信息，支持卷阻饵与软饵混合搭配判断。

### 7.2 rods.jp

适合规格和类别辅助校验，不适合直接写玩家文案。

可用信息：

- category，例如 `バスルアー`、`ソルトルアー（ショア）`
- type，例如 `ベイト`、`スピニング`
- action
- lure weight
- PE / line range
- price

适合支撑：

- 强弱判断
- 便携/节数确认
- bass / shore / offshore 大类确认
- `recommended_rig_pairing` 的规格边界校验，例如 lure weight、line range 是否支持某类饵型
- `guide_layout_type` 的少量校验，但覆盖不稳定

不适合：

- 直接填 `official_environment`
- 直接填 `sweet_spot_lure_weight_real`
- 直接填 `hook_keeper_included`

### 7.3 rodsearch.com

辅助价值较弱。

它能提供部分规格对比，但对玩家场景和具体钓组帮助不如 tackledb，对规格完整性不如官网或 rods.jp。适合作为第三参考，不作为主来源。

### 7.4 不应新增到导入表的白名单字段

当前导入表没有来源追踪列，不建议把白名单证据硬塞进导入表。

如果后续需要保留证据链，建议另建 sidecar JSON：

```json
{
  "detail_id": "DRD10287",
  "rod_id": "DR1045",
  "source_site": "tackledb.uosoku.com",
  "source_url": "https://...",
  "matched_category": "バス釣り",
  "target_fish": ["ブラックバス"],
  "confidence": "high",
  "supported_fields": ["player_environment", "player_positioning"]
}
```

---

## 8. 底色要求

脚本：

- [shade_daiwa_rod_detail_groups_stage12.py](/Users/tommy/GearSage/scripts/shade_daiwa_rod_detail_groups_stage12.py)
- [run_daiwa_rod_detail_group_shading.js](/Users/tommy/GearSage/scripts/run_daiwa_rod_detail_group_shading.js)

运行：

```bash
python3 scripts/shade_daiwa_rod_detail_groups_stage12.py
```

当前底色：

- `FFF8F3C8`
- `FFE8F1FB`

当前 `rod_detail` 行数与底色覆盖：

- `rod_detail`：`658`
- `FFF8F3C8 = 405`
- `FFE8F1FB = 253`

硬规则：

- 任何脚本只要保存了 `daiwa_rod_import.xlsx`，最后都要重新跑底色脚本。
- 底色是检查流程的一部分，不是装饰。
- 不允许因为新增流程导致底色丢失。

验证示例：

```bash
python3 - <<'PY'
from openpyxl import load_workbook
p = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_import.xlsx'
wb = load_workbook(p)
ws = wb['rod_detail']
for cell in ['A2','A20','A120','A200','A339']:
    c = ws[cell]
    print(cell, c.fill.fill_type, c.fill.fgColor.rgb)
PY
```

期望输出应包含：

```text
solid FFF8F3C8
solid FFE8F1FB
```

---

## 9. 最终验证清单

每次收尾至少检查：

```bash
python3 - <<'PY'
from openpyxl import load_workbook
p = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_rod_import.xlsx'
wb = load_workbook(p, data_only=True)
for s in ['rod', 'rod_detail']:
    ws = wb[s]
    h = [c.value for c in ws[1]]
    c = {x:i for i,x in enumerate(h)}
    print(s, ws.max_row - 1)
    fields = ['id','images','Description','player_positioning','player_selling_points'] if s == 'rod' else [
        'id','rod_id','SKU','Description','Market Reference Price','AdminCode',
        'guide_layout_type','guide_use_hint','recommended_rig_pairing','hook_keeper_included',
        'sweet_spot_lure_weight_real','official_environment',
        'player_environment','player_positioning','player_selling_points'
    ]
    for f in fields:
        if f in c:
            filled = sum(1 for row in ws.iter_rows(min_row=2, values_only=True) if str(row[c[f]] or '').strip())
            print(f, filled, '/', ws.max_row - 1)
PY
```

还要做异常组合扫描：

- bass 不应落到船钓、木虾、岩鱼、海鲈岸投。
- morethan / lateo 不应落到木虾或船钓。
- 月下美人不应落到船钓。
- eging / emeraldas 不应落到海鲈、淡水、船钓铁板。
- hardrock 不应落到船钓。
- overthere / dragger / SLSJ 不应落到船钓铁板。

最终导出前还必须跑 usage quality gate：

```bash
python3 scripts/run_rod_usage_quality_gate.py \
  --xlsx GearSage-client/pkgGear/data_raw/daiwa_rod_import.xlsx \
  --facts GearSage-client/pkgGear/data_raw/daiwa_rod_variant_usage_facts.json \
  --report GearSage-client/pkgGear/data_raw/daiwa_rod_usage_consistency_report.json \
  --source-label daiwa_tw_rod_import
```

要求：

- `severity_counts.error` 必须为 `0`。
- `warning` 可以进入人工 review，但不能静默忽略；如果 warning 指向高价值系列，应优先细化。
- 任何新的导出脚本在写 `guide_use_hint` 或 `recommended_rig_pairing` 后，都要重新跑该 gate。

---

## 10. 下次做其他品牌 rod 的 SOP

### Step 1：先确认来源结构

先判断官网规格是：

- HTML table
- 图片规格表
- PDF
- 混合结构

不要一开始就写通用 parser。rod 的规格表跨品牌差异很大。

### Step 2：先产 normalized，不直接写导入表

normalized 至少包含：

- source URL
- model name
- title / alias
- main image URL
- master Description
- variant descriptions
- raw spec blocks

### Step 3：规格解析必须保留 raw

OCR 或 HTML table 解析后，要保留：

- raw OCR lines
- raw row blocks
- normalized specs

这样后续发现串列时能定位来源，不用重新抓官网。

### Step 4：导入表生成只做一次基线

生成正式导入表后，如果用户开始检查，就进入定点修复模式。

不要再用生成脚本全量覆盖：

- 已人工修正的规格
- 已人工检查的 Description
- 已人工维护的子型号
- 已下载和规范化的 images
- 已补玩家字段

### Step 5：修复脚本只改目标字段

例如：

- 修 Description 只改 `Description`
- 修图片只改 `images`
- 修玩家字段只改玩家字段
- 修价格只改 `Market Reference Price`

不要为了一个字段重新写整行。

### Step 6：先生成 usage facts，再写玩家细分字段

rod 玩家字段不能再按字段各自独立生成。

标准顺序：

1. 官网/白名单/规格 -> `variant_usage_facts`
2. `variant_usage_facts.primary_rigs / secondary_rigs` -> `recommended_rig_pairing`
3. `variant_usage_facts.guide_hint_family / line_control_need` + `recommended_rig_pairing` -> `guide_use_hint`
4. `validate_rod_usage_consistency.py` 通过后才能导出

这样可以避免：

- Description 写细分技法，但 `recommended_rig_pairing` 没收进去。
- Description 和推荐钓组是泛用混合，`guide_use_hint` 却写成单一软饵或硬饵。
- 海水专项竿被写成 bass 软硬饵。
- 后续依赖人工逐行检查才发现冲突。

### Step 7：玩家字段最后做

玩家字段不是官网字段，最后做。

它的输入边界是：

- 官方 Description 和子型号 Description：只作为事实边界，防止玩家判断越界
- SKU / power / type
- `recommended_rig_pairing`
- 白名单站、玩家资料和长期使用语境

因此应该在规格、描述、推荐钓组基本稳定后再精修。

写入时要注意：

- `player_environment` 回答玩家实际会把这支子型号用在哪些场景。
- `player_positioning` 回答玩家视角的一句话定位。
- `player_selling_points` 回答真实使用中最有价值的特点。
- 不把官网卖点改写成玩家字段。
- 不在字段里写来源说明。

### Step 8：白名单站只做辅助证据

使用顺序：

1. 官网：官方规格和官方描述
2. tackledb：玩家场景、对象鱼、钓场、实际搭配
3. rods.jp：类别、type、lure weight、action、价格
4. rodsearch：第三参考

不要把白名单站内容写成官方字段。

### Step 9：每次保存 xlsx 后恢复底色

这是检查刚需，不是可选项。

---

## 11. 本次特别踩坑记录

### 11.1 Description 只抓标题

问题：

- 主表 `Description` 曾经只有标题，没有正文。

修复：

- `#intro` 正文要完整提取。
- 标题和正文用空行拼接。
- 遇到技术/规格区 marker 截断。

### 11.2 子型号 Description 缺失

问题：

- 多个主 ID 的子型号介绍在官网 table 里，首次没有抓全。

修复：

- 从 `#intro table` 解析 `型號 / 說明`。
- 用 SKU normalize alias 匹配，兼容 `・ / ･ / •`、空格、前缀。

### 11.3 OCR 串列

问题：

- 多个主 ID 出现列串列，尤其是 `Tip Diameter / LURE WEIGHT / PE Line Size / Action / PIECES`。

修复：

- 按家族做 parser dispatch。
- 对已检查表只做目标字段修复。
- 修完抽样看明显不合理组合。

### 11.4 power 特殊写法

问题：

- 一些 Emeraldas 型号存在 `MLM / MMH / LML`。
- 子 ID `DRD10103`、`DRD10099` 的 power 应为 `MMH`。

经验：

- power 不能只靠 `ML / MH / M / H / L` 简单正则。
- 复合 power 要保留原始表达。

### 11.5 bass 大饵误判

问题：

- `HFB / HRB / MH / H` 曾被误当成 `大餌 / 強力`。

最终口径：

- `-SB / Swimbait / Big Bait / 大型餌 / 大餌` 才是大饵强信号。
- `HFB / HRB / MH / H` 只是强度信号，默认不等于大饵。

### 11.6 岸投铁板误判为船钓铁板

问题：

- `OVERTHERE / DRAGGER SLSJ / HARDROCK` 描述里有“铁板”，曾被归为船钓铁板。

最终口径：

- 岸投/SLSJ/rockfish 优先级高于通用“铁板”规则。

### 11.7 官网自身文本错误

问题：

- `DRD10029` SKU 是 `644LFS`，但主页 Description 写 `664LFS`。

处理：

- 保留 SKU 和规格，不用错误 Description 覆盖 SKU。

### 11.8 导环字段写成内部标签

问题：

- `guide_layout_type` 曾写成 `special / standard`。
- `guide_use_hint` 曾写成 `versatile / casting_distance / specific_technique / finesse`。
- 这些值对用户不可读，无法解释“特殊在哪里、有什么作用”。

最终口径：

- `guide_layout_type` 写具体配置说明，例如 `AGS 碳纖導環：減輕前端重量，竿尖回彈與震動傳遞更直接`。
- `guide_use_hint` 写实际使用帮助，例如出线、线弧、控线、读底、抽竿回线、细线咬口判断。
- 没有明确导环证据时，`guide_layout_type` 可以留空，不为补满而硬写。

### 11.9 `guide_use_hint` 模板口头禅

问题：

- 早期修正后每条 `guide_use_hint` 都出现“重點是”，整列读起来像模板批量生成。

最终口径：

- 去掉固定口头禅，直接写结果和作用。
- 示例：`岸投遠投：PE 線出線更順、線弧更穩，長竿反覆拋投和迎風控線更穩定。`
- 示例：`Bass 泛用：出線順暢、兼容多種線徑，軟餌、硬餌、移動餌切換更自然。`

### 11.10 主描述跨系列技术文本误导

问题：

- 主商品 Description 可以包含跨系列技术说明。
- 例如海鲈竿描述中提到 `EMERALDAS STOIST RT CGS`，如果把主描述直接用于使用场景判断，会把海鲈竿误判为木虾。

最终口径：

- 主商品 Description 可以用于识别导环配置证据，例如 `AGS / Fuji / SiC`。
- 使用场景判断优先看子型号 Description、SKU、`player_environment`、`player_positioning`。
- `CGS` 是握把系统，不是导环布局；不能因为 `CGS` 写 `guide_layout_type = special`。

---

## 12. `product_technical` 子型号字段补充

执行口径：

- 字段位置：`daiwa_rod_import.xlsx / rod_detail`，放在 `Description` 后。
- 来源：只使用日本 Daiwa 官网台湾语言页面 `https://www.daiwa.com/tw/product/...`。
- 抓取位置：先读取子型号 `Description` 中的官方 `TECHNOLOGY：...` / `搭載技術：...`；没有子型号技术清单时，再读取页面 `DAIWA 技術` 模块中的技术标题。不从规格表、白名单站或玩家字段推断。
- 写值格式：多个技术名使用 ` / ` 分隔。
- 可空：官网台湾语言页面找不到对应商品页、页面没有技术模块，或技术项不能确认适用当前 SKU 时留空。
- 同步：`scripts/gear_export_schema.js` 的 `rodDetail` header 已加入该字段；最终表 `rod_detail.xlsx` 通过 detail 切片同步。
- 数据安全：脚本写入前后按“忽略 `product_technical` 后逐单元一致”校验，避免串列或影响其它字段。
- 子型号适用性：官网 `DAIWA 技術` 模块若写有 `僅限...型號`、`...除外`、`全旋轉式/全拋投式`、`2PCS品項` 等备注，必须按 SKU / TYPE / PIECES 拆分后写入，不能把整页技术合集套给所有子型号。
- 优先级：子型号描述里的技术清单高于页面级 `DAIWA 技術`。如果官网明确某 SKU 带有或不带有某项技术，必须按 SKU 写出差异；没有特殊标注时，才认为页面级技术默认适用同页全部 SKU。

本轮 Daiwa 结果：

- DR 子型号：658 个。
- 有官方技术模块可校验并写入非空：574 个。
- 子型号描述中存在明确 `TECHNOLOGY/搭載技術` 的 SKU：48 个，已按描述覆盖页面级合集。
- 当前按“子型号描述优先，其余页面级技术备注回落”复核后，中间表与最终表 mismatch 为 0。
- 典型修正：`DRD10056` 保留 `SVF COMPILE-X` 相关技术；`DRD10057`、`DRD10058` 不再继承 `SVF COMPILE-X`；`DRD10059` 的残缺技术名 `ZERO SEA` 规范为 `ZERO_SEAT`。

执行文件：

- 初次抓取脚本：`scripts/refresh_daiwa_rod_product_technical_stage44.py`
- SKU 适用性修正脚本：`scripts/fix_daiwa_rod_stage46_product_technical_detail_match.py`
- 修正报告：`GearSage-client/pkgGear/data_raw/daiwa_rod_product_technical_detail_match_stage46_report.json`
- 子型号描述技术覆盖脚本：`scripts/fix_daiwa_rod_stage47_product_technical_from_variant_description.py`
- 子型号描述覆盖报告：`GearSage-client/pkgGear/data_raw/daiwa_rod_product_technical_variant_desc_stage47_report.json`

---

## 13. 当前不应继续做的事

- 不应为了补满 `official_environment` 使用白名单站 category。
- 不应为了补满 `hook_keeper_included` 使用不稳定页面或 AI 文案。
- 不应为了补满 `sweet_spot_lure_weight_real` 从 lure weight 范围推一个甜区。
- 不应重新全量运行导入表生成脚本覆盖人工修复。
- 不应频繁访问官网或白名单站做批量抓取。

---

## 14. 推荐后续改进

如果后续还要做更多 rod 品牌，建议补一个通用的 evidence sidecar 机制，而不是往导入表加来源列。

建议文件形态：

```text
<brand>_rod_whitelist_evidence.json
```

每条记录包括：

- `brand`
- `rod_id`
- `detail_id`
- `model`
- `sku`
- `source_site`
- `source_url`
- `matched_text`
- `supported_fields`
- `confidence`
- `notes`

这样既能保留白名单证据，又不污染正式导入表。
