const path = require('path');
const XLSX = require('./node_modules/xlsx');
const gearDataPaths = require('./gear_data_paths');

const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_rod_import.xlsx');

const FIELDS = ['player_environment', 'player_positioning', 'player_selling_points'];

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function has(text, pattern) {
  return pattern.test(text);
}

function parts(value) {
  return n(value).split('/').map((s) => n(s)).filter(Boolean);
}

function cn(token) {
  const t = n(token);
  const rules = [
    [/BFS/i, 'BFS轻饵'],
    [/Down Shot/i, '倒吊'],
    [/Neko/i, 'Neko'],
    [/Jighead Worm/i, '铅头软虫'],
    [/Jighead Rig|Dart Jighead/i, '铅头钩'],
    [/Surf Jighead/i, '沙滩铅头钩'],
    [/Texas/i, '德州钓组'],
    [/Free Rig/i, '自由钓组'],
    [/Rubber Jig/i, '橡胶铅头钩'],
    [/Chatterbait/i, '刀片铅头钩'],
    [/Swim Jig/i, '泳饵铅头钩'],
    [/Spinnerbait/i, '复合亮片'],
    [/Crankbait|Crank/i, 'Crank/小胖'],
    [/Shad/i, 'Shad'],
    [/Minnow/i, '米诺'],
    [/Vibration/i, 'VIB'],
    [/Topwater|Pencil|Popper/i, '水面系'],
    [/Jerkbait/i, 'Jerkbait'],
    [/No Sinker/i, '无铅钓组'],
    [/Frog/i, '雷蛙'],
    [/Punching/i, '穿草重障碍'],
    [/Big Bait/i, '大饵'],
    [/Swimbait/i, '泳饵'],
    [/Spoon/i, '亮片'],
    [/Streamer/i, 'Streamer'],
    [/Nymph/i, 'Nymph'],
    [/Eging|Egi/i, '木虾'],
    [/Tip-?run/i, 'Tip-run木虾'],
    [/Metal Sutte|Sutte/i, '金属スッテ'],
    [/Ajing/i, 'Ajing铅头'],
    [/Mebaring/i, 'Mebaring铅头'],
    [/Rockfish/i, '岩鱼底部钓组'],
    [/Chining/i, '黑鲷底部钓组'],
    [/Light Shore Jigging|SLSJ|LSJ/i, '轻岸投铁板'],
    [/Shore Jigging/i, '岸投铁板'],
    [/Shore Plug/i, '岸投硬饵'],
    [/Seabass/i, '海鲈米诺'],
    [/Surf/i, '沙滩远投'],
    [/WIND|Tachiuo/i, '太刀鱼WIND'],
    [/Slow Pitch/i, '慢摇铁板'],
    [/Super Light Jigging|SLJ/i, '超轻铁板'],
    [/Light Jigging/i, '轻型船钓铁板'],
    [/Jigging|Metal Jig|Long Jig|Semi-long|Micro Jig|Small Metal/i, '金属铁板'],
    [/Tairaba/i, '鯛ラバ'],
  ];
  for (const [pattern, value] of rules) {
    if (pattern.test(t)) return value;
  }
  return t || '目标饵型';
}

function hasAnyPair(pairText, patterns) {
  return patterns.some((pattern) => pattern.test(pairText));
}

function typeOf(row) {
  return n(row.TYPE).toUpperCase();
}

function specText(row, model) {
  return `${model} ${n(row.SKU)} ${n(row.Description)} ${n(row.guide_use_hint)} ${n(row.recommended_rig_pairing)} ${n(row.POWER)} ${n(row['LURE WEIGHT'])}`.toLowerCase();
}

function travelHint(text) {
  if (/pack|dream tour|mb|freegame|mobile|多节|携带|远征|旅行/i.test(text)) return '，收纳友好，适合出行备用或远征携带';
  return '';
}

function shoreNuance(row) {
  const sku = n(row.SKU).toUpperCase();
  const power = n(row.POWER).toUpperCase();
  const notes = [];
  if (/\bS9| B9/.test(sku)) notes.push('9尺级更偏连续抛投和近中距离操作');
  else if (/\bS10| B10/.test(sku)) notes.push('10尺级兼顾距离、控线和落点稳定');
  else if (/\bS11|\bS12|\bS13| B11| B12| B13/.test(sku)) notes.push('长尺更重视远投距离和大线弧修正');
  if (/ML/.test(power)) notes.push('ML强度更适合轻量硬饵和细线');
  else if (/M\+|MH/.test(power)) notes.push('中强度更适合风浪、深场或远点刺鱼');
  else if (/H|XH/.test(power)) notes.push('重强度更适合青物和高负荷控鱼');
  return notes.slice(0, 2).join('，');
}

function boatNuance(row) {
  const sku = n(row.SKU).toUpperCase();
  const power = n(row.POWER).toUpperCase();
  const notes = [];
  if (/B\d/.test(sku)) notes.push('枪柄更利于垂直控线和贴船操作');
  else if (/S\d/.test(sku)) notes.push('直柄更利于抛投覆盖和斜向控饵');
  if (/0{2}|UL|L\b/.test(`${sku} ${power}`)) notes.push('轻量号数适合低活性和细PE');
  else if (/3|4|MH|H/.test(`${sku} ${power}`)) notes.push('高号数更适合深场、强流或大型目标');
  return notes.slice(0, 2).join('，');
}

function egiNuance(row) {
  const sku = n(row.SKU).toUpperCase();
  const power = n(row.POWER).toUpperCase();
  if (/S7|UL|SUL/.test(`${sku} ${power}`)) return '短尺/轻强度更适合港湾小木虾和细腻读口';
  if (/S8|M\b/.test(`${sku} ${power}`)) return '8尺级更适合常规秋鱿、春鱿和走钓节奏';
  if (/MH|H|S9/.test(`${sku} ${power}`)) return '较强规格更适合深场、潮流或大号木虾';
  return '';
}

function powerHint(row) {
  const power = n(row.POWER).toUpperCase();
  if (/XH|XXH|HH|H\+/.test(power)) return '强控鱼余量';
  if (/MH|M\+/.test(power)) return '刺鱼和控鱼余量';
  if (/UL|SUL|XUL/.test(power)) return '轻口反馈和细线缓冲';
  if (/L/.test(power)) return '轻量操作和抛投手感';
  return '操作覆盖效率';
}

function build(env, pos, sell) {
  return {
    player_environment: env,
    player_positioning: pos,
    player_selling_points: sell,
  };
}

function refine(row, model) {
  const sku = n(row.SKU);
  const pair = n(row.recommended_rig_pairing);
  const pairParts = parts(pair);
  const primary = cn(pairParts[0]);
  const secondary = [...new Set(pairParts.slice(1, 5).map(cn).filter((item) => item !== primary))].slice(0, 3).join('、');
  const text = specText(row, model);
  const travel = travelHint(text);
  const leverage = powerHint(row);
  const spinning = typeOf(row) === 'S';

  if (/衍生握把|x seat|extream握把|握把/i.test(sku)) {
    return build('配件更换 / 握把适配', '握把配件', '用于调整握持长度、左右手和竿尾平衡，不对应独立钓组。');
  }
  if (/landing shaft|抄网|shaft/i.test(sku)) {
    return build('岸边/堤防/船边抄鱼辅助', '抄网柄辅助工具', '价值在收纳长度、伸出距离和上鱼后的落网效率，不对应独立饵型。');
  }
  if (!pair) {
    return build('用途待保守确认', '保守待定', '缺少可靠饵型依据，暂不扩大到具体玩法。');
  }

  const isBass = /poison|zodias|expride|bantam|bass one|pegas|majestic|leonis|lesath|ultima|glorious|scorpion|conquest/i.test(text)
    && !/sephia|soare|ocea|grappler|coltsniper|exsence|nessa|dialuna|lunamis|moonshot|hard rocker|game type/i.test(text);
  const isTrout = /cardiff|trout|area|native|stream|管钓|鳟|溪流|本流|asquith|fly/i.test(text);
  const isEging = hasAnyPair(pair, [/Eging|Egi|Tip-?run|Metal Sutte|Sutte/i]) || /sephia|乌贼|木虾|metal sutte|tip eging/i.test(text);
  const isLightSalt = hasAnyPair(pair, [/Ajing|Mebaring/i]) || /soare|ajing|mebaring|竹荚鱼|鲪鱼|light game/i.test(text);
  const isRock = hasAnyPair(pair, [/Rockfish/i]) || /hard rocker|rockfish|根鱼|岩鱼/i.test(text);
  const isChining = hasAnyPair(pair, [/Chining/i]) || /brenious|chining|黑鲷|黑鯛/i.test(text);
  const isBoatJig = hasAnyPair(pair, [/Jigging|Slow Pitch|Light Jigging|Metal Jig|Long Jig|Semi-long|Tairaba|Micro Jig|Small Metal/i])
    && /ocea|game type|grappler|crossmission|light jigging|slow|船|鯛|タイラバ|tairaba/i.test(text);
  const isShoreSalt = hasAnyPair(pair, [/Shore|Surf|Seabass|WIND|Tachiuo|Metal Jig/i])
    || /exsence|nessa|coltsniper|dialuna|lunamis|moonshot|encounter|shore|surf|海鲈|青物|带鱼|港湾|沙滩|岸投/i.test(text);

  if (/scorpion xv/i.test(text) && /管钓|鳟|亮片|ajing|竹荚鱼/i.test(text)) {
    return build(
      '管理钓场、小河川、港湾轻盐小物',
      '管钓鳟鱼/轻盐轻饵',
      `${primary} 优先，亮片和小型硬饵负责管钓/小鱼搜索，铅头钩与 Ajing 只是轻盐补充；重点是细线缓冲和轻口反馈。`
    );
  }

  if (/world shaula technical edition/i.test(text)) {
    return build(
      '溪流、湖泊、港湾轻量多目标',
      '技术型轻量多目标操作',
      `${primary} 是最适合的起点，价值在短中距离精准抛投、细线控饵和轻量饵反馈；${secondary || '铅头钩'}用于淡海水目标切换。`
    );
  }

  if (isBass) {
    if (/BFS/i.test(pair)) {
      return build(
        '小河道、码头、岸边轻障碍近距打点',
        spinning ? '直柄轻饵精细' : 'BFS轻饵打点',
        `${primary} 优先，低负荷抛投、小饵落点控制和轻口反馈是核心；${secondary || '小米诺'}用于补搜索。`
      );
    }
    const bigPrimary = /Big Bait|Swimbait/i.test(pairParts[0] || '') || /-SB|swim ?bait|big bait|大型假饵|大饵/i.test(text);
    if (bigPrimary && /Big Bait|Swimbait/i.test(pair)) {
      return build(
        /Frog/i.test(pair) ? '草洞、岸边障碍、开阔水域大饵搜索' : '水库、河道、开阔水域大饵搜索',
        /Frog/i.test(pair) ? '短尺大饵/雷蛙强控' : '大饵/泳饵强力操作',
        `${primary} 放首位，重点是大饵启动、停顿姿态和中鱼后控鱼；${secondary || '水面系'}作为高活性补充。`
      );
    }
    if (/Frog|Punching|Heavy Texas|Cover|Small Rubber/i.test(pair)) {
      return build(
        '草区、浮萍、木桩、重障碍结构',
        /Frog/.test(pair) ? '草区Frog/重障碍' : '强力底操/障碍精细',
        `${primary} 优先，${leverage}是关键，能在障碍里完成刺鱼和拔鱼；${secondary || '重型软饵'}补足不同密度覆盖。`
      );
    }
    const soft = /Texas|Free Rig|Rubber Jig|Down Shot|Neko|Jighead|No Sinker|Wacky|Power Finesse/i.test(pair);
    const hard = /Crankbait|Shad|Minnow|Vibration|Spinnerbait|Chatterbait|Topwater|Jerkbait|Pencil/i.test(pair);
    if (/Topwater|Pencil|Jerkbait/i.test(pairParts[0] || '') && !/Texas|Free Rig|Rubber Jig|Down Shot|Neko|Jighead/i.test(pair)) {
      return build(
        '浅滩、草边、码头边水面/中上层搜索',
        '抽停/水面系技巧',
        `${primary} 优先，重点是抽停节奏、停顿姿态和鱼追饵时的缓冲；${secondary || '无铅钓组'}用于补充同一水层的慢速诱鱼。`
      );
    }
    if (soft && hard) {
      return build(
        /远投|长尺|岸/i.test(text) ? '开放水域、硬底边线、岸钓远投搜索' : '水草边、硬底、码头、木桩混合结构',
        spinning ? '直柄软硬饵切换' : '软硬饵泛用主力',
        `${primary} 优先，软饵负责读底和弱口，${secondary || '硬饵'}负责快速探水层；混合路线宽容度高${travel}。`
      );
    }
    if (soft) {
      return build(
        /deep|深水|长尺|远投/i.test(text) ? '深水硬底、离岸结构、远投底操' : '硬底、木桩、水草边、码头结构',
        /Down Shot|Neko|Jighead|Wacky/i.test(pair) ? '精细软饵/读口' : '底部软饵/结构感知',
        `${primary} 优先，最有价值的是读底、停顿入口和轻咬口判断；${secondary || '相邻软饵钓组'}用于换水深和障碍密度。`
      );
    }
    if (hard) {
      const moving = /Spinnerbait|Chatterbait|Swim Jig|Vibration/i.test(pair);
      return build(
        moving ? '开放水域、水草边、风浪面移动饵搜索' : '浅滩、石堆、码头边硬饵搜索',
        moving ? '移动反应饵搜索' : '卷阻硬饵/抽停搜索',
        `${primary} 优先，价值在持续泳姿、回竿反馈和反应咬口命中率；${secondary || '小型硬饵'}用于调整泳层。`
      );
    }
    return build(
      /27|28|7\d|8\d/.test(sku) ? '水库、河道、开阔水域淡水远投' : '岸边、船上、常规淡水结构区',
      spinning ? '直柄淡水保守泛用' : '枪柄淡水保守泛用',
      `当前饵型信息不典型，按淡水竿边界保守处理：重点放在抛投、控线和${leverage}，不按海水木虾或船钓铁板扩展。`
    );
  }

  if (isEging) {
    if (/Tip-?run/i.test(pair) || /tip eging/i.test(text)) {
      return build(
        '近海船钓乌贼 / 流速与水深变化区',
        'Tip-run木虾控底',
        `${primary} 是主轴，重点在触底判断、漂流角度和细微抱饵反馈；${secondary || '不同号数木虾'}作为水深变化补充${egiNuance(row) ? `；${egiNuance(row)}` : ''}。`
      );
    }
    if (/Metal Sutte|Sutte/i.test(pair) || /metal sutte|铅坠|水深/i.test(text)) {
      return build(
        '夜钓船乌贼 / 中深水层',
        'Metal Sutte船乌贼',
        `${primary} 优先，价值在竿梢辨识轻抱、控坠稳定和连续诱钓节奏；${secondary || '浮スッテ'}用于调整水层${egiNuance(row) ? `；${egiNuance(row)}` : ''}。`
      );
    }
    return build(
      /Ajing|Mebaring/i.test(pair) ? '港湾小型木虾 / 轻盐小物兼用' : '港湾、防波堤、磯场木虾走钓',
      /1\.5|小型|sul|ul/i.test(text) ? '小型木虾高感操作' : '木虾抽跳/停顿专项',
      `${primary} 放在首位，重视抽跳后停顿读口和线弧控制；${secondary || '轻盐小物'}只是补充路线，不把它当泛用海水竿${egiNuance(row) ? `；${egiNuance(row)}` : ''}。`
    );
  }

  if (isBoatJig && !/coltsniper|exsence|nessa|dialuna|lunamis|moonshot|encounter|salty advance seabass|shore jigging|surf|seabass|world shaula bg/i.test(text)) {
    if (/Slow Pitch/i.test(pair)) {
      return build(
        '近海船钓 / 慢摇铁板水深层',
        '慢摇铁板节奏竿',
        `${primary} 优先，竿身回弹服务抬竿、落饵和停顿；${secondary || '长型铁板'}用于不同流速和目标鱼体型${boatNuance(row) ? `；${boatNuance(row)}` : ''}。`
      );
    }
    if (/Light Jigging|Super Light|SLJ|Small Metal|Micro Jig/i.test(pair)) {
      return build(
        '近海船钓 / 轻铁板与细PE',
        /00|超轻|micro/i.test(text) ? '超轻铁板细线操作' : '轻型船钓铁板',
        `${primary} 是主轴，优势在小铁板细动作、落饵跟随和细线搏鱼；${secondary || '鯛ラバ'}作为低活性补充${boatNuance(row) ? `；${boatNuance(row)}` : ''}。`
      );
    }
    if (/Tairaba/i.test(pair)) {
      return build(
        '近海船钓 / 真鲷与底层鱼',
        '鯛ラバ/轻铁板兼用',
        `${primary} 优先，重视匀速卷收、触底再启动和鱼口跟随；${secondary || '轻铁板'}补足搜索效率${boatNuance(row) ? `；${boatNuance(row)}` : ''}。`
      );
    }
    return build(
      '近海船钓 / 金属铁板搜索',
      '船钓铁板节奏竿',
      `${primary} 优先，价值在抽竿回弹、落饵控线和中鱼后持续顶鱼；${secondary || '不同长度铁板'}用于换水深和流速${boatNuance(row) ? `；${boatNuance(row)}` : ''}。`
    );
  }

  if (isShoreSalt && !isBass) {
    if (/Surf/i.test(pair) || /nessa|沙滩|surf/i.test(text)) {
      return build(
        '沙滩、河口、远浅区远投搜索',
        '沙滩远投海鲈/比目鱼',
        `${primary} 优先，长距离出线和线弧控制是核心；${secondary || '铅头软饵'}用于触底、停顿和不同水层切换${shoreNuance(row) ? `；${shoreNuance(row)}` : ''}。`
      );
    }
    if (/Light Shore Jigging|SLSJ|LSJ/i.test(pair)) {
      return build(
        '堤防、港湾、近岸回游鱼轻岸投',
        '轻岸投铁板搜索',
        `${primary} 优先，重点是反复远投、小铁板启动和远距离刺鱼；${secondary || '岸投硬饵'}用于补水层${shoreNuance(row) ? `；${shoreNuance(row)}` : ''}。`
      );
    }
    if (/Shore Jigging|Metal Jig/i.test(pair) && /coltsniper|shore|岸投|青物/i.test(text)) {
      return build(
        '磯场、堤防、外海岸线青物远投',
        '岸投铁板/硬饵强搜索',
        `${primary} 放前面，价值在长时间抛投、线弧管理和远点控鱼；${secondary || '岸投硬饵'}补足不同泳层${shoreNuance(row) ? `；${shoreNuance(row)}` : ''}。`
      );
    }
    if (/WIND|Tachiuo/i.test(pair)) {
      return build(
        '港湾、堤防夜间带鱼与近岸掠食鱼',
        '太刀鱼WIND突进操作',
        `${primary} 优先，竿梢回弹服务连续抽动、松线下沉和短咬口判断；${secondary || '金属铁板'}用于扩大搜索距离${shoreNuance(row) ? `；${shoreNuance(row)}` : ''}。`
      );
    }
    if (/Seabass|Minnow|Sinking Pencil|Vibration/i.test(pair) || /exsence|dialuna|lunamis|moonshot|海鲈/i.test(text)) {
      return build(
        '河川、港湾、河口、干潟海鲈搜索',
        /大型|磯|青物|m\/r|mh/i.test(text) ? '海鲈强风/大场景远投' : '海鲈米诺/沉水铅笔搜索',
        `${primary} 优先，最有价值的是出线稳定、线弧修正和流水中控饵；${secondary || 'VIB'}用于补强反应搜索${shoreNuance(row) ? `；${shoreNuance(row)}` : ''}。`
      );
    }
    return build(
      '近岸海水多目标 / 港湾到堤防',
      '岸投多目标搜索',
      `${primary} 是主轴，强调远投、控线和多水层切换；${secondary || '岸投硬饵'}用于按鱼情调整节奏。`
    );
  }

  if (isLightSalt) {
    if (/Mebaring/i.test(pair) && !/Ajing/i.test(pairParts[0] || '')) {
      return build(
        '港湾夜钓、礁边、常夜灯鲪鱼',
        'Mebaring轻量控线',
        `${primary} 优先，价值在轻咬口跟随、细线缓冲和贴边慢卷；${secondary || '小型硬饵'}补充搜索效率。`
      );
    }
    return build(
      '港湾常夜灯、码头、内湾轻型海水',
      /float|キャロ|远投/i.test(text) ? 'Ajing远投/浮钓组' : 'Ajing轻量铅头',
      `${primary} 优先，重点是 1g 级铅头的轻口反馈、细线控线和短咬口判断；${secondary || '小型硬饵'}用于横向搜索。`
    );
  }

  if (isRock || isChining) {
    if (isChining) {
      return build(
        '港湾、河口、牡蛎壳/硬底黑鲷区',
        '黑鲷底部搜索',
        `${primary} 优先，价值在触底、停顿和短促啄咬识别；${secondary || '小型橡胶饵'}用于不同底质切换。`
      );
    }
    return build(
      '岩礁、堤防根区、硬底结构',
      /long|远投|s8|s9/i.test(text) ? '远投岩鱼/根鱼搜索' : '岩鱼底部结构感知',
      `${primary} 优先，重点是读底、避挂和把鱼带离缝隙；${secondary || '小型硬饵'}用于开阔水层搜索。`
    );
  }

  if (isTrout) {
    if (/Streamer|Nymph|Fly/i.test(pair) || /asquith|fly/i.test(text)) {
      return build(
        '溪流、本流、湖泊飞钓',
        '飞钓鳟鱼专项',
        `${primary} 优先，价值在抛线节奏、控线距离和不同水层呈现；${secondary || '干湿蝇'}用于换鱼情。`
      );
    }
    if (/area|管理钓场|管钓/i.test(text)) {
      return build(
        '管理钓场、放流池、轻量鳟鱼场',
        '管钓鳟鱼轻饵',
        `${primary} 优先，细线缓冲和慢速控饵是核心；${secondary || '小型硬饵'}用于追活性和换泳层。`
      );
    }
    return build(
      /monster|本流|大型/i.test(text) ? '本流、湖泊、大型鳟鱼水域' : '溪流、本流、小河川鳟鱼走钓',
      /monster|大型/i.test(text) ? '大型鳟鱼控鱼' : '溪流鳟鱼米诺操作',
      `${primary} 放前面，重视短距离精准抛投、控流和抽停节奏；${secondary || '亮片'}用于水色和流速变化。`
    );
  }

  if (/world shaula|scorpion|lurematic|freegame|brookstone|unfix|capture/i.test(text)) {
    return build(
      /shore|海鲈|岩鱼|港湾|海水|淡海水/i.test(text) ? '淡海水旅行、多目标岸边搜索' : '淡水到轻盐的多目标泛用',
      spinning ? '直柄多目标泛用' : '枪柄多目标泛用',
      `${primary} 是最适合的起点，${secondary || '相邻饵型'}用于按目标鱼切换；真正价值在跨环境携带和钓法跨度${travel}。`
    );
  }

  return build(
    spinning ? '开放水域、岸边、轻量多目标搜索' : '岸边/船上中近距离多目标搜索',
    spinning ? '直柄保守泛用' : '枪柄保守泛用',
    `${primary} 优先，${secondary || '相邻饵型'}作为补充；按当前规格保守理解为多场景覆盖，不扩大到重障碍或大物。`
  );
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const rodRows = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const sheet = wb.Sheets.rod_detail;
  const header = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })[0];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const modelByRodId = new Map(rodRows.map((row) => [n(row.id), n(row.model)]));
  const changed = [];

  for (const row of rows) {
    const model = modelByRodId.get(n(row.rod_id)) || '';
    const next = refine(row, model);
    for (const field of FIELDS) {
      const oldValue = n(row[field]);
      const newValue = next[field];
      if (oldValue !== newValue) {
        row[field] = newValue;
        changed.push({ id: row.id, rod_id: row.rod_id, sku: row.SKU, field, old: oldValue, new: newValue });
      }
    }
  }

  wb.Sheets.rod_detail = XLSX.utils.json_to_sheet(rows, { header });
  XLSX.writeFile(wb, IMPORT_FILE);

  const stats = {};
  for (const field of FIELDS) {
    const values = rows.map((row) => n(row[field])).filter(Boolean);
    stats[field] = {
      filled: values.length,
      unique: new Set(values).size,
    };
  }

  console.log(JSON.stringify({
    file: IMPORT_FILE,
    changed_cells: changed.length,
    changed_rows: new Set(changed.map((item) => item.id)).size,
    stats,
    sample: changed.slice(0, 120),
  }, null, 2));
}

main();
