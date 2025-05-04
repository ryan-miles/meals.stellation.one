// scripts/validateRecipe.js
const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];
if (!filePath) {
  console.error("❌ Please provide a path to a recipe file, e.g. 'recipes/tacos.json'");
  process.exit(1);
}

const recipe = JSON.parse(fs.readFileSync(filePath, "utf-8"));
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
    const missingCats = cats.filter(c => !(c in section.items));
    if (missingCats.length > 0) {
      errors.push(`❌ Section ${index} missing categories: ${missingCats.join(", ")}`);
    }
  }
}

// Basic field checks
check("id", recipe.id && typeof recipe.id === "string", "Missing or invalid 'id'");
check("title", recipe.title && typeof recipe.title === "string", "Missing or invalid 'title'");
check("sections", Array.isArray(recipe.sections), "'sections' must be an array");

// Description is optional
if (!recipe.description) {
  warnings.push("⚠️ No description provided.");
}

// Check sections
if (Array.isArray(recipe.sections)) {
  recipe.sections.forEach((section, i) => checkSection(section, i));
}

// Output result
console.log(`\n🔍 Validating: ${filePath}`);
console.log("-".repeat(60));

if (errors.length === 0) {
  console.log("✅ No critical issues found!");
} else {
  console.log(errors.join("\n"));
}

if (warnings.length > 0) {
  console.log("\n" + warnings.join("\n"));
}

// Optional: write an improved version
const suggestPath = path.join(
  path.dirname(filePath),
  path.basename(filePath, ".json") + ".fixed.json"
);

fs.writeFileSync(suggestPath, JSON.stringify(recipe, null, 2));
console.log(`\n🛠️ Wrote copy to: ${suggestPath}`);
