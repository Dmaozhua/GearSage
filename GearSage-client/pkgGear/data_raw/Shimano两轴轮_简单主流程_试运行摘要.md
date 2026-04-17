# Shimano 两轴轮简单主流程试运行摘要

更新时间：2026-04-16 15:01:10

## 默认入口

- `scripts/run_shimano_bc_simple_flow.js`

## 本轮自动补值字段

- 主表：`model_year`、`alias`
- 详情：`body_material`、`body_material_tech`、`gear_material`

## 辅助站补到的字段

- `model_year`：5 个主商品
- `alias`：5 个主商品
- `body_material`：24 条明细
- `body_material_tech`：24 条明细
- `gear_material`：20 条明细

## 仍然留空的字段

- `gear_material`：4 条明细（当前保持空值）

## sidecar-only

- `canonical_alias`：5 个主商品
- `version_signature`：5 个主商品
- `gear_material` 的 inferred / blank 语义：24 条明细

## 输出文件

- 工作副本：`GearSage-client/pkgGear/data_raw/Shimano两轴轮_工作副本_简单主流程.xlsx`
- sidecar：`GearSage-client/pkgGear/data_raw/Shimano两轴轮_简单主流程_sidecar.json`
- 摘要：`GearSage-client/pkgGear/data_raw/Shimano两轴轮_简单主流程_试运行摘要.md`

## 说明

- 官网有值就直接用官网。
- 官网缺值才触发白名单辅助站补值。
- 查到明确值才写入工作副本，查不到就留空。
- `gear_material` 即使写入工作副本，也保留 source_type / layer 语义，避免把 inferred 当成官方值。
