// loadGroceryList.js - Script for Weekly Grocery List page (week.html)
// This script fetches the weekly meal schedule and recipe data,
// aggregates ingredients by storage type, removes duplicates,
// and renders a categorized grocery list on the page.

async function loadGroceryList() {
  // Reference page elements for content injection and date display
  const container = document.getElementById("grocery-list-container");
  const weekDates = document.getElementById("week-dates");
  container.innerHTML = "<p style='text-align:center;'>Loading grocery list...</p>";

  try {
    // Fetch the schedule JSON and recipe data from the API
    const [scheduleRes, recipesRes] = await Promise.all([
      fetch("schedule.json"),
      fetch("https://api.meals.stellation.one/dynamo")
    ]);
    // Parse fetched responses into JavaScript objects
    const schedule = await scheduleRes.json();
    const recipes = await recipesRes.json();

    // Compute and display the date range for the week
    if (schedule.weekStart && weekDates) {
      const [year, month, day] = schedule.weekStart.split("-").map(Number);
      const start = new Date(year, month - 1, day);
      const end = new Date(start);
      end.setDate(start.getDate() + 4);
      const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
      const startFormatted = formatter.format(start);
      const endFormatted = formatter.format(end);
      weekDates.textContent = `Covers meals for ${startFormatted} - ${endFormatted}, ${year}`;
    }

    // Identify recipe IDs for each weekday and find full recipe objects
    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const recipeIds = weekdays.map(day => schedule[day]).filter(Boolean);
    const weekRecipes = recipeIds.map(id => recipes.find(r => r && r.id === id)).filter(Boolean);

    // Aggregate ingredients from all recipes, grouped by storage location
    const storageTypes = [
      { key: "freezer", label: "🥶 Freezer" },
      { key: "refrigerator", label: "🥬 Refrigerator" },
      { key: "pantry", label: "🧂 Pantry" }
    ];
    const grouped = { freezer: [], refrigerator: [], pantry: [] };

    for (const recipe of weekRecipes) {
      if (Array.isArray(recipe.sections)) {
        for (const section of recipe.sections) {
          if (section.items) {
            for (const storage of ["freezer", "refrigerator", "pantry"]) {
              if (Array.isArray(section.items[storage])) {
                for (const ing of section.items[storage]) {
                  // Store as string or object
                  if (typeof ing === "string") {
                    grouped[storage].push({ name: ing });
                  } else if (typeof ing === "object" && ing !== null) {
                    grouped[storage].push(ing);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Helper function to de-duplicate ingredients by name, unit, and note
    // Prevents listing the same ingredient multiple times
    function uniqueIngredients(ings) {
      const seen = new Set();
      return ings.filter(ing => {
        const key = `${ing.name||ing}|${ing.unit||''}|${ing.note||''}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Build and inject HTML sections for each storage category
    let html = "";
    for (const { key, label } of storageTypes) {
      const ings = uniqueIngredients(grouped[key]);
      html += `<section class="bento-box"><h2>${label}</h2>`;
      if (ings.length === 0) {
        html += `<p style='text-align:center;'>None</p>`;
      } else {
        html += `<ul class="grocery-list">`;
        for (const ing of ings) {
          let line = `<li>`;
          if (ing.amount) line += `${ing.amount} `;
          if (ing.unit) line += `${ing.unit} `;
          line += `${ing.name || ing}`;
          if (ing.note) line += ` <span class="note">(${ing.note})</span>`;
          line += `</li>`;
          html += line;
        }
        html += `</ul>`;
      }
      html += `</section>`;
    }
    container.innerHTML = html;
  } catch (err) {
    // Log any errors and show a friendly message to the user
    console.error(err);
    container.innerHTML = "<p style='text-align:center;'>Error loading grocery list.</p>";
  }
}

// Kick off grocery list loading when the script runs
loadGroceryList();
