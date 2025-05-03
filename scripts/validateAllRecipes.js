// scripts/validateAllRecipes.js
const fs = require("fs");
const path = require("path");

const recipesDir = path.join(__dirname, "..", "recipes");
const excluded = ["recipe-index.json"]; // skip utility/meta files

const files = fs.readdirSync(recipesDir)
  .filter(f => f.endsWith(".json") && !excluded.includes(f));

function validateAndFixRecipe(recipe, fileName) {
  const errors = [];
  const warnings = [];

  function check(field, condition, message) {
    if (!condition) errors.push(`❌ ${message} (field: ${field})`);
  }

  function checkSection(section, index) {
    if (!section.title) errors.push(`❌ Section ${index} missing 'title'`);
    if (!section.type) errors.push(`❌ Section ${index} missing 'type'`);
    if (!section.items) errors.push(`❌ Section ${index} missing 'items'`);
    if (section.type === "categorized-ingredients") {
      const cats = ["freezer", "refrigerator", "pantry", "other"];
      const missing = cats.filter(cat => !(cat in section.items));
      if (missing.length) {
        errors.push(`❌ Section ${index} missing categories: ${missing.join(", ")}`);
      }
    }
  }

  check("id", recipe.id && typeof recipe.id === "string", "Missing or invalid 'id'");
  check("title", recipe.title && typeof recipe.title === "string", "Missing or invalid 'title'");
  check("description", recipe.description && typeof recipe.description === "string", "Missing or invalid 'description'");
  check("sections", Array.isArray(recipe.sections), "'sections' must be an array");

  if (Array.isArray(recipe.sections)) {
    recipe.sections.forEach((section, i) => checkSection(section, i));
  }

  const fullPath = path.join(recipesDir, fileName);

  if (errors.length === 0) {
    fs.writeFileSync(fullPath, JSON.stringify(recipe, null, 2));
  }

  return { file: fileName, errors, warnings };
}

// 🏃 Run validation on all
console.log(`\n🔍 Scanning ${files.length} recipes in /recipes...\n`);

let totalErrors = 0;

for (const file of files) {
  const fullPath = path.join(recipesDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  const result = validateAndFixRecipe(data, file);

  console.log(`📄 ${file}`);
  if (result.errors.length === 0) {
    console.log("✅ Valid recipe. Overwrote with cleaned version.");
  } else {
    console.log(result.errors.join("\n"));
    totalErrors += result.errors.length;
    console.log("❌ Not overwritten due to validation errors.");
  }

  if (result.warnings.length) {
    console.log(result.warnings.join("\n"));
  }

  console.log(""); // spacing
}

console.log(`🔎 Done. Total critical issues found: ${totalErrors}\n`);
