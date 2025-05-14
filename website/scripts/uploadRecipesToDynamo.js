// Script to upload selected recipe JSON files to DynamoDB
defs = `
Usage:
  node uploadRecipesToDynamo.js file1.json file2.json ...

This script uploads the given recipe files (in DynamoDB format) to the meals-recipes DynamoDB table.
`;

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Update region as needed
AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const tableName = 'meals-recipes';

async function uploadRecipe(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const params = {
    TableName: tableName,
    Item: data
  };
  await dynamodb.put(params).promise();
  console.log(`✅ Uploaded ${path.basename(filePath)}`);
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.log(defs);
    process.exit(1);
  }
  for (const file of files) {
    try {
      await uploadRecipe(file);
    } catch (err) {
      console.error(`❌ Failed to upload ${file}:`, err.message);
    }
  }
}

main();
