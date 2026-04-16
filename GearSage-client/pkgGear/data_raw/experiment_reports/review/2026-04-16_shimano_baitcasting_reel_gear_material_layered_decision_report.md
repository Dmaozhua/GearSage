# Shimano baitcasting reel gear_material 分层判定报告

- generated_at: 2026-04-16T12:14:53.112Z
- input_identity_patch: `GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json`
- input_recheck_view: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_field_recheck_view.xlsx`

当前只处理 5 个 Shimano baitcasting reel 样本，不扩样本，不改现有 whitelist patch。

## 三档规则结果

- direct_write_count: 3
- cross_source_inferred_count: 1
- manual_required_count: 1

## 样本逐条结论

| detail_id | reel_id | model_year | SKU | canonical_alias | normalized_alias | candidate_value | source_type | source_site | decision_bucket | final_recommended_value | final_target_layer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRED50014 | SRE5003 | 2021 | ANTARES DC R | 21 Antares DC Japan model 2021 | 21 Antares DC | Brass | cross_source_inferred | TackleTour \| JapanTackle | cross_source_inferred | Brass | inferred |
| SRED50020 | SRE5004 | 2023 | ANTARES DC MD HG RIGHT | 23 Antares DC MD Monster Drive 2023 | 23 Antares DC MD Monster Drive | Brass | whitelist_direct | TackleTour | direct_write | Brass | player |
| SRED50103 | SRE5015 | 2024 | Metanium DC 70 | 24 Metanium DC (digital control) Japan model 2024 | 24 Metanium DC | Duralumin drive gear | whitelist_direct | JapanTackle | direct_write | Duralumin drive gear | player |
| SRED50131 | SRE5019 | 2023 | CALCUTTA CONQUEST BFS HG RIGHT | 23 Calcutta Conquest BFS Japan model 2023 | 23 Calcutta Conquest BFS | - | manual_required | JapanTackle \| TackleTour | manual_required | - | blank |
| SRED50155 | SRE5025 | 2022 | ALDEBARAN BFS HG R | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 | 22 Aldebaran BFS | Aluminum main gear | whitelist_direct | TackleTour | direct_write | Aluminum main gear | player |

## 21 Antares DC 为什么是 inferred，不是 official

- 来源一：[TackleTour 23 Antares DC MD review](https://www.tackletour.com/reviewshimano23antaresmddcxgpg2.html) 明确给出 `main gear is brass`。
- 来源二：[JapanTackle 21 Antares DC](https://www.japantackle.com/casting-reels/shimano/shimano-21antaresdc.html) 锚定了当前 `21 Antares DC` 样本本身，但没有直接给出 gear material。
- 这两个来源可以组成“强推断”，但还不是 `21 Antares DC` 本年款的直接官方或直接白名单明示，因此只能进 `cross_source_inferred`，不能进 `official`，也不该伪装成 direct_write。

## Bucket 结论

- direct_write: SRE5004、SRE5015、SRE5025
- cross_source_inferred: SRE5003
- manual_required: SRE5019
