const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer").default;
const { parseISO, isValid } = require("date-fns");

const recipesDir = path.join(__dirname, "..", "json", "recipes");
const scheduleFile = path.join(__dirname, "..", "schedule.json");

async function main() {
  const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  const recipeFiles = fs
    .readdirSync(recipesDir)
    .filter(f => f.endsWith(".json"));

  const recipes = recipeFiles.map(filename => {
    const filePath = path.join(recipesDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return {
      name: `${data.title} (${data.id})`,
      value: data.id
    };
  });

  // Ask for week start date
  const { weekStartInput } = await inquirer.prompt([
    {
      type: "input",
      name: "weekStartInput",
      message: "Enter the start date for this week (YYYY-MM-DD, e.g. 2025-03-24):",
      validate: input => {
        const date = parseISO(input);
        return isValid(date) || "Please enter a valid date in YYYY-MM-DD format.";
      }
    }
  ]);

  const newSchedule = { weekStart: weekStartInput };

  for (const day of weekdays) {
    const { selectedRecipe } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedRecipe",
        message: `Select recipe for ${day.charAt(0).toUpperCase() + day.slice(1)}:`,
        choices: recipes
      }
    ]);

    newSchedule[day] = selectedRecipe;
  }

  fs.writeFileSync(scheduleFile, JSON.stringify(newSchedule, null, 2));
  console.log("\n✅ Updated schedule.json:\n", newSchedule);
}

main();
