const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('./node_modules/xlsx');
const { HEADERS } = require('./gear_export_schema');
const gearDataPaths = require('./gear_data_paths');

const ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = gearDataPaths.resolveDataRaw('evergreen_rod_import.xlsx');
const EVIDENCE_FILE = gearDataPaths.resolveDataRaw('evergreen_rod_whitelist_player_evidence.json');
const REPORT_FILE = gearDataPaths.resolveDataRaw('evergreen_rod_whitelist_player_backfill_report.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_evergreen_rod_detail_groups_stage2.py');

function n(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function lower(value) {
  return n(value).toLowerCase();
}

function sourceText(evidence) {
  return lower([
    evidence.source_product,
    evidence.source_handle,
    evidence.source_model,
    evidence.source_description,
    Object.values(evidence.source_specs || {}).join(' '),
  ].join(' '));
}

function environmentForEvidence(evidence, row) {
  const handle = lower(evidence.source_handle);
  const sku = n(row.SKU).toUpperCase();
  if (/zephyr/.test(handle)) return '海鲈 / 岸投 / 远投';
  if (/squidlaw/.test(handle)) return '木虾 / 乌贼';
  if (/superior|salty-sensation-neo/.test(handle)) return '轻型海水 / 精细';
  if (/poseidon/.test(handle)) {
    if (/^PSM[CS]/.test(sku)) return '船钓 / 鯛鱼 / Casting Tairaba';
    return '船钓 / 铁板';
  }
  if (/artisan-competition/.test(handle)) return '鳟鱼 / 管钓';
  if (/artisan-mountain-stream/.test(handle)) return '鳟鱼 / 溪流';
  return '淡水 / Bass';
}

function maxGram(row, evidence) {
  const text = [row['LURE WEIGHT'], evidence.source_specs?.['Lure Weight'], evidence.source_specs?.['Lure weight']]
    .map(n)
    .filter(Boolean)
    .join(' ');
  const nums = [...text.matchAll(/(\d+(?:\.\d+)?)\s*g/gi)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : 0;
}

function positioningFromEvidence(evidence, row) {
  const text = sourceText(evidence);
  const env = environmentForEvidence(evidence, row);
  const grams = maxGram(row, evidence);
  const power = n(row.POWER).toUpperCase();

  if (/frog|punching|heavy cover|big braid|heavy grass/.test(text)) return 'Frog / 重障碍';
  if (/swim\s*bait|swimbait|big bait|large spin jig|large sized|big mama/.test(text) || grams >= 84 || /XXH|XXXH/.test(power)) return '大饵 / 强力';
  if (/crank|lipless|chatter|spinner\s*bait|spinnerbait|buzz\s*bait|buzzbait|swimming jig|moving bait|top water|topwater|propeller|jerk/.test(text)) return '硬饵 / 搜索';
  if (/texas|carolina|jig|bottom|grass|cover|neko rig|soft bait/.test(text)) return '软饵 / 底操';
  if (/drop shot|dropshot|finesse|wacky|jig head|small jig|ultra[- ]?thin|lead-free|light texas|micro/.test(text)) return '精细轻饵';
  if (/long cast|long distance|shore|surf/.test(text)) return '远投搜索';

  if (/木虾/.test(env)) return /deep|vertical|metal|omorig|ikamet?al|sword tip/.test(text) ? '深场木虾 / 垂直精细' : '木虾 / 抽竿控线';
  if (/海鲈/.test(env)) return '中大型抛投';
  if (/轻型海水/.test(env)) return /rock|bottom|hard rock/.test(text) ? '轻海水 / 底操' : '精细轻饵';
  if (/船钓 \/ 铁板/.test(env)) {
    if (/slow|long fall/.test(text)) return '慢铁 / 船钓';
    if (/high pitch|spin jerker|real jerker/.test(text)) return '快抽铁板 / 船钓';
    return '船钓 / 铁板';
  }
  if (/鯛鱼/.test(env)) return 'Casting Tairaba / 船钓';
  if (/管钓/.test(env)) return /spoon|crank|vibration|minnow/.test(text) ? '管钓硬饵 / spoon-crank' : '鳟鱼精细轻饵';
  if (/溪流/.test(env)) return '山溪鳟鱼 / 精准抛投';

  if (/UL|L|ML/.test(power) || grams <= 10) return '精细轻饵';
  if (/XH|H|MH/.test(power) || grams >= 42) return '大饵 / 强力';
  return n(row.TYPE) === 'S' ? '直柄泛用' : '枪柄泛用';
}

function sellingPoints(env, positioning, evidence, row) {
  const desc = n(evidence.source_description);
  const specs = evidence.source_specs || {};
  const specBits = [
    specs.Power || row.POWER,
    specs['Lure Weight'] || specs['Lure weight'] || row['LURE WEIGHT'],
    specs['Line(lb)'] || specs.Line || row['Line Wt N F'],
  ].map(n).filter(Boolean).slice(0, 3);
  const specSuffix = specBits.length ? ` / 参考规格：${specBits.join(' / ')}` : '';

  if (desc) {
    if (/Frog|重障碍/.test(positioning)) return `Frog、heavy cover 或 punching 路线清楚 / 粗线强拉和障碍区控鱼更直接${specSuffix}`;
    if (/大饵/.test(positioning)) return `大饵、swimbait 或强力搜索取向明确 / 高负荷抛投与控鱼余量更充足${specSuffix}`;
    if (/硬饵|搜索|远投/.test(positioning)) return `topwater、jerkbait、spinnerbait、crank 或 long cast 更顺手 / 硬饵搜索和覆盖效率更高${specSuffix}`;
    if (/软饵|底操/.test(positioning)) return `Texas、jig、Carolina、grass 或 bottom 操作取向清楚 / 结构打点与底部感知更明确${specSuffix}`;
    if (/精细/.test(positioning)) return `finesse、drop shot、jig head 或轻线轻饵更顺手 / 小饵操控和咬口反馈更清楚${specSuffix}`;
  }

  if (/海鲈/.test(env)) return `海鲈岸投路线明确 / 远投、控线和中大型硬饵搜索更稳定${specSuffix}`;
  if (/木虾/.test(env)) return `木虾路线明确 / 抽竿、控线和深浅场分工更清楚${specSuffix}`;
  if (/轻型海水/.test(env)) return `轻海水精细路线明确 / 小饵、细线和咬口感知取向更清楚${specSuffix}`;
  if (/船钓/.test(env)) return `船钓铁板路线明确 / 抽停节奏、负荷控制和深场控线更稳定${specSuffix}`;
  if (/鳟鱼/.test(env)) return `鳟鱼场景明确 / 轻量硬饵、spoon 或溪流精准抛投分工更清楚${specSuffix}`;
  return `淡水 Bass 技法分工清楚 / 规格边界明确，便于按钓法搭配${specSuffix}`;
}

function masterForHandle(handle) {
  const h = lower(handle);
  if (/inspirare/.test(h)) return ['高端 Bass / 技法分工 / Kaleido Inspirare', 'Kaleido Inspirare 高端 Bass 技法线 / RS、GT、GT-R 等子型号边界清楚'];
  if (/phase/.test(h)) return ['Bass / Phase 主力技法线', '逐型号描述覆盖 topwater、spinnerbait、Texas、frog、drop shot 等技法 / 适合按技法搭配'];
  if (/serpenti/.test(h)) return ['Bass / 直柄精细 / Serpenti', '逐型号描述覆盖 jig head、drop shot、neko、long cast 等精细路线 / 直柄分工更清楚'];
  if (/orion/.test(h)) return ['Bass / Orion 技法分工', 'Orion 枪直柄型号覆盖完整 / 规格与型号昵称便于按技法选择'];
  if (/zephyr/.test(h)) return ['海鲈 / Zephyr Avantgarde / 岸投远投', 'Zephyr 海鲈岸投路线明确 / 长竿远投和控线定位清楚'];
  if (/squidlaw/.test(h)) return ['木虾 / Squidlaw Imperial', 'Squidlaw 木虾线定位清楚 / slack jerk、deep eging 和 boat/omorig 分工明确'];
  if (/superior|salty-sensation-neo/.test(h)) return ['轻型海水 / Salty Sensation', '轻海水精细路线清楚 / 小饵、细线和高感度取向明确'];
  if (/poseidon/.test(h)) return ['船钓 / Poseidon / Jigging', 'Poseidon 船钓铁板路线明确 / slow、high pitch、spin jerker 等分工清楚'];
  if (/light-cavarly/.test(h)) return ['Bass / Light Cavalry / 入门主力', 'Light Cavalry 覆盖常用枪直柄规格 / 日常 Bass 主力搭配更清楚'];
  if (/heracles-fact/.test(h)) return ['Bass / FACT / 福岛健技法线', 'FACT 技法线分工清楚 / 精细、solid tip 与强力型号都有对应选择'];
  if (/artisan-competition/.test(h)) return ['管钓鳟鱼 / Artisan Competition', '管钓鳟鱼路线明确 / spoon、crank、minnow 等轻量硬饵分工清楚'];
  if (/artisan-mountain-stream/.test(h)) return ['山溪鳟鱼 / Artisan Mountain Stream', '溪流鳟路线明确 / 短尺精准抛投和米诺操控更直接'];
  return ['', ''];
}

function officialFamilyOverride(row) {
  const sku = n(row.SKU).toUpperCase();
  const codeName = lower(row['Code Name']);
  if (/^(NIM|SSSS)/.test(sku)) {
    return {
      environment: '木虾 / 乌贼',
      positioning: /deep|sword tip|metal|draggin/i.test(codeName) ? '深场木虾 / 垂直精细' : '木虾 / 抽竿控线',
      selling: 'Squidlaw 木虾路线清楚 / 抽竿、控线、slack jerk 或深场精细分工更明确',
      master_positioning: '木虾 / Squidlaw',
      master_selling: 'Squidlaw 木虾路线明确 / shore、deep、omorig 与 slack jerk 分工清楚',
    };
  }
  if (/^(PREJ|PSLJ|PLFJ|PHPJ|PSPJ)/.test(sku)) {
    let positioning = '船钓 / 铁板';
    if (/slow|long fall/i.test(codeName) || /^(PSLJ|PLFJ)/.test(sku)) positioning = '慢铁 / 船钓';
    if (/high pitch/i.test(codeName) || /^PHPJ/.test(sku)) positioning = '快抽铁板 / 船钓';
    if (/spin jerker/i.test(codeName) || /^PSPJ/.test(sku)) positioning = 'Spin Jerker / 船钓铁板';
    return {
      environment: '船钓 / 铁板',
      positioning,
      selling: 'Poseidon 船钓铁板路线清楚 / 抽停节奏、负荷控制和深场控线更稳定',
      master_positioning: '船钓 / Poseidon / Jigging',
      master_selling: 'Poseidon jigging 路线明确 / slow、long fall、high pitch 与 spin jerker 分工清楚',
    };
  }
  return null;
}

function main() {
  const evidenceData = JSON.parse(fs.readFileSync(EVIDENCE_FILE, 'utf8'));
  const evidenceById = new Map();
  for (const item of evidenceData.evidence || []) evidenceById.set(n(item.id), item);

  const wb = XLSX.readFile(IMPORT_FILE);
  const rods = XLSX.utils.sheet_to_json(wb.Sheets.rod, { defval: '' });
  const details = XLSX.utils.sheet_to_json(wb.Sheets.rod_detail, { defval: '' });
  const rodById = new Map(rods.map((row) => [n(row.id), row]));
  const changed = [];
  const byField = {};
  const seenHandlesByRodId = new Map();

  function set(row, field, value, scope, id) {
    const current = n(row[field]);
    const next = n(value);
    if (!next || current === next) return;
    row[field] = next;
    byField[`${scope}.${field}`] = (byField[`${scope}.${field}`] || 0) + 1;
    changed.push({ scope, id, field, old_value: current, new_value: next });
  }

  for (const row of details) {
    const evidence = evidenceById.get(n(row.id));
    if (!evidence) continue;
    const env = environmentForEvidence(evidence, row);
    const positioning = positioningFromEvidence(evidence, row);
    const selling = sellingPoints(env, positioning, evidence, row);
    set(row, 'player_environment', env, 'rod_detail', n(row.id));
    set(row, 'player_positioning', positioning, 'rod_detail', n(row.id));
    set(row, 'player_selling_points', selling, 'rod_detail', n(row.id));

    const handles = seenHandlesByRodId.get(n(row.rod_id)) || new Set();
    handles.add(evidence.source_handle);
    seenHandlesByRodId.set(n(row.rod_id), handles);
  }

  for (const row of details) {
    const override = officialFamilyOverride(row);
    if (!override) continue;
    set(row, 'player_environment', override.environment, 'rod_detail', n(row.id));
    set(row, 'player_positioning', override.positioning, 'rod_detail', n(row.id));
    set(row, 'player_selling_points', override.selling, 'rod_detail', n(row.id));
    const master = rodById.get(n(row.rod_id));
    if (master) {
      set(master, 'player_positioning', override.master_positioning, 'rod', n(master.id));
      set(master, 'player_selling_points', override.master_selling, 'rod', n(master.id));
    }
  }

  for (const rod of rods) {
    const handles = seenHandlesByRodId.get(n(rod.id));
    if (!handles || !handles.size) continue;
    const handle = [...handles][0];
    const [positioning, selling] = masterForHandle(handle);
    set(rod, 'player_positioning', positioning, 'rod', n(rod.id));
    set(rod, 'player_selling_points', selling, 'rod', n(rod.id));
  }

  wb.Sheets.rod = XLSX.utils.json_to_sheet(rods, { header: HEADERS.rodMaster });
  wb.Sheets.rod_detail = XLSX.utils.json_to_sheet(details, { header: HEADERS.rodDetail });
  XLSX.writeFile(wb, IMPORT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });

  const report = {
    generated_at: new Date().toISOString(),
    xlsx_file: path.relative(ROOT, IMPORT_FILE),
    evidence_file: path.relative(ROOT, EVIDENCE_FILE),
    evidence_rows_seen: evidenceById.size,
    changed_cells: changed.length,
    changed_rows: new Set(changed.map((item) => `${item.scope}:${item.id}`)).size,
    by_field: byField,
    policy: {
      applied_fields: ['rod.player_positioning', 'rod.player_selling_points', 'rod_detail.player_environment', 'rod_detail.player_positioning', 'rod_detail.player_selling_points'],
      not_applied: ['official_environment', 'AdminCode', 'JAN/source_jan_or_retail_sku'],
      source_boundary: 'Plus Fishing whitelist evidence is used only for player-facing interpretation fields.',
    },
    changes: changed,
  };
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    report_file: path.relative(ROOT, REPORT_FILE),
    evidence_rows_seen: report.evidence_rows_seen,
    changed_cells: report.changed_cells,
    changed_rows: report.changed_rows,
    by_field: report.by_field,
  }, null, 2));
}

main();
