# Shimano baitcasting reel consumer-driven dry-run v1

- generated_at: 2026-04-16T12:56:29.913Z
- input_apply_input_json: `GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_v1.json`
- baseline_import: `GearSage-client/pkgGear/data_raw/shimano_baitcasting_reels_import_副本.xlsx`

## Summary

- total_rows: 144
- consumer_result_type:consumable: 120
- consumer_result_type:blocked_baseline_schema_gap: 24
- blocker:blocked_baseline_missing_column: 24

## Conclusion

- consumer_state_support_ready: yes
- remaining_schema_gap: version_signature baseline column is still missing

## Row sample

| detail_id | reel_id | field_key | apply_input_layer | consumer_result_type | consumer_result | target_baseline_column | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SRED50014 | SRE5003 | alias | master_dual_alias_value | consumable | consumable_master_dual_alias | alias | Write normalized_alias into baseline alias column; preserve canonical_alias in audit sidecar. |
| SRED50014 | SRE5003 | body_material | detail_direct_value | consumable | consumable_detail_value | body_material | Legacy-compatible detail value. Use review-confirmed value and preserve controlled replacement semantics. |
| SRED50014 | SRE5003 | body_material_tech | detail_confirmed_value | consumable | consumable_detail_value | body_material_tech | This field must now be consumed explicitly from builder output rather than piggybacking on old patch interpretation. |
| SRED50014 | SRE5003 | gear_material | detail_inferred_value | consumable | consumable_inferred_non_official | gear_material | Consumer can carry inferred value forward, but it must remain non-official in audit/output semantics. |
| SRED50014 | SRE5003 | model_year | master_identity_value | consumable | consumable_master_identity_value | model_year | Consume as master-scoped identity value; duplicate detail rows should collapse to one reel-level update candidate. |
| SRED50014 | SRE5003 | version_signature | master_identity_value | blocked_baseline_schema_gap | blocked_baseline_missing_column | (missing) | Current phase should not remap version_signature into another column. Safe handling is hold/skip, not temporary overloading. |
| SRED50015 | SRE5003 | alias | master_dual_alias_value | consumable | consumable_master_dual_alias | alias | Write normalized_alias into baseline alias column; preserve canonical_alias in audit sidecar. |
| SRED50015 | SRE5003 | body_material | detail_direct_value | consumable | consumable_detail_value | body_material | Legacy-compatible detail value. Use review-confirmed value and preserve controlled replacement semantics. |
| SRED50015 | SRE5003 | body_material_tech | detail_confirmed_value | consumable | consumable_detail_value | body_material_tech | This field must now be consumed explicitly from builder output rather than piggybacking on old patch interpretation. |
| SRED50015 | SRE5003 | gear_material | detail_inferred_value | consumable | consumable_inferred_non_official | gear_material | Consumer can carry inferred value forward, but it must remain non-official in audit/output semantics. |
| SRED50015 | SRE5003 | model_year | master_identity_value | consumable | consumable_master_identity_value | model_year | Consume as master-scoped identity value; duplicate detail rows should collapse to one reel-level update candidate. |
| SRED50015 | SRE5003 | version_signature | master_identity_value | blocked_baseline_schema_gap | blocked_baseline_missing_column | (missing) | Current phase should not remap version_signature into another column. Safe handling is hold/skip, not temporary overloading. |
| SRED50016 | SRE5003 | alias | master_dual_alias_value | consumable | consumable_master_dual_alias | alias | Write normalized_alias into baseline alias column; preserve canonical_alias in audit sidecar. |
| SRED50016 | SRE5003 | body_material | detail_direct_value | consumable | consumable_detail_value | body_material | Legacy-compatible detail value. Use review-confirmed value and preserve controlled replacement semantics. |
| SRED50016 | SRE5003 | body_material_tech | detail_confirmed_value | consumable | consumable_detail_value | body_material_tech | This field must now be consumed explicitly from builder output rather than piggybacking on old patch interpretation. |
| SRED50016 | SRE5003 | gear_material | detail_inferred_value | consumable | consumable_inferred_non_official | gear_material | Consumer can carry inferred value forward, but it must remain non-official in audit/output semantics. |
| SRED50016 | SRE5003 | model_year | master_identity_value | consumable | consumable_master_identity_value | model_year | Consume as master-scoped identity value; duplicate detail rows should collapse to one reel-level update candidate. |
| SRED50016 | SRE5003 | version_signature | master_identity_value | blocked_baseline_schema_gap | blocked_baseline_missing_column | (missing) | Current phase should not remap version_signature into another column. Safe handling is hold/skip, not temporary overloading. |
| SRED50017 | SRE5003 | alias | master_dual_alias_value | consumable | consumable_master_dual_alias | alias | Write normalized_alias into baseline alias column; preserve canonical_alias in audit sidecar. |
| SRED50017 | SRE5003 | body_material | detail_direct_value | consumable | consumable_detail_value | body_material | Legacy-compatible detail value. Use review-confirmed value and preserve controlled replacement semantics. |
| SRED50017 | SRE5003 | body_material_tech | detail_confirmed_value | consumable | consumable_detail_value | body_material_tech | This field must now be consumed explicitly from builder output rather than piggybacking on old patch interpretation. |
| SRED50017 | SRE5003 | gear_material | detail_inferred_value | consumable | consumable_inferred_non_official | gear_material | Consumer can carry inferred value forward, but it must remain non-official in audit/output semantics. |
| SRED50017 | SRE5003 | model_year | master_identity_value | consumable | consumable_master_identity_value | model_year | Consume as master-scoped identity value; duplicate detail rows should collapse to one reel-level update candidate. |
| SRED50017 | SRE5003 | version_signature | master_identity_value | blocked_baseline_schema_gap | blocked_baseline_missing_column | (missing) | Current phase should not remap version_signature into another column. Safe handling is hold/skip, not temporary overloading. |
| SRED50018 | SRE5003 | alias | master_dual_alias_value | consumable | consumable_master_dual_alias | alias | Write normalized_alias into baseline alias column; preserve canonical_alias in audit sidecar. |
| SRED50018 | SRE5003 | body_material | detail_direct_value | consumable | consumable_detail_value | body_material | Legacy-compatible detail value. Use review-confirmed value and preserve controlled replacement semantics. |
| SRED50018 | SRE5003 | body_material_tech | detail_confirmed_value | consumable | consumable_detail_value | body_material_tech | This field must now be consumed explicitly from builder output rather than piggybacking on old patch interpretation. |
| SRED50018 | SRE5003 | gear_material | detail_inferred_value | consumable | consumable_inferred_non_official | gear_material | Consumer can carry inferred value forward, but it must remain non-official in audit/output semantics. |
| SRED50018 | SRE5003 | model_year | master_identity_value | consumable | consumable_master_identity_value | model_year | Consume as master-scoped identity value; duplicate detail rows should collapse to one reel-level update candidate. |
| SRED50018 | SRE5003 | version_signature | master_identity_value | blocked_baseline_schema_gap | blocked_baseline_missing_column | (missing) | Current phase should not remap version_signature into another column. Safe handling is hold/skip, not temporary overloading. |
| SRED50019 | SRE5003 | alias | master_dual_alias_value | consumable | consumable_master_dual_alias | alias | Write normalized_alias into baseline alias column; preserve canonical_alias in audit sidecar. |
| SRED50019 | SRE5003 | body_material | detail_direct_value | consumable | consumable_detail_value | body_material | Legacy-compatible detail value. Use review-confirmed value and preserve controlled replacement semantics. |
| SRED50019 | SRE5003 | body_material_tech | detail_confirmed_value | consumable | consumable_detail_value | body_material_tech | This field must now be consumed explicitly from builder output rather than piggybacking on old patch interpretation. |
| SRED50019 | SRE5003 | gear_material | detail_inferred_value | consumable | consumable_inferred_non_official | gear_material | Consumer can carry inferred value forward, but it must remain non-official in audit/output semantics. |
| SRED50019 | SRE5003 | model_year | master_identity_value | consumable | consumable_master_identity_value | model_year | Consume as master-scoped identity value; duplicate detail rows should collapse to one reel-level update candidate. |
| SRED50019 | SRE5003 | version_signature | master_identity_value | blocked_baseline_schema_gap | blocked_baseline_missing_column | (missing) | Current phase should not remap version_signature into another column. Safe handling is hold/skip, not temporary overloading. |
| SRED50020 | SRE5004 | alias | master_dual_alias_value | consumable | consumable_master_dual_alias | alias | Write normalized_alias into baseline alias column; preserve canonical_alias in audit sidecar. |
| SRED50020 | SRE5004 | body_material | detail_confirmed_value | consumable | consumable_detail_value | body_material | Some body_material rows are already normalized into detail_confirmed_value. Consumer should handle them the same way as other review-confirmed detail values. |
| SRED50020 | SRE5004 | body_material_tech | detail_confirmed_value | consumable | consumable_detail_value | body_material_tech | This field must now be consumed explicitly from builder output rather than piggybacking on old patch interpretation. |
| SRED50020 | SRE5004 | gear_material | detail_confirmed_value | consumable | consumable_detail_value | gear_material | Direct-write gear_material is now handled explicitly as a confirmed detail state. |

- consumable_rows: 120
- blocked_consumer_support_rows: 0
- blocked_baseline_schema_rows: 24

