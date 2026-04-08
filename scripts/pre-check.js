const fs = require('fs');
const path = require('path');

const ALLOWED_KINDS = new Set(['reel', 'rod', 'lure', 'line']);

function normalizeText(value) {
  return String(value ?? '').trim();
}

function hasValue(value) {
  return normalizeText(value) !== '';
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getFirstText(source, keys) {
  for (const key of keys) {
    if (hasValue(source[key])) {
      return normalizeText(source[key]);
    }
  }
  return '';
}

function inferContextFromFile(filePath) {
  const lower = path.basename(filePath).toLowerCase();
  const context = {
    brand: '',
    kind: '',
  };

  if (lower.includes('daiwa')) {
    context.brand = 'daiwa';
  } else if (lower.includes('shimano')) {
    context.brand = 'shimano';
  } else if (lower.includes('megabass')) {
    context.brand = 'megabass';
  }

  if (lower.includes('line')) {
    context.kind = 'line';
  } else if (lower.includes('lure')) {
    context.kind = 'lure';
  } else if (lower.includes('rod')) {
    context.kind = 'rod';
  } else if (
    lower.includes('reel') ||
    lower.includes('spinning') ||
    lower.includes('baitcasting')
  ) {
    context.kind = 'reel';
  }

  return context;
}

function resolveBrand(item, inferred) {
  return normalizeText(item.brand || inferred.brand).toLowerCase();
}

function normalizeKind(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'spinning' || normalized === 'baitcasting') {
    return 'reel';
  }
  return normalized;
}

function resolveKind(item, inferred) {
  return normalizeKind(item.kind || inferred.kind);
}

function resolveModel(item) {
  return getFirstText(item, ['model', 'model_name']);
}

function resolveSourceUrl(item) {
  return getFirstText(item, ['source_url', 'url']);
}

function resolveImages(item) {
  const values = [];
  const push = (value) => {
    const text = normalizeText(value);
    if (text && !values.includes(text)) {
      values.push(text);
    }
  };

  if (Array.isArray(item.images)) {
    item.images.forEach(push);
  } else if (hasValue(item.images)) {
    normalizeText(item.images)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach(push);
  }

  push(item.local_image_path);
  push(item.main_image_url);
  return values;
}

function resolveVariants(item) {
  return Array.isArray(item.variants) ? item.variants : [];
}

function resolveVariantName(variant) {
  return getFirstText(variant, ['sku', 'SKU', 'name', 'variant_name']);
}

function resolveVariantSpecs(variant) {
  if (isPlainObject(variant.specs)) {
    return variant.specs;
  }
  if (isPlainObject(variant.raw_specs)) {
    return variant.raw_specs;
  }
  return null;
}

function buildItemUniqueKey(brand, kind, model, sourceUrl) {
  return [brand, kind, model.toLowerCase(), sourceUrl.toLowerCase()].join('|');
}

function validateVariant(variant, variantIndex, itemPath) {
  const errors = [];
  const warnings = [];
  const variantPath = `${itemPath}.variants[${variantIndex}]`;
  const name = resolveVariantName(variant);
  const specs = resolveVariantSpecs(variant);

  if (!name) {
    errors.push(`Missing variant name: ${variantPath}`);
  }

  if (!specs) {
    errors.push(`Missing specs/raw_specs object: ${variantPath}`);
  } else if (Object.keys(specs).length === 0) {
    warnings.push(`Empty specs/raw_specs object: ${variantPath}`);
  }

  if (!isPlainObject(variant) || Array.isArray(variant)) {
    errors.push(`Invalid variant type: ${variantPath}`);
  }

  return { errors, warnings, variantName: name };
}

function validateItem(item, index, inferred, seenKeys) {
  const errors = [];
  const warnings = [];
  const itemPath = `item[${index}]`;

  if (!isPlainObject(item)) {
    errors.push(`Invalid item type: ${itemPath}`);
    return { errors, warnings };
  }

  const brand = resolveBrand(item, inferred);
  const kind = resolveKind(item, inferred);
  const model = resolveModel(item);
  const sourceUrl = resolveSourceUrl(item);
  const images = resolveImages(item);
  const variants = resolveVariants(item);

  if (!brand) {
    errors.push(`Missing brand: ${itemPath}`);
  } else if (!hasValue(item.brand)) {
    warnings.push(`Brand inferred from file name: ${itemPath} -> ${brand}`);
  }

  if (!kind) {
    errors.push(`Missing kind: ${itemPath}`);
  } else {
    if (!ALLOWED_KINDS.has(kind)) {
      errors.push(`Unsupported kind '${kind}': ${itemPath}`);
    }
    if (!hasValue(item.kind)) {
      warnings.push(`Kind inferred from file name: ${itemPath} -> ${kind}`);
    }
  }

  if (!model) {
    errors.push(`Missing model/model_name: ${itemPath}`);
  }

  if (!sourceUrl) {
    errors.push(`Missing source_url/url: ${itemPath}`);
  }

  if (images.length === 0) {
    warnings.push(`Missing images/local_image_path/main_image_url: ${itemPath}`);
  }

  if (!Array.isArray(item.variants)) {
    errors.push(`Invalid variants type. Expected array: ${itemPath}.variants`);
  } else if (variants.length === 0) {
    errors.push(`Empty variants array: ${itemPath}.variants`);
  }

  if (!hasValue(item.model_year)) {
    warnings.push(`Missing model_year: ${itemPath}`);
  }
  if (!hasValue(item.local_image_path)) {
    warnings.push(`Missing local_image_path: ${itemPath}`);
  }
  if (!hasValue(item.raw_data_hash)) {
    warnings.push(`Missing raw_data_hash: ${itemPath}`);
  }
  if (!hasValue(item.scraped_at)) {
    warnings.push(`Missing scraped_at: ${itemPath}`);
  }

  if (brand && kind && model && sourceUrl) {
    const uniqueKey = buildItemUniqueKey(brand, kind, model, sourceUrl);
    if (seenKeys.has(uniqueKey)) {
      errors.push(`Duplicate item found: ${uniqueKey} at ${itemPath}`);
    } else {
      seenKeys.add(uniqueKey);
    }
  }

  const variantNames = new Set();
  let structuredSpecCount = 0;

  variants.forEach((variant, variantIndex) => {
    const result = validateVariant(variant, variantIndex, itemPath);
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    if (result.variantName) {
      const normalizedVariantName = result.variantName.toLowerCase();
      if (variantNames.has(normalizedVariantName)) {
        errors.push(`Duplicate variant name '${result.variantName}': ${itemPath}`);
      } else {
        variantNames.add(normalizedVariantName);
      }
    }

    if (isPlainObject(variant.specs) && Object.keys(variant.specs).length > 0) {
      structuredSpecCount += 1;
    }
  });

  if (variants.length > 0 && structuredSpecCount === 0) {
    warnings.push(`No structured specs found, currently relying on raw_specs/manual mapping: ${itemPath}`);
  }

  return { errors, warnings };
}

function summarizeMessages(messages) {
  const summary = new Map();

  messages.forEach((message) => {
    const separatorIndex = message.indexOf(': ');
    const category =
      separatorIndex >= 0 ? message.slice(0, separatorIndex) : message;
    const detail = separatorIndex >= 0 ? message.slice(separatorIndex + 2) : '';
    if (!summary.has(category)) {
      summary.set(category, []);
    }
    if (detail) {
      summary.get(category).push(detail);
    }
  });

  return summary;
}

function printIssueSummary(label, messages) {
  if (messages.length === 0) {
    return;
  }

  const summary = summarizeMessages(messages);
  console.log(`${label} (${messages.length}):`);
  summary.forEach((details, category) => {
    const samples = details.slice(0, 5).join(', ');
    const restCount = Math.max(details.length - 5, 0);
    if (samples && restCount > 0) {
      console.log(`  - ${category}: ${samples} ... +${restCount} more`);
      return;
    }
    if (samples) {
      console.log(`  - ${category}: ${samples}`);
      return;
    }
    console.log(`  - ${category}`);
  });
}

function preCheck(filePath) {
  console.log(`🚀 Starting pre-check for: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    console.error('❌ Error: Root element of normalized.json must be an array.');
    process.exit(1);
  }

  console.log(`🔍 Found ${data.length} items to check.`);

  const inferred = inferContextFromFile(filePath);
  const seenKeys = new Set();
  const errors = [];
  const warnings = [];

  data.forEach((item, index) => {
    const result = validateItem(item, index, inferred, seenKeys);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  printIssueSummary('⚠️  Warnings', warnings);

  if (errors.length > 0) {
    printIssueSummary('❌ Errors', errors);
    process.exit(1);
  }

  console.log(
    `✅ Pre-check successful. items=${data.length} warnings=${warnings.length} inferredBrand=${inferred.brand || 'n/a'} inferredKind=${inferred.kind || 'n/a'}`,
  );
  return true;
}

if (require.main === module) {
  if (process.argv.length < 3) {
    console.error('Usage: node scripts/pre-check.js <path_to_normalized.json>');
    process.exit(1);
  }
  preCheck(process.argv[2]);
}

module.exports = preCheck;
