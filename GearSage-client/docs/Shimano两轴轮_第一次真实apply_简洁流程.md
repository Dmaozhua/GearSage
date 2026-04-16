# Shimano 两轴轮第一次真实 apply 简洁流程

更新时间：2026-04-16

这份文档只回答三件事：

1. 你现在到底要关心什么
2. 你现在只需要看哪些文件
3. 你现在只需要拍板什么

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

---

## 六、如果你点头，下一步是什么

如果你确认预览没问题，下一步就不是再讨论流程，而是：

- 用当前入口脚本执行第一次真实 apply
- 生成一份新的候选结果文件
- 原始 baseline 副本保持不动

也就是说，下一步依然是可回退的，不会直接改总表，更不会碰数据库。
