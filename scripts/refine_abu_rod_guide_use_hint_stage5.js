const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('./node_modules/xlsx');
const { HEADERS } = require('./gear_export_schema');

const IMPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_import.xlsx');
const USAGE_REPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_usage_fields_refine_report.json');
const REPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_guide_use_hint_refine_report.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_abu_rod_detail_groups.py');

const FIELD = 'guide_use_hint';

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function lower(value) {
  return n(value).toLowerCase();
}

function splitRig(value) {
  return n(value).split('/').map(n).filter(Boolean);
}

function rigList(value, count = 3) {
  return splitRig(value).slice(0, count);
}

function rigText(value, count = 3) {
  const rigs = rigList(value, count);
  if (!rigs.length) return '常用钓组';
  if (rigs.length === 1) return rigs[0];
  if (rigs.length === 2) return `${rigs[0]} 和 ${rigs[1]}`;
  return `${rigs[0]}、${rigs[1]}、${rigs[2]}`;
}

function lengthText(row) {
  return n(row['TOTAL LENGTH']) || n(row['Code Name']).split('/')[0]?.trim() || '';
}

function lineText(row) {
  return n(row['Line Wt N F']).replace(/\s*-\s*/g, '-');
}

function reelType(row) {
  return n(row.TYPE) === 'S' ? '直柄' : '枪柄';
}

function tier(model, row = {}) {
  const text = lower(model);
  const rig = lower(row.recommended_rig_pairing);
  const sku = n(row.SKU).toUpperCase();
  if (/hunter|flipping/.test(text) || /FLP/.test(sku)) return 'Flipping';
  if (/ike/.test(text) && /finesse|shaky head|down shot|neko|wacky/.test(rig)) return 'Finesse';
  if (/ike/.test(text) && /crankbait|jerkbait|topwater|reaction/.test(rig)) return 'Delay';
  if (/ike/.test(text) && /spinnerbait|chatterbait|swim jig|power/.test(rig)) return 'Power Fishing';
  if (/ice/.test(text)) return '冰钓短竿';
  if (/zenon|fantasista/.test(text)) return '高阶轻量';
  if (/veritas tournament|tournament/.test(text)) return '竞赛轻量';
  if (/veritas/.test(text)) return '轻量高感';
  if (/ike|hunter/.test(text)) return '玩法专项';
  if (/beast/.test(text)) return '强负荷';
  if (/vendetta/.test(text)) return '进阶泛用';
  if (/vengeance/.test(text)) return '入门耐用';
  if (/max/.test(text)) return '实战泛用';
  if (/winch/.test(text)) return '卷阻专用';
  return '淡水泛用';
}

function spec(row) {
  return [lengthText(row), n(row.POWER), n(row.Action)].filter(Boolean).join(' ');
}

function linePhrase(row) {
  const line = lineText(row);
  return line ? `${line} 线组` : '细线';
}

function context(row, model) {
  const label = tier(model, row);
  const tierReel = /[A-Za-z]$/.test(label) ? `${label} ${reelType(row)}` : `${label}${reelType(row)}`;
  return `${tierReel}${spec(row) ? ` ${spec(row)}` : ''}，`;
}

function idx(row, max) {
  const seed = n(row.id || row.SKU).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return seed % max;
}

function choose(row, items) {
  return items[idx(row, items.length)];
}

function hint(row, model, usage) {
  const category = usage?.category || 'fallback';
  const main = rigText(row.recommended_rig_pairing, 3);
  const firstTwo = rigText(row.recommended_rig_pairing, 2);
  const cx = context(row, model);
  const line = linePhrase(row);
  const len = lengthText(row);
  const power = n(row.POWER);
  const action = n(row.Action);

  switch (category) {
    case 'ice':
      return `${cx}适合冰洞边垂直控饵；${main} 用轻抽、停顿和小幅抬落更自然，重点看轻口反馈。`;

    case 'flipping':
      return choose(row, [
        `${cx}用于 cover 内打点时，${firstTwo} 要压低弹道进洞；刺鱼后直接把鱼带离草根和木桩。`,
        `${cx}更适合近距离 pitching / flipping，${main} 以落点和入障角度为先，回线不能拖泥带水。`,
      ]);

    case 'frog':
      return choose(row, [
        `${cx}面向草垫和浅水 cover；Frog 开口后要快速收线压鱼，Punching / Heavy Texas 可补打草洞。`,
        `${cx}适合草面搜索和重 cover 控鱼，${main} 的重点是抛准、等口和出障速度。`,
      ]);

    case 'beast_muskie':
      return `${cx}承担高负荷大饵，${main} 要留足挥竿空间；${line} 下更重视连续抛投后的控鱼稳定。`;

    case 'beast_big_bait':
      return `${cx}适合开阔水域压水层慢收；${main} 回收阻力高，抛投节奏和中鱼后的持续施压要更稳。`;

    case 'beast_swimbait':
      return choose(row, [
        `${cx}以中大型泳饵扇形搜索为主，${main} 适合慢收或贴结构通过，竿身缓冲比快速抽打更重要。`,
        `${cx}适合 Swimbait 路线，${main} 可覆盖开阔水和草边外侧，重点保持泳姿和回收张力。`,
      ]);

    case 'beast_light':
    case 'beast_spinning':
      return `${cx}按${line}控制饵重，${main} 更适合慢收和轻负荷搜索，操作边界应放在小型软泳饵和轻负荷连续搜索。`;

    case 'bfs_winch':
      return `${cx}适合细线小卷阻饵，${main} 可低弹道进入窄标点；鱼口变轻时再切 No Sinker / Neko。`;

    case 'bfs':
      return choose(row, [
        `${cx}核心是轻饵启动和控线，${main} 适合小标点低弹道抛投，软硬饵切换要控制饵重上限。`,
        `${cx}更偏 BFS 轻量路线，${main} 可以在岸边障碍和小水面之间切换，重点是出线轻和落点准。`,
      ]);

    case 'winch':
      return choose(row, [
        `${cx}以稳定卷收为核心，${main} 适合沿草边、石滩和浅中层水线搜索，短咬时不宜立刻大幅扬竿。`,
        `${cx}偏 crankbait 节奏，${main} 要保持泳层和回收速度；挂底或碰障后用竿身缓冲带过。`,
      ]);

    case 'delay':
      return `${cx}适合 reaction bait 抽停和连续卷收；${main} 需要给鱼追咬窗口，挂鱼后靠调性缓冲短咬。`;

    case 'power_fishing':
      return `${cx}适合快速覆盖水层，${main} 先搜索活性鱼；标点明确后可切 Texas / Rubber Jig 补打。`;

    case 'finesse':
      return choose(row, [
        `${cx}用于 finesse bait 时要放慢节奏，${main} 重在控松线、看线和小幅度牵动。`,
        `${cx}适合细线精细操作，${main} 不需要大动作抽竿，咬口判断和补刺节奏更关键。`,
      ]);

    case 'topwater':
      return `${cx}适合浅水窗口期，${main} 走停和抽停要留节奏；无表层口时可转 Spinnerbait / Chatterbait 搜索。`;

    case 'bladed_jig':
      return `${cx}适合草边、浑水和硬物边搜索；${main} 需要稳定回收负荷，碰草后轻抖脱出。`;

    case 'casting_heavy_moving':
      return `${cx}拉动阻力较大的移动饵更顺手，${main} 适合草边大范围搜索，收线张力要保持连续。`;

    case 'casting_heavy_bottom':
      return choose(row, [
        `${cx}偏重线底操，${main} 适合木桩、石堆和厚草边慢拖，重点是读底后稳定刺鱼。`,
        `${cx}用于强结构打点时，${main} 要让饵贴底通过障碍；中鱼后用竿腰把鱼带出标点。`,
      ]);

    case 'casting_mh_bottom':
      return choose(row, [
        `${cx}是中重型底操主力，${main} 适合岸边结构、草边和硬物点；搜索时再换 Chatterbait / Spinnerbait。`,
        `${cx}更适合 Texas / Jig 路线，${main} 先保证落点和读底，鱼活性高时可切移动饵提高覆盖。`,
        `${cx}用于 cover 外缘和硬结构慢拖，${main} 的优势在刺鱼余量和软硬饵切换宽容。`,
      ]);

    case 'casting_medium_bottom':
      return choose(row, [
        `${cx}适合轻中量底操，${main} 可以打岸边硬物和稀疏 cover；移动饵只是活性高时的补充。`,
        `${cx}抛投负担较轻，${main} 适合短中距离打点；需要搜索时再切 Spinnerbait / Chatterbait。`,
      ]);

    case 'casting_medium_moving':
      return `${cx}偏浅中层移动饵，${main} 适合沿岸线稳定卷收；软饵只作为慢口补充，不是主轴。`;

    case 'casting_light_finesse':
      return `${cx}适合细线轻饵打点，${main} 要控制落点和松线；小 crank 可做短距离搜索补充。`;

    case 'spinning_light_finesse':
      return choose(row, [
        `${cx}适合细线慢节奏，${main} 以控松线和读轻口为主，不适合粗暴硬拔。`,
        `${cx}用于清水或轻压场更自然，${main} 动作要小，补刺靠节奏和线张力。`,
      ]);

    case 'spinning_heavy_finesse':
      return `${cx}比常规精细竿更能承受稍重钓组，${main} 适合开阔结构和深一点的标点，仍以控线为先。`;

    case 'spinning_moving':
      return `${cx}可承担小硬饵轻抛，${main} 适合岸边搜索；鱼口放慢时切 Wacky / Down Shot 更稳。`;

    case 'spinning_medium_finesse':
    default:
      return choose(row, [
        `${cx}偏直柄精细泛用，${main} 适合岸边轻量软饵；小 Minnow 只是补充搜索路线。`,
        `${cx}适合细线控饵，${main} 的重点是松线管理和轻口判断，硬饵只做短距离补充。`,
        `${cx}用于 Neko / Wacky 更自然，${main} 可覆盖轻量打点和慢节奏搜索，别用太重的饵压竿。`,
      ]);
  }
}

function uniqueStats(rows) {
  const counts = new Map();
  for (const row of rows) {
    const value = n(row[FIELD]);
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return {
    filled: rows.filter((row) => n(row[FIELD])).length,
    unique: counts.size,
    max_duplicate: Math.max(0, ...counts.values()),
    top_duplicates: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value, count]) => ({ value, count })),
  };
}

function validate(rows) {
  const issues = [];
  const sourceLike = /官网|SKU|白名单|tackledb|证据|source|official|推断|规则|视作/;
  const hardwareLike = /导环|维护成本|ROCS|maximized casting distance|stainless|zirconium|titanium|内衬/;
  const mechanical = /规格|取向|优先.*兼顾|服务 crankbait|更适合.*钓组/;

  for (const row of rows) {
    const value = n(row[FIELD]);
    if (!value) issues.push({ severity: 'error', id: row.id, sku: row.SKU, code: 'missing_guide_use_hint' });
    if (sourceLike.test(value)) issues.push({ severity: 'error', id: row.id, sku: row.SKU, code: 'source_language_residual', value });
    if (hardwareLike.test(value)) issues.push({ severity: 'error', id: row.id, sku: row.SKU, code: 'hardware_hint_residual', value });
    if (mechanical.test(value)) issues.push({ severity: 'error', id: row.id, sku: row.SKU, code: 'mechanical_phrase_residual', value });
    if (/Frog/i.test(row.recommended_rig_pairing) && !/Frog|草|cover|障碍/i.test(value)) {
      issues.push({ severity: 'error', id: row.id, sku: row.SKU, code: 'frog_hint_mismatch', value, rig: row.recommended_rig_pairing });
    }
    if (/Crankbait|Shad Crank|Squarebill|Lipless/i.test(splitRig(row.recommended_rig_pairing)[0] || '') && /底操主力|贴底慢拖/.test(value)) {
      issues.push({ severity: 'error', id: row.id, sku: row.SKU, code: 'hardbait_hint_mismatch', value, rig: row.recommended_rig_pairing });
    }
    if (/Down Shot|Neko Rig|Wacky|Shaky Head|Free Rig|Texas Rig|Rubber Jig/i.test(splitRig(row.recommended_rig_pairing)[0] || '') && /crankbait 节奏|稳定卷收/.test(value)) {
      issues.push({ severity: 'error', id: row.id, sku: row.SKU, code: 'softbait_hint_mismatch', value, rig: row.recommended_rig_pairing });
    }
  }

  return issues;
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const usageReport = JSON.parse(fs.readFileSync(USAGE_REPORT_FILE, 'utf8'));
  const usageById = new Map((usageReport.evidence || []).map((item) => [n(item.id), item]));
  const modelByRodId = new Map(rods.map((row) => [n(row.id), n(row.model)]));
  const beforeById = new Map(details.map((row) => [n(row.id), { ...row }]));
  const evidence = [];

  for (const row of details) {
    const model = modelByRodId.get(n(row.rod_id)) || '';
    const usage = usageById.get(n(row.id)) || {};
    const next = hint(row, model, usage);
    const before = n(row[FIELD]);
    row[FIELD] = next;
    evidence.push({
      id: row.id,
      rod_id: row.rod_id,
      model,
      sku: row.SKU,
      category: usage.category || 'fallback',
      recommended_rig_pairing: row.recommended_rig_pairing,
      before,
      after: next,
    });
  }

  const changedRows = [];
  const protectedFieldsChanged = [];
  for (const row of details) {
    const before = beforeById.get(n(row.id)) || {};
    if (n(before[FIELD]) !== n(row[FIELD])) {
      changedRows.push({
        id: row.id,
        rod_id: row.rod_id,
        model: modelByRodId.get(n(row.rod_id)) || '',
        sku: row.SKU,
        before: n(before[FIELD]),
        after: n(row[FIELD]),
      });
    }
    for (const [key, value] of Object.entries(row)) {
      if (key === FIELD) continue;
      if (n(before[key]) !== n(value)) protectedFieldsChanged.push({ id: row.id, field: key, before: before[key], after: value });
    }
  }

  if (protectedFieldsChanged.length) {
    throw new Error(`protected fields changed: ${JSON.stringify(protectedFieldsChanged.slice(0, 5))}`);
  }

  const stats = uniqueStats(details);
  const issues = validate(details);
  const severityCounts = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});
  const categoryCounts = evidence.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  wb.Sheets.rod = XLSX.utils.json_to_sheet(rods, { header: HEADERS.rodMaster });
  wb.Sheets.rod_detail = XLSX.utils.json_to_sheet(details, { header: HEADERS.rodDetail });
  XLSX.writeFile(wb, IMPORT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });

  const report = {
    schema: 'abu_rod_guide_use_hint_refine_report_v1',
    source_xlsx: IMPORT_FILE,
    usage_report: USAGE_REPORT_FILE,
    updated_field: FIELD,
    row_count: details.length,
    evaluated_row_count: details.length,
    rewritten_row_count: details.length,
    changed_row_count: changedRows.length,
    coverage: `${details.filter((row) => n(row[FIELD])).length}/${details.length}`,
    unique_stats: stats,
    category_counts: categoryCounts,
    issue_count: issues.length,
    severity_counts: severityCounts,
    changed_rows: changedRows,
    evidence,
    issues,
  };
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log({
    updated: IMPORT_FILE,
    report: REPORT_FILE,
    rows: details.length,
    changed_rows: changedRows.length,
    coverage: report.coverage,
    unique: stats.unique,
    max_duplicate: stats.max_duplicate,
    severity_counts: severityCounts,
  });

  if (severityCounts.error) process.exit(1);
}

main();
