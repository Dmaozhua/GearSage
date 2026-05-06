const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { HEADERS, SHEET_NAMES } = require('./gear_export_schema');
const { runMegabassRodDetailGroupShading } = require('./run_megabass_rod_detail_group_shading');
const gearDataPaths = require('./gear_data_paths');

const RAW_FILE = gearDataPaths.resolveDataRaw('megabass_rod_raw.json');
const XLSX_FILE = gearDataPaths.resolveDataRaw('megabass_rod_import.xlsx');

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function has(value) {
  return n(value).length > 0;
}

function lower(value) {
  return n(value).toLowerCase();
}

function cleanPrice(value) {
  const match = n(value).match(/([\d,]+)\s*円/);
  if (match) return match[1].replace(/,/g, '');
  return n(value).replace(/[^\d]/g, '');
}

function formatYen(value) {
  const num = Number(String(value || '').replace(/[^\d]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return '';
  return `¥${num.toLocaleString('en-US')}`;
}

function parseOzNumber(token) {
  const text = n(token).replace(/oz\.?/i, '');
  if (!text) return null;

  const mixed = text.match(/^(\d+)\.(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (denominator) return whole + numerator / denominator;
  }

  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator) return numerator / denominator;
  }

  const decimal = Number(text);
  return Number.isFinite(decimal) ? decimal : null;
}

function formatGram(value) {
  const rounded = Math.round(value * 28.3495 * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '');
}

function convertOzSpecToGramSpec(value) {
  const original = n(value);
  if (!/oz/i.test(original)) return '';
  const stripped = original
    .replace(/oz\.?/ig, '')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = stripped.split(/\s*(?:-|～|~|〜|–|—)\s*/).filter(Boolean);
  if (parts.length === 0) return '';

  const grams = [];
  for (const part of parts) {
    const parsed = parseOzNumber(part);
    if (parsed == null) return '';
    grams.push(formatGram(parsed));
  }

  if (grams.length === 1) return `${grams[0]}g`;
  if (grams.length === 2) return `${grams[0]}-${grams[1]}g`;
  return '';
}

function priceRange(rows) {
  const prices = rows
    .map((row) => Number(String(row['Market Reference Price'] || '').replace(/[^\d]/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (prices.length === 0) return '';
  const min = prices[0];
  const max = prices[prices.length - 1];
  return min === max ? formatYen(min) : `${formatYen(min)}-${formatYen(max)}`;
}

function firstSentence(value) {
  const text = n(value);
  if (!text) return '';
  const parts = text.split(/(?<=[.!?。！？])\s+/);
  return parts.slice(0, 2).join(' ').slice(0, 360);
}

function isTroutSeries(model) {
  return /greathunting|great hunting/i.test(n(model));
}

function seriesSeed(model) {
  const key = lower(model);
  if (/arms super leggera spinning/.test(key)) {
    return {
      series_positioning: '高端直柄精细',
      player_positioning: '鲈鱼精细与轻量操控',
      player_selling_points: 'ARMS 高端空白 / 直柄精细 / 轻量操控与感度',
    };
  }
  if (/arms super leggera/.test(key)) {
    return {
      series_positioning: '高端旗舰鲈鱼竿',
      player_positioning: '鲈鱼强力与高端泛用',
      player_selling_points: '高端定制血统 / 强力覆盖面 / 大饵到搜索饵兼顾',
    };
  }
  if (/destroyer t\.s/.test(key)) {
    return {
      series_positioning: '巨物与大饵专项',
      player_positioning: '大饵 / 强力 / 巨物',
      player_selling_points: '重负荷空白 / 大饵抛投 / 强障碍和巨鲈控制',
    };
  }
  if (/brand new destroyer/.test(key)) {
    return {
      series_positioning: '高端鲈钓主力全系',
      player_positioning: '鲈鱼泛用与专项覆盖',
      player_selling_points: 'Destroyer 主线 / 技法覆盖广 / 精细到强力型号齐全',
    };
  }
  if (/orochi x10/.test(key)) {
    return {
      series_positioning: '高端技术专项',
      player_positioning: '鲈鱼精细与专项技法',
      player_selling_points: 'X10 高感度空白 / 技法分工细 / 轻量和控饵表现突出',
    };
  }
  if (/evoluzion/.test(key)) {
    return {
      series_positioning: '高端复合材料鲈钓',
      player_positioning: '鲈鱼高感度泛用',
      player_selling_points: '钛纤维复合 / 高感度 / 泛用和专项型号并存',
    };
  }
  if (/levante/.test(key)) {
    return {
      series_positioning: '中高端鲈钓泛用',
      player_positioning: '鲈鱼主力泛用',
      player_selling_points: '覆盖常见鲈钓技法 / 价格更亲近 / 适合主力装备搭配',
    };
  }
  if (/valkyrie world expedition/.test(key)) {
    return {
      series_positioning: '多节远征强力',
      player_positioning: '旅行便携 / 强力泛用',
      player_selling_points: '多节便携 / 远征场景 / 中重型路亚和大鱼控制',
    };
  }
  if (/triza/.test(key)) {
    return {
      series_positioning: '三节便携鲈鱼竿',
      player_positioning: '便携鲈钓 / 多场景',
      player_selling_points: '三节结构 / 移动钓行友好 / 精细到强力型号覆盖',
    };
  }
  if (/pagani trad/.test(key)) {
    return {
      series_positioning: '复古调性与轻量专项',
      player_positioning: '复古控饵 / 轻量技法',
      player_selling_points: '传统调性 / 小型硬饵和精细操控 / 收藏与实钓兼顾',
    };
  }
  if (/tracking buddy/.test(key)) {
    return {
      series_positioning: '鳟鱼拖钓专项',
      player_positioning: '鳟鱼 / 湖泊拖钓',
      player_selling_points: 'Lead core / Downrigger 场景 / 湖泊大型鳟鱼专项',
    };
  }
  if (/huntsman/.test(key)) {
    return {
      series_positioning: '高端溪流鳟鱼',
      player_positioning: '鳟鱼 / 溪流 / 山岳',
      player_selling_points: '便携溪流 / 精准抛投 / 山岳钓行友好',
    };
  }
  if (/x-glass/.test(key)) {
    return {
      series_positioning: '鳟鱼玻璃复合调性',
      player_positioning: '鳟鱼 / 溪流 / 湖泊',
      player_selling_points: '玻璃复合调性 / 小型硬饵控饵 / 鳟鱼咬口包容性',
    };
  }
  if (/mountain stream/.test(key)) {
    return {
      series_positioning: '山溪鳟鱼便携',
      player_positioning: '鳟鱼 / 山溪 / 便携',
      player_selling_points: '短尺多节 / 山溪移动 / 小型米诺和轻量饵友好',
    };
  }
  if (/river&lake|river lake/.test(key)) {
    return {
      series_positioning: '本流湖泊鳟鱼',
      player_positioning: '鳟鱼 / 本流 / 湖泊',
      player_selling_points: '远投和控线 / 本流湖泊覆盖 / 大型鳟鱼应对',
    };
  }
  if (isTroutSeries(model)) {
    return {
      series_positioning: '鳟鱼专项',
      player_positioning: '鳟鱼 / 溪流 / 湖泊',
      player_selling_points: '鳟鱼场景 / 小型硬饵和 spoon / 控饵与控线',
    };
  }
  return {
    series_positioning: '鲈钓泛用',
    player_positioning: '鲈鱼泛用',
    player_selling_points: '淡水鲈鱼 / 常见路亚技法 / 按型号细分搭配',
  };
}

function inferPower(row, raw) {
  const sku = n(row.SKU || raw?.model_name).toUpperCase();
  const direct = sku.match(/^F(\d{1,2}(?:\.1\/2)?)(?:ST)?(?:-|[A-Z])/i);
  if (direct) return `F${direct[1]}`;

  const asl = sku.match(/^ASL\d{3}(\d)(?:X|XS|XG)/);
  if (asl) return `F${asl[1]}`;

  const valkyrie = sku.match(/(?:^|[-])((?:XXH|XH|MH|ML|UL|H|M|L))(?:-|$)/);
  if (valkyrie) return valkyrie[1];

  const trout = sku.match(/\d(?:-\d)?(XUL|SUL|UL|ML|MH|L|M|H)S?$/);
  if (trout) return trout[1];

  const suffix = sku.match(/(XXH|XH|MH|ML|UL|H|M|L)(?:-\d+)?$/);
  if (suffix) return suffix[1];

  if (/^TS\d{2,3}(?:X\+?|XS?)$/.test(sku)) return '';

  return n(row.POWER);
}

function inferType(row, raw) {
  const sku = n(row.SKU || raw?.model_name).toUpperCase();
  const text = `${sku} ${n(row.Description)} ${n(row['Code Name'])}`.toUpperCase();
  if (isTroutSeries(raw?.series_name || '') || /^GH/.test(sku)) return 'S';
  if (/SPINNING|DROP[- ]?SHOT|FINESSE SPINNING|(^|-)VKS|XS(?:\s|$|-)|XTS|ULS|MEDUSA|KIRISAME KAMEYAMA/.test(text)) return 'S';
  return 'C';
}

function detailClassification(row, raw, masterModel) {
  const type = inferType(row, raw);
  const text = lower(`${masterModel} ${row.SKU} ${row['Code Name']} ${row.Description} ${row['LURE WEIGHT']}`);
  const trout = isTroutSeries(masterModel) || raw?.category === 'Trout Rod';
  const travel = /triza|valkyrie world expedition|multi-piece|3-piece|4-piece|便携|travel|expedition/.test(text);

  if (trout) {
    if (/downrigger|lead core|tracking buddy/.test(text)) {
      return {
        player_environment: '鳟鱼 / 湖泊拖钓',
        player_positioning: '专项技法',
        player_selling_points: 'Lead core / Downrigger / 湖泊大型鳟鱼',
        guide_use_hint: '湖泊拖钓：让 lead core / downrigger 线组出线更稳定，并能承接长时间拖曳负荷。',
      };
    }
    if (/lake|long-distance|long distance|本流|湖|river/.test(text)) {
      return {
        player_environment: '鳟鱼 / 本流 / 湖泊',
        player_positioning: '精细或专项',
        player_selling_points: `${travel ? '多节便携 / ' : ''}远投控线 / 米诺与 spoon / 大型鳟鱼`,
        guide_use_hint: /long-distance|long distance|湖|lake/.test(text)
          ? '本流湖泊远投：小型硬饵和 spoon 出线更顺，线弧更稳，适合漂流、搜索和远距离控鱼。'
          : '鳟鱼专项：强化小型硬饵控线和咬口传递，适合溪流、本流里的精准操作。',
      };
    }
    return {
      player_environment: '鳟鱼 / 溪流 / 管钓',
      player_positioning: '精细或专项',
      player_selling_points: `${travel ? '多节便携 / ' : ''}小型硬饵 / 精准抛投 / 溪流控饵`,
      guide_use_hint: '溪流鳟鱼精细：小型米诺和轻饵更容易顺畅出线，细线控线和竿尖信号也更清楚。',
    };
  }

  if (/frog|frogging|punching|heavy mat|mat frogging/.test(text)) {
    return {
      player_environment: '淡水鲈鱼 / 重障碍',
      player_positioning: '重障碍 / Frog',
      player_selling_points: '重障碍穿透 / Frog 或 punching / 强力控鱼',
      guide_use_hint: '重障碍/Frog：粗线通过更稳定，导环能承受高负荷控鱼，适合把鱼从草洞或障碍中拉出来。',
    };
  }
  if (/finesse|drop[- ]?shot|dropshot|neko|no-sinker|small rubber|light rig|micro|solid tip|ultra[- ]?finesse|mushi|bug|bait finesse/.test(text)) {
    return {
      player_environment: '淡水鲈鱼 / 精细',
      player_positioning: type === 'S' ? '精细轻饵' : 'Bait finesse / 轻量枪柄',
      player_selling_points: `${travel ? '便携 / ' : ''}轻量钓组 / 高感度 / 短咬口应对`,
      guide_use_hint: '轻线精细：小饵低负荷出线更顺，竿尖信号和细线控线更直接，便于判断短咬口和触底。',
    };
  }
  if (/big ?bait|swimbait|giant bait|magnum|umbrella|i-slide|super heavyweight|200g|30-35|40 cm/.test(text)) {
    return {
      player_environment: '淡水鲈鱼 / 大饵 / 重障碍',
      player_positioning: '大饵 / 强力',
      player_selling_points: `${travel ? '多节便携 / ' : ''}大饵抛投 / 强力控鱼 / 重负荷应用`,
      guide_use_hint: '大饵强力：大饵抛投时出线更稳，粗线通过更可靠，也能支撑高负荷搏鱼。',
    };
  }
  if (/crank|spinnerbait|vibration|jerkbait|topwater|fast-moving|search|plug|shallow/.test(text)) {
    return {
      player_environment: '淡水鲈鱼 / 搜索饵',
      player_positioning: /crank|glass/.test(text) ? '卷阻饵 / 搜索' : '硬饵搜索 / 泛用',
      player_selling_points: `${travel ? '便携 / ' : ''}硬饵操控 / 搜索效率 / 抛投稳定`,
      guide_use_hint: /long distance|distance/.test(text)
        ? '远投搜索：反复抛投时出线顺畅、线弧稳定，利于 spinnerbait、crank、jerkbait 维持搜索节奏。'
        : '硬饵搜索：抛投后线弧更稳定，平收控线更容易，利于维持泳层、节奏和连续搜索效率。',
    };
  }
  if (/heavy cover|cover hacking|impregnable cover|light-cover|cover situations/.test(text)) {
    return {
      player_environment: '淡水鲈鱼 / 障碍',
      player_positioning: '强力泛用 / 障碍',
      player_selling_points: '障碍区应用 / 强力控鱼 / jig 或软饵适配',
      guide_use_hint: '障碍区强力：中粗线出线更稳，受力时控线更可靠，适合 jig、Texas 或软饵贴障碍操作。',
    };
  }
  return {
    player_environment: '淡水鲈鱼',
    player_positioning: type === 'S' ? '直柄泛用' : '枪柄泛用',
    player_selling_points: `${travel ? '便携 / ' : ''}常规鲈钓 / 按型号覆盖不同技法 / 泛用搭配`,
    guide_use_hint: /long distance|distance|shore/.test(text)
      ? '泛用远投：不同线径都能保持顺畅出线和远距离控线，适合岸边或开阔水面反复抛投。'
      : '泛用鲈钓：兼容不同线径和路亚重量，方便在软饵、硬饵和移动饵之间切换。',
  };
}

function inferGuideLayout(row) {
  const text = lower(`${row.Description} ${row['Extra Spec 1']} ${row['Extra Spec 2']}`);
  if (/double-footed guide|double foot|double-wrapped/.test(text)) {
    return '双脚导环/双线绑扎：提升高负荷抛投和搏鱼时的导环支撑，适合大饵、粗线或重障碍场景。';
  }
  if (/k-guide|original guide setting/.test(text)) {
    return '高框 K 系/防缠导环：减少出线缠绕，提升轻线远投、控线和连续抛投稳定性。';
  }
  return '';
}

function buildRawIndexes(rawRows) {
  const bySku = new Map();
  const bySeries = new Map();
  for (const item of rawRows) {
    bySku.set(n(item.model_name).toUpperCase(), item);
    const key = n(item.series_name);
    if (!bySeries.has(key)) bySeries.set(key, []);
    bySeries.get(key).push(item);
  }
  return { bySku, bySeries };
}

function alignHeaders(rows, headers) {
  return rows.map((row) => {
    const out = {};
    for (const header of headers) out[header] = row[header] ?? '';
    for (const [key, value] of Object.entries(row)) {
      if (!(key in out)) out[key] = value;
    }
    return out;
  });
}

function main() {
  const rawRows = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const { bySku, bySeries } = buildRawIndexes(rawRows);
  const wb = xlsx.readFile(XLSX_FILE, { cellDates: false });
  const rodRows = xlsx.utils.sheet_to_json(wb.Sheets[SHEET_NAMES.rod], { defval: '' });
  const detailRows = xlsx.utils.sheet_to_json(wb.Sheets[SHEET_NAMES.rodDetail], { defval: '' });

  const detailsByRod = new Map();
  for (const row of detailRows) {
    const rodId = n(row.rod_id);
    if (!detailsByRod.has(rodId)) detailsByRod.set(rodId, []);
    detailsByRod.get(rodId).push(row);
  }

  let masterUpdates = 0;
  let detailUpdates = 0;

  for (const row of detailRows) {
    const raw = bySku.get(n(row.SKU).toUpperCase());
    const before = JSON.stringify(row);
    const specs = raw?.specs || {};

    const inferredPower = inferPower(row, raw);
    if (!has(row.POWER) || (/^F\d{1,2}\.1$/.test(n(row.POWER)) && /F\d{1,2}\.1\/2/i.test(n(row.SKU)))) {
      row.POWER = inferredPower;
    }
    if (!has(row.TYPE)) row.TYPE = inferType(row, raw);
    const lureWeight = n(row['LURE WEIGHT']);
    const lureWeightOz = n(row['LURE WEIGHT (oz)']);
    if (!has(row['LURE WEIGHT (oz)']) && /oz/i.test(lureWeight)) {
      row['LURE WEIGHT (oz)'] = lureWeight;
    }
    if (!/g\b/i.test(lureWeight)) {
      const gramSpec = convertOzSpecToGramSpec(lureWeightOz || lureWeight);
      if (gramSpec) row['LURE WEIGHT'] = gramSpec;
    }
    if (!has(row['Market Reference Price']) && has(specs.Price)) {
      row['Market Reference Price'] = cleanPrice(specs.Price);
    }
    if (!has(row.Description)) {
      row.Description = n(specs.Subname || row['Code Name']);
    }
    if (!has(row['Code Name']) && has(specs.Subname)) {
      row['Code Name'] = specs.Subname;
    }

    const master = rodRows.find((candidate) => n(candidate.id) === n(row.rod_id)) || {};
    const inferred = detailClassification(row, raw, master.model || raw?.series_name || '');
    for (const field of ['player_environment', 'player_positioning', 'player_selling_points', 'guide_use_hint']) {
      row[field] = inferred[field] || '';
    }
    if (!has(row.guide_layout_type) || /^(special|standard|micro|small_guide|large_guide|spiral)$/i.test(n(row.guide_layout_type))) {
      row.guide_layout_type = inferGuideLayout(row);
    }

    if (JSON.stringify(row) !== before) detailUpdates += 1;
  }

  for (const row of rodRows) {
    const before = JSON.stringify(row);
    const seed = seriesSeed(row.model);
    const seriesItems = bySeries.get(n(row.model)) || [];
    const desc = seriesItems.find((item) => has(item.series_description))?.series_description || row.Description;

    if (!has(row.series_positioning)) row.series_positioning = seed.series_positioning;
    if (!has(row.main_selling_points)) row.main_selling_points = firstSentence(desc);
    if (!has(row.official_reference_price)) row.official_reference_price = priceRange(detailsByRod.get(n(row.id)) || []);
    if (!has(row.market_status)) row.market_status = '官网展示';
    if (!has(row.player_positioning)) row.player_positioning = seed.player_positioning;
    if (!has(row.player_selling_points)) row.player_selling_points = seed.player_selling_points;
    if (!has(row.model_year) && /levante/i.test(row.model)) row.model_year = '2026';
    if (!has(row.alias) && /levante/i.test(row.model)) row.alias = 'NEW LEVANTE';

    if (JSON.stringify(row) !== before) masterUpdates += 1;
  }

  const nextWb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    nextWb,
    xlsx.utils.json_to_sheet(alignHeaders(rodRows, HEADERS.rodMaster), { header: HEADERS.rodMaster }),
    SHEET_NAMES.rod,
  );
  xlsx.utils.book_append_sheet(
    nextWb,
    xlsx.utils.json_to_sheet(alignHeaders(detailRows, HEADERS.rodDetail), { header: HEADERS.rodDetail }),
    SHEET_NAMES.rodDetail,
  );
  xlsx.writeFile(nextWb, XLSX_FILE);
  runMegabassRodDetailGroupShading();

  const count = (rows, field) => rows.filter((row) => has(row[field])).length;
  console.log({
    file: XLSX_FILE,
    masters: rodRows.length,
    details: detailRows.length,
    masterUpdates,
    detailUpdates,
    master_player_positioning: `${count(rodRows, 'player_positioning')}/${rodRows.length}`,
    detail_player_environment: `${count(detailRows, 'player_environment')}/${detailRows.length}`,
    detail_player_positioning: `${count(detailRows, 'player_positioning')}/${detailRows.length}`,
    detail_guide_use_hint: `${count(detailRows, 'guide_use_hint')}/${detailRows.length}`,
    detail_guide_layout_type: `${count(detailRows, 'guide_layout_type')}/${detailRows.length}`,
  });
}

main();
