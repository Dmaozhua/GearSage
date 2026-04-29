const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('./node_modules/xlsx');
const { HEADERS } = require('./gear_export_schema');

const IMPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_import.xlsx');
const NORMALIZED_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rods_normalized.json');
const REPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_usage_fields_refine_report.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_abu_rod_detail_groups.py');

const BANNED_GENERIC = /\b(?:General Lure|Light Rig|Hardbait|Soft Bait)\b/i;
const HARDWARE_ONLY_HINT = /导环|维护成本|ROCS|maximized casting distance|耐用泛用|内衬|stainless|zirconium|titanium/i;

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function lower(value) {
  return n(value).toLowerCase();
}

function unique(items) {
  return [...new Set(items.map(n).filter(Boolean))];
}

function pairing(items) {
  return unique(items).join(' / ');
}

function parseLineMax(line) {
  const nums = n(line).match(/\d+(?:\.\d+)?/g) || [];
  return nums.length ? Math.max(...nums.map(Number)) : 0;
}

function powerText(row) {
  return n(row.POWER || row['Rod Power']).toUpperCase();
}

function powerBand(row) {
  const text = powerText(row);
  if (/XUL|SUL|UL|ML|\bL\b/.test(text)) return 'light';
  if (/XXH|XH|\bH\b|MH\+|MH/.test(text)) return 'heavy';
  return 'medium';
}

function actionFamily(row) {
  const text = lower(row.Action || row['Rod Action']);
  if (/moderate/.test(text)) return 'moving';
  if (/extra fast|fast/.test(text)) return 'bottom';
  return 'versatile';
}

function normalizedText(item) {
  return [item?.model, item?.description, ...(item?.features || [])].map(n).filter(Boolean).join(' ');
}

function buildModelIndex(normalized) {
  return new Map(normalized.map((item) => [n(item.model), item]));
}

function source(sourceType, sourceNote, confidence, category) {
  return { source_type: sourceType, source_note: sourceNote, confidence, category };
}

function resolveExplicit(model, row, item) {
  const sku = n(row.SKU).toUpperCase();
  const text = `${model} ${sku} ${row['Code Name']} ${row.Description} ${normalizedText(item)}`;
  const textLower = lower(text);
  const maxLine = parseLineMax(row['Line Wt N F']);
  const band = powerBand(row);
  const type = n(row.TYPE);

  if (/ice/.test(textLower)) {
    return {
      recommended_rig_pairing: pairing(['Ice Jig', 'Jigging Spoon', 'Jigging Minnow', 'Small Minnow']),
      guide_use_hint: '官网 Ice 短竿取向，优先垂直控 Ice Jig 和 Spoon，适合近距离轻抽停顿',
      ...source('official_description', 'Official model/description explicitly identifies Ice use.', 'high', 'ice'),
    };
  }

  if (/hunter shryock|flipping/.test(textLower) || /FLP/.test(sku)) {
    return {
      recommended_rig_pairing: pairing(['Flipping Jig', 'Punching', 'Heavy Texas', 'Creature Bait', 'Heavy Cover Jig']),
      guide_use_hint: '官网明确 flipping / pitching 进重障碍，优先 Flipping Jig 和 Punching，强调刺鱼和拔鱼',
      ...source('official_description', 'Official description/SKU identifies flipping or pitching cover techniques.', 'high', 'flipping'),
    };
  }

  if (/frog/.test(textLower) || /CF/.test(sku)) {
    return {
      recommended_rig_pairing: pairing(['Frog', 'Punching', 'Heavy Texas', 'Swim Jig', 'Heavy Cover Jig']),
      guide_use_hint: 'Frog / cover 取向，优先草区 Frog，兼顾 Punching 和 Heavy Texas 的强控鱼场景',
      ...source(/frog/.test(textLower) ? 'official_description' : 'official_sku_cue', 'Official model/SKU identifies frog or cover use.', 'high', 'frog'),
    };
  }

  if (/beast/.test(textLower)) {
    if (/BSTM/.test(sku) || maxLine >= 40) {
      return {
        recommended_rig_pairing: pairing(['Muskie Swimbait', 'Pounder Soft Swimbait', 'Big Bait', 'Bucktail']),
        guide_use_hint: '官网明确 muskie / pounder 大饵，优先大软泳饵和 Bucktail，适合高负荷抛投控鱼',
        ...source('official_description', 'Official Beast description references big baits, swimbaits, muskie, and pounder-style baits.', 'high', 'beast_muskie'),
      };
    }
    if (type === 'S' && (band === 'light' || maxLine <= 12)) {
      return {
        recommended_rig_pairing: pairing(['Small Swimbait', 'Soft Swimbait', 'Underspin', 'Swim Jig', 'Spinnerbait']),
        guide_use_hint: '官网 Beast swimbait 取向，该轻线规格优先小型软泳饵和 Swim Jig',
        ...source('official_description', 'Official Beast page supports swimbaits; line rating constrains this variant to smaller swimbaits.', 'medium', 'beast_light'),
      };
    }
    if (type === 'S') {
      return {
        recommended_rig_pairing: pairing(['Soft Swimbait', 'Small Swimbait', 'Underspin', 'Swim Jig', 'Spinnerbait']),
        guide_use_hint: '官网 Beast swimbait 取向，按 spinning 规格控制饵重，优先软泳饵和 Underspin',
        ...source('official_description', 'Official Beast page supports swimbaits; spinning specs limit the pairing to lighter swimbaits.', 'medium', 'beast_spinning'),
      };
    }
    if (/XH|XXH/.test(powerText(row)) || maxLine >= 30) {
      return {
        recommended_rig_pairing: pairing(['Big Bait', 'Large Soft Swimbait', 'Muskie Swimbait', 'Bucktail']),
        guide_use_hint: '官网明确 big baits / swimbaits，XH 规格优先大软泳饵和重型搜索饵',
        ...source('official_description', 'Official Beast description supports big baits and swimbaits; high power/line rating supports heavier presentations.', 'high', 'beast_big_bait'),
      };
    }
    return {
      recommended_rig_pairing: pairing(['Swimbait', 'Soft Swimbait', 'Big Bait', 'Heavy Spinnerbait', 'Swim Jig']),
      guide_use_hint: '官网明确 swimbait / big baits，优先中大型软泳饵，兼顾 Heavy Spinnerbait 和 Swim Jig',
      ...source('official_description', 'Official Beast description supports swimbaits and big baits.', 'high', 'beast_swimbait'),
    };
  }

  if (/bfs/.test(textLower) && (/winch/.test(textLower) || /BFCW/.test(sku))) {
    return {
      recommended_rig_pairing: pairing(['Small Crankbait', 'Shad Crank', 'Small Minnow', 'No Sinker', 'Neko Rig']),
      guide_use_hint: 'BFS Winch 取向，优先小型 crank / shad 卷阻饵，细线下兼顾 No Sinker 和 Neko',
      ...source('official_description', 'Official BFS Winch text combines lightweight bait and winch/moving-bait cues.', 'high', 'bfs_winch'),
    };
  }

  if (/bfs/.test(textLower) || /BFC|BFS/.test(sku)) {
    const spinning = type === 'S';
    return {
      recommended_rig_pairing: spinning
        ? pairing(['Neko Rig', 'Down Shot', 'No Sinker', 'Small Minnow', 'Small Crankbait'])
        : pairing(['Small Minnow', 'Shad', 'Small Crankbait', 'Neko Rig', 'No Sinker']),
      guide_use_hint: spinning
        ? '官网 BFS / lightweight bait 取向，优先 Neko 和 Down Shot，兼顾小 Minnow 轻抛'
        : '官网 BFS / lightweight bait 取向，优先小 Minnow 和 Shad，兼顾 Neko / No Sinker',
      ...source(/bfs/.test(textLower) ? 'official_description' : 'official_sku_cue', 'Official text or SKU supports bait-finesse lightweight lure use.', 'high', 'bfs'),
    };
  }

  if (/winch/.test(textLower) || /CW|W70|W71|W72|W76/.test(sku)) {
    const longHeavy = band === 'heavy' || parseLineMax(row['Line Wt N F']) >= 20;
    return {
      recommended_rig_pairing: longHeavy
        ? pairing(['Deep Crankbait', 'Crankbait', 'Lipless Crankbait', 'Chatterbait', 'Spinnerbait'])
        : pairing(['Crankbait', 'Shad Crank', 'Squarebill', 'Lipless Crankbait', 'Chatterbait']),
      guide_use_hint: longHeavy
        ? 'Winch / Moderate 取向服务 crankbait，优先中深潜 crank，兼顾 Chatterbait 等卷收搜索'
        : 'Winch 取向服务 crankbait，优先浅中层 Crankbait / Shad Crank，兼顾 Squarebill',
      ...source(/winch/.test(textLower) ? 'official_description' : 'official_sku_cue', 'Official Winch text or W/CW SKU supports crankbait and moving-bait use.', /winch/.test(textLower) ? 'high' : 'medium', 'winch'),
    };
  }

  if (/delay/.test(textLower)) {
    return {
      recommended_rig_pairing: pairing(['Crankbait', 'Jerkbait', 'Topwater Plug', 'Spinnerbait', 'Chatterbait']),
      guide_use_hint: '官网明确 reaction / moving baits 和 parabolic action，优先 Crankbait / Jerkbait 的挂鱼节奏',
      ...source('official_description', 'Official Delay description references reaction baits, moving baits, and parabolic action.', 'high', 'delay'),
    };
  }

  if (/finesse/.test(textLower)) {
    const heavy = band === 'heavy';
    return {
      recommended_rig_pairing: heavy
        ? pairing(['Shaky Head', 'Neko Rig', 'Wacky Rig', 'Small Swimbait', 'Down Shot'])
        : pairing(['Down Shot', 'Neko Rig', 'Wacky Rig', 'No Sinker', 'Small Jighead']),
      guide_use_hint: heavy
        ? '官网明确 finesse baits，MH 规格更适合 Shaky Head / Neko 等稍重精细钓组'
        : '官网明确 finesse baits，优先 Down Shot / Neko，适合细线慢节奏控饵',
      ...source('official_description', 'Official Finesse description supports lightweight finesse presentations.', 'high', 'finesse'),
    };
  }

  if (/ike signature power|power fishing/.test(textLower)) {
    return {
      recommended_rig_pairing: pairing(['Spinnerbait', 'Chatterbait', 'Swim Jig', 'Texas Rig', 'Rubber Jig']),
      guide_use_hint: '官网明确 power fishing / reaction baits，优先 Spinnerbait 和 Chatterbait，切换 Texas / Jig',
      ...source('official_description', 'Official Ike Power description references reaction baits and power fishing techniques.', 'high', 'power_fishing'),
    };
  }

  if (/TW/.test(sku)) {
    return {
      recommended_rig_pairing: pairing(['Topwater Plug', 'Jerkbait', 'Walking Bait', 'Spinnerbait', 'Chatterbait']),
      guide_use_hint: 'SKU TW 视作 topwater 线索，优先 Topwater / Walking Bait，兼顾 Jerkbait 和移动饵',
      ...source('official_sku_cue', 'SKU contains TW cue; no broader official page text was applied to other variants.', 'medium', 'topwater'),
    };
  }

  if (/BJ/.test(sku)) {
    return {
      recommended_rig_pairing: pairing(['Chatterbait', 'Swim Jig', 'Spinnerbait', 'Vibration', 'Lipless Crankbait']),
      guide_use_hint: 'SKU BJ 视作 bladed-jig 线索，优先 Chatterbait，兼顾 Swim Jig 和高频搜索',
      ...source('official_sku_cue', 'SKU contains BJ cue; treated as bladed-jig/moving-bait route.', 'medium', 'bladed_jig'),
    };
  }

  return null;
}

function resolveBySpecs(row) {
  const type = n(row.TYPE);
  const band = powerBand(row);
  const action = actionFamily(row);

  if (type === 'S') {
    if (band === 'light') {
      return {
        recommended_rig_pairing: pairing(['Down Shot', 'Neko Rig', 'Wacky Rig', 'No Sinker', 'Small Jighead']),
        guide_use_hint: '轻线精细作钓取向，优先 Down Shot / Neko，适合慢节奏底操和轻量软饵',
        ...source('official_spec_inference', 'Conservative inference from spinning type, light power, action, and line rating.', 'low', 'spinning_light_finesse'),
      };
    }
    if (band === 'heavy') {
      return {
        recommended_rig_pairing: pairing(['Shaky Head', 'Free Rig', 'Neko Rig', 'Small Swimbait', 'Swim Jig']),
        guide_use_hint: 'spinning MH 规格更适合稍重精细钓组，优先 Shaky Head / Free Rig，兼顾小泳饵',
        ...source('official_spec_inference', 'Conservative inference from spinning type, heavier power, action, and line rating.', 'low', 'spinning_heavy_finesse'),
      };
    }
    if (action === 'moving') {
      return {
        recommended_rig_pairing: pairing(['Small Crankbait', 'Shad', 'Minnow', 'Wacky Rig', 'Down Shot']),
        guide_use_hint: 'Moderate Fast spinning 适合小硬饵轻抛，优先 Small Crankbait / Shad，兼顾 Wacky',
        ...source('official_spec_inference', 'Conservative inference from spinning type and moderate-fast action.', 'low', 'spinning_moving'),
      };
    }
    return {
      recommended_rig_pairing: pairing(['Neko Rig', 'Wacky Rig', 'Down Shot', 'No Sinker', 'Small Minnow']),
      guide_use_hint: 'spinning M / Fast 取向偏精细泛用，优先 Neko / Wacky，兼顾小 Minnow 轻抛',
      ...source('official_spec_inference', 'Conservative inference from spinning type, medium power, fast action, and line rating.', 'low', 'spinning_medium_finesse'),
    };
  }

  if (type === 'C') {
    if (band === 'light') {
      return {
        recommended_rig_pairing: pairing(['Neko Rig', 'Down Shot', 'No Sinker', 'Small Rubber Jig', 'Small Crankbait']),
        guide_use_hint: 'casting 轻量规格适合细线轻饵，优先 Neko / No Sinker，兼顾小 crank 搜索',
        ...source('official_spec_inference', 'Conservative inference from casting type, light power, and line rating.', 'low', 'casting_light_finesse'),
      };
    }
    if (band === 'heavy') {
      if (action === 'moving') {
        return {
          recommended_rig_pairing: pairing(['Spinnerbait', 'Chatterbait', 'Swim Jig', 'Crankbait', 'Lipless Crankbait']),
          guide_use_hint: '较重 power 配 Moderate 调性，优先 Spinnerbait / Chatterbait 等移动饵，兼顾 crank',
          ...source('official_spec_inference', 'Conservative inference from casting type, heavy power, and moderate action.', 'low', 'casting_heavy_moving'),
        };
      }
      if (/\bH\b|XH|XXH/.test(powerText(row))) {
        return {
          recommended_rig_pairing: pairing(['Heavy Texas', 'Rubber Jig', 'Football Jig', 'Swim Jig', 'Carolina Rig']),
          guide_use_hint: 'H/XH Fast 规格偏重底操和控鱼，优先 Heavy Texas / Rubber Jig，适合重线障碍场景',
          ...source('official_spec_inference', 'Conservative inference from casting type, H/XH power, fast action, and line rating.', 'low', 'casting_heavy_bottom'),
        };
      }
      return {
        recommended_rig_pairing: pairing(['Texas Rig', 'Rubber Jig', 'Free Rig', 'Chatterbait', 'Spinnerbait']),
        guide_use_hint: 'MH Fast 规格偏底操泛用，优先 Texas / Rubber Jig，兼顾 Chatterbait 和 Spinnerbait',
        ...source('official_spec_inference', 'Conservative inference from casting type, MH power, fast action, and line rating.', 'low', 'casting_mh_bottom'),
      };
    }
    if (action === 'moving') {
      return {
        recommended_rig_pairing: pairing(['Crankbait', 'Shad', 'Minnow', 'Spinnerbait', 'Chatterbait']),
        guide_use_hint: 'Moderate / Moderate Fast 规格适合移动饵挂鱼，优先 Crankbait / Shad，兼顾 spinnerbait',
        ...source('official_spec_inference', 'Conservative inference from casting type, medium power, and moderate action.', 'low', 'casting_medium_moving'),
      };
    }
    return {
      recommended_rig_pairing: pairing(['Texas Rig', 'Free Rig', 'Rubber Jig', 'Spinnerbait', 'Chatterbait']),
      guide_use_hint: 'M Fast casting 适合轻中量底操，优先 Texas / Free Rig，必要时切换 Spinnerbait 搜索',
      ...source('official_spec_inference', 'Conservative inference from casting type, medium power, fast action, and line rating.', 'low', 'casting_medium_bottom'),
    };
  }

  return {
    recommended_rig_pairing: pairing(['Texas Rig', 'Free Rig', 'Neko Rig', 'Crankbait', 'Spinnerbait']),
    guide_use_hint: '规格信息有限，按淡水 bass 泛用保守处理，软饵底操与轻移动饵分场景切换',
    ...source('official_spec_inference', 'Fallback conservative inference from available official specs.', 'low', 'fallback'),
  };
}

function resolveUsage(model, row, item) {
  return resolveExplicit(model, row, item) || resolveBySpecs(row);
}

const SOFT_FIRST = /^(Down Shot|Neko Rig|Wacky Rig|No Sinker|Small Jighead|Shaky Head|Free Rig|Texas Rig|Heavy Texas|Rubber Jig|Football Jig|Flipping Jig|Punching|Creature Bait|Heavy Cover Jig)/i;
const HARD_FIRST = /^(Crankbait|Deep Crankbait|Small Crankbait|Shad|Shad Crank|Squarebill|Lipless Crankbait|Minnow|Small Minnow|Jerkbait|Topwater Plug|Walking Bait|Spinnerbait|Chatterbait|Vibration|Swim Jig|Swimbait|Soft Swimbait|Small Swimbait|Big Bait|Muskie Swimbait|Pounder Soft Swimbait|Bucktail|Ice Jig|Jigging Spoon|Jigging Minnow)/i;

function descMissingTerms(row) {
  const desc = lower(row.Description);
  const combined = lower(`${row.recommended_rig_pairing} ${row.guide_use_hint}`);
  const beastText = `${row.Description} ${row.SKU}`;
  const isBeastSpinning = /beast/i.test(beastText) && n(row.TYPE) === 'S';
  const isMuskieScaleBeast = /beast/i.test(beastText) && (/BSTM/i.test(n(row.SKU)) || parseLineMax(row['Line Wt N F']) >= 30);
  const checks = [
    ['Crankbait', /crankbait|crank/],
    ['Swimbait', /swimbait/],
    ['Big Bait', isBeastSpinning ? /$a/ : /big bait|big baits|pounder/],
    ['Muskie Swimbait', isMuskieScaleBeast ? /muskie/ : /$a/],
    ['Frog', /frog/],
    ['Flipping Jig', /flipping|pitching/],
    ['Down Shot', /down shot/],
    ['Neko Rig', /neko/],
    ['Ice Jig', /ice/],
    ['Reaction bait', /reaction bait|moving bait/],
  ];
  return checks.filter(([label, re]) => re.test(desc) && !combined.includes(label.toLowerCase().replace('reaction bait', 'reaction'))).map(([label]) => label);
}

function validate(rows) {
  const issues = [];
  for (const row of rows) {
    const pair = n(row.recommended_rig_pairing);
    const hint = n(row.guide_use_hint);
    if (!pair) issues.push({ id: row.id, sku: row.SKU, code: 'missing_recommended_rig_pairing', severity: 'error' });
    if (!hint) issues.push({ id: row.id, sku: row.SKU, code: 'missing_guide_use_hint', severity: 'error' });
    if (BANNED_GENERIC.test(pair)) issues.push({ id: row.id, sku: row.SKU, code: 'over_generic_pairing', severity: 'error', value: pair });
    if (HARDWARE_ONLY_HINT.test(hint)) issues.push({ id: row.id, sku: row.SKU, code: 'hardware_only_guide_use_hint', severity: 'error', value: hint });
    const missing = descMissingTerms(row);
    if (missing.length) issues.push({ id: row.id, sku: row.SKU, code: 'description_terms_missing', severity: 'warning', missing, value: pair, guide_use_hint: hint });

    if (SOFT_FIRST.test(pair) && /硬饵搜索优先|crankbait 优先|moving bait 优先/i.test(hint)) {
      issues.push({ id: row.id, sku: row.SKU, code: 'soft_primary_hard_hint', severity: 'error', value: pair, guide_use_hint: hint });
    }
    if (HARD_FIRST.test(pair) && /底操优先|软饵底操优先/i.test(hint)) {
      issues.push({ id: row.id, sku: row.SKU, code: 'hard_primary_soft_hint', severity: 'error', value: pair, guide_use_hint: hint });
    }
    if (/^Big Bait|^Muskie Swimbait/i.test(pair) && !/beast|muskie|pounder|big bait/i.test(`${row.Description} ${row.SKU}`)) {
      issues.push({ id: row.id, sku: row.SKU, code: 'big_bait_without_official_cue', severity: 'error', value: pair });
    }
    if (n(row.TYPE) === 'S' && parseLineMax(row['Line Wt N F']) <= 12 && /Big Bait|Muskie/i.test(pair)) {
      issues.push({ id: row.id, sku: row.SKU, code: 'light_spinning_big_bait_conflict', severity: 'error', value: pair });
    }
  }
  return issues;
}

function main() {
  const normalized = JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf8'));
  const modelIndex = buildModelIndex(normalized);
  const wb = XLSX.readFile(IMPORT_FILE);
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const modelByRodId = new Map(rods.map((row) => [row.id, n(row.model)]));
  const beforeById = new Map(details.map((row) => [row.id, { ...row }]));
  const evidence = [];

  for (const row of details) {
    const model = modelByRodId.get(row.rod_id) || '';
    const item = modelIndex.get(model);
    const resolved = resolveUsage(model, row, item);
    row.recommended_rig_pairing = resolved.recommended_rig_pairing;
    row.guide_use_hint = resolved.guide_use_hint;
    evidence.push({
      id: row.id,
      rod_id: row.rod_id,
      model,
      sku: row.SKU,
      guide_use_hint: resolved.guide_use_hint,
      recommended_rig_pairing: resolved.recommended_rig_pairing,
      source_type: resolved.source_type,
      confidence: resolved.confidence,
      category: resolved.category,
      source_note: resolved.source_note,
    });
  }

  const changedRows = [];
  for (const row of details) {
    const before = beforeById.get(row.id) || {};
    const changes = {};
    for (const field of ['guide_use_hint', 'recommended_rig_pairing']) {
      if (n(before[field]) !== n(row[field])) changes[field] = { before: n(before[field]), after: n(row[field]) };
    }
    if (Object.keys(changes).length) {
      changedRows.push({
        id: row.id,
        rod_id: row.rod_id,
        model: modelByRodId.get(row.rod_id) || '',
        sku: row.SKU,
        changes,
      });
    }
  }

  const protectedFieldsChanged = [];
  for (const row of details) {
    const before = beforeById.get(row.id) || {};
    for (const [key, value] of Object.entries(row)) {
      if (key === 'guide_use_hint' || key === 'recommended_rig_pairing') continue;
      if (n(before[key]) !== n(value)) protectedFieldsChanged.push({ id: row.id, field: key, before: before[key], after: value });
    }
  }

  if (protectedFieldsChanged.length) {
    throw new Error(`protected fields changed: ${JSON.stringify(protectedFieldsChanged.slice(0, 5))}`);
  }

  const issues = validate(details);
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
  const confidenceCounts = evidence.reduce((acc, item) => {
    acc[item.confidence] = (acc[item.confidence] || 0) + 1;
    return acc;
  }, {});

  wb.Sheets.rod = XLSX.utils.json_to_sheet(rods, { header: HEADERS.rodMaster });
  wb.Sheets.rod_detail = XLSX.utils.json_to_sheet(details, { header: HEADERS.rodDetail });
  XLSX.writeFile(wb, IMPORT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });

  const report = {
    schema: 'abu_rod_usage_fields_refine_report_v1',
    source_xlsx: IMPORT_FILE,
    normalized_file: NORMALIZED_FILE,
    updated_fields: ['guide_use_hint', 'recommended_rig_pairing'],
    row_count: details.length,
    evaluated_row_count: details.length,
    rewritten_row_count: details.length,
    changed_row_count: changedRows.length,
    coverage: {
      guide_use_hint: `${details.filter((row) => n(row.guide_use_hint)).length}/${details.length}`,
      recommended_rig_pairing: `${details.filter((row) => n(row.recommended_rig_pairing)).length}/${details.length}`,
    },
    source_counts: sourceCounts,
    category_counts: categoryCounts,
    confidence_counts: confidenceCounts,
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
    source_counts: sourceCounts,
    severity_counts: severityCounts,
  });

  if (severityCounts.error) process.exit(1);
}

main();
