# Evergreen 鱼竿 字段补充修复流程记录 v1

版本：v1  
状态：Evergreen rod 本轮字段补充收口  
更新时间：2026-04-25

---

## 1. 当前范围

来源站点：

- Evergreen freshwater rod 入口  
  `https://www.evergreen-fishing.com/freshwater/`
- Evergreen saltwater rod 入口  
  `https://www.evergreen-fishing.com/saltwater/`
- Evergreen trout rod 入口  
  `https://www.evergreen-fishing.com/trout/`

当前正式导入表：

- [evergreen_rod_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_import.xlsx)

当前主要中间层：

- [evergreen_rod_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_normalized.json)
- [evergreen_rod_field_completion_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_field_completion_report.json)
- [evergreen_rod_whitelist_player_evidence.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_whitelist_player_evidence.json)
- [evergreen_rod_whitelist_player_backfill_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_whitelist_player_backfill_report.json)
- [evergreen_rod_line_wt_cleanup_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_line_wt_cleanup_report.json)
- [evergreen_rod_discontinued_notice_cleanup_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_discontinued_notice_cleanup_report.json)
- [evergreen_rod_recommended_rig_pairing_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_recommended_rig_pairing_report.json)
- [evergreen_rod_rig_pairing_guide_consistency_fix_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_rig_pairing_guide_consistency_fix_report.json)
- [evergreen_rod_usage_fields_stage9_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_usage_fields_stage9_report.json)

当前结果：

- 主商品：`292`
- 子型号：`292`
- `rod.images`：`292 / 292`
- `rod.Description`：`292 / 292`
- `rod.main_selling_points`：`292 / 292`
- `rod.Description / main_selling_points` 停产提示残留：`0`
- `rod.player_positioning`：`292 / 292`
- `rod.player_selling_points`：`292 / 292`
- `rod_detail.SKU`：`292 / 292`
- `rod_detail.TOTAL LENGTH`：`292 / 292`
- `rod_detail.PIECES`：`292 / 292`
- `rod_detail.CLOSELENGTH`：`292 / 292`
- `rod_detail.LURE WEIGHT`：`292 / 292`
- `rod_detail.Code Name`：`292 / 292`
- `rod_detail.CONTENT CARBON`：`290 / 292`
- `rod_detail.Market Reference Price`：`292 / 292`
- `rod_detail.player_environment`：`292 / 292`
- `rod_detail.player_positioning`：`292 / 292`
- `rod_detail.player_selling_points`：`292 / 292`
- `rod_detail.Description` 停产提示残留：`0`
- `rod_detail.guide_use_hint`：`292 / 292`
- `rod_detail.recommended_rig_pairing`：`292 / 292`
- `rod_detail.guide_use_hint` 旧模板原句残留：`0`
- `rod_detail.guide_layout_type`：`28 / 292`

当前主图结果：

- 本地图片目录：`/Users/tommy/Pictures/images/evergreen_rods`
- 旧图复用目录：`/Users/tommy/Pictures/images_old_copy/evergreen_rods`
- 本轮本地图片：`292`
- `images` URL 前缀：`https://static.gearsage.club/gearsage/Gearimg/images/evergreen_rods/`
- 图片处理报告：
  - 本地已存在：`292`
  - 从旧图目录复用：`0`
  - 重新下载：`0`
  - 未解决：`0`
- 清理未引用旧图：`32` 个，已移到 `/Users/tommy/Pictures/images/evergreen_rods_unreferenced_backup_20260425`

当前合理空值：

- `official_environment = 0 / 292`  
  Evergreen 页面没有稳定的官方环境字段，本轮不把 GearSage 归纳场景写入 official。
- `hook_keeper_included = 0 / 292`  
  官网没有稳定覆盖，不硬填。
- `sweet_spot_lure_weight_real = 0 / 292`  
  官网规格范围不等于玩家真实甜区，不把推断写成实测。
- `CONTENT CARBON = 290 / 292`  
  两支 Aurora 特设页只给碳布比例说明，没有普通规格表里的 `使用材料` 字段，不把描述里的碳布比例硬写成 JIS 含碳率。
- `Code Name = 292 / 292`  
  Evergreen 型号昵称写完整英文名，保留 `RS / GT / GT-R / GT2RS / GT3RS / GT-X / RSR / HD / LTS` 等能区分子商品的版本后缀。官网型号名本身只有 SKU 编号的行，用 SKU 兜底写入，避免空值和不可区分。

---

## 2. 本次流程结论

本轮不是重新跑旧脚本，而是按 Daiwa 鱼竿收口经验把 Evergreen rod 做了一次补全修复：

1. 从 freshwater / saltwater / trout 三个入口分段 discovery。
2. 从 20 个 rod 系列规格页解析官方规格表。
3. 低并发抓 292 个详情页，补主图、Description、详情页规格。
4. 用官网规格表补 `CLOSELENGTH`、`CONTENT CARBON`、`PE Line Size`、`LURE WEIGHT (oz)` 等旧表缺口。
5. 修正旧表中被 `/`、`+`、`＜...＞` 或空格截断的 SKU。
6. 原旧表 289 条，本轮官网 discovery 为 292 条，补齐 `TKSS-63LXST<S-1>`，并额外纳入 `IRSC-66M-Aurora`、`IRSC-71MH-Aurora` 两个特设页型号。
7. 按当前 `gear_export_schema.js` 升级 `rod` / `rod_detail` 表头。
8. 补玩家字段和导环使用提示。
9. 补 `Code Name` 英文完整昵称，保留 `RS / GT / GT-R / GT2RS / GT3RS / GT-X / RSR / HD / LTS` 等能区分子商品的版本后缀。
10. 主图统一落到本地 `evergreen_rods` 目录，并把 `images` 写成未来资源存储 URL。
11. 清理 `Line Wt N F` 中从 `ERD10224` 开始出现的首尾 `/` / `／`。
12. 清理 Evergreen 详情页状态文本 `※ 当製品の生産は終了いたしました。`，不写入用户展示字段。
13. 新增并填写 `rod_detail.recommended_rig_pairing`，承接当前子型号适合的钓组/饵型。
14. 保存 xlsx 后恢复 `rod_detail` 分组底色。

关键原则：

- 不再用旧 `to_excel_evergreen_rod.js` 直接覆盖当前 Excel。
- `evergreen_rod_normalized.json` 已更新为 292 条，旧 126 条 normalized 不再作为基准。
- `official_environment`、`hook_keeper_included`、`sweet_spot_lure_weight_real` 继续留空。
- `※ 当製品の生産は終了いたしました。` 和 `当ロッドの後継機種・...はコチラ→` 属于页面状态/跳转提示，不写入展示字段。

---

## 3. 核心脚本链路

### 3.1 官方分段抓取和导入表补全

脚本：

- [build_evergreen_rod_import_stage1.js](/Users/tommy/GearSage/scripts/build_evergreen_rod_import_stage1.js)

作用：

- 从三个入口发现 rod 系列页。
- 从系列页解析规格表。
- 低并发抓详情页。
- 写入：
  - `evergreen_rod_normalized.json`
  - `evergreen_rod_import.xlsx`
  - `evergreen_rod_field_completion_report.json`

运行：

```bash
node scripts/build_evergreen_rod_import_stage1.js
```

注意：

- 这是会访问 Evergreen 官网的脚本。
- 脚本按 4 并发抓详情页，避免一次性高压抓取。
- 如果用户已经人工检查过 Excel，后续优先写定点修复脚本，不要随便重跑全量导入。

主图规则：

- 一个主商品只对应一张主图。
- 优先使用 Evergreen 官网 `/images_set02/goods_images/goods_detail/...` 商品图。
- 官网详情页无商品图时，回退系列列表页商品缩略图。
- 只有官网商品图和列表缩略图都缺失时，才检查本地旧图目录。
- 有官网图 URL 时会覆盖本地同名旧图，避免旧横幅或部件图误作主图。
- 导入表 `images` 只写未来资源存储 URL，不写本地路径。

最终 URL 格式：

```text
https://static.gearsage.club/gearsage/Gearimg/images/evergreen_rods/<filename>
```

### 3.2 底色恢复

脚本：

- [shade_evergreen_rod_detail_groups_stage2.py](/Users/tommy/GearSage/scripts/shade_evergreen_rod_detail_groups_stage2.py)

运行：

```bash
python3 scripts/shade_evergreen_rod_detail_groups_stage2.py
```

当前底色：

- `FFF8F3C8`
- `FFE8F1FB`

硬规则：

- 任何脚本只要保存了 `evergreen_rod_import.xlsx`，最后都要重新跑底色脚本。

---

## 4. 本次关键修复点

### 4.1 补齐旧表缺失商品

官网 discovery 为 `292` 条，旧导入表为 `289` 条。

本轮补齐：

- `TKSS-63LXST<S-1> マーシャルイーグル`
- `IRSC-66M-Aurora コブラRS オーロラ エディション`
- `IRSC-71MH-Aurora スーパースタリオンRS オーロラ エディション`

### 4.2 修正 SKU 截断

旧表存在多类截断：

- `PSLJ` 应区分为 `PSLJ603-1`、`PSLJ603-1.5` 等。
- `PHPJ` 应区分为 `PHPJ410`、`PHPJ501` 等。
- `PSPJ` 应区分为 `PSPJ500`、`PSPJ502` 等。
- `IRSC-66MR-ST＜SPG＞`、`SPRC-66L/M-S＜BOAT＞` 等不应丢失后缀。
- 全角英数字和全角 `＋` 已规整为 ASCII。

验证结果：

- `rod_detail.id` 唯一：`292 / 292`
- `rod_detail.SKU` 唯一：`292 / 292`
- 全角 SKU：`0`

### 4.3 补规格字段

从系列规格表补入：

- `CLOSELENGTH`
- `CONTENT CARBON`
- `PE Line Size`
- `LURE WEIGHT (oz)`

说明：

- `CONTENT CARBON` 从 `使用材料` 中提取碳纤维百分比。
- `PE Line Size` 从 `適合ライン` 中拆出 PE 号数，原尼龙/氟碳范围保留在 `Line Wt N F`。
- `LURE WEIGHT (oz)` 只在官网括号中明确给 oz 时填写。

### 4.4 玩家字段

本轮写入：

主表：

- `player_positioning`
- `player_selling_points`

子表：

- `player_environment`
- `player_positioning`
- `player_selling_points`
- `guide_use_hint`
- `guide_layout_type`

判断依据：

- 官网入口：freshwater / saltwater / trout
- 系列名、SKU、Description
- 官方 lure weight / line range / type

约束：

- freshwater 默认按 Bass 场景处理。
- trout 默认按管钓 / 鱒鱼场景处理。
- saltwater 按 jigging / light game / squid / rockfish / seabass 等词分层。
- `guide_layout_type` 只在 Description 明确出现 `Kガイド / Fuji / SiC / チタンフレーム` 等导环证据时填写。

### 4.4.1 白名单辅助站补强

补强脚本：

- [collect_evergreen_rod_whitelist_evidence_stage3.js](/Users/tommy/GearSage/scripts/collect_evergreen_rod_whitelist_evidence_stage3.js)
- [apply_evergreen_rod_whitelist_player_fields_stage4.js](/Users/tommy/GearSage/scripts/apply_evergreen_rod_whitelist_player_fields_stage4.js)

有效白名单来源：

- Plus Fishing Store：`https://store.plus-fishing.com/`

本轮从 Plus Fishing 能稳定获得的信息：

- Evergreen rod 产品页 handle / 系列名。
- 每个 variant 的英文型号标题。
- 每个 variant 的 JAN / retail sku。仅作为 sidecar 证据，不写 `AdminCode`。
- 部分系列的逐型号英文技法描述，例如 Phase、Serpenti。
- 多数系列的英文规格表字段，例如 length、power、lure weight、line、carbon。
- 系列与目标场景线索，例如 Zephyr Avantgarde、Squidlaw Imperial、Poseidon、Salty Sensation、Artisan trout 系列。

当前 Plus Fishing 采集结果：

- source pages：`14`
- evidence rows：`179`
- evidence duplicate ids：`0`
- 匹配原则：只按当前导入表的 SKU / 型号 code / Code Name 精确匹配，不做模糊标题写入。

实际写入字段：

- `rod.player_positioning`
- `rod.player_selling_points`
- `rod_detail.player_environment`
- `rod_detail.player_positioning`
- `rod_detail.player_selling_points`

展示字段写入原则：

- 只写用户能直接理解的场景、技法、规格和使用价值。
- 不在 `player_*` 字段中写 `Plus Fishing`、`白名单`、`外部证据`、`来源确认` 等来源说明。
- 来源、匹配规则、JAN / retail sku 和置信度只保留在 sidecar evidence / backfill report。

明确不写入：

- `official_environment`
- `AdminCode`
- Plus Fishing 的 JAN / retail sku

本轮顺手修正的旧推断风险：

- `SSSS / NIM*` 归入 `木虾 / 乌贼`，不再误落到船钓。
- `PREJ / PSLJ / PLFJ / PHPJ / PSPJ` 归入 `船钓 / 铁板`，不再误落到岩鱼。
- `ZAGS` 继续保持 `海鲈 / 岸投 / 远投`。
- `AATS / AMSC / AMSS` 保持 trout 场景。

验证结果：

- `rod.player_positioning`：`292 / 292`
- `rod.player_selling_points`：`292 / 292`
- `rod_detail.player_environment`：`292 / 292`
- `rod_detail.player_positioning`：`292 / 292`
- `rod_detail.player_selling_points`：`292 / 292`
- `official_environment`：`0 / 292`
- `rod_detail` 与 `rod` 关联错位：`0`
- SKU / Code Name 重复：`0`
- 高风险场景错分检查：`0`

### 4.5 Code Name

`Code Name` 写英文完整型号昵称，不写日文名。能区分子商品的版本/规格后缀需要保留；官网没有独立昵称、只有 SKU 编号的型号，用 SKU 兜底，保证导入后可区分。

示例：

- `IRSC-63MHR-TG40X ウォーガゼルRS` -> `War Gazelle RS`
- `IRSC-66M コブラRS` -> `Cobra RS`
- `IGTC-66M コブラGT` -> `Cobra GT`
- `GTR-C66LLR スーパースティードGT-R` -> `Super Steed GT-R`
- `GT3RS-C71MH-TG40X スーパースタリオンGT3RS` -> `Super Stallion GT3RS`
- `IRSC-66M-Aurora コブラRS オーロラ エディション` -> `Cobra RS Aurora Edition`
- `IRSC-71MH-Aurora スーパースタリオンRS オーロラ エディション` -> `Super Stallion RS Aurora Edition`

官网只有 SKU 编号、没有独立昵称的兜底示例：

- `HFAC-65M` -> `HFAC-65M`
- `CLCC-68ML` -> `CLCC-68ML`
- `NEOS-60XUL-S` -> `NEOS-60XUL-S`

### 4.6 展示字段噪声清理

清理脚本：

- [fix_evergreen_rod_line_wt_nf_slashes_stage5.py](/Users/tommy/GearSage/scripts/fix_evergreen_rod_line_wt_nf_slashes_stage5.py)
- [fix_evergreen_rod_discontinued_notice_stage6.py](/Users/tommy/GearSage/scripts/fix_evergreen_rod_discontinued_notice_stage6.py)

清理规则：

- `Line Wt N F` 只清理首尾 ASCII `/` 和全角 `／`，不改字段内部原始规格。
- `※ 当製品の生産は終了いたしました。` 是 Evergreen 页面状态提示，不写入 `rod.main_selling_points`、`rod.Description`、`rod_detail.Description` 或 normalized `description`。
- `main_selling_points` 清理后若为空或只剩型号名，用清理后的 `Description` 首个有效句子回填。

本轮结果：

- `Line Wt N F` 清理：`52` 行，`ERD10224` 起首尾 `/` / `／` 残留为 `0`。
- 停产提示清理：Excel 改动 `175` 个字段，normalized 改动 `116` 个字段。
- 清理后 `rod.main_selling_points`、`rod.Description`、`rod_detail.Description`、normalized `description` 的停产提示残留均为 `0`。

### 4.7 recommended_rig_pairing

补充脚本：

- [apply_evergreen_rod_recommended_rig_pairing_stage7.py](/Users/tommy/GearSage/scripts/apply_evergreen_rod_recommended_rig_pairing_stage7.py)
- [fix_evergreen_rod_rig_pairing_guide_consistency_stage8.py](/Users/tommy/GearSage/scripts/fix_evergreen_rod_rig_pairing_guide_consistency_stage8.py)
- [refine_evergreen_rod_usage_fields_stage9.py](/Users/tommy/GearSage/scripts/refine_evergreen_rod_usage_fields_stage9.py)

写入规则：

- 列位置按标准 schema 放在 `guide_use_hint` 后、`hook_keeper_included` 前。
- 来源优先级：官网 `Description` 明确钓组/饵型 > Plus Fishing 白名单描述补充 > SKU / power / lure weight / type 保守推断。
- 白名单只作为补充和校验，不覆盖已经明确的官网信息。
- 不使用固定枚举；按官网出现的新钓组/饵型扩展词汇。
- 不写 `General Lure`、`Light Rig`、`Hardbait`、`Soft Bait`、`Soft Plastic` 等泛化值。
- `Chatterbait` 承接 `ブレーデッドジグ / チャター / 刀片铅头钩`；`Swim Jig` 承接 `スイムジグ / 泳饵铅头钩`；`Rubber Jig` 承接 `ラバージグ / 橡胶铅头钩`；`No Sinker` 承接 `ノーシンカー / 无铅头钩组`。

本轮结果：

- `recommended_rig_pairing` 覆盖：`292 / 292`
- `guide_use_hint` 覆盖：`292 / 292`
- 来源分布：官网 Description `268`，白名单辅助 `1`，保守推断 `23`
- 泛化残留：`0`
- 官网 Description 前 14 个明确钓组/饵型未承接：`0`
- `recommended_rig_pairing` 与 `guide_use_hint` 冲突：`0`
- 为消除冲突同步修正 `guide_use_hint`：`14` 行，均为旧 hint 写成软饵底操但新字段首位为硬饵/移动饵的行。
- 后续复核已按每个子型号的 `recommended_rig_pairing`、Description 线索、使用环境、lure weight / line rating 重建 `guide_use_hint`，不再保留 `輕線精細 / 強力大餌 / Bass 泛用` 等旧模板原句。

### 4.8 玩家字段精修

补充脚本：

- [refine_evergreen_rod_player_fields_stage10.py](/Users/tommy/GearSage/scripts/refine_evergreen_rod_player_fields_stage10.py)
- [fix_evergreen_rod_stage10_required_guide_conflicts.py](/Users/tommy/GearSage/scripts/fix_evergreen_rod_stage10_required_guide_conflicts.py)
- [qa_evergreen_rod_player_fields_stage10.py](/Users/tommy/GearSage/scripts/qa_evergreen_rod_player_fields_stage10.py)

写入口径：

- 默认只覆盖 `player_environment`、`player_positioning`、`player_selling_points`。
- 玩家字段不写来源说明，不搬官网标题或官方卖点，只把 `recommended_rig_pairing`、Description、规格边界转成真实使用视角。
- Bass、海鲈、Light Game、Mebaring、Rockfish、Eging、Tairaba、Offshore Jigging 分支分开处理；含混合钓组时写清主轴和副用途，不把 MH/H 自动写成 Big Bait。
- `guide_use_hint` 只在 QA 中发现明确冲突时单独修正：本轮修正 `7` 行，集中在 Tairaba 残留 Bass/木蝦文案、Light Game/Rockfish 残留船钓铁板或木蝦文案。
- 每次保存后运行底色恢复脚本，保持 `rod_detail` 行组底色。

本轮结果：

- `player_environment` 覆盖：`292 / 292`，unique `32`
- `player_positioning` 覆盖：`292 / 292`，unique `135`
- `player_selling_points` 覆盖：`292 / 292`，unique `228`
- 玩家字段来源说明残留：`0`
- 空泛词残留：`0`
- 玩家字段与 `recommended_rig_pairing` / `Description` / `guide_use_hint` 冲突：`0`
- 底色抽样：`A2 = FFF8F3C8`，`A293 = FFE8F1FB`；目标字段首尾行底色与行组一致。
- QA 报告：[evergreen_rod_player_fields_stage10_qa_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/evergreen_rod_player_fields_stage10_qa_report.json)

---

## 5. 最终验证清单

每次收尾至少检查：

```bash
node - <<'JS'
const XLSX=require('xlsx');
const p='GearSage-client/pkgGear/data_raw/evergreen_rod_import.xlsx';
const wb=XLSX.readFile(p);
for (const s of ['rod','rod_detail']) {
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[s],{defval:''});
  console.log(s, rows.length);
}
JS
```

还要检查：

- `rod.id` 唯一
- `rod_detail.id` 唯一
- `rod_detail.rod_id` 唯一
- `rod_detail.SKU` 唯一
- 全角 SKU 为 0
- `Code Name` 覆盖应为 `292 / 292`。
- `Code Name` 值不应重复；`Cobra RS` 与 `Cobra GT` 等相近型号必须能区分。
- `freshwater / Bass` 不应落到船钓、木蝦、岩鱼、海鱸。
- `ZAGS` 不应落到船钓或木蝦。
- `NIM* / スキッドロウ` 不应落到非木蝦。
- `PREJ / PSLJ / PHPJ / PSPJ` 不应落到淡水或木蝦。
- `Line Wt N F` 从 `ERD10224` 起不应存在首尾 `/` / `／`。
- `Description`、`main_selling_points` 和 normalized `description` 不应包含 `当製品の生産は終了いたしました`。
- `recommended_rig_pairing` 覆盖应为 `292 / 292`。
- `recommended_rig_pairing` 不应包含 `General Lure`、`Light Rig`、`Hardbait`、`Soft Bait`、`Soft Plastic`。
- `Description` 明确出现的钓组/饵型应被 `recommended_rig_pairing` 承接。
- `recommended_rig_pairing` 首位与 `guide_use_hint` 不应出现软硬饵方向冲突；混合用法必须写清切换逻辑。
- `player_environment`、`player_positioning`、`player_selling_points` 覆盖应为 `292 / 292`。
- 玩家字段不应包含 `官网`、`官方`、`白名单`、`来源`、`证据`、`tackledb` 等来源说明。
- 玩家字段不应出现 Bass / 海鲈 / Light Game / Eging / Tairaba / 船钓铁板的跨场景错配。
- 玩家字段与 `recommended_rig_pairing`、`Description`、`guide_use_hint` 不应冲突。
- `player_selling_points` unique 数应明显高于大类模板数量，避免整组重复填同一句。

---

## 6. 后续注意

- 旧脚本 [to_excel_evergreen_rod.js](/Users/tommy/GearSage/scripts/to_excel_evergreen_rod.js) 只作为历史参考，不再作为当前 Evergreen rod 默认生成入口。
- 如后续要补白名单站证据，建议新增 sidecar JSON，不把白名单证据塞进导入表。
- 若用户开始人工检查本表，后续修复脚本只改目标字段，不再整表重建。
