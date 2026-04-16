# Shimano BC Approved Patch Apply Diff

- mode: dry-run
- baseline_import: `GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx`
- approved_patch: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_patch.json`
- apply_result_workbook: not written in dry-run mode

## Summary

- mode: dry-run
- row_status:blocked_validation: 26
- row_status:no_change: 4
- reason_code:baseline_model_year_blank: 18
- reason_code:patch_model_year_blank: 8

## Diff Rows

| detail_id | field_key | row_status | reason_code | body_material_old | body_material_new | body_material_tech_old | body_material_tech_new | gear_material_old | gear_material_new |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRED50014 | body_material | blocked_validation | baseline_model_year_blank | Hagane aluminum alloy body |  |  |  |  |  |
| SRED50015 | body_material | blocked_validation | baseline_model_year_blank | Hagane aluminum alloy body |  |  |  |  |  |
| SRED50016 | body_material | blocked_validation | baseline_model_year_blank | Hagane aluminum alloy body |  |  |  |  |  |
| SRED50017 | body_material | blocked_validation | baseline_model_year_blank | Hagane aluminum alloy body |  |  |  |  |  |
| SRED50018 | body_material | blocked_validation | baseline_model_year_blank | Hagane aluminum alloy body |  |  |  |  |  |
| SRED50019 | body_material | blocked_validation | baseline_model_year_blank | Hagane aluminum alloy body |  |  |  |  |  |
| SRED50020 | body_material | no_change |  | metal frames | Magnesium |  |  |  |  |
| SRED50021 | body_material | no_change |  | metal frames | Magnesium |  |  |  |  |
| SRED50022 | body_material | no_change |  | metal frames | Magnesium |  |  |  |  |
| SRED50023 | body_material | no_change |  | metal frames | Magnesium |  |  |  |  |
| SRED50103 | body_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50103 | gear_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50104 | body_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50104 | gear_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50105 | body_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50105 | gear_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50106 | body_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50106 | gear_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50107 | body_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50107 | gear_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50108 | body_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50108 | gear_material | blocked_validation | baseline_model_year_blank | Core solid metal body |  |  |  | Duralumin drive gear |  |
| SRED50131 | body_material | blocked_validation | patch_model_year_blank | Fully machined aluminum body and side plates |  |  |  |  |  |
| SRED50132 | body_material | blocked_validation | patch_model_year_blank | Fully machined aluminum body and side plates |  |  |  |  |  |
| SRED50133 | body_material | blocked_validation | patch_model_year_blank | Fully machined aluminum body and side plates |  |  |  |  |  |
| SRED50134 | body_material | blocked_validation | patch_model_year_blank | Fully machined aluminum body and side plates |  |  |  |  |  |
| SRED50155 | body_material | blocked_validation | patch_model_year_blank | Hagane body system |  |  |  |  |  |
| SRED50156 | body_material | blocked_validation | patch_model_year_blank | Hagane body system |  |  |  |  |  |
| SRED50157 | body_material | blocked_validation | patch_model_year_blank | Hagane body system |  |  |  |  |  |
| SRED50158 | body_material | blocked_validation | patch_model_year_blank | Hagane body system |  |  |  |  |  |

