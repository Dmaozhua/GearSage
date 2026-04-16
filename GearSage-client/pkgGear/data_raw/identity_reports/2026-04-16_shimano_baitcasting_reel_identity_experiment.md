# Shimano baitcasting reel identity enrichment

- generated_at: 2026-04-16T11:08:37.857Z
- baseline_import: `GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx`
- identity_patch: `GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json`

## Summary

| field_key | reason_code | count |
| --- | --- | ---: |
| model_year | candidate_ready | 5 |
| alias | candidate_ready | 5 |
| version_signature | candidate_ready | 5 |

## Notes

- model_year is now treated as an identity enrichment target, not a manual blocker.
- Downstream whitelist field enrichment should read identity_patch first and use its model_year / alias / version_signature values.
- alias now distinguishes canonical_alias and normalized_alias; downstream binding should use normalized_alias.
- section or campaign labels such as Spring Trout Special are treated as alias noise and removed in identity enrichment.
- Current identity patch is generated from whitelist-source evidence and may still need source expansion for unresolved reels.

