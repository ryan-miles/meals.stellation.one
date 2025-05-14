// Converts all recipe JSON files in website/json/recipes/ to DynamoDB format and writes them to website/json/recipes-dynamo/
// Usage: node website/scripts/convertRecipesForDynamo.js

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../json/recipes');
const DEST_DIR = path.join(__dirname, '../json/recipes-dynamo');

// DynamoDB type conversion
function toDynamo(val) {
  if (val === null || val === undefined) return { NULL: true };
  if (typeof val === 'string') return { S: val };
  if (typeof val === 'number') return { N: val.toString() };
  if (typeof val === 'boolean') return { BOOL: val };
  if (Array.isArray(val)) return { L: val.map(toDynamo) };
  if (typeof val === 'object') {
    const map = {};
    for (const k in val) map[k] = toDynamo(val[k]);
    return { M: map };
  }
  throw new Error('Unsupported type: ' + typeof val);
}

if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR);

fs.readdirSync(SRC_DIR).forEach(file => {
  if (!file.endsWith('.json')) return;
  const srcPath = path.join(SRC_DIR, file);
  const destPath = path.join(DEST_DIR, file);
  const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const dynamoData = {};
  for (const k in data) dynamoData[k] = toDynamo(data[k]);
  fs.writeFileSync(destPath, JSON.stringify(dynamoData, null, 2));
  console.log(`Converted: ${file}`);
});

console.log('All recipes converted to DynamoDB format!');
