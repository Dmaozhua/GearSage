const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const tcb = require('@cloudbase/node-sdk');

const ENV_ID = process.env.TCB_ENV_ID || 'cloud1-1g9eeb3p33faac61';
const SEED_DIR = path.join(__dirname, '../data/tag_seed');

const COLLECTION_FILES = [
  { collection: 'bz_tag_definitions', file: 'bz_tag_definitions.seed.ndjson' },
  { collection: 'bz_points_goods', file: 'bz_points_goods.seed.ndjson' }
];

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed file not found: ${filePath}`);
  }
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

async function upsertCollection(db, collectionName, rows) {
  const collection = db.collection(collectionName);
  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const docId = row._id;
    if (!docId) {
      throw new Error(`Document in ${collectionName} missing _id: ${JSON.stringify(row)}`);
    }
    const exists = await collection.doc(docId).get().then(() => true).catch(() => false);
    if (exists) {
      await collection.doc(docId).remove().catch(() => null);
    }
    await collection.add({ ...row });
    if (exists) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  return { inserted, updated, total: rows.length };
}

async function main() {
  if (!process.env.TCB_SECRET_ID || !process.env.TCB_SECRET_KEY) {
    throw new Error('Missing TCB_SECRET_ID / TCB_SECRET_KEY in environment');
  }

  const app = tcb.init({
    env: ENV_ID,
    secretId: process.env.TCB_SECRET_ID,
    secretKey: process.env.TCB_SECRET_KEY
  });
  const db = app.database();

  console.log(`Using CloudBase env: ${ENV_ID}`);

  for (const item of COLLECTION_FILES) {
    const filePath = path.join(SEED_DIR, item.file);
    const rows = readNdjson(filePath);
    console.log(`Importing ${rows.length} rows into ${item.collection} from ${item.file} ...`);
    const result = await upsertCollection(db, item.collection, rows);
    console.log(`${item.collection}: inserted=${result.inserted}, updated=${result.updated}, total=${result.total}`);
  }

  console.log('Tag seed import completed.');
}

main().catch(err => {
  console.error('Tag seed import failed:', err);
  process.exit(1);
});
