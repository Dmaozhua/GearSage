const path = require('path');
const XLSX = require('./node_modules/xlsx');
const gearDataPaths = require('./gear_data_paths');

const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_rod_import.xlsx');

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function splitParts(value) {
  return n(value).split('/').map((part) => n(part)).filter(Boolean);
}

function zh(token) {
  const t = n(token);
  const rules = [
    [/BFS/i, 'BFS轻饵'],
    [/Down Shot/i, '倒吊'],
    [/Neko/i, 'Neko'],
    [/Wacky/i, '维基'],
    [/Texas/i, '德州'],
    [/Free Rig/i, '自由钓组'],
    [/Rubber Jig/i, '橡胶铅头钩'],
    [/Small Rubber/i, '小橡胶铅头钩'],
    [/Jighead Worm/i, '铅头软虫'],
    [/Jighead Rig|Dart Jighead/i, '铅头钩'],
    [/No Sinker/i, '无铅'],
    [/Frog/i, '雷蛙'],
    [/Punching/i, '穿草'],
    [/Chatterbait/i, '刀片铅头钩'],
    [/Swim Jig/i, '泳饵铅头钩'],
    [/Spinnerbait/i, '复合亮片'],
    [/Crankbait|Crank/i, '小胖'],
    [/Shad/i, 'Shad'],
    [/Minnow/i, '米诺'],
    [/Vibration/i, 'VIB'],
    [/Topwater|Pencil|Popper/i, '水面系'],
    [/Jerkbait/i, 'Jerkbait'],
    [/Big Bait/i, '大饵'],
    [/Swimbait/i, '泳饵'],
    [/Spoon/i, '亮片'],
    [/Small Plug/i, '小型硬饵'],
    [/Streamer/i, 'Streamer'],
    [/Nymph/i, 'Nymph'],
    [/Tip-?run/i, 'Tip-run木虾'],
    [/Metal Sutte|Sutte/i, '金属スッテ'],
    [/Eging|Egi/i, '木虾'],
    [/Ajing/i, 'Ajing铅头'],
    [/Mebaring/i, 'Mebaring铅头'],
    [/Rockfish/i, '岩鱼底部钓组'],
    [/Chining/i, '黑鲷底部钓组'],
    [/Light Shore Jigging|SLSJ|LSJ/i, '轻岸投铁板'],
    [/Shore Jigging/i, '岸投铁板'],
    [/Shore Plug|Offshore Plug/i, '抛投硬饵'],
    [/Seabass/i, '海鲈米诺'],
    [/Surf/i, '沙滩远投'],
    [/WIND|Tachiuo/i, 'WIND'],
    [/Slow Pitch/i, '慢摇铁板'],
    [/Super Light Jigging|SLJ/i, '超轻铁板'],
    [/Light Jigging/i, '轻型铁板'],
    [/Electric Jigging/i, '电动铁板'],
    [/Offshore Jigging/i, '离岸铁板'],
    [/Jigging|Metal Jig|Long Jig|Semi-long|Micro Jig|Small Metal/i, '金属铁板'],
    [/Tairaba/i, '鯛ラバ'],
  ];
  for (const [pattern, value] of rules) {
    if (pattern.test(t)) return value;
  }
  return t || '目标饵';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function lureWords(row) {
  const words = splitParts(row.recommended_rig_pairing).map(zh);
  return {
    first: words[0] || '',
    next: unique(words.slice(1)).slice(0, 3),
  };
}

function lengthNote(row) {
  const sku = n(row.SKU).toUpperCase();
  const power = n(row.POWER).toUpperCase();
  const notes = [];
  if (/\bS7|\bB7|\bC7/.test(sku)) notes.push('短中尺操作反应快');
  else if (/\bS8|\bB8|\bC8/.test(sku)) notes.push('8尺级在操作和距离之间比较均衡');
  else if (/\bS9|\bB9|\bC9/.test(sku)) notes.push('9尺级更适合连续抛投');
  else if (/\bS10|\bB10|\bC10/.test(sku)) notes.push('10尺级兼顾距离和控线');
  else if (/\bS11|\bS12|\bS13|\bB11|\bB12|\bB13/.test(sku)) notes.push('长尺更利于远点控线和修正线弧');

  if (/XH|XXH|HH|H\+/.test(power)) notes.push('强度余量更偏大鱼和高负荷');
  else if (/MH|M\+/.test(power)) notes.push('中强度适合远点刺鱼和结构区控鱼');
  else if (/UL|SUL|XUL/.test(power)) notes.push('轻强度更重视轻口反馈和细线缓冲');
  else if (/ML|L/.test(power)) notes.push('轻量饵的启动和控线会更轻松');
  return notes.slice(0, 2).join('，');
}

function withNote(text, note) {
  return note ? `${text}；${note}。` : `${text}。`;
}

function joinNext(next, fallback) {
  return next.length ? next.join('、') : fallback;
}

function variant(row) {
  const id = Number(String(row.id || '').replace(/\D/g, '')) || 0;
  return id % 3;
}

function selling(row) {
  const env = n(row.player_environment);
  const pos = n(row.player_positioning);
  const pair = n(row.recommended_rig_pairing);
  const guide = n(row.guide_use_hint);
  const sku = n(row.SKU);
  const { first, next } = lureWords(row);
  const other = joinNext(next, '相邻饵型');
  const note = lengthNote(row);
  const v = variant(row);

  const targeted = {
    SRD10024: '2oz级泳饵和大饵需要竿梢带动启动，也需要腰身承接抽竿和中鱼冲击，岸钓或船边都能保留控饵节奏。',
    SRD10183: '从高比重无铅到轻量移动饵都能接住，价值在柔顺竿梢和顺滑弯曲；遇到小型大饵或快速游动饵时也不会显得生硬。',
    SRD10237: '大型假饵和大型近海目标都需要竿身负荷承接，7尺长度保留操作性，同时给强风、急流和远点控鱼留出余量。',
    SRD10277: '超过4oz的大饵需要抛投负荷、扬竿力量和控鱼余量同时在线，这类规格更适合锁定巨型鲈鱼而不是普通泛用。',
    SRD10279: '1oz以下硬饵、软虫和中小型大饵都能覆盖，玩家会看重抛投距离稳定性、竿梢信息和中鱼后的强力竿尾。',
    SRD10282: '泳饵和大饵操作更看重竿身顺滑弯曲，既要带得动饵，也要在鱼追咬时提供缓冲。',
    SRD10283: 'Swim & Big Bait 取向明确，重点在大饵抛投负荷、启动姿态和巨物控鱼，不按普通硬饵泛用理解。',
    SRD10313: '4oz级大饵需要抛投弯曲、控饵轻快和短距离精准度同时成立，强项在让大型饵游动自然并留住咬口。',
    SRD10319: '实心竿梢让游动饵慢速通过时更容易读到细微变化，也能切到倒吊、Neko这类轻口钓组，重点是让鱼更容易入口。',
    SRD10388: '1oz级紧凑大饵、游动饵和雷蛙都需要从障碍里拉鱼，价值在短尺控饵、竿梢启动和接近H级的握把力量。',
    SRD10409: '短尺XH大饵规格更看重近距离精准落点、饵体启动和中鱼后控鱼，不需要写成普通强力泛用。',
    SRD10435: '远征多节规格仍保留大饵负荷，适合东南亚一类需要大型假饵和便携性的场景，收纳便利不等于只做轻量泛用。',
    SRD10591: '重型橡胶铅头钩和泳饵都需要竿梢承载负荷，价值在节奏操作和强力回鱼之间取得平衡。',
    SRD10594: '大型假饵远投和重德州进障碍都能覆盖，玩家会看重远距离搜索后的刺鱼力量和大型目标控鱼余量。',
    SRD11310: '50g到100g级大饵需要短尺下操、翻转和静动切换都顺手，竿身顺滑弯曲能减轻负担并支撑大型海鲈搏鱼。',
    SRD11512: '50g级大饵抛投需要竿梢柔韧和握把支撑同时到位，河川、河口和船边都更看重负荷承接与大型海鲈控鱼。',
  };
  if (targeted[row.id]) return targeted[row.id];

  if (!pair) {
    if (/握把/.test(pos)) return '价值在握持长度、左右手匹配和竿尾平衡调整，本身不对应独立作钓路线。';
    if (/抄网|辅助/.test(pos)) return '主要解决落网距离、收纳长度和岸边/船边抄鱼效率，不参与钓组判断。';
    return '缺少可靠饵型依据时保持保守，只描述可确认的用途边界，不扩大成具体技法卖点。';
  }

  if (/BFS|轻饵/.test(pos)) {
    const texts = [
      `玩家会看重低负荷出线和小饵落点控制，${other}更多是扩展轻口或小硬饵搜索的选择`,
      `这类规格的价值在短距离准投、轻线控线和轻口反馈，适合围绕${first}做精细打点`,
      `小饵启动轻、回竿手感清楚，换到${other}时也不需要明显改变操作节奏`,
    ];
    return withNote(texts[v], note);
  }

  if (/软硬饵|泛用主力|软硬饵切换/.test(pos)) {
    const texts = [
      `适合把${first}当作基础路线，软饵读底和硬饵搜索之间切换比较顺，不会把手感锁死在单一玩法`,
      `玩家最容易感受到的是宽容度：${first}能做细，换到${other}时仍有足够抛投和回竿反馈`,
      `更像一支混合场景主力竿，能在结构边慢下来，也能用${other}快速探水层`,
    ];
    return withNote(texts[v], note);
  }

  if (/精细软饵|底部软饵|结构感知|底操/.test(pos)) {
    const texts = [
      `价值在触底反馈、停顿入口和轻咬口判断，${other}可以按水深、障碍密度和鱼口强弱切换`,
      `玩家会更在意竿梢读口和腰身刺鱼的衔接，${first}这类底部钓组能把细节传得更清楚`,
      `适合慢下来找结构，手上能分辨触底、拖动和轻口，换到${other}也保持底操逻辑`,
    ];
    return withNote(texts[v], note);
  }

  if (/重障碍|Frog|障碍精细/.test(pos)) {
    const texts = [
      `重点不在单纯硬度，而在中鱼后能从草洞、木桩或覆盖物里把鱼带出来，${other}负责不同密度的障碍补位`,
      `玩家会看重刺鱼瞬间的支撑和拔鱼余量，${first}一类钓组能在重结构里减少拖泥带水`,
      `适合强攻场景，抛投落点、起鱼角度和控鱼力量比泛用舒适度更重要`,
    ];
    return withNote(texts[v], note);
  }

  if (/大饵|泳饵/.test(pos)) {
    const texts = [
      `价值在让大体积饵启动自然、停顿稳定，中鱼后还有足够竿身负荷承接冲击`,
      `玩家会在意抛投负荷和控饵节奏，${first}这类饵更需要竿身带动，不能只靠手腕硬抽`,
      `适合开阔水域找大鱼，${other}可以按鱼活性换成更高调或更慢的呈现方式`,
    ];
    return withNote(texts[v], note);
  }

  if (/移动反应饵|卷阻|硬饵|抽停|水面/.test(pos)) {
    const texts = [
      `玩家会看重稳定泳姿、回竿反馈和咬口后的缓冲，${other}可以按水层和速度调整搜索节奏`,
      `这类设定更适合持续抛收或抽停，竿身不把硬饵动作做死，也能降低短咬脱钩感`,
      `强项在反应咬口和覆盖效率，${first}容易形成节奏，换到${other}也能保留硬饵手感`,
    ];
    return withNote(texts[v], note);
  }

  if (/鳟|管钓|飞钓/.test(pos) || /鳟|溪流|管钓/.test(env)) {
    if (/飞钓/.test(pos)) return withNote(`玩家看重抛线节奏、控线距离和水层呈现，${other}决定它更适合干湿蝇切换还是水下搜索`, note);
    const texts = [
      `更有价值的是短距离准投、控流和抽停细节，${other}可以按水色、流速和鱼活性切换`,
      `细线缓冲和轻饵跟随感比较关键，玩家能更容易控制${first}在流中的姿态`,
      `适合频繁换角度和小范围打点，${other}补足不同水层和不同追饵状态`,
    ];
    return withNote(texts[v], note);
  }

  if (/木虾|Eging|Tip-run/.test(pos) || /木虾|乌贼/.test(env)) {
    if (/Tip-run/.test(pos)) return withNote(`玩家会看重触底判断、漂流角度和细微抱饵反馈，${other}多作为水深和流速变化下的配置切换`, note);
    if (/Metal Sutte|スッテ/.test(pos)) return withNote(`最有用的是竿梢能分辨轻抱、控坠稳定，长时间诱钓时节奏不会乱，${other}负责调整水层`, note);
    const texts = [
      `价值在抽跳后的停顿读口和线弧控制，${other}多作为港湾轻盐或不同号数木虾的补充`,
      `玩家更容易感受到木虾启动、下沉和抱饵信号的差异，不会被写成普通海水泛用竿`,
      `适合走钓时反复抽停和修正线弧，${other}可以作为遇到小乌贼或轻盐目标时的延展`,
    ];
    return withNote(texts[v], note);
  }

  if (/Ajing|Mebaring|轻盐|轻型海水/.test(pos) || /轻型海水|常夜灯/.test(env)) {
    const texts = [
      `玩家看重轻铅头的入口反馈、细线控线和短咬口判断，${other}可以在鱼不追底时改成横向搜索`,
      `强项在轻口可视化和手感反馈，适合常夜灯、小港湾这类需要慢节奏找口的场景`,
      `小饵操作不会显得拖沓，${first}能做细，换到${other}时也能保留轻量手感`,
    ];
    return withNote(texts[v], note);
  }

  if (/黑鲷|岩鱼|根鱼/.test(pos) || /黑鲷|岩礁|硬底/.test(env)) {
    const texts = [
      `玩家会看重触底后的停顿、拖动和短促啄咬识别，${other}用来应对底质和障碍变化`,
      `这类玩法需要读底清楚但不能太脆，${first}能贴底搜索，遇到缝隙或壳底也有控鱼余量`,
      `价值在底部信息和离障控鱼，${other}用来按鱼位置和挂底风险调整呈现方式`,
    ];
    return withNote(texts[v], note);
  }

  if (/沙滩|海鲈|岸投|WIND|青物|远投|多目标搜索/.test(pos) || /岸投|沙滩|海鲈|堤防|港湾|外海岸线/.test(env)) {
    if (/WIND/.test(pos)) return withNote(`玩家会看重连续抽动后的回弹、松线下沉控制和短咬口判断，${other}可以扩大夜间或远点搜索范围`, note);
    if (/沙滩/.test(pos)) return withNote(`价值在远投后的线弧管理、触底判断和长距离控鱼，${other}让沙滩、河口和远浅区的水层切换更从容`, note);
    const texts = [
      `玩家真正看重的是长时间抛投不拖累、出线稳定和远点控鱼，${other}可按风浪和鱼层调整`,
      `适合大范围覆盖，竿身需要兼顾抛投距离、线弧修正和咬口后的缓冲，不能只看饵重上限`,
      `强项在岸边搜索效率，${first}能建立节奏，换到${other}时主要是补不同泳层和水流条件`,
    ];
    return withNote(texts[v], note);
  }

  if (/船钓|铁板|鯛ラバ|慢摇/.test(pos) || /近海船钓|船乌贼/.test(env)) {
    if (/鯛ラバ/.test(pos)) return withNote(`玩家会看重匀速卷收、触底再启动和鱼口跟随，${other}给低活性或换水深时留余地`, note);
    if (/慢摇/.test(pos)) return withNote(`价值在竿身回弹、落饵跟随和停顿节奏，${other}帮助应对流速、水深和目标鱼体型变化`, note);
    const texts = [
      `玩家会在意抽竿回弹、落饵控线和中鱼后持续顶鱼，${other}多用于换水深或换目标时延展`,
      `强项在节奏稳定和负荷承接，重点是让${first}这类操作更省力，而不是把所有铁板都一锅端`,
      `适合近海重复操作，竿身反馈要能分清抽动、落饵和碰口，${other}负责不同流速下的补位`,
    ];
    return withNote(texts[v], note);
  }

  if (/多目标|泛用/.test(pos) || /淡水到轻盐|多目标/.test(env)) {
    const texts = [
      `玩家看重的是跨环境时不用频繁换竿，${first}能覆盖常用入口，${other}负责按目标鱼延展`,
      `这类规格的价值在携带和适配宽度，适合用一支竿处理几种常见水域，不追求单一技法极限`,
      `适合作为旅行或备用主力，${first}比较好建立手感，遇到不同水域再切到${other}`,
    ];
    return withNote(texts[v], note);
  }

  return withNote(`玩家价值集中在${first || '当前饵型'}的抛投、控线和咬口判断，${other}只作为相邻玩法扩展`, note);
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const sheet = wb.Sheets.rod_detail;
  const header = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })[0];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const changed = [];

  for (const row of rows) {
    const next = selling(row);
    const old = n(row.player_selling_points);
    if (old !== next) {
      row.player_selling_points = next;
      changed.push({ id: row.id, sku: row.SKU, old, new: next });
    }
  }

  wb.Sheets.rod_detail = XLSX.utils.json_to_sheet(rows, { header });
  XLSX.writeFile(wb, IMPORT_FILE);

  const values = rows.map((row) => n(row.player_selling_points)).filter(Boolean);
  const mechanical = values.filter((value) => /优先|主轴|放前面|放在首位|是最适合的起点/.test(value));
  console.log(JSON.stringify({
    file: IMPORT_FILE,
    changed_rows: changed.length,
    filled: values.length,
    unique: new Set(values).size,
    mechanical_left: mechanical.length,
    sample: changed.slice(0, 120),
  }, null, 2));
}

main();
