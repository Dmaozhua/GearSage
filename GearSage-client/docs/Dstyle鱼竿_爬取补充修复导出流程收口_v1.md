# Dstyle 鱼竿 爬取补充修复导出流程收口 v1

版本：v1  
状态：Dstyle rods 阶段性收口  
更新时间：2026-04-29  

---

## 1. 当前范围

来源站点：

- Dstyle 官方产品页  
  `https://dstyle-lure.co.jp/products/`

品牌：

- `brand_id = 114`
- `DSTYLE`

当前正式导入表：

- [dstyle_rod_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_import.xlsx)

当前主要中间层：

- [dstyle_rod_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_normalized.json)
- [dstyle_rod_whitelist_evidence.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_whitelist_evidence.json)
- [dstyle_rods_cache](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rods_cache)

当前脚本：

- [build_dstyle_rod_import.py](/Users/tommy/GearSage/scripts/build_dstyle_rod_import.py)
- [apply_dstyle_rod_recommended_rig_pairing_stage1.py](/Users/tommy/GearSage/scripts/apply_dstyle_rod_recommended_rig_pairing_stage1.py)
- [refine_dstyle_rod_usage_fields_stage2.py](/Users/tommy/GearSage/scripts/refine_dstyle_rod_usage_fields_stage2.py)
- [refine_dstyle_rod_player_fields_stage3.py](/Users/tommy/GearSage/scripts/refine_dstyle_rod_player_fields_stage3.py)
- [apply_dstyle_rod_fit_style_tags_stage4.py](/Users/tommy/GearSage/scripts/apply_dstyle_rod_fit_style_tags_stage4.py)
- [shade_dstyle_rod_detail_groups.py](/Users/tommy/GearSage/scripts/shade_dstyle_rod_detail_groups.py)

当前结果：

- 主商品：`6`
- 子型号：`53`
- `rod.images`：`6 / 6`
- `rod.fit_style_tags`：`6 / 6`
- `rod.Description`：`6 / 6`
- `rod_detail.SKU`：`53 / 53`
- `rod_detail.TYPE`：`53 / 53`
- `rod_detail.POWER`：`53 / 53`
- `rod_detail.TOTAL LENGTH`：`53 / 53`
- `rod_detail.Action`：`53 / 53`
- `rod_detail.LURE WEIGHT (oz)`：`53 / 53`
- `rod_detail.Market Reference Price`：`53 / 53`
- `rod_detail.Description`：`53 / 53`
- `rod_detail.player_environment`：`53 / 53`
- `rod_detail.player_positioning`：`53 / 53`
- `rod_detail.player_selling_points`：`53 / 53`
- `rod_detail.guide_use_hint`：`53 / 53`
- `rod_detail.recommended_rig_pairing`：`53 / 53`
- `rod_detail.AdminCode`：`51 / 53`
- `rod_detail.WEIGHT`：`51 / 53`
- `rod_detail.Line Wt N F`：`51 / 53`
- `rod_detail.PE Line Size`：`15 / 53`
- `rod_detail.guide_layout_type`：`18 / 53`

当前合理空值：

- `DSRD10000 / DSRD10001 AdminCode` 为空。  
  `DEHIGHRO GRANDEE Spec` 官网规格表没有 JAN，不硬填。
- `DSRD10007 / DSRD10008 WEIGHT` 为空。  
  官网对应重量格只有 `g`，没有数值，不写脏值。
- `official_environment`、`hook_keeper_included`、`sweet_spot_lure_weight_real` 不写。  
  白名单站只作为玩家字段辅助，不污染 official 字段。

---

## 2. 本次流程结论

Dstyle 官网 rod 数据分三类结构：

1. HTML 表格规格  
   `DEHIGHRO GRANDEE Spec`、`DEHIGHRO`、`BLUE TREK`
2. 图片规格表  
   `BLUE TREK SABER SERIES`、`BLUE TREK 2ピースモデル`、`BLUE TREK 10th Anniversary Model`
3. 页面正文型号说明  
   多数型号的使用说明在标题后的正文块中，不是独立详情页。

这次最终流程：

1. 抓官方 products 页，定位 ROD 分类下 6 个产品页。
2. 缓存列表页和详情页 HTML。
3. 解析 HTML 表格规格。
4. 下载并人工/OCR 对照图片规格表。
5. 将图片表规格固化为 `SPEC_IMAGE_PATCHES`。
6. 下载每个主商品 1 张 main 图到本地。
7. `images` 写未来静态资源 URL，不写本地路径。
8. 接入 tackledb 白名单证据，补强少量高置信玩家字段。
9. 生成导入表并恢复 `rod_detail` 分组底色。
10. 分阶段写入 `recommended_rig_pairing`。
11. 按子型号描述复核并精修 `guide_use_hint` 和 `recommended_rig_pairing`。
12. 按玩家视角精修 `player_environment / player_positioning / player_selling_points`。
13. 在中间层主表和导入主表新增 `fit_style_tags`。
14. 做字段覆盖、重复 SKU、串行/串列、图片、底色和用法一致性验证。

---

## 3. 核心脚本链路

主脚本：

```bash
python3 scripts/build_dstyle_rod_import.py
```

作用：

- 抓取/复用缓存：
  - `dstyle_rods_cache/products.html`
  - `dstyle_rods_cache/details/*.html`
- 生成：
  - `dstyle_rod_normalized.json`
  - `dstyle_rod_whitelist_evidence.json`
  - `dstyle_rod_import.xlsx`
- 下载主图：
  - `/Users/tommy/Pictures/images/dstyle_rods`
- 写入 `rod.images`：
  - `https://static.gearsage.club/gearsage/Gearimg/images/dstyle_rods/<filename>`

底色脚本：

```bash
python3 scripts/shade_dstyle_rod_detail_groups.py
```

硬规则：

- 任何脚本保存 `dstyle_rod_import.xlsx` 后，都要重新跑底色脚本。
- 底色是检查流程的一部分，不是装饰。

recommended rig pairing 阶段脚本：

```bash
python3 scripts/apply_dstyle_rod_recommended_rig_pairing_stage1.py
python3 scripts/refine_dstyle_rod_usage_fields_stage2.py
python3 scripts/shade_dstyle_rod_detail_groups.py
```

作用：

- 在 `rod_detail.guide_use_hint` 后新增/确认 `recommended_rig_pairing`。
- 只按本地已有 SKU 精确写入，不新增不确定子型号。
- stage2 会按子型号 `Description` 精修 `guide_use_hint` 与 `recommended_rig_pairing`，避免模板化提示。
- 写入后生成：
  - [dstyle_rod_recommended_rig_pairing_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_recommended_rig_pairing_report.json)
  - [dstyle_rod_usage_fields_stage2_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_usage_fields_stage2_report.json)

fit style tags 阶段脚本：

```bash
python3 scripts/apply_dstyle_rod_fit_style_tags_stage4.py
```

作用：

- 给 `dstyle_rod_normalized.json` 写入 item 级 `fit_style_tags`。
- 清理 variant 级误写的 `fit_style_tags`。
- 给当前 `dstyle_rod_import.xlsx / rod` 主表增加并填写 `fit_style_tags`。
- 确认 `rod_detail` 不包含 `fit_style_tags`。
- 写入后恢复 `rod_detail` 底色。
- 写入后生成：
  - [dstyle_rod_fit_style_tags_stage4_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_fit_style_tags_stage4_report.json)

---

## 4. 图片规格表处理

缓存目录：

- [spec_images](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rods_cache/spec_images)
- [spec_ocr](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rods_cache/spec_ocr)

已处理图片表：

- `DSR1002_saber_specs.png`
- `DSR1003_blue_trek_2_specs.png`
- `DSR1003_blue_trek_2_specs_old.jpg`
- `DSR1004_10th_specs.png`

关键修复：

- `DSR1002` 的页面正文顺序和规格图顺序不一致。最终按规格图官方顺序：
  1. `DBTS-SS-63ML / Lightning`
  2. `DBTS-SS-68L / BM1`
  3. `DBTC-SS-64MH / Dagger`
  4. `DBTC-SS-69MH+ / Saber versatile SP`
- `DSR1002` 页面标题部分省略 `SS`，最终按规格图正式 SKU 修正：
  - `DBTS-68L` -> `DBTS-SS-68L`
  - `DBTC-64MH` -> `DBTC-SS-64MH`
- `DSR1003` 有新旧两张规格图：
  - 旧图覆盖 `DBTS-612UL+-S / DBTS-662L / DBTS-662M / DBTS-6102ML-S / DBTC-6102M / DBTC-6102MH / DBTC-702H`
  - 新图覆盖 `DBTS-642UL+-MIDSP / DBTS-632UL/L-S / DBTC-662ML-BF / DBTC-672MH-S / DBTC-6102XH`
- `DSR1004` 图片规格表覆盖 2 款 10th Anniversary 型号。

---

## 5. 主图规则

本地图片目录：

- `/Users/tommy/Pictures/images/dstyle_rods`

旧图复用目录：

- `/Users/tommy/Pictures/images_old_copy/dstyle_rods`

导入表 `images` 最终格式：

```text
https://static.gearsage.club/gearsage/Gearimg/images/dstyle_rods/<filename>
```

命名规则：

```text
<rod_id>_<model_slug>.<ext>
```

当前本地结果：

- `DSR1000_DEHIGHRO_GRANDEE_Spec.png`
- `DSR1001_DEHIGHRO.jpg`
- `DSR1002_BLUE_TREK_SABER_SERIES.png`
- `DSR1003_BLUE_TREK_2_Piece.png`
- `DSR1004_BLUE_TREK_10th_Anniversary_Model.png`
- `DSR1005_BLUE_TREK.jpg`

经验：

- 一个主商品只保留一张主图。
- 脚本会清理同一 `rod_id` 的旧候选图，避免目录中残留多张主图。
- 排除明显题图、规格图、技术小图、占位图、站点 icon。

---

## 6. 玩家字段和白名单证据

白名单站本次有效来源：

- `https://tackledb.uosoku.com/`

本次没有稳定采用：

- `rods.jp`
- `rodsearch.com`

原因：

- 这两个站点本轮没有稳定命中 Dstyle rod，或有效信息不足以回写字段。

已写入 evidence sidecar：

- [dstyle_rod_whitelist_evidence.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_whitelist_evidence.json)

当前高价值证据覆盖：

- `DBTS-61L`：ネコリグ / 精细轻量
- `DBTS-66ML-S-MIDSP`：ミドスト / 中层游动
- `DBTS-610L-S`：ライトリグ、表层系プラグ / 精细远投
- `DBTC-68M`：硬饵泛用
- `DBTC-610MH`：ブレーデッドジグ / 巻物硬饵
- `DBTC-71MH-PF`：Frog / Cover 强障碍

字段原则：

- 白名单证据只回写：
  - `player_environment`
  - `player_positioning`
  - `player_selling_points`
  - `guide_use_hint`
- 不写：
  - `official_environment`
  - `hook_keeper_included`
  - `sweet_spot_lure_weight_real`

---

## 7. recommended_rig_pairing 收口

字段位置：

- `rod_detail.guide_use_hint`
- `rod_detail.recommended_rig_pairing`
- `rod_detail.hook_keeper_included`

当前覆盖：

- `53 / 53`

来源结构：

- `official_description`：`29`
- `official_short_description`：`16`
- `official_spec_image`：`2`
- `official_plus_whitelist`：`6`

白名单参与校验/补强的精确 SKU：

- `DBTS-61L`：`Neko Rig / Down Shot / No Sinker / Small Rubber Jig / Small Plug`
- `DBTS-66ML-S-MIDSP`：`Mid Strolling Jighead / No Sinker / Hover Strolling / Small Plug`
- `DBTS-610L-S`：`Long Cast Neko Rig / I-shaped Plug / Surface Plug / Small Rubber Jig`
- `DBTC-68M`：`Crankbait / Shad / Jerkbait / Spinnerbait / Chatterbait / Texas Rig`
- `DBTC-610MH`：`Chatterbait / Spinnerbait / Texas Rig / Rubber Jig / Crankbait`
- `DBTC-71MH-PF`：`Bait Power Finesse / Small Rubber Jig / Bait Neko / Frog / Heavy Down Shot / Free Rig / Texas Rig / Football Jig`

写入原则：

- 顺序按“最擅长 -> 合适”排列。
- 不使用固定枚举，按官网和白名单出现的饵型/钓组扩展词汇。
- 不写 `General Lure`、`Light Rig`、`Hardbait`、`Soft Bait` 这类过泛分类。
- `DBTC-610MH` 白名单的 `ブレーデッドジグ` 归入 `Chatterbait`。
- `DBTC-73H`、`DBTC-6102XH` 只有在官方描述支持大型饵时才写 `Big Bait / Swimbait`。
- 白名单只用于补充/校验，不覆盖明确官网信息。
- `guide_use_hint` 不使用“强力场景 / 泛用 / 精细”一类模板句；当描述明确钓组时，必须点名主轴钓组和切换逻辑。
- `DBTC-71MH-PF` 官方主轴是 bait power finesse，白名单 Frog 只能作为 cover 补强，不能覆盖官方主轴。

一致性检查：

```bash
python3 scripts/validate_rod_usage_consistency.py \
  --xlsx GearSage-client/pkgGear/data_raw/dstyle_rod_import.xlsx \
  --report GearSage-client/pkgGear/data_raw/dstyle_rod_usage_consistency_report.json \
  --fail-on-error
```

当前结果：

- `issue_count = 0`
- 无 `Description / recommended_rig_pairing / guide_use_hint` 冲突。
- 过泛残留：`0`
- 日文描述关键词承接专项检查：`missing_count = 0`
- stage2 修改：`guide_use_hint 53 / 53`，`recommended_rig_pairing 25 / 53`

---

## 8. 玩家字段 stage3 收口

脚本：

```bash
python3 scripts/refine_dstyle_rod_player_fields_stage3.py
python3 scripts/shade_dstyle_rod_detail_groups.py
```

报告：

- [dstyle_rod_player_fields_stage3_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_player_fields_stage3_report.json)

本阶段只修改：

- `player_environment`
- `player_positioning`
- `player_selling_points`

不修改：

- 官网字段
- 规格字段
- `Description`
- `recommended_rig_pairing`
- `guide_use_hint`

来源结构：

- `recommended_pairing_plus_description`：`47`
- `official_plus_whitelist`：`6`

当前结果：

- `player_environment`：`53 / 53`，`unique = 53`
- `player_positioning`：`53 / 53`，`unique = 53`
- `player_selling_points`：`53 / 53`，`unique = 53`
- 最大重复次数：`1`
- 来源说明残留：`0`
- Bass / 海水异常组合：`0`
- 玩家字段与 `recommended_rig_pairing` 明显冲突：`0`
- `Description / recommended_rig_pairing / guide_use_hint` 一致性：`issue_count = 0`

执行口径：

- 玩家字段不写“官网确认 / 白名单显示 / tackledb”等来源说明。
- `player_environment` 写实际作钓环境，例如岸钓远投、cover、开阔水、野池、湖库、硬物边。
- `player_positioning` 写玩家视角的一句话定位，不搬官网标题。
- `player_selling_points` 写真实使用价值，例如控线、落点、读底、短咬承接、软硬饵切换、cover 控鱼。
- mixed route 的型号必须体现软硬饵切换逻辑，不能写成单一路线。
- `MH / H` 不自动写 Big Bait，只有 `recommended_rig_pairing` 或 Description 支撑时才写。

---

## 9. fit_style_tags stage4 收口

规范来源：

- [装备库_fit_style_tags_枚举与填表规范_v1.md](/Users/tommy/GearSage/GearSage-client/docs/装备库_fit_style_tags_枚举与填表规范_v1.md)

脚本：

```bash
python3 scripts/apply_dstyle_rod_fit_style_tags_stage4.py
```

报告：

- [dstyle_rod_fit_style_tags_stage4_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_fit_style_tags_stage4_report.json)

字段位置：

- `rod.type_tips`
- `rod.fit_style_tags`
- `rod.images`

当前结果：

- `dstyle_rod_normalized.json item.fit_style_tags`：`6 / 6`
- `dstyle_rod_normalized.json variant.fit_style_tags`：`0`
- `dstyle_rod_import.xlsx / rod.fit_style_tags`：`6 / 6`
- `dstyle_rod_import.xlsx / rod_detail.fit_style_tags`：不存在
- 非空值：全部为 `bass`
- 非空值全部在规范枚举内。
- v1.2 新增枚举 `旅行` 已纳入脚本允许值。
- 旧值 `精细 / 泛用 / 障碍 / 远投` 残留：`0`
- `rod_detail` 底色已恢复。

判断口径：

- Dstyle 当前 6 个主商品均为淡水 Bass rod，因此主表基础标签统一写 `bass`。
- `旅行` 仅用于 2 节以上且不包含 2 节的多节鱼竿；`BLUE TREK 2 Piece` 是 2 节便携，不写 `旅行`。
- 细分精细、泛用、障碍、远投、中层游动、大饵等信息留在 `recommended_rig_pairing`、`guide_use_hint` 和玩家字段中，不写入 `fit_style_tags`。
- `fit_style_tags` 只落 item / rod 主表，不落 `rod_detail`。

---

## 10. 当前最终验证命令

字段覆盖：

```bash
python3 - <<'PY'
from openpyxl import load_workbook
p = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_import.xlsx'
wb = load_workbook(p, data_only=True)
for s in ['rod', 'rod_detail']:
    ws = wb[s]
    h = [c.value for c in ws[1]]
    idx = {x:i for i,x in enumerate(h)}
    print(s, ws.max_row - 1)
    fields = ['id','brand_id','model','fit_style_tags','images','Description','player_positioning','player_selling_points'] if s == 'rod' else [
        'id','rod_id','SKU','TYPE','POWER','TOTAL LENGTH','Action','WEIGHT',
        'LURE WEIGHT (oz)','Line Wt N F','PE Line Size','Market Reference Price',
        'AdminCode','guide_layout_type','guide_use_hint','recommended_rig_pairing','player_environment',
        'player_positioning','player_selling_points','Description'
    ]
    for f in fields:
        filled = sum(1 for row in ws.iter_rows(min_row=2, values_only=True) if str(row[idx[f]] or '').strip())
        print(f, filled, '/', ws.max_row - 1)
PY
```

底色检查：

```bash
python3 - <<'PY'
from openpyxl import load_workbook
p = '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/dstyle_rod_import.xlsx'
wb = load_workbook(p)
ws = wb['rod_detail']
for cell in ['A2','A4','A20','A34','A54']:
    c = ws[cell]
    print(cell, c.fill.fill_type, c.fill.fgColor.rgb)
PY
```

脚本检查：

```bash
python3 -m py_compile scripts/build_dstyle_rod_import.py scripts/apply_dstyle_rod_recommended_rig_pairing_stage1.py scripts/refine_dstyle_rod_usage_fields_stage2.py scripts/refine_dstyle_rod_player_fields_stage3.py scripts/apply_dstyle_rod_fit_style_tags_stage4.py scripts/shade_dstyle_rod_detail_groups.py scripts/validate_rod_usage_consistency.py
```

---

## 11. 当前不应继续做的事

- 不应把 tackledb / rods.jp / rodsearch 信息写成 official 字段。
- 不应为补满 `AdminCode` 给 `DEHIGHRO GRANDEE Spec` 猜 JAN。
- 不应把只有 `g` 单位但没有数值的重量格写入 `WEIGHT`。
- 不应重新全量下载主图后保留多张候选图。
- 不应再把图片规格表当作“官网无规格”处理。
- 不应把一个型号页的 `recommended_rig_pairing` 套给同页所有子型号。
- 不应因为 `MH / H` power 自动写 `Big Bait`。
- 不应把 `fit_style_tags` 写到 `rod_detail`。
- 不应为 rod `fit_style_tags` 临时发明 `精细 / 泛用 / 障碍 / 远投` 等旧值。

---

## 12. 后续如需继续增强

可以考虑：

1. 给图片规格表补一个独立 parser / evidence sidecar，而不是只固化 patch。
2. 对 `guide_layout_type` 继续做 tackledb/官网技术描述补证，但没有证据时继续留空。
3. 如果后续上传静态资源，确认 `/Users/tommy/Pictures/images/dstyle_rods` 与 `rod.images` 文件名完全对应。
