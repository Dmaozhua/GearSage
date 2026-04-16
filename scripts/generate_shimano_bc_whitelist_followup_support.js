const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const IDENTITY_PATCH = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/identity_reports/review/2026-04-16_shimano_baitcasting_reel_identity_patch.json'
);
const RECHECK_VIEW = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_field_recheck_view.xlsx'
);
const OUTPUT_MD = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_followup_support.md'
);
const OUTPUT_XLSX = path.resolve(
  REPO_ROOT,
  'GearSage-client/pkgGear/data_raw/experiment_reports/review/2026-04-16_shimano_baitcasting_reel_whitelist_followup_support.xlsx'
);

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadIdentityPatch() {
  const payload = JSON.parse(fs.readFileSync(IDENTITY_PATCH, 'utf8'));
  return payload.patch_rows || [];
}

function loadRecheckRows() {
  const workbook = XLSX.readFile(RECHECK_VIEW);
  return XLSX.utils.sheet_to_json(workbook.Sheets.recheck_view, { defval: '' });
}

function buildBodyMaterialTechRows(recheckRows, identityRows) {
  const identityByReel = new Map(identityRows.map((row) => [normalizeText(row.reel_id), row]));
  const grouped = new Map();

  for (const row of recheckRows) {
    const reelId = normalizeText(row.reel_id);
    if (!grouped.has(reelId)) {
      grouped.set(reelId, {
        reel_id: reelId,
        model_year: normalizeText(row.model_year),
        canonical_alias: normalizeText(row.canonical_alias),
        normalized_alias: normalizeText(row.normalized_alias),
        detail_ids: [],
        current_body_material: normalizeText(row.body_material),
        current_body_material_tech: normalizeText(row.body_material_tech),
      });
    }
    grouped.get(reelId).detail_ids.push(normalizeText(row.detail_id));
  }

  const findings = {
    SRE5003: {
      tech_evidence: 'JapanTackle evidence already points to Hagane aluminum alloy body.',
      recommended_body_material_tech: 'HAGANE 机身',
      extraction_decision: 'keep_current_value',
      followup_note: 'Current body_material_tech is already synchronized with the body material statement.',
    },
    SRE5004: {
      tech_evidence: 'JapanTackle description-level review found: Hagane body; New 4x8DC MD Tune brake system; Extra efficient X-SHIP gear system; MGL spool 3; Micro module gears.',
      recommended_body_material_tech: 'HAGANE 机身',
      extraction_decision: 'supplement_body_material_tech_only_with_body_expression',
      followup_note: '4x8DC MD Tune, X-SHIP, MGL spool 3, and Micro module gears are valid tech phrases but belong to brake, spool, and gear subsystems rather than body_material_tech.',
    },
    SRE5015: {
      tech_evidence: 'JapanTackle review text describes Core solid metal body and the earlier manual review already normalized it to CORESOLID BODY / 一体成型.',
      recommended_body_material_tech: 'CORESOLID BODY / 一体成型',
      extraction_decision: 'keep_current_value',
      followup_note: 'Current split between Magnesium and CORESOLID BODY / 一体成型 remains consistent.',
    },
    SRE5019: {
      tech_evidence: 'JapanTackle states Fully machined aluminum body and side plates.',
      recommended_body_material_tech: '全加工',
      extraction_decision: 'keep_current_value',
      followup_note: 'Current tech split is stable and does not mix technology wording into body_material.',
    },
    SRE5025: {
      tech_evidence: 'JapanTackle phrase Hagane body system supports a body-level tech expression, while material stays Magnesium after manual correction.',
      recommended_body_material_tech: 'HAGANE 机身',
      extraction_decision: 'keep_current_value_with_year_bound_note',
      followup_note: 'Keep this year-bound to the 2022 sample; do not generalize across other Aldebaran BFS years.',
    },
  };

  return Array.from(grouped.values())
    .map((row) => {
      const identity = identityByReel.get(row.reel_id) || {};
      const finding = findings[row.reel_id] || {};
      return {
        reel_id: row.reel_id,
        model_year: row.model_year,
        detail_ids: row.detail_ids.join(' | '),
        canonical_alias: normalizeText(identity.canonical_alias) || row.canonical_alias,
        normalized_alias: normalizeText(identity.normalized_alias) || row.normalized_alias,
        current_body_material: row.current_body_material,
        current_body_material_tech: row.current_body_material_tech,
        tech_evidence: finding.tech_evidence || '',
        recommended_body_material_tech: finding.recommended_body_material_tech || row.current_body_material_tech,
        extraction_decision: finding.extraction_decision || '',
        followup_note: finding.followup_note || '',
      };
    })
    .sort((a, b) => a.reel_id.localeCompare(b.reel_id));
}

function buildGearMaterialRows(identityRows) {
  const sampleRows = [
    {
      reel_id: 'SRE5003',
      model_year: '2021',
      normalized_alias: '21 Antares DC',
      japantackle_status: 'no_exact_hit',
      other_whitelist_status: 'no_year_aligned_stable_hit',
      likely_other_source: 'No current year-aligned stable material source confirmed in TackleTour / JDMFishing.',
      recommended_candidate: '',
      recommendation: 'leave_blank',
      source_strategy_note: 'Do not backfill from older Antares DC generations; keep blank until a 2021-aligned exact material source appears.',
    },
    {
      reel_id: 'SRE5004',
      model_year: '2023',
      normalized_alias: '23 Antares DC MD Monster Drive',
      japantackle_status: 'no_exact_hit',
      other_whitelist_status: 'tackletour_exact_material_hit',
      likely_other_source: 'TackleTour 2023 review says the main gear is brass.',
      recommended_candidate: 'Brass main gear',
      recommendation: 'other_whitelist_can_supplement',
      source_strategy_note: 'JapanTackle miss should continue to other white-listed sources here, because TackleTour provides year-aligned exact material evidence.',
    },
    {
      reel_id: 'SRE5015',
      model_year: '2024',
      normalized_alias: '24 Metanium DC',
      japantackle_status: 'exact_hit',
      other_whitelist_status: 'not_needed_for_now',
      likely_other_source: 'JapanTackle already gives Duralumin drive gear.',
      recommended_candidate: 'Duralumin drive gear',
      recommendation: 'keep_current_value',
      source_strategy_note: 'Current JapanTackle hit is already exact and year-bound enough for the 2024 sample.',
    },
    {
      reel_id: 'SRE5019',
      model_year: '2023',
      normalized_alias: '23 Calcutta Conquest BFS',
      japantackle_status: 'no_exact_hit',
      other_whitelist_status: 'tech_hit_but_not_material_hit',
      likely_other_source: 'TackleTour 2023 preview mentions precisely cut micro module gear, but does not give a gear material.',
      recommended_candidate: '',
      recommendation: 'leave_blank',
      source_strategy_note: 'Micro module gear wording alone is not enough; keep blank until an exact material phrase appears.',
    },
    {
      reel_id: 'SRE5025',
      model_year: '2022',
      normalized_alias: '22 Aldebaran BFS',
      japantackle_status: 'no_exact_hit',
      other_whitelist_status: 'tackletour_exact_material_hit',
      likely_other_source: 'TackleTour 2022 review says the main gear is aluminum.',
      recommended_candidate: 'Aluminum main gear',
      recommendation: 'other_whitelist_can_supplement',
      source_strategy_note: 'JapanTackle miss should continue to other white-listed sources here, because TackleTour provides year-aligned exact material evidence.',
    },
  ];

  const identityByReel = new Map(identityRows.map((row) => [normalizeText(row.reel_id), row]));
  return sampleRows.map((row) => {
    const identity = identityByReel.get(row.reel_id) || {};
    return {
      ...row,
      canonical_alias: normalizeText(identity.canonical_alias),
      normalized_alias: normalizeText(identity.normalized_alias) || row.normalized_alias,
    };
  });
}

function renderMarkdown(bodyRows, gearRows) {
  const lines = [
    '# Shimano baitcasting reel whitelist 补充复核',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- input_identity_patch: \`${path.relative(REPO_ROOT, IDENTITY_PATCH)}\``,
    `- input_recheck_view: \`${path.relative(REPO_ROOT, RECHECK_VIEW)}\``,
    '',
    '当前只覆盖已经稳定的 5 个 Shimano baitcasting reel identity 样本，不扩样本，不推进 apply。',
    '',
    '## 1. body_material_tech 补充复核',
    '',
    '- 本轮重点核了 `SRE5004` 的描述层技术表达，确认 JapanTackle 页面里确实出现了：`Hagane body`、`4x8DC MD Tune brake system`、`X-SHIP gear system`、`MGL spool 3`、`Micro module gears`。',
    '- 其中真正属于 `body_material_tech` 的只有 `Hagane body`，建议规范写成 `HAGANE 机身`。',
    '- 其余表达分别属于刹车、齿轮、线杯等子系统，不应混写进 `body_material_tech`。',
    '',
    '| reel_id | model_year | normalized_alias | current_body_material_tech | recommended_body_material_tech | extraction_decision |',
    '| --- | --- | --- | --- | --- | --- |',
    ...bodyRows.map((row) => `| ${[
      row.reel_id,
      row.model_year,
      row.normalized_alias,
      row.current_body_material_tech || '-',
      row.recommended_body_material_tech || '-',
      row.extraction_decision || '-',
    ].map((v) => String(v).replace(/\|/g, '\\|')).join(' | ')} |`),
    '',
    '## 2. gear_material 来源策略复查',
    '',
    '- 当前 JapanTackle 直接命中的样本：`SRE5015`',
    '- 当前 JapanTackle 未命中，但其他白名单辅助站可继续补查的样本：`SRE5004`、`SRE5025`',
    '- 当前多辅助站仍没有稳定材料证据、应继续留空的样本：`SRE5003`、`SRE5019`',
    '',
    '| reel_id | model_year | normalized_alias | JapanTackle | other whitelist | recommendation | candidate |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...gearRows.map((row) => `| ${[
      row.reel_id,
      row.model_year,
      row.normalized_alias,
      row.japantackle_status,
      row.other_whitelist_status,
      row.recommendation,
      row.recommended_candidate || '-',
    ].map((v) => String(v).replace(/\|/g, '\\|')).join(' | ')} |`),
    '',
    '## 结论',
    '',
    '- `SRE5004` 的 `body_material_tech` 应补值，建议补成：`HAGANE 机身`。',
    '- `gear_material` 的策略建议改成：`JapanTackle 未命中 -> 继续查其他已在白名单中的辅助站`，但前提必须是**年款对齐 + 精确材质表达**，不能把 `Micro module gear` 这类非材质词硬写进去。',
    '',
  ];
  return lines.join('\n');
}

function writeWorkbook(bodyRows, gearRows) {
  ensureDirForFile(OUTPUT_XLSX);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bodyRows), 'body_material_tech_review');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gearRows), 'gear_material_source_review');
  XLSX.writeFile(wb, OUTPUT_XLSX);
}

function main() {
  const identityRows = loadIdentityPatch();
  const recheckRows = loadRecheckRows();
  const bodyRows = buildBodyMaterialTechRows(recheckRows, identityRows);
  const gearRows = buildGearMaterialRows(identityRows);
  const markdown = renderMarkdown(bodyRows, gearRows);

  ensureDirForFile(OUTPUT_MD);
  fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');
  writeWorkbook(bodyRows, gearRows);

  console.log(`followup markdown -> ${OUTPUT_MD}`);
  console.log(`followup workbook -> ${OUTPUT_XLSX}`);
}

main();
