async function loadRecipeForDay(day) {
  const recipeContainer = document.getElementById("recipe-container");

  try {
    const [scheduleRes, recipesRes] = await Promise.all([
      fetch("scheduledynamo.json"),
      fetch("https://ida2uil5ed.execute-api.us-east-1.amazonaws.com/recipes")
    ]);

    const schedule = await scheduleRes.json();
    const recipes = await recipesRes.json();

    const recipeId = schedule[day];
    const recipe = recipes.find(r => r.id === recipeId);

    if (!recipe) {
      recipeContainer.innerHTML = `<p>No recipe found for ${day}.</p>`;
      return;
    }

    const html = [];

    html.push(`
      <section class="bento-box">
        <div class="container">
          <h1 style="text-align: center;">${recipe.title}</h1>
          <p style="text-align: center;">${recipe.description || ""}</p>
        </div>
      </section>
    `);

    for (const section of recipe.sections) {
      html.push(`<section class="bento-box"><div class="container"><h3>${section.title}</h3>`);

      if (section.type === "list") {
        html.push("<ul>");
        for (const item of section.items) {
          html.push(`<li>${item}</li>`);
        }
        html.push("</ul>");
      } else if (section.type === "steps") {
        html.push("<ol>");
        for (const item of section.items) {
          html.push(`<li>${item}</li>`);
        }
        html.push("</ol>");
      } else if (section.type === "categorized-ingredients") {
        for (const category of Object.keys(section.items)) {
          const ingredients = section.items[category];
          if (ingredients.length > 0) {
            html.push(`<h4 style="margin-top: 0.75rem;">${capitalize(category)}</h4><ul>`);
            for (const item of ingredients) {
              html.push(`<li>${item}</li>`);
            }
            html.push("</ul>");
          }
        }
      }

      html.push("</div></section>");
    }

    // ✅ Add Google Form Feedback Section
    html.push(`
      <section class="bento-box">
        <div class="container" style="text-align: center;">
          <h3>💬 Family Feedback</h3>
          <p>Let us know what you thought of this meal!</p>
<a href="https://docs.google.com/forms/d/e/1FAIpQLSeMBl-U41wZWRviwO8BFUhrudkKJYLs1Be5lSoaFfut1LYO9w/viewform?usp=pp_url&entry.1297302445=${recipe.id}"
             target="_blank"
             class="button"
             style="display: inline-block; padding: 0.5em 1em; border-radius: 8px; background-color: #4CAF50; color: white; text-decoration: none;">
            Leave Feedback
          </a>
        </div>
      </section>
    `);

    recipeContainer.innerHTML = html.join("");
  } catch (err) {
    console.error(err);
    recipeContainer.innerHTML = "<p>Error loading recipe.</p>";
  }
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
