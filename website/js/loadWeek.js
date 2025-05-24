async function loadWeekPlan() {
  const container = document.getElementById("week-grid");
  const header = document.getElementById("week-dates");

  try {
    let schedule;
    // Use configuration-based API endpoints
    const scheduleRes = await fetch(window.API_ENDPOINTS?.schedule_api || "https://eyfzhv6w38.execute-api.us-east-1.amazonaws.com/recipes");
    schedule = await scheduleRes.json();

    const recipesRes = await fetch(window.API_ENDPOINTS?.recipes_api || "https://ida2uil5ed.execute-api.us-east-1.amazonaws.com/recipes");
    const recipes = await recipesRes.json();

    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const html = [];

    // Format date range from weekStart
    if (schedule.weekStart) {
      const [year, month, day] = schedule.weekStart.split("-").map(Number);
      const start = new Date(year, month - 1, day);
      const end = new Date(start);
      end.setDate(start.getDate() + 4);
    
      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
      });
    
      const startFormatted = formatter.format(start);
      const endFormatted = formatter.format(end);
    
      if (header) {
        header.textContent = `📅 ${startFormatted} – ${endFormatted}, ${year}`;
      }
    }
    
    for (const day of weekdays) {
      const recipeId = schedule[day];
      if (!recipeId) continue;
      const recipe = recipes.find(r => r && r.id === recipeId);
      if (!recipe) continue;

      html.push(`
        <a class="grid-item-link" href="${day}.html">
          <div class="grid-item">
            <h3>${capitalize(day)}</h3>
            <p>${recipe.title}</p>
          </div>
        </a>
      `);
    }

    container.innerHTML = html.join("");

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading weekly meal plan.</p>";
  }
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

loadWeekPlan();
