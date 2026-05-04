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

- 字段统一口径：
  [渔轮字段统一口径_v1.md](/Users/tommy/GearSage/GearSage-client/docs/渔轮字段统一口径_v1.md)
- 总体施工口径：
  [装备库字段主清单_v0.md](/Users/tommy/GearSage/GearSage-client/docs/装备库字段主清单_v0.md)
- 完整字段解释：
  [装备库字段解释手册_v1.md](/Users/tommy/GearSage/GearSage-client/docs/装备库字段解释手册_v1.md)

补充一句当前执行口径：

**在当前不继续扩字段的前提下，**
[`shimano_baitcasting_reels_import.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import.xlsx)
**就是以后其他品牌水滴轮的中间层标准模板。**

---

## 一点五、当前实际落表对齐情况（2026-04-16）

这部分只说当前现实，不说理想。

### 1. 当前已经对齐到最终总表的 reel 字段

下面这些字段，当前 `pkgGear/data_raw` 工作副本和 `rate/excel` 最终表都能接住：

- 主表：
  - `model_year`
  - `alias`
- detail：
  - `body_material`
  - `body_material_tech`
  - `gear_material`
  - `official_environment`
  - `line_capacity_display`
  - `is_sw_edition`
  - `variant_description`

### 2. 当前已经进入最终总表的补充字段

下面这些字段现在已经进入 `rate/excel` 最终表，不再属于“只在中间层里有”：

- 主表：
  - `Description`
  - `market_reference_price`
  - `player_positioning`
  - `player_selling_points`
- `spinning_reel_detail.xlsx`：
  - `Description`
  - `body_material`
  - `body_material_tech`
  - `gear_material`
  - `official_environment`
  - `line_capacity_display`
  - `is_sw_edition`
  - `variant_description`
  - `player_environment`
  - `is_handle_double`
- `baitcasting_reel_detail.xlsx`：
  - `Description`
  - `body_material`
  - `body_material_tech`
  - `gear_material`
  - `official_environment`
  - `line_capacity_display`
  - `is_sw_edition`
  - `variant_description`
  - `spool_weight_g`
  - `spool_axis_type`
  - `knob_size`
  - `knob_bearing_spec`
  - `custom_spool_compatibility`
  - `custom_knob_compatibility`
  - `handle_knob_material`
  - `handle_hole_spec`
  - `main_gear_material`
  - `main_gear_size`
  - `minor_gear_material`
  - `player_environment`

### 3. 当前只在审计 / sidecar 层承载，不进最终表的字段

- `version_signature`
- `canonical_alias`
- `gear_material` 的 `inferred` 语义
- `gear_material` 的 `confirmed_blank` 语义

### 4. 当前最需要记住的一句话

**字段是否已经在最终总表里，当前就按这份文档理解。**

如果后面有旧文档还写着“`rate/excel` 还没有对应列”，要以这里和实际表结构为准。

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
| `model_cn` | 中文名 | 中文型号名或中文翻译 | 可空 | 没确认就留空，如 `tatula` 不要直接机械翻成“蜘蛛” |
| `model_year` | 年份 | 型号年份 | 可空，优先官网；官网没有时先走白名单辅助站做 identity enrichment，再不行才人工确认 | 如 `2026` |
| `type` | 渔轮类型 | `spinning` / `baitcasting` / `drum` | 不能空 | 当前 Shimano 水滴轮中间层已把鼓轮从 `baitcasting` 里拆成 `drum` 分支 |
| `alias` | 别名/系列别称 | baseline 单列只落 `normalized_alias` | 可空 | `canonical_alias` 留审计/sidecar；不要把活动页标题、栏目尾巴、marketing 文案直接写进 alias |
| `type_tips` | 类型提示 | 简短补充提示 | 可空 | 当前口径不完全稳定 |
| `images` | 主图 | 最终资源链接 | 尽量别空 | 当前 reel 主图统一写静态资源链接，不写本地路径；Shimano 水滴轮当前口径为 `https://static.gearsage.club/gearsage/Gearimg/images/shimano_reels/文件名` |
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
| `type` | 子型号轮型 | `spinning` / `baitcasting` / `drum`| 可空 | 当前 Shimano 水滴轮中间层已把鼓轮从 `baitcasting` 里拆成 `drum` 分支 |
| `Description` | 子型号官网描述 | 规格级描述文字 | 可空 | 仅当官网对该具体规格有单独描述时填写 |
| `variant_description` | 子型号官网描述 | 规格级描述文字 | 可空 | 如果表里已经独立建列，优先写这里，不和主表 `Description` 混用 |
| `EV_link` | 爆炸图链接 | 子型号对应的分解图/价格表链接 | 可空 | 优先用官方售后/维修站对应子型号页面 |
| `Specs_link` | 说明书链接 | 子型号对应的说明书 PDF 链接 | 可空 | 能拿到就写，拿不到留空 |

### 3.3 纺车轮更常用字段（`spinning_reel_detail.xlsx`）

| 字段 | 中文意思 | 该填什么 | 没资料时 | 备注 |
|---|---|---|---|---|
| `Nylon_lb_m` | 尼龙线 lb-m | 如 `8-130` | 可空 | 官方容线量 |
| `Nylon_no_m` | 尼龙线 号-m | 如 `3-150` | 可空 | 官方容线量 |
| `fluorocarbon_lb_m` | 氟碳 lb-m | 按官网写 | 可空 | 官方容线量 |
| `fluorocarbon_no_m` | 氟碳 号-m | 按官网写 | 可空 | 官方容线量 |
| `pe_no_m` | PE 号-m | 如 `1.5-320, 2-240` | 可空 | 纺车轮很关键 |
| `spool_diameter_mm` | 线杯直径 φ(mm) | 如 `63`、`67` | 可空 | 详情图里有明确线杯径时应补，和 `spool_diameter_per_turn_mm` 不是一回事 |
| `body_material` | 机体组成/机身材质 | 如 `鋁製`、`Magnesium`、`Aluminum alloy` | 可空 | 主值只放材质或机体组成核心值，不混技术名 |
| `handle_knob_type` | 握丸形状 | 如 `圓形`、`高抓握蛋形`、`EVA 圓形` | 可空 | 优先保留官网详情图里的原始表达 |
| `is_sw_edition` | 是否 SW 版 | `1` 是，`0` 否 | 建议补 | 当前只对纺车轮起效；水滴轮保持空值 |
| `official_environment` | 官方环境定位 | 如 `saltwater` / `freshwater` | 可空 | 有明确口径再填 |
| `player_environment` | 玩家数据环境定位 | 根据玩家描述提取 | 可空 | 这是玩家补充口径，不覆盖 `official_environment` |
| `line_capacity_display` | 主容线展示字段 | 适合面向用户显示的一条主容线表达 | 可空 | 后续可统一成展示友好版本 |
| `spool_depth_normalized` | 线杯深度归一 | 如 `特超浅线杯` / `超浅线杯` / `浅线杯` / `中浅线杯` / `中线杯` / `标准` | 可空 | 当前 Shimano 纺车轮可直接按 SKU 规则解析；无标注写 `标准` |
| `is_compact_body` | 是否紧凑机身 | `是` / 空 | 可空 | Daiwa 纺车轮型号里尺寸/线杯后出现 `-C`（如 `LT2500-C`、`LT2500S-CXH`、`LT3000-CH`）视为紧凑机身 |
| `is_handle_double` | 是否双摇臂 | `1` 是，`0` 否 | 可空，默认按单摇臂理解 | 更偏纺车轮字段；Daiwa 纺车轮 SKU 末尾带 `DH` 视为双摇臂 |
| `handle_style` | 手把样式 | 如 `单摇臂` / `双摇臂` / `折叠` | 可空 | GearSage 归纳层字段；Daiwa 纺车轮 SKU 末尾带 `DH` 填 `双摇臂` |
| `min_lure_weight_hint` | 建议最低舒适饵重 | 如 `约 3g+`、`约 5g+` | 可空 | GearSage 经验提示字段，不等于官方值 |


### 3.4 水滴轮更常用字段（`baitcasting_reel_detail.xlsx`）

| 字段 | 中文意思 | 该填什么 | 没资料时 | 备注 |
|---|---|---|---|---|
| `drag_click` | 是否有卸力报警 | `1` 是，`0` 否 | 可空 | 水滴轮更有区分价值；纺车轮通常默认带有此能力，不必强行补满 |
| `spool_diameter_mm` | 线杯直径 φ(mm) | 如 `34`、`38` | 值得优先补 | 高价值字段 |
| `spool_width_mm` | 线杯宽度(mm) | 如 `22`、`24` | 值得优先补 | 高价值字段 |
| `spool_weight_g` | 线杯重量(g) | 线杯裸重或常用口径重量 | 可空 | 深玩家高价值 |
| `spool_axis_type` | 线杯轴型 | `长轴` / `短轴` | 可空 | 深玩家高价值 |
| `knob_size` | 握丸尺寸 | 尺寸或规格 | 可空 | 改装/手感相关 |
| `knob_bearing_spec` | 握丸轴承规格 | 具体规格 | 可空 | 深玩家字段 |
| `handle_knob_type` | 握丸类型 | 如圆头 / T 型 / EVA | 可空 | 有资料再填 |
| `handle_knob_material` | 握丸材质 | 如塑料 / 橡胶 / 木质 / 金属 | 可空 | 官方明确或有可靠玩家资料再填 |
| `handle_knob_exchange_size` | 握丸可替换规格 | 兼容规格描述 | 可空 | 改装兼容字段 |
| `handle_hole_spec` | 摇臂孔规格 | 具体规格 | 可空 | 改装兼容字段 |
| `body_material` | 机身材质 | 如 `Magnesium`、`Aluminum alloy` 这类纯材质值 | 可空 | 主值只放纯材质，不混技术名 |
| `body_material_tech` | 商品技术名合集 | 如 `HAGANE 机身`、`CORESOLID BODY`、`HYPERDRIVE DESIGN`、`TWS`、`MAGFORCE`、`SV BOOST` | 可空 | 历史字段名保留；不再限定为机身技术，纯材质仍只进 `body_material` |
| `gear_material` | 主齿材质 | 明确材质词，如 `Brass`、`Duralumin`、`Aluminum` | 可空 | 当前按 `direct_write / cross_source_inferred / manual_required` 三档处理，不接受技术词冒充材质 |
| `main_gear_material` | 大齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `main_gear_size` | 大齿尺寸 | 官方明确或者采用玩家数据 | 可空 | 不猜，优先保留原始口径 |
| `minor_gear_material` | 小齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `official_environment` | 官方环境定位 | 如 `freshwater` / `saltwater` | 可空 | 优先保留官网明确口径 |
| `player_environment` | 玩家数据环境定位 | 根据玩家描述提取 | 可空 | 这是玩家补充口径，不覆盖 `official_environment` |
| `usage_environment` | 使用环境备注 | 如 `近岸` / `船钓` / `远海` | 可空 | 可以比官方环境更贴近使用场景 |
| `min_lure_weight_hint` | 建议最低舒适饵重 | 如 `约 3g+`、`约 5g+` | 可空 | GearSage 经验提示字段，不等于官方值 |
| `handle_style` | 手把样式 | 如 `单摇臂` / `双摇臂` / `折叠` | 可空 | GearSage 归纳层字段，先保留简单枚举 |
| `line_capacity_display` | 主容线展示字段 | 一条可直接展示的容线描述 | 可空 | 建议整理成完整可读文本 |
| `battery_capacity` | 电池容量 | 具体容量值 | 可空 | 仅适用于特殊/电动轮型，如 Daiwa IM Z |
| `battery_charge_time` | 充电时间 | 如 `2h` | 可空 | 仅适用于特殊/电动轮型，如 Daiwa IM Z |
| `continuous_cast_count` | 连续抛投次数 | 官方给出的续航/次数 | 可空 | 仅适用于特殊/电动轮型，如 Daiwa IM Z |

### 3.5 Reel 玩家补充字段（按实际落点使用）

这一组不是“只属于某一张表”的字段，而是当前更适合从玩家资料里补的字段。  
落表时按字段语义决定进主表还是 detail，不要为了方便全塞进同一张表。

| 字段 | 中文意思 | 该填什么 | 没资料时 | 备注 |
|---|---|---|---|---|
| `model_cn` | 中文名 | 中文型号名或中文翻译 | 可空 | 没确认就留空，如 `tatula` 不要直接机械翻成“蜘蛛” |
| `model_year` | 年份 | 型号年份 | 可空，优先官网；官网没有时先走白名单辅助站做 identity enrichment，再不行才人工确认 | 如 `2026` `26``26款`|
| `drag_click` | 是否有卸力报警 | `1` 是，`0` 否 | 可空 | 水滴轮更有区分价值；纺车轮通常默认带有此能力，不必强行补满 |
|`spool_diameter_mm` | 线杯直径 φ(mm) | 如 `34`、`38` | 值得优先补 | 高价值字段 |
| `spool_width_mm` | 线杯宽度(mm) | 如 `22`、`24` | 值得优先补 | 高价值字段 |
| `spool_weight_g` | 线杯重量(g) | 线杯裸重或常用口径重量 | 可空 | 深玩家高价值 |
| `spool_axis_type` | 线杯轴型 | `长轴` / `短轴` | 可空 | 深玩家高价值 |
| `min_lure_weight_hint` | 建议最低舒适饵重 | 如 `约 3g+`、`约 5g+` | 可空 | GearSage 经验提示字段，不冒充官方值 |
| `knob_size` | 握丸尺寸 | 尺寸或规格 | 可空 | 改装/手感相关 |
| `knob_bearing_spec` | 握丸轴承规格 | 具体规格 | 可空 | 深玩家字段 |
| `handle_knob_type` | 握丸类型 | 如圆头 / T 型 / EVA | 可空 | 官方明确或者采用玩家数据 |
| `handle_knob_material` | 握丸材质 | 如塑料 / 橡胶 / 木质 / 金属 | 可空 | 官方明确或有可靠玩家资料再填 |
| `handle_knob_exchange_size` | 握丸可替换规格 | 兼容规格描述 | 可空 | 改装兼容字段 |
| `handle_hole_spec` | 摇臂孔规格 | 具体规格 | 可空 | 改装兼容字段，官方明确或者采用玩家数据 |
| `custom_spool_compatibility` | 改装线杯兼容 | 兼容规格描述 | 可空 | 字段保留，当前暂停持续自动抓取；已有值可暂存 |
| `custom_knob_compatibility` | 改装握丸兼容 | 兼容规格描述 | 可空 | 字段保留，当前暂停持续自动抓取；已有值可暂存 |
| `body_material` | 机身材质 | 如 `Magnesium`、`Aluminum alloy` 这类纯材质值 | 可空 | 官方明确或者采用玩家数据；主值只放纯材质 |
| `body_material_tech` | 商品技术名合集 | 如 `HAGANE 机身`、`CORESOLID BODY`、`HYPERDRIVE DESIGN`、`TWS`、`MAGFORCE`、`SV BOOST` | 可空 | 历史字段名保留；不再限定为机身技术，纯材质仍只进 `body_material` |
| `gear_material` | 主齿材质 | 明确材质词，如 `Brass`、`Duralumin`、`Aluminum` | 可空 | 当前按 `direct_write / cross_source_inferred / manual_required` 三档处理 |
| `is_handle_double` | 是否双摇臂 | `1` 是，`0` 否 | 可空，默认按单摇臂理解 | 更偏纺车轮字段，优先依据官方信息或可靠玩家资料 |
| `main_gear_material` | 大齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `main_gear_size` | 大齿尺寸 | 官方明确或者采用玩家数据 | 可空 | 不猜，优先保留原始口径 |
| `minor_gear_material` | 小齿材质 | 官方明确或者采用玩家数据 | 可空 | 不猜 |
| `handle_style` | 手把样式 | 如 `单摇臂` / `双摇臂` / `折叠` | 可空 | GearSage 归纳层字段，优先按实际结构填写 |
| `market_reference_price` | 市场参考价 | 根据玩家描述提取| 可空 | 若只有 detail 有，可先不填主表 |
| `series_positioning` | 系列定位 | 根据白名单/玩家资料提取的系列简短定位说明 | 可空 | 主商品字段；官网几乎没有时允许由白名单补 |
| `main_selling_points` | 主要卖点 | 根据白名单/玩家资料提取的系列主卖点 | 可空 | 主商品字段；官网几乎没有时允许由白名单补 |
| `player_environment` | 玩家数据环境定位 | 根据玩家描述提取 | 可空 | 这是玩家补充口径，不覆盖 `official_environment` |
| `player_positioning` | 玩家数据系列定位 | 根据玩家描述提取对系列的简短定位说明 | 可空 | 更偏补充层 |
| `player_selling_points` | 玩家数据主要卖点 | 根据玩家描述提取系列主卖点 | 可空 | 不进主对比 |
| `usage_environment` | 使用环境备注 | 如 `近岸` / `船钓` / `远海` | 可空 | 可以比官方环境更贴近使用场景 |
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

### 5.8 `alias`

- 当前真实执行口径不是“只有一个 alias 值”
- 现在实际分成：
  - `canonical_alias`
  - `normalized_alias`
- baseline 单列只写 `normalized_alias`
- `canonical_alias` 保留在审计 / sidecar，不直接丢

### 5.9 `gear_material`

- 当前它不是普通补值字段
- 不能因为 JapanTackle 没写，就直接理解成“没有这个字段”
- 当前正式口径是：
  - `direct_write`
  - `cross_source_inferred`
  - `manual_required`
- `inferred` 可以进入审计和中间层，但不能冒充 `official`

### 5.10 `version_signature`

- 当前已经参与 identity enrichment
- 但本轮仍然是 `sidecar-only`
- 还没有进入 baseline，也没有进入最终总表列

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
