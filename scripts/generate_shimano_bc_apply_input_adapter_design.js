const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONFLICT_TAGGED_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_conflict_tagged_recheck_view.xlsx');
const BASELINE_XLSX = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import_副本.xlsx');
const OUTPUT_MD = path.resolve(
  REPO_ROOT,
  'GearSage-client/docs/Shimano_baitcasting_reel_apply_input_适配层设计_v1.md'
);
const OUTPUT_XLSX = gearDataPaths.resolveDataRaw('experiment_reports/review/2026-04-16_shimano_baitcasting_reel_apply_input_adapter_v1.xlsx');

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSheetRows(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
}

function loadBaseline() {
  const workbook = XLSX.readFile(BASELINE_XLSX);
  return {
    masters: XLSX.utils.sheet_to_json(workbook.Sheets['reel'], { defval: '' }),
    details: XLSX.utils.sheet_to_json(workbook.Sheets['baitcasting_reel_detail'], { defval: '' }),
    masterHeaders: XLSX.utils.sheet_to_json(workbook.Sheets['reel'], { header: 1, defval: '' })[0] || [],
    detailHeaders: XLSX.utils.sheet_to_json(workbook.Sheets['baitcasting_reel_detail'], { header: 1, defval: '' })[0] || [],
  };
}

function getAliasParts(currentValue) {
  const [canonical, normalized] = String(currentValue || '').split('=>').map((item) => normalizeText(item));
  return { canonical_alias: canonical, normalized_alias: normalized };
}

function getCurrentLayer(row) {
  if (row.field_key === 'model_year' || row.field_key === 'version_signature') return 'identity';
  if (row.field_key === 'alias') return 'identity_dual';
  if (row.field_key === 'body_material' || row.field_key === 'body_material_tech') {
    if (row.source_type === 'review_confirmed_manual') return 'player_review_confirmed';
    return 'player_direct';
  }
  if (row.field_key === 'gear_material') {
    if (row.conflict_tag === 'accepted_inferred') return 'inferred';
    if (row.conflict_tag === 'accepted_manual_blank') return 'manual_blank';
    return 'player_direct';
  }
  return 'unknown';
}

function buildMappingRows() {
  const baseline = loadBaseline();
  const mastersById = new Map(baseline.masters.map((row) => [normalizeText(row.id), row]));
  const detailsById = new Map(baseline.details.map((row) => [normalizeText(row.id), row]));
  const conflictRows = loadSheetRows(CONFLICT_TAGGED_XLSX, 'conflict_tagged_view');

  return conflictRows.map((row) => {
    const master = mastersById.get(normalizeText(row.reel_id)) || {};
    const detail = detailsById.get(normalizeText(row.detail_id)) || {};
    const currentLayer = getCurrentLayer(row);

    let applyInputValue = normalizeText(row.current_value);
    let applyInputLayer = currentLayer;
    let applyInputStatus = 'ready_detail_value';
    let targetBaselineColumn = '';
    let targetScope = '';
    let overwritePolicy = 'fill_blank_only';
    let notes = '';

    if (row.field_key === 'model_year') {
      targetBaselineColumn = 'model_year';
      targetScope = 'master';
      applyInputLayer = 'master_identity_value';
      applyInputStatus = 'requires_new_apply_input_state';
      overwritePolicy = 'fill_blank_only';
      notes = 'Use identity-resolved model_year as master-scoped apply input. This value should be packaged outside the current detail-only patch.';
    } else if (row.field_key === 'alias') {
      const aliasParts = getAliasParts(row.current_value);
      applyInputValue = aliasParts.normalized_alias;
      targetBaselineColumn = 'alias';
      targetScope = 'master';
      applyInputLayer = 'master_dual_alias_value';
      applyInputStatus = 'requires_new_apply_input_state';
      overwritePolicy = 'controlled_replace_legacy_blank_or_noise';
      notes = `Keep canonical_alias='${aliasParts.canonical_alias}' in apply metadata, but map normalized_alias='${aliasParts.normalized_alias}' into current single alias column.`;
    } else if (row.field_key === 'version_signature') {
      targetBaselineColumn = '(missing)';
      targetScope = 'master';
      applyInputLayer = 'master_identity_value';
      applyInputStatus = 'blocked_missing_baseline_column';
      overwritePolicy = 'cannot_apply_until_column_exists';
      notes = 'version_signature needs a new baseline master column or a sidecar apply state. It cannot map directly today.';
    } else if (row.field_key === 'body_material') {
      targetBaselineColumn = 'body_material';
      targetScope = 'detail';
      applyInputLayer = currentLayer === 'player_review_confirmed' ? 'detail_confirmed_value' : 'detail_direct_value';
      const baselineValue = normalizeText(detail.body_material);
      applyInputStatus = baselineValue && baselineValue !== applyInputValue
        ? 'ready_with_controlled_replace'
        : 'ready_detail_value';
      overwritePolicy = baselineValue && baselineValue !== applyInputValue
        ? 'controlled_replace_legacy_value'
        : 'fill_blank_only';
      notes = baselineValue && baselineValue !== applyInputValue
        ? `Baseline currently holds legacy value '${baselineValue}', so this field needs controlled replacement rather than blank fill.`
        : 'This field can be carried as a normal detail apply input value.';
    } else if (row.field_key === 'body_material_tech') {
      targetBaselineColumn = 'body_material_tech';
      targetScope = 'detail';
      applyInputLayer = 'detail_confirmed_value';
      applyInputStatus = 'requires_new_apply_input_state';
      overwritePolicy = 'fill_blank_or_controlled_replace_if_review_confirmed';
      notes = 'body_material_tech is confirmed in review support layer and should enter apply input explicitly rather than depending on old body patch payload.';
    } else if (row.field_key === 'gear_material') {
      targetBaselineColumn = 'gear_material';
      targetScope = 'detail';
      if (row.conflict_tag === 'accepted_inferred') {
        applyInputLayer = 'detail_inferred_value';
        applyInputStatus = 'requires_new_apply_input_state';
        overwritePolicy = 'fill_blank_only_keep_non_official';
        notes = 'Keep this as inferred/non-official inside apply input. Do not promote it to official or plain direct value.';
      } else if (row.conflict_tag === 'accepted_manual_blank') {
        applyInputValue = '';
        applyInputLayer = 'detail_confirmed_blank';
        applyInputStatus = 'requires_new_apply_input_state';
        overwritePolicy = 'preserve_blank_as_confirmed';
        notes = 'This blank is intentional. Apply input must carry explicit confirmed_blank state so it is not treated as missing scrape.';
      } else {
        applyInputLayer = 'detail_confirmed_value';
        applyInputStatus = 'requires_new_apply_input_state';
        overwritePolicy = 'fill_blank_or_controlled_replace_if_review_confirmed';
        notes = 'Direct-write gear_material should be packed into apply input explicitly so current confirmed state is not lost.';
      }
    }

    return {
      detail_id: normalizeText(row.detail_id),
      reel_id: normalizeText(row.reel_id),
      model_year: normalizeText(row.model_year),
      SKU: normalizeText(row.SKU),
      field_key: normalizeText(row.field_key),
      current_confirmed_state: normalizeText(row.conflict_resolution_state),
      current_value: normalizeText(row.current_value),
      current_layer: currentLayer,
      apply_input_value: applyInputValue,
      apply_input_layer: applyInputLayer,
      apply_input_status: applyInputStatus,
      target_baseline_column: targetBaselineColumn,
      target_scope: targetScope,
      overwrite_policy: overwritePolicy,
      notes,
    };
  });
}

function buildSimulationRows(mappingRows) {
  const byKey = new Map();
  for (const row of mappingRows) {
    const key = `${row.reel_id}:${row.field_key}`;
    if (!byKey.has(key)) byKey.set(key, row);
  }

  return Array.from(byKey.values()).map((row) => {
    let simulationResult = 'can_directly_convert';
    let simulationNote = 'Current confirmed state can be translated to apply input without adding a new semantic state.';

    if (row.apply_input_status === 'requires_new_apply_input_state') {
      simulationResult = 'needs_new_apply_input_state';
      simulationNote = `Need explicit apply input state '${row.apply_input_layer}' to preserve the current confirmed semantics.`;
    }
    if (row.apply_input_status === 'blocked_missing_baseline_column') {
      simulationResult = 'cannot_direct_map_missing_column';
      simulationNote = 'Baseline is missing the target column, so mapping cannot be completed without structural extension.';
    }

    return {
      reel_id: row.reel_id,
      field_key: row.field_key,
      current_confirmed_state: row.current_confirmed_state,
      current_layer: row.current_layer,
      apply_input_layer: row.apply_input_layer,
      apply_input_status: row.apply_input_status,
      simulation_result: simulationResult,
      simulation_note: simulationNote,
    };
  }).sort((a, b) => {
    const reelDiff = a.reel_id.localeCompare(b.reel_id);
    if (reelDiff !== 0) return reelDiff;
    return a.field_key.localeCompare(b.field_key);
  });
}

function buildStateInventory(mappingRows) {
  const inventory = new Map();
  for (const row of mappingRows) {
    const key = row.apply_input_layer;
    if (!inventory.has(key)) {
      inventory.set(key, {
        apply_input_layer: row.apply_input_layer,
        applies_to_fields: new Set(),
        status_examples: new Set(),
        notes: new Set(),
      });
    }
    const item = inventory.get(key);
    item.applies_to_fields.add(row.field_key);
    item.status_examples.add(row.apply_input_status);
    item.notes.add(row.notes);
  }

  return Array.from(inventory.values()).map((item) => ({
    apply_input_layer: item.apply_input_layer,
    applies_to_fields: Array.from(item.applies_to_fields).sort().join(', '),
    status_examples: Array.from(item.status_examples).sort().join(', '),
    notes: Array.from(item.notes).slice(0, 2).join(' | '),
  }));
}

function renderMarkdown(mappingRows, simulationRows, stateInventory) {
  const uniqueRows = Array.from(new Map(simulationRows.map((row) => [`${row.reel_id}:${row.field_key}`, row])).values());
  const directlyConvertible = uniqueRows.filter((row) => row.simulation_result === 'can_directly_convert');
  const needsNewState = uniqueRows.filter((row) => row.simulation_result === 'needs_new_apply_input_state');
  const missingColumn = uniqueRows.filter((row) => row.simulation_result === 'cannot_direct_map_missing_column');

  const lines = [
    '# Shimano baitcasting reel apply input 适配层设计 v1',
    '',
    `- generated_at: ${new Date().toISOString()}`,
    `- scope: current 5 Shimano baitcasting reel samples / current 6 fields only`,
    '',
    '这份设计只解决“当前确认状态如何进入 apply 输入”，不修改现有 whitelist patch，不推进真实 apply。',
    '',
    '## 目标',
    '',
    '- 把 identity / review / conflict-tagged 状态翻译成一层可进入 apply 前验证的输入层',
    '- 不直接拿现有 patch 硬写 baseline',
    '- 把 master / detail 字段分别包装成可控的 apply input 状态',
    '',
    '## 重点回答',
    '',
    '### 1. master 字段 `model_year / alias / version_signature` 怎么进入 apply 输入',
    '',
    '- `model_year`：进入 `master_identity_value` 状态，master-scope，值直接取当前 identity-resolved year。',
    '- `alias`：进入 `master_dual_alias_value` 状态，apply input 同时保留 `canonical_alias` 与 `normalized_alias`；对当前 baseline 单列，默认映射 `normalized_alias`。',
    '- `version_signature`：进入 `master_identity_value` 状态，但当前 baseline 缺列，所以只能先表达在 apply input 里，不能直接落 baseline。',
    '',
    '### 2. `alias = dual_source_kept` 怎么映射到当前 baseline 单列',
    '',
    '- baseline 当前只有一个 `alias` 列，所以建议：',
    '  - apply input 内保留双层：`canonical_alias` + `normalized_alias`',
    '  - baseline 单列默认写 `normalized_alias`',
    '  - `canonical_alias` 保留在 apply input metadata / audit layer，不丢弃',
    '',
    '### 3. `accepted_inferred` 怎么在 apply 输入层表达，避免误当 official',
    '',
    '- 进入 `detail_inferred_value` 状态',
    '- apply input 里显式标注来源层是 `inferred`',
    '- 不允许在 apply input 阶段降格成普通 direct value，更不允许升成 `official`',
    '',
    '### 4. `accepted_manual_blank` 怎么在 apply 输入层显式表达，避免下次又被当成漏抓',
    '',
    '- 进入 `detail_confirmed_blank` 状态',
    '- apply input 里显式写入“这是已确认留空”而不是“无值”',
    '- 这样后续 dry-run / apply 才不会把它重新识别成 scrape miss',
    '',
    '### 5. baseline 旧值建议先清理还是允许受控替换',
    '',
    '- 当前建议：**允许受控替换，不建议先做大面积预清理**',
    '- 原因：',
    '  - baseline 旧值仍有审计意义',
    '  - 当前 5 个样本已经有 review / conflict 结论，可以逐字段受控替换',
    '  - 直接先清理会让“旧值为什么被替换”这条证据链变弱',
    '',
    '## apply input 最小状态集',
    '',
    '- `master_identity_value`',
    '- `master_dual_alias_value`',
    '- `detail_confirmed_value`',
    '- `detail_inferred_value`',
    '- `detail_confirmed_blank`',
    '',
    '补充说明：',
    '',
    '- `version_signature` 目前还额外需要 `blocked_missing_baseline_column` 这个映射结果，不是因为状态不够，而是 baseline 结构还没接住它。',
    '',
    '## 当前 5 个样本的 apply input simulation',
    '',
    `- 可直接转成 apply input：${directlyConvertible.map((row) => `${row.reel_id}:${row.field_key}`).join('、') || '无'}`,
    `- 需要新增 apply input 状态字段：${needsNewState.map((row) => `${row.reel_id}:${row.field_key}`).join('、') || '无'}`,
    `- 因 baseline 缺列不能直接映射：${missingColumn.map((row) => `${row.reel_id}:${row.field_key}`).join('、') || '无'}`,
    '',
    '## 状态清单',
    '',
    '| apply_input_layer | applies_to_fields | status_examples | notes |',
    '| --- | --- | --- | --- |',
    ...stateInventory.map((row) => `| ${[
      row.apply_input_layer,
      row.applies_to_fields,
      row.status_examples,
      row.notes,
    ].map((value) => String(value).replace(/\|/g, '\\|')).join(' | ')} |`),
    '',
  ];

  return lines.join('\n');
}

function writeWorkbook(mappingRows, simulationRows, stateInventory) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(mappingRows), 'apply_input_mapping');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(simulationRows), 'apply_input_simulation');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stateInventory), 'state_inventory');
  XLSX.writeFile(workbook, OUTPUT_XLSX);
}

function main() {
  const mappingRows = buildMappingRows();
  const simulationRows = buildSimulationRows(mappingRows);
  const stateInventory = buildStateInventory(mappingRows);
  ensureDir(OUTPUT_MD);
  ensureDir(OUTPUT_XLSX);
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(mappingRows, simulationRows, stateInventory), 'utf8');
  writeWorkbook(mappingRows, simulationRows, stateInventory);
  console.log(`apply input design markdown -> ${OUTPUT_MD}`);
  console.log(`apply input design workbook -> ${OUTPUT_XLSX}`);
}

main();
