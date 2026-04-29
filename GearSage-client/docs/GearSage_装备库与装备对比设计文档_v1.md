# GearSage 装备库与装备对比设计文档 v1

版本：v1.0  
状态：可作为当前装备库主文档继续维护  
适用范围：GearSage-client / GearSage-api / 装备采集链 / Excel 维护源 / PostgreSQL 导入链 / 装备详情页 / 装备对比页 / 求推荐承接  
更新时间：2026-04-29

---

## 一、文档目标

本文档用于把当前 GearSage 装备库相关的分散文档口径，收敛成一份可持续维护的主文档，并明确以下内容：

1. GearSage 装备库当前真实基线与已完成能力
2. 装备库在产品上的真实定位，不把它做成“纯参数表”
3. 装备详情页、装备对比页、求推荐承接之间的关系
4. 字段分层原则：什么该进官方参数，什么该进 GearSage 解释层，什么该作为玩家深度字段
5. 渔轮 / 鱼竿 / 鱼饵三类装备在“单一产品细节了解”与“多款产品横向对比”两个场景下的字段策略
6. 品牌技术、证据链、SOP 与后续扩充规则

本文档不是一次性的脑暴记录，而是当前装备库产品设计、字段演进与后续接力协作的主口径。

---

## 二、当前定位

GearSage 装备库不是一个“把官网参数搬进来”的资料页，也不是一个“自动替用户做购买决定”的智能导购。

它当前更准确的定位是：

> 一个帮助用户查、筛、比、理解差异，并在看完仍纠结时自然进入求推荐的装备决策工具。

因此，装备库必须同时承担四件事：

1. **识别与查询**：让用户快速找到某个系列、某个 SKU、某个品类
2. **理解与比较**：让用户看懂真正影响判断的差异，而不是堆满杂乱参数
3. **细节与深读**：让已经看上某款装备的玩家，能继续往下看到更深的信息
4. **承接与转化**：当用户看完仍拿不准时，顺滑跳去求推荐，而不是退出 GearSage 去外部问

---

## 三、当前真实基线

### 3.1 当前数据链路

当前装备库已经从纯人工 Excel 模式，升级为：

```text
官网 / 权威来源
  ↓
Scrapling MCP 采集
  ↓
normalized.json
  ↓
pre-check.js 校验
  ↓
to_excel.js 导出
  ↓
rate/excel/*.xlsx
  ↓
import_gear_excel.js
  ↓
PostgreSQL: gear_brands / gear_master / gear_variants
  ↓
小程序 list / detail / compare
```

### 3.2 当前数据基座

当前 gear 数据底座已经统一为三层：

- `gear_brands`
- `gear_master`
- `gear_variants`

并保留：

- `raw_json`：兜住异构字段
- `pkgGear/searchData/Data.js`：作为小程序本地搜索辅助索引

### 3.3 当前已完成页面与接口基线

当前装备库第一版已经跑通以下链路：

- 装备列表页
- 装备详情页
- 装备对比页 v1（当前优先渔轮 / 鱼竿）
- 相关推荐
- 装备详情页 -> 去求推荐
- 对比页 -> 带候选去求推荐

当前已使用接口：

- `GET /mini/gear/brands`
- `GET /mini/gear/list`
- `GET /mini/gear/detail`
- `GET /mini/topic/all`（用于装备关联帖子）

### 3.4 当前返回结构基线

在不破坏旧字段与旧 envelope 的前提下，当前 gear 返回已开始增量补三层：

- `official_specs`
- `gsc_traits`
- `compare_profile`

这三层是后续字段扩充、详情展示与对比逻辑的正式基线，不再允许搅混。

---

## 四、当前产品问题与方向

当前装备库已经能查、能看、能导库，但真正决定它能不能留住人的，不是“有没有参数”，而是以下三点：

1. **关键差异有没有被提炼出来**
2. **字段分层有没有清楚**
3. **对深玩家真正有价值的字段，是否有明确放置位置**

GearSage 后续不应继续走“尽量多爬字段、尽量多展示列”的方向，而应走：

> **优先补真正影响判断的字段，并把它们放到正确的层里。**

因此，从现在开始，装备库的设计必须同时围绕两个真实用户场景展开：

### 场景 A：单一产品细节了解

用户已经基本看上了某款产品，或者已经缩小到很少的候选项，想继续了解：

- 它到底是什么定位
- 它有哪些关键差异
- 它有没有值得注意的小细节
- 它是否适合后续改装、替换配件、深度使用

### 场景 B：多款产品横向对比

用户已经有 2~3 个候选项，想快速知道：

- 这些产品在核心差异上到底差在哪
- 哪些字段值得真正比较
- 哪些字段不应放进主对比
- 看完后如果仍纠结，如何带着候选进入求推荐

---

## 五、字段分层总原则

### 5.1 不是字段越多越好，而是分层越清楚越好

GearSage 装备库后续统一分四层：

#### 第一层：识别层
回答“这是什么装备”。

#### 第二层：官方硬参数层
回答“厂家明确给了什么客观规格”。

#### 第三层：GearSage 解释层
回答“这些参数意味着什么，哪些差异值得你看”。

#### 第四层：补充与承接层
回答“还有什么补充信息值得看，看完还纠结怎么办”。

### 5.2 所有新增字段先回答 5 个问题

新增字段前必须先判断：

1. 它来自哪里：官网、详情图、人工归纳、玩家实测还是外部评测
2. 它是不是稳定字段：不同品牌是否能持续拿到
3. 它是不是强结构字段：是否适合筛选 / 对比
4. 它是不是弱结构字段：更适合详情补充说明
5. 它需不需要证据链：是否必须保留来源 URL 与采集时间

### 5.3 从今天开始，字段再加一层“来源口径”

除了展示层，GearSage 还要承认装备库里长期会存在三种来源：

- `official`：官方字段
- `derived`：GearSage 归一 / 解释 / 推导字段
- `player`：玩家实测 / 改装 / 深度使用字段

这三类字段不能混写，尤其不能把玩家字段伪装成官网字段。

### 5.4 建议的字段标签体系

建议后续建立统一字段主清单，每个字段至少带以下标签：

- `scene_scope`：`detail` / `compare` / `both`
- `source_type`：`official` / `derived` / `player`
- `priority`：`P0` / `P1` / `P2`
- `structure_level`：`A强结构` / `B弱结构`
- `display_layer`：`official_specs` / `gsc_traits` / `supplement` / `player_notes`
- `compare_enabled`
- `filter_enabled`
- `coverage_required`
- `evidence_required`

---

## 六、页面结构基线

## 6.1 详情页统一结构

详情页建议统一按以下顺序读取与展示：

1. **识别区**
   - 品牌
   - 系列名
   - 中文名 / 年份 / 类型标签
   - 图片
   - 系列定位 / 一句话卖点（若有）

2. **子型号选择区**
   - 当前变体 / SKU 切换

3. **核心参数区**
   - 只展示最值得看的主参数

4. **完整规格区**
   - 展示更全的官方结构化参数

5. **GearSage 提示区**
   - 解释这些参数意味着什么
   - 提醒错误比较与使用边界

6. **补充层**
   - 品牌技术 / 官方宣传点（默认折叠）
   - 采集来源 / 更新时间（后续）
   - 玩家实测 / 改装字段（后续）

7. **承接区**
   - 关联帖子
   - 去求推荐
   - 加入对比池

### 6.2 对比页统一结构

对比页当前第一版规则：

- 不新增 `GET /mini/gear/compare`
- 继续复用 `GET /mini/gear/detail`
- 首次打开时按候选项逐个回查详情并聚合
- 当前优先渔轮 / 鱼竿
- 限制同类型、同子类、最多 3 个候选

默认展示：

1. **L1 核心参数差异**
2. **完整规格对比**（默认只看有差异的字段）
3. **GearSage 提示**
4. **去求推荐承接**

### 6.3 读取顺序建议

#### 详情页读取顺序
1. `official_specs`
2. `gsc_traits`
3. 补充层（如品牌技术）
4. 保底回退 `raw_json`

#### 对比页读取顺序
1. `compare_profile.coreFieldKeys`
2. `official_specs`
3. `gsc_traits.warning_hints / fit_style_tags`
4. 不读取品牌技术进行主对比

---

## 七、四层字段规范

## 7.1 第一层：识别层（Identification Layer）

### 品牌层建议字段

- `brand_id`
- `brand_name`
- `brand_name_en`
- `brand_name_jp`
- `brand_name_zh`
- `brand_description`
- `brand_site_url`
- `brand_logo_url`
- `country_region`
- `founded_year`
- `brand_story_short`

### 主型号层建议字段

- `master_id`
- `kind`
- `model`
- `model_cn`
- `model_year`
- `alias`
- `type`
- `type_tips`
- `images`
- `series_positioning`
- `release_year`
- `market_status`
- `official_reference_price`
- `main_selling_points`

### 这一层的作用

- 列表卡
- 详情页顶部识别区
- 对比页候选标题区

### 这一层不承担

- 主筛选逻辑
- GearSage 结论
- 品牌技术对比

---

## 7.2 第二层：官方硬参数层（Official Specs）

这层只放：

- 来自官网 / 结构化采集 / Excel 标准列
- 可重复获取
- 能稳定进入详情区 / 完整规格区 / 对比页

### 使用范围

- 详情页核心参数区
- 详情页完整规格区
- 对比页 L1 / L2
- 列表筛选（仅限其中稳定字段）

### 这一层不允许混入

- 品牌自家技术名
- 编辑主观判断
- “更适合新手”这类结论
- “3g 起抛”这类经验值

---

## 7.3 第三层：GearSage 解释层（GSC Traits）

这层不是厂家参数，而是 GearSage 对参数、用途和差异的解释。

### 设计原则

1. 必须单独分层
2. 必须允许为空
3. 必须明确标注“GearSage 归纳 / 非官方参数”
4. 覆盖不足时宁可不显示
5. 默认不直接进入强筛选主链，除非字段足够稳定

### 使用位置

- 详情页 GearSage 提示区
- 对比页 L3
- 错误比较提醒
- 求推荐预填与解释

### 当前明确不做

- 大而全的装备评分
- 自动推荐结论
- 跨品牌技术等价推断

---

## 7.4 第四层：补充与承接层（Supplement & CTA Layer）

这层不参与主要筛选与核心对比，负责丰富详情和承接下一步动作。

包括：

- 关联帖子
- 去求推荐
- 对比后去求推荐
- 品牌技术 / 官方宣传点
- 系列定位文案
- 采集来源与更新时间
- 后续玩家实测 / 改装字段

---

## 八、渔轮字段策略

渔轮是最适合体现“官方字段”和“玩家字段”分离的品类。

### 8.1 单一产品细节了解

#### A. 官方硬参数（建议进入 `official_specs`）

- `sku`
- `gear_ratio`
- `max_drag`
- `weight`
- `nylon_lb_m`
- `pe_no_m`
- `cm_per_turn`
- `handle_length_mm`
- `bearing_count_roller`
- `market_reference_price`
- `size_family`
- `retrieve_per_turn_cm`
- `bearing_count_main`
- `handle_side_options`
- `line_capacity_display`
- `drag_click`

#### B. GearSage 解释层（建议进入 `gsc_traits`）

- `spool_depth_normalized`：浅杯 / 中杯 / 深杯
- `brake_type_normalized`：磁力 / 离心 / 电子 / 混合
- `fit_style_tags`：泛用 / BFS / 轻饵 / 远投 / 细线
- `min_lure_weight_hint`：约 3g+ / 约 5g+
- `newbie_friendly_level`
- `maintenance_friendliness`
- `warning_hints`

#### C. 玩家深度字段（建议进入 `player_notes` 或独立玩家字段池）

以下字段非常重要，但不应伪装成官网字段：

- `spool_diameter_mm`（线杯直径）
- `spool_weight_g`（线杯克重）
- `spool_axis_type`（长轴 / 短轴）
- `knob_size`
- `knob_bearing_spec`
- `handle_hole_spec`
- `custom_spool_compatibility`
- `custom_knob_compatibility`
- `min_comfort_lure_weight_real`
- `sweet_spot_lure_weight_real`
- `cast_bias_real`（精细 / 泛用 / 远投）
- `common_upgrade_paths`

### 8.2 多款产品横向对比

#### 第一版建议进入主对比的字段

- `gear_ratio`
- `max_drag`
- `weight`
- `line_capacity_display`
- `cm_per_turn`
- `handle_length_mm`
- `size_family`
- `spool_depth_normalized`
- `brake_type_normalized`
- `fit_style_tags`
- `maintenance_friendliness`
- `warning_hints`

#### 第一版不建议进入主对比的字段

- `spool_diameter_mm`
- `spool_weight_g`
- `spool_axis_type`
- `knob_size`
- 改装兼容件信息

原因：

- 覆盖不稳
- 更偏单品深读与改装场景
- 不适合当前泛用户横向比较主流程

---

## 九、鱼竿字段策略

鱼竿的关键不是“参数少”，而是纸面参数和真实手感之间有巨大距离，因此必须更重视 GearSage 解释层与玩家层。

### 9.1 单一产品细节了解

#### A. 官方硬参数

- `type`
- `sku`
- `total_length`
- `action`
- `pieces`
- `weight`
- `tip_diameter`
- `lure_weight`
- `pe_line_size`
- `content_carbon`
- `length_cm`
- `storage_length_cm`
- `power_normalized`
- `action_normalized`
- `line_max`
- `line_range_display`
- `handle_type`
- `blank_material_summary`
- `carbon_content_percent`

#### B. GearSage 解释层

- `fit_style_tags`：泛用 / 精细 / 障碍 / 远投 / 溪流 / 岸投
- `recommended_rig_pairing`：子型号适合搭配的钓组/饵型，按最擅长到合适排序
- `solid_tip`：实心 / 空心 / 待确认
- `small_lure_friendly`
- `long_cast_bias`
- `obstacle_bias`
- `newbie_friendly_level`
- `warning_hints`

#### C. 玩家深度字段

- `balance_point_real`
- `bare_blank_weight_real`
- `rear_grip_length_real`
- `front_grip_length_real`
- `holding_balance_feel`
- `sweet_spot_lure_weight_real`
- `overload_tolerance_real`
- `small_lure_start_difficulty`
- `backbone_feel`
- `guide_config_note`
- `joint_tightness_note`
- `finish_detail_note`

### 9.2 多款产品横向对比

#### 建议进入主对比的字段

- `total_length`
- `storage_length_cm`
- `pieces`
- `power_normalized`
- `action_normalized`
- `weight`
- `lure_weight`
- `pe_line_size`
- `tip_diameter`
- `handle_type`
- `solid_tip`
- `fit_style_tags`
- `long_cast_bias`
- `small_lure_friendly`
- `obstacle_bias`

#### 不建议第一版进入主对比的字段

- 重心位置
- 实测甜区
- 插节手感
- 做工细节备注

原因：

- 高价值但低覆盖
- 更适合单品深读

---

## 十、鱼饵字段策略

鱼饵最容易被做成“颜色 + 尺寸 + 重量”的纯表格，但真正让用户留下来的，是它对泳姿、场景、水层、节奏的理解。

### 10.1 单一产品细节了解

#### A. 官方硬参数

- `sku`
- `weight`
- `length`
- `size`
- `sinkingspeed`
- `referenceprice`
- `buoyancy`
- `depth_range`
- `hook_spec`
- `ring_spec`
- `material`
- `rattle_type`
- `weight_transfer`
- `available_colors_count`

#### B. GearSage 解释层

- `family_tags`
- `season_hint`
- `water_color_hint`
- `retrieve_style_hint`
- `gsc_usage_tags`

#### C. 玩家深度字段

- `swim_action_real`
- `start_speed_real`
- `working_depth_real`
- `pause_posture_note`
- `sound_level_real`
- `cast_stability_real`
- `wind_resistance_real`
- `cover_avoidance_note`
- `stock_hook_enough_or_not`
- `replace_hook_suggestion`
- `replace_ring_suggestion`
- `retrieve_rhythm_note`
- `water_temp_note`

### 10.2 多款产品横向对比

#### 建议进入主对比的字段

- `length`
- `weight`
- `buoyancy`
- `depth_range`
- `hook_spec`
- `ring_spec`
- `material`
- `rattle_type`
- `weight_transfer`
- `family_tags`
- `season_hint`
- `water_color_hint`

#### 不建议第一版进入主对比的字段

- 泳姿质感
- 起动速度
- 停顿那一下的反馈
- 原厂钩是否够用

原因：

- 这类字段更接近体验描述
- 更适合详情页深读与后续玩家评价沉淀

---

## 十一、品牌技术与官方宣传点

### 11.1 基本结论

品牌自家技术可以加，但：

1. **不进入 `official_specs`**
2. **不进入对比主字段**
3. **不进入第一版主筛选**
4. **只作为详情页补充层**

也就是：

> 可以展示，但不让它污染主参数结构。

### 11.2 为什么不能直接塞进主参数

原因：

1. 不同品牌技术命名不统一
2. 同类技术可能名字完全不同
3. 很多技术只存在于详情图或营销文案中，不稳定
4. 很难做跨品牌等价映射
5. 直接混进主参数会让详情页失去可信感

### 11.3 推荐建模

#### `brand_technologies`

建议字段：

- `id`
- `brand_id`
- `tech_code`
- `tech_name`
- `tech_name_en`
- `tech_short_desc`
- `tech_long_desc`
- `tech_icon_url`
- `source_url`
- `source_text_excerpt`
- `category_scope`
- `status`
- `display_order`
- `raw_json`
- `created_at`
- `updated_at`

#### `gear_technology_links`

建议字段：

- `id`
- `gear_master_id`
- `gear_variant_id`
- `technology_id`
- `confidence`
- `source_url`
- `source_type`
- `note`
- `created_at`
- `updated_at`

### 11.4 前端展示建议

详情页底部增加一块：

#### `品牌技术 / 官方宣传点`

展示方式：

- 默认折叠
- icon + 技术名 + 一句话简介
- 点击再看长说明
- 必须标注：`官方技术说明 / 不参与参数对比`

### 11.5 对比页边界

第一版：

- 不展示品牌技术做主对比

第二版如果要加，也只允许：

- 单列显示“该型号官方技术”列表
- 不做字段级横向高亮
- 不参与排序、不参与结论

---

## 十二、求推荐承接关系

### 12.1 整体目标

装备库不是到详情页为止，而是要把“看完参数、看完差异、看完还纠结”的用户自然送进求推荐。

### 12.2 三条关系链

#### 链路 A：装备详情页 -> 发求推荐

适用场景：

- 用户看完某个具体产品详情，仍不确定自己适不适合买

建议按钮：

- `我这种情况适合吗？去求推荐`
- 或 `去求推荐`

建议预填：

- `relatedGearCategory`
- `relatedGearItemId`
- `recommendMeta.candidateOptions[0]`

#### 链路 B：装备对比页 -> 发求推荐

适用场景：

- 用户已经有 2~3 个候选，对比完之后还是拿不准

建议按钮：

- `还是纠结？带着这几个候选去求推荐`

建议预填：

- `relatedGearCategory`
- `recommendMeta.candidateOptions[]`
- 当前 compare 页面中的候选装备

#### 链路 C：求推荐结果 -> 回流装备库语境

后续价值：

- 用户不是只在问答页得到一句答案
- 未来可把“问题 -> 建议 -> 采纳 -> 反馈”逐步沉淀成案例语境
- 但当前不做自动算法推荐，不伪装成智能决策

### 12.3 当前明确不做

- 自动算法推荐
- 装备对比页自动给出最佳购买结论
- 把求推荐伪装成系统自动决策

---

## 十三、证据链与可信度字段

为了避免 GearSage 装备库逐步失去可信度，后续扩充必须逐步补齐证据链字段。

### 第一优先级证据链字段

- `source_url`
- `scraped_at`
- `raw_data_hash`
- `local_image_path`
- `source_brand_site`
- `selector_version`
- `parse_version`

### 建议的确认字段

- `confidence`
- `source_type`
- `needs_review`
- `reviewed_by`
- `reviewed_at`
- `review_note`

### 使用原则

- A 类强结构字段尽量不走人工确认
- B 类弱结构字段和 GSC 归纳字段优先支持人工确认
- 未确认字段宁可不展示，也不冒充确定事实

---

## 十四、数据维护与 SOP 基线

### 14.1 当前最终基准约定

- `rate/excel` 是最终基准
- `pkgGear/data_raw` 是抓取、清洗、导出中间层
- 默认冻结最终表结构，优先补内容

### 14.2 不变规则

1. `brand.xlsx` 只扩充，不改既有品牌编号
2. 装备主表、详情表统一使用字符串前缀主键
3. 最终表字段名、字段顺序、sheet 名默认不动
4. 新增字段前，先判断是不是可以通过补内容或修导出脚本解决
5. 差异处理优先改导出脚本规则，不优先做重复人工修表

### 14.3 每次扩充的固定顺序

1. 更新 `pkgGear/data_raw` 中的抓取结果或 `normalized.json`
2. 跑 `pre-check.js`
3. 跑对应 `to_excel_*` 导出脚本
4. 跑 `report_rate_excel_diffs.js`
5. 看差异报告
6. 只处理报告里的真实差异
7. 差异清零后，再更新 `rate/excel`
8. 运行导入前校验
9. 最后进入导库和前后端联调

### 14.4 常用命令

#### 预检查
```bash
node /Users/tommy/GearSage/scripts/pre-check.js /绝对路径/xxx_normalized.json
```

#### 导出
```bash
node /Users/tommy/GearSage/scripts/to_excel_xxx.js
```

#### 差异报告
```bash
node /Users/tommy/GearSage/scripts/report_rate_excel_diffs.js
```

#### 导入前校验
```bash
cd /Users/tommy/GearSage/GearSage-api
npm run import:gear:check
```

### 14.5 一句话口径

**先补内容，再跑导出，再看差异，再修规则；不要先动最终表结构。**

---

## 十五、当前优先级建议

### 15.1 第一优先级

#### 证据链字段

- `source_url`
- `scraped_at`
- `raw_data_hash`
- `local_image_path`
- `source_brand_site`
- `selector_version`
- `parse_version`

#### 渔轮关键归一字段

- `spool_depth_normalized`
- `brake_type_normalized`
- `drag_click`
- `size_family`

#### 鱼竿关键归一字段

- `power_normalized`
- `action_normalized`
- `tip_type`
- `storage_length_cm`

#### 通用主型号字段

- `series_positioning`
- `market_status`
- `official_reference_price`
- `main_selling_points`

### 15.2 第二优先级

- `fit_style_tags`
- `min_lure_weight_hint`
- `newbie_friendly_level`
- `maintenance_friendliness`
- `blank_material_summary`
- `depth_range`
- `buoyancy`
- `hook_spec`

### 15.3 第三优先级

- `brand_technologies`
- `gear_technology_links`
- `tech_icon_url`
- `tech_short_desc`
- `tech_long_desc`

说明：

- 这一组可以丰富详情
- 但不该抢在核心比较字段前面

---

## 十六、当前明确不做

第一版不做：

1. 把品牌技术做成核心对比字段
2. 把品牌技术做成主筛选项
3. 自动跨品牌技术等价映射
4. 用爬虫直接给出“适合谁”的购买结论
5. 把所有采集字段都强行进 Excel 列
6. 用营销文案替代硬参数
7. 把玩家实测字段伪装成官网字段
8. 在样本不足时硬做复杂评分体系

---

## 十七、建议的后续实施顺序

### 第一刀：证据链补齐
目标：
- 让每条采集记录都有完整来源与追踪能力

### 第二刀：渔轮 / 鱼竿关键归一字段
目标：
- 先把真正影响详情和对比体验的字段补齐

### 第三刀：品牌技术补充层
目标：
- 让详情页更丰富，但不污染主参数结构

### 第四刀：GearSage 解释层继续深化
目标：
- 逐步补更稳定的用途标签与错误比较提醒

### 第五刀：玩家深度字段池
目标：
- 先建立字段池与来源口径
- 暂不追求全覆盖
- 先从渔轮改装与深度使用字段开始

---

## 十八、对 Codex / 后续协作的执行提醒

1. 优先复用当前 `gear_brands / gear_master / gear_variants` 结构
2. 继续沿用 `official_specs / gsc_traits / compare_profile` 三层基线
3. 新增字段前先判定所属层级，不允许直接乱加到主表
4. `normalized.json` 是第一落点，不是 Excel 表头
5. 品牌技术建议走独立表或独立 JSON 结构，不要平铺在主参数里
6. 玩家深度字段要显式标注来源，不要装成官网标准参数
7. 若新增字段、脚本或表，请同步回写：
   - `GearLibraryDocumentation.md`
   - `装备库迁移拆分方案.md`
   - `装备表关系.md`
   - `装备库数据扩充标准作业规程 (SOP).md`
   - `独立后台迁移计划_施工记录版.md`

---

## 十九、一句话收束

GearSage 装备库真正该扩的，不是“列的数量”，而是“字段分层能力”。

把**官方参数、GearSage 解释、品牌技术补充、玩家深度字段池、证据链**这几层拆清楚，后面的详情页、对比页和求推荐承接，才会越做越稳。
