// scripts/buildAllRecipes.js
const fs = require("fs");
const path = require("path");

const recipesDir = path.join(__dirname, "..", "recipes");
const outputFile = path.join(__dirname, "..", "all-recipes.json");

const buildAllRecipes = () => {
  const files = fs.readdirSync(recipesDir).filter(file => file.endsWith(".json"));

  const allRecipes = files.map(filename => {
    const filePath = path.join(recipesDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  });

  fs.writeFileSync(outputFile, JSON.stringify(allRecipes, null, 2));
  console.log(`✅ Generated all-recipes.json with ${allRecipes.length} recipes`);
};

buildAllRecipes();
