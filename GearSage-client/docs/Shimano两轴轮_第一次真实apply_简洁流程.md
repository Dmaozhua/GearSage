# Shimano 两轴轮第一次真实 apply 简洁流程

更新时间：2026-04-16

这份文档只回答三件事：

1. 你现在到底要关心什么
2. 你现在只需要看哪些文件
3. 你现在只需要拍板什么

如果后面再讨论 reel 字段到底按什么统一，请先看：

- [`渔轮字段统一口径_v1.md`](/Users/tommy/GearSage/GearSage-client/docs/渔轮字段统一口径_v1.md)
- [`渔轮字段第一批接入最终总表清单_v1.md`](/Users/tommy/GearSage/GearSage-client/docs/渔轮字段第一批接入最终总表清单_v1.md)

---

## 一、当前进度

当前已经完成：

- 5 个 Shimano 两轴轮样本的身份识别
- 字段复核
- 冲突裁决
- apply 输入整理
- apply consumer 适配
- 第一次真实 apply 的预览

当前还**没有**做：

- 真实 apply
- 最终总表修改
- 导库
- 数据库写入

---

## 二、你现在只需要关心 3 件事

### 1. 本轮样本范围

只处理这 5 个样本：

- `SRE5003`
- `SRE5004`
- `SRE5015`
- `SRE5019`
- `SRE5025`

### 2. 本轮字段范围

本轮只看这 6 个字段：

- `model_year`
- `alias`
- `version_signature`
- `body_material`
- `body_material_tech`
- `gear_material`

### 3. 本轮哪些字段会写，哪些不会写

本轮进入 baseline 候选写入的字段：

- `model_year`
- `alias`
- `body_material`
- `body_material_tech`
- `gear_material`

本轮只进审计，不进 baseline 的字段：

- `version_signature`

原因已经定了：

- 本轮不新增 baseline 列
- 不做临时映射
- 不借别的列落值

---

## 三、你现在只需要看 3 个文件

### 1. 主文件：预览表格

看这个：

- [`第一次真实apply_预览.xlsx`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_预览.xlsx)

它回答的是：

- 这次如果执行第一次真实 apply，会改哪些行
- 每个字段准备写什么值

### 2. 规则文件：执行前检查清单

看这个：

- [`第一次真实apply_执行前检查清单.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_执行前检查清单.md)

它回答的是：

- 本轮写哪些字段
- 哪些字段只进 sidecar
- overwrite policy 是什么
- rollback 怎么做

### 3. 摘要文件：预览说明

看这个：

- [`第一次真实apply_预览.md`](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_预览.md)

它回答的是：

- 这次预览的汇总数字
- master/detail/sidecar 各有多少动作

---

## 四、你现在只需要拍板 1 件事

你现在真正要拍板的只有一件事：

**是否按当前预览，执行第一次真实 apply。**

不用再拍板的事情：

- `version_signature sidecar-only`
- 当前 5 个样本范围
- 当前 6 个字段范围
- `SRE5003 gear_material` 保持 inferred
- `SRE5019 gear_material` 保持 confirmed blank
- `SRE5004 body_material_tech = HAGANE 机身`

这些都已经定了。

---

## 五、你不用再看哪些过程文件

下面这些已经属于过程推导，不再是你当前拍板必须看的入口：

- layered report
- conflict strategy
- 第二轮 / 第三轮 dry-run 对比
- consumer 适配中间表
- whitelist followup support
- 各种 patch dry-run diff

我已经把 review 目录收缩成“最终入口文件 + 少量机器输入文件”。

### 当前建议保留的文件

1. 当前工作副本  
   - [shimano_baitcasting_reels_import_副本.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx)
2. apply 前备份  
   - [shimano_baitcasting_reels_import_副本_第一次真实apply前备份.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本_第一次真实apply前备份.xlsx)
3. 真实 apply 结果候选  
   - [第一次真实apply_结果候选.xlsx](/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_结果候选.xlsx)
4. 当前入口文档  
   - [渔轮字段统一口径_v1.md](/Users/tommy/GearSage/GearSage-client/docs/渔轮字段统一口径_v1.md)  
   - [渔轮字段第一批接入最终总表清单_v1.md](/Users/tommy/GearSage/GearSage-client/docs/渔轮字段第一批接入最终总表清单_v1.md)  
   - [渔轮最终总表字段变更执行方案_v1.md](/Users/tommy/GearSage/GearSage-client/docs/渔轮最终总表字段变更执行方案_v1.md)  
   - [Shimano两轴轮_第一次真实apply_简洁流程.md](/Users/tommy/GearSage/GearSage-client/docs/Shimano两轴轮_第一次真实apply_简洁流程.md)

---

## 六、如果你点头，下一步是什么

如果你确认预览没问题，下一步就不是再讨论流程，而是：

- 用当前入口脚本执行第一次真实 apply
- 生成一份新的候选结果文件
- 原始 baseline 副本保持不动

也就是说，下一步依然是可回退的，不会直接改总表，更不会碰数据库。

---

## 七、这轮 reel 字段里，哪些地方还没对齐

为了避免后面又绕回“文档说有、为什么最终表没有”，这轮先把不对齐点写死：

### 已对齐到最终总表

- 主表：
  - `model_year`
  - `alias`
- detail：
  - `body_material`
  - `gear_material`

### 只在当前工作副本里有，还没进入最终总表

- 主表：
  - `Description`
- detail：
  - `spool_weight_g`
  - `spool_axis_type`
  - `knob_size`
  - `knob_bearing_spec`
  - `custom_spool_compatibility`
  - `custom_knob_compatibility`
  - `official_environment`
  - `line_capacity_display`
  - `is_sw_edition`
  - `variant_description`
  - `body_material_tech`

### 当前只保留在 sidecar / 审计层

- `version_signature`
- `canonical_alias`
- `gear_material inferred`
- `gear_material confirmed_blank`

### 当前流程里最容易误解的一点

当前 reel 这条链里：

- “字段值得做”
- “中间层已经建出来”
- “最终总表已经接住”

是三件不同的事。

所以后面讨论时，默认先问的是：

**这个字段现在是“文档想做”、”工作副本已有“，还是“最终总表已接入”？**
