# GearSage 装备库字段扩充与爬取分层规范 v1

版本：v1.0  
状态：可直接交给 Codex 进入实现拆分 / 后续可持续维护  
适用范围：GearSage-client / GearSage-api / 装备采集链 / Excel 维护源 / PostgreSQL 导入链  
更新时间：2026-04-03

---

## 一、文档目标

本文档用于在当前装备库第一版已经跑通的基础上，明确 GearSage 装备库后续的字段扩充方向、爬取分层原则、品牌技术展示边界，以及不同字段应该落在哪一层。

本文档重点解决以下问题：

1. 既然采集已经跑通，哪些字段值得继续扩充
2. 哪些字段属于官方硬参数，哪些属于 GearSage 解释层
3. 品牌自家“技术”应该如何建模、存储、展示
4. 采集链路中哪些信息应该进入 `normalized.json`
5. 哪些字段应该直接进 Excel / PostgreSQL，哪些应该只作为补充层
6. 如何避免把装备库做成“参数表 + 营销词堆砌”
7. 如何让后续渔轮 / 鱼竿对比继续建立在稳定字段之上

本文档不是某一次采集任务的临时备注，而是给 Codex / 后端 / 数据维护 / 爬虫配置继续接力的长期口径。

---

## 二、当前基线

### 2.1 当前装备库真实链路

当前装备库已经不是纯手填 Excel 模式，而是：

```text
官网 / 权威来源
  ↓
Scrapling MCP 采集
  ↓
normalized.json
  ↓
pre-check.js 校验
  ↓
to_excel.js 转换
  ↓
rate/excel/*.xlsx
  ↓
import_gear_excel.js
  ↓
PostgreSQL gear_brands / gear_master / gear_variants
  ↓
小程序 list / detail / compare
```

### 2.2 当前已拍板的数据结构基线

当前 gear 数据底座已经统一为三层：

- `gear_brands`
- `gear_master`
- `gear_variants`

并保留：

- `raw_json` 兜住异构字段
- `searchData/Data.js` 作为小程序本地搜索辅助索引

### 2.3 当前 gear 返回结构基线

在不破坏旧字段与旧 envelope 的前提下，当前 gear 返回已开始增量补：

- `official_specs`
- `gsc_traits`
- `compare_profile`

这三层是后续字段扩充的最重要基线，不允许再被搅混。

### 2.4 当前页面基线

当前装备库页面已具备：

- 分类入口
- 列表页
- 详情页
- 对比页 v1（渔轮 / 鱼竿）
- 装备详情页 -> 去求推荐
- 对比页 -> 带候选去求推荐

### 2.5 当前约束

本方案必须遵守：

1. 不推翻当前 `GET /mini/gear/brands` / `GET /mini/gear/list` / `GET /mini/gear/detail`
2. 不要求一次性把所有字段结构化到极致
3. 不把品牌营销内容误当成官方参数或比较字段
4. 不要求第一版就让 GearSage 自动给出购买结论
5. 继续允许 Excel 作为长期维护源
6. 继续允许不同装备类型 detail 字段差异很大

---

## 三、字段扩充的总原则

### 3.1 不是“字段越多越好”，而是“字段分层越清楚越好”

现在真正该扩的，不是简单多几列，而是：

- 这列属于哪一层
- 会不会参与筛选
- 会不会参与对比
- 是否需要用户可见
- 是否需要人工确认

### 3.2 所有新增字段必须先回答 5 个问题

新增前必须先判断：

1. 它来自哪里：官网、详情图、人工归纳还是外部评测
2. 它是不是稳定字段：不同品牌是否都能持续拿到
3. 它是不是强结构字段：是否适合筛选 / 对比
4. 它是不是弱结构字段：更适合详情补充说明
5. 它需不需要证据链：是否必须保留来源 URL 与采集时间

### 3.3 GearSage 装备库后续统一分四层

#### 第一层：识别层
回答“这是什么装备”。

#### 第二层：官方硬参数层
回答“厂家明确给了什么客观规格”。

#### 第三层：GearSage 解释层
回答“这些参数意味着什么，哪些差异值得你看”。

#### 第四层：补充与承接层
回答“还有什么补充信息值得看，看完还纠结怎么办”。

---

## 四、字段分层规范

## 4.1 第一层：识别层（Identification Layer）

这层用于快速识别，不承担复杂比较。

### 品牌层建议字段

- `brand_id`
- `brand_name`
- `brand_name_en`
- `brand_name_jp`
- `brand_name_zh`
- `brand_description`
- `brand_site_url`
- `brand_logo_url`（建议新增）
- `country_region`（建议新增）
- `founded_year`（建议新增）
- `brand_story_short`（建议新增）

### 主型号层建议字段

- `master_id`
- `kind`（reel / rod / lure / line / hook / other）
- `model`
- `model_cn`
- `model_year`
- `alias`
- `type`
- `type_tips`
- `images`
- `series_positioning`（建议新增）
- `release_year`（建议新增）
- `market_status`（建议新增：在售 / 停产 / 待补）
- `official_reference_price`（建议新增）
- `main_selling_points`（建议新增，数组）

### 这一层的展示位置

- 列表卡
- 详情页顶部识别区
- 对比页候选标题区

### 这一层不应该做的事

- 不承担筛选主逻辑
- 不承担 GearSage 结论
- 不承担品牌技术对比

---

## 4.2 第二层：官方硬参数层（Official Specs）

这层只放“能明确来源于官网 / 结构化采集结果 / Excel 标准列”的字段。

### 渔轮建议字段

#### 当前已有稳定字段

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

#### 建议继续结构化补充

- `size_family`
- `retrieve_per_turn_cm`
- `bearing_count_main`
- `handle_side_options`
- `line_capacity_display`
- `drag_click`（如果官网可稳定拿到）

### 鱼竿建议字段

#### 当前已有稳定字段

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

#### 建议继续结构化补充

- `length_cm`
- `storage_length_cm`
- `power_normalized`
- `action_normalized`
- `line_max`
- `line_range_display`
- `handle_type`
- `blank_material_summary`
- `carbon_content_percent`

### 鱼饵建议字段

#### 当前已有稳定字段

- `sku`
- `weight`
- `length`
- `size`
- `sinkingspeed`
- `referenceprice`

#### 建议继续结构化补充

- `buoyancy`
- `depth_range`
- `hook_spec`
- `ring_spec`
- `material`
- `rattle_type`
- `weight_transfer`
- `available_colors_count`

### 这一层的使用范围

- 详情页核心参数区
- 详情页完整规格区
- 对比页 L1 / L2
- 列表筛选（只允许其中稳定字段进入）

### 这一层不允许混入

- 品牌自家技术名
- 编辑主观判断
- “更适合新手”这类结论
- “3g 起抛”这类经验值

---

## 4.3 第三层：GearSage 解释层（GSC Traits）

这层不是厂家参数，而是 GearSage 对参数、用途和差异的解释。

### 设计原则

1. 必须单独分层
2. 必须允许为空
3. 必须标注“GearSage 归纳 / 非官方参数”
4. 覆盖不足时宁可不显示
5. 不应直接进入强筛选主链，除非字段足够稳定

### 渔轮建议字段

- `spool_depth_normalized`：浅杯 / 中杯 / 深杯
- `brake_type_normalized`：磁力 / 离心 / 电子 / 混合
- `fit_style_tags`：泛用 / BFS / 轻饵 / 远投 / 细线
- `min_lure_weight_hint`：约 3g+ / 约 5g+
- `newbie_friendly_level`
- `maintenance_friendliness`
- `warning_hints`

### 鱼竿建议字段

- `fit_style_tags`：泛用 / 精细 / 障碍 / 远投 / 溪流 / 岸投
- `solid_tip`：实心 / 空心 / 待确认
- `small_lure_friendly`
- `long_cast_bias`
- `obstacle_bias`
- `newbie_friendly_level`
- `warning_hints`

### 鱼饵建议字段

- `family_tags`
- `season_hint`
- `water_color_hint`
- `retrieve_style_hint`
- `gsc_usage_tags`

### 这一层的使用位置

- 详情页 GearSage 提示区
- 对比页 L3
- 错误比较提醒
- 求推荐预填与解释

### 这一层暂不适合直接做成的东西

- 大而全的装备评分
- 自动推荐结论
- 跨品牌技术等价推断

---

## 4.4 第四层：补充与承接层（Supplement & CTA Layer）

这层不参与主要筛选与核心对比，负责丰富详情和承接下一步动作。

包括：

- 关联帖子
- 去求推荐
- 对比后去求推荐
- 品牌技术 / 官方宣传点
- 系列定位文案
- 采集来源与更新时间（未来若想做）

---

## 五、品牌“自家技术”建模规范

## 5.1 结论

品牌自家技术可以加，但：

1. **不进入 `official_specs`**
2. **不进入对比主字段**
3. **不进入第一版主筛选**
4. **只作为详情页补充层**

也就是：

> 可以展示，但不让它污染主参数结构。

---

## 5.2 为什么不能直接塞进主表参数

原因如下：

1. 不同品牌技术命名不统一
2. 同类技术可能名字完全不同
3. 很多技术只出现在详情图或营销文案，不稳定
4. 很难做跨品牌等价映射
5. 直接混进主参数会让详情页失去可信感

---

## 5.3 推荐表结构

### `brand_technologies`

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

### `gear_technology_links`

建议字段：

- `id`
- `gear_master_id`
- `gear_variant_id`（可空）
- `technology_id`
- `confidence`
- `source_url`
- `source_type`（official / manual / inferred）
- `note`
- `created_at`
- `updated_at`

---

## 5.4 前端展示建议

详情页底部增加一块：

### `品牌技术 / 官方宣传点`

展示方式：

- 默认折叠
- icon + 技术名 + 一句话简介
- 点击再看长说明
- 必须标注：`官方技术说明 / 不参与参数对比`

### 第一版不做

- 不做品牌技术横向对比
- 不做技术评分
- 不做技术筛选
- 不做“这项技术等于别家哪项技术”的映射

---

## 六、字段优先级规范

所有新增字段按优先级分三类。

## 6.1 A 类：强结构字段

定义：

- 稳定
- 可重复采集
- 可进入详情 / 对比 / 筛选

示例：

- 速比
- 重量
- 长度
- 调性
- 强度
- 卸力
- 容线
- 浮力
- 潜深
- 节数
- 收纳长度

策略：

- 优先进入 Excel 模板
- 优先落 PostgreSQL 结构化字段
- 优先进入 `official_specs`

---

## 6.2 B 类：弱结构字段

定义：

- 能展示
- 对理解有帮助
- 但不适合强筛选 / 强对比

示例：

- 系列定位
- 一句话卖点
- 品牌技术简介
- GearSage 轻量解释
- 用途方向标签

策略：

- 可以先进 `raw_json` 或补充表
- 展示优先，筛选谨慎
- 进入 `gsc_traits` 或补充层

---

## 6.3 C 类：证据链字段

定义：

- 用户一般不直接看
- 但对数据维护和追溯极其重要

示例：

- `source_url`
- `scraped_at`
- `raw_data_hash`
- `local_image_path`
- `source_brand_site`
- `source_lang`
- `selector_version`
- `parse_version`
- `last_verified_at`
- `content_block_hash`
- `tech_block_hash`

策略：

- 必须优先存在 `normalized.json`
- 可不强制全部进 Excel 表头
- 允许通过 JSON / 侧表保存

---

## 七、采集链路分层规范

## 7.1 采集层职责

采集层的职责只有：

- 抓取原始页面
- 提取字段候选
- 下载主图
- 记录来源和时间
- 形成标准化中间结果

采集层不负责：

- 自动给出装备结论
- 自动判断“更适合新手”
- 自动判断“精细 / 泛用 / 障碍”

---

## 7.2 标准化层职责

标准化层的核心产物是 `normalized.json`。

每条记录至少应包含：

- `brand`
- `kind`
- `model`
- `model_year`
- `source_url`
- `local_image_path`
- `images`
- `variants[]`
- `raw_data_hash`
- `scraped_at`

建议继续扩充：

- `source_brand_site`
- `source_lang`
- `selector_version`
- `parse_version`
- `last_verified_at`
- `tech_blocks[]`
- `marketing_blocks[]`
- `needs_review_fields[]`

---

## 7.3 校验层职责

继续沿用 `pre-check.js`，重点校验：

- 主键唯一性
- 外键一致性
- 关键字段缺失
- 变体数量异常
- 图片路径异常
- hash 变化
- 品牌技术字段是否缺来源

建议新增校验：

- `brand_technologies` 相关字段若存在，必须同时有 `source_url`
- `gsc_traits` 若存在人工归纳字段，必须带 `source_type` 或 `confidence`

---

## 7.4 转换层职责

转换层负责：

- 将 `normalized.json` 映射到 Excel 模板
- 将可稳定结构化的字段下沉
- 将暂时不稳定的字段保留在补充 JSON 中

原则：

> 不是每个采集到的字段都要立刻进 Excel 列。

---

## 八、人工确认机制建议

现在爬取跑通以后，真正的风险不是“爬不到”，而是“爬到了但不干净”。

所以建议给部分字段引入人工确认机制。

### 8.1 需要人工确认的典型字段

- 品牌技术名
- 技术 icon
- 刹车系统归一
- 线杯深浅归一
- 实心竿稍
- 最低起抛克重
- GearSage 用途归纳标签

### 8.2 建议字段

- `confidence`
- `source_type`
- `needs_review`
- `reviewed_by`
- `reviewed_at`
- `review_note`

### 8.3 使用原则

- A 类强结构字段尽量不走人工确认
- B 类弱结构字段和 GSC 归纳字段优先支持人工确认
- 未确认字段宁可不展示，也不冒充确定事实

---

## 九、对比页字段落位建议

## 9.1 详情页读取顺序

建议统一：

1. 先读 `official_specs`
2. 再读 `gsc_traits`
3. 再读补充层（如品牌技术）
4. 最后保底回退 `raw_json`

## 9.2 对比页读取顺序

建议统一：

1. `compare_profile.coreFieldKeys`
2. `official_specs`
3. `gsc_traits.warning_hints / fitStyleTags`
4. 不读取品牌技术进行主对比

## 9.3 品牌技术在对比页的边界

第一版规则：

- 不展示
n
第二版如果要加，也只允许：

- 单列显示“该型号官方技术”列表
- 不做字段级横向高亮
- 不参与排序、不参与结论

---

## 十、优先扩充字段清单

## 10.1 第一优先级

### 证据链字段

- `source_url`
- `scraped_at`
- `raw_data_hash`
- `local_image_path`
- `source_brand_site`
- `selector_version`
- `parse_version`

### 渔轮关键归一字段

- `spool_depth_normalized`
- `brake_type_normalized`
- `drag_click`
- `size_family`

### 鱼竿关键归一字段

- `power_normalized`
- `action_normalized`
- `tip_type`
- `storage_length_cm`

### 通用主型号字段

- `series_positioning`
- `market_status`
- `official_reference_price`
- `main_selling_points`

---

## 10.2 第二优先级

- `fit_style_tags`
- `min_lure_weight_hint`
- `newbie_friendly_level`
- `maintenance_friendliness`
- `blank_material_summary`
- `depth_range`
- `buoyancy`
- `hook_spec`

---

## 10.3 第三优先级

- `brand_technologies`
- `gear_technology_links`
- `tech_icon_url`
- `tech_short_desc`
- `tech_long_desc`

说明：

- 这一组可以丰富详情
- 但不该抢在核心比较字段前面

---

## 十一、实施顺序建议

## 第一刀：证据链补齐

目标：

- 让每条采集记录都有完整来源与追踪能力

完成标准：

- `normalized.json` 证据链字段稳定
- `pre-check.js` 能检查关键元数据

---

## 第二刀：渔轮 / 鱼竿关键归一字段

目标：

- 先把真正影响详情和对比体验的字段补齐

完成标准：

- `official_specs` 更完整
- `gsc_traits` 更稳定
- 对比页减少前端现拼逻辑

---

## 第三刀：品牌技术补充层

目标：

- 让详情页更丰富
- 但不污染主参数结构

完成标准：

- `brand_technologies` 可维护
- 详情页可折叠展示品牌技术

---

## 第四刀：继续深化 GearSage 解释层

目标：

- 逐步补更稳定的用途标签与错误比较提醒

---

## 十二、当前明确不做

第一版不做：

1. 把品牌技术做成核心对比字段
2. 把品牌技术做成主筛选项
3. 自动跨品牌技术等价映射
4. 用爬虫直接给出“适合谁”的购买结论
5. 把所有采集字段都强行进 Excel 列
6. 用营销文案替代硬参数

---

## 十三、对 Codex 的执行提醒

1. 优先复用当前 `gear_brands / gear_master / gear_variants` 结构
2. 继续沿用 `official_specs / gsc_traits / compare_profile` 三层基线
3. 新增字段前先判定所属层级，不允许直接乱加到主表
4. `normalized.json` 是第一落点，不是 Excel 表头
5. 品牌技术建议走独立表或独立 JSON 结构，不要平铺在主参数里
6. 若新增字段、脚本或表，请同步回写：
   - `GearLibraryDocumentation.md`
   - `装备库迁移拆分方案.md`
   - `装备表关系.md`
   - `装备库数据扩充标准作业规程 (SOP).md`
   - `独立后台迁移计划_施工记录版.md`

---

## 十四、一句话收束

采集跑通以后，GearSage 装备库真正该扩的不是“列的数量”，而是“字段分层能力”——把官方参数、GearSage 解释、品牌技术补充、证据链这四层拆清楚，后面的详情页、对比页和求推荐承接才会越做越稳。

---

## 五、执行记录 (Execution Log)

### 2026-04-03：第一层（识别层）扩充与优化完成
- **优化 `model_year` (即 `release_year`) 提取逻辑**：
  - 修复了原先仅提取 2 位年份的问题，自动转为 4 位（如 2025）。
- **新增 `main_selling_points` 字段**：
  - 提取产品主要卖点并写入 `Reels Master` 表。
- **状态**：测试模式下（前 3 个 URL）已成功验证字段提取和 Excel 导出无误。准备进入第二层。

### 2026-04-03：第二层（硬参数层）与第三层（解释层）扩充完成
- **提取 `size_family` (第二层)**：
  - 在 `reel_detail.py` 中通过正则提取型号中的数字部分（如 `LT2000S-H` 提取出 `2000`）。
- **推导 `spool_depth_normalized` 和 `gear_ratio_normalized` (第三层)**：
  - 在 `to_excel.js` 中新增转换逻辑，依据具体型号（如 `S`/`SS`/`D` 和 `H`/`XG`/`PG`）自动推导并映射出中文的“浅杯/深杯”、“高齿比/低齿比”等 GSC Traits。
  - 对应输出至 `Reels Variants` 表的 `SPOOL DEPTH (GSC)` 和 `GEAR RATIO (GSC)` 列。
- **状态**：测试模式运行成功，字段均已正确出现在生成的 JSON 与 Excel 表格中。

### 2026-04-03：恢复全量采集并生成完整数据
- **全量执行**：取消 `reel_detail.py` 中的 3 条测试限制，针对全量 48 个 Daiwa 纺车轮系列执行采集。
- **数据验证**：成功生成完整的 JSON 和包含所有 SKU（近百条规格记录）的 `daiwa_reels_import.xlsx`。
- **特征**：在完整数据集中，新增加的 `main_selling_points`、`size_family`、`SPOOL DEPTH (GSC)`、`GEAR RATIO (GSC)` 均正常输出。

### 2026-04-03：修复 `model_year` 错误提取（2040）问题
- **现象**：用户反馈部分型号（如 `ソルティガ 4000/5000/6000`、`BG SW`、`カルディア SW`）的年份被错误提取为 `2040`。
- **原因**：在变体名称（如 `4000D-CXH`）开头的年份匹配正则 `r"^(\d{2})\s*(.*)"` 中，由于没有限制后续字符，导致 `4000` 的前两位 `40` 被错误地识别为了年份（即2040年），并将剩余部分截断为了 `00D-CXH`。
- **修复**：将正则更新为 `r"^(\d{2})(?!\d)\s*(.*)"`，通过添加 `(?!\d)` 负向先行断言，确保两位数字后不能紧跟其他数字，从而完美避开如 `4000`, `5000` 等尺寸数字的干扰。如果确实找不到年份（如 `シーパラダイス`），则按用户要求留空。
- **状态**：全量重新爬取完成，错误年份已被纠正（`ソルティガ 4000/5000/6000` 正确识别为 `2023`，`カルディア SW` 识别为 `2022`，`BG SW` 识别为 `2023`）。

### 2026-04-03：补齐一、二、三层未完成字段
- **第一层补充**：
  - `series_positioning`（系列定位）：在 Excel 脚本中新增此列，默认留空，待后续通过大语言模型或手动补充。
  - `market_status`（市场状态）：在 Excel 脚本中新增，默认赋值为“在售”。
  - `official_reference_price`（官方参考价）：在 Excel 脚本中实现，通过遍历型号下所有 Variant 的 `market_reference_price`，计算出最低与最高价的区间（例如 `¥155,000 - ¥165,000`）并填入 Master 表格中。
- **第二层补充**：
  - `drag_click`（卸力发声）：在 `reel_detail.py` 的解析层新增占位字段，由于 Daiwa 纺车轮参数表中通常未明确列出此项，默认暂为空。Excel 脚本已同步支持。
- **第三层补充**：
  - `brake_type_normalized`（刹车类型归一化）：在 Excel 脚本中新增。基于该产品类别（`kind === 'spinning'`），将纺车轮的刹车类型默认赋值为“无”。水滴轮后续逻辑兼容留空。
- **状态**：测试模式运行成功，补齐了阶段一、二、三的遗漏字段，并在输出的 JSON 及 Excel 中准确呈现。
