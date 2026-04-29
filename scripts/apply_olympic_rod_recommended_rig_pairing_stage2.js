const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('./node_modules/xlsx');
const { HEADERS } = require('./gear_export_schema');

const ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = path.join(ROOT, 'GearSage-client/pkgGear/data_raw/olympic_rod_import.xlsx');
const REPORT_FILE = path.join(ROOT, 'GearSage-client/pkgGear/data_raw/olympic_rod_recommended_rig_pairing_report.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_olympic_rod_detail_groups.py');

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

const RIG_BY_SKU = {
  '20GVIGC-71H': {
    recommended_rig_pairing: 'Texas Rig / Punch Shot Rig / Wacky Rig / Neko Rig',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description explicitly names Texas rig, punch shot, wacky, and Neko.',
    guide_use_hint: 'Bass 障礙打撃：Texas、Punch Shot、Wacky 和 Neko 的落點控制與控線更穩，cover 內補刺和拉離障礙更有餘量。',
  },
  '20GVIGC-75M': {
    recommended_rig_pairing: 'Vibration / Jerkbait / Scone Rig / Metal Vibration / Metal Jig',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names hardbait winding, vibration, jerkbait, scone rig, metal jig, and metal vibration.',
    guide_use_hint: 'Bass 巻物 / 操作硬餌：Vibration 和 Jerkbait 是主軸，Regular-Fast 調性保留操作性；Scone Rig、Metal Vibration 和 Metal Jig 作為冬季或吸い込み bite 補充。',
  },
  '20GVIGC-76MH': {
    recommended_rig_pairing: 'Spinnerbait Slow Roll / Heavy Spinnerbait / Chatterbait / Swim Jig',
    source: 'official_description_plus_whitelist_check',
    reliability: 'medium-high',
    source_note: 'Official description centers on 1/2-1.5oz moving lures and spinnerbait slow roll; whitelist supports moving-bait use.',
    guide_use_hint: 'Bass 中重型巻物：Spinnerbait Slow Roll 放首位，竿身要讀出 blade 振動並承接巻き負荷；Chatterbait 和 Swim Jig 作為同級 moving bait 延伸。',
  },
  '20GVIGC-77XH': {
    recommended_rig_pairing: 'Big Bait / Crawler Bait / Swimbait',
    source: 'official_description_plus_whitelist_check',
    reliability: 'high',
    source_note: 'Official description names big bait and crawler bait; whitelist also supports swimbait.',
    guide_use_hint: 'Bass 大型餌：Big Bait 和 Crawler Bait 是官方主軸，XH blank 用於穩定高負荷拋投、減少飛行姿勢偏移，Swimbait 作為同負荷泳姿餌延伸。',
  },
  '20GVIGS-610ML': {
    recommended_rig_pairing: 'No Sinker / Neko Rig / Bug Lure / Small Topwater Plug / Small Crankbait',
    source: 'official_description_plus_whitelist_check',
    reliability: 'high',
    source_note: 'Official description names no-sinker, Neko, bug lures, and plugs; whitelist supports light finesse use.',
    guide_use_hint: 'Bass 直柄 finesse / cover 兼用：No Sinker、Neko 和 Bug Lure 需要細線控線與竿尖讀感，小型 plug 可搜索；ML power 保留從 cover 拉魚的餘量。',
  },
  'GVIGS-6102ML': {
    recommended_rig_pairing: 'Neko Rig / No Sinker / Down Shot / Small Rubber Jig',
    source: 'official_description_conservative_inference',
    reliability: 'medium',
    source_note: 'Official description says light rigs broadly; specific finesse rigs are conservative from ML spinning spec and sibling use.',
    guide_use_hint: 'Bass 岸釣 light rig：中心切 2 piece 和 Regular-Fast 設定重點是攜行、拋投、誘い到 landing 的連貫性；Neko、No Sinker、Down Shot 以穩定操作為主。',
  },
  '20GVIGS-742M': {
    recommended_rig_pairing: 'Long Cast Neko Rig / PE Down Shot / No Sinker / Small Crankbait / Topwater Plug',
    source: 'official_description_plus_whitelist_check',
    reliability: 'medium-high',
    source_note: 'Official description says PE light-rig long cast and plug operation; whitelist supports PE long-cast finesse.',
    guide_use_hint: 'Bass PE 遠投 finesse：Long Cast Neko、PE Down Shot 和 No Sinker 是主軸，長距離下要維持細微違和感讀取；Small Crankbait、Topwater 是 plug 操作補充。',
  },
  '21GVELUC-65ML': {
    recommended_rig_pairing: 'Topwater Plug / Shallow Crankbait / Cover Neko / Small Rubber Jig',
    source: 'official_description_plus_whitelist_check',
    reliability: 'high',
    source_note: 'Official description names topwater plug, shallow crankbait, cover Neko, and small rubber jig.',
    guide_use_hint: 'Bass 小中型硬餌 / cover finesse：Topwater、Shallow Crankbait 負責搜索，Cover Neko 和 Small Rubber Jig 負責 cover 內精細打點。',
  },
  '21GVELUC-69MH': {
    recommended_rig_pairing: 'Texas Rig / Light Rubber Jig / High-density No Sinker / Spinnerbait / Chatterbait',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description explicitly names Texas, light rubber jig, high-density no-sinker, spinnerbait, and chatterbait.',
    guide_use_hint: 'Bass power finesse bait：3/16-3/8oz Texas、Light Rubber Jig 和高比重 No Sinker 是打點核心，Spinnerbait / Chatterbait 作為 3/8-1/2oz 搜索切換。',
  },
  '21GVELUC-610M': {
    recommended_rig_pairing: 'Medium Crankbait / Medium Minnow / Spinnerbait / High-density No Sinker / Texas Rig',
    source: 'official_description_conservative_expansion',
    reliability: 'medium-high',
    source_note: 'Official description says medium hardbait, spinnerbait, high-density no-sinker, and Texas; crankbait/minnow split avoids generic hardbait wording.',
    guide_use_hint: 'Bass bait versatile：中型 hardbait 和 1/2oz 內 Spinnerbait 負責搜索，高比重 No Sinker 與 1/4oz Texas 負責慢速打點；ベントカーブ重視拋投準度。',
  },
  '21GVELUC-70H': {
    recommended_rig_pairing: 'Texas Rig / Rubber Jig / Heavy Spinnerbait / Frog',
    source: 'official_description_plus_whitelist_check',
    reliability: 'high',
    source_note: 'Official description names Texas, rubber jig, heavy spinnerbait slow roll, and frog game.',
    guide_use_hint: 'Bass heavy versatile：3/8oz 以上 Texas 和 Rubber Jig 是 cover game 主軸，Heavy Spinnerbait slow roll 與 Frog 用於 vegetation 和高阻力搜索。',
  },
  '21GVELUC-74X': {
    recommended_rig_pairing: 'Heavy Texas Rig / Big Bait / Swimbait',
    source: 'official_description_plus_whitelist_check',
    reliability: 'high',
    source_note: 'Official description explicitly names heavy Texas, MAX3oz big bait, and swimbait.',
    guide_use_hint: 'Bass 強力長竿：Heavy Texas 放首位對應 cover 打點，MAX3oz Big Bait / Swimbait 需要粘りのある blank 承接拋投負荷與跟隨咬口。',
  },
  '21GVELUS-64L': {
    recommended_rig_pairing: 'Neko Rig / Down Shot / No Sinker / Small Rubber Jig / Small Crankbait / Small Minnow',
    source: 'official_description_conservative_inference',
    reliability: 'medium',
    source_note: 'Official description says all light rigs and small plugs; specific finesse rigs are conservative from L spinning spec.',
    guide_use_hint: 'Bass short spinning versatile：Light rig 全般是主軸，6’4” 提升近中距離操作和落點準度；Small Crankbait / Minnow 作為小型 plug 搜索補充。',
  },
  '21GVELUS-610ML': {
    recommended_rig_pairing: 'Long Cast Neko Rig / Down Shot / No Sinker / Small Crankbait / Small Minnow',
    source: 'official_description_plus_whitelist_check',
    reliability: 'medium',
    source_note: 'Official description says long-cast versatile spin across broad lure range; whitelist supports light-rig long-cast finesse.',
    guide_use_hint: 'Bass long versatile spin：利用 6’10” 的遠投性能投送 Neko、Down Shot 和 No Sinker，輕量平衡保留細操作；Small Plug 用於遠處搜索。',
  },
  '21GVELUS-611H-PF': {
    recommended_rig_pairing: 'Cover Neko / Small Rubber Jig / Heavy Cover No Sinker',
    source: 'official_description_plus_whitelist_check',
    reliability: 'medium',
    source_note: 'Official description states heavy-cover power spinning but does not name exact rigs; whitelist supports power-finesse cover use.',
    guide_use_hint: 'Bass power finesse：PE 線下 Cover Neko、Small Rubber Jig 和高比重 No Sinker 能打進 heavy cover，控線和拉離障礙是重點。',
  },
  '21GVELUS-742M': {
    recommended_rig_pairing: 'Long Cast Neko Rig / PE Down Shot / No Sinker / Spinnerbait / Vibration',
    source: 'official_description_plus_whitelist_check',
    reliability: 'medium-high',
    source_note: 'Official description names PE long-cast light rigs, spinnerbait up to 1/2oz, and vibration.',
    guide_use_hint: 'Bass PE long cast versatile：PE light rig 遠投是核心，Long Cast Neko、PE Down Shot 和 No Sinker 放前；1/2oz Spinnerbait、Vibration 作為較重搜索補充。',
  },
  'GSBS-602XUL': {
    recommended_rig_pairing: 'Micro Spoon / Micro Crankbait / Small Spoon',
    source: 'official_series_description_plus_spec_conservative',
    reliability: 'medium-low',
    source_note: 'Official variant description is series-level only; XUL, 0.4-3.5g, 1-3lb supports micro spoon/crank use conservatively.',
    guide_use_hint: '管釣 super-light：XUL、0.4-3.5g、1-3lb 對應 Micro Spoon / Micro Crankbait，重點是低負荷出線、短咬口承接和細線控魚。',
  },
  'GSBS-642UL': {
    recommended_rig_pairing: 'Spoon / Crankbait / Small Minnow',
    source: 'official_series_description_plus_spec_conservative',
    reliability: 'medium-low',
    source_note: 'Official variant description is series-level only; UL, 0.5-5g, 1.5-4lb supports standard area spoon/crank/minnow conservatively.',
    guide_use_hint: '管釣中量 lure：Spoon、Crankbait 和 Small Minnow 的拋投與回收穩定，兼顧細線操作和中距離控魚。',
  },
  'GSBS-672L': {
    recommended_rig_pairing: 'Full-size Spoon / Crankbait / Minnow',
    source: 'official_series_description_plus_spec_conservative',
    reliability: 'medium-low',
    source_note: 'Official variant description is series-level only; L, 0.6-7g, 2-5lb supports stronger area trout lures conservatively.',
    guide_use_hint: '管釣中大型 lure：Full-size Spoon、Crankbait 和 Minnow 負荷更高，長距離控線與大型 trout 控魚比小餌型號更有餘量。',
  },
  '26GBELPS-572XUL-S': {
    recommended_rig_pairing: 'Micro Spoon / Micro Crankbait / Vertical Spoon',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names micro spoon, micro crank, and vertical fishing.',
    guide_use_hint: '管釣 solid tip 微小餌：Micro Spoon、Micro Crankbait 在シビア狀況下更容易讓魚口殘留，Vertical Spoon 可利用 tubular 部分張力做縦釣り。',
  },
  '26GBELPS-582SUL-T': {
    recommended_rig_pairing: '1.6g Spoon / Crankbait / Twitching Plug',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names 1.6g spoon, crank/plug winding, and operation plugs.',
    guide_use_hint: '管釣掛け型巻き：1.6g Spoon 和 Crankbait 是常用主軸，張りを活かして掛けに行く；Twitching Plug 作為操作系 plug 補充。',
  },
  '26GBELPS-612UL-T': {
    recommended_rig_pairing: 'Heavy Spoon / Full-size Crankbait / Minnow Twitching',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names heavier spoons, full-size crank, and minnow twitching.',
    guide_use_hint: '管釣放流 / 大型 plug：Heavy Spoon、Full-size Crankbait 和 Minnow Twitching 負荷更高，出線和補刺要支撐大型 trout。',
  },
  '26GBELPS-642L-T': {
    recommended_rig_pairing: 'Large Plug / Full-size Spoon / Full-size Crankbait',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names large plugs and spoons for large trout in larger ponds.',
    guide_use_hint: '管釣大型 trout：Large Plug、Full-size Spoon 和 Full-size Crankbait 為主，較粗線徑與高負荷 lure 出線更穩。',
  },
  '26GBELPS-672SUL-T': {
    recommended_rig_pairing: 'Long Cast Spoon / Long Cast Crankbait / Minnow',
    source: 'official_description_conservative_expansion',
    reliability: 'medium-high',
    source_note: 'Official description says long-casting untouched offshore fish with broad lure action; spoon/crank/minnow are conservative area-trout splits.',
    guide_use_hint: '管釣遠投：Long Cast Spoon、Crankbait 和 Minnow 用於大池沖目搜索，長竿出線與遠距離控魚是重點。',
  },
  '24GBELUS-582XUL-T': {
    recommended_rig_pairing: 'Micro Spoon / Micro Crankbait',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names micro spoon and micro crankbait for steady retrieve.',
    guide_use_hint: '管釣 micro 巻き：Micro Spoon 和 Micro Crankbait 一定速 retrieve 是核心，XUL tubular 保持低負荷出線，柔軟性用來承接 short bite。',
  },
  '25GBELUS-612SUL-S': {
    recommended_rig_pairing: 'Slow Retrieve Spoon / Micro Crankbait / Spoon',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names spooning and micro-crank slow retrieve.',
    guide_use_hint: '管釣 slow retrieve：Slow Spoon 與 Micro Crankbait 是主軸，solid tip 讓 short bite 時 hook 留在口內，掛けた後由 belly 順暢吸收魚的反撲。',
  },
  '24GBELUS-622SUL-T': {
    recommended_rig_pairing: 'Vibration / Minnow Twitching / Spoon / Bottom Bump Plug',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names bottom bump, twitching, vibration, minnow, and spooning.',
    guide_use_hint: '管釣操作系 plug：Vibration、Minnow Twitching 和 Bottom Bump Plug 的抖動、跳底與停頓更清楚，也能切回 spooning。',
  },
  '24GBELUS-652UL-T': {
    recommended_rig_pairing: 'Long Cast Crankbait / Long Cast Spoon / Minnow',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description says long-cast offshore fish, plug range, spooning, and large trout support.',
    guide_use_hint: '管釣遠投 / 大型 trout：Long Cast Crankbait、Spoon 和 Minnow 覆蓋沖目魚群，張りのある blank 支撐遠距離補刺。',
  },
  '25GBELUS-682SUL-T': {
    recommended_rig_pairing: 'Long Cast Crankbait / Long Cast Spoon / Minnow Twitching',
    source: 'official_description',
    reliability: 'high',
    source_note: 'Official description names plugs, spoons, retrieve and operation fishing, plus long-cast offshore use.',
    guide_use_hint: '管釣最長尺遠投：Long Cast Crankbait、Spoon 和 Minnow Twitching 覆蓋大場沖目，回收、操作與控魚距離更清楚。',
  },
};

function rowFromHeaders(headers, row) {
  return headers.map((header) => row[header] ?? '');
}

function snapshotWithoutTargets(rows, targetFields) {
  return rows.map((row) => {
    const next = {};
    for (const [key, value] of Object.entries(row)) {
      if (!targetFields.has(key)) next[key] = value;
    }
    return next;
  });
}

function classifyFirst(pairing) {
  const first = n(pairing).split('/')[0].trim();
  if (/Texas|Punch|Wacky|Neko|Down Shot|No Sinker|Rubber Jig|Spoon|Crankbait|Minnow|Vibration|Jerkbait|Spinnerbait|Chatterbait|Swim Jig|Frog|Big Bait|Swimbait|Crawler|Topwater|Plug|Scone|Metal/i.test(first)) return first;
  return first || 'unknown';
}

function consistencyProblems(rows) {
  const problems = [];
  const overGeneric = /\b(General Lure|Light Rig|Hardbait|Soft Bait)\b/i;
  const genericGuide =
    /Bass 泛用：出線順暢、兼容多種線徑|Bass 精細：細線小餌出線更順|Bass 強力：粗線和高負荷路亞|管釣鱒魚：細線小餌出線更順/i;
  for (const row of rows) {
    const sku = n(row.SKU);
    const pairing = n(row.recommended_rig_pairing);
    const desc = n(row.Description);
    const guide = n(row.guide_use_hint);
    if (!pairing) problems.push({ sku, type: 'missing_pairing' });
    if (!guide) problems.push({ sku, type: 'missing_guide_use_hint' });
    if (overGeneric.test(pairing)) problems.push({ sku, type: 'over_generic_pairing', pairing });
    if (genericGuide.test(guide)) problems.push({ sku, type: 'generic_guide_use_hint', guide });

    const first = classifyFirst(pairing);
    const softFirst = /Texas|Punch|Wacky|Neko|Down Shot|No Sinker|Rubber Jig|Small Rubber Jig|Scone/i.test(first);
    const movingFirst = /Crankbait|Minnow|Vibration|Jerkbait|Spinnerbait|Chatterbait|Swim Jig|Frog|Big Bait|Swimbait|Crawler|Topwater|Plug|Metal|Spoon/i.test(first);
    if (softFirst && /硬餌搜索|巻物|moving|Crankbait|Minnow|Vibration/i.test(guide) && !/切|兼顧|cover finesse|障礙|打撃|補充|作為|主軸/i.test(guide)) {
      problems.push({ sku, type: 'soft_first_guide_conflict', first, guide });
    }
    if (movingFirst && /軟餌底操|底操/.test(guide) && !/切|兼顧|操作系|管釣/.test(guide)) {
      problems.push({ sku, type: 'moving_first_guide_conflict', first, guide });
    }

    const descMentions = [
      ['テキサス', 'Texas Rig'],
      ['パンチショット', 'Punch Shot Rig'],
      ['ワッキー', 'Wacky Rig'],
      ['ネコ', 'Neko Rig'],
      ['ノーシンカー', 'No Sinker'],
      ['虫系', 'Bug Lure'],
      ['スピナーベイト', 'Spinnerbait'],
      ['チャターベイト', 'Chatterbait'],
      ['ラバージグ', 'Rubber Jig'],
      ['スモラバ', 'Small Rubber Jig'],
      ['フロッグ', 'Frog'],
      ['ビッグベイト', 'Big Bait'],
      ['スイムベイト', 'Swimbait'],
      ['クローラーベイト', 'Crawler Bait'],
      ['バイブレーション', 'Vibration'],
      ['ジャークベイト', 'Jerkbait'],
      ['メタルジグ', 'Metal Jig'],
      ['メタルバイブ', 'Metal Vibration'],
      ['マイクロスプーン', 'Micro Spoon'],
      ['マイクロクランク', 'Micro Crankbait'],
      ['スプーン', 'Spoon'],
      ['クランク', 'Crankbait'],
      ['ミノー', 'Minnow'],
      ['ボトムバンプ', 'Bottom Bump'],
    ];
    for (const [needle, expected] of descMentions) {
      if (desc.includes(needle) && !pairing.toLowerCase().includes(expected.toLowerCase().split(' ')[0])) {
        problems.push({ sku, type: 'description_mention_not_reflected', needle, expected, pairing });
      }
    }
  }
  return problems;
}

function main() {
  const wb = XLSX.readFile(IMPORT_FILE);
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const beforeNonTargets = snapshotWithoutTargets(details, new Set(['recommended_rig_pairing', 'guide_use_hint']));
  const changed = [];
  const byField = {};

  function set(row, field, value) {
    const current = n(row[field]);
    const next = n(value);
    if (!next || current === next) return false;
    row[field] = next;
    byField[field] = (byField[field] || 0) + 1;
    return true;
  }

  for (const row of details) {
    const sku = n(row.SKU);
    const spec = RIG_BY_SKU[sku];
    if (!spec) continue;
    const fields = [];
    if (set(row, 'recommended_rig_pairing', spec.recommended_rig_pairing)) fields.push('recommended_rig_pairing');
    if (spec.guide_use_hint && set(row, 'guide_use_hint', spec.guide_use_hint)) fields.push('guide_use_hint');
    if (fields.length) {
      changed.push({
        id: n(row.id),
        sku,
        fields,
        recommended_rig_pairing: spec.recommended_rig_pairing,
        source: spec.source,
        reliability: spec.reliability,
        source_note: spec.source_note,
      });
    }
  }

  const afterNonTargets = snapshotWithoutTargets(details, new Set(['recommended_rig_pairing', 'guide_use_hint']));
  if (JSON.stringify(beforeNonTargets) !== JSON.stringify(afterNonTargets)) {
    throw new Error('unexpected non-target changes in rod_detail');
  }

  const missing = details.map((row) => n(row.SKU)).filter((sku) => !RIG_BY_SKU[sku]);
  if (missing.length) throw new Error(`missing rig pairing mapping: ${missing.join(', ')}`);

  const problems = consistencyProblems(details);
  if (problems.length) {
    throw new Error(`consistency check failed: ${JSON.stringify(problems, null, 2)}`);
  }

  wb.Sheets.rod = XLSX.utils.aoa_to_sheet([HEADERS.rodMaster, ...rods.map((row) => rowFromHeaders(HEADERS.rodMaster, row))]);
  wb.Sheets.rod_detail = XLSX.utils.aoa_to_sheet([HEADERS.rodDetail, ...details.map((row) => rowFromHeaders(HEADERS.rodDetail, row))]);
  XLSX.writeFile(wb, IMPORT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });

  const report = {
    generated_at: new Date().toISOString(),
    xlsx_file: path.relative(ROOT, IMPORT_FILE),
    target_fields: ['recommended_rig_pairing', 'guide_use_hint'],
    policy: {
      recommended_rig_pairing: 'Most suitable rigs/lures first, then suitable secondary options.',
      source_priority: ['official variant Description/specs', 'whitelist check', 'conservative inference from SKU/power/action/lure weight/type'],
      note: 'guide_use_hint is reviewed per SKU and follows explicit Description wording where available; generic template guidance is rejected by the consistency check.',
    },
    coverage: {
      rod_detail_rows: details.length,
      filled_recommended_rig_pairing: details.filter((row) => n(row.recommended_rig_pairing)).length,
      guide_use_hint_changed_rows: changed.filter((item) => item.fields.includes('guide_use_hint')).length,
    },
    changed_cells: changed.reduce((sum, item) => sum + item.fields.length, 0),
    changed_rows: changed.length,
    by_field: byField,
    source_counts: changed.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {}),
    changes: changed,
  };
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    report_file: path.relative(ROOT, REPORT_FILE),
    coverage: report.coverage,
    changed_cells: report.changed_cells,
    changed_rows: report.changed_rows,
    by_field: report.by_field,
    source_counts: report.source_counts,
  }, null, 2));
}

main();
