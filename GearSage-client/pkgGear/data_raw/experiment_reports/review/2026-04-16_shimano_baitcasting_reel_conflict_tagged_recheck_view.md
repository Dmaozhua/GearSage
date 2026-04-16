# Shimano baitcasting reel conflict-tagged recheck view

- generated_at: 2026-04-16T12:36:43.162Z
- input_recheck_view: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_field_recheck_view.xlsx`
- input_identity_patch: `GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json`
- input_conflict_strategy: `GearSage-client/docs/Shimano_baitcasting_reel_字段数据冲突解决策略_v1.md`

当前只覆盖已稳定的 5 个 Shimano baitcasting reel 样本，不扩样本，不推进 apply。

## 汇总

- total_rows: 144
- ready_rows: 144
- hold_rows: 0
- dual_source_kept: 24
- no_conflict_resolved: 110
- accepted_inferred: 6
- accepted_manual_blank: 4

## 当前可进入下一轮 dry-run 的字段

- SRE5003:alias
- SRE5003:body_material
- SRE5003:body_material_tech
- SRE5003:gear_material
- SRE5003:model_year
- SRE5003:version_signature
- SRE5004:alias
- SRE5004:body_material
- SRE5004:body_material_tech
- SRE5004:gear_material
- SRE5004:model_year
- SRE5004:version_signature
- SRE5015:alias
- SRE5015:body_material
- SRE5015:body_material_tech
- SRE5015:gear_material
- SRE5015:model_year
- SRE5015:version_signature
- SRE5019:alias
- SRE5019:body_material
- SRE5019:body_material_tech
- SRE5019:gear_material
- SRE5019:model_year
- SRE5019:version_signature
- SRE5025:alias
- SRE5025:body_material
- SRE5025:body_material_tech
- SRE5025:gear_material
- SRE5025:model_year
- SRE5025:version_signature

## 当前仍需人工挂起的字段

- 无

## 挂起原因

- 当前范围内无挂起原因

## 明细

| detail_id | reel_id | model_year | SKU | field_key | current_value | source_type | decision_bucket | conflict_status | conflict_tag | conflict_resolution_state | ready_for_next_dry_run | hold_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRED50014 | SRE5003 | 2021 | ANTARES DC R | alias | 21 Antares DC Japan model 2021 => 21 Antares DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50014 | SRE5003 | 2021 | ANTARES DC R | body_material | Aluminum alloy | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50014 | SRE5003 | 2021 | ANTARES DC R | body_material_tech | HAGANE 机身 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50014 | SRE5003 | 2021 | ANTARES DC R | gear_material | Brass | confirmed_inferred | cross_source_inferred | resolved | accepted_inferred | keep_inferred_non_official | yes | - |
| SRED50014 | SRE5003 | 2021 | ANTARES DC R | model_year | 2021 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50014 | SRE5003 | 2021 | ANTARES DC R | version_signature | ANTARES DC \| 2021 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50015 | SRE5003 | 2021 | ANTARES DC L | alias | 21 Antares DC Japan model 2021 => 21 Antares DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50015 | SRE5003 | 2021 | ANTARES DC L | body_material | Aluminum alloy | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50015 | SRE5003 | 2021 | ANTARES DC L | body_material_tech | HAGANE 机身 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50015 | SRE5003 | 2021 | ANTARES DC L | gear_material | Brass | confirmed_inferred | cross_source_inferred | resolved | accepted_inferred | keep_inferred_non_official | yes | - |
| SRED50015 | SRE5003 | 2021 | ANTARES DC L | model_year | 2021 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50015 | SRE5003 | 2021 | ANTARES DC L | version_signature | ANTARES DC \| 2021 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50016 | SRE5003 | 2021 | ANTARES DC HG R | alias | 21 Antares DC Japan model 2021 => 21 Antares DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50016 | SRE5003 | 2021 | ANTARES DC HG R | body_material | Aluminum alloy | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50016 | SRE5003 | 2021 | ANTARES DC HG R | body_material_tech | HAGANE 机身 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50016 | SRE5003 | 2021 | ANTARES DC HG R | gear_material | Brass | confirmed_inferred | cross_source_inferred | resolved | accepted_inferred | keep_inferred_non_official | yes | - |
| SRED50016 | SRE5003 | 2021 | ANTARES DC HG R | model_year | 2021 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50016 | SRE5003 | 2021 | ANTARES DC HG R | version_signature | ANTARES DC \| 2021 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50017 | SRE5003 | 2021 | ANTARES DC HG L | alias | 21 Antares DC Japan model 2021 => 21 Antares DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50017 | SRE5003 | 2021 | ANTARES DC HG L | body_material | Aluminum alloy | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50017 | SRE5003 | 2021 | ANTARES DC HG L | body_material_tech | HAGANE 机身 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50017 | SRE5003 | 2021 | ANTARES DC HG L | gear_material | Brass | confirmed_inferred | cross_source_inferred | resolved | accepted_inferred | keep_inferred_non_official | yes | - |
| SRED50017 | SRE5003 | 2021 | ANTARES DC HG L | model_year | 2021 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50017 | SRE5003 | 2021 | ANTARES DC HG L | version_signature | ANTARES DC \| 2021 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50018 | SRE5003 | 2021 | ANTARES DC XG R | alias | 21 Antares DC Japan model 2021 => 21 Antares DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50018 | SRE5003 | 2021 | ANTARES DC XG R | body_material | Aluminum alloy | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50018 | SRE5003 | 2021 | ANTARES DC XG R | body_material_tech | HAGANE 机身 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50018 | SRE5003 | 2021 | ANTARES DC XG R | gear_material | Brass | confirmed_inferred | cross_source_inferred | resolved | accepted_inferred | keep_inferred_non_official | yes | - |
| SRED50018 | SRE5003 | 2021 | ANTARES DC XG R | model_year | 2021 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50018 | SRE5003 | 2021 | ANTARES DC XG R | version_signature | ANTARES DC \| 2021 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50019 | SRE5003 | 2021 | ANTARES DC XG L | alias | 21 Antares DC Japan model 2021 => 21 Antares DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50019 | SRE5003 | 2021 | ANTARES DC XG L | body_material | Aluminum alloy | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50019 | SRE5003 | 2021 | ANTARES DC XG L | body_material_tech | HAGANE 机身 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50019 | SRE5003 | 2021 | ANTARES DC XG L | gear_material | Brass | confirmed_inferred | cross_source_inferred | resolved | accepted_inferred | keep_inferred_non_official | yes | - |
| SRED50019 | SRE5003 | 2021 | ANTARES DC XG L | model_year | 2021 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50019 | SRE5003 | 2021 | ANTARES DC XG L | version_signature | ANTARES DC \| 2021 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50020 | SRE5004 | 2023 | ANTARES DC MD HG RIGHT | alias | 23 Antares DC MD Monster Drive 2023 => 23 Antares DC MD Monster Drive | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50020 | SRE5004 | 2023 | ANTARES DC MD HG RIGHT | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50020 | SRE5004 | 2023 | ANTARES DC MD HG RIGHT | body_material_tech | HAGANE 机身 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50020 | SRE5004 | 2023 | ANTARES DC MD HG RIGHT | gear_material | Brass | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50020 | SRE5004 | 2023 | ANTARES DC MD HG RIGHT | model_year | 2023 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50020 | SRE5004 | 2023 | ANTARES DC MD HG RIGHT | version_signature | ANTARES DC MD \| 2023 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50021 | SRE5004 | 2023 | ANTARES DC MD HG LEFT | alias | 23 Antares DC MD Monster Drive 2023 => 23 Antares DC MD Monster Drive | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50021 | SRE5004 | 2023 | ANTARES DC MD HG LEFT | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50021 | SRE5004 | 2023 | ANTARES DC MD HG LEFT | body_material_tech | HAGANE 机身 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50021 | SRE5004 | 2023 | ANTARES DC MD HG LEFT | gear_material | Brass | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50021 | SRE5004 | 2023 | ANTARES DC MD HG LEFT | model_year | 2023 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50021 | SRE5004 | 2023 | ANTARES DC MD HG LEFT | version_signature | ANTARES DC MD \| 2023 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50022 | SRE5004 | 2023 | ANTARES DC MD XG RIGHT | alias | 23 Antares DC MD Monster Drive 2023 => 23 Antares DC MD Monster Drive | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50022 | SRE5004 | 2023 | ANTARES DC MD XG RIGHT | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50022 | SRE5004 | 2023 | ANTARES DC MD XG RIGHT | body_material_tech | HAGANE 机身 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50022 | SRE5004 | 2023 | ANTARES DC MD XG RIGHT | gear_material | Brass | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50022 | SRE5004 | 2023 | ANTARES DC MD XG RIGHT | model_year | 2023 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50022 | SRE5004 | 2023 | ANTARES DC MD XG RIGHT | version_signature | ANTARES DC MD \| 2023 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50023 | SRE5004 | 2023 | ANTARES DC MD XG LEFT | alias | 23 Antares DC MD Monster Drive 2023 => 23 Antares DC MD Monster Drive | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50023 | SRE5004 | 2023 | ANTARES DC MD XG LEFT | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50023 | SRE5004 | 2023 | ANTARES DC MD XG LEFT | body_material_tech | HAGANE 机身 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50023 | SRE5004 | 2023 | ANTARES DC MD XG LEFT | gear_material | Brass | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50023 | SRE5004 | 2023 | ANTARES DC MD XG LEFT | model_year | 2023 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50023 | SRE5004 | 2023 | ANTARES DC MD XG LEFT | version_signature | ANTARES DC MD \| 2023 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50103 | SRE5015 | 2024 | Metanium DC 70 | alias | 24 Metanium DC (digital control) Japan model 2024 => 24 Metanium DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50103 | SRE5015 | 2024 | Metanium DC 70 | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50103 | SRE5015 | 2024 | Metanium DC 70 | body_material_tech | CORESOLID BODY / 一体成型 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50103 | SRE5015 | 2024 | Metanium DC 70 | gear_material | Duralumin drive gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50103 | SRE5015 | 2024 | Metanium DC 70 | model_year | 2024 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50103 | SRE5015 | 2024 | Metanium DC 70 | version_signature | Metanium DC \| 2024 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50104 | SRE5015 | 2024 | Metanium DC 71 | alias | 24 Metanium DC (digital control) Japan model 2024 => 24 Metanium DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50104 | SRE5015 | 2024 | Metanium DC 71 | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50104 | SRE5015 | 2024 | Metanium DC 71 | body_material_tech | CORESOLID BODY / 一体成型 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50104 | SRE5015 | 2024 | Metanium DC 71 | gear_material | Duralumin drive gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50104 | SRE5015 | 2024 | Metanium DC 71 | model_year | 2024 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50104 | SRE5015 | 2024 | Metanium DC 71 | version_signature | Metanium DC \| 2024 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50105 | SRE5015 | 2024 | Metanium DC 70HG | alias | 24 Metanium DC (digital control) Japan model 2024 => 24 Metanium DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50105 | SRE5015 | 2024 | Metanium DC 70HG | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50105 | SRE5015 | 2024 | Metanium DC 70HG | body_material_tech | CORESOLID BODY / 一体成型 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50105 | SRE5015 | 2024 | Metanium DC 70HG | gear_material | Duralumin drive gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50105 | SRE5015 | 2024 | Metanium DC 70HG | model_year | 2024 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50105 | SRE5015 | 2024 | Metanium DC 70HG | version_signature | Metanium DC \| 2024 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50106 | SRE5015 | 2024 | Metanium DC 71HG | alias | 24 Metanium DC (digital control) Japan model 2024 => 24 Metanium DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50106 | SRE5015 | 2024 | Metanium DC 71HG | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50106 | SRE5015 | 2024 | Metanium DC 71HG | body_material_tech | CORESOLID BODY / 一体成型 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50106 | SRE5015 | 2024 | Metanium DC 71HG | gear_material | Duralumin drive gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50106 | SRE5015 | 2024 | Metanium DC 71HG | model_year | 2024 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50106 | SRE5015 | 2024 | Metanium DC 71HG | version_signature | Metanium DC \| 2024 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50107 | SRE5015 | 2024 | Metanium DC 70XG | alias | 24 Metanium DC (digital control) Japan model 2024 => 24 Metanium DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50107 | SRE5015 | 2024 | Metanium DC 70XG | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50107 | SRE5015 | 2024 | Metanium DC 70XG | body_material_tech | CORESOLID BODY / 一体成型 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50107 | SRE5015 | 2024 | Metanium DC 70XG | gear_material | Duralumin drive gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50107 | SRE5015 | 2024 | Metanium DC 70XG | model_year | 2024 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50107 | SRE5015 | 2024 | Metanium DC 70XG | version_signature | Metanium DC \| 2024 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50108 | SRE5015 | 2024 | Metanium DC 71XG | alias | 24 Metanium DC (digital control) Japan model 2024 => 24 Metanium DC | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50108 | SRE5015 | 2024 | Metanium DC 71XG | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50108 | SRE5015 | 2024 | Metanium DC 71XG | body_material_tech | CORESOLID BODY / 一体成型 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50108 | SRE5015 | 2024 | Metanium DC 71XG | gear_material | Duralumin drive gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50108 | SRE5015 | 2024 | Metanium DC 71XG | model_year | 2024 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50108 | SRE5015 | 2024 | Metanium DC 71XG | version_signature | Metanium DC \| 2024 \| 6 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50131 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG RIGHT | alias | 23 Calcutta Conquest BFS Japan model 2023 => 23 Calcutta Conquest BFS | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50131 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG RIGHT | body_material | Aluminum | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50131 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG RIGHT | body_material_tech | 全加工 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50131 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG RIGHT | gear_material | - | manual_required | manual_required | resolved | accepted_manual_blank | keep_blank_manual_required | yes | No exact material phrase; blank is intentionally retained. |
| SRED50131 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG RIGHT | model_year | 2023 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50131 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG RIGHT | version_signature | CALCUTTA CONQUEST BFS \| 2023 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50132 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG LEFT | alias | 23 Calcutta Conquest BFS Japan model 2023 => 23 Calcutta Conquest BFS | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50132 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG LEFT | body_material | Aluminum | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50132 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG LEFT | body_material_tech | 全加工 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50132 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG LEFT | gear_material | - | manual_required | manual_required | resolved | accepted_manual_blank | keep_blank_manual_required | yes | No exact material phrase; blank is intentionally retained. |
| SRED50132 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG LEFT | model_year | 2023 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50132 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG LEFT | version_signature | CALCUTTA CONQUEST BFS \| 2023 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50133 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG RIGHT | alias | 23 Calcutta Conquest BFS Japan model 2023 => 23 Calcutta Conquest BFS | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50133 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG RIGHT | body_material | Aluminum | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50133 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG RIGHT | body_material_tech | 全加工 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50133 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG RIGHT | gear_material | - | manual_required | manual_required | resolved | accepted_manual_blank | keep_blank_manual_required | yes | No exact material phrase; blank is intentionally retained. |
| SRED50133 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG RIGHT | model_year | 2023 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50133 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG RIGHT | version_signature | CALCUTTA CONQUEST BFS \| 2023 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50134 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG LEFT | alias | 23 Calcutta Conquest BFS Japan model 2023 => 23 Calcutta Conquest BFS | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50134 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG LEFT | body_material | Aluminum | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50134 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG LEFT | body_material_tech | 全加工 | direct_write | direct_write | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50134 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG LEFT | gear_material | - | manual_required | manual_required | resolved | accepted_manual_blank | keep_blank_manual_required | yes | No exact material phrase; blank is intentionally retained. |
| SRED50134 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG LEFT | model_year | 2023 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50134 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS XG LEFT | version_signature | CALCUTTA CONQUEST BFS \| 2023 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50155 | SRE5025 | 2022 | ALDEBARAN BFS HG R | alias | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 => 22 Aldebaran BFS | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50155 | SRE5025 | 2022 | ALDEBARAN BFS HG R | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50155 | SRE5025 | 2022 | ALDEBARAN BFS HG R | body_material_tech | HAGANE 机身 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50155 | SRE5025 | 2022 | ALDEBARAN BFS HG R | gear_material | Aluminum main gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50155 | SRE5025 | 2022 | ALDEBARAN BFS HG R | model_year | 2022 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50155 | SRE5025 | 2022 | ALDEBARAN BFS HG R | version_signature | ALDEBARAN BFS \| 2022 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50156 | SRE5025 | 2022 | ALDEBARAN BFS HG L | alias | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 => 22 Aldebaran BFS | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50156 | SRE5025 | 2022 | ALDEBARAN BFS HG L | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50156 | SRE5025 | 2022 | ALDEBARAN BFS HG L | body_material_tech | HAGANE 机身 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50156 | SRE5025 | 2022 | ALDEBARAN BFS HG L | gear_material | Aluminum main gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50156 | SRE5025 | 2022 | ALDEBARAN BFS HG L | model_year | 2022 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50156 | SRE5025 | 2022 | ALDEBARAN BFS HG L | version_signature | ALDEBARAN BFS \| 2022 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50157 | SRE5025 | 2022 | ALDEBARAN BFS XG R | alias | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 => 22 Aldebaran BFS | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50157 | SRE5025 | 2022 | ALDEBARAN BFS XG R | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50157 | SRE5025 | 2022 | ALDEBARAN BFS XG R | body_material_tech | HAGANE 机身 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50157 | SRE5025 | 2022 | ALDEBARAN BFS XG R | gear_material | Aluminum main gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50157 | SRE5025 | 2022 | ALDEBARAN BFS XG R | model_year | 2022 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50157 | SRE5025 | 2022 | ALDEBARAN BFS XG R | version_signature | ALDEBARAN BFS \| 2022 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
| SRED50158 | SRE5025 | 2022 | ALDEBARAN BFS XG L | alias | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 => 22 Aldebaran BFS | identity:japantackle | dual_identity_alias | resolved | dual_source_kept | keep_canonical_and_normalized_alias | yes | - |
| SRED50158 | SRE5025 | 2022 | ALDEBARAN BFS XG L | body_material | Magnesium | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material | yes | - |
| SRED50158 | SRE5025 | 2022 | ALDEBARAN BFS XG L | body_material_tech | HAGANE 机身 | review_confirmed_manual | review_confirmed_manual | resolved | no_conflict_resolved | use_current_body_material_tech | yes | - |
| SRED50158 | SRE5025 | 2022 | ALDEBARAN BFS XG L | gear_material | Aluminum main gear | confirmed_direct_write | direct_write | resolved | no_conflict_resolved | use_player_direct_write | yes | - |
| SRED50158 | SRE5025 | 2022 | ALDEBARAN BFS XG L | model_year | 2022 | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_model_year | yes | - |
| SRED50158 | SRE5025 | 2022 | ALDEBARAN BFS XG L | version_signature | ALDEBARAN BFS \| 2022 \| 4 sku variants | identity:japantackle | identity_resolved | resolved | no_conflict_resolved | use_identity_resolved_version_signature | yes | - |
