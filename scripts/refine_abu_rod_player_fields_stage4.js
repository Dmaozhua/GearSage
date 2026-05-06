const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('./node_modules/xlsx');
const { HEADERS } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

const IMPORT_FILE = gearDataPaths.resolveDataRaw('abu_rod_import.xlsx');
const USAGE_REPORT_FILE = gearDataPaths.resolveDataRaw('abu_rod_usage_fields_refine_report.json');
const WHITELIST_EVIDENCE_FILE = gearDataPaths.resolveDataRaw('abu_rod_whitelist_player_evidence.json');
const REPORT_FILE = gearDataPaths.resolveDataRaw('abu_rod_player_fields_refine_report.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_abu_rod_detail_groups.py');

const TARGET_FIELDS = ['player_environment', 'player_positioning', 'player_selling_points'];

const OLD_TEMPLATE_VALUES = {
  player_environment: new Set([
    '淡水 / bass',
    '淡水 / bass / 强力泛用',
    '淡水 / bass / 大饵强力',
    '淡水 / bass / BFS',
    '淡水 / bass / power fishing',
    '淡水 / bass / 重障碍',
    '冰钓',
  ]),
  player_positioning: new Set([
    '枪柄强力泛用',
    '直柄泛用',
    '枪柄泛用',
    '直柄精细轻饵',
    '直柄强力泛用',
    '卷阻饵 / 搜索',
    '枪柄精细轻饵',
    '精细轻饵',
    'Flipping / cover 打点',
    'Frog / 强障碍',
    '短竿专项',
    'BFS 卷阻饵 / 精细搜索',
  ]),
  player_selling_points: new Set([
    '适合中重型路亚和强控鱼场景 / 腰力和余量更强 / 比轻量泛用竿更适合覆盖障碍和大个体',
    '淡水泛用路亚场景适配 / 常规软硬饵和搜索覆盖较广',
    '轻饵与精细钓组更顺手 / 小型软饵和轻量硬饵操作更直接',
    '适合 crankbait 和 moving bait / 卷收节奏稳定 / 搜索型作钓更顺手',
    '面向大饵、大目标和高负荷控鱼 / 强度余量更足 / 适合重饵或大鱼场景筛选',
    '适合 reaction bait 和 power fishing 技法 / 搜索效率高 / 中重型控鱼更从容',
    '小饵抛投更轻松 / 精细操控直接 / 适合轻量硬饵和小型钓组',
    '适合重障碍打点 / 近距离投放更稳 / 强控鱼能力更突出',
    '适合 Frog 和草区障碍 / 控鱼力量更足 / 出鱼效率优先',
    '短竿冰钓设计 / 近距离控饵直接 / 手感反馈优先',
    '轻饵抛投和卷阻饵节奏兼顾 / 适合小型 moving bait、搜索和精细控线',
  ]),
};

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function lower(value) {
  return n(value).toLowerCase();
}

function splitRig(value) {
  return n(value).split('/').map(n).filter(Boolean);
}

function rigText(value, count = 3) {
  const rigs = splitRig(value).slice(0, count);
  if (rigs.length <= 1) return rigs[0] || '常用钓组';
  if (rigs.length === 2) return `${rigs[0]} 和 ${rigs[1]}`;
  return `${rigs[0]}、${rigs[1]}、${rigs[2]}`;
}

function firstRig(value) {
  return splitRig(value)[0] || '';
}

function lineText(row) {
  return n(row['Line Wt N F']).replace(/\s*-\s*/g, '-');
}

function lengthText(row) {
  return n(row['TOTAL LENGTH']) || n(row['Code Name']).split('/')[0]?.trim() || '';
}

function typeName(row) {
  return n(row.TYPE) === 'S' ? '直柄' : '枪柄';
}

function modelTier(model, row = {}) {
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

function isOldTemplate(row) {
  return TARGET_FIELDS.every((field) => OLD_TEMPLATE_VALUES[field].has(n(row[field])));
}

function equalsProfile(row, profile) {
  return TARGET_FIELDS.every((field) => n(row[field]) === n(profile[field]));
}

function equalsPlainFields(row, values) {
  if (!values) return false;
  return TARGET_FIELDS.every((field) => n(row[field]) === n(values[field]));
}

function isPriorScriptDraft(row) {
  const env = n(row.player_environment);
  const pos = n(row.player_positioning);
  const sell = n(row.player_selling_points);
  const primary = firstRig(row.recommended_rig_pairing).split(/\s+/)[0];
  return (
    /^(淡水 Bass|淡水大型掠食鱼|冰钓)/.test(env) &&
    /优先|主轴/.test(sell) &&
    (primary ? sell.includes(primary) : true) &&
    (/^\d|'|Ice|BFS|Frog|Flipping|Muskie|Big Bait|Swimbait|crankbait|reaction bait|Spinnerbait|Chatterbait|Neko|Down Shot|Heavy Texas|Texas/.test(pos))
  );
}

function profile(sourceType, confidence, category, player_environment, player_positioning, player_selling_points, note) {
  return { source_type: sourceType, confidence, category, player_environment, player_positioning, player_selling_points, source_note: note };
}

function routeContext(row, model) {
  const len = lengthText(row);
  const power = n(row.POWER);
  const action = n(row.Action);
  const line = lineText(row);
  const tier = modelTier(model, row);
  const reel = typeName(row);
  return { len, power, action, line, tier, reel };
}

function sellingSetup(row, model) {
  const { len, power, action, line, tier, reel } = routeContext(row, model);
  const specs = [len, power, action].filter(Boolean).join(' ');
  const lineSuffix = line ? `，${line}线组` : '';
  const tierReel = /[A-Za-z]$/.test(tier) ? `${tier} ${reel}` : `${tier}${reel}`;
  return `${tierReel}${specs ? ` ${specs}` : ''}${lineSuffix}`;
}

function withSetup(row, model, text) {
  return `${sellingSetup(row, model)}配置下，${text}`;
}

function refinePositioning(row, model, value) {
  const category = modelTier(model, row);
  if (n(row.SKU) === 'AVNDI27M') return `冰钓短竿 / ${value}`;
  if (category === '淡水泛用') return value;
  if (value.startsWith(category)) return value;
  return `${category} / ${value}`;
}

function enrichResolvedProfile(row, model, resolved) {
  return {
    ...resolved,
    player_positioning: refinePositioning(row, model, resolved.player_positioning),
  };
}

function resolvePlayerProfile(row, usageEvidence, model) {
  const category = usageEvidence?.category || 'fallback';
  const rig = n(row.recommended_rig_pairing);
  const first = firstRig(rig);
  const main = rigText(rig, 3);
  const { len, power, line, reel } = routeContext(row, model);
  const spec = [len, power].filter(Boolean).join(' ');
  const linePart = line ? `${line} 线组` : '细线';
  const sourceType = usageEvidence?.source_type === 'official_description'
    ? 'whitelist_context_plus_description_boundary'
    : usageEvidence?.source_type === 'official_sku_cue'
      ? 'whitelist_context_plus_sku_usage'
      : 'whitelist_context_plus_resolved_usage';
  const confidence = usageEvidence?.confidence || 'low';

  switch (category) {
    case 'ice':
      return profile(
        sourceType,
        confidence,
        category,
        `冰钓 / 冰洞垂直轻抽 / ${len || '短竿'}近距离控饵`,
        `${spec || '短竿'} Ice Jig 垂直操作`,
        withSetup(row, model, `${main} 是主轴，短竿在冰洞边控线更直接；轻抽、停顿和读轻口比远投覆盖更重要。`),
        'Ice description and resolved rig pairing constrain this row to ice jigging use.',
      );

    case 'flipping':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 草洞木桩与密集 cover / ${len}重障碍打点`,
        `${spec} Flipping / Punching 打点`,
        withSetup(row, model, `${main} 优先，适合近距离低弹道入障；${linePart}下刺鱼和把鱼拉离 cover 是主要价值。`),
        'Flipping/Pitching use is supported by description or SKU and refined by line/power.',
      );

    case 'frog':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 浮草草垫与浅水 cover / ${len}Frog`,
        `${spec} Frog / cover 强控鱼`,
        withSetup(row, model, `${main} 优先，草面开口后需要快速收线和压住鱼；兼顾 Punching 时更看重腰力和容错。`),
        'Frog/cover use is supported by model/SKU and resolved pairing.',
      );

    case 'beast_muskie':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水大型掠食鱼 / 大水面重型大饵 / ${len}高负荷抛投`,
        `${spec} Muskie / Pounder 大饵竿`,
        withSetup(row, model, `${main} 优先，重饵连续抛投和大鱼控线压力更高；${linePart}更适合高负荷控鱼。`),
        'Muskie/pounder-scale use is constrained to Beast muskie-scale variants.',
      );

    case 'beast_big_bait':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 大水面 Swimbait 搜索 / ${len}强力远投`,
        `${spec} Big Bait / Swimbait 强力搜索`,
        withSetup(row, model, `${main} 优先，适合开阔水域压水层慢收；竿身余量用于承受大饵回收阻力和中鱼后控鱼。`),
        'Beast big-bait route is supported by resolved pairing and heavy specs.',
      );

    case 'beast_swimbait':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 开阔水域中大型泳饵 / ${len}搜索`,
        `${spec} Swimbait 兼重型移动饵`,
        withSetup(row, model, `${main} 优先，适合大水面扇形搜索；比底操竿更看重回收稳定和中鱼后持续施压。`),
        'Beast swimbait route is refined by non-muskie line rating.',
      );

    case 'beast_light':
    case 'beast_spinning':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 开放水域小型软泳饵 / ${len}${reel}轻负荷搜索`,
        `${spec} 小型 Swimbait / Underspin`,
        withSetup(row, model, `${main} 优先，按${reel}和${linePart}控制饵重；适合慢收小泳饵和轻负荷连续搜索。`),
        'Beast spinning variants are constrained to smaller swimbaits by type and line rating.',
      );

    case 'bfs_winch':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 小河道与近岸浅中层 / ${len}BFS 卷阻搜索`,
        `${spec} BFS 小 crank / 小 minnow`,
        withSetup(row, model, `${main} 优先，轻量卷阻饵可以低弹道抛进窄标点；细线下还能切回 Neko / No Sinker。`),
        'BFS Winch route combines lightweight bait and crank/shad pairing.',
      );

    case 'bfs':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 小场地细线轻饵 / ${len}${reel} BFS`,
        `${spec} BFS 精细轻饵`,
        withSetup(row, model, `${main} 优先，低弹道轻抛和细线控线是核心；鱼口变轻时可在小硬饵与软饵间切换。`),
        'BFS route is supported by lightweight-bait description/SKU and pairing.',
      );

    case 'winch':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 开阔水域卷阻搜索 / ${len}Crankbait`,
        `${spec} crankbait / shad 专项`,
        withSetup(row, model, `${main} 优先，稳定卷收和挂鱼缓冲比快速刺鱼更关键；适合沿草边、石滩和浅中层水线搜索。`),
        'Winch/crankbait use is supported by description/SKU and resolved pairing.',
      );

    case 'delay':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 开放水域 reaction bait / ${len}抽停搜索`,
        `${spec} reaction bait / moving bait`,
        withSetup(row, model, `${main} 优先，抽停和连续卷收都要保持节奏；短咬时竿身缓冲能提高挂鱼稳定性。`),
        'Delay/reaction-bait route is supported by description and pairing.',
      );

    case 'power_fishing':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 草边硬物与开阔水搜索 / ${len}power fishing`,
        `${spec} Spinnerbait / Chatterbait 强搜索`,
        withSetup(row, model, `${main} 优先，适合快速覆盖水层后切 Texas 或 Jig 补打；移动饵和底操之间切换宽容。`),
        'Power-fishing route is supported by description and mixed pairing.',
      );

    case 'finesse':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 清水细线与轻压场 / ${len}精细软饵`,
        `${spec} finesse bait 精细操作`,
        withSetup(row, model, `${main} 优先，重点在控松线、读轻口和小幅度控饵；${linePart}下更适合细致控线。`),
        'Finesse route is supported by description and refined by power/line.',
      );

    case 'topwater':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 浅水窗口期与草边表层 / ${len}Topwater`,
        `${spec} topwater / jerkbait 搜索`,
        withSetup(row, model, `${main} 优先，适合走停、抽停和短距离精准抛投；窗口期过后可切回移动饵搜索。`),
        'Topwater cue is SKU-based and constrained by moderate action and pairing.',
      );

    case 'bladed_jig':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 草边与浑水搜索 / ${len}bladed jig`,
        `${spec} Chatterbait / Swim Jig`,
        withSetup(row, model, `${main} 优先，适合带震动感的中速搜索；通过草边和硬物边时需要稳定回收负荷。`),
        'Bladed-jig cue is SKU-based and constrained by pairing.',
      );

    case 'casting_heavy_moving':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 草边开阔水强搜索 / ${len}重型移动饵`,
        `${spec} 中重型 moving bait`,
        withSetup(row, model, `${main} 优先，${power} power 适合拉动阻力较大的移动饵；搜索效率和控鱼余量优先。`),
        'Heavy moderate casting specs and pairing support moving-bait use.',
      );

    case 'casting_heavy_bottom':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 重线 cover 与硬结构 / ${len}强力底操`,
        `${spec} Heavy Texas / Jig 底操`,
        withSetup(row, model, `${main} 优先，适合木桩、石堆、草边等需要贴底慢拖的点；重点是重线底操和贴障控鱼。`),
        'Heavy fast casting specs support bottom-contact and cover use, not big bait without cues.',
      );

    case 'casting_mh_bottom':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 岸边结构与草边 / ${len}中重型底操`,
        `${spec} Texas / Rubber Jig 泛用底操`,
        withSetup(row, model, `${main} 优先，适合落点打准后读底和碰障；需要搜索时可切 Chatterbait / Spinnerbait。`),
        'MH fast casting specs and mixed pairing support bottom-contact first, moving-bait second.',
      );

    case 'casting_medium_bottom':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 岸边硬物与轻 cover / ${len}轻中量底操`,
        `${spec} Texas / Free Rig 轻中量泛用`,
        withSetup(row, model, `${main} 优先，抛投负担较轻，适合岸边结构慢拖；鱼活性高时可换 Spinnerbait 搜索。`),
        'Medium fast casting specs support light-medium bottom-contact use.',
      );

    case 'casting_medium_moving':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 浅中层硬饵搜索 / ${len}移动饵泛用`,
        `${spec} 小 crank / minnow 搜索`,
        withSetup(row, model, `${main} 优先，适合沿岸线和硬物边做稳定卷收；软饵只作为鱼口慢时的补充。`),
        'Medium moderate casting specs support moving-bait use.',
      );

    case 'casting_light_finesse':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 小场地轻线打点 / ${len}${reel}精细轻饵`,
        `${spec} Neko / No Sinker 轻量打点`,
        withSetup(row, model, `${main} 优先，适合小标点低弹道抛投；小 crank 只作为补充搜索路线。`),
        'Light casting specs support finesse use with small hardbait as secondary route.',
      );

    case 'spinning_light_finesse':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 清水细线和轻压场 / ${len}直柄精细`,
        `${spec} Down Shot / Neko 精细`,
        withSetup(row, model, `${main} 优先，适合细线慢拖、轻抖和看线；微弱咬口反馈比强力控鱼更重要。`),
        'Light spinning specs support finesse soft-rig use.',
      );

    case 'spinning_heavy_finesse':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 开阔结构与稍重精细 / ${len}直柄强精细`,
        `${spec} Shaky Head / Free Rig 直柄`,
        withSetup(row, model, `${main} 优先，适合比常规精细更重的钓组；保留直柄控线优势，同时有更好的刺鱼余量。`),
        'Heavier spinning specs support heavier finesse presentations.',
      );

    case 'spinning_moving':
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 岸边小硬饵与轻量软饵 / ${len}直柄搜索`,
        `${spec} 小硬饵兼 Wacky`,
        withSetup(row, model, `${main} 优先，适合小 crank / shad 轻抛；鱼口变慢时可切 Wacky 或 Down Shot。`),
        'Moderate-fast spinning specs support small moving baits with finesse backup.',
      );

    case 'spinning_medium_finesse':
    default:
      return profile(
        sourceType,
        confidence,
        category,
        `淡水 Bass / 岸边轻量软饵和小硬饵 / ${len}直柄泛用`,
        `${spec} Neko / Wacky 精细泛用`,
        withSetup(row, model, `${main} 优先，适合细线控松线和轻量抛投；小 Minnow 作为搜索补充路线。`),
        'Medium spinning specs support finesse-first versatile use.',
      );
  }
}

function snapshotWithoutTargets(rows) {
  return rows.map((row) => {
    const snapshot = {};
    for (const [key, value] of Object.entries(row)) {
      if (!TARGET_FIELDS.includes(key)) snapshot[key] = value;
    }
    return snapshot;
  });
}

function uniqueStats(rows) {
  const result = {};
  for (const field of TARGET_FIELDS) {
    const counts = new Map();
    for (const row of rows) {
      const value = n(row[field]);
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
    const maxDuplicate = Math.max(0, ...counts.values());
    result[field] = {
      filled: rows.filter((row) => n(row[field])).length,
      unique: counts.size,
      max_duplicate: maxDuplicate,
      top_duplicates: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([value, count]) => ({ value, count })),
    };
  }
  return result;
}

function validate(rows) {
  const issues = [];
  for (const row of rows) {
    const combined = TARGET_FIELDS.map((field) => n(row[field])).join(' ');
    const rig = n(row.recommended_rig_pairing);
    const desc = n(row.Description);
    for (const field of TARGET_FIELDS) {
      if (!n(row[field])) issues.push({ id: row.id, sku: row.SKU, severity: 'error', code: 'missing_player_field', field });
    }
    if (/官网|白名单|tackledb|证据|source|official|推断/.test(combined)) {
      issues.push({ id: row.id, sku: row.SKU, severity: 'error', code: 'source_language_in_player_fields', value: combined });
    }
    if (/海水|船钓|SLSJ|木虾|岸投/.test(combined) && !/ice/i.test(`${rig} ${desc}`)) {
      issues.push({ id: row.id, sku: row.SKU, severity: 'error', code: 'freshwater_rod_written_as_saltwater', value: combined });
    }
    if (/Frog/i.test(rig) && !/Frog|草|cover|障碍/i.test(combined)) {
      issues.push({ id: row.id, sku: row.SKU, severity: 'error', code: 'frog_pairing_not_reflected', rig, value: combined });
    }
    if (/Crankbait|Shad Crank|Squarebill|Lipless/i.test(firstRig(rig)) && /底操专用|软饵专用|读底专用/.test(combined)) {
      issues.push({ id: row.id, sku: row.SKU, severity: 'error', code: 'hardbait_primary_written_as_bottom_only', rig, value: combined });
    }
    if (/Down Shot|Neko Rig|Wacky|Shaky Head|Free Rig|Texas Rig|Rubber Jig/i.test(firstRig(rig)) && /硬饵专用|crankbait 专项|卷阻专用/.test(combined)) {
      issues.push({ id: row.id, sku: row.SKU, severity: 'error', code: 'soft_primary_written_as_hardbait_only', rig, value: combined });
    }
    if (/大饵|Big Bait|Muskie/i.test(combined) && !/Big Bait|Muskie|Pounder|Swimbait|Soft Swimbait/i.test(rig)) {
      issues.push({ id: row.id, sku: row.SKU, severity: 'error', code: 'big_bait_player_field_without_pairing', rig, value: combined });
    }
    if (/性能优秀|适合多场景|覆盖较广|场景适配/.test(combined)) {
      issues.push({ id: row.id, sku: row.SKU, severity: 'error', code: 'generic_player_phrase_residual', value: combined });
    }
  }
  return issues;
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const usageReport = JSON.parse(fs.readFileSync(USAGE_REPORT_FILE, 'utf8'));
  const whitelistEvidence = JSON.parse(fs.readFileSync(WHITELIST_EVIDENCE_FILE, 'utf8'));
  const previousReport = fs.existsSync(REPORT_FILE)
    ? JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'))
    : null;
  const previousOutputById = new Map((previousReport?.evidence || []).map((item) => [n(item.id), item.after]));
  const rodModelById = new Map(rods.map((row) => [n(row.id), n(row.model)]));
  const usageById = new Map((usageReport.evidence || []).map((item) => [n(item.id), item]));
  const whitelistByRodId = new Map();
  for (const item of whitelistEvidence) {
    if (item.scope === 'rod') whitelistByRodId.set(n(item.id), item);
  }
  const beforeById = new Map(details.map((row) => [n(row.id), { ...row }]));
  const protectedRows = [];
  const evidence = [];

  for (const row of details) {
    const model = rodModelById.get(n(row.rod_id)) || '';
    const usage = usageById.get(n(row.id)) || {};
    const resolved = enrichResolvedProfile(row, model, resolvePlayerProfile(row, usage, model));
    const isTemplate = isOldTemplate(row);
    const isIdempotent = equalsProfile(row, resolved);
    const isPreviousScriptOutput = equalsPlainFields(row, previousOutputById.get(n(row.id)));
    const isScriptDraft = isPriorScriptDraft(row);
    const whitelist = whitelistByRodId.get(n(row.rod_id));

    evidence.push({
      id: row.id,
      rod_id: row.rod_id,
      model,
      sku: row.SKU,
      category: resolved.category,
      source_type: resolved.source_type,
      confidence: resolved.confidence,
      whitelist_context: whitelist ? {
        evidence_type: whitelist.evidence_type,
        confidence: whitelist.confidence,
        source_url: whitelist.source_url,
      } : null,
      recommended_rig_pairing: row.recommended_rig_pairing,
      before: TARGET_FIELDS.reduce((acc, field) => ({ ...acc, [field]: n(row[field]) }), {}),
      after: TARGET_FIELDS.reduce((acc, field) => ({ ...acc, [field]: resolved[field] }), {}),
      source_note: resolved.source_note,
    });

    if (!isTemplate && !isIdempotent && !isPreviousScriptOutput && !isScriptDraft) {
      protectedRows.push({
        id: row.id,
        rod_id: row.rod_id,
        model,
        sku: row.SKU,
        reason: 'Current player fields do not match prior generic templates or this script output.',
        current: TARGET_FIELDS.reduce((acc, field) => ({ ...acc, [field]: n(row[field]) }), {}),
        proposed: TARGET_FIELDS.reduce((acc, field) => ({ ...acc, [field]: resolved[field] }), {}),
      });
      continue;
    }

    for (const field of TARGET_FIELDS) row[field] = resolved[field];
  }

  const changedRows = [];
  for (const row of details) {
    const before = beforeById.get(n(row.id)) || {};
    const changes = {};
    for (const field of TARGET_FIELDS) {
      if (n(before[field]) !== n(row[field])) changes[field] = { before: n(before[field]), after: n(row[field]) };
    }
    if (Object.keys(changes).length) {
      changedRows.push({
        id: row.id,
        rod_id: row.rod_id,
        model: rodModelById.get(n(row.rod_id)) || '',
        sku: row.SKU,
        changes,
      });
    }
  }

  const protectedFieldsChanged = [];
  for (const row of details) {
    const before = beforeById.get(n(row.id)) || {};
    for (const [key, value] of Object.entries(row)) {
      if (TARGET_FIELDS.includes(key)) continue;
      if (n(before[key]) !== n(value)) protectedFieldsChanged.push({ id: row.id, field: key, before: before[key], after: value });
    }
  }
  if (protectedFieldsChanged.length) {
    throw new Error(`protected fields changed: ${JSON.stringify(protectedFieldsChanged.slice(0, 5))}`);
  }

  const stats = uniqueStats(details);
  const issues = validate(details);
  if (protectedRows.length) {
    for (const row of protectedRows) {
      issues.push({ id: row.id, sku: row.sku, severity: 'warning', code: 'protected_manual_like_row', reason: row.reason });
    }
  }
  const severityCounts = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});
  const sourceCounts = evidence.reduce((acc, item) => {
    acc[item.source_type] = (acc[item.source_type] || 0) + 1;
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
    schema: 'abu_rod_player_fields_refine_report_v1',
    source_xlsx: IMPORT_FILE,
    usage_report: USAGE_REPORT_FILE,
    whitelist_evidence: WHITELIST_EVIDENCE_FILE,
    updated_fields: TARGET_FIELDS,
    row_count: details.length,
    evaluated_row_count: details.length,
    rewritten_row_count: details.length - protectedRows.length,
    changed_row_count: changedRows.length,
    protected_row_count: protectedRows.length,
    coverage: Object.fromEntries(TARGET_FIELDS.map((field) => [field, `${details.filter((row) => n(row[field])).length}/${details.length}`])),
    unique_stats: stats,
    source_counts: sourceCounts,
    category_counts: categoryCounts,
    issue_count: issues.length,
    severity_counts: severityCounts,
    changed_rows: changedRows,
    protected_rows: protectedRows,
    evidence,
    issues,
  };
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log({
    updated: IMPORT_FILE,
    report: REPORT_FILE,
    rows: details.length,
    changed_rows: changedRows.length,
    protected_rows: protectedRows.length,
    coverage: report.coverage,
    unique: Object.fromEntries(Object.entries(stats).map(([field, item]) => [field, item.unique])),
    max_duplicate: Object.fromEntries(Object.entries(stats).map(([field, item]) => [field, item.max_duplicate])),
    source_counts: sourceCounts,
    severity_counts: severityCounts,
  });

  if (severityCounts.error) process.exit(1);
}

main();
