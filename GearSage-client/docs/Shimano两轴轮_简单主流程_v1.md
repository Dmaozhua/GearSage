# Shimano两轴轮 简单主流程 v1

更新时间：2026-04-16

这条链以后默认就按这个走，不再把日常流程拆成一串 review / patch / apply 文档。

## 默认主流程

### A. 官网抓取主数据

- 先跑官网抓取，拿到 Shimano 两轴轮主数据。
- 官网有值就直接用官网。

### B. 白名单辅助站自动补值

- 只对官网缺失字段触发。
- 只查白名单辅助站。
- 查到明确值就补进工作副本。
- 查不到就留空。
- 当前抓取阶段对所有已启用白名单站，默认开放当前 reel 白名单目标字段全量抓取；站点之间只保留优先级和侧重点，不再用字段白名单卡住抓取。

### C. 直接写入当前工作副本

- 默认输出还是工作副本，不直接进最终总表。
- 日常默认入口不再走多轮 review / patch / apply。

### D. 最少追溯信息

只保留够追溯的最小信息：

- `source_type`
- `source_site`
- `source_url`
- `evidence_type`
- `confidence`

## 当前并入简单主流程的字段

### 主表

- `model_year`
- `alias`

### detail

- `body_material`
- `body_material_tech`
- `main_gear_material`

### sidecar-only

- `canonical_alias`
- `version_signature`
- `main_gear_material` 的 `inferred / confirmed_blank` 语义

## 当前白名单“目标抓取字段”范围

这里说的是：**白名单阶段要主动去找的字段**。  
先不区分最终落哪张表，也先不强行要求每个字段都一定能抓到。

### 当前目标抓取字段

- `model_cn`
- `model_year`
- `drag_click`
- `spool_diameter_mm`
- `spool_width_mm`
- `spool_weight_g`
- `spool_axis_type`
- `knob_size`
- `knob_bearing_spec`
- `handle_knob_type`
- `handle_knob_material`
- `handle_knob_exchange_size`
- `handle_hole_spec`
- `body_material`
- `body_material_tech`
- `is_handle_double`
- `main_gear_material`
- `main_gear_size`
- `minor_gear_material`
- `market_reference_price`
- `series_positioning`
- `main_selling_points`
- `player_environment`
- `usage_environment`
- `player_positioning`
- `player_selling_points`
- `custom_spool_compatibility`
- `custom_knob_compatibility`

补充名词统一：

- `drag_click` = `Drag Clicker` / `Line Out Alarm` / `卸力报警`

### 当前默认主流程已经直接写工作副本的字段

- 主表：
  - `model_year`
  - `alias`
- detail：
  - `body_material`
  - `body_material_tech`
  - `main_gear_material`

### 当前先只保留在 sidecar / metadata 的字段

- `canonical_alias`
- `version_signature`
- `main_gear_material` 的 `inferred / confirmed_blank` 语义

### 说明

- 现在的口径是：**白名单先全量抓，查得到就记下来；怎么落表后面单独定。**
- 也就是说：
  - “抓没抓” 和 “落不落表” 先拆开
  - 不再因为当前主流程只写少量字段，就误以为其它字段不该抓

## 当前白名单站点侧重点

### 描述层主站

- `japantackle`
- `tackletour`
- `jdmfishing`

当前主要负责：

- 年款 / alias
- 技术表达
- 机身材质
- 用途 / 环境
- 系列定位
- 主卖点

### 深玩家数据主站

- `avail`
- `hedgehog_studio`

当前主要负责：

- 线杯重量
- 线杯轴型
- 线杯/摇臂/握丸兼容
- 孔位规格
- 零件规格
- 改装/调校向信息

### 深玩家数据当前信任口径

- 对于改装热门型号，`avail / hedgehog_studio` 能抓到深玩家数据是正常预期。
- 对于改装潜力较小、改装热度较低的型号，抓不到深玩家数据也是正常结果，不视为流程失败。
- 当前阶段，`spool_weight_g` 允许保留**原厂线杯重量**，即使该值来自 `avail / hedgehog_studio` 的对比页，也可作为玩家数据使用。
- 当前阶段，**改装线杯材质不写入表格**。例如 `Super duralumin` 这类 Avail 改装件材质，先不作为 reel 主数据落表。

## 不能回退的规则

1. `body_material` 只写纯材质主值  
   例如：`Magnesium`、`Aluminum`、`Aluminum alloy`

2. `body_material_tech` 只承接机身技术/结构表达  
   例如：`HAGANE 机身`、`CORESOLID BODY / 一体成型`、`全加工`

3. `main_gear_material` 保留三档口径  
   - `direct_write`
   - `cross_source_inferred`
   - `manual_required`

4. `model_year` 允许通过辅助站补齐  
   官网没 year，不再当成人工前置 blocker。

5. `alias` 继续区分 `canonical_alias` / `normalized_alias`  
   工作副本默认写最适合落表的 `normalized_alias`。

6. `version_signature` 继续 sidecar-only  
   当前不为了它改工作表结构。

7. 不能按 model 粗暴跨年款泛化  
   尽量按 `reel_id`、`model_year`、`SKU / detail_id` 绑定。

8. 子商品敏感字段优先按子商品绑定  
   对于 `spool_weight_g`、`spool_axis_type`、`spool_diameter_mm`、`spool_width_mm`、`handle_hole_spec`、`handle_knob_exchange_size`、`custom_spool_compatibility`、`custom_knob_compatibility`、`main_gear_size` 这类可能随线杯规格 / 容线量 / 子商品变化的字段：
   - 优先按 `reel_id + SKU` 绑定
   - 如果来源没有细到子商品，则允许回退使用主商品级值
   - 当前测试阶段，子商品没有单独数据时，可以直接用主商品级数据，不区分容线量
   - 只有在来源明确匹配到具体规格，且明确不能泛化时，才只写对应子商品

9. `drag_click` 对水滴轮不允许默认写 `1`
   - 纺车轮当前可按默认带点击提示理解
   - 水滴轮必须按型号查找再填写
   - 官网或白名单没有直观写出时，不自动补 `1`
   - 若有明确玩家确认，可写 `0` 或 `1`

10. `official_environment` 不能只靠页面分类词
   - 官网正文、规格和明确场景词优先于页面目录/分类标题
   - 如出现 `海鲈`、`海水鱼`、`saltwater` 这类强场景词，应优先判为 `海水路亚`
   - 如果官网只有大类挂载、正文没有明确环境信号，宁可留空，也不要把目录词机械映射成最终值

## 子商品敏感字段当前执行规则

- 当前测试链里，`spool_weight_g` 已按子商品敏感字段处理。
- 像 `Metanium 150 / 70 / 100` 这种同主商品下存在多套规格族的情况，如果当前没有子商品级重量，也允许回退使用主商品级重量。
- 像 `Aldebaran BFS`、`Aldebaran MGL`、`Bantam` 这种当前样本下可视为共用同一套线杯规格族的情况，允许把同一重量写入同组子商品。

## `drag_click` 当前执行规则

- 名词统一：`drag_click = 卸力报警 = Drag Clicker / Line Out Alarm`
- 这条规则适用于**所有 Shimano 水滴轮商品**，不只当前测试样本
- `drag_click` 当前在白名单辅助站里保持**高深度查找**
- 水滴轮当前不再默认写 `1`
- 只有在官网/白名单明确写出 `Drag Clicker` / `Line Out Alarm` / 卸力报警相关表达时，才自动写值
- `Clicking star drag` 只表示星形卸力旋钮有点击感，当前**不等于** `drag_click=1`
- 若用户明确确认某型号不存在卸力报警，也可按人工确认写 `0`
- 当前执行上，`drag_click` 的查找会持续覆盖：
  - 官网详情页
  - `japantackle`
  - `tackletour`
  - `jdmfishing`
  - 其他已启用白名单站中可能出现明确 `Line Out Alarm / Drag Clicker` 描述的页面
- 也就是说：即使默认简单主流程里别的字段还在按“先抓回来、后定落表”推进，`drag_click` 这条会继续保持更深一层的白名单查找，不局限于当前 8 个商品
- 当前测试样本里：
  - `22 Aldebaran BFS` 已按白名单明确 `Line alarm` 写 `1`
  - `22 Exsence DC` 已按白名单明确 `Line alarm` 写 `1`
  - `20 Metanium` 已按人工确认写 `0`
  - 只有 `Clicking star drag`、没有 `Line alarm / Line Out Alarm` 的型号，先留空

## `official_environment` 当前执行规则

- 优先读官网正文和规格里的明确环境信号，不只看页面分类
- `海鲈`、`海水鱼`、`saltwater`、`seabass` 这类词，优先归到 `海水路亚`
- `船钓`、`jig`、`jigger`、`slow jig` 这类词，优先归到 `船钓`
- 只有明确出现 `淡水`、`溪流`、`鳟`、`trout` 这类词时，才归到 `淡水路亚`
- 如果官网只是挂在某个分类下，但正文没有足够环境信号，先不要硬判

## 当前默认入口

- 脚本：[`run_shimano_bc_simple_flow.js`](/Users/tommy/GearSage/scripts/run_shimano_bc_simple_flow.js)

## 当前默认输出

- 工作副本：[`Shimano两轴轮_工作副本_简单主流程.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/Shimano两轴轮_工作副本_简单主流程.xlsx)
- 来源 sidecar：[`Shimano两轴轮_简单主流程_sidecar.json`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/Shimano两轴轮_简单主流程_sidecar.json)
- 试运行摘要：[`Shimano两轴轮_简单主流程_试运行摘要.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/Shimano两轴轮_简单主流程_试运行摘要.md)

## 旧复杂流程现在怎么用

旧流程文件不删，但降级成两种用途：

1. 历史验证资料  
2. 复杂问题备用工具

它们不再是默认主流程入口。

当前应降级理解的文件 / 脚本包括：

- [`Shimano两轴轮_第一次真实apply_简洁流程.md`](/Users/tommy/GearSage/GearSage-client/docs/Shimano两轴轮_第一次真实apply_简洁流程.md)
- `run_shimano_bc_identity_enrichment.js`
- `run_shimano_bc_whitelist_experiment.js`
- `build_shimano_bc_review_patch.js`
- `build_shimano_bc_apply_input.js`
- `run_shimano_bc_apply_consumer_dry_run.js`
- `run_shimano_bc_first_real_apply_entry.js`

## 以后日常只看哪几个文件

默认只看这 3 个：

1. [`Shimano两轴轮_简单主流程_v1.md`](/Users/tommy/GearSage/GearSage-client/docs/Shimano两轴轮_简单主流程_v1.md)
2. [`Shimano两轴轮_工作副本_简单主流程.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/Shimano两轴轮_工作副本_简单主流程.xlsx)
3. [`Shimano两轴轮_简单主流程_试运行摘要.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/Shimano两轴轮_简单主流程_试运行摘要.md)
