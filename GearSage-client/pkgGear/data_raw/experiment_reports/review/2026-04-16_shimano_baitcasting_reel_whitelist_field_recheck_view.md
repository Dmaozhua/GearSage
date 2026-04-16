# Shimano baitcasting reel whitelist 字段复核视图

- generated_at: 2026-04-16T11:11:28.499Z
- input_identity_patch: `GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json`
- input_identity_quality: `GearSage-client/pkgGear/data_raw/identity_reports/quality/2026-04-16_shimano_baitcasting_reel_identity_quality_report.xlsx`
- input_whitelist_patch: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_patch.json`

当前只覆盖已稳定的 5 个 Shimano baitcasting reel identity 样本，不扩样本，不推进 apply。

## 汇总

- detail_rows_in_view: 24
- body_material_filled: 24
- body_material_tech_filled: 20
- gear_material_filled: 6
- rows_marked_consistent: 4
- rows_needing_manual_judgment: 20

## 当前字段判断

- 当前口径已较稳定：body_material、gear_material
- 仍需要人工再判断：body_material_tech

## 明细

| detail_id | reel_id | model_year | SKU | canonical_alias | normalized_alias | body_material | body_material_tech | gear_material | source_type | source_site | field_consistency_note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRED50014 | SRE5003 | 2021 | ANTARES DC R | 21 Antares DC Japan model 2021 | 21 Antares DC | Aluminum alloy | HAGANE 机身 | - | body_material:whitelist | body_material:JapanTackle | cross_year_do_not_generalize |
| SRED50015 | SRE5003 | 2021 | ANTARES DC L | 21 Antares DC Japan model 2021 | 21 Antares DC | Aluminum alloy | HAGANE 机身 | - | body_material:whitelist | body_material:JapanTackle | cross_year_do_not_generalize |
| SRED50016 | SRE5003 | 2021 | ANTARES DC HG R | 21 Antares DC Japan model 2021 | 21 Antares DC | Aluminum alloy | HAGANE 机身 | - | body_material:whitelist | body_material:JapanTackle | cross_year_do_not_generalize |
| SRED50017 | SRE5003 | 2021 | ANTARES DC HG L | 21 Antares DC Japan model 2021 | 21 Antares DC | Aluminum alloy | HAGANE 机身 | - | body_material:whitelist | body_material:JapanTackle | cross_year_do_not_generalize |
| SRED50018 | SRE5003 | 2021 | ANTARES DC XG R | 21 Antares DC Japan model 2021 | 21 Antares DC | Aluminum alloy | HAGANE 机身 | - | body_material:whitelist | body_material:JapanTackle | cross_year_do_not_generalize |
| SRED50019 | SRE5003 | 2021 | ANTARES DC XG L | 21 Antares DC Japan model 2021 | 21 Antares DC | Aluminum alloy | HAGANE 机身 | - | body_material:whitelist | body_material:JapanTackle | cross_year_do_not_generalize |
| SRED50155 | SRE5025 | 2022 | ALDEBARAN BFS HG R | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 | 22 Aldebaran BFS | Magnesium | HAGANE 机身 | - | body_material:manual | body_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50156 | SRE5025 | 2022 | ALDEBARAN BFS HG L | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 | 22 Aldebaran BFS | Magnesium | HAGANE 机身 | - | body_material:manual | body_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50157 | SRE5025 | 2022 | ALDEBARAN BFS XG R | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 | 22 Aldebaran BFS | Magnesium | HAGANE 机身 | - | body_material:manual | body_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50158 | SRE5025 | 2022 | ALDEBARAN BFS XG L | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 | 22 Aldebaran BFS | Magnesium | HAGANE 机身 | - | body_material:manual | body_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50020 | SRE5004 | 2023 | ANTARES DC MD HG RIGHT | 23 Antares DC MD Monster Drive 2023 | 23 Antares DC MD Monster Drive | Magnesium | - | - | body_material:manual | body_material:JapanTackle | manual_override_present_keep_year_bound; cross_year_do_not_generalize |
| SRED50021 | SRE5004 | 2023 | ANTARES DC MD HG LEFT | 23 Antares DC MD Monster Drive 2023 | 23 Antares DC MD Monster Drive | Magnesium | - | - | body_material:manual | body_material:JapanTackle | manual_override_present_keep_year_bound; cross_year_do_not_generalize |
| SRED50022 | SRE5004 | 2023 | ANTARES DC MD XG RIGHT | 23 Antares DC MD Monster Drive 2023 | 23 Antares DC MD Monster Drive | Magnesium | - | - | body_material:manual | body_material:JapanTackle | manual_override_present_keep_year_bound; cross_year_do_not_generalize |
| SRED50023 | SRE5004 | 2023 | ANTARES DC MD XG LEFT | 23 Antares DC MD Monster Drive 2023 | 23 Antares DC MD Monster Drive | Magnesium | - | - | body_material:manual | body_material:JapanTackle | manual_override_present_keep_year_bound; cross_year_do_not_generalize |
| SRED50131 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG RIGHT | 23 Calcutta Conquest BFS Japan model 2023 | 23 Calcutta Conquest BFS | Aluminum | 全加工 | - | body_material:whitelist | body_material:JapanTackle | identity_bound_and_field_value_consistent |
| SRED50132 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG LEFT | 23 Calcutta Conquest BFS Japan model 2023 | 23 Calcutta Conquest BFS | Aluminum | 全加工 | - | body_material:whitelist | body_material:JapanTackle | identity_bound_and_field_value_consistent |
| SRED50133 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG RIGHT | 23 Calcutta Conquest BFS Japan model 2023 | 23 Calcutta Conquest BFS | Aluminum | 全加工 | - | body_material:whitelist | body_material:JapanTackle | identity_bound_and_field_value_consistent |
| SRED50134 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG LEFT | 23 Calcutta Conquest BFS Japan model 2023 | 23 Calcutta Conquest BFS | Aluminum | 全加工 | - | body_material:whitelist | body_material:JapanTackle | identity_bound_and_field_value_consistent |
| SRED50103 | SRE5015 | 2024 | Metanium DC 70 | 24 Metanium DC (digital control) Japan model 2024 | 24 Metanium DC | Magnesium | CORESOLID BODY / 一体成型 | Duralumin drive gear | body_material:manual \| gear_material:whitelist | body_material:JapanTackle \| gear_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50104 | SRE5015 | 2024 | Metanium DC 71 | 24 Metanium DC (digital control) Japan model 2024 | 24 Metanium DC | Magnesium | CORESOLID BODY / 一体成型 | Duralumin drive gear | body_material:manual \| gear_material:whitelist | body_material:JapanTackle \| gear_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50105 | SRE5015 | 2024 | Metanium DC 70HG | 24 Metanium DC (digital control) Japan model 2024 | 24 Metanium DC | Magnesium | CORESOLID BODY / 一体成型 | Duralumin drive gear | body_material:manual \| gear_material:whitelist | body_material:JapanTackle \| gear_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50106 | SRE5015 | 2024 | Metanium DC 71HG | 24 Metanium DC (digital control) Japan model 2024 | 24 Metanium DC | Magnesium | CORESOLID BODY / 一体成型 | Duralumin drive gear | body_material:manual \| gear_material:whitelist | body_material:JapanTackle \| gear_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50107 | SRE5015 | 2024 | Metanium DC 70XG | 24 Metanium DC (digital control) Japan model 2024 | 24 Metanium DC | Magnesium | CORESOLID BODY / 一体成型 | Duralumin drive gear | body_material:manual \| gear_material:whitelist | body_material:JapanTackle \| gear_material:JapanTackle | manual_override_present_keep_year_bound |
| SRED50108 | SRE5015 | 2024 | Metanium DC 71XG | 24 Metanium DC (digital control) Japan model 2024 | 24 Metanium DC | Magnesium | CORESOLID BODY / 一体成型 | Duralumin drive gear | body_material:manual \| gear_material:whitelist | body_material:JapanTackle \| gear_material:JapanTackle | manual_override_present_keep_year_bound |

## 何时适合进入 apply 前的下一轮 dry-run

- 当前 5 个样本的 identity 底座已稳定。
- 仍应先人工看完这份复核视图，确认 `field_consistency_note` 不再提示跨年款误泛化或来源层级问题。
- 当这 5 个样本里需要人工判断的行都被确认可接受后，才适合回到 apply 前的下一轮 dry-run。
