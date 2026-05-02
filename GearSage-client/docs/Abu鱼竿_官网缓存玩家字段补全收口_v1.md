# Abu 鱼竿 官网缓存与玩家字段补全收口 v1

版本：v1  
状态：Abu Garcia rods 阶段性收口  
更新时间：2026-05-01  

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
- `rod.fit_style_tags`：`40 / 41`
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
- `rod_detail.recommended_rig_pairing`：`205 / 205`
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
8. 子型号推荐钓组 / 饵型补充
9. `guide_use_hint` / `recommended_rig_pairing` 专业化复核
10. 子型号玩家字段专业化复核
11. `guide_use_hint` 表达去模板化收口
12. evidence / report sidecar JSON 输出
13. `rod_detail` 分组底色恢复
14. `rod.fit_style_tags` 主表筛选标签补充
15. 最终字段覆盖验证

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
- 当前 `--stage=export` 已会从中间层 `item.fit_style_tags` 写入 `rod.fit_style_tags`。

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

### 3.3 子型号推荐钓组 / 饵型补充

脚本：

- [apply_abu_rod_recommended_rig_pairing_stage2.js](/Users/tommy/GearSage/scripts/apply_abu_rod_recommended_rig_pairing_stage2.js)

作用：

- 读取 `abu_rod_import.xlsx` 和 `abu_rods_normalized.json`。
- 只回写 `rod_detail.recommended_rig_pairing`。
- 按“最擅长 -> 合适”的顺序写入当前子型号更适合搭配的钓组 / 饵型。
- 优先使用官网系列 / 子型号描述和 SKU 中的明确用途线索。
- 官网没有明确饵型时，才基于 `type`、`POWER`、`ACTION`、线号、SKU 做保守规格推断。
- 写出逐行报告：
  - [abu_rod_recommended_rig_pairing_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_recommended_rig_pairing_report.json)
- 写完后调用底色脚本。

运行方式：

```bash
node scripts/apply_abu_rod_recommended_rig_pairing_stage2.js
```

当前结果：

- 覆盖率：`205 / 205`
- 只修改字段：`rod_detail.recommended_rig_pairing`
- 来源分布：
  - `official_model = 43`
  - `official_sku_cue = 10`
  - `official_spec_inference = 152`
- 置信度分布：
  - `medium = 51`
  - `low = 154`
- 一致性检查：`issue_count = 0`

关键规则：

- 不使用 `General Lure`、`Light Rig`、`Hardbait`、`Soft Bait` 等过泛值。
- 不把官网 / 白名单 / 推断过程说明写进用户展示字段。
- Description 明确出现的用途必须被 `recommended_rig_pairing` 承接。
- `MH/H` 不自动等于 Big Bait；只有 Beast、Swimbait、Big Bait、muskie 等明确线索才写大饵。
- `guide_use_hint` 不能与首位钓组 / 饵型冲突；软硬饵混合时写成泛用或切换逻辑。

### 3.4 用途字段专业化复核

脚本：

- [refine_abu_rod_usage_fields_stage3.js](/Users/tommy/GearSage/scripts/refine_abu_rod_usage_fields_stage3.js)

作用：

- 读取 `abu_rod_import.xlsx` 和 `abu_rods_normalized.json`。
- 只允许回写：
  - `rod_detail.guide_use_hint`
  - `rod_detail.recommended_rig_pairing`
- 把 `guide_use_hint` 从导环 / 硬件提示修正为子型号使用提示。
- 优先承接官网 Description 中明确出现的 technique / bait / rig：
  - Winch / crankbait
  - Delay / reaction bait / moving bait / parabolic action
  - BFS / lightweight bait
  - Finesse bait
  - Frog
  - Flipping / pitching / dense cover
  - Beast / swimbait / big baits / muskie
  - Ice
- 对 Beast spinning 等包含关系页面，不把整页 muskie / big bait 语义套给轻线子型号；按 `TYPE`、`POWER`、`ACTION`、`Line Wt N F` 收敛到小型软泳饵、Underspin、Swim Jig 等更稳妥搭配。
- 对普通 H / XH Fast casting，不因为 power 强就自动写 Big Bait；没有 Beast / Swimbait / Big Bait 等证据时，按 Heavy Texas、Rubber Jig、Football Jig、Swim Jig、Carolina Rig 处理。
- 写出逐行复核报告：
  - [abu_rod_usage_fields_refine_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_usage_fields_refine_report.json)
- 写完后调用底色脚本。

运行方式：

```bash
node scripts/refine_abu_rod_usage_fields_stage3.js
```

当前结果：

- 覆盖率：
  - `guide_use_hint = 205 / 205`
  - `recommended_rig_pairing = 205 / 205`
- 只修改字段：
  - `rod_detail.guide_use_hint`
  - `rod_detail.recommended_rig_pairing`
- 来源分布：
  - `official_description = 43`
  - `official_sku_cue = 10`
  - `official_spec_inference = 152`
- 置信度分布：
  - `high = 42`
  - `medium = 11`
  - `low = 152`
- 一致性检查：`issue_count = 0`
- 过泛残留：`0`
- 硬件式 `guide_use_hint` 残留：`0`
- 软硬饵首位冲突：`0`

后续如果重跑推荐钓组，必须以 stage3 作为最终收口脚本。

### 3.5 guide_use_hint 表达去模板化收口

脚本：

- [refine_abu_rod_guide_use_hint_stage5.js](/Users/tommy/GearSage/scripts/refine_abu_rod_guide_use_hint_stage5.js)

作用：

- 读取 `abu_rod_import.xlsx` 和 `abu_rod_usage_fields_refine_report.json`。
- 只允许回写：
  - `rod_detail.guide_use_hint`
- 不修改 `recommended_rig_pairing`、Description、规格字段、玩家字段或官网字段。
- 将 stage3 的规则式表达改成更自然的专业用竿提示，按长度、power、action、线号和推荐钓组说明实际操作重点。
- 去除“官网 / SKU / 规格取向 / 优先兼顾”这类过程感和机械结构。
- 写出逐行复核报告：
  - [abu_rod_guide_use_hint_refine_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_guide_use_hint_refine_report.json)
- 写完后调用底色脚本。

运行方式：

```bash
node scripts/refine_abu_rod_guide_use_hint_stage5.js
```

当前结果：

- 覆盖率：`205 / 205`
- unique：`169`
- 最大重复：`3`
- 来源说明残留：`0`
- 导环 / 硬件提示残留：`0`
- 机械句式残留：`0`
- 与 `recommended_rig_pairing` 明显冲突：`0`
- 一致性检查：`issue_count = 0`

后续如果重跑 stage3，必须再运行 stage5 作为最终 `guide_use_hint` 表达收口。

### 3.6 子型号玩家字段专业化复核

脚本：

- [refine_abu_rod_player_fields_stage4.js](/Users/tommy/GearSage/scripts/refine_abu_rod_player_fields_stage4.js)

作用：

- 读取 `abu_rod_import.xlsx`、`abu_rod_usage_fields_refine_report.json` 和 `abu_rod_whitelist_player_evidence.json`。
- 只允许回写：
  - `rod_detail.player_environment`
  - `rod_detail.player_positioning`
  - `rod_detail.player_selling_points`
- 不修改官网字段、规格字段、`Description`、`recommended_rig_pairing`、`guide_use_hint`。
- 以白名单 bass 使用语境作为玩家字段边界，结合 stage3 已确认的 `recommended_rig_pairing`、子型号规格和 Description 边界做玩家视角表达。
- 保护人工维护行：如果当前值既不是旧模板、也不是本脚本历史输出，会跳过并写入 report warning。
- 写出逐行复核报告：
  - [abu_rod_player_fields_refine_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_player_fields_refine_report.json)
- 写完后调用底色脚本。

运行方式：

```bash
node scripts/refine_abu_rod_player_fields_stage4.js
```

当前结果：

- 覆盖率：
  - `player_environment = 205 / 205`
  - `player_positioning = 205 / 205`
  - `player_selling_points = 205 / 205`
- unique：
  - `player_environment = 69`
  - `player_positioning = 140`
  - `player_selling_points = 158`
- 最大重复：
  - `player_environment = 15`
  - `player_positioning = 4`
  - `player_selling_points = 4`
- 来源分布：
  - `whitelist_context_plus_resolved_usage = 152`
  - `whitelist_context_plus_description_boundary = 43`
  - `whitelist_context_plus_sku_usage = 10`
- 保护行：`0`
- 一致性检查：`issue_count = 0`
- 来源说明残留：`0`
- 空泛词残留：`0`
- 海水 / 船钓异常组合：`0`
- 玩家字段与 `recommended_rig_pairing` 明显冲突：`0`

关键规则：

- 玩家字段不写“官网确认 / 白名单显示 / tackledb / 证据”等来源说明。
- `player_environment` 写真实作钓环境，例如草垫 cover、开阔水域卷阻搜索、清水细线轻压场、冰洞垂直控饵。
- `player_positioning` 写玩家视角定位，并按层级和子型号规格区分，不再只写“枪柄泛用 / 直柄泛用”。
- `player_selling_points` 写具体使用价值，例如低弹道入障、控松线、短咬缓冲、贴障控鱼、软硬饵切换。
- Beast spinning 不写成重型大饵；普通 H / XH Fast 不因为 power 强自动写 Big Bait。

### 3.7 fit_style_tags 主表筛选标签补充

规范来源：

- [装备库_fit_style_tags_枚举与填表规范_v1.md](/Users/tommy/GearSage/GearSage-client/docs/装备库_fit_style_tags_枚举与填表规范_v1.md)
- 当前按 v1.2 枚举执行，rod 允许值包含 `旅行`。

脚本：

- [apply_abu_rod_fit_style_tags_stage6.py](/Users/tommy/GearSage/scripts/apply_abu_rod_fit_style_tags_stage6.py)

作用：

- 给 `abu_rods_normalized.json` 写入 item 级 `fit_style_tags`。
- 清理 variant 级误写的 `fit_style_tags`。
- 给当前 `abu_rod_import.xlsx / rod` 主表增加并填写 `fit_style_tags`。
- 确认 `rod_detail` 不包含 `fit_style_tags`。
- 保存 xlsx 后恢复 `rod_detail` 分组底色。

运行方式：

```bash
python3 scripts/apply_abu_rod_fit_style_tags_stage6.py
```

当前结果：

- `abu_rods_normalized.json item.fit_style_tags`：`40 / 41`
- `abu_rods_normalized.json variant.fit_style_tags`：`0`
- `abu_rod_import.xlsx / rod.fit_style_tags`：`40 / 41`
- `abu_rod_import.xlsx / rod_detail.fit_style_tags`：不存在
- 值分布：
  - `bass`：`38`
  - `bass,旅行`：`2`
  - 空值：`1`
- 非空值全部在规范枚举内。
- 报告：
  - [abu_rod_fit_style_tags_stage6_report.json](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/abu_rod_fit_style_tags_stage6_report.json)

填写口径：

- Abu 当前导入主型号大多是淡水 bass 体系，主表写 `bass`。
- Beast 系列官网 Description 明确包含 “swimbaits for bass”，因此主表写 `bass`；其中 muskie / pounder 大饵细分留在 `recommended_rig_pairing`、`guide_use_hint` 和玩家字段，不新增枚举。
- v1.2 中 `旅行` 只用于 2 节以上且不包含 2 节的多节鱼竿；当前只给带 3-piece SKU 的 `Ike Signature Finesse Spinning Rod` 和 `Ike Signature Power Casting Rod` 写 `bass,旅行`。
- `Vendetta® Ice Spinning Rod` 是冰钓短竿，当前 rod 枚举没有 ice / 冰钓，不为了覆盖率硬贴 `bass`，保留空值。
- `fit_style_tags` 只落 item / rod 主表，不落 `rod_detail`。

### 3.8 分组底色恢复

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
    ? ['id','images','Description','official_reference_price','fit_style_tags','player_positioning','player_selling_points']
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
