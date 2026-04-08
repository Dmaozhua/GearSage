const fs = require('fs');
const path = require('path');

const TARGETS = {
  daiwa_lure_normalized: {
    kind: 'lure',
    dropEmptyVariants: true,
  },
  shimano_lure_normalized: {
    kind: 'lure',
    dropEmptyVariants: false,
  },
  shimano_line_normalized: {
    kind: 'line',
    dropEmptyVariants: false,
  },
};

function normalizeText(value) {
  return String(value ?? '').trim();
}

function uniqueBySignature(variants) {
  const next = [];
  const seen = new Set();

  for (const variant of variants) {
    const signature = JSON.stringify(variant);
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    next.push(variant);
  }

  return next;
}

function buildDisambiguationParts(kind, variant) {
  const specs = variant.specs || {};
  const parts = [];

  if (kind === 'line') {
    if (normalizeText(specs.size_no)) {
      parts.push(`${normalizeText(specs.size_no)}号`);
    }
    if (normalizeText(specs.length_m)) {
      parts.push(`${normalizeText(specs.length_m)}m`);
    }
    if (normalizeText(specs.max_strength_lb)) {
      parts.push(`${normalizeText(specs.max_strength_lb)}lb`);
    }
  } else if (kind === 'lure') {
    if (normalizeText(specs.color)) {
      parts.push(normalizeText(specs.color));
    }
    if (normalizeText(specs.length)) {
      parts.push(`${normalizeText(specs.length)}mm`);
    }
    if (normalizeText(specs.weight)) {
      parts.push(`${normalizeText(specs.weight)}g`);
    }
  }

  if (normalizeText(specs.product_code)) {
    parts.push(normalizeText(specs.product_code));
  }

  return parts.filter(Boolean);
}

function ensureUniqueVariantNames(item, kind) {
  const usedNames = new Set();
  let renamedCount = 0;

  item.variants = item.variants.map((variant, index) => {
    const currentName = normalizeText(variant.variant_name || variant.name || variant.sku);
    if (!currentName) {
      return variant;
    }

    if (!usedNames.has(currentName)) {
      usedNames.add(currentName);
      if (variant.variant_name) {
        variant.variant_name = currentName;
      } else if (variant.name) {
        variant.name = currentName;
      } else if (variant.sku) {
        variant.sku = currentName;
      }
      return variant;
    }

    const parts = buildDisambiguationParts(kind, variant);
    let nextName = currentName;

    for (let i = 1; i <= parts.length; i += 1) {
      const candidate = `${currentName} | ${parts.slice(0, i).join(' | ')}`;
      if (!usedNames.has(candidate)) {
        nextName = candidate;
        break;
      }
    }

    if (usedNames.has(nextName)) {
      let suffix = 2;
      while (usedNames.has(`${currentName} #${suffix}`)) {
        suffix += 1;
      }
      nextName = `${currentName} #${suffix}`;
    }

    usedNames.add(nextName);
    renamedCount += 1;

    if (variant.variant_name) {
      variant.variant_name = nextName;
    } else if (variant.name) {
      variant.name = nextName;
    } else if (variant.sku) {
      variant.sku = nextName;
    }

    return variant;
  });

  return renamedCount;
}

function repairFile(filePath) {
  const key = path.basename(filePath, '.json');
  const config = TARGETS[key];

  if (!config) {
    throw new Error(`No repair rule configured for ${key}`);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const originalCount = raw.length;
  let droppedCount = 0;
  let renamedCount = 0;
  let exactDedupedVariants = 0;

  const repaired = [];

  for (const item of raw) {
    const variants = Array.isArray(item.variants) ? item.variants : [];

    if (config.dropEmptyVariants && variants.length === 0) {
      droppedCount += 1;
      continue;
    }

    const dedupedVariants = uniqueBySignature(variants);
    exactDedupedVariants += variants.length - dedupedVariants.length;
    item.variants = dedupedVariants;
    renamedCount += ensureUniqueVariantNames(item, config.kind);
    repaired.push(item);
  }

  fs.writeFileSync(filePath, `${JSON.stringify(repaired, null, 2)}\n`, 'utf8');

  return {
    file: filePath,
    originalCount,
    finalCount: repaired.length,
    droppedCount,
    renamedCount,
    exactDedupedVariants,
  };
}

function main(args) {
  if (args.length === 0) {
    console.error(
      'Usage: node scripts/repair_normalized_variants.js <file1.json> [file2.json ...]',
    );
    process.exit(1);
  }

  const results = args.map(repairFile);
  results.forEach((result) => {
    console.log(
      `[repair:normalized] ${path.basename(result.file)} items ${result.originalCount} -> ${result.finalCount}, dropped=${result.droppedCount}, renamedVariants=${result.renamedCount}, dedupedVariants=${result.exactDedupedVariants}`,
    );
  });
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  repairFile,
};
