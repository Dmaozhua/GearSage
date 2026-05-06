const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IDENTITY_PATCH = gearDataPaths.resolveDataRaw('identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json');
const IDENTITY_QUALITY_XLSX = gearDataPaths.resolveDataRaw('identity_reports/quality/2026-04-16_shimano_baitcasting_reel_identity_quality_report.xlsx');
const IDENTITY_REVIEW_XLSX = gearDataPaths.resolveDataRaw('identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_review.xlsx');
const WHITELIST_PATCH = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_patch.json');
const WHITELIST_REVIEW_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_review_filled.xlsx');
const GEAR_MATERIAL_LAYERED_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_gear_material_layered_decision_report.xlsx');
const OUTPUT_MD = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_field_recheck_view.md');
const OUTPUT_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_field_recheck_view.xlsx');
const REVIEW_SUPPORT_OVERRIDES = {
  SRE5004: {
    body_material_tech: 'HAGANE 机身',
    body_material_tech_evidence: 'JapanTackle 2023 ANTARES DC MD page explicitly mentions Hagane body.',
  },
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJsonRows(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return payload.patch_rows || payload.rows || [];
}

function loadSheetRows(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
}

function techLeaksIntoBodyMaterial(value) {
  return /hagane|coresolid|body|machined|机身|一体成型|全加工/i.test(normalizeText(value));
}

function buildConsistencyNote(row) {
  const notes = [];

  if (!row.identity_ready) {
    notes.push('identity_not_ready');
  }
  if (techLeaksIntoBodyMaterial(row.body_material)) {
    notes.push('body_material_contains_tech_phrase');
  }
  if (normalizeText(row.body_material) && normalizeText(row.body_material_tech) && normalizeText(row.body_material) === normalizeText(row.body_material_tech)) {
    notes.push('body_material_and_tech_not_split');
  }
  if (/manual/.test(normalizeText(row.source_type))) {
    notes.push('manual_override_present_keep_year_bound');
  }
  if (/same-series body material may differ across other years/i.test(row.year_scope_note)) {
    notes.push('cross_year_do_not_generalize');
  }
  if (row.gear_material_decision_bucket === 'cross_source_inferred') {
    notes.push('gear_material_inferred_keep_official_empty');
  }
  if (row.gear_material_decision_bucket === 'manual_required') {
    notes.push('gear_material_manual_required');
  }
  if (!normalizeText(row.gear_material) && row.reel_id === 'SRE5015') {
    notes.push('gear_material_expected_but_missing');
  }
  if (!notes.length) {
    notes.push('identity_bound_and_field_value_consistent');
  }

  return notes.join('; ');
}

function buildRows() {
  const identityPatchRows = loadJsonRows(IDENTITY_PATCH);
  const whitelistPatchRows = loadJsonRows(WHITELIST_PATCH);
  const identityQualityRows = loadSheetRows(IDENTITY_QUALITY_XLSX, 'sample_assessment');
  loadSheetRows(IDENTITY_REVIEW_XLSX, 'identity_review');
  loadSheetRows(WHITELIST_REVIEW_XLSX, 'review_candidates');
  const gearMaterialDecisionRows = loadSheetRows(GEAR_MATERIAL_LAYERED_XLSX, 'gear_material_decision');

  const identityByReel = new Map(
    identityPatchRows.map((row) => [normalizeText(row.reel_id), row])
  );
  const identityQualityByReel = new Map(
    identityQualityRows.map((row) => [normalizeText(row.reel_id), row])
  );
  const gearMaterialDecisionByReel = new Map(
    gearMaterialDecisionRows.map((row) => [normalizeText(row.reel_id), row])
  );

  const detailMap = new Map();
  for (const patchRow of whitelistPatchRows) {
    const detailId = normalizeText(patchRow.detail_id);
    if (!detailMap.has(detailId)) {
      const identity = identityByReel.get(normalizeText(patchRow.reel_id)) || {};
      const quality = identityQualityByReel.get(normalizeText(patchRow.reel_id)) || {};
      detailMap.set(detailId, {
        detail_id: detailId,
        reel_id: normalizeText(patchRow.reel_id),
        model: normalizeText(patchRow.model),
        model_year: normalizeText(identity.model_year) || normalizeText(patchRow.model_year),
        SKU: normalizeText(patchRow.sku),
        canonical_alias: normalizeText(identity.canonical_alias),
        normalized_alias: normalizeText(identity.normalized_alias) || normalizeText(identity.alias),
        body_material: '',
        body_material_tech: '',
        gear_material: '',
        gear_material_decision_bucket: '',
        gear_material_target_layer: '',
        gear_material_review_status: '',
        gear_material_review_note: '',
        source_type: [],
        source_site: [],
        source_url: [],
        evidence_text: [],
        year_scope_note: normalizeText(patchRow.year_scope_note),
        identity_ready: normalizeText(quality.readiness) === 'identity_ready_for_whitelist_binding',
      });
    }

    const target = detailMap.get(detailId);
    const gearDecision = gearMaterialDecisionByReel.get(normalizeText(target.reel_id)) || {};
    if (patchRow.field_key === 'body_material') {
      target.body_material = normalizeText(patchRow.approved_value);
      target.body_material_tech = normalizeText(patchRow.body_material_tech);
    }
    if (patchRow.field_key === 'gear_material') {
      target.gear_material = normalizeText(patchRow.approved_value);
    }
    if (normalizeText(gearDecision.decision_bucket)) {
      target.gear_material_decision_bucket = normalizeText(gearDecision.decision_bucket);
      target.gear_material_target_layer = normalizeText(gearDecision.final_target_layer);
      target.gear_material_review_note = normalizeText(gearDecision.review_note);
      if (target.gear_material_decision_bucket === 'direct_write') {
        target.gear_material_review_status = 'confirmed_direct_write';
      } else if (target.gear_material_decision_bucket === 'cross_source_inferred') {
        target.gear_material_review_status = 'confirmed_inferred';
      } else if (target.gear_material_decision_bucket === 'manual_required') {
        target.gear_material_review_status = 'manual_required';
      }
      if (!normalizeText(target.gear_material) && normalizeText(gearDecision.final_recommended_value)) {
        target.gear_material = normalizeText(gearDecision.final_recommended_value);
      }
      const gearSourceTypeEntry = `gear_material:${normalizeText(gearDecision.source_type)}`;
      const gearSourceSiteEntry = `gear_material:${normalizeText(gearDecision.source_site)}`;
      const gearSourceUrlEntry = `gear_material:${normalizeText(gearDecision.source_url)}`;
      const gearEvidenceEntry = `gear_material:${normalizeText(gearDecision.evidence_text)}`;
      if (gearSourceTypeEntry && !target.source_type.includes(gearSourceTypeEntry)) target.source_type.push(gearSourceTypeEntry);
      if (gearSourceSiteEntry && !target.source_site.includes(gearSourceSiteEntry)) target.source_site.push(gearSourceSiteEntry);
      if (gearSourceUrlEntry && !target.source_url.includes(gearSourceUrlEntry)) target.source_url.push(gearSourceUrlEntry);
      if (gearEvidenceEntry && !target.evidence_text.includes(gearEvidenceEntry)) target.evidence_text.push(gearEvidenceEntry);
    }

    const sourceTypeEntry = `${normalizeText(patchRow.field_key)}:${normalizeText(patchRow.source_type)}`;
    const sourceSiteEntry = `${normalizeText(patchRow.field_key)}:${normalizeText(patchRow.source_site)}`;
    const sourceUrlEntry = `${normalizeText(patchRow.field_key)}:${normalizeText(patchRow.source_url)}`;
    const evidenceEntry = `${normalizeText(patchRow.field_key)}:${normalizeText(patchRow.evidence_text)}`;
    if (sourceTypeEntry && !target.source_type.includes(sourceTypeEntry)) target.source_type.push(sourceTypeEntry);
    if (sourceSiteEntry && !target.source_site.includes(sourceSiteEntry)) target.source_site.push(sourceSiteEntry);
    if (sourceUrlEntry && !target.source_url.includes(sourceUrlEntry)) target.source_url.push(sourceUrlEntry);
    if (evidenceEntry && !target.evidence_text.includes(evidenceEntry)) target.evidence_text.push(evidenceEntry);
  }

  for (const row of detailMap.values()) {
    const override = REVIEW_SUPPORT_OVERRIDES[row.reel_id];
    if (!override) continue;

    if (normalizeText(override.body_material_tech)) {
      row.body_material_tech = normalizeText(override.body_material_tech);
      const overrideSourceType = 'body_material_tech:review_support_confirmed';
      const overrideSourceSite = 'body_material_tech:JapanTackle';
      const overrideSourceUrl = 'body_material_tech:https://japantackle.com/casting-reels/shimano-23antares-dcmd.html';
      const overrideEvidence = `body_material_tech:${normalizeText(override.body_material_tech_evidence)}`;
      if (!row.source_type.includes(overrideSourceType)) row.source_type.push(overrideSourceType);
      if (!row.source_site.includes(overrideSourceSite)) row.source_site.push(overrideSourceSite);
      if (!row.source_url.includes(overrideSourceUrl)) row.source_url.push(overrideSourceUrl);
      if (!row.evidence_text.includes(overrideEvidence)) row.evidence_text.push(overrideEvidence);
    }
  }

  const rows = Array.from(detailMap.values())
    .map((row) => ({
      ...row,
      source_type: row.source_type.join(' | '),
      source_site: row.source_site.join(' | '),
      source_url: row.source_url.join(' | '),
      evidence_text: row.evidence_text.join(' | '),
      field_consistency_note: buildConsistencyNote(row),
    }))
    .sort((a, b) => {
      const yearDiff = normalizeText(a.model_year).localeCompare(normalizeText(b.model_year));
      if (yearDiff !== 0) return yearDiff;
      const reelDiff = a.reel_id.localeCompare(b.reel_id);
      if (reelDiff !== 0) return reelDiff;
      return a.detail_id.localeCompare(b.detail_id);
    });

  return rows;
}

function buildSummary(rows) {
  return [
    { metric: 'detail_rows_in_view', value: rows.length },
    { metric: 'body_material_filled', value: rows.filter((row) => normalizeText(row.body_material)).length },
    { metric: 'body_material_tech_filled', value: rows.filter((row) => normalizeText(row.body_material_tech)).length },
    { metric: 'gear_material_filled', value: rows.filter((row) => normalizeText(row.gear_material)).length },
    {
      metric: 'gear_material_confirmed_direct_write',
      value: rows.filter((row) => row.gear_material_review_status === 'confirmed_direct_write').length,
    },
    {
      metric: 'gear_material_confirmed_inferred',
      value: rows.filter((row) => row.gear_material_review_status === 'confirmed_inferred').length,
    },
    {
      metric: 'gear_material_manual_required',
      value: rows.filter((row) => row.gear_material_review_status === 'manual_required').length,
    },
    {
      metric: 'rows_marked_consistent',
      value: rows.filter((row) => row.field_consistency_note === 'identity_bound_and_field_value_consistent').length,
    },
    {
      metric: 'rows_needing_manual_judgment',
      value: rows.filter((row) => row.field_consistency_note !== 'identity_bound_and_field_value_consistent').length,
    },
  ];
}

function renderMarkdown(rows, summaryRows) {
  const escapeCell = (value) => String(value || '-').replace(/\|/g, '\\|');
  const stableFields = [];
  const manualFields = [];

  const bodyRows = rows.filter((row) => normalizeText(row.body_material));
  const gearRows = rows.filter((row) => normalizeText(row.gear_material));

  if (bodyRows.every((row) => !techLeaksIntoBodyMaterial(row.body_material))) {
    stableFields.push('body_material');
  } else {
    manualFields.push('body_material');
  }

  if (bodyRows.every((row) => normalizeText(row.body_material_tech))) {
    stableFields.push('body_material_tech');
  } else {
    manualFields.push('body_material_tech');
  }

  const gearBuckets = rows.map((row) => normalizeText(row.gear_material_review_status));
  if (gearBuckets.every((bucket) => bucket && bucket !== 'manual_required')) {
    stableFields.push('gear_material');
  } else {
    manualFields.push('gear_material');
  }

  const lines = [
    '# Shimano baitcasting reel whitelist 字段复核视图',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_identity_patch: \`${path.relative(REPO_ROOT, IDENTITY_PATCH)}\``,
    `- input_identity_quality: \`${path.relative(REPO_ROOT, IDENTITY_QUALITY_XLSX)}\``,
    `- input_whitelist_patch: \`${path.relative(REPO_ROOT, WHITELIST_PATCH)}\``,
    `- input_gear_material_layered_report: \`${path.relative(REPO_ROOT, GEAR_MATERIAL_LAYERED_XLSX)}\``,
    '',
    '当前只覆盖已稳定的 5 个 Shimano baitcasting reel identity 样本，不扩样本，不推进 apply。',
    '',
    '## 汇总',
    '',
    ...summaryRows.map((row) => `- ${row.metric}: ${row.value}`),
    '',
    '## 当前字段判断',
    '',
    `- 当前口径已较稳定：${stableFields.join('、') || '无'}`,
    `- 仍需要人工再判断：${manualFields.join('、') || '无'}`,
    '',
    '## gear_material 人工确认结果',
    '',
    `- 已确认 direct_write：${rows.filter((row) => row.gear_material_review_status === 'confirmed_direct_write').map((row) => row.reel_id).filter((value, index, array) => array.indexOf(value) === index).join('、') || '无'}`,
    `- 已确认 inferred：${rows.filter((row) => row.gear_material_review_status === 'confirmed_inferred').map((row) => row.reel_id).filter((value, index, array) => array.indexOf(value) === index).join('、') || '无'}`,
    `- 继续 manual_required：${rows.filter((row) => row.gear_material_review_status === 'manual_required').map((row) => row.reel_id).filter((value, index, array) => array.indexOf(value) === index).join('、') || '无'}`,
    '',
    '## 明细',
    '',
    '| detail_id | reel_id | model_year | SKU | canonical_alias | normalized_alias | body_material | body_material_tech | gear_material | gear_material_review_status | gear_material_decision_bucket | gear_material_target_layer | source_type | source_site | source_url | field_consistency_note |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${[
      row.detail_id,
      row.reel_id,
      row.model_year,
      row.SKU,
      row.canonical_alias,
      row.normalized_alias,
      row.body_material,
      row.body_material_tech,
      row.gear_material,
      row.gear_material_review_status,
      row.gear_material_decision_bucket,
      row.gear_material_target_layer,
      row.source_type,
      row.source_site,
      row.source_url,
      row.field_consistency_note,
    ].map(escapeCell).join(' | ')} |`),
    '',
    '## 何时适合进入 apply 前的下一轮 dry-run',
    '',
    '- 当前 5 个样本的 identity 底座已稳定。',
    '- 仍应先人工看完这份复核视图，确认 `field_consistency_note` 不再提示跨年款误泛化或来源层级问题。',
    '- 当这 5 个样本里需要人工判断的行都被确认可接受后，才适合回到 apply 前的下一轮 dry-run。',
    '',
  ];

  return lines.join('\n');
}

function writeWorkbook(rows, summaryRows) {
  ensureDirForFile(OUTPUT_XLSX);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'summary');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'recheck_view');
  XLSX.writeFile(workbook, OUTPUT_XLSX);
}

function main() {
  const rows = buildRows();
  const summaryRows = buildSummary(rows);
  const markdown = renderMarkdown(rows, summaryRows);

  ensureDirForFile(OUTPUT_MD);
  fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');
  writeWorkbook(rows, summaryRows);

  console.log(`whitelist field recheck markdown -> ${OUTPUT_MD}`);
  console.log(`whitelist field recheck workbook -> ${OUTPUT_XLSX}`);
}

main();
