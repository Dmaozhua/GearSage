const fs = require('fs');

function validateObject(obj, schema, path) {
  const errors = [];
  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      const isRequired = !key.endsWith('?');
      const cleanKey = key.replace('?', '');
      const newPath = path ? `${path}.${cleanKey}` : cleanKey;

      if (isRequired && !(cleanKey in obj)) {
        errors.push(`Missing required field: ${newPath}`);
        continue;
      }

      if (cleanKey in obj) {
        const expectedType = schema[key];
        const actualType = Array.isArray(obj[cleanKey]) ? 'array' : typeof obj[cleanKey];

        if (expectedType === 'array' && !Array.isArray(obj[cleanKey])) {
          errors.push(`Invalid type for ${newPath}. Expected array, got ${actualType}`);
        } else if (expectedType !== 'array' && actualType !== expectedType.replace('?', '')) {
          errors.push(`Invalid type for ${newPath}. Expected ${expectedType.replace('?', '')}, got ${actualType}`);
        }
      }
    }
  }
  return errors;
}

function preCheck(filePath) {
  console.log(`🚀 Starting pre-check for: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (!Array.isArray(data)) {
    console.error('❌ Error: Root element of normalized.json must be an array.');
    process.exit(1);
  }

  console.log(`🔍 Found ${data.length} items to check.`);

  const uniqueKeys = new Set();
  let allErrors = [];

  const itemSchema = {
    'brand': 'string',
    'kind': 'string',
    'model': 'string',
    'model_year': 'number',
    'source_url': 'string',
    'images': 'array',
    'variants': 'array',
    'raw_data_hash': 'string',
    'scraped_at': 'string'
  };

  data.forEach((item, index) => {
    const itemPath = `item[${index}]`;
    const itemErrors = validateObject(item, itemSchema, itemPath);
    allErrors.push(...itemErrors);

    const uniqueKey = `${item.brand}|${item.model}|${item.model_year}`;
    if (uniqueKeys.has(uniqueKey)) {
      allErrors.push(`Duplicate item found: ${uniqueKey} at ${itemPath}`);
    } else {
      uniqueKeys.add(uniqueKey);
    }
  });

  if (allErrors.length > 0) {
    console.error('❌ Pre-check failed with the following errors:');
    allErrors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log('✅ Pre-check successful. All items adhere to the schema and are unique.');
  }

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
