const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('./node_modules/xlsx');
const { HEADERS } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

const ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = gearDataPaths.resolveDataRaw('olympic_rod_import.xlsx');
const EVIDENCE_FILE = gearDataPaths.resolveDataRaw('olympic_rod_whitelist_player_evidence.json');
const REPORT_FILE = gearDataPaths.resolveDataRaw('olympic_rod_whitelist_player_backfill_report.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_olympic_rod_detail_groups.py');

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function evidenceItem({
  sku,
  sourceUrl,
  recordIds,
  confidence = 'medium',
  places = [],
  lures = [],
  lines = [],
  notes,
  environment,
  positioning,
  selling,
}) {
  return {
    sku,
    source_site: 'tackledb.uosoku.com',
    source_url: sourceUrl,
    source_record_urls: recordIds.map((id) => `https://tackledb.uosoku.com/tackle?id=${id}`),
    matched_category: 'バス釣り',
    target_fish: ['ブラックバス'],
    fishing_places: places,
    matched_lures: lures,
    matched_lines: lines,
    supported_fields: ['player_environment', 'player_positioning', 'player_selling_points'],
    confidence,
    notes,
    suggested: {
      player_environment: environment,
      player_positioning: positioning,
      player_selling_points: selling,
    },
  };
}

const SEARCH_SOURCES = {
  tackledb_vigore: 'https://tackledb.uosoku.com/collection?rod=%E3%83%93%E3%82%B4%E3%83%BC%E3%83%AC',
  tackledb_veloce_ux: 'https://tackledb.uosoku.com/collection?rod=%E3%83%99%E3%83%AD%E3%83%BC%E3%83%81%E3%82%A7UX',
  tackledb_super_bellezza: 'https://tackledb.uosoku.com/collection?rod=%E3%82%B9%E3%83%BC%E3%83%91%E3%83%BC%E3%83%99%E3%83%AC%E3%83%83%E3%83%84%E3%82%A1',
  tackledb_bellezza_ux: 'https://tackledb.uosoku.com/collection?rod=%E3%83%99%E3%83%AC%E3%83%83%E3%83%84%E3%82%A1UX',
  tackledb_bellezza_prototype: 'https://tackledb.uosoku.com/collection?rod=%E3%83%99%E3%83%AC%E3%83%83%E3%83%84%E3%82%A1%E3%83%97%E3%83%AD%E3%83%88%E3%82%BF%E3%82%A4%E3%83%97',
  rodsjp_vigore_search: 'https://rods.jp/?s=%E3%83%93%E3%82%B4%E3%83%BC%E3%83%AC',
  rodsearch_vigore_search: 'https://rodsearch.com/?s=%E3%83%93%E3%82%B4%E3%83%BC%E3%83%AC',
};

const EVIDENCE = [
  evidenceItem({
    sku: '20GVIGC-71H',
    sourceUrl: SEARCH_SOURCES.tackledb_vigore,
    recordIds: ['11176', '8568', '8547'],
    places: ['郷戸池', '小野湖', '竜華池'],
    lures: ['Texas rig', 'punch shot', 'jig spinner', 'cover jig', 'soft bait'],
    lines: ['14lb', '16lb', '20lb'],
    notes: '複数レコードが cover / heavy cover / 打撃系の使い方に集中。',
    environment: '淡水 / Bass / cover',
    positioning: '障礙 / 打撃',
    selling: 'cover 打撃取向清楚 / 德州、punch shot、jig spinner 與 14-20lb 線組搭配更常見',
  }),
  evidenceItem({
    sku: '20GVIGC-75M',
    sourceUrl: SEARCH_SOURCES.tackledb_vigore,
    recordIds: ['10429'],
    confidence: 'medium-low',
    places: ['津久井湖'],
    lures: ['hardbait', 'spinnerbait', 'Texas rig'],
    lines: ['16lb'],
    notes: '命中數較少，但白名單搭配與官網巻物/泛用描述一致。',
    environment: '淡水 / Bass / 巻物',
    positioning: '巻物 / 搜索',
    selling: 'hardbait、spinnerbait 與 Texas 泛用搭配 / 16lb 線組下搜索和打點都能覆蓋',
  }),
  evidenceItem({
    sku: '20GVIGC-76MH',
    sourceUrl: SEARCH_SOURCES.tackledb_vigore,
    recordIds: ['11133', '11118', '11103'],
    places: ['相模湖', '小野湖'],
    lures: ['spinnerbait', 'super slow roll', 'frog', 'moving bait'],
    lines: ['16lb', '18lb', 'PE6'],
    notes: '主證據集中在 spinnerbait / moving bait；frog 記錄作為強力餘量參考，不改成 frog 專項。',
    environment: '淡水 / Bass / 巻物',
    positioning: '巻物 / 搜索',
    selling: 'spinnerbait、moving bait 與 16-18lb 線組搭配 / 中重型巻物搜索更清楚',
  }),
  evidenceItem({
    sku: '20GVIGC-77XH',
    sourceUrl: SEARCH_SOURCES.tackledb_vigore,
    recordIds: ['11132', '11117', '11102'],
    places: ['相模湖', '小野湖'],
    lures: ['big bait', 'swimbait', 'crawler bait'],
    lines: ['20lb', '22lb'],
    notes: '複数レコードが big bait / swimbait / crawler bait に集中。',
    environment: '淡水 / Bass / 大餌',
    positioning: '大餌 / 強力',
    selling: 'big bait、swimbait、crawler bait 取向 / 20-22lb 線組下高負荷拋投與控魚餘量更明確',
  }),
  evidenceItem({
    sku: '20GVIGS-610ML',
    sourceUrl: SEARCH_SOURCES.tackledb_vigore,
    recordIds: ['8844', '6604', '11026'],
    places: ['相模湖', '西湖'],
    lures: ['light rig', 'no sinker', 'bug', 'huddle fly'],
    lines: ['PE0.6', '6lb leader'],
    notes: 'light rig / no sinker / 虫系など直柄精細用途が中心。',
    environment: '淡水 / Bass / 精細',
    positioning: '直柄精細泛用',
    selling: 'light rig、no sinker、虫系與小型 bait 搭配 / 6lb 級或 PE0.6 細線下精細操作更清楚',
  }),
  evidenceItem({
    sku: '20GVIGS-742M',
    sourceUrl: SEARCH_SOURCES.tackledb_vigore,
    recordIds: ['11131', '11116', '11101'],
    places: ['相模湖', '小野湖'],
    lures: ['light rig', 'crankbait', 'slow-roll spinnerbait', 'topwater'],
    lines: ['PE line', 'leader 12-16lb'],
    notes: 'PE 使用、long cast、plug / light rig 兼用の記述が揃う。',
    environment: '淡水 / Bass / PE遠投',
    positioning: '直柄遠投精細',
    selling: 'PE 遠投、light rig 與 plug 兼用 / 長距離控線和細微信號回收更清楚',
  }),
  evidenceItem({
    sku: '21GVELUC-65ML',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['8620'],
    confidence: 'medium-low',
    places: ['花蓮埤'],
    lures: ['small plug', 'shallow crank', 'cover bait finesse'],
    lines: ['10lb'],
    notes: '單筆證據明確提到 cover bait finesse，但也提示重 cover 力量不足。',
    environment: '淡水 / Bass / cover finesse',
    positioning: 'カバー精細',
    selling: 'cover bait finesse、小型 plug 與 shallow crank 取向 / 輕 cover 和精細硬餌更合適',
  }),
  evidenceItem({
    sku: '21GVELUC-69MH',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['11115', '11130', '11100'],
    places: ['相模湖', '小野湖'],
    lures: ['light Texas', 'spinnerbait', 'chatterbait'],
    lines: ['16lb', '20lb'],
    notes: 'versatile baitcast records align with 打撃 plus moving bait use.',
    environment: '淡水 / Bass / 泛用打撃',
    positioning: 'Bass 泛用 / 打撃',
    selling: 'light Texas、spinnerbait、chatterbait 都能覆蓋 / 16-20lb 線組下打撃與搜索兼顧',
  }),
  evidenceItem({
    sku: '21GVELUC-610M',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['7538', '8122'],
    places: ['入鹿池', '北浦'],
    lures: ['hardbait', 'spinnerbait', 'Texas rig'],
    lines: ['12lb'],
    notes: '白名單用法偏常規 baitcast 泛用。',
    environment: '淡水 / Bass / 泛用打撃',
    positioning: 'Bass 泛用 / 打撃',
    selling: 'hardbait、spinnerbait、Texas 等常用搭配 / 中量級 baitcast 泛用邊界更清楚',
  }),
  evidenceItem({
    sku: '21GVELUC-70H',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['9009', '8853', '8896'],
    places: ['池原ダム', '琵琶湖'],
    lures: ['cover game', 'heavy spinnerbait', 'frog'],
    lines: ['16lb', '18lb'],
    notes: 'cover game / frog / heavy spinnerbait 記錄支持障礙打撃定位。',
    environment: '淡水 / Bass / cover',
    positioning: '障礙 / 打撃',
    selling: 'cover game、heavy spinnerbait 和 frog 取向 / 16-18lb 線組下重 cover 控魚更有餘量',
  }),
  evidenceItem({
    sku: '21GVELUC-74X',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['11114', '11129', '11099'],
    places: ['相模湖', '小野湖'],
    lures: ['heavy Texas', 'big bait', 'swimbait'],
    lines: ['20lb', '22lb'],
    notes: 'heavy Texas / big bait / swimbait records align with X power.',
    environment: '淡水 / Bass / 大餌',
    positioning: '大餌 / 強力',
    selling: 'heavy Texas、big bait 與 swimbait 取向 / 20-22lb 線組支撐高負荷玩法',
  }),
  evidenceItem({
    sku: '21GVELUS-64L',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['9355'],
    confidence: 'medium-low',
    places: ['加古川'],
    lures: ['light rig', 'small plug'],
    lines: ['8lb'],
    notes: '單筆證據支持短尺直柄精細用途。',
    environment: '淡水 / Bass / 精細',
    positioning: '直柄精細泛用',
    selling: 'light rig、小型 plug 與 8lb 線組搭配 / 近中距離精細操作更順手',
  }),
  evidenceItem({
    sku: '21GVELUS-610ML',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['9504', '9148', '7042'],
    places: ['亀山湖', '豊英湖'],
    lures: ['light rig', 'long cast', 'finesse rig'],
    lines: ['PE0.6', '6lb leader'],
    notes: 'light rig / long cast / finesse records support long-cast finesse wording.',
    environment: '淡水 / Bass / 精細遠投',
    positioning: '直柄遠投精細',
    selling: 'light rig 遠投與 finesse rig 取向 / 細線長距離控線比一般直柄泛用更突出',
  }),
  evidenceItem({
    sku: '21GVELUS-611H-PF',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['7437'],
    confidence: 'medium-low',
    places: ['琵琶湖'],
    lures: ['heavy cover', 'power finesse'],
    lines: ['PE line'],
    notes: '單筆證據支持 power finesse / heavy cover spinning.',
    environment: '淡水 / Bass / power finesse',
    positioning: '障礙 / 打撃',
    selling: 'power finesse 與 heavy cover spinning 取向 / PE 線下 cover 內精細打撃更清楚',
  }),
  evidenceItem({
    sku: '21GVELUS-742M',
    sourceUrl: SEARCH_SOURCES.tackledb_veloce_ux,
    recordIds: ['7085'],
    confidence: 'medium-low',
    places: ['琵琶湖'],
    lures: ['light rig', 'spinnerbait'],
    lines: ['PE1', '14lb leader'],
    notes: '單筆證據顯示 PE1 + 14lb leader 的遠投泛用直柄搭配。',
    environment: '淡水 / Bass / PE遠投',
    positioning: '直柄遠投精細',
    selling: 'PE1 + 14lb leader、light rig 到 spinnerbait 兼用 / 遠投與回線效率更明確',
  }),
];

const MASTER_OVERRIDES = {
  OR1000: {
    player_positioning: '淡水 Bass / VIGORE / cover・巻物・大餌・PE遠投',
    player_selling_points: 'cover、巻物、big bait 與 PE 遠投分工清楚 / 適合按技法選擇槍柄或直柄型號',
  },
  OR1001: {
    player_positioning: '淡水 Bass / VELOCE UX / 泛用打撃・cover・大餌・power finesse',
    player_selling_points: 'cover、精細、遠投與大餌分工明確 / 入門主力線也能按技法和線組負荷選型',
  },
};

function buildEvidenceDocument(rows) {
  const evidenceBySku = new Map(EVIDENCE.map((item) => [item.sku, item]));
  const enrichedEvidence = [];
  const notCovered = [];

  for (const row of rows) {
    const sku = n(row.SKU);
    const evidence = evidenceBySku.get(sku);
    if (!evidence) {
      notCovered.push({
        id: n(row.id),
        rod_id: n(row.rod_id),
        sku,
        reason: /^OR100[234]$/.test(n(row.rod_id))
          ? 'Area Trout / Bellezza 系列在 tackledb、rods.jp、rodsearch 未找到有效型號級命中，保留官網衍生玩家字段。'
          : '未找到可直接對應的白名單型號級證據，保留官網衍生玩家字段。',
      });
      continue;
    }
    enrichedEvidence.push({
      id: n(row.id),
      rod_id: n(row.rod_id),
      sku,
      official_model: n(row.model),
      official_code_name: n(row['Code Name']),
      ...evidence,
    });
  }

  return {
    generated_at: new Date().toISOString(),
    brand_id: 113,
    brand: 'olympic',
    policy: {
      purpose: 'Whitelist auxiliary evidence is used only to refine player-facing interpretation fields.',
      applied_fields: ['rod.player_positioning', 'rod.player_selling_points', 'rod_detail.player_environment', 'rod_detail.player_positioning', 'rod_detail.player_selling_points'],
      not_applied: ['official_environment', 'spec fields', 'source_url', 'images'],
      confidence_note: 'tackledb includes user/AI-assisted tackle records, so confidence is capped at medium unless multiple records align with official positioning.',
    },
    source_summary: {
      useful: [
        {
          site: 'tackledb.uosoku.com',
          urls: [SEARCH_SOURCES.tackledb_vigore, SEARCH_SOURCES.tackledb_veloce_ux],
          usable_information: ['category バス釣り', 'target fish ブラックバス', 'model-level rod names', 'lure/rig examples', 'line examples', 'comments on cover, long cast, big bait, finesse use'],
        },
      ],
      checked_but_not_useful: [
        {
          site: 'tackledb.uosoku.com',
          urls: [SEARCH_SOURCES.tackledb_super_bellezza, SEARCH_SOURCES.tackledb_bellezza_ux, SEARCH_SOURCES.tackledb_bellezza_prototype],
          result: 'No effective Area Trout / Bellezza model-level records found.',
        },
        {
          site: 'rods.jp',
          urls: [SEARCH_SOURCES.rodsjp_vigore_search],
          result: 'Search page did not expose usable Olympic rod result records for this pass.',
        },
        {
          site: 'rodsearch.com',
          urls: [SEARCH_SOURCES.rodsearch_vigore_search],
          result: 'Search returned no usable Olympic result records for this pass.',
        },
      ],
    },
    evidence: enrichedEvidence,
    not_covered: notCovered,
  };
}

function main() {
  if (!fs.existsSync(IMPORT_FILE)) throw new Error(`Missing import workbook: ${IMPORT_FILE}`);
  const wb = XLSX.readFile(IMPORT_FILE);
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const evidenceDoc = buildEvidenceDocument(details);
  const evidenceBySku = new Map(evidenceDoc.evidence.map((item) => [n(item.sku), item]));
  const changed = [];
  const byField = {};

  function set(row, field, value, scope, id) {
    const current = n(row[field]);
    const next = n(value);
    if (!next || current === next) return;
    row[field] = next;
    const key = `${scope}.${field}`;
    byField[key] = (byField[key] || 0) + 1;
    changed.push({ scope, id, field, old_value: current, new_value: next });
  }

  for (const row of details) {
    const evidence = evidenceBySku.get(n(row.SKU));
    if (!evidence) continue;
    set(row, 'player_environment', evidence.suggested.player_environment, 'rod_detail', n(row.id));
    set(row, 'player_positioning', evidence.suggested.player_positioning, 'rod_detail', n(row.id));
    set(row, 'player_selling_points', evidence.suggested.player_selling_points, 'rod_detail', n(row.id));
  }

  for (const row of rods) {
    const override = MASTER_OVERRIDES[n(row.id)];
    if (!override) continue;
    set(row, 'player_positioning', override.player_positioning, 'rod', n(row.id));
    set(row, 'player_selling_points', override.player_selling_points, 'rod', n(row.id));
  }

  fs.writeFileSync(EVIDENCE_FILE, `${JSON.stringify(evidenceDoc, null, 2)}\n`);
  wb.Sheets.rod = XLSX.utils.json_to_sheet(rods, { header: HEADERS.rodMaster });
  wb.Sheets.rod_detail = XLSX.utils.json_to_sheet(details, { header: HEADERS.rodDetail });
  XLSX.writeFile(wb, IMPORT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });

  const report = {
    generated_at: new Date().toISOString(),
    xlsx_file: path.relative(ROOT, IMPORT_FILE),
    evidence_file: path.relative(ROOT, EVIDENCE_FILE),
    source_urls: SEARCH_SOURCES,
    evidence_rows_seen: evidenceDoc.evidence.length,
    not_covered_rows: evidenceDoc.not_covered.length,
    changed_cells: changed.length,
    changed_rows: new Set(changed.map((item) => `${item.scope}:${item.id}`)).size,
    by_field: byField,
    changes: changed,
  };
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    report_file: path.relative(ROOT, REPORT_FILE),
    evidence_file: path.relative(ROOT, EVIDENCE_FILE),
    evidence_rows_seen: report.evidence_rows_seen,
    not_covered_rows: report.not_covered_rows,
    changed_cells: report.changed_cells,
    changed_rows: report.changed_rows,
    by_field: report.by_field,
  }, null, 2));
}

main();
