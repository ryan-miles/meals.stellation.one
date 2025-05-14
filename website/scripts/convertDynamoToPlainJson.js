// Converts all DynamoDB AttributeValue JSON files in json/recipes-dynamo/ to plain JSON in json/recipes-dynamo-plain/
// Usage: node convertDynamoToPlainJson.js

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../json/recipes-dynamo');
const DEST_DIR = path.join(__dirname, '../json/recipes-dynamo-plain');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR);
}

function fromDynamo(val) {
  if (val == null) return val;
  if (typeof val !== 'object') return val;
  if ('S' in val) return val.S;
  if ('N' in val) return Number(val.N);
  if ('BOOL' in val) return val.BOOL;
  if ('L' in val) return val.L.map(fromDynamo);
  if ('M' in val) {
    const out = {};
    for (const k in val.M) out[k] = fromDynamo(val.M[k]);
    return out;
  }
  if ('NULL' in val) return null;
  return val;
}

for (const file of fs.readdirSync(SRC_DIR)) {
  if (!file.endsWith('.json')) continue;
  const srcPath = path.join(SRC_DIR, file);
  const destPath = path.join(DEST_DIR, file);
  const raw = fs.readFileSync(srcPath, 'utf-8');
  let data = JSON.parse(raw);
  // If top-level is Dynamo format, convert all keys
  if (typeof data === 'object' && !Array.isArray(data)) {
    const plain = {};
    for (const k in data) plain[k] = fromDynamo(data[k]);
    data = plain;
  }
  fs.writeFileSync(destPath, JSON.stringify(data, null, 2));
  console.log(`Converted: ${file} -> ${path.relative('.', destPath)}`);
}
console.log('✅ All DynamoDB-formatted recipes converted to plain JSON!');
