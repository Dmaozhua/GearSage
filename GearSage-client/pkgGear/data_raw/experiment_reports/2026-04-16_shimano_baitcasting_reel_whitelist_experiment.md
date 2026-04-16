# shimano_baitcasting_reel_whitelist Review Summary

- generated_at: 2026-04-16T10:50:07.106Z
- import_baseline: `GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx`
- json_report: `GearSage-client/pkgGear/data_raw/experiment_reports/2026-04-16_shimano_baitcasting_reel_whitelist_experiment.json`
- review_workbook: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_review.xlsx`

## Candidate Rows

- body_material: 0
- gear_material: 0

## Reason Code Stats

| field_key | reason_code | count |
| --- | --- | ---: |
| body_material | existing_value_present | 24 |
| body_material | model_not_in_experiment_scope | 364 |
| gear_material | candidate_not_found_in_source | 18 |
| gear_material | existing_value_present | 6 |
| gear_material | model_not_in_experiment_scope | 364 |

## Manual Review

1. Open the review workbook and work in the `review_candidates` sheet.
2. Check `candidate_value`, `source_url`, and `evidence_text` against the source page.
3. Fill `review_status` with the final decision, then fill `approved_value` / `reviewer` / `review_note` if needed.
4. Only after review is complete should enrichment be enabled in the export step.

