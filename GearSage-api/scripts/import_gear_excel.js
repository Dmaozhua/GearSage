const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');

const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_EXCEL_DIR = path.join(
  ROOT_DIR,
  '..',
  'GearSage-client',
  'rate',
  'excel',
);
const DEFAULT_WEBP_DIR = path.join(
  ROOT_DIR,
  '..',
  'GearSage-client',
  'rate',
  'webp',
);
const SEARCH_DATA_DIR = path.join(
  ROOT_DIR,
  '..',
  'GearSage-client',
  'pkgGear',
  'searchData',
);
const SEARCH_DATA_FILE = path.join(SEARCH_DATA_DIR, 'Data.js');
const INIT_SQL_PATH = path.join(ROOT_DIR, 'sql', 'init_core_tables.sql');

const MASTER_SOURCES = [
  { kind: 'reel', file: 'reel.xlsx' },
  { kind: 'rod', file: 'rod.xlsx' },
  { kind: 'lure', file: 'lure.xlsx' },
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
];

main().catch((error) => {
  console.error('[import:gear] Failed:', error);
  process.exit(1);
});

async function main() {
  loadEnvFiles();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const excelDir = process.env.GEAR_EXCEL_DIR || DEFAULT_EXCEL_DIR;
  if (!fs.existsSync(excelDir)) {
    throw new Error(`GEAR_EXCEL_DIR not found: ${excelDir}`);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const initSql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
    await client.query(initSql);

    const brands = readRows(path.join(excelDir, 'brand.xlsx')).map(normalizeBrandRow);
    const masters = MASTER_SOURCES.flatMap(({ kind, file, sheet }) =>
      readRows(path.join(excelDir, file), sheet).map((row) => normalizeMasterRow(kind, row)),
    );
    const variants = VARIANT_SOURCES.flatMap(({ kind, sourceKey, file, foreignKey, sheet }) =>
      readRows(path.join(excelDir, file), sheet).map((row) =>
        normalizeVariantRow(kind, sourceKey, foreignKey, row),
      ),
    );

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
            kind, id, "brandId", model, "modelCn", "modelYear", type,
            system, "waterColumn", action, alias, "typeTips", images, raw_json
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb)
        `,
        [
          item.kind,
          item.id,
          item.brandId,
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

    const searchDataCount = generateSearchDataFile(masters);

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

  const normalized = sanitizeJson({
    ...row,
    id: normalizeText(row.id),
    brand_id: toNullableNumber(row.brand_id),
    images: normalizedImages,
  });

  return {
    kind,
    id: normalizeText(row.id),
    brandId: toNullableNumber(row.brand_id),
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

function generateSearchDataFile(masters) {
  if (!fs.existsSync(SEARCH_DATA_DIR)) {
    fs.mkdirSync(SEARCH_DATA_DIR, { recursive: true });
  }

  const searchData = masters
    .filter((item) => ['reel', 'rod', 'lure'].includes(item.kind))
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

  const content = `module.exports = ${JSON.stringify(searchData, null, 2)};\n`;
  fs.writeFileSync(SEARCH_DATA_FILE, content, 'utf8');
  return searchData.length;
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

  const fileName = path.basename(text);
  if (!fileName) {
    return '';
  }

  if (fs.existsSync(path.join(DEFAULT_WEBP_DIR, fileName))) {
    return `/rate/webp/${fileName}`;
  }

  return `/rate/webp/${fileName}`;
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
