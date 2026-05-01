const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { SHEET_NAMES, HEADERS } = require('./gear_export_schema');

const REPO_ROOT = '/Users/tommy/GearSage';
const IMPORT_FILE = path.join(REPO_ROOT, 'GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import.xlsx');
const EVIDENCE_FILE = path.join(REPO_ROOT, 'GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_player_fields_evidence.json');
const REPORT_FILE = path.join(REPO_ROOT, 'GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_player_fields_report.md');

const SOURCE_EVALUATION = [
  {
    source_site: 'japantackle.com',
    whitelist_role: 'dealer_structured',
    status: 'usable_exact_series_partial',
    usable_information: [
      'current or near-current JDM series title',
      'model year/version phrase',
      'short positioning phrase such as high-end, heavy duty, solid spinning, finesse',
      'description/meta snippets about AirDrive, MQ, saltwater, body/gear/rotor technology',
    ],
    limitation: 'Only covers a small subset of the current Daiwa Taiwan 33 spinning reel list.',
  },
  {
    source_site: 'jdmfishing.com',
    whitelist_role: 'reference_catalog',
    status: 'not_applied',
    usable_information: ['brand/category navigation only in current probe'],
    limitation: 'Search/category pages did not provide stable model-level pages for the current 33 reel list.',
  },
  {
    source_site: 'tackletour.com',
    whitelist_role: 'community_reference',
    status: 'sidecar_background_only',
    usable_information: ['historic review language about smoothness, drag, fresh/brackish versatility'],
    limitation: 'Available Daiwa Certate review is a 2005 generation page, too old to bind to current 2024/2026 products.',
  },
];

const JAPANTACKLE_EVIDENCE = {
  DRE1001: {
    source_url: 'https://japantackle.com/spinning-reels/daiwa/reg0000341.html',
    matched_context: 'Daiwa 23 Saltiga spinning Air Drive MQ 4000-6000 size; saltwater fine; aluminum alloy MQ body and G1 extra strong Duralumin tough gear.',
    supported_fields: ['player_positioning', 'player_selling_points'],
    confidence: 'high',
  },
  DRE1002: {
    source_url: 'https://japantackle.com/spinning-reels/daiwa/reg0000323.html',
    matched_context: 'Daiwa 22 Exist Air Drive Design; high-end Daiwa spinning.',
    supported_fields: ['player_positioning', 'player_selling_points'],
    confidence: 'high',
  },
  DRE1005: {
    source_url: 'https://japantackle.com/spinning-reels/daiwa/reg0000352.html',
    matched_context: 'Daiwa 24 Certate SW heavy duty AirDrive model 4000-6000 size; SW heavy duty context.',
    supported_fields: ['player_positioning', 'player_selling_points'],
    confidence: 'high',
  },
  DRE1009: {
    source_url: 'https://japantackle.com/spinning-reels/daiwa/reg0000346.html',
    matched_context: 'Daiwa 24 Certate AirDrive Design; solid spinning with feather like operation.',
    supported_fields: ['player_positioning', 'player_selling_points'],
    confidence: 'high',
  },
};

const PLAYER_FIELDS = {
  DRE1000: {
    player_positioning: '远海大物 / 重型铁板与搏鱼旗舰',
    player_selling_points: '高负荷持续收线 / 大线容量与高拖力 / 面向 GT、金枪、青物等重型海水场景',
  },
  DRE1001: {
    player_positioning: '近海青物 / 岸船两用高端 SW',
    player_selling_points: 'AirDrive MQ 与高刚性机身 / 4000-6000 覆盖海鲈、青物、轻铁板和近海抛投',
  },
  DRE1002: {
    player_positioning: '高端轻量泛用旗舰',
    player_selling_points: '轻量和低惯性手感突出 / 适合淡海水高感度精细到中量级泛用',
  },
  DRE1003: {
    player_positioning: '大型 SW 强力泛用 / 近海远海搏鱼',
    player_selling_points: '大尺寸线杯和高拖力 / 8000-20000 覆盖远投青物、GT、金枪和重型船岸场景',
  },
  DRE1004: {
    player_positioning: '全铝高刚性泛用 / 中大型淡海水',
    player_selling_points: '金属机身抗负荷更强 / 适合海鲈、岸投、轻近海和需要稳定收线的中大型路亚',
  },
  DRE1005: {
    player_positioning: '中型 SW 岸投 / 近海主力',
    player_selling_points: 'SW 防护和强度取向明确 / 4000-6000 覆盖海鲈、青物、轻铁板和近海泛用',
  },
  DRE1006: {
    player_positioning: '远投投钓 / 滩钓高端',
    player_selling_points: '45 规格远投线杯 / QD 快速卸力 / 适合滩钓、远投底钓和大物投钓',
  },
  DRE1007: {
    player_positioning: '轻量高端淡海水泛用',
    player_selling_points: '低惯性启动和轻量手感 / Bass、轻盐、鳟鱼和日常泛用路亚切换更顺',
  },
  DRE1008: {
    player_positioning: '超轻量精细技巧向',
    player_selling_points: '小型轻量和低启动惯性 / 适合 finesse、轻饵、细线和高频操作',
  },
  DRE1009: {
    player_positioning: '高刚性全能主力 / 次旗舰泛用',
    player_selling_points: '金属单体机身和轻快操作兼顾 / 淡海水泛用、海鲈和中量级路亚都能覆盖',
  },
  DRE1010: {
    player_positioning: '木虾高端轻量',
    player_selling_points: '轻量和线感取向明确 / 秋季小木虾到常规木虾节奏更清楚',
  },
  DRE1011: {
    player_positioning: '轻量中高端泛用',
    player_selling_points: '轻量启停和泛用尺寸覆盖 / Bass、鳟鱼、轻盐和日常路亚都适合',
  },
  DRE1012: {
    player_positioning: '高性价比 SW 强力泛用',
    player_selling_points: '中大型海水尺寸覆盖 / 兼顾价格、强度和耐用 / 岸投与近海青物友好',
  },
  DRE1013: {
    player_positioning: '精细轻量技巧向',
    player_selling_points: '小型轻量和细线手感 / 适合 trout、bass finesse、light game 等轻负荷场景',
  },
  DRE1014: {
    player_positioning: '远投投钓 / 岸钓主力',
    player_selling_points: '35 规格远投取向 / 细线 PE 与 QD 型号分支清楚 / 适合滩钓和防波堤远投',
  },
  DRE1015: {
    player_positioning: '中阶淡海水泛用主力',
    player_selling_points: '价格、重量和耐用平衡 / 多尺寸覆盖淡水路亚、轻盐和日常泛用',
  },
  DRE1016: {
    player_positioning: '强力远投投钓 / QD 速卸力',
    player_selling_points: 'QD 快速卸力和大线容量 / 适合 surf casting、大物底钓和远投投钓',
  },
  DRE1017: {
    player_positioning: '轻盐 light game / 竹荚鱼根鱼',
    player_selling_points: '小型轻量和细线友好 / 微小饵操作、咬口感知和港内轻盐更清楚',
  },
  DRE1018: {
    player_positioning: '淡水 Bass 专向纺车',
    player_selling_points: 'Bass finesse 和轻量泛用取向 / 适合软饵、细线和日常淡水路亚',
  },
  DRE1019: {
    player_positioning: '入门到中阶海水强力耐用',
    player_selling_points: '大尺寸和耐用取向 / 性价比 SW 选择 / 船岸海水泛用和大物入门',
  },
  DRE1020: {
    player_positioning: '轻中型淡海水泛用 / 入门进阶',
    player_selling_points: 'LT 尺寸覆盖广 / 适合日常路亚、轻盐和入门进阶泛用',
  },
  DRE1021: {
    player_positioning: '大众级轻量泛用',
    player_selling_points: '轻量手感和价格平衡 / 淡水、轻盐和常规路亚场景覆盖广',
  },
  DRE1022: {
    player_positioning: '木虾入门主力',
    player_selling_points: '2500 系木虾规格明确 / 双摇臂型号可选 / 性价比木虾入门友好',
  },
  DRE1023: {
    player_positioning: '远投投钓入门 / 普及',
    player_selling_points: '35 规格远投取向 / 细线和粗线型号分支 / 适合基础滩钓远投',
  },
  DRE1024: {
    player_positioning: '活饵 / 乌贼 BR 后卸力',
    player_selling_points: 'BR freespool 取向明确 / 适合活饵、Aori 乌贼和需要放线等待的场景',
  },
  DRE1025: {
    player_positioning: '远投大物投钓普及',
    player_selling_points: '大线容量和强力规格 / 面向 surf、堤岸远投和大物底钓入门',
  },
  DRE1026: {
    player_positioning: '入门泛用纺车',
    player_selling_points: '尺寸覆盖广且门槛低 / 适合淡水、轻盐和日常路亚新手主力',
  },
  DRE1027: {
    player_positioning: '轻量远投投钓入门',
    player_selling_points: '细线 / 太线分支清楚 / 面向基础 surf 投钓和防波堤远投',
  },
  DRE1028: {
    player_positioning: '入门泛用纺车',
    player_selling_points: '低门槛多尺寸 / 淡水、海边基础路亚和备用轮友好',
  },
  DRE1029: {
    player_positioning: '微型泛用 / 溪流小物',
    player_selling_points: '750/1000 小尺寸轻便 / 适合小物钓、溪流和低负荷入门玩法',
  },
  DRE1030: {
    player_positioning: '入门附 PE 线即用',
    player_selling_points: '出厂附 PE 线降低上手成本 / 适合轻盐、淡水和新手即用场景',
  },
  DRE1031: {
    player_positioning: '大物岸投 / 矶岸强力',
    player_selling_points: '大线容量和强力规格 / 面向 Taman、大物底钓和岸边重负荷场景',
  },
  DRE1032: {
    player_positioning: '入门泛用 / 旅行备用',
    player_selling_points: '基础规格和低门槛 / 适合淡水、轻盐、备用轮和入门日常使用',
  },
};

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function assertHeaders(workbook) {
  for (const [sheetName, expectedHeaders] of [
    [SHEET_NAMES.reel, HEADERS.reelMaster],
    [SHEET_NAMES.spinningReelDetail, HEADERS.spinningReelDetail],
  ]) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const actual = rows[0] || [];
    if (actual.join('|') !== expectedHeaders.join('|')) {
      throw new Error(`${sheetName} headers mismatch`);
    }
  }
}

function buildEvidence(reelRows) {
  return {
    generated_at: new Date().toISOString(),
    source_evaluation: SOURCE_EVALUATION,
    policy: {
      target_fields: ['reel.player_positioning', 'reel.player_selling_points'],
      official_fields_not_overwritten: true,
      no_source_notes_in_player_fields: true,
      evidence_sidecar_only: true,
      apply_scope: 'Daiwa Taiwan spinning reel master rows only',
    },
    items: reelRows.map((row) => {
      const whitelist = JAPANTACKLE_EVIDENCE[row.id] || null;
      const sourceType = whitelist ? 'whitelist_japantackle_exact_series' : 'official_description_and_series_inference';
      return {
        reel_id: row.id,
        model: row.model,
        applied_fields: {
          player_positioning: row.player_positioning,
          player_selling_points: row.player_selling_points,
        },
        source_type: sourceType,
        source_site: whitelist ? 'japantackle.com' : 'daiwa.com/tw',
        source_url: whitelist ? whitelist.source_url : '',
        matched_context: whitelist ? whitelist.matched_context : 'Applied from official Daiwa Taiwan model family, official description/spec boundaries, SKU size ranges, and conservative GearSage reel player taxonomy.',
        confidence: whitelist ? whitelist.confidence : 'medium',
      };
    }),
  };
}

function writeReport(evidence) {
  const withWhitelist = evidence.items.filter((item) => item.source_type === 'whitelist_japantackle_exact_series');
  const officialDerived = evidence.items.filter((item) => item.source_type !== 'whitelist_japantackle_exact_series');
  const lines = [
    '# Daiwa Taiwan Spinning Reel Player Field Backfill Report',
    '',
    `- Generated at: ${evidence.generated_at}`,
    '- Target fields: `reel.player_positioning`, `reel.player_selling_points`',
    '- Import file: `/Users/tommy/GearSage/GearSage-client/pkgGear/data_raw/daiwa_spinning_reels_import.xlsx`',
    '',
    '## Whitelist Source Usefulness',
    ...SOURCE_EVALUATION.map((source) => `- ${source.source_site}: ${source.status}; ${source.limitation}`),
    '',
    '## Applied Coverage',
    `- Master rows filled: ${evidence.items.length}/${evidence.items.length}`,
    `- JapanTackle exact-series support: ${withWhitelist.length}`,
    `- Official/series conservative inference: ${officialDerived.length}`,
    '',
    '## JapanTackle Supported Rows',
    ...withWhitelist.map((item) => `- ${item.reel_id} ${item.model}: ${item.matched_context} (${item.source_url})`),
    '',
    '## Guardrails',
    '- White-list evidence stays in sidecar JSON/report; it is not written as source text into player fields.',
    '- JDMFishing current probe did not provide stable model-level evidence for these rows.',
    '- TackleTour current useful page was historic Certate background only, not applied to current generation rows.',
  ];
  fs.writeFileSync(REPORT_FILE, `${lines.join('\n')}\n`);
}

function main() {
  const workbook = XLSX.readFile(IMPORT_FILE);
  assertHeaders(workbook);
  const reelRows = XLSX.utils.sheet_to_json(workbook.Sheets[SHEET_NAMES.reel], { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(workbook.Sheets[SHEET_NAMES.spinningReelDetail], { defval: '' });

  const missing = reelRows.filter((row) => !PLAYER_FIELDS[row.id]);
  if (missing.length) {
    throw new Error(`Missing player field config for: ${missing.map((row) => `${row.id} ${row.model}`).join(', ')}`);
  }

  for (const row of reelRows) {
    const fields = PLAYER_FIELDS[row.id];
    row.player_positioning = fields.player_positioning;
    row.player_selling_points = fields.player_selling_points;
  }

  const workbookOut = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbookOut, XLSX.utils.json_to_sheet(reelRows, { header: HEADERS.reelMaster }), SHEET_NAMES.reel);
  XLSX.utils.book_append_sheet(workbookOut, XLSX.utils.json_to_sheet(detailRows, { header: HEADERS.spinningReelDetail }), SHEET_NAMES.spinningReelDetail);
  XLSX.writeFile(workbookOut, IMPORT_FILE);

  const evidence = buildEvidence(reelRows);
  fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2));
  writeReport(evidence);

  console.log(`Applied Daiwa spinning player fields: ${reelRows.length}/${reelRows.length}`);
  console.log(`JapanTackle exact-series evidence: ${evidence.items.filter((item) => item.source_type === 'whitelist_japantackle_exact_series').length}`);
  console.log(`Evidence: ${EVIDENCE_FILE}`);
  console.log(`Report: ${REPORT_FILE}`);
}

main();
