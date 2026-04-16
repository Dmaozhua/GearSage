# Shimano baitcasting reel first real apply preview v1

- mode: apply
- generated_at: 2026-04-16T13:24:22.025Z
- baseline_source: `GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx`

## Scope

- samples: `SRE5003`、`SRE5004`、`SRE5015`、`SRE5019`、`SRE5025`
- fields in baseline write this round: `alias`、`body_material`、`body_material_tech`、`gear_material`、`model_year`
- fields in sidecar only this round: `version_signature`

## Rollback

- strategy: Keep the original baseline import workbook untouched and treat any apply result workbook as disposable candidate output.

## Preview rows

| target_scope | reel_id | detail_id | field_key | apply_input_layer | preview_action | target_baseline_column | apply_input_value | baseline_current_value |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| master | SRE5003 | SRED50014 | alias | master_dual_alias_value | controlled_replace | alias | 21 Antares DC |  |
| master | SRE5003 | SRED50014 | model_year | master_identity_value | fill_blank_only | model_year | 2021 |  |
| master | SRE5004 | SRED50020 | alias | master_dual_alias_value | controlled_replace | alias | 23 Antares DC MD Monster Drive |  |
| master | SRE5004 | SRED50020 | model_year | master_identity_value | fill_blank_only | model_year | 2023 | 2023 |
| master | SRE5015 | SRED50103 | alias | master_dual_alias_value | controlled_replace | alias | 24 Metanium DC |  |
| master | SRE5015 | SRED50103 | model_year | master_identity_value | fill_blank_only | model_year | 2024 |  |
| master | SRE5019 | SRED50131 | alias | master_dual_alias_value | controlled_replace | alias | 23 Calcutta Conquest BFS |  |
| master | SRE5019 | SRED50131 | model_year | master_identity_value | fill_blank_only | model_year | 2023 |  |
| master | SRE5025 | SRED50155 | alias | master_dual_alias_value | controlled_replace | alias | 22 Aldebaran BFS |  |
| master | SRE5025 | SRED50155 | model_year | master_identity_value | fill_blank_only | model_year | 2022 |  |
| detail | SRE5003 | SRED50014 | body_material | detail_direct_value | controlled_replace | body_material | Aluminum alloy | Hagane aluminum alloy body |
| detail | SRE5003 | SRED50014 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5003 | SRED50014 | gear_material | detail_inferred_value | fill_blank_only | gear_material | Brass |  |
| detail | SRE5003 | SRED50015 | body_material | detail_direct_value | controlled_replace | body_material | Aluminum alloy | Hagane aluminum alloy body |
| detail | SRE5003 | SRED50015 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5003 | SRED50015 | gear_material | detail_inferred_value | fill_blank_only | gear_material | Brass |  |
| detail | SRE5003 | SRED50016 | body_material | detail_direct_value | controlled_replace | body_material | Aluminum alloy | Hagane aluminum alloy body |
| detail | SRE5003 | SRED50016 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5003 | SRED50016 | gear_material | detail_inferred_value | fill_blank_only | gear_material | Brass |  |
| detail | SRE5003 | SRED50017 | body_material | detail_direct_value | controlled_replace | body_material | Aluminum alloy | Hagane aluminum alloy body |
| detail | SRE5003 | SRED50017 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5003 | SRED50017 | gear_material | detail_inferred_value | fill_blank_only | gear_material | Brass |  |
| detail | SRE5003 | SRED50018 | body_material | detail_direct_value | controlled_replace | body_material | Aluminum alloy | Hagane aluminum alloy body |
| detail | SRE5003 | SRED50018 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5003 | SRED50018 | gear_material | detail_inferred_value | fill_blank_only | gear_material | Brass |  |
| detail | SRE5003 | SRED50019 | body_material | detail_direct_value | controlled_replace | body_material | Aluminum alloy | Hagane aluminum alloy body |
| detail | SRE5003 | SRED50019 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5003 | SRED50019 | gear_material | detail_inferred_value | fill_blank_only | gear_material | Brass |  |
| detail | SRE5004 | SRED50020 | body_material | detail_confirmed_value | controlled_replace | body_material | Magnesium | metal frames |
| detail | SRE5004 | SRED50020 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5004 | SRED50020 | gear_material | detail_confirmed_value | controlled_replace | gear_material | Brass |  |
| detail | SRE5004 | SRED50021 | body_material | detail_confirmed_value | controlled_replace | body_material | Magnesium | metal frames |
| detail | SRE5004 | SRED50021 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5004 | SRED50021 | gear_material | detail_confirmed_value | controlled_replace | gear_material | Brass |  |
| detail | SRE5004 | SRED50022 | body_material | detail_confirmed_value | controlled_replace | body_material | Magnesium | metal frames |
| detail | SRE5004 | SRED50022 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5004 | SRED50022 | gear_material | detail_confirmed_value | controlled_replace | gear_material | Brass |  |
| detail | SRE5004 | SRED50023 | body_material | detail_confirmed_value | controlled_replace | body_material | Magnesium | metal frames |
| detail | SRE5004 | SRED50023 | body_material_tech | detail_confirmed_value | controlled_replace | body_material_tech | HAGANE 机身 |  |
| detail | SRE5004 | SRED50023 | gear_material | detail_confirmed_value | controlled_replace | gear_material | Brass |  |

- master_actions: 10
- detail_actions: 72
- sidecar_entries: 58

