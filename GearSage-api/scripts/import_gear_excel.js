const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');
const gearDataPaths = require('../../scripts/gear_data_paths');

const ROOT_DIR = path.join(__dirname, '..');
const GEAR_EXCEL_DIR = gearDataPaths.excelDir;
const GEAR_WEBP_DIR = gearDataPaths.webpDir;
const SEARCH_DATA_DIR = path.join(
  ROOT_DIR,
  '..',
  'GearSage-client',
  'pkgGear',
  'searchData',
);
const SEARCH_DATA_FILE = path.join(SEARCH_DATA_DIR, 'Data.js');
const STATIC_GEAR_IMAGE_BASE_URL = 'https://static.gearsage.club/gearsage/Gearimg/images';
const CLIENT_SEARCH_DATA_DIR = path.join(
  ROOT_DIR,
  '..',
  'GearSage-client',
  'data',
);
const CLIENT_SEARCH_DATA_FILE = path.join(CLIENT_SEARCH_DATA_DIR, 'gear-search-data.js');
const INIT_SQL_PATH = path.join(ROOT_DIR, 'sql', 'init_core_tables.sql');

const MASTER_SOURCES = [
  { kind: 'reel', file: 'reel.xlsx' },
  { kind: 'rod', file: 'rod.xlsx' },
  { kind: 'lure', file: 'lure.xlsx' },
  { kind: 'line', file: 'line.xlsx' },
  { kind: 'hook', file: 'hook.xlsx' },
];

const VARIANT_SOURCES = [
  { kind: 'reel', sourceKey: 'spinning', file: 'spinning_reel_detail.xlsx', foreignKey: 'reel_id' },
  { kind: 'reel', sourceKey: 'baitcasting', file: 'baitcasting_reel_detail.xlsx', foreignKey: 'reel_id' },
  { kind: 'rod', sourceKey: 'rod', file: 'rod_detail.xlsx', foreignKey: 'rod_id' },
  { kind: 'lure', sourceKey: 'hardbait', file: 'hardbait_lure_detail.xlsx', foreignKey: 'lure_id' },
  { kind: 'lure', sourceKey: 'soft', file: 'soft_lure_detail.xlsx', foreignKey: 'lure_id' },
  { kind: 'lure', sourceKey: 'metal', file: 'metal_lure_detail.xlsx', foreignKey: 'lure_id' },
  { kind: 'lure', sourceKey: 'jig', file: 'jig_lure_detail.xlsx', foreignKey: 'lure_id' },
  { kind: 'lure', sourceKey: 'wire', file: 'wire_lure_detail.xlsx', foreignKey: 'lure_id' },
  { kind: 'line', sourceKey: 'line', file: 'line_detail.xlsx', foreignKey: 'line_id' },
  { kind: 'hook', sourceKey: 'hook', file: 'hook_detail.xlsx', foreignKey: 'hookId' },
];

const MASTER_TEXT_LIMITS = {
  id: 64,
  model: 128,
  modelCn: 128,
  modelYear: 32,
  type: 64,
  system: 64,
  waterColumn: 64,
  action: 64,
  alias: 255,
  typeTips: 255,
};

const VARIANT_TEXT_LIMITS = {
  sourceKey: 64,
  gearId: 64,
  variantId: 64,
  sku: 255,
};

const BRAND_TEXT_LIMITS = {
  name: 255,
  name_en: 255,
  name_jp: 255,
  name_zh: 255,
  site_url: 255,
};

const VALID_REEL_TYPES = new Set(['spinning', 'baitcasting', 'drum', 'conventional']);
const KINDS_REQUIRING_VARIANTS = new Set(['reel', 'rod', 'lure', 'line', 'hook']);

const cliOptions = parseArgs(process.argv.slice(2));

main(cliOptions).catch((error) => {
  console.error('[import:gear] Failed:', error);
  process.exit(1);
});

async function main(options) {
  loadEnvFiles();

  const excelDir = GEAR_EXCEL_DIR;
  if (!fs.existsSync(excelDir)) {
    throw new Error(`GEAR_EXCEL_DIR not found: ${excelDir}`);
  }

  const brands = readRows(path.join(excelDir, 'brand.xlsx')).map(normalizeBrandRow);
  const masters = MASTER_SOURCES.flatMap(({ kind, file, sheet }) =>
    readRows(path.join(excelDir, file), sheet).map((row) => normalizeMasterRow(kind, row)),
  );
  const variants = VARIANT_SOURCES.flatMap(({ kind, sourceKey, file, foreignKey, sheet }) =>
    readRows(path.join(excelDir, file), sheet).map((row) =>
      normalizeVariantRow(kind, sourceKey, foreignKey, row),
    ),
  );
  const validation = validateDataset(brands, masters, variants);
  const searchData = buildSearchData(masters);

  if (validation.warnings.length > 0) {
    for (const warning of validation.warnings) {
      console.warn(`[import:gear] Warning: ${warning}`);
    }
  }

  if (validation.errors.length > 0) {
    throw new Error(
      `validation failed with ${validation.errors.length} error(s):\n- ${validation.errors.join('\n- ')}`,
    );
  }

  if (options.dryRun) {
    console.log(
      `[import:gear] Dry run OK brands=${brands.length} masters=${masters.length} variants=${variants.length} searchData=${searchData.length}`,
    );
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const initSql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
    await client.query(initSql);

    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE gear_variants, gear_master, gear_brands');

    for (const brand of brands) {
      await client.query(
        `
          INSERT INTO gear_brands (
            id, name, name_en, name_jp, name_zh, description, site_url, raw_json
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
        `,
        [
          brand.id,
          brand.name,
          brand.name_en,
          brand.name_jp,
          brand.name_zh,
          brand.description,
          brand.site_url,
          JSON.stringify(brand.raw_json),
        ],
      );
    }

    for (const item of masters) {
      await client.query(
        `
          INSERT INTO gear_master (
            kind, id, "brandId", "isShow", model, "modelCn", "modelYear", type,
            system, "waterColumn", action, alias, "typeTips", images, raw_json
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb)
        `,
        [
          item.kind,
          item.id,
          item.brandId,
          item.isShow,
          item.model,
          item.modelCn,
          item.modelYear,
          item.type,
          item.system,
          item.waterColumn,
          item.action,
          item.alias,
          item.typeTips,
          JSON.stringify(item.images),
          JSON.stringify(item.raw_json),
        ],
      );
    }

    for (const variant of variants) {
      await client.query(
        `
          INSERT INTO gear_variants (
            kind, "sourceKey", "gearId", "variantId", sku, raw_json
          ) VALUES ($1,$2,$3,$4,$5,$6::jsonb)
        `,
        [
          variant.kind,
          variant.sourceKey,
          variant.gearId,
          variant.variantId,
          variant.sku,
          JSON.stringify(variant.raw_json),
        ],
      );
    }

    await client.query('COMMIT');

    const searchDataCount = generateSearchDataFiles(searchData);

    console.log(
      `[import:gear] Imported brands=${brands.length} masters=${masters.length} variants=${variants.length} searchData=${searchDataCount}`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

function loadEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.join(ROOT_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const index = trimmed.indexOf('=');
      if (index <= 0) {
        continue;
      }

      const key = trimmed.slice(0, index).trim();
      if (process.env[key] !== undefined) {
        continue;
      }

      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

function readRows(filePath, sheetName) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[import:gear] Warning: Excel file not found: ${filePath}, skipping...`);
    return [];
  }

  const workbook = XLSX.readFile(filePath);
  const targetSheetName = sheetName || workbook.SheetNames[0];
  if (!workbook.Sheets[targetSheetName]) {
    console.warn(`[import:gear] Warning: Sheet '${targetSheetName}' not found in ${filePath}, skipping...`);
    return [];
  }
  return XLSX.utils.sheet_to_json(workbook.Sheets[targetSheetName], { defval: '' });
}

function normalizeBrandRow(row) {
  return {
    id: toNullableNumber(row.id),
    name: normalizeText(row.name),
    name_en: normalizeText(row.name_en),
    name_jp: normalizeText(row.name_jp),
    name_zh: normalizeText(row.name_zh),
    description: normalizeText(row.description),
    site_url: normalizeText(row.site_url),
    raw_json: sanitizeJson({
      ...row,
      id: toNullableNumber(row.id),
    }),
  };
}

function normalizeMasterRow(kind, row) {
  const normalizedImages = normalizeImages(row.images);
  const isShow = normalizeVisibilityFlag(row.is_show);

  const normalized = sanitizeJson({
    ...row,
    id: normalizeText(row.id),
    brand_id: toNullableNumber(row.brand_id),
    is_show: isShow,
    images: normalizedImages,
  });

  return {
    kind,
    id: normalizeText(row.id),
    brandId: toNullableNumber(row.brand_id),
    isShow,
    model: normalizeText(row.model),
    modelCn: normalizeText(row.model_cn),
    modelYear: normalizeText(row.model_year),
    type: normalizeText(row.type),
    system: normalizeText(row.system),
    waterColumn: normalizeText(row.water_column),
    action: normalizeText(row.action),
    alias: normalizeText(row.alias),
    typeTips: normalizeText(row.type_tips),
    images: normalizedImages,
    raw_json: normalized,
  };
}

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run') || argv.includes('--check'),
  };
}

function normalizeVariantRow(kind, sourceKey, foreignKey, row) {
  const gearIdRaw = row[foreignKey] || row.reel_id || row.master_id;
  const gearId = normalizeText(gearIdRaw);
  
  let variantId = normalizeText(row.id);
  if (!variantId && gearId && (row.sku || row.SKU)) {
    // Generate a variantId if missing
    variantId = normalizeText(`${gearId}-${row.sku || row.SKU}`);
  }

  const normalized = sanitizeJson({
    ...row,
    [foreignKey]: gearId,
    id: variantId,
  });

  return {
    kind,
    sourceKey,
    gearId,
    variantId,
    sku: normalizeText(row.SKU || row.sku),
    raw_json: normalized,
  };
}

function normalizeImages(value) {
  return normalizeText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(mapImage)
    .filter(Boolean);
}

function buildSearchData(masters) {
  return masters
    .filter((item) => ['reel', 'rod', 'lure', 'line', 'hook'].includes(item.kind))
    .filter((item) => item.isShow === 1)
    .map((item) => {
      const nameParts = [item.modelYear, item.model, item.modelCn].filter(Boolean);
      
      let family = '';
      if (item.kind === 'lure') {
        // Simplified family derivation logic based on 筛选设计.txt
        if (item.system === '硬饵' && item.waterColumn === '水面' && item.action === '摆动') {
          family = '铅笔';
        } else if (item.system === '硬饵' && item.waterColumn === '中层' && item.action === '摇摆') {
          family = '胖子';
        } else if (item.system === '硬饵' && item.waterColumn === '全泳层' && item.action === '震动') {
          family = 'VIB';
        }
      }

      return {
        type: item.kind,
        id: item.id,
        name: nameParts.join(' ').trim(),
        alias: item.alias || '',
        type_tips: item.typeTips || '',
        system: item.system || '',
        water_column: item.waterColumn || '',
        action: item.action || '',
        family: family,
      };
    })
    .filter((item) => item.name && item.id);
}

function ensureDir(targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
}

function generateSearchDataFiles(searchData) {
  const content = `module.exports = ${JSON.stringify(searchData, null, 2)};\n`;

  ensureDir(SEARCH_DATA_DIR);
  fs.writeFileSync(SEARCH_DATA_FILE, content, 'utf8');

  ensureDir(CLIENT_SEARCH_DATA_DIR);
  fs.writeFileSync(CLIENT_SEARCH_DATA_FILE, content, 'utf8');

  console.log(`[import:gear] Search data synced: ${SEARCH_DATA_FILE}`);
  console.log(`[import:gear] Search data synced: ${CLIENT_SEARCH_DATA_FILE}`);
  return searchData.length;
}

function validateDataset(brands, masters, variants) {
  const errors = [];
  const warnings = [];

  function checkTextLimits(scope, key, source, limits) {
    Object.entries(limits).forEach(([field, maxLength]) => {
      const value = normalizeText(source[field]);
      if (value && value.length > maxLength) {
        errors.push(`${scope} field ${field} exceeds ${maxLength} chars (actual=${value.length})`);
      }
    });
  }

  const brandIds = new Set();
  for (const brand of brands) {
    if (brand.id === null) {
      errors.push(`brand id is missing or invalid: ${JSON.stringify(brand.raw_json)}`);
      continue;
    }

    if (brandIds.has(brand.id)) {
      errors.push(`duplicate brand id: ${brand.id}`);
      continue;
    }

    brandIds.add(brand.id);
    checkTextLimits(`brand ${brand.id}`, brand.id, brand, BRAND_TEXT_LIMITS);
  }

  const masterKeys = new Set();
  const masterIdsByKind = new Map();
  for (const item of masters) {
    const key = `${item.kind}:${item.id}`;

    if (!item.id) {
      errors.push(`missing master id for kind=${item.kind} model=${item.model || '(empty)'}`);
      continue;
    }

    if (item.brandId === null) {
      errors.push(`missing brand_id for master ${key}`);
    } else if (!brandIds.has(item.brandId)) {
      errors.push(`master ${key} references missing brand_id=${item.brandId}`);
    }

    if (!item.model) {
      warnings.push(`master ${key} has empty model`);
    }

    if (![0, 1].includes(item.isShow)) {
      errors.push(`master ${key} has invalid is_show=${item.isShow}`);
    }

    if (item.kind === 'reel' && item.type && !VALID_REEL_TYPES.has(item.type)) {
      errors.push(`master ${key} has invalid reel type=${item.type}`);
    }

    if (masterKeys.has(key)) {
      errors.push(`duplicate master key: ${key}`);
      continue;
    }

    masterKeys.add(key);
    if (!masterIdsByKind.has(item.kind)) {
      masterIdsByKind.set(item.kind, new Set());
    }
    masterIdsByKind.get(item.kind).add(item.id);
    checkTextLimits(`master ${key}`, key, item, MASTER_TEXT_LIMITS);
  }

  const variantKeys = new Set();
  const variantGearIdsByKind = new Map();
  for (const variant of variants) {
    const masterKey = `${variant.kind}:${variant.gearId}`;
    const variantKey = `${variant.kind}:${variant.variantId}`;

    if (!variant.gearId) {
      errors.push(`missing gearId for variant kind=${variant.kind} sku=${variant.sku || '(empty)'}`);
      continue;
    }

    if (!masterKeys.has(masterKey)) {
      errors.push(`variant ${variant.variantId || '(empty)'} references missing master ${masterKey}`);
    }

    if (!variant.variantId) {
      errors.push(`missing variantId for ${masterKey} sku=${variant.sku || '(empty)'}`);
      continue;
    }

    if (variantKeys.has(variantKey)) {
      errors.push(`duplicate variant key: ${variantKey}`);
      continue;
    }

    if (!variant.sku) {
      warnings.push(`variant ${variantKey} has empty sku`);
    }

    variantKeys.add(variantKey);
    if (!variantGearIdsByKind.has(variant.kind)) {
      variantGearIdsByKind.set(variant.kind, new Set());
    }
    variantGearIdsByKind.get(variant.kind).add(variant.gearId);
    checkTextLimits(`variant ${variantKey}`, variantKey, variant, VARIANT_TEXT_LIMITS);
  }

  for (const [kind, ids] of masterIdsByKind.entries()) {
    if (!KINDS_REQUIRING_VARIANTS.has(kind)) {
      continue;
    }
    const coveredGearIds = variantGearIdsByKind.get(kind) || new Set();
    for (const id of ids) {
      if (!coveredGearIds.has(id)) {
        errors.push(`master ${kind}:${id} has no variant rows`);
      }
    }
  }

  return { errors, warnings };
}

function mapImage(input) {
  const text = normalizeText(input);
  if (!text) {
    return '';
  }

  if (text.startsWith('/')) {
    return text;
  }

  if (text.startsWith('http://') || text.startsWith('https://')) {
    return text;
  }

  const staticUrl = mapPkgGearImageToStaticUrl(text);
  if (staticUrl) {
    return staticUrl;
  }

  // If the text already has a directory path like images/daiwa_reels/...
  // we should prepend '/' to make it an absolute path from the public root
  if (text.startsWith('images/')) {
    return `/${text}`;
  }

  const fileName = path.basename(text);
  if (!fileName) {
    return '';
  }

  if (fs.existsSync(path.join(GEAR_WEBP_DIR, fileName))) {
    return `/rate/webp/${fileName}`;
  }

  return `/rate/webp/${fileName}`;
}

function mapPkgGearImageToStaticUrl(input) {
  const normalized = normalizeText(input).replace(/\\/g, '/');
  const marker = 'pkgGear/images/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) {
    return '';
  }

  const relative = normalized.slice(markerIndex + marker.length);
  const segments = relative.split('/').filter(Boolean);
  if (segments.length < 3) {
    return '';
  }

  const category = segments[0];
  const brand = segments[1];
  const fileName = segments.slice(2).join('/');
  const dir = resolveStaticGearImageDir(category, brand);
  if (!dir || !fileName) {
    return '';
  }

  return `${STATIC_GEAR_IMAGE_BASE_URL}/${encodeURIComponent(dir)}/${encodePathSegments(fileName)}`;
}

function resolveStaticGearImageDir(category, brand) {
  const safeCategory = normalizeText(category).toLowerCase();
  const safeBrand = normalizeText(brand);
  if (!safeCategory || !safeBrand) {
    return '';
  }
  return `${safeBrand}_${safeCategory === 'hook' ? 'hooks' : `${safeCategory}s`}`;
}

function encodePathSegments(value) {
  return String(value || '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function sanitizeJson(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeJson);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, current]) => [key, sanitizeJson(current)]),
    );
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return '';
  }

  return value ?? '';
}

function toNullableNumber(value) {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const next = Number(text);
  return Number.isFinite(next) ? next : null;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeVisibilityFlag(value) {
  const text = normalizeText(value);
  if (!text) {
    return 1;
  }

  if (text === '0') {
    return 0;
  }

  return 1;
}
