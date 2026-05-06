# GearSage 装备库字段扩充与爬取分层规范 v1

版本：v1.1  
状态：已从骨架版补到可执行版，后续可继续按大类迭代  
适用范围：GearSage-client / GearSage-api / 装备采集链 / Excel 维护源 / PostgreSQL 导入链 / 小程序装备库详情页 / 对比页 / 求推荐承接  
更新时间：2026-04-14

---

## 一、文档定位

这份文档不是“现有字段解释手册”，也不是“某一次采集任务备注”。

它的目标是作为后续装备库字段设计的主骨架，用来统一回答以下问题：

1. 每个装备大类到底该重点展示哪些字段
2. 哪些字段属于官方参数，哪些属于 GearSage 归纳字段，哪些属于玩家深度字段
3. 哪些字段适合单品深读，哪些字段适合横向对比
4. 哪些字段已经有、哪些字段缺失、哪些字段目前定义模糊
5. 哪些字段值得继续爬，哪些字段更适合人工维护或玩家实测补充
6. Excel / PostgreSQL / 前端展示层应该如何对齐

一句话：

> 这份文档回答的是“下一步该怎么扩字段，以及扩完以后字段该落到哪里”。

---

## 二、与其他文档的分工

### 2.1 这份文档负责

- 字段分层
- 字段优先级
- 字段展示位置
- 字段来源口径
- 字段落表规范
- 字段扩充决策
- 三大类装备的“当前拥有字段 vs 目标重要字段”判断

### 2.2 这份文档不直接负责

- 具体页面视觉稿
- 某个品牌单次采集脚本实现
- 一次性的字段解释
- 具体 SQL / DTO / API 代码实现

### 2.3 相关文档分工

- `装备库字段解释手册_v1.md`：解释当前 Excel 里已经存在的字段是什么意思。
- `GearSage_装备库与装备对比设计文档_v1.md`：定义详情页 / 对比页 / 去求推荐的产品结构。
- `GearLibraryDocumentation.md`：定义当前装备库数据链、接口与前端消费逻辑。
- `装备库数据扩充标准作业规程 (SOP).md` / `装备扩充操作清单_v1.md`：定义抓取、差异报告、导库前校验的固定操作流程。

---

## 三、核心设计原则

1. 装备库不是“把官网参数堆出来”的资料页。
2. 不是字段越多越好，而是字段分层越清楚越好。
3. 不同装备大类必须分别设计，不能共用一套字段思维。
4. 详情页和对比页要服务两个不同场景：
   - 单一产品细节了解
   - 多款产品横向对比
5. 玩家真正关心、但官网通常不给的深度字段，必须单独归层，不能伪装成官方参数。
6. 不是所有重要字段都必须进 Excel 主表；覆盖不足、来源不稳的字段可以先放在中间层、补充层或玩家深度字段池。
7. 未确认字段宁可不展示，也不要装成确定事实。

---

## 四、当前产品与数据链基线

### 4.1 当前前后端结构基线

当前装备库第一版已经形成：

- `GET /mini/gear/brands`
- `GET /mini/gear/list`
- `GET /mini/gear/detail`

前端详情页与对比页当前优先消费三层增量返回：

- `official_specs`
- `gsc_traits`
- `compare_profile`

缺失时再回退旧的平铺字段或 `raw_json`。第一版对比页不新增独立 compare 接口，而是复用详情接口聚合对比。  

### 4.2 当前数据链基线

当前装备库源数据链路已经固定为：

`抓取 / normalized.json / data_raw 导出 / 差异报告 / rate/excel 最终基准 / PostgreSQL / 前端返回结构`

其中：

- `rate/excel` 是最终基准
- `pkgGear/data_raw` 是抓取、清洗、导出中间层
- 默认冻结最终表结构，优先补内容，再看是否值得改字段结构

---

## 五、统一字段分层模型

后续所有装备字段，统一按以下三层设计：

### 5.1 `official_specs`

含义：
- 来自官网 / 官方表格 / 官方结构化说明
- 相对客观
- 可稳定重复采集

适合：
- 详情页核心参数
- 详情页完整规格
- 对比页主对比字段
- 部分筛选字段

### 5.2 `gsc_traits`

含义：
- GearSage 归一 / 解释 / 推导字段
- 不等同于官方参数

适合：
- GearSage 总结
- 差异解释
- 使用场景提示
- 风格标签
- 错误比较提醒

### 5.3 `deep_fields`

含义：
- 深玩家字段
- 改装字段
- 实测字段
- 弱结构、覆盖不稳定，但非常有价值的字段

适合：
- 单品深读
- 改装 / 配件 / 兼容性判断
- 后续玩家贡献 / 人工维护

不适合直接进入第一版主对比。

### 5.4 `compare_profile` 的边界

`compare_profile` 不是第四套字段仓库，而是对比页消费层。它负责：

- `compareGroup`
- `coreFieldKeys`
- `warningHints`
- `fitStyleTags`

它引用的是 `official_specs` 和 `gsc_traits` 的结果，不应该反向成为“乱塞新字段”的地方。

---

## 六、统一字段标注模板

后续每个字段至少带这几个标签：

| 标签 | 说明 |
|---|---|
| `field_key` | 字段名 |
| `category` | reel / rod / lure / line / hook |
| `layer` | official_specs / gsc_traits / deep_fields |
| `source_type` | official / derived / player / manual |
| `scene_scope` | detail / compare / both |
| `display_position` | list / detail_core / detail_full / compare / deep_read |
| `filter_enabled` | 是否参与筛选 |
| `compare_enabled` | 是否参与主对比 |
| `priority` | P0 / P1 / P2 |
| `coverage_status` | 已有 / 缺失 / 模糊 |
| `evidence_required` | 是否必须保留证据链 |
| `landing_hint` | excel_structured / raw_json / derived_runtime / side_table / manual_pool |

说明：

- `landing_hint` 是这版新增的执行字段，用来避免“字段讨论完了，但不知道该落到哪里”。
- `excel_structured` 只给强结构、值得长期维护的字段。
- `manual_pool` 主要给深玩家字段或后续玩家实测字段池。

---

## 七、来源口径：后续所有字段先判来源，再判位置

### 7.1 `official`

特点：
- 来自官网参数表、规格表、正式产品页
- 重复采集稳定
- 适合进 `official_specs`

### 7.2 `derived`

特点：
- 由 GearSage 基于已有参数做归一、归类、解释
- 适合进 `gsc_traits`
- 例如：浅杯 / 深杯、速比归一、用途标签

### 7.3 `player`

特点：
- 来自玩家实测、改装经验、长期使用经验
- 高价值但覆盖天然不完整
- 更适合进入 `deep_fields`

### 7.4 `manual`

特点：
- 来自人工补录、人工确认、编辑整理
- 适用于品牌技术、系列定位、看点摘要、结构巧思摘要

原则：

> 先承认字段来源不同，再决定字段该不该进主表。  
> 不要把玩家实测字段伪装成官网字段，也不要把营销文案伪装成客观参数。

---

## 八、按大类拆分

第一版先只做三类：

1. 渔轮 `reel`
2. 鱼竿 `rod`
3. 鱼饵 `lure`

后续再扩：

4. 鱼线 `line`
5. 鱼钩 `hook`
6. 其他 `other`

---

# 九、渔轮字段规范

## 9.1 设计目标

渔轮要同时服务两种用户：

- 普通用户：先看核心差异，知道这颗轮子大概是什么定位
- 深玩家：进一步判断它值不值得买、怎么改、能改到什么程度

所以渔轮字段不能只停在：

- 速比
- 最大卸力
- 自重
- 容线量

这些只是基础。更能留住人的，是：

- 线杯相关
- 摇臂 / 握丸相关
- 刹车 / 线杯深度 / 风格归一
- 改装兼容性

## 9.2 场景 A：单一产品细节了解

用户已基本确定某颗轮子，想进一步了解：

- 它的真实定位
- 它的核心参数差异
- 它值不值得改装
- 它适配哪些线杯 / 摇臂 / 握丸 / 配件

### A. 当前已拥有并适合详情页重点展示的字段

#### 主型号识别层
- `model`
- `model_cn`
- `model_year`
- `alias`
- `type`
- `images`
- `series_positioning`
- `main_selling_points`
- `official_reference_price`
- `market_status`

#### SKU 级官方参数层
- `GEAR RATIO`
- `MAX DRAG`
- `WEIGHT`
- `spool_diameter_per_turn_mm`
- `Nylon_lb_m / Nylon_no_m`
- `fluorocarbon_lb_m / fluorocarbon_no_m`
- `pe_no_m`
- `cm_per_turn`
- `handle_length_mm`
- `bearing_count_roller`
- `market_reference_price`
- `product_code`

#### 当前已经存在、但更应该被用好的字段
- `spool_diameter_mm`
- `spool_width_mm`
- `handle_knob_type`
- `handle_knob_exchange_size`
- `body_material`
- `gear_material`
- `usage_environment`
- `drag_click`
- `spool_depth_normalized`
- `gear_ratio_normalized`
- `brake_type_normalized`
- `fit_style_tags`
- `min_lure_weight_hint`
- `is_compact_body`
- `handle_style`

### B. 当前缺失但重要的字段

这些字段很有价值，但不建议硬要求第一版全覆盖：

- `spool_weight_g`
- `spool_axis_type`
- `knob_size`
- `knob_bearing_spec`
- `handle_hole_spec`
- `custom_spool_compatibility`
- `custom_knob_compatibility`
- `sweet_spot_lure_weight_real`
- `cast_feel_note`
- `drag_feel_note`

### C. 当前定义模糊、需要先定口径的字段

- `spool_diameter_per_turn_mm`：若内容混合“线杯径 / 一圈回收 / 行程说明”，要先拆清再决定展示名。
- `DRAG` 与 `MAX DRAG`：若品牌写法不一致，详情页统一优先展示 `MAX DRAG`，`DRAG` 只在有明确定义时展示。
- `MAX_DURABILITY`：当前覆盖不稳，不应进入主对比。
- `handle_knob_exchange_size`：若只是部分品牌写法，先保留为深读字段，不急于强结构化到筛选。

## 9.3 场景 B：多款产品横向对比

用户有 2~3 个候选，想快速知道：

- 核心差异到底在哪
- 哪些字段值得放进主对比
- 哪些字段应该放到深读层

### A. 第一版建议进入主对比的字段

#### 官方参数主对比
- `GEAR RATIO`
- `MAX DRAG`
- `WEIGHT`
- `Nylon_lb_m / pe_no_m`
- `cm_per_turn`
- `handle_length_mm`
- `spool_diameter_mm`（水滴轮优先）
- `spool_width_mm`（水滴轮可选）

#### GearSage 解释层主对比
- `spool_depth_normalized`
- `gear_ratio_normalized`
- `brake_type_normalized`
- `fit_style_tags`
- `warning_hints`
- `is_compact_body`

### B. 第一版不建议进入主对比的字段

- `spool_weight_g`
- `spool_axis_type`
- `knob_size`
- `knob_bearing_spec`
- `handle_hole_spec`
- `custom_spool_compatibility`
- `custom_knob_compatibility`
- 各种主观实测体验描述

原因：

这些字段要么覆盖不足，要么更偏单品研究和改装，不适合第一版泛用户主对比。

## 9.4 渔轮字段清单（第一版执行表）

| 字段 | 当前状态 | layer | source | display_position | compare_enabled | landing_hint | 备注 |
|---|---|---|---|---|---|---|---|
| `GEAR RATIO` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 渔轮核心字段 |
| `MAX DRAG` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 主对比字段 |
| `WEIGHT` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 主对比字段 |
| `Nylon_lb_m` | 已有 | official_specs | official | detail_full / compare | 是 | excel_structured | 容线量主字段 |
| `pe_no_m` | 已有 | official_specs | official | detail_full / compare | 是 | excel_structured | 容线量主字段 |
| `cm_per_turn` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 一圈回收长度 |
| `handle_length_mm` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 深玩家也关心 |
| `spool_diameter_mm` | 已有（部分） | official_specs | official | detail_core / compare | 是 | excel_structured | 水滴轮价值高 |
| `spool_width_mm` | 已有（部分） | official_specs | official | detail_full / compare | 条件是 | excel_structured | 有值时参与 |
| `handle_knob_type` | 已有（部分） | official_specs | official | detail_full / deep_read | 否 | excel_structured | 深读价值大 |
| `handle_knob_exchange_size` | 已有（部分） | official_specs | official | detail_full / deep_read | 否 | excel_structured | 改装价值大 |
| `spool_depth_normalized` | 已有 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 当前可先后端归纳 |
| `gear_ratio_normalized` | 已有 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 低速/中速/高速 |
| `brake_type_normalized` | 已有（部分） | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 水滴轮关键归一 |
| `fit_style_tags` | 已有（部分） | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | BFS / 泛用 / 远投 |
| `spool_weight_g` | 已有（列已建立，覆盖待补） | deep_fields | player/manual | deep_read | 否 | excel_structured / manual_pool | 后续玩家层 |
| `spool_axis_type` | 已有（列已建立，覆盖待补） | deep_fields | player/manual | deep_read | 否 | excel_structured / manual_pool | 长轴 / 短轴 |
| `knob_size` | 已有（列已建立，覆盖待补） | deep_fields | player/manual | deep_read | 否 | excel_structured / manual_pool | 改装价值大 |
| `knob_bearing_spec` | 已有（列已建立，覆盖待补） | deep_fields | player/manual | deep_read | 否 | excel_structured / manual_pool | 改装价值大 |
| `handle_hole_spec` | 已有（列已建立，覆盖待补） | deep_fields | player/manual | deep_read | 否 | excel_structured / manual_pool | 改装价值大 |
| `custom_spool_compatibility` | 已有（列已建立，覆盖待补） | deep_fields | player/manual | deep_read | 否 | excel_structured / side_table | 适合兼容表 |
| `custom_knob_compatibility` | 已有（列已建立，覆盖待补） | deep_fields | player/manual | deep_read | 否 | excel_structured / side_table | 适合兼容表 |

## 9.5 渔轮当前判断

结论：

- 渔轮第一刀不是“再加更多基础参数”，而是把**当前已有但没被重点使用好的字段**先提上来。
- `spool_diameter_mm / spool_width_mm / handle_knob_type / handle_knob_exchange_size / spool_depth_normalized / brake_type_normalized` 这一组，是当前最值得优先收口的渔轮字段。
- 真正更深的改装字段，不要为了结构整齐而硬塞进第一版主表。

---

# 十、鱼竿字段规范

## 10.1 设计目标

鱼竿和渔轮不同，鱼竿更容易出现“官网参数挺多，但真正决定体验的信息还不够直观”的问题。

所以鱼竿字段的重点是：

- 把结构参数讲明白
- 把调性 / 力量 / 使用边界归一清楚
- 把“纸面参数”和“真实手感”拆层

## 10.2 场景 A：单一产品细节了解

用户想知道：

- 这根竿的真正定位
- 纸面参数之外的手感倾向
- 适合什么饵、什么场景、什么玩法

### A. 当前已拥有并适合详情页重点展示的字段

#### 主型号识别层
- `model`
- `model_cn`
- `model_year`
- `alias`
- `type_tips`
- `images`
- `series_positioning`
- `main_selling_points`
- `official_reference_price`
- `market_status`
- `player_positioning`
- `player_selling_points`
- `product_technical`（子型号适用技术名合集；只从品牌官网 / 官方页面获取，多个技术名用 ` / ` 分隔）
- `Description`（主型号简介）

#### SKU 级官方参数层
- `TYPE`
- `SKU`
- `TOTAL LENGTH`
- `Action`
- `PIECES`
- `CLOSELENGTH`
- `WEIGHT`
- `Tip Diameter`
- `LURE WEIGHT`
- `Line Wt N F`
- `PE Line Size`
- `Handle Length`
- `Reel Seat Position`
- `CONTENT CARBON`
- `Market Reference Price`
- `POWER`
- `Joint Type`
- `Grip Type`
- `Reel Size`

#### 当前已经存在、但更应该被用好的字段
- `Description`（主型号 / 子型号）
- `Extra Spec 1`
- `Extra Spec 2`
- `POWER`
- `CLOSELENGTH`
- `Handle Length`
- `Joint Type`
- `Grip Type`

### B. 当前缺失但重要的字段

- `power_normalized`
- `action_normalized`
- `tip_type`
- `fit_style_tags`
- `guide_layout_type`
- `guide_use_hint`
- `hook_keeper_included`
- `official_environment`
- `player_environment`
- `player_positioning`
- `player_selling_points`
- `small_lure_friendly`
- `long_cast_bias`
- `obstacle_bias`
- `newbie_friendly_level`
- `warning_hints`
- `balance_point_real`
- `rear_grip_length_real`
- `front_grip_length_real`
- `sweet_spot_lure_weight_real`
- `backbone_feel`
- `guide_config_note`
- `joint_tightness_note`

### C. 当前定义模糊、需要先定口径的字段

- `POWER`：不同品牌写法差异大，应该尽早做归一，但原始值要保留。
- `Description`：应拆成“官方说明”与“GearSage 摘要”两个层，不应混成一块。
- `Extra Spec 1 / Extra Spec 2`：当前属于历史兜底列，可继续保留，但不应成为长期依赖的主展示结构。
- `Reel Size`：只有在品牌口径稳定时才适合继续前推。

## 10.3 场景 B：多款产品横向对比

### A. 第一版建议进入主对比的字段

#### 官方参数主对比
- `TOTAL LENGTH`
- `Action`
- `PIECES`
- `CLOSELENGTH`
- `WEIGHT`
- `LURE WEIGHT`
- `Line Wt N F`
- `PE Line Size`
- `Tip Diameter`
- `POWER`
- `Handle Length`

#### GearSage 解释层主对比
- `power_normalized`
- `action_normalized`
- `tip_type`
- `fit_style_tags`
- `small_lure_friendly`
- `long_cast_bias`
- `obstacle_bias`
- `warning_hints`

### B. 第一版不建议进入主对比的字段

- `balance_point_real`
- `rear_grip_length_real`
- `front_grip_length_real`
- `sweet_spot_lure_weight_real`
- `backbone_feel`
- `guide_config_note`
- `joint_tightness_note`
- 各类细碎说明文案

原因：

这些字段更适合帮助深读和选后确认，不适合第一版主对比页的大众视角。

## 10.4 鱼竿字段清单（第一版执行表）

| 字段 | 当前状态 | layer | source | display_position | compare_enabled | landing_hint | 备注 |
|---|---|---|---|---|---|---|---|
| `TOTAL LENGTH` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 主对比字段 |
| `Action` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 调性原值 |
| `PIECES` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 节数 |
| `CLOSELENGTH` | 已有 | official_specs | official | detail_full / compare | 是 | excel_structured | 收纳长度 |
| `WEIGHT` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 自重 |
| `LURE WEIGHT` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 饵重范围 |
| `Line Wt N F` | 已有 | official_specs | official | detail_full / compare | 是 | excel_structured | 尼龙/氟碳线重 |
| `PE Line Size` | 已有 | official_specs | official | detail_full / compare | 是 | excel_structured | PE 范围 |
| `Tip Diameter` | 已有 | official_specs | official | detail_full / compare | 是 | excel_structured | 先径 |
| `POWER` | 已有（待归一） | official_specs | official | detail_core / compare | 是 | excel_structured | 先保留原值 |
| `product_technical` | 新增定义 | supplement | official | deep_read | 否 | excel_structured | SKU 级官方技术名合集；可空；只从品牌官网 / 官方页面获取，多个技术名用 ` / ` 分隔；官网标注只适用部分规格时必须落到对应子型号 |
| `Description` | 已有 | official_specs / supplement | official | detail_full / deep_read | 否 | excel_structured | 先做官方说明区 |
| `Extra Spec 1` | 已有 | official_specs / supplement | official/manual | detail_full | 否 | excel_structured | 历史兜底列 |
| `Extra Spec 2` | 已有 | official_specs / supplement | official/manual | detail_full | 否 | excel_structured | 历史兜底列 |
| `power_normalized` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 第一优先级补 |
| `action_normalized` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 第一优先级补 |
| `tip_type` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 实心 / 空心 / 待确认 |
| `fit_style_tags` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 泛用 / 精细 / 障碍 |
| `guide_layout_type` | 缺失 | gsc_traits | official/manual | detail_full / deep_read | 否 | excel_structured | 客观导环布局类型 |
| `guide_use_hint` | 缺失 | gsc_traits | derived/manual | detail_full / deep_read | 否 | excel_structured / derived_runtime | 导环结构翻译成使用倾向 |
| `hook_keeper_included` | 缺失 | supplement | official/manual | detail_full / deep_read | 否 | excel_structured | 低成本高价值补充字段 |
| `small_lure_friendly` | 缺失 | gsc_traits | derived | compare / deep_read | 否（可后加） | derived_runtime | 先深读后比较 |
| `balance_point_real` | 缺失 | deep_fields | player/manual | deep_read | 否 | manual_pool | 深玩家价值高 |
| `rear_grip_length_real` | 缺失 | deep_fields | player/manual | deep_read | 否 | manual_pool | 深玩家价值高 |
| `front_grip_length_real` | 缺失 | deep_fields | player/manual | deep_read | 否 | manual_pool | 深玩家价值高 |
| `sweet_spot_lure_weight_real` | 缺失 | deep_fields | player/manual | deep_read | 否 | manual_pool | 深玩家价值高 |
| `backbone_feel` | 缺失 | deep_fields | player/manual | deep_read | 否 | manual_pool | 手感字段 |
| `guide_config_note` | 缺失 | deep_fields | player/manual | deep_read | 否 | manual_pool | 导环配置 |
| `joint_tightness_note` | 缺失 | deep_fields | player/manual | deep_read | 否 | manual_pool | 接节表现 |

## 10.5 鱼竿当前判断

结论：

- 鱼竿第一刀不是继续加更多规格列，而是把 `POWER / Action / Description / Extra Spec 1/2` 这些已存在但表达混乱的字段先整理清楚。
- 其次再补 `power_normalized / action_normalized / tip_type / fit_style_tags` 这一组关键归一字段。
- 当前新增 rod 玩家字段第一版，优先补：
  - `guide_layout_type`
  - `guide_use_hint`
  - `hook_keeper_included`
  - `sweet_spot_lure_weight_real`
- 真正的手感与实测字段，应明确进入 `deep_fields`，后续再通过人工或玩家层慢慢补。

---

# 十一、鱼饵字段规范

## 11.1 设计目标

鱼饵是最不该只做成“颜色 + 长度 + 重量”的一类装备。

真正能让用户留下来的，是：

- 这款饵的体系与水层定位
- 它的潜深 / 下沉 / 钩规 / 入数等购买关键信息
- 这款饵真正的看点、结构巧思、动作风格、使用节奏

所以鱼饵字段必须同时兼顾：

- 结构化筛选
- 详情深读
- GearSage 的“看点摘要”

## 11.2 场景 A：单一产品细节了解

用户想知道：

- 这款饵真正的看点是什么
- 结构和设计巧思是什么
- 它适合什么鱼情 / 水层 / 动作节奏

### A. 当前已拥有并适合详情页重点展示的字段

#### 主型号识别层 / 筛选主维度
- `model`
- `model_cn`
- `model_year`
- `alias`
- `type_tips`
- `system`
- `water_column`
- `action`
- `images`
- `description`
- `official_link`

#### 详情级官方参数层
- `SKU`
- `WEIGHT`
- `length`
- `size`
- `sinkingspeed`
- `referenceprice`
- `COLOR`
- `hook_size`
- `depth`
- `quantity (入数)`（软饵）
- `subname`

#### 当前已经存在、但更应该被用好的字段
- `description`
- `system`
- `water_column`
- `action`
- `depth`
- `hook_size`
- `quantity (入数)`

### B. 当前缺失但重要的字段

- `buoyancy`
- `depth_range`
- `hook_spec`
- `ring_spec`
- `material`
- `rattle_type`
- `weight_transfer`
- `available_colors_count`
- `design_highlights`
- `hook_layout_note`
- `swim_posture_note`
- `retrieve_note`
- `pause_behavior`
- `structure_note`
- `season_hint`
- `water_color_hint`
- `retrieve_style_hint`
- `gsc_usage_tags`

### C. 当前定义模糊、需要先定口径的字段

- `description`：必须拆成“官方描述”和“GearSage 看点摘要”，不能混着用。
- `action`：主表已有动作枚举，但 detail 层有时也会写动作描述，后续要区分“筛选动作枚举”与“具体动作说明”。
- `sinkingspeed`：需要区分“官方下沉速度”与“沉性标签”。
- `other.1`：只作为兜底补充，不应进入主展示结构。

## 11.3 场景 B：多款产品横向对比

### A. 第一版建议进入主对比的字段

#### 官方 / 半结构化主对比
- `system`
- `water_column`
- `action`
- `length`
- `WEIGHT`
- `depth`
- `hook_size`
- `quantity (入数)`（软饵）
- `referenceprice`

#### GearSage 解释层主对比
- `family_tags`
- `season_hint`
- `water_color_hint`
- `retrieve_style_hint`
- `gsc_usage_tags`

### B. 第一版不建议进入主对比的字段

- `description`
- `design_highlights`
- `hook_layout_note`
- `swim_posture_note`
- `retrieve_note`
- `pause_behavior`
- `structure_note`

原因：

这些字段是鱼饵最有灵魂的部分，但更适合单品深读，不适合第一版主对比的统一表格。

## 11.4 鱼饵字段清单（第一版执行表）

| 字段 | 当前状态 | layer | source | display_position | compare_enabled | landing_hint | 备注 |
|---|---|---|---|---|---|---|---|
| `system` | 已有 | official_specs / gsc_traits | official/derived | list / detail_core / compare | 是 | excel_structured | 体系主维度 |
| `water_column` | 已有 | gsc_traits | derived | list / detail_core / compare | 是 | excel_structured | 水层主维度 |
| `action` | 已有 | gsc_traits | derived | list / detail_core / compare | 是 | excel_structured | 动作主维度 |
| `description` | 已有 | supplement | official | detail_full / deep_read | 否 | excel_structured | 鱼饵最重要的深读来源 |
| `length` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 核心规格 |
| `WEIGHT` | 已有 | official_specs | official | detail_core / compare | 是 | excel_structured | 核心规格 |
| `depth` | 已有（部分） | official_specs | official | detail_full / compare | 是 | excel_structured | 潜深 / 泳层 |
| `hook_size` | 已有（部分） | official_specs | official | detail_full / compare | 是 | excel_structured | 钩规 |
| `quantity (入数)` | 已有（软饵） | official_specs | official | detail_full / compare | 是 | excel_structured | 购买关键信息 |
| `buoyancy` | 缺失 | official_specs | official | detail_core / compare | 是 | excel_structured | 第一优先级补 |
| `depth_range` | 缺失 | official_specs | official | detail_core / compare | 是 | excel_structured | 第一优先级补 |
| `hook_spec` | 缺失 | official_specs | official | detail_full / compare | 否（可后加） | excel_structured | 细化钩规格 |
| `ring_spec` | 缺失 | official_specs | official | detail_full / deep_read | 否 | excel_structured | 补充字段 |
| `material` | 缺失 | official_specs | official | detail_full / compare | 否（可后加） | excel_structured | 材料信息 |
| `rattle_type` | 缺失 | official_specs | official | detail_full / compare | 否（可后加） | excel_structured | 响珠类型 |
| `weight_transfer` | 缺失 | official_specs | official | detail_full / compare | 否（可后加） | excel_structured | 重心转移 |
| `available_colors_count` | 缺失 | official_specs | official | detail_full | 否 | derived_runtime | 可由颜色列表推导 |
| `family_tags` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 家族标签 |
| `season_hint` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 季节提示 |
| `water_color_hint` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 水色提示 |
| `retrieve_style_hint` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | 操作节奏提示 |
| `gsc_usage_tags` | 缺失 | gsc_traits | derived | detail_core / compare | 是 | derived_runtime | GearSage 使用标签 |
| `design_highlights` | 缺失 | deep_fields | manual | deep_read | 否 | manual_pool | 饵的看点摘要 |
| `hook_layout_note` | 缺失 | deep_fields | manual/player | deep_read | 否 | manual_pool | 钩位结构 |
| `swim_posture_note` | 缺失 | deep_fields | manual/player | deep_read | 否 | manual_pool | 姿态表现 |
| `retrieve_note` | 缺失 | deep_fields | manual/player | deep_read | 否 | manual_pool | 操作说明 |
| `pause_behavior` | 缺失 | deep_fields | manual/player | deep_read | 否 | manual_pool | 停顿表现 |
| `structure_note` | 缺失 | deep_fields | manual/player | deep_read | 否 | manual_pool | 结构巧思 |

## 11.5 鱼饵当前判断

结论：

- 鱼饵第一刀要先把 `system / water_column / action / description / length / WEIGHT / depth / hook_size / quantity` 这组基础做好。
- 第二刀再补 `buoyancy / depth_range / rattle_type / weight_transfer` 这组会明显提升产品含金量的字段。
- 最后再引入 `design_highlights / swim_posture_note / retrieve_note` 这类真正会留住人的深读字段。

---

## 十二、落表规范

## 12.1 Excel 侧

### A 类：强结构字段
满足以下条件时，才建议进 Excel 正式列：

1. 长期会用
2. 多品牌可复用
3. 采集来源稳定
4. 前后端都会消费

适合：
- 详情核心字段
- 主对比字段
- 稳定筛选字段

### B 类：弱结构字段
满足以下特点时，不急着改 Excel 主结构：

1. 来源不稳
2. 只有少数品牌有
3. 更适合深读
4. 目前覆盖低

适合先进入：
- `raw_json`
- 中间层 JSON
- side table
- manual_pool

### C 类：玩家 / 改装字段
原则：

- 不强求第一版全覆盖
- 不强求第一版进 Excel 主表
- 必须保留来源口径
- 更适合未来独立维护或玩家补充

## 12.2 PostgreSQL 侧

当前仍优先复用：

- `gear_brands`
- `gear_master`
- `gear_variants`

后续新增字段时遵守：

1. `official_specs` 优先由结构化字段或稳定映射生成
2. `gsc_traits` 允许后端轻量归纳生成
3. `deep_fields` 默认不强制平铺进核心表
4. 真正复杂的兼容字段优先走 side table 或 JSON

建议的后续落点：

- `gear_variant_deep_fields`（可选，未来再建）
- `gear_variant_player_notes`（可选，未来再建）
- `gear_compatibility_links`（可选，未来再建）

## 12.3 前端返回层

详情页读取顺序建议统一：

1. `official_specs`
2. `gsc_traits`
3. `deep_fields`（若有）
4. 补充层（品牌技术 / 官方宣传点 / 来源说明）
5. 最后保底回退 `raw_json`

对比页读取顺序建议统一：

1. `compare_profile.coreFieldKeys`
2. `official_specs`
3. `gsc_traits.warning_hints / fitStyleTags`
4. 不把 `deep_fields` 当主对比字段

---

## 十三、与品牌技术 / 看点摘要的边界

### 13.1 品牌技术

品牌自家技术可以加，但：

1. 不进入 `official_specs`
2. 不进入对比主字段
3. 不进入第一版主筛选
4. 只作为详情页补充层

鱼竿详情表中的 `product_technical` 承接 SKU 级官方技术名合集。该字段可空，只允许从品牌官网独立产品技术模块、该模块的技术适用规格说明、官方技术页写入；多个技术名统一使用 ` / ` 分隔。`Description`、规格表、白名单站点推断值、营销长句或跨品牌等价判断不得写入该字段。若官网技术模块存在“仅某规格”“除外规格”等适用关系，必须按子型号写入 `rod_detail.product_technical`，不得把整页技术合集套给所有子型号；主表如需展示系列技术概览，应从详情行聚合生成，不作为事实源维护。

### 13.2 系列定位 / 卖点摘要

- `series_positioning`
- `main_selling_points`
- 鱼饵 `design_highlights`

这些很有价值，但要明确标识为：

- 官方宣传点摘要
- GearSage 看点摘要

它们不能冒充硬参数。

---

## 十四、优先级建议

## 14.1 P0：先把当前已有但没用好的字段提上来

### 渔轮
- `spool_diameter_mm`
- `spool_width_mm`
- `handle_knob_type`
- `handle_knob_exchange_size`
- `spool_depth_normalized`
- `brake_type_normalized`

### 鱼竿
- `POWER`
- `Description`
- `Extra Spec 1 / Extra Spec 2`
- `CLOSELENGTH`
- `Handle Length`

### 鱼饵
- `system`
- `water_column`
- `action`
- `description`
- `depth`
- `hook_size`
- `quantity (入数)`

## 14.2 P1：补会明显提升产品价值的强结构字段

### 渔轮
- `spool_diameter_mm`（若部分品牌尚未稳定）
- `spool_width_mm`
- `body_material`
- `gear_material`

### 鱼竿
- `power_normalized`
- `action_normalized`
- `tip_type`
- `fit_style_tags`

### 鱼饵
- `buoyancy`
- `depth_range`
- `rattle_type`
- `weight_transfer`
- `available_colors_count`

## 14.3 P2：深玩家字段 / 玩家实测字段

### 渔轮
- `spool_weight_g`
- `spool_axis_type`
- `knob_size`
- `knob_bearing_spec`
- `handle_hole_spec`
- `custom_spool_compatibility`
- `custom_knob_compatibility`

### 鱼竿
- `balance_point_real`
- `rear_grip_length_real`
- `front_grip_length_real`
- `sweet_spot_lure_weight_real`
- `backbone_feel`
- `guide_config_note`
- `joint_tightness_note`

### 鱼饵
- `design_highlights`
- `hook_layout_note`
- `swim_posture_note`
- `retrieve_note`
- `pause_behavior`
- `structure_note`

---

## 十五、当前明确不做

第一版不做：

1. 把品牌技术做成核心对比字段
2. 把品牌技术做成主筛选项
3. 自动跨品牌技术等价映射
4. 用爬虫直接给出“适合谁”的购买结论
5. 把所有采集字段都强行进 Excel 列
6. 用营销文案替代硬参数
7. 为了结构完整，提前设计一大套深玩家字段空表头

---

## 十六、对 Codex / 后续协作的执行提醒

1. 优先复用当前 `gear_brands / gear_master / gear_variants` 结构。
2. 继续沿用 `official_specs / gsc_traits / compare_profile` 三层基线。
3. 新增字段前先判定所属层级，不允许直接乱加到主表。
4. `normalized.json` 是第一落点，不是 Excel 表头。
5. 深玩家字段允许先进 `manual_pool / side table / JSON`，不要为了整齐硬进主表。
6. 若新增字段、脚本或表，请同步回写：
   - `装备库字段解释手册_v1.md`
   - `GearSage_装备库与装备对比设计文档_v1.md`
   - `GearLibraryDocumentation.md`
   - `装备表关系.md`
   - `装备库数据扩充标准作业规程 (SOP).md`
   - `装备扩充操作清单_v1.md`

---

## 十七、一句话收束

采集跑通以后，GearSage 装备库真正该扩的不是“列的数量”，而是“字段分层能力”——把官方参数、GearSage 解释、玩家深度字段、补充层这几层拆清楚，后面的详情页、对比页和求推荐承接才会越做越稳。
