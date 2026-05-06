const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('xlsx');
const gearDataPaths = require('./gear_data_paths');

const REPO_ROOT = path.resolve(__dirname, '..');
const IMPORT_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_reels_import.xlsx');
const SUMMARY_FILE = gearDataPaths.resolveDataRaw('shimano_baitcasting_thickening_14_summary.json');

const STEPS = [
  'scripts/build_shimano_bc_whitelist_source_index.js',
  'scripts/apply_shimano_bc_whitelist_master_stage1.js',
  'scripts/apply_shimano_bc_whitelist_master_stage2.js',
  'scripts/apply_shimano_bc_main_gear_material_stage6.js',
  'scripts/apply_shimano_bc_body_material_stage7.js',
  'scripts/apply_shimano_bc_spool_weight_stage4.js',
];

const MASTER_FIELDS = [
  'model_year',
  'alias',
  'series_positioning',
  'main_selling_points',
  'player_positioning',
  'player_selling_points',
];

const DETAIL_FIELDS = [
  'body_material',
  'body_material_tech',
  'main_gear_material',
  'spool_weight_g',
  'handle_hole_spec',
  'knob_bearing_spec',
  'EV_link',
  'Specs_link',
];

function countFilled(rows, field) {
  return rows.filter((row) => String(row[field] || '').trim()).length;
}

function main() {
  const backupPath = path.resolve(
    gearDataPaths.dataRawDir,
    `shimano_baitcasting_reels_import_14字段补厚前备份_${new Date()
      .toISOString()
      .replace(/[:T]/g, '-')
      .slice(0, 19)}.xlsx`
  );

  fs.copyFileSync(IMPORT_FILE, backupPath);

  const stepOutputs = [];
  for (const step of STEPS) {
    const absolute = path.resolve(REPO_ROOT, step);
    const output = execFileSync('node', [absolute], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    stepOutputs.push({
      step,
      output: output.trim(),
    });
  }

  const wb = XLSX.readFile(IMPORT_FILE);
  const masterRows = XLSX.utils.sheet_to_json(wb.Sheets['reel'], { defval: '' });
  const detailRows = XLSX.utils.sheet_to_json(wb.Sheets['baitcasting_reel_detail'], { defval: '' });

  const summary = {
    generated_at: new Date().toISOString(),
    import_file: path.relative(REPO_ROOT, IMPORT_FILE),
    backup_file: path.relative(REPO_ROOT, backupPath),
    master_total: masterRows.length,
    detail_total: detailRows.length,
    master_fields: Object.fromEntries(MASTER_FIELDS.map((field) => [field, countFilled(masterRows, field)])),
    detail_fields: Object.fromEntries(DETAIL_FIELDS.map((field) => [field, countFilled(detailRows, field)])),
    steps: stepOutputs,
  };

  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
}

main();
