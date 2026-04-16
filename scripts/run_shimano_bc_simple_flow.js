const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONFIG_FILE = path.resolve(__dirname, './config/shimano_baitcasting_simple_flow_config.json');

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function resolveRepoPath(relativePath) {
  return path.resolve(REPO_ROOT, relativePath);
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function buildOfficialMap(officialRows) {
  const map = new Map();
  for (const row of officialRows) {
    const key = normalizeText(row.model_name);
    if (key) map.set(key, row);
  }
  return map;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  const text = normalizeText(value);
  return text ? [text] : [];
}

function main() {
  const config = loadJson(CONFIG_FILE);
  const officialFile = resolveRepoPath(config.inputs.official_normalized_json);
  const templateFile = resolveRepoPath(config.inputs.template_workbook);
  const outputWorkbookFile = resolveRepoPath(config.outputs.working_copy);
  const outputSidecarFile = resolveRepoPath(config.outputs.sidecar_json);
  const outputSummaryFile = resolveRepoPath(config.outputs.summary_markdown);

  const officialRows = loadJson(officialFile);
  const officialMap = buildOfficialMap(officialRows);

  const workbook = XLSX.readFile(templateFile);
  const masterSheetName = 'reel';
  const detailSheetName = 'baitcasting_reel_detail';
  const masterRows = XLSX.utils.sheet_to_json(workbook.Sheets[masterSheetName], { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(workbook.Sheets[detailSheetName], { defval: '' });

  const sampleMap = new Map(config.samples.map((sample) => [sample.reel_id, sample]));
  const sidecar = {
    flow: 'official + whitelist simple flow',
    generated_at: new Date().toISOString(),
    scope: {
      brand: config.brand,
      category: config.category,
      reel_ids: config.samples.map((sample) => sample.reel_id),
      master_fields: config.master_fields,
      detail_fields: config.detail_fields,
      sidecar_only_fields: config.sidecar_only_fields,
    },
    master_metadata: [],
    detail_metadata: [],
  };

  const summary = {
    filled: {
      model_year: 0,
      alias: 0,
      body_material: 0,
      body_material_tech: 0,
      gear_material: 0,
    },
    blank: {
      model_year: 0,
      alias: 0,
      body_material: 0,
      body_material_tech: 0,
      gear_material: 0,
    },
    sidecar_only: {
      canonical_alias: 0,
      version_signature: 0,
      gear_material_state: 0,
    },
  };

  for (const row of masterRows) {
    const sample = sampleMap.get(normalizeText(row.id));
    if (!sample) continue;

    const official = officialMap.get(normalizeText(sample.model)) || {};
    const officialModelYear = normalizeText(official.model_year);
    const finalModelYear = officialModelYear || normalizeText(sample.model_year);
    const finalAlias = normalizeText(sample.normalized_alias);

    row.model_year = finalModelYear;
    row.alias = finalAlias;

    summary.filled.model_year += finalModelYear ? 1 : 0;
    summary.blank.model_year += finalModelYear ? 0 : 1;
    summary.filled.alias += finalAlias ? 1 : 0;
    summary.blank.alias += finalAlias ? 0 : 1;
    summary.sidecar_only.canonical_alias += 1;
    summary.sidecar_only.version_signature += 1;

    sidecar.master_metadata.push({
      reel_id: row.id,
      model: row.model,
      official_url: sample.official_url || normalizeText(official.source_url),
      model_year: {
        value: finalModelYear,
        source_type: officialModelYear ? 'official' : sample.master_trace.source_type,
        source_site: officialModelYear ? 'Official Brand Site' : sample.master_trace.source_site,
        source_url: officialModelYear ? normalizeText(official.source_url) : sample.master_trace.source_url,
        evidence_type: officialModelYear ? 'official_page' : sample.master_trace.evidence_type,
        confidence: officialModelYear ? 'high' : sample.master_trace.confidence,
      },
      alias: {
        value: finalAlias,
        source_type: sample.master_trace.source_type,
        source_site: sample.master_trace.source_site,
        source_url: sample.master_trace.source_url,
        evidence_type: sample.master_trace.evidence_type,
        confidence: sample.master_trace.confidence,
      },
      canonical_alias: sample.canonical_alias,
      normalized_alias: sample.normalized_alias,
      version_signature: sample.version_signature,
    });
  }

  for (const row of detailRows) {
    const sample = sampleMap.get(normalizeText(row.reel_id));
    if (!sample) continue;

    for (const fieldKey of config.detail_fields) {
      const fieldMeta = sample.detail_fields_map[fieldKey];
      if (!fieldMeta) continue;
      const finalValue = normalizeText(fieldMeta.value);
      row[fieldKey] = finalValue;
      if (finalValue) {
        summary.filled[fieldKey] += 1;
      } else {
        summary.blank[fieldKey] += 1;
      }
      if (fieldKey === 'gear_material') {
        summary.sidecar_only.gear_material_state += 1;
      }

      sidecar.detail_metadata.push({
        detail_id: row.id,
        reel_id: row.reel_id,
        SKU: row.SKU,
        field_key: fieldKey,
        value: finalValue,
        source_type: fieldMeta.source_type,
        source_site: fieldMeta.source_site,
        source_url: toArray(fieldMeta.source_url),
        evidence_type: fieldMeta.evidence_type,
        confidence: fieldMeta.confidence,
        layer: fieldMeta.layer || (fieldMeta.source_type === 'cross_source_inferred' ? 'inferred' : 'player'),
        state: fieldMeta.state || (finalValue ? 'written' : 'blank'),
      });
    }
  }

  workbook.Sheets[masterSheetName] = XLSX.utils.json_to_sheet(masterRows);
  workbook.Sheets[detailSheetName] = XLSX.utils.json_to_sheet(detailRows);

  ensureDirForFile(outputWorkbookFile);
  ensureDirForFile(outputSidecarFile);
  ensureDirForFile(outputSummaryFile);

  XLSX.writeFile(workbook, outputWorkbookFile);
  fs.writeFileSync(outputSidecarFile, JSON.stringify(sidecar, null, 2), 'utf8');

  const summaryMarkdown = [
    '# Shimano 两轴轮简单主流程试运行摘要',
    '',
    `更新时间：${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    '',
    '## 默认入口',
    '',
    '- `scripts/run_shimano_bc_simple_flow.js`',
    '',
    '## 本轮自动补值字段',
    '',
    '- 主表：`model_year`、`alias`',
    '- 详情：`body_material`、`body_material_tech`、`gear_material`',
    '',
    '## 辅助站补到的字段',
    '',
    `- \`model_year\`：${summary.filled.model_year} 个主商品`,
    `- \`alias\`：${summary.filled.alias} 个主商品`,
    `- \`body_material\`：${summary.filled.body_material} 条明细`,
    `- \`body_material_tech\`：${summary.filled.body_material_tech} 条明细`,
    `- \`gear_material\`：${summary.filled.gear_material} 条明细`,
    '',
    '## 仍然留空的字段',
    '',
    `- \`gear_material\`：${summary.blank.gear_material} 条明细（当前保持空值）`,
    '',
    '## sidecar-only',
    '',
    `- \`canonical_alias\`：${summary.sidecar_only.canonical_alias} 个主商品`,
    `- \`version_signature\`：${summary.sidecar_only.version_signature} 个主商品`,
    `- \`gear_material\` 的 inferred / blank 语义：${summary.sidecar_only.gear_material_state} 条明细`,
    '',
    '## 输出文件',
    '',
    `- 工作副本：\`${config.outputs.working_copy}\``,
    `- sidecar：\`${config.outputs.sidecar_json}\``,
    `- 摘要：\`${config.outputs.summary_markdown}\``,
    '',
    '## 说明',
    '',
    '- 官网有值就直接用官网。',
    '- 官网缺值才触发白名单辅助站补值。',
    '- 查到明确值才写入工作副本，查不到就留空。',
    '- `gear_material` 即使写入工作副本，也保留 source_type / layer 语义，避免把 inferred 当成官方值。',
    ''
  ].join('\n');

  fs.writeFileSync(outputSummaryFile, summaryMarkdown, 'utf8');

  console.log(`Simple flow workbook written to ${outputWorkbookFile}`);
  console.log(`Simple flow sidecar written to ${outputSidecarFile}`);
  console.log(`Simple flow summary written to ${outputSummaryFile}`);
}

main();
