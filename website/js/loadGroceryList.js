async function loadGroceryList() {
  const container = document.getElementById("grocery-list-container");
  const weekDates = document.getElementById("week-dates");
  container.innerHTML = "<p style='text-align:center;'>Loading grocery list...</p>";

  try {
    // Fetch schedule and recipes
    const [scheduleRes, recipesRes] = await Promise.all([
      fetch("schedule.json"),
      fetch("https://ida2uil5ed.execute-api.us-east-1.amazonaws.com/recipes")
    ]);
    const schedule = await scheduleRes.json();
    const recipes = await recipesRes.json();

    // Set the week date range in the subtitle
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

    // Get recipe IDs for the week
    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const recipeIds = weekdays.map(day => schedule[day]).filter(Boolean);

    // Find the recipe objects for the week
    const weekRecipes = recipeIds.map(id => recipes.find(r => r && r.id === id)).filter(Boolean);

    // Aggregate all ingredients by storage type
    const storageTypes = [
      { key: "freezer", label: "🥶 Freezer" },
      { key: "refrigerator", label: "🥬 Refrigerator" },
      { key: "pantry", label: "🧂 Pantry" }
    ];
    const grouped = { freezer: [], refrigerator: [], pantry: [] };

    for (const recipe of weekRecipes) {
      if (Array.isArray(recipe.ingredients)) {
        for (const ing of recipe.ingredients) {
          // Default to pantry if not specified
          const storage = (ing.storage || "pantry").toLowerCase();
          if (grouped[storage]) {
            grouped[storage].push(ing);
          } else {
            grouped["pantry"].push(ing);
          }
        }
      }
    }

    // Remove duplicates (by name + unit + note)
    function uniqueIngredients(ings) {
      const seen = new Set();
      return ings.filter(ing => {
        const key = `${ing.name}|${ing.unit||''}|${ing.note||''}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

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
          line += `${ing.name}`;
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
    console.error(err);
    container.innerHTML = "<p style='text-align:center;'>Error loading grocery list.</p>";
  }
}

loadGroceryList();
