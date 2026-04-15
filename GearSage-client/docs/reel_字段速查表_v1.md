# Reel 字段速查表 v1

版本：v1  
状态：填写速查用  
更新时间：2026-04-15  
适用范围：`reel.xlsx` / `spinning_reel_detail.xlsx` / `baitcasting_reel_detail.xlsx`

---

## 一、这份文档怎么用

这份文档不是完整设计稿，也不是字段分层规范。

它只解决一件事：

> 在补渔轮表格时，快速确认“这个字段是什么意思、该不该填、没有资料能不能留空”。

建议配合使用：

- 总体施工口径：
  [装备库字段主清单_v0.md](/Users/tommy/GearSage/GearSage-client/docs/装备库字段主清单_v0.md)
- 完整字段解释：
  [装备库字段解释手册_v1.md](/Users/tommy/GearSage/GearSage-client/docs/装备库字段解释手册_v1.md)

---

## 二、填写总原则

1. 主表写“主商品 / 系列层”信息，detail 写“子型号 / 规格层”信息。
2. 能确认的再填，不能确认的宁可留空，不要猜。
3. 官方参数优先保真，GearSage 归一字段优先让服务器算。
4. `spinning` 和 `baitcasting` 不用人为再拆一套表，按现有 `type` 和 detail 表自然区分。
5. 当前最值得优先补的是：
   - `is_sw_edition`
   - `spool_diameter_mm`
   - `spool_width_mm`
   - `spool_weight_g`
   - `spool_axis_type`
   - `knob_size`

---

## 三、字段速查

### 3.1 主表常用字段（`reel.xlsx`）

| 字段 | 中文意思 | 该填什么 | 没资料时 | 备注 |
|---|---|---|---|---|
| `id` | 主商品 ID | 系列唯一 ID，如 `SRE1000` | 不能空 | 主键 |
| `brand_id` | 品牌 ID | 数字品牌 ID | 不能空 | 关联 `brand.xlsx` |
| `is_show` | 是否展示 | `1` 显示，`0` 隐藏 | 默认填 `1` | `0` 后客户端不显示也不可查询 |
| `model` | 型号名 | 官网主型号名 | 尽量别空 | 主识别字段 |
| `model_cn` | 中文名 | 中文型号名或中文翻译 | 可空 | 没确认就留空 |如 `tatula会被翻译成蜘蛛` |
| `model_year` | 年份 | 型号年份 | 可空，优先拿去官网数据，没有官网数据使用玩家数据填充 | 如 `2026` |
| `type` | 渔轮类型 | `spinning` / `baitcasting` / `conventional` | 不能空 | 已有类型区分，靠它判断哪些字段更重要 |
| `alias` | 别名/系列别称 | 系列俗称或辅助搜索别名 | 可空 | 不要乱填 marketing 文案 |
| `type_tips` | 类型提示 | 简短补充提示 | 可空 | 当前口径不完全稳定 |
| `images` | 主图 | 图片 URL 或可映射路径 | 尽量别空 | 多张可逗号分隔 |
| `Description` | 主商品官网描述 | 系列/主商品在官网的描述文字 | 可空 | 这是主商品描述，不是子型号描述 |
| `official_reference_price` | 系列参考价 | 主商品官网价格区间 | 可空 | 如 `¥5,966 - ¥9,307` |
| `market_reference_price` | 市场参考价 | 面向用户展示的参考价 | 可空 | 若只有 detail 有，可先不填主表 |
| `series_positioning` | 系列定位 | 对系列的简短定位说明 | 可空 | 更偏补充层 |
| `main_selling_points` | 主要卖点 | 系列主卖点 | 可空 | 不进主对比 |
| `player_positioning` | 玩家数据系列定位 | 根据玩家描述提取对系列的简短定位说明 | 可空 | 更偏补充层 |
| `player_selling_points` | 玩家数据主要卖点 | 根据玩家描述提取系列主卖点 | 可空 | 不进主对比 |
| `market_status` | 市场状态 | `在售` / `停产` 等 | 可空 | 建议逐步维护 |

### 3.2 detail 通用字段（两张 detail 表都常见）

| 字段 | 中文意思 | 该填什么 | 没资料时 | 备注 |
|---|---|---|---|---|
| `id` | 子型号 ID | 子型号唯一 ID，如 `SRED10000` | 不能空 | 主键 |
| `reel_id` | 关联主商品 ID | 对应 `reel.xlsx.id` | 不能空 | 外键 |
| `SKU` | 子型号名称 | 具体规格名，如 `STELLA SW 4000HG` | 不能空 | 对比粒度核心字段 |
| `GEAR RATIO` | 速比 | 如 `5.7` | 尽量别空 | 官方参数 |
| `WEIGHT` | 自重(g) | 如 `360` | 尽量别空 | 官方参数 |
| `MAX DRAG` | 最大卸力(kg) | 如 `11` | 可空 | 官方参数 |
| `DRAG` | 实用卸力(kg) | 官网若给则填 | 可空 | 很多品牌会缺 |
| `cm_per_turn` | 每圈收线长度 | 如 `93` | 可空 | 很有比较价值 |
| `handle_length_mm` | 摇臂长度(mm) | 如 `65` | 可空 | 通用高价值字段 |
| `bearing_count_roller` | 轴承数/滚柱数 | 如 `11/1` | 可空 | 先保真，不做归一 |
| `market_reference_price` | 子型号参考价 | 具体规格价格 | 可空 | detail 层更常见 |
| `type` | 子型号轮型 | `spinning` / `baitcasting` / `conventional`| 可空 | 建议保持一致 |
| `Description` | 子型号官网描述 | 规格级描述文字 | 可空 | 仅当官网对该具体规格有单独描述时填写 |
| `variant_description` | 子型号官网描述 | 规格级描述文字 | 可空 | 如果表里已经独立建列，优先写这里，不和主表 `Description` 混用 |

### 3.3 纺车轮更常用字段（`spinning_reel_detail.xlsx`）

| 字段 | 中文意思 | 该填什么 | 没资料时 | 备注 |
|---|---|---|---|---|
| `Nylon_lb_m` | 尼龙线 lb-m | 如 `8-130` | 可空 | 官方容线量 |
| `Nylon_no_m` | 尼龙线 号-m | 如 `3-150` | 可空 | 官方容线量 |
| `fluorocarbon_lb_m` | 氟碳 lb-m | 按官网写 | 可空 | 官方容线量 |
| `fluorocarbon_no_m` | 氟碳 号-m | 按官网写 | 可空 | 官方容线量 |
| `pe_no_m` | PE 号-m | 如 `1.5-320, 2-240` | 可空 | 纺车轮很关键 |
| `is_sw_edition` | 是否 SW 版 | `1` 是，`0` 否 SKU中带有 `SW` 即判断为 `1` | 建议补 | 比单靠 `SW` 文本判断更稳 |
| `official_environment` | 官方环境定位 | 如 `saltwater` / `freshwater` | 可空 | 有明确口径再填 |
| `player_environment` | 玩家数据环境定位 | 根据玩家描述提取| 可空 | 优先保留官网明确口径 |
| `line_capacity_display` | 主容线展示字段 | 适合面向用户显示的一条主容线表达 | 可空 | 后续可统一成展示友好版本 |
| `is_handle_double` | 摇臂类型 |  `1` 是，`0` 否 | 可空 默认单摇臂 | 纺车轮专用 |官方明确或者采用玩家数据 |


### 3.4 水滴轮更常用字段（`baitcasting_reel_detail.xlsx`）

| 字段 | 中文意思 | 该填什么 | 没资料时 | 备注 |
|---|---|---|---|---|
| `DRAG_click` | 是否有卸力报警 | `1` 是，`0` 否  | 可空 | 纺车轮不用展示此字段，因为纺车轮装备属性99%都带有卸力报警，水滴轮此字段需要从玩家数据中获得 |
| `spool_diameter_mm` | 线杯直径 φ(mm) | 如 `34`、`38` | 值得优先补 | 高价值字段 |
| `spool_width_mm` | 线杯宽度(mm) | 如 `22`、`24` | 值得优先补 | 高价值字段 |
| `spool_weight_g` | 线杯重量(g) | 线杯裸重或常用口径重量 | 可空 | 深玩家高价值 |
| `spool_axis_type` | 线杯轴型 | `长轴` / `短轴` | 可空 | 深玩家高价值 |
| `knob_size` | 握丸尺寸 | 尺寸或规格 | 可空 | 改装/手感相关 |
| `knob_bearing_spec` | 握丸轴承规格 | 具体规格 | 可空 | 深玩家字段 |
| `handle_knob_type` | 握丸类型 | 如圆头 / T 型 / EVA | 可空 | 有资料再填 |
| `handle_knob_material` | 握丸材质 | 如塑料/橡胶/木质/某种金属 | 可空 | 官方明确或者采用玩家数据 |
| `handle_knob_exchange_size` | 握丸可替换规格 | 兼容规格描述 | 可空 | 改装兼容字段 |
| `handle_hole_spec` | 摇臂孔规格 | 具体规格 | 可空 | 改装兼容字段 |
| `body_material` | 机身材质 | 如铝、CI4+、镁等 | 可空 | 有资料再填 |
| `main_gear_material` | 大齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `main_gear_size` | 大齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `minor_gear_material` | 小齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `official_environment` | 官方环境定位 | 如 `freshwater` / `saltwater` | 可空 | 优先保留官网明确口径 |
| `player_environment` | 玩家数据环境定位 | 根据玩家描述提取| 可空 | 优先保留官网明确口径 |
| `usage_environment` | 使用环境备注 | 如 `近岸` / `船钓` / `远海` | 可空 | 可以比官方环境更贴近使用场景 |
| `line_capacity_display` | 主容线展示字段 | 一条可直接展示的容线描述 | 可空 | 建议整理成完整可读文本 |
| `battery_capacity` | 电池容量 | 具体容量值 | 可空 | 仅适用于特殊/电动轮型 | 仅用于daiwa IM Z系列水滴轮用的字段|
| `battery_charge_time` | 充电时间 | 如 `2h` | 可空 | 仅适用于特殊/电动轮型 | 仅用于daiwa IM Z系列水滴轮用的字段|
| `continuous_cast_count` | 连续抛投次数 | 官方给出的续航/次数 | 可空 | 仅适用于特殊/电动轮型 | 仅用于daiwa IM Z系列水滴轮用的字段|

### 3.5 Reel玩家数据字段（`baitcasting_reel_detail.xlsx`）
| 字段 | 中文意思 | 该填什么 | 没资料时 | 备注 |
|---|---|---|---|---|
| `model_cn` | 中文名 | 中文型号名或中文翻译 | 可空 | 没确认就留空 |如 `tatula会被翻译成蜘蛛` |
| `model_year` | 年份 | 型号年份 | 可空，优先拿去官网数据，没有官网数据使用玩家数据填充 | 如 `2026` `26``26款`|
| `DRAG_click` | 是否有卸力报警 | `1` 是，`0` 否  | 可空 | 纺车轮不用展示此字段，因为纺车轮装备属性99%都带有卸力报警，水滴轮此字段需要从玩家数据中获得 |
|`spool_diameter_mm` | 线杯直径 φ(mm) | 如 `34`、`38` | 值得优先补 | 高价值字段 |
| `spool_width_mm` | 线杯宽度(mm) | 如 `22`、`24` | 值得优先补 | 高价值字段 |
| `spool_weight_g` | 线杯重量(g) | 线杯裸重或常用口径重量 | 可空 | 深玩家高价值 |
| `spool_axis_type` | 线杯轴型 | `长轴` / `短轴` | 可空 | 深玩家高价值 |
| `knob_size` | 握丸尺寸 | 尺寸或规格 | 可空 | 改装/手感相关 |
| `knob_bearing_spec` | 握丸轴承规格 | 具体规格 | 可空 | 深玩家字段 |
| `handle_knob_type` | 握丸类型 | 如圆头 / T 型 / EVA | 可空 | 官方明确或者采用玩家数据 |
| `handle_knob_material` | 握丸材质 | 如塑料/橡胶/木质/某种金属 | 可空 | 官方明确或者采用玩家数据 |
| `handle_knob_exchange_size` | 握丸可替换规格 | 兼容规格描述 | 可空 | 改装兼容字段 |
| `handle_hole_spec` | 摇臂孔规格 | 具体规格 | 可空 | 改装兼容字段，官方明确或者采用玩家数据 |
| `body_material` | 机身材质 | 如铝、CI4+、镁等 | 可空 | 官方明确或者采用玩家数据 |
| `is_handle_double` | 摇臂类型 |  `1` 是，`0` 否 | 可空 默认单摇臂 | 纺车轮专用 |官方明确或者采用玩家数据 |
| `main_gear_material` | 大齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `main_gear_size` | 大齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `minor_gear_material` | 小齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `market_reference_price` | 市场参考价 | 根据玩家描述提取| 可空 | 若只有 detail 有，可先不填主表 |
| `player_environment` | 玩家数据环境定位 | 根据玩家描述提取| 可空 | 优先保留官网明确口径 |
| `player_positioning` | 玩家数据系列定位 | 根据玩家描述提取对系列的简短定位说明 | 可空 | 更偏补充层 |
| `player_selling_points` | 玩家数据主要卖点 | 根据玩家描述提取系列主卖点 | 可空 | 不进主对比 |
---

## 四、这些字段建议让服务器算

下面这些字段更适合后端 derive，不建议你手动在 Excel 里到处补：

- `size_family`
- `spool_depth_normalized`
- `brake_type_normalized`
- `gear_ratio_normalized`
- `fit_style_tags`
- `compareWarnings`
- `line_focus`
- `retrieve_style_profile`
- `saltwater_scope`
- `reel_usage_family`

原因：
- 它们更像“GearSage 解释层”
- 会随着规则迭代而变化
- 让服务器统一判断，比手工一条条维护稳定

---

## 五、当前最容易混淆的几个点

### 5.1 `Description`

- 主表里的 `Description`
  - 是主商品 / 系列层官网描述
- detail 里的 `Description`
  - 是子型号 / 规格级官网描述

两者不要混。

### 5.2 `SW`

- 当前建议最终补成 `is_sw_edition`
- 统一填写 `1 / 0`
- 不要长期只靠 `SKU / model` 里有没有 `SW` 来判断

### 5.3 `spool_diameter_per_turn_mm`

- 这是历史组合字段
- 它不等于单独的 `spool_diameter_mm`
- 如果能拿到明确线杯直径 φ，优先补 `spool_diameter_mm`

### 5.4 `brake_type_normalized`

- 不建议手工主维护
- 更适合服务器根据型号信号和已知参数归一出：
  - `DC`
  - `磁力`
  - `离心`

### 5.5 `type`

- 主表 `type` 已经能区分：
  - `spinning`
  - `baitcasting`
- 所以你填表时不用再额外想一套复杂规则
- 通用字段尽量补
- 纺车轮重点补纺车轮关键字段
- 水滴轮重点补水滴轮关键字段

### 5.6 `official_environment` 和 `usage_environment`

- `official_environment`
  - 写官网明确环境定位
  - 没明确口径就留空
- `usage_environment`
  - 写更贴近实际使用的场景说明
  - 如 `近岸`、`船钓`、`远海`

### 5.7 `variant_description`

- 如果官网对某个具体规格有单独描述，优先写在 `variant_description`
- 主表 `Description` 继续只表示系列 / 主商品层官网描述

---

## 六、当前最值得优先补的字段

如果现在只补最有价值的一小批，建议按这个顺序：

1. `is_sw_edition`
2. `spool_diameter_mm`
3. `spool_width_mm`
4. `spool_weight_g`
5. `spool_axis_type`
6. `knob_size`

---

## 七、一句话口径

这份文档回答的是：

> **渔轮表格正在填写时，这个字段到底是什么意思、该不该填、没有资料能不能留空。**
