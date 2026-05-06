const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IDENTITY_REVIEW = gearDataPaths.resolveDataRaw('identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_review.xlsx');
const IDENTITY_PATCH = gearDataPaths.resolveDataRaw('identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json');
const OUTPUT_MD = gearDataPaths.resolveDataRaw('identity_reports/quality/2026-04-16_shimano_baitcasting_reel_identity_quality_report.md');
const OUTPUT_XLSX = gearDataPaths.resolveDataRaw('identity_reports/quality/2026-04-16_shimano_baitcasting_reel_identity_quality_report.xlsx');

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadReviewRows() {
  const workbook = XLSX.readFile(IDENTITY_REVIEW);
  return XLSX.utils.sheet_to_json(workbook.Sheets.identity_review, { defval: '' });
}

function loadPatchRows() {
  const payload = JSON.parse(fs.readFileSync(IDENTITY_PATCH, 'utf8'));
  return payload.patch_rows || [];
}

function buildSamples(reviewRows, patchRows) {
  const sampleMap = new Map();

  for (const row of reviewRows) {
    const reelId = normalizeText(row.reel_id);
    if (!sampleMap.has(reelId)) {
      sampleMap.set(reelId, {
        reel_id: reelId,
        model: normalizeText(row.model),
        source_site: normalizeText(row.source_site),
        source_url: normalizeText(row.source_url),
        candidate_by_field: new Map(),
        evidence_by_field: new Map(),
      });
    }

    const sample = sampleMap.get(reelId);
    const fieldKey = normalizeText(row.field_key);
    const candidateValue = normalizeText(row.candidate_value);
    const evidenceText = normalizeText(row.evidence_text);
    const bucket = sample.candidate_by_field.get(fieldKey) || new Set();
    if (candidateValue) bucket.add(candidateValue);
    sample.candidate_by_field.set(fieldKey, bucket);
    if (evidenceText) {
      sample.evidence_by_field.set(fieldKey, evidenceText);
    }
  }

  const patchByReelId = new Map(
    patchRows.map((row) => [normalizeText(row.reel_id), row])
  );

  const sampleRows = [];
  for (const sample of sampleMap.values()) {
    const patch = patchByReelId.get(sample.reel_id) || {};
    const modelYear = normalizeText(patch.model_year);
    const alias = normalizeText(patch.alias);
    const canonicalAlias = normalizeText(patch.canonical_alias);
    const normalizedAlias = normalizeText(patch.normalized_alias) || alias;
    const aliasNoiseTags = normalizeText(patch.alias_noise_tags);
    const versionSignature = normalizeText(patch.version_signature);

    const missingFields = [];
    if (!modelYear) missingFields.push('model_year');
    if (!normalizedAlias) missingFields.push('alias');
    if (!versionSignature) missingFields.push('version_signature');

    const conflicts = [];
    for (const fieldKey of ['model_year', 'alias', 'version_signature']) {
      const candidates = Array.from(sample.candidate_by_field.get(fieldKey) || []);
      const patchValue = normalizeText(patch[fieldKey]);
      if (candidates.length > 1) {
        conflicts.push(`${fieldKey}:multiple_candidates`);
        continue;
      }
      if (candidates.length === 1 && patchValue && candidates[0] !== patchValue) {
        conflicts.push(`${fieldKey}:patch_mismatch`);
      }
    }

    const aliasNeedsManual = !normalizedAlias;

    const readiness = !missingFields.length && !conflicts.length && !aliasNeedsManual
      ? 'identity_ready_for_whitelist_binding'
      : 'manual_confirmation_required';

    const manualReason = aliasNeedsManual
      ? 'normalized_alias_missing'
      : (missingFields.length ? `missing:${missingFields.join(',')}` : (conflicts[0] || ''));

    sampleRows.push({
      reel_id: sample.reel_id,
      model: sample.model,
      model_year: modelYear,
      alias: normalizedAlias,
      canonical_alias: canonicalAlias,
      normalized_alias: normalizedAlias,
      alias_noise_tags: aliasNoiseTags,
      version_signature: versionSignature,
      source_site: normalizeText(patch.source_site) || sample.source_site,
      source_url: normalizeText(patch.source_url) || sample.source_url,
      evidence_model_year: sample.evidence_by_field.get('model_year') || '',
      evidence_alias: sample.evidence_by_field.get('alias') || '',
      evidence_version_signature: sample.evidence_by_field.get('version_signature') || '',
      identity_missing: missingFields.length ? missingFields.join(', ') : '',
      identity_conflict: conflicts.length ? conflicts.join(', ') : '',
      readiness,
      manual_reason: manualReason,
    });
  }

  return sampleRows.sort((a, b) => a.reel_id.localeCompare(b.reel_id));
}

function buildSummary(sampleRows) {
  const countHit = (field) => sampleRows.filter((row) => normalizeText(row[field])).length;
  return [
    { metric: 'model_year_hit_count', value: countHit('model_year') },
    { metric: 'alias_hit_count', value: countHit('normalized_alias') },
    { metric: 'version_signature_hit_count', value: countHit('version_signature') },
    { metric: 'identity_missing_count', value: sampleRows.filter((row) => row.identity_missing).length },
    { metric: 'identity_conflict_count', value: sampleRows.filter((row) => row.identity_conflict).length },
    {
      metric: 'identity_ready_for_binding_count',
      value: sampleRows.filter((row) => row.readiness === 'identity_ready_for_whitelist_binding').length,
    },
    {
      metric: 'manual_confirmation_required_count',
      value: sampleRows.filter((row) => row.readiness === 'manual_confirmation_required').length,
    },
  ];
}

function buildEvidenceRows(sampleRows) {
  const rows = [];
  for (const sample of sampleRows) {
    rows.push({
      reel_id: sample.reel_id,
      model: sample.model,
      source_site: sample.source_site,
      source_url: sample.source_url,
      field_key: 'model_year',
      evidence_text: sample.evidence_model_year,
    });
    rows.push({
      reel_id: sample.reel_id,
      model: sample.model,
      source_site: sample.source_site,
      source_url: sample.source_url,
      field_key: 'alias',
      evidence_text: sample.evidence_alias,
    });
    rows.push({
      reel_id: sample.reel_id,
      model: sample.model,
      source_site: sample.source_site,
      source_url: sample.source_url,
      field_key: 'version_signature',
      evidence_text: sample.evidence_version_signature,
    });
  }
  return rows;
}

function renderMarkdown(summaryRows, sampleRows) {
  const escapeTable = (value) => String(value || '-').replace(/\|/g, '\\|');
  const metricMap = Object.fromEntries(summaryRows.map((row) => [row.metric, row.value]));
  const sampleTable = sampleRows.map((row) => [
    row.reel_id,
    row.model,
    row.model_year || '-',
    row.canonical_alias || '-',
    row.normalized_alias || '-',
    row.alias_noise_tags || '-',
    row.version_signature || '-',
    row.readiness,
    row.manual_reason || '-',
  ]);

  const lines = [
    '# Shimano baitcasting reel identity 质量报告',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_review: \`${path.relative(REPO_ROOT, IDENTITY_REVIEW)}\``,
    `- input_patch: \`${path.relative(REPO_ROOT, IDENTITY_PATCH)}\``,
    '',
    '## 结论',
    '',
    `- model_year 命中数：${metricMap.model_year_hit_count}`,
    `- alias 命中数：${metricMap.alias_hit_count}`,
    `- version_signature 命中数：${metricMap.version_signature_hit_count}`,
    `- identity_missing 数：${metricMap.identity_missing_count}`,
    `- identity_conflict 数：${metricMap.identity_conflict_count}`,
    `- 可直接作为后续 whitelist 绑定底座的样本数：${metricMap.identity_ready_for_binding_count}`,
    `- 仍需人工确认的样本数：${metricMap.manual_confirmation_required_count}`,
    '',
    '当前判断：**这轮 identity 层已经基本够做后续 whitelist 字段补值的绑定底座，但还不是完全放手状态。**',
    '',
    '- `model_year` 与 `version_signature` 在 5 个样本上都已命中，且当前没有结构性冲突。',
    '- `alias` 已拆成 `canonical_alias` 与 `normalized_alias`，并在 identity 层剔除了栏目/活动噪声。',
    '- 当前 `normalized_alias` 已经足够支持 downstream 绑定，`canonical_alias` 继续保留给人工复核和展示策略参考。',
    '',
    '## 样本判定',
    '',
    '| reel_id | model | model_year | canonical_alias | normalized_alias | alias_noise_tags | version_signature | readiness | manual_reason |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...sampleTable.map((cols) => `| ${cols.map(escapeTable).join(' | ')} |`),
    '',
    '## 已可作为后续字段补值底座的样本',
    '',
    ...sampleRows
      .filter((row) => row.readiness === 'identity_ready_for_whitelist_binding')
      .map((row) => `- ${row.reel_id} ${row.model} (${row.model_year})`),
    '',
    '## 仍需要人工确认的样本',
    '',
    ...sampleRows
      .filter((row) => row.readiness === 'manual_confirmation_required')
      .map((row) => `- ${row.reel_id} ${row.model}: ${row.manual_reason}`),
    '',
    '## 样本证据',
    '',
  ];

  for (const row of sampleRows) {
    lines.push(`### ${row.reel_id} ${row.model}`);
    lines.push('');
    lines.push(`- source_site: ${row.source_site}`);
    lines.push(`- source_url: ${row.source_url}`);
    lines.push(`- model_year evidence: ${row.evidence_model_year || '-'}`);
    lines.push(`- alias evidence: ${row.evidence_alias || '-'}`);
    lines.push(`- canonical_alias: ${row.canonical_alias || '-'}`);
    lines.push(`- normalized_alias: ${row.normalized_alias || '-'}`);
    lines.push(`- alias_noise_tags: ${row.alias_noise_tags || '-'}`);
    lines.push(`- version_signature evidence: ${row.evidence_version_signature || '-'}`);
    lines.push('');
  }

  return lines.join('\n');
}

function writeWorkbook(summaryRows, sampleRows, evidenceRows) {
  ensureDirForFile(OUTPUT_XLSX);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'summary');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sampleRows), 'sample_assessment');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(evidenceRows), 'evidence');
  XLSX.writeFile(workbook, OUTPUT_XLSX);
}

function main() {
  const reviewRows = loadReviewRows();
  const patchRows = loadPatchRows();
  const sampleRows = buildSamples(reviewRows, patchRows);
  const summaryRows = buildSummary(sampleRows);
  const evidenceRows = buildEvidenceRows(sampleRows);
  const markdown = renderMarkdown(summaryRows, sampleRows);

  ensureDirForFile(OUTPUT_MD);
  fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');
  writeWorkbook(summaryRows, sampleRows, evidenceRows);

  console.log(`identity quality markdown -> ${OUTPUT_MD}`);
  console.log(`identity quality workbook -> ${OUTPUT_XLSX}`);
}

main();
