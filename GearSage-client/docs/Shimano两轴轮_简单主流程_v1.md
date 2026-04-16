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
- `gear_material`

### sidecar-only

- `canonical_alias`
- `version_signature`
- `gear_material` 的 `inferred / confirmed_blank` 语义

## 不能回退的规则

1. `body_material` 只写纯材质主值  
   例如：`Magnesium`、`Aluminum`、`Aluminum alloy`

2. `body_material_tech` 只承接机身技术/结构表达  
   例如：`HAGANE 机身`、`CORESOLID BODY / 一体成型`、`全加工`

3. `gear_material` 保留三档口径  
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
