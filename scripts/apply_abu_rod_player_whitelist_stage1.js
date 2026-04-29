const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('./node_modules/xlsx');
const { HEADERS } = require('./gear_export_schema');

const IMPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_import.xlsx');
const NORMALIZED_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rods_normalized.json');
const EVIDENCE_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_whitelist_player_evidence.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_abu_rod_detail_groups.py');

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function powerBand(power) {
  const text = n(power).toUpperCase();
  if (/XUL|SUL|UL|L|ML/.test(text)) return 'light';
  if (/XXH|XH|H|MH\+|MH/.test(text)) return 'heavy';
  return 'medium';
}

function normalizedTextFor(item) {
  return [item?.model, item?.description, ...(item?.features || [])].map(n).filter(Boolean).join(' ');
}

function normalizedIndex(normalized) {
  const byModel = new Map();
  const byModelSku = new Map();

  for (const item of normalized) {
    byModel.set(n(item.model), item);
    for (const variant of item.variants || []) {
      const keys = [variant.sku, variant.item_code, variant.title].map(n).filter(Boolean);
      for (const key of keys) byModelSku.set(`${n(item.model)}\u0000${key}`, { item, variant });
    }
  }

  return { byModel, byModelSku };
}

function findVariant(normalizedByModelSku, model, row) {
  for (const key of [row.SKU, row.AdminCode, row['Code Name']].map(n).filter(Boolean)) {
    const hit = normalizedByModelSku.get(`${n(model)}\u0000${key}`);
    if (hit) return hit.variant;
  }
  return null;
}

function guideMaterialFromText(text, specs = {}) {
  const source = `${text} ${n(specs['Guide Type'])}`.toLowerCase();
  if (/titanium/.test(source) && /nitride silicon/.test(source)) return 'Titanium alloy / nitride silicon guide train';
  if (/titanium/.test(source) && /zirconium|zirconia/.test(source)) return 'Titanium / Zirconium guide train';
  if (/stainless/.test(source) && /aluminum oxide/.test(source)) return 'Stainless steel / aluminum oxide guide train';
  if (/stainless/.test(source) && /zirconium|zirconia/.test(source)) return 'Stainless steel / Zirconium guide train';
  if (/stainless/.test(source)) return 'Stainless steel guide train';
  if (/titanium/.test(source)) return 'Titanium guide train';
  return '';
}

function guideHintFromText(text, specs = {}) {
  const source = `${text} ${n(specs['Guide Type'])}`.toLowerCase();
  const hints = [];

  if (/rocs|robotically optimized casting system/.test(source)) hints.push('轻饵远投和出线顺畅');
  if (/titanium/.test(source)) hints.push('轻量化导环有助于提升竿身平衡');
  if (/zirconium|zirconia|nitride silicon/.test(source)) hints.push('导环内衬更适合高频抛投和细线使用');
  if (/aluminum oxide/.test(source)) hints.push('耐用泛用，适合日常淡水路亚');
  if (/stainless/.test(source) && !hints.length) hints.push('耐用泛用，维护成本低');

  return [...new Set(hints)].slice(0, 2).join(' / ');
}

function gripTypeFromText(text) {
  const source = text.toLowerCase();
  if (/winn/.test(source)) return 'Winn Dri-Tac grip';
  if (/cork/.test(source) && /eva/.test(source)) return 'Cork / high density EVA grip';
  if (/eva and carbon split grip|eva .*carbon.*split grip/.test(source)) return 'EVA / carbon split grip';
  if (/carbon split grip/.test(source)) return 'Carbon split grip';
  if (/closed cell eva/.test(source)) return 'Closed Cell EVA grip';
  if (/high density eva/.test(source)) return 'High density EVA grip';
  if (/full grip/.test(source)) return 'Full grip';
  if (/eva split grip|split grip eva|comfortable split grip eva|eva handles|eva grips/.test(source)) return 'EVA split grip';
  if (/split grip handles|split grip/.test(source)) return 'Split grip';
  return '';
}

function reelSeatFromText(text) {
  const source = text.toLowerCase();
  if (/fuji/.test(source) && /reel seat/.test(source)) return 'Fuji reel seat';
  if (/ccrs|carbon constructed reel seat/.test(source)) return 'CCRS carbon constructed reel seat';
  if (/custom abu.*reel seat|abu garcia custom.*reel seat/.test(source)) return 'Abu Garcia custom ergonomic reel seat';
  if (/ergonomic abu.*reel seat/.test(source)) return 'Ergonomic Abu designed reel seat';
  if (/molded carbon fiber reel seat/.test(source)) return 'Molded carbon fiber reel seat';
  return '';
}

function supplementHardwareFields(row, model, index) {
  const item = index.byModel.get(n(model));
  const variant = findVariant(index.byModelSku, model, row);
  const specs = variant?.specs || {};
  const sourceText = normalizedTextFor(item);
  const combinedText = `${sourceText} ${Object.values(specs).map(n).join(' ')}`;
  const supportedFields = [];

  const guideMaterial = guideMaterialFromText(combinedText, specs);
  const guideLayout = /rocs|robotically optimized casting system/i.test(combinedText)
    ? ['ROCS guide train', guideMaterial].filter(Boolean).join(' / ')
    : guideMaterial;
  if (guideLayout) {
    supportedFields.push('guide_layout_type');
    if (!n(row.guide_layout_type)) {
      row.guide_layout_type = guideLayout;
    }
  }

  const guideHint = guideHintFromText(combinedText, specs);
  if (guideHint) {
    supportedFields.push('guide_use_hint');
    if (!n(row.guide_use_hint)) {
      row.guide_use_hint = guideHint;
    }
  }

  const gripType = gripTypeFromText(combinedText);
  if (gripType) {
    supportedFields.push('Grip Type');
    if (!n(row['Grip Type'])) {
      row['Grip Type'] = gripType;
    }
  }

  const reelSeat = reelSeatFromText(combinedText);
  if (reelSeat) {
    supportedFields.push('Reel Seat Position');
    if (!n(row['Reel Seat Position'])) {
      row['Reel Seat Position'] = reelSeat;
    }
  }

  return supportedFields;
}

function resolveMaster(row) {
  const model = n(row.model);
  const text = `${model} ${row.Description} ${row.main_selling_points}`.toLowerCase();

  if (/fantasista/i.test(model)) {
    return {
      player_positioning: 'bass / 淡水泛用 / 高阶',
      player_selling_points: '高阶轻量化竿身 / 感度和操作反馈突出 / 适合黑鲈精细到泛用技法',
      evidence: 'exact_whitelist',
      source_url: 'https://tackledb.uosoku.com/search?rod=Fantasista%20X',
      source_note: 'tackledb Fantasista X search results include バス釣り and ブラックバス records.',
    };
  }

  if (/ice/i.test(text)) {
    return {
      player_positioning: '冰钓 / 短竿专项',
      player_selling_points: '短竿冰钓设计 / 近距离控饵直接 / 低温环境下手感反馈清楚',
      evidence: 'official_model',
      source_url: row.source_url || '',
      source_note: 'Official model/description includes Ice.',
    };
  }

  if (/beast/i.test(text)) {
    return {
      player_positioning: '大饵 / 强力泛用',
      player_selling_points: '大饵和大鱼取向 / 适合 swimbait、重饵和高负荷控鱼 / 竿身余量更充足',
      evidence: 'official_model',
      source_url: '',
      source_note: 'Official Beast description explicitly references big baits, swimbaits, large powerful fish, and muskie.',
    };
  }

  if (/bfs/i.test(text) && /winch|delay/i.test(text)) {
    return {
      player_positioning: 'bass / BFS Winch / 精细卷阻饵',
      player_selling_points: '轻饵抛投和卷阻饵节奏兼顾 / 适合小型 moving bait、搜索和精细控线',
      evidence: 'official_model',
      source_url: '',
      source_note: 'Official model name combines BFS and Winch cues.',
    };
  }

  if (/bfs/i.test(text)) {
    return {
      player_positioning: 'bass / BFS / 精细轻饵',
      player_selling_points: '小饵抛投更轻松 / 精细操控直接 / 适合 BFS 和轻量硬饵玩法',
      evidence: 'official_model',
      source_url: '',
      source_note: 'Official model/description includes BFS and lightweight lure cues.',
    };
  }

  if (/frog/i.test(text)) {
    return {
      player_positioning: 'bass / Frog / 强障碍',
      player_selling_points: '面向 Frog 和草区障碍 / 起鱼力量更足 / 适合重覆盖环境控鱼',
      evidence: 'official_model',
      source_url: '',
      source_note: 'Official model name includes Frog.',
    };
  }

  if (/flipping|hunter shryock/i.test(model)) {
    return {
      player_positioning: 'bass / Flipping / 重障碍',
      player_selling_points: '适合 flipping、pitching 和 cover 打点 / 近距离投放稳定 / 强控鱼能力更突出',
      evidence: 'official_model',
      source_url: '',
      source_note: 'Official model/features include Flipping or technique-specific actions.',
    };
  }

  if (/winch|delay/i.test(text)) {
    return {
      player_positioning: 'bass / 卷阻饵 / 搜索',
      player_selling_points: '适合 crankbait 和 moving bait / 中低速卷收更稳定 / 搜索型作钓节奏更容易控制',
      evidence: 'official_model',
      source_url: '',
      source_note: 'Official model name indicates Winch/Delay technique family.',
    };
  }

  if (/ike signature power|power fishing/i.test(text)) {
    return {
      player_positioning: 'bass / Power fishing / 强力泛用',
      player_selling_points: '适合 reaction bait 和 power fishing 技法 / 搜索效率高 / 中重型控鱼更从容',
      evidence: 'official_model',
      source_url: '',
      source_note: 'Official Ike Power description references reaction baits and power fishing techniques.',
    };
  }

  if (/finesse/i.test(text)) {
    return {
      player_positioning: 'bass / 精细轻饵',
      player_selling_points: '轻饵和细线钓组更顺手 / 感度反馈清晰 / 适合精细钓组和慢节奏操作',
      evidence: 'official_model',
      source_url: '',
      source_note: 'Official model name includes Finesse.',
    };
  }

  if (/max|vendetta|vengeance|veritas|zenon|ike/i.test(text)) {
    return {
      player_positioning: 'bass / 淡水泛用',
      player_selling_points: '覆盖常规淡水路亚技法 / 软饵、硬饵和搜索场景都容易搭配 / 日常黑鲈作钓适用面广',
      evidence: 'official_plus_whitelist_context',
      source_url: 'https://tackledb.uosoku.com/search?rod=%E3%82%A2%E3%83%96%E3%82%AC%E3%83%AB%E3%82%B7%E3%82%A2',
      source_note: 'Generic Abu Garcia tackledb search includes many バス釣り/ブラックバス records, but this exact US series was not found.',
    };
  }

  return {
    player_positioning: '路亚泛用',
    player_selling_points: '适合常规路亚入门和泛用搭配 / 技法边界保守 / 方便按规格继续筛选',
    evidence: 'official_fallback',
    source_url: '',
    source_note: 'No exact whitelist match.',
  };
}

function resolveDetail(model, row) {
  const sku = n(row.SKU);
  const text = `${model} ${sku} ${row['Code Name']} ${row.Description}`.toLowerCase();
  const type = n(row.TYPE);
  const band = powerBand(row.POWER);

  if (/ice/i.test(text)) {
    return {
      player_environment: '冰钓',
      player_positioning: '短竿专项',
      player_selling_points: '短竿冰钓设计 / 近距离控饵直接 / 手感反馈优先',
    };
  }

  if (/frog/i.test(text)) {
    return {
      player_environment: '淡水 / bass / 重障碍',
      player_positioning: 'Frog / 强障碍',
      player_selling_points: '适合 Frog 和草区障碍 / 控鱼力量更足 / 出鱼效率优先',
    };
  }

  if (/flipping|hunter shryock/i.test(text)) {
    return {
      player_environment: '淡水 / bass / 重障碍',
      player_positioning: 'Flipping / cover 打点',
      player_selling_points: '适合重障碍打点 / 近距离投放更稳 / 强控鱼能力更突出',
    };
  }

  if (/beast/i.test(text)) {
    return {
      player_environment: '淡水 / bass / 大饵强力',
      player_positioning: type === 'S' ? '直柄强力泛用' : '枪柄强力泛用',
      player_selling_points: '面向大饵、大目标和高负荷控鱼 / 强度余量更足 / 适合重饵或大鱼场景筛选',
    };
  }

  if (/bfs/i.test(text) && /winch|delay/i.test(text)) {
    return {
      player_environment: '淡水 / bass / BFS',
      player_positioning: 'BFS 卷阻饵 / 精细搜索',
      player_selling_points: '轻饵抛投和卷阻饵节奏兼顾 / 适合小型 moving bait、搜索和精细控线',
    };
  }

  if (/bfs/i.test(text)) {
    return {
      player_environment: '淡水 / bass / BFS',
      player_positioning: '精细轻饵',
      player_selling_points: '小饵抛投更轻松 / 精细操控直接 / 适合轻量硬饵和小型钓组',
    };
  }

  if (/winch|delay/i.test(text)) {
    return {
      player_environment: '淡水 / bass',
      player_positioning: '卷阻饵 / 搜索',
      player_selling_points: '适合 crankbait 和 moving bait / 卷收节奏稳定 / 搜索型作钓更顺手',
    };
  }

  if (/ike signature power|power fishing/i.test(text)) {
    return {
      player_environment: '淡水 / bass / power fishing',
      player_positioning: type === 'S' ? '直柄强力泛用' : '枪柄强力泛用',
      player_selling_points: '适合 reaction bait 和 power fishing 技法 / 搜索效率高 / 中重型控鱼更从容',
    };
  }

  if (/finesse/i.test(text) || band === 'light') {
    return {
      player_environment: '淡水 / bass',
      player_positioning: type === 'S' ? '直柄精细轻饵' : '枪柄精细轻饵',
      player_selling_points: '轻饵与精细钓组更顺手 / 小型软饵和轻量硬饵操作更直接',
    };
  }

  if (band === 'heavy') {
    return {
      player_environment: '淡水 / bass / 强力泛用',
      player_positioning: type === 'S' ? '直柄强力泛用' : '枪柄强力泛用',
      player_selling_points: '适合中重型路亚和强控鱼场景 / 腰力和余量更强 / 比轻量泛用竿更适合覆盖障碍和大个体',
    };
  }

  return {
    player_environment: '淡水 / bass',
    player_positioning: type === 'S' ? '直柄泛用' : '枪柄泛用',
    player_selling_points: '淡水泛用路亚场景适配 / 常规软硬饵和搜索覆盖较广',
  };
}

function resolveDetailEvidence(model, row) {
  const text = `${model} ${row.SKU} ${row['Code Name']} ${row.Description}`.toLowerCase();

  if (/fantasista/i.test(model)) {
    return {
      confidence: 'high',
      evidence_type: 'exact_whitelist',
      source_url: 'https://tackledb.uosoku.com/search?rod=Fantasista%20X',
      source_note: 'tackledb Fantasista X search results include バス釣り and ブラックバス records.',
    };
  }

  if (/ice|frog|flipping|hunter shryock|bfs|winch|delay|finesse|beast|ike signature power|power fishing/i.test(text)) {
    return {
      confidence: 'medium',
      evidence_type: 'official_model',
      source_url: '',
      source_note: 'Official model/description cues support the applied player fields.',
    };
  }

  if (['light', 'heavy'].includes(powerBand(row.POWER))) {
    return {
      confidence: 'low',
      evidence_type: 'official_spec_inference',
      source_url: '',
      source_note: 'Derived from official type/power/line specs; no exact whitelist match.',
    };
  }

  return {
    confidence: 'low',
    evidence_type: 'official_plus_whitelist_context',
    source_url: 'https://tackledb.uosoku.com/search?rod=%E3%82%A2%E3%83%96%E3%82%AC%E3%83%AB%E3%82%B7%E3%82%A2',
    source_note: 'Generic Abu Garcia tackledb context supports bass/freshwater use, but this exact series was not found.',
  };
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const normalized = JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf8'));
  const index = normalizedIndex(normalized);
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const evidence = [];

  const masterById = new Map();
  for (const row of rods) {
    const resolved = resolveMaster(row);
    row.player_positioning = resolved.player_positioning;
    row.player_selling_points = resolved.player_selling_points;
    masterById.set(row.id, { model: n(row.model), resolved });
    evidence.push({
      scope: 'rod',
      id: row.id,
      model: row.model,
      confidence: resolved.evidence === 'exact_whitelist' ? 'high' : resolved.evidence === 'official_model' ? 'medium' : 'low',
      evidence_type: resolved.evidence,
      source_url: resolved.source_url,
      source_note: resolved.source_note,
      applied_fields: ['player_positioning', 'player_selling_points'],
    });
  }

  for (const row of details) {
    const master = masterById.get(row.rod_id) || { model: '' };
    const resolved = resolveDetail(master.model, row);
    const evidenceInfo = resolveDetailEvidence(master.model, row);
    const hardwareUpdates = supplementHardwareFields(row, master.model, index);
    row.player_environment = resolved.player_environment;
    row.player_positioning = resolved.player_positioning;
    row.player_selling_points = resolved.player_selling_points;
    evidence.push({
      scope: 'rod_detail',
      id: row.id,
      rod_id: row.rod_id,
      model: master.model,
      sku: row.SKU,
      confidence: evidenceInfo.confidence,
      evidence_type: evidenceInfo.evidence_type,
      source_url: evidenceInfo.source_url,
      source_note: evidenceInfo.source_note,
      applied_fields: ['player_environment', 'player_positioning', 'player_selling_points', ...hardwareUpdates],
    });
  }

  wb.Sheets.rod = XLSX.utils.json_to_sheet(rods, { header: HEADERS.rodMaster });
  wb.Sheets.rod_detail = XLSX.utils.json_to_sheet(details, { header: HEADERS.rodDetail });
  XLSX.writeFile(wb, IMPORT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });
  fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2), 'utf8');

  console.log(`[apply_abu_rod_player_whitelist_stage1] updated masters=${rods.length} details=${details.length}`);
  console.log(`[apply_abu_rod_player_whitelist_stage1] wrote ${EVIDENCE_FILE}`);
}

main();
