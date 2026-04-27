# Abu 鱼竿 官网缓存与玩家字段补全收口 v1

版本：v1  
状态：Abu Garcia rods 阶段性收口  
更新时间：2026-04-25  

---

## 1. 当前范围

来源站点：

- Abu Garcia 美国官网 rods 列表  
  `https://www.abugarcia.com/collections/rods?sort_by=created-descending`

当前正式导入表：

- [abu_rod_import.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_import.xlsx)

当前主要中间层：

- [abu_rods_normalized.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rods_normalized.json)
- [abu_rod_list_items.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rods_cache/abu_rod_list_items.json)
- [details/](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rods_cache/details)
- [abu_rod_whitelist_player_evidence.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_whitelist_player_evidence.json)

当前结果：

- 主商品：`41`
- 子型号：`205`
- 官网详情缓存：`41 / 41`
- 本地主图：`41 / 41`
- `rod.images`：`41 / 41`
- `rod.Description`：`41 / 41`
- `rod.official_reference_price`：`41 / 41`
- `rod.player_positioning`：`41 / 41`
- `rod.player_selling_points`：`41 / 41`
- `rod_detail.Description`：`205 / 205`
- `rod_detail.Market Reference Price`：`205 / 205`
- `rod_detail.AdminCode`：`205 / 205`
- `rod_detail.Line Wt N F`：`204 / 205`
- `rod_detail.player_environment`：`205 / 205`
- `rod_detail.player_positioning`：`205 / 205`
- `rod_detail.player_selling_points`：`205 / 205`
- `rod_detail.guide_layout_type`：`205 / 205`
- `rod_detail.guide_use_hint`：`205 / 205`
- `rod_detail.Grip Type`：`174 / 205`
- `rod_detail.Reel Seat Position`：`195 / 205`
- `rod_detail.hook_keeper_included`：`33 / 205`

当前合理空值：

- `official_environment = 0 / 205`  
  Abu Garcia 官网没有稳定官方场景字段，不用玩家或白名单语义污染 official 字段。
- `sweet_spot_lure_weight_real = 0 / 205`  
  没有真实玩家甜区来源，不把规格推断写成实际甜区。
- `LURE WEIGHT = 0 / 205`、`LURE WEIGHT (oz) = 0 / 205`  
  当前官网缓存没有稳定 lure weight 字段，不从线号或 POWER 反推。
- `Line Wt N F = 204 / 205`  
  唯一空值是 `Vendetta® Ice Spinning Rod / AVNDI27M`，官网规格为 `Line Rating: None`，不硬填。
- `Grip Type` 剩余空值  
  主要是 Beast 系列没有稳定握把描述，以及 prior gen Vendetta 只有 A/B/C/F/G 等图纸代号；这些代号不直接写入用户字段。
- `Reel Seat Position` 剩余空值  
  主要是 Beast 系列和 Ice 短竿缺少稳定轮座描述；留空比推断更可靠。

---

## 2. 本次流程结论

Abu rods 已经完成：

1. 官网列表缓存
2. 官网详情缓存
3. normalized JSON 生成
4. 主图下载和 CDN URL 标准化
5. 导入表基线生成
6. 玩家字段回写
7. 官网特征字段补充
8. evidence sidecar JSON 输出
9. `rod_detail` 分组底色恢复
10. 最终字段覆盖验证

后续原则：

- **不要重新全量覆盖已经进入人工检查阶段的 `abu_rod_import.xlsx`。**
- **不要把 evidence、白名单、官网核验过程语言写进用户展示字段。**
- **任何脚本只要保存 `abu_rod_import.xlsx`，最后都要恢复 `rod_detail` 分组底色。**
- **不能从 POWER、线号或系列名推断 lure weight、official_environment 或真实甜区。**

---

## 3. 核心脚本链路

### 3.1 官网缓存和基线导出

脚本：

- [build_abu_rod_import.js](/Users/tommy/GearSage/scripts/build_abu_rod_import.js)

作用：

- 抓取 Abu Garcia rods 列表。
- 缓存列表页和详情页。
- 从 Shopify product JSON、variant metafields、页面规格块解析：
  - `model`
  - `description`
  - `features`
  - `main_image_url`
  - `variants`
  - SKU / AdminCode / price / specs
- 下载主图到本地。
- 生成 `abu_rods_normalized.json` 和 `abu_rod_import.xlsx`。
- 写完后调用底色脚本。

运行方式：

```bash
node scripts/build_abu_rod_import.js --stage=list
node scripts/build_abu_rod_import.js --stage=details
node scripts/build_abu_rod_import.js --stage=export
```

重要限制：

- `--stage=export` 会重建 `abu_rod_import.xlsx`。
- 默认 `all` 会重新抓取并重建导入表。
- 进入人工检查和玩家字段补全阶段后，不应随便重跑 `export`。
- 如果必须重跑，要先确认后续定点补充脚本都能重新 apply。

### 3.2 玩家字段和官网特征补全

脚本：

- [apply_abu_rod_player_whitelist_stage1.js](/Users/tommy/GearSage/scripts/apply_abu_rod_player_whitelist_stage1.js)

作用：

- 读取 `abu_rod_import.xlsx`。
- 读取 `abu_rods_normalized.json`。
- 回写用户展示字段：
  - `rod.player_positioning`
  - `rod.player_selling_points`
  - `rod_detail.player_environment`
  - `rod_detail.player_positioning`
  - `rod_detail.player_selling_points`
- 补充官网特征字段：
  - `rod_detail.guide_layout_type`
  - `rod_detail.guide_use_hint`
  - `rod_detail.Grip Type`
  - `rod_detail.Reel Seat Position`
- 写出 sidecar evidence：
  - `abu_rod_whitelist_player_evidence.json`
- 写完后调用底色脚本。

运行方式：

```bash
node scripts/apply_abu_rod_player_whitelist_stage1.js
```

关键规则：

- `player_selling_points` 是用户展示文案，只能写产品卖点，不能写“白名单 / 官网 / tackledb / 证据 / 未明示”等内部过程语言。
- evidence 来源、置信度和内部说明只写入 `abu_rod_whitelist_player_evidence.json`。
- Beast 系列可以保留 `大饵 / 强力泛用`，因为官方描述明确 big baits / swimbaits / large powerful fish / muskie。
- 普通 Max / Vendetta / Veritas / Vengeance / Zenon / Fantasista 的 `MH/H` 子型号不能因为 POWER 强就写成大饵，只写 `强力泛用`。
- `Ike Signature Power Casting Rod` 按 `Power fishing / 强力泛用` 处理。
- `Zenon™ BFS Casting Winch Rod` 按 `BFS Winch / 精细卷阻饵` 处理。

### 3.3 分组底色恢复

脚本：

- [shade_abu_rod_detail_groups.py](/Users/tommy/GearSage/scripts/shade_abu_rod_detail_groups.py)

作用：

- 直接修改 xlsx 内部 XML。
- 按 `rod_detail.rod_id` 分组恢复交替底色。

当前底色：

- `FFF8F3C8`
- `FFE8F1FB`

运行方式：

```bash
python3 scripts/shade_abu_rod_detail_groups.py
```

---

## 4. 玩家字段口径

### 4.1 主表 player_positioning

当前分层：

- `bass / 淡水泛用`
- `bass / BFS / 精细轻饵`
- `bass / BFS Winch / 精细卷阻饵`
- `bass / 卷阻饵 / 搜索`
- `bass / Power fishing / 强力泛用`
- `bass / Frog / 强障碍`
- `bass / Flipping / 重障碍`
- `bass / 淡水泛用 / 高阶`
- `大饵 / 强力泛用`
- `冰钓 / 短竿专项`

### 4.2 子表 player_environment / player_positioning

当前分层：

- `淡水 / bass`
- `淡水 / bass / BFS`
- `淡水 / bass / 强力泛用`
- `淡水 / bass / 大饵强力`
- `淡水 / bass / power fishing`
- `淡水 / bass / 重障碍`
- `冰钓`

子型号根据型号、POWER、TYPE 和系列特征细分为：

- 直柄泛用
- 枪柄泛用
- 直柄精细轻饵
- 枪柄精细轻饵
- 直柄强力泛用
- 枪柄强力泛用
- BFS 卷阻饵 / 精细搜索
- 卷阻饵 / 搜索
- Frog / 强障碍
- Flipping / cover 打点
- 短竿专项

### 4.3 用户文案规则

用户展示字段必须是产品表达，例如：

- `覆盖常规淡水路亚技法 / 软饵、硬饵和搜索场景都容易搭配 / 日常黑鲈作钓适用面广`
- `大饵和大鱼取向 / 适合 swimbait、重饵和高负荷控鱼 / 竿身余量更充足`
- `轻饵抛投和卷阻饵节奏兼顾 / 适合小型 moving bait、搜索和精细控线`

不要写：

- 白名单命中
- 官网明确
- tackledb 有记录
- 证据支持
- 未明示
- 筛查

---

## 5. 官网特征字段口径

### 5.1 guide_layout_type

当前结果：`205 / 205`

取值主要包括：

- `ROCS guide train`
- `Stainless steel guide train`
- `Stainless steel / Zirconium guide train`
- `Stainless steel / aluminum oxide guide train`

注意：

- 只在 features 或 specs 出现 ROCS 时写 `ROCS guide train`。
- Titanium / zirconium / nitride silicon / aluminum oxide 只根据官网缓存文本写入。

### 5.2 guide_use_hint

当前结果：`205 / 205`

示例：

- `轻饵远投和出线顺畅`
- `轻量化导环有助于提升竿身平衡`
- `导环内衬更适合高频抛投和细线使用`
- `耐用泛用，适合日常淡水路亚`
- `耐用泛用，维护成本低`

### 5.3 Grip Type

当前结果：`174 / 205`

可写入的稳定来源：

- features 中明确的 EVA / carbon / cork / Winn / Closed Cell EVA / High density EVA
- specs 中明确的 `Split Grip` / `Full Grip`

不写入：

- A/B/C/D/E/F/G 等图纸代号
- 未明确材质或形态的推断

### 5.4 Reel Seat Position

当前结果：`195 / 205`

字段实际承载轮座类型/描述，当前取值包括：

- `Abu Garcia custom ergonomic reel seat`
- `Ergonomic Abu designed reel seat`
- `Fuji reel seat`
- `CCRS carbon constructed reel seat`

不写入：

- 没有稳定轮座描述的 Beast 系列
- Ice 短竿缺少稳定轮座描述的型号

---

## 6. Evidence sidecar

文件：

- [abu_rod_whitelist_player_evidence.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_whitelist_player_evidence.json)

当前结果：

- 总记录：`246`
- `rod`：`41`
- `rod_detail`：`205`
- `high`：`13`
- `medium`：`61`
- `low`：`172`
- `exact_whitelist`：`13`
- `official_model`：`61`
- `official_spec_inference`：`98`
- `official_plus_whitelist_context`：`74`
- evidence 中记录的官网特征字段：
  - `guide_layout_type`：`205`
  - `guide_use_hint`：`205`
  - `Grip Type`：`174`
  - `Reel Seat Position`：`195`

用途：

- 保存字段来源和置信度。
- 保存内部说明。
- 避免把证据链语言写进导入表用户字段。

---

## 7. 最终验证清单

每次收尾至少检查：

```bash
node - <<'NODE'
const XLSX=require('./scripts/node_modules/xlsx');
const wb=XLSX.readFile('/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_import.xlsx');
for (const sheet of ['rod','rod_detail']) {
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:''});
  console.log(sheet, rows.length);
  const fields=sheet==='rod'
    ? ['id','images','Description','official_reference_price','player_positioning','player_selling_points']
    : ['id','rod_id','SKU','TYPE','POWER','TOTAL LENGTH','Action','PIECES','Line Wt N F','Market Reference Price','AdminCode','guide_layout_type','guide_use_hint','Grip Type','Reel Seat Position','player_environment','player_positioning','player_selling_points','Description'];
  for (const f of fields) {
    console.log(f, rows.filter(r=>String(r[f]??'').trim()).length+'/'+rows.length);
  }
}
NODE
```

检查用户展示字段是否混入内部语言：

```bash
node - <<'NODE'
const XLSX=require('./scripts/node_modules/xlsx');
const wb=XLSX.readFile('/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_import.xlsx');
let bad=[];
for (const sheet of ['rod','rod_detail']) {
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:''});
  for (const r of rows) {
    for (const f of ['player_selling_points','guide_use_hint']) {
      const v=String(r[f]||'');
      if (/白名单|官网|tackledb|记录|证据|未明示|筛查/.test(v)) bad.push({sheet,id:r.id,field:f,v});
    }
  }
}
console.log('bad user text count', bad.length);
NODE
```

检查底色：

```bash
python3 scripts/shade_abu_rod_detail_groups.py
```

运行脚本后应看到：

```text
{'file': '/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_import.xlsx', 'group_rows': 205, 'fills': 2}
```

---

## 8. 后续可做但不应混入本次收口

可做：

- 针对剩余 `Grip Type` 空值，人工查看官网图片后另建人工补充脚本。
- 针对 Beast 系列轮座和握把，如果官网后续增加明确描述，再定点补。
- 如果找到可靠 lure weight 来源，再新增 sidecar 证据后定点回写 `LURE WEIGHT`。

不应做：

- 从 line rating 推断 lure weight。
- 从 POWER 推断真实甜区。
- 为了满表把 A/B/C/F/G 图纸代号写进 `Grip Type`。
- 用白名单站内容填 `official_environment`。
- 重新运行 `build_abu_rod_import.js --stage=export` 覆盖人工补全结果。
