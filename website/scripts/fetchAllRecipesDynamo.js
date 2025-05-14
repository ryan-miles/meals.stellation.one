// Fetch all recipes from the DynamoDB API and save to all-recipesdynamo.json
const fs = require('fs');
const https = require('https');

const url = 'https://ida2uil5ed.execute-api.us-east-1.amazonaws.com/recipes';
const outFile = require('path').join(__dirname, '..', 'all-recipesdynamo.json');

https.get(url, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const recipes = JSON.parse(data);
      fs.writeFileSync(outFile, JSON.stringify(recipes, null, 2));
      console.log(`✅ Saved ${recipes.length} recipes to all-recipesdynamo.json`);
    } catch (e) {
      console.error('Failed to parse or save recipes:', e);
    }
  });
}).on('error', err => {
  console.error('Request failed:', err);
});
