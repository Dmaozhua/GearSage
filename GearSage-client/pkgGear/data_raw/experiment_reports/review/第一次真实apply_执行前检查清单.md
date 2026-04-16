# Shimano baitcasting reel final pre-apply checklist v1

- generated_at: 2026-04-16T13:24:22.026Z

## Current sample scope

- `SRE5003`
- `SRE5004`
- `SRE5015`
- `SRE5019`
- `SRE5025`

## Current field scope

- `model_year`
- `alias`
- `version_signature`
- `body_material`
- `body_material_tech`
- `gear_material`

## Fields writing baseline this round

- `alias`
- `body_material`
- `body_material_tech`
- `gear_material`
- `model_year`

## Fields sidecar-only this round

- `version_signature`

## Overwrite policy

- `model_year`: fill blank only
- `alias`: controlled replace for blank/noise, write `normalized_alias`, keep `canonical_alias` in sidecar
- `body_material`: controlled replace legacy values
- `body_material_tech`: fill blank or controlled replace when review-confirmed
- `gear_material` direct/inferred: follow builder overwrite policy and preserve source semantics
- `gear_material` confirmed_blank: preserve blank, no backfill

## Rollback strategy

- Keep source baseline workbook unchanged
- Treat apply result workbook as candidate output only
- If apply is canceled, discard candidate workbook and audit artifacts from that run

## Audit file locations

- plan: `GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_执行计划.json`
- preview: `GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_预览.xlsx`
- preview markdown: `GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_预览.md`
- audit: `GearSage-client/pkgGear/data_raw/experiment_reports/review/第一次真实apply_审计.json`

## Sidecar-specific note

- `version_signature` stays sidecar-only in first real apply
- No temporary mapping and no baseline column borrowing

