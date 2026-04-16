# Shimano baitcasting reel whitelist 补充复核

- generated_at: 2026-04-16T11:49:07.025Z
- input_identity_patch: `GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json`
- input_recheck_view: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_field_recheck_view.xlsx`

当前只覆盖已经稳定的 5 个 Shimano baitcasting reel identity 样本，不扩样本，不推进 apply。

## 1. body_material_tech 补充复核

- 本轮重点核了 `SRE5004` 的描述层技术表达，确认 JapanTackle 页面里确实出现了：`Hagane body`、`4x8DC MD Tune brake system`、`X-SHIP gear system`、`MGL spool 3`、`Micro module gears`。
- 其中真正属于 `body_material_tech` 的只有 `Hagane body`，建议规范写成 `HAGANE 机身`。
- 其余表达分别属于刹车、齿轮、线杯等子系统，不应混写进 `body_material_tech`。

| reel_id | model_year | normalized_alias | current_body_material_tech | recommended_body_material_tech | extraction_decision |
| --- | --- | --- | --- | --- | --- |
| SRE5003 | 2021 | 21 Antares DC | HAGANE 机身 | HAGANE 机身 | keep_current_value |
| SRE5004 | 2023 | 23 Antares DC MD Monster Drive | Hagane body | HAGANE 机身 | supplement_body_material_tech_only_with_body_expression |
| SRE5015 | 2024 | 24 Metanium DC | CORESOLID BODY / 一体成型 | CORESOLID BODY / 一体成型 | keep_current_value |
| SRE5019 | 2023 | 23 Calcutta Conquest BFS | 全加工 | 全加工 | keep_current_value |
| SRE5025 | 2022 | 22 Aldebaran BFS | HAGANE 机身 | HAGANE 机身 | keep_current_value_with_year_bound_note |

## 2. gear_material 来源策略复查

- 当前 JapanTackle 直接命中的样本：`SRE5015`
- 当前 JapanTackle 未命中，但其他白名单辅助站可继续补查的样本：`SRE5004`、`SRE5025`
- 当前多辅助站仍没有稳定材料证据、应继续留空的样本：`SRE5003`、`SRE5019`

| reel_id | model_year | normalized_alias | JapanTackle | other whitelist | recommendation | candidate |
| --- | --- | --- | --- | --- | --- | --- |
| SRE5003 | 2021 | 21 Antares DC | no_exact_hit | no_year_aligned_stable_hit | leave_blank | - |
| SRE5004 | 2023 | 23 Antares DC MD Monster Drive | no_exact_hit | tackletour_exact_material_hit | other_whitelist_can_supplement | Brass main gear |
| SRE5015 | 2024 | 24 Metanium DC | exact_hit | not_needed_for_now | keep_current_value | Duralumin drive gear |
| SRE5019 | 2023 | 23 Calcutta Conquest BFS | no_exact_hit | tech_hit_but_not_material_hit | leave_blank | - |
| SRE5025 | 2022 | 22 Aldebaran BFS | no_exact_hit | tackletour_exact_material_hit | other_whitelist_can_supplement | Aluminum main gear |

## 结论

- `SRE5004` 的 `body_material_tech` 应补值，建议补成：`HAGANE 机身`。
- `gear_material` 的策略建议改成：`JapanTackle 未命中 -> 继续查其他已在白名单中的辅助站`，但前提必须是**年款对齐 + 精确材质表达**，不能把 `Micro module gear` 这类非材质词硬写进去。
