# Shimano baitcasting reel identity 质量报告

- generated_at: 2026-04-16T11:08:47.541Z
- input_review: `GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_review.xlsx`
- input_patch: `GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json`

## 结论

- model_year 命中数：5
- alias 命中数：5
- version_signature 命中数：5
- identity_missing 数：0
- identity_conflict 数：0
- 可直接作为后续 whitelist 绑定底座的样本数：5
- 仍需人工确认的样本数：0

当前判断：**这轮 identity 层已经基本够做后续 whitelist 字段补值的绑定底座，但还不是完全放手状态。**

- `model_year` 与 `version_signature` 在 5 个样本上都已命中，且当前没有结构性冲突。
- `alias` 已拆成 `canonical_alias` 与 `normalized_alias`，并在 identity 层剔除了栏目/活动噪声。
- 当前 `normalized_alias` 已经足够支持 downstream 绑定，`canonical_alias` 继续保留给人工复核和展示策略参考。

## 样本判定

| reel_id | model | model_year | canonical_alias | normalized_alias | alias_noise_tags | version_signature | readiness | manual_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRE5003 | ANTARES DC | 2021 | 21 Antares DC Japan model 2021 | 21 Antares DC | brand_prefix, site_section | ANTARES DC \| 2021 \| 6 sku variants | identity_ready_for_whitelist_binding | - |
| SRE5004 | ANTARES DC MD | 2023 | 23 Antares DC MD Monster Drive 2023 | 23 Antares DC MD Monster Drive | brand_prefix, site_section | ANTARES DC MD \| 2023 \| 4 sku variants | identity_ready_for_whitelist_binding | - |
| SRE5015 | Metanium DC | 2024 | 24 Metanium DC (digital control) Japan model 2024 | 24 Metanium DC | brand_prefix | Metanium DC \| 2024 \| 6 sku variants | identity_ready_for_whitelist_binding | - |
| SRE5019 | CALCUTTA CONQUEST BFS | 2023 | 23 Calcutta Conquest BFS Japan model 2023 | 23 Calcutta Conquest BFS | brand_prefix, site_section | CALCUTTA CONQUEST BFS \| 2023 \| 4 sku variants | identity_ready_for_whitelist_binding | - |
| SRE5025 | ALDEBARAN BFS | 2022 | 22 Aldebaran BFS, ultimate finesse 2.0g, 2022 | 22 Aldebaran BFS | brand_prefix, campaign_label | ALDEBARAN BFS \| 2022 \| 4 sku variants | identity_ready_for_whitelist_binding | - |

## 已可作为后续字段补值底座的样本

- SRE5003 ANTARES DC (2021)
- SRE5004 ANTARES DC MD (2023)
- SRE5015 Metanium DC (2024)
- SRE5019 CALCUTTA CONQUEST BFS (2023)
- SRE5025 ALDEBARAN BFS (2022)

## 仍需要人工确认的样本


## 样本证据

### SRE5003 ANTARES DC

- source_site: japantackle
- source_url: https://www.japantackle.com/casting-reels/shimano/shimano-21antaresdc.html
- model_year evidence: URL token matched year: https://www.japantackle.com/casting-reels/shimano/shimano-21antaresdc.html
- alias evidence: Shimano 21 Antares DC Japan model 2021- - Shimano - Casting Reels
- canonical_alias: 21 Antares DC Japan model 2021
- normalized_alias: 21 Antares DC
- alias_noise_tags: brand_prefix, site_section
- version_signature evidence: ANTARES DC R / ANTARES DC L / ANTARES DC HG R

### SRE5004 ANTARES DC MD

- source_site: japantackle
- source_url: https://japantackle.com/casting-reels/shimano-23antares-dcmd.html
- model_year evidence: URL token matched year: https://japantackle.com/casting-reels/shimano-23antares-dcmd.html
- alias evidence: Shimano 23 Antares DC MD Monster Drive 2023- - Casting Reels
- canonical_alias: 23 Antares DC MD Monster Drive 2023
- normalized_alias: 23 Antares DC MD Monster Drive
- alias_noise_tags: brand_prefix, site_section
- version_signature evidence: ANTARES DC MD HG RIGHT / ANTARES DC MD HG LEFT / ANTARES DC MD XG RIGHT

### SRE5015 Metanium DC

- source_site: japantackle
- source_url: https://japantackle.com/metaniumdc2024.html
- model_year evidence: URL token matched year: https://japantackle.com/metaniumdc2024.html
- alias evidence: Shimano 24 Metanium DC (digital control) Japan model 2024-
- canonical_alias: 24 Metanium DC (digital control) Japan model 2024
- normalized_alias: 24 Metanium DC
- alias_noise_tags: brand_prefix
- version_signature evidence: Metanium DC 70 / Metanium DC 71 / Metanium DC 70HG

### SRE5019 CALCUTTA CONQUEST BFS

- source_site: japantackle
- source_url: https://japantackle.com/casting-reels/shimano/reg0000334.html
- model_year evidence: Shimano 23 Calcutta Conquest BFS Japan model 2023- - Shimano - Casting Reels
- alias evidence: Shimano 23 Calcutta Conquest BFS Japan model 2023- - Shimano - Casting Reels
- canonical_alias: 23 Calcutta Conquest BFS Japan model 2023
- normalized_alias: 23 Calcutta Conquest BFS
- alias_noise_tags: brand_prefix, site_section
- version_signature evidence: CALCUTTA CONQUEST BFS HG RIGHT / CALCUTTA CONQUEST BFS HG LEFT / CALCUTTA CONQUEST BFS XG RIGHT

### SRE5025 ALDEBARAN BFS

- source_site: japantackle
- source_url: https://japantackle.com/special/reg0000317.html
- model_year evidence: Shimano 22 Aldebaran BFS, ultimate finesse 2.0g, 2022- - 2026 Spring Trout Special
- alias evidence: Shimano 22 Aldebaran BFS, ultimate finesse 2.0g, 2022- - 2026 Spring Trout Special
- canonical_alias: 22 Aldebaran BFS, ultimate finesse 2.0g, 2022
- normalized_alias: 22 Aldebaran BFS
- alias_noise_tags: brand_prefix, campaign_label
- version_signature evidence: ALDEBARAN BFS HG R / ALDEBARAN BFS HG L / ALDEBARAN BFS XG R
