const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const XLSX = require('./node_modules/xlsx');
const { HEADERS } = require('./gear_export_schema');

const IMPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_import.xlsx');
const NORMALIZED_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rods_normalized.json');
const REPORT_FILE = path.join(__dirname, '../GearSage-client/pkgGear/data_raw/abu_rod_recommended_rig_pairing_report.json');
const SHADE_SCRIPT = path.join(__dirname, 'shade_abu_rod_detail_groups.py');

const BANNED_GENERIC = /\b(?:General Lure|Light Rig|Hardbait|Soft Bait)\b/i;

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

function powerBand(power) {
  const text = n(power).toUpperCase();
  if (/XUL|SUL|UL|L|ML/.test(text)) return 'light';
  if (/XXH|XH|\bH\b|MH\+|MH/.test(text)) return 'heavy';
  return 'medium';
}

function actionFamily(action) {
  const text = lower(action);
  if (/moderate/.test(text)) return 'moving';
  if (/extra fast/.test(text)) return 'bottom';
  if (/fast/.test(text)) return 'bottom';
  return 'versatile';
}

function parseLineMax(line) {
  const nums = n(line).match(/\d+(?:\.\d+)?/g) || [];
  return nums.length ? Math.max(...nums.map(Number)) : 0;
}

function normalizedText(item) {
  return [item?.model, item?.description, ...(item?.features || [])].map(n).filter(Boolean).join(' ');
}

function buildModelIndex(normalized) {
  return new Map(normalized.map((item) => [n(item.model), item]));
}

function source(type, reason, confidence) {
  return { source_type: type, source_note: reason, confidence };
}

function explicitPairing(model, row, item) {
  const modelText = lower(model);
  const sku = n(row.SKU).toUpperCase();
  const text = `${model} ${sku} ${row['Code Name']} ${row.Description} ${normalizedText(item)}`;
  const textLower = lower(text);
  const maxLine = parseLineMax(row['Line Wt N F']);

  if (/ice/.test(textLower)) {
    return {
      value: pairing(['Ice Jig', 'Jigging Spoon', 'Jigging Minnow']),
      ...source('official_model', 'Official Ice model/description supports ice jigging baits.', 'medium'),
    };
  }

  if (/frog/.test(textLower)) {
    return {
      value: pairing(['Frog', 'Punching', 'Heavy Texas', 'Swim Jig']),
      ...source('official_model', 'Official Frog model supports heavy cover frog use; secondary rigs are conservative bass cover pairings.', 'medium'),
    };
  }

  if (/flipping|hunter shryock/.test(textLower)) {
    return {
      value: pairing(['Flipping Jig', 'Punching', 'Heavy Texas', 'Creature Bait']),
      ...source('official_model', 'Official Flipping/Pitching description supports heavy cover bottom-contact use.', 'medium'),
    };
  }

  if (/beast/.test(textLower)) {
    if (/BSTM/.test(sku) || /XXH|XH/.test(n(row.POWER).toUpperCase()) || maxLine >= 40) {
      return {
        value: pairing(['Muskie Swimbait', 'Big Bait', 'Large Soft Swimbait', 'Bucktail']),
        ...source('official_model', 'Official Beast description references big baits, swimbaits, muskie, and pounder-style baits.', 'medium'),
      };
    }
    return {
      value: pairing(['Swimbait', 'Big Bait', 'Large Soft Swimbait', 'Heavy Spinnerbait']),
      ...source('official_model', 'Official Beast description references big baits and swimbaits for bass and larger fish.', 'medium'),
    };
  }

  if (/bfs/.test(textLower) && /winch|delay/.test(textLower)) {
    return {
      value: pairing(['Small Crankbait', 'Shad', 'Small Minnow', 'No Sinker', 'Neko Rig']),
      ...source('official_model', 'Official BFS Winch model combines lightweight bait and winch/moving-bait cues.', 'medium'),
    };
  }

  if (/bfs/.test(textLower)) {
    const rigs = row.TYPE === 'S'
      ? ['Neko Rig', 'Down Shot', 'No Sinker', 'Small Minnow', 'Small Crankbait']
      : ['Small Minnow', 'Shad', 'Small Crankbait', 'Neko Rig', 'No Sinker'];
    return {
      value: pairing(rigs),
      ...source('official_model', 'Official BFS description supports ultra-lightweight bait use.', 'medium'),
    };
  }

  if (/winch/.test(textLower)) {
    return {
      value: pairing(['Crankbait', 'Shad', 'Spinnerbait', 'Chatterbait', 'Vibration']),
      ...source('official_model', 'Official Winch model/description supports crankbait and moving-bait use.', 'medium'),
    };
  }

  if (/delay/.test(textLower)) {
    return {
      value: pairing(['Crankbait', 'Jerkbait', 'Spinnerbait', 'Chatterbait', 'Topwater Plug']),
      ...source('official_model', 'Official Delay description supports reaction bait and moving-bait use.', 'medium'),
    };
  }

  if (/finesse/.test(textLower)) {
    return {
      value: pairing(['Down Shot', 'Neko Rig', 'Wacky Rig', 'No Sinker', 'Small Jighead']),
      ...source('official_model', 'Official Finesse description supports lightweight finesse bait presentations.', 'medium'),
    };
  }

  if (/ike signature power|power fishing/.test(textLower)) {
    return {
      value: pairing(['Spinnerbait', 'Chatterbait', 'Swim Jig', 'Texas Rig', 'Rubber Jig']),
      ...source('official_model', 'Official Ike Power description supports reaction baits and power fishing techniques.', 'medium'),
    };
  }

  return null;
}

function skuCuePairing(model, row) {
  const sku = n(row.SKU).toUpperCase();

  if (/BFCW/.test(sku)) {
    return {
      value: pairing(['Small Crankbait', 'Shad', 'Small Minnow', 'No Sinker', 'Neko Rig']),
      ...source('official_sku_cue', 'SKU contains BFCW, matching bait-finesse casting winch route.', 'medium'),
    };
  }

  if (/BFC|BFS/.test(sku)) {
    return {
      value: pairing(['Small Minnow', 'Shad', 'Small Crankbait', 'Neko Rig', 'No Sinker']),
      ...source('official_sku_cue', 'SKU contains bait-finesse cue; pairing is constrained by type and line rating.', 'medium'),
    };
  }

  if (/FLP/.test(sku)) {
    return {
      value: pairing(['Flipping Jig', 'Punching', 'Heavy Texas', 'Creature Bait']),
      ...source('official_sku_cue', 'SKU contains flipping cue.', 'medium'),
    };
  }

  if (/CF/.test(sku)) {
    return {
      value: pairing(['Frog', 'Punching', 'Heavy Texas', 'Swim Jig']),
      ...source('official_sku_cue', 'SKU contains frog/cover cue.', 'medium'),
    };
  }

  if (/BJ/.test(sku)) {
    return {
      value: pairing(['Chatterbait', 'Swim Jig', 'Spinnerbait', 'Vibration']),
      ...source('official_sku_cue', 'SKU contains BJ cue, treated as bladed-jig/moving-bait route.', 'low'),
    };
  }

  if (/TW/.test(sku)) {
    return {
      value: pairing(['Topwater Plug', 'Jerkbait', 'Spinnerbait', 'Chatterbait']),
      ...source('official_sku_cue', 'SKU contains TW cue, treated as topwater/moving-bait route.', 'low'),
    };
  }

  if (/CW|W70|W71|W72|W76/.test(sku)) {
    return {
      value: pairing(['Crankbait', 'Shad', 'Spinnerbait', 'Chatterbait', 'Vibration']),
      ...source('official_sku_cue', 'SKU contains W/Winch cue and action supports moving baits.', 'medium'),
    };
  }

  return null;
}

function conservativePairing(row) {
  const type = n(row.TYPE);
  const band = powerBand(row.POWER);
  const action = actionFamily(row.Action);

  if (type === 'S') {
    if (band === 'light') {
      return pairing(['Down Shot', 'Neko Rig', 'Wacky Rig', 'No Sinker', 'Small Jighead']);
    }
    if (band === 'heavy') {
      return pairing(['Texas Rig', 'Free Rig', 'Neko Rig', 'Small Swimbait', 'Swim Jig']);
    }
    if (action === 'moving') {
      return pairing(['Small Crankbait', 'Shad', 'Minnow', 'Wacky Rig', 'Down Shot']);
    }
    return pairing(['Wacky Rig', 'Neko Rig', 'Down Shot', 'Small Minnow', 'Shad']);
  }

  if (type === 'C') {
    if (band === 'light') {
      return pairing(['Neko Rig', 'Down Shot', 'No Sinker', 'Small Rubber Jig', 'Small Crankbait']);
    }
    if (band === 'heavy') {
      if (action === 'moving') {
        return pairing(['Spinnerbait', 'Chatterbait', 'Swim Jig', 'Crankbait', 'Vibration']);
      }
      if (/\bH\b|XH|XXH/.test(n(row.POWER).toUpperCase())) {
        return pairing(['Heavy Texas', 'Rubber Jig', 'Swim Jig', 'Frog', 'Punching']);
      }
      return pairing(['Texas Rig', 'Rubber Jig', 'Free Rig', 'Chatterbait', 'Spinnerbait']);
    }
    if (action === 'moving') {
      return pairing(['Crankbait', 'Shad', 'Minnow', 'Spinnerbait', 'Chatterbait']);
    }
    return pairing(['Texas Rig', 'Free Rig', 'Rubber Jig', 'Spinnerbait', 'Chatterbait']);
  }

  return pairing(['Texas Rig', 'Free Rig', 'Neko Rig', 'Crankbait', 'Spinnerbait']);
}

function resolvePairing(model, row, item) {
  return (
    explicitPairing(model, row, item) ||
    skuCuePairing(model, row) ||
    {
      value: conservativePairing(row),
      ...source('official_spec_inference', 'Conservative inference from official SKU, type, power, action, and line rating.', 'low'),
    }
  );
}

const SOFT_TERMS = [
  'Down Shot', 'Neko', 'No Sinker', 'Texas', 'Free Rig', 'Rubber Jig', 'Jighead',
  'Wacky', 'Creature Bait', 'Small Jighead', 'Small Rubber Jig',
];
const HARD_TERMS = [
  'Crankbait', 'Shad', 'Minnow', 'Jerkbait', 'Vibration', 'Topwater', 'Spinnerbait',
  'Chatterbait', 'Swim Jig', 'Swimbait', 'Big Bait', 'Bucktail', 'Spoon', 'Jigging Minnow',
];

function containsAny(text, terms) {
  const value = lower(text);
  return terms.some((term) => value.includes(term.toLowerCase()));
}

function firstPairingGroup(value) {
  const first = n(value).split('/').map(n).filter(Boolean)[0] || '';
  if (containsAny(first, SOFT_TERMS)) return 'soft';
  if (containsAny(first, HARD_TERMS)) return 'hard';
  return 'other';
}

function descMissingTerms(row) {
  const desc = lower(row.Description);
  const pairingText = lower(row.recommended_rig_pairing);
  const checks = [
    ['Crankbait', /crankbait|crank/],
    ['Swimbait', /swimbait/],
    ['Big Bait', /big bait|big baits/],
    ['Frog', /frog/],
    ['Flipping', /flipping/],
    ['Punching', /punching|pitching/],
    ['Down Shot', /down shot/],
    ['Neko Rig', /neko/],
    ['Ice Jig', /ice/],
  ];
  return checks.filter(([label, re]) => re.test(desc) && !pairingText.includes(label.toLowerCase())).map(([label]) => label);
}

function validate(rows) {
  const issues = [];
  for (const row of rows) {
    const pairingValue = n(row.recommended_rig_pairing);
    const hint = n(row.guide_use_hint);
    if (!pairingValue) {
      issues.push({ id: row.id, sku: row.SKU, code: 'missing_recommended_rig_pairing', severity: 'error' });
    }
    if (BANNED_GENERIC.test(pairingValue)) {
      issues.push({ id: row.id, sku: row.SKU, code: 'over_generic_pairing', severity: 'error', value: pairingValue });
    }

    const missing = descMissingTerms(row);
    if (missing.length) {
      issues.push({ id: row.id, sku: row.SKU, code: 'description_terms_missing', severity: 'warning', missing, value: pairingValue });
    }

    const first = firstPairingGroup(pairingValue);
    if (first === 'soft' && /硬餌搜索|hardbait|crankbait|moving bait/i.test(hint)) {
      issues.push({ id: row.id, sku: row.SKU, code: 'soft_primary_hard_hint', severity: 'error', value: pairingValue, guide_use_hint: hint });
    }
    if (first === 'hard' && /軟餌底操|soft bait|bottom soft/i.test(hint)) {
      issues.push({ id: row.id, sku: row.SKU, code: 'hard_primary_soft_hint', severity: 'error', value: pairingValue, guide_use_hint: hint });
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
    const resolved = resolvePairing(model, row, item);
    row.recommended_rig_pairing = resolved.value;
    evidence.push({
      id: row.id,
      rod_id: row.rod_id,
      model,
      sku: row.SKU,
      recommended_rig_pairing: resolved.value,
      source_type: resolved.source_type,
      confidence: resolved.confidence,
      source_note: resolved.source_note,
    });
  }

  const changedRows = [];
  for (const row of details) {
    const before = beforeById.get(row.id) || {};
    if (n(before.recommended_rig_pairing) !== n(row.recommended_rig_pairing)) {
      changedRows.push({
        id: row.id,
        rod_id: row.rod_id,
        model: modelByRodId.get(row.rod_id) || '',
        sku: row.SKU,
        before: n(before.recommended_rig_pairing),
        after: n(row.recommended_rig_pairing),
      });
    }
  }

  const protectedFieldsChanged = [];
  for (const row of details) {
    const before = beforeById.get(row.id) || {};
    for (const [key, value] of Object.entries(row)) {
      if (key === 'recommended_rig_pairing') continue;
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
  const confidenceCounts = evidence.reduce((acc, item) => {
    acc[item.confidence] = (acc[item.confidence] || 0) + 1;
    return acc;
  }, {});

  wb.Sheets.rod = XLSX.utils.json_to_sheet(rods, { header: HEADERS.rodMaster });
  wb.Sheets.rod_detail = XLSX.utils.json_to_sheet(details, { header: HEADERS.rodDetail });
  XLSX.writeFile(wb, IMPORT_FILE);
  execFileSync('python3', [SHADE_SCRIPT], { stdio: 'inherit' });

  const report = {
    schema: 'abu_rod_recommended_rig_pairing_report_v1',
    source_xlsx: IMPORT_FILE,
    normalized_file: NORMALIZED_FILE,
    updated_field: 'recommended_rig_pairing',
    row_count: details.length,
    changed_row_count: changedRows.length,
    coverage: `${details.filter((row) => n(row.recommended_rig_pairing)).length}/${details.length}`,
    source_counts: sourceCounts,
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
