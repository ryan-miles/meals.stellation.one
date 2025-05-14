const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer").default;
const { parseISO, isValid } = require("date-fns");
const fetch = require("node-fetch");

const apiUrl = "https://ida2uil5ed.execute-api.us-east-1.amazonaws.com/recipes"; // DynamoDB-backed API endpoint
const scheduleFile = path.join(__dirname, "..", "schedule.json");

async function getRecipesFromApi() {
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.status}`);
  const data = await res.json();
  // If the API returns an array of recipes
  return data.map(r => ({
    name: `${r.title} (${r.id})`,
    value: r.id
  }));
}

async function main() {
  const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  let recipes;
  try {
    recipes = await getRecipesFromApi();
  } catch (err) {
    console.error("Error fetching recipes from API:", err.message);
    process.exit(1);
  }

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
  console.log("\n✅ Updated scheduledynamo.json:\n", newSchedule);
}

main();
