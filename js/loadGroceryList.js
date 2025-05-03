async function loadGroceryList() {
    const container = document.getElementById("grocery-list-container");
  
    try {
      const [scheduleRes, recipesRes] = await Promise.all([
        fetch("schedule.json"),
        fetch("all-recipes.json")
      ]);
  
      const schedule = await scheduleRes.json();
      const recipes = await recipesRes.json();
  
      const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      const usedRecipes = weekdays
        .map(day => recipes.find(r => r.id === schedule[day]))
        .filter(Boolean);
  
      const allItems = {
        freezer: new Set(),
        refrigerator: new Set(),
        pantry: new Set(),
        other: new Set()
      };
  
      for (const recipe of usedRecipes) {
        const checklistSection = recipe.sections.find(
          s => s.type === "categorized-ingredients"
        );
        if (!checklistSection) continue;
  
        const items = checklistSection.items;
        for (const category in items) {
          items[category].forEach(ingredient => {
            allItems[category]?.add(ingredient);
          });
        }
      }
  
      const sectionHTML = (title, emoji, items) => `
        <section class="bento-box">
          <div class="container">
            <h2>${emoji} ${title}</h2>
            <ul>
              ${[...items]
                .sort()
                .map(
                  (item, index) => `
                  <li>
                    <label>
                      <input type="checkbox" id="${title}-${index}" />
                      ${item}
                    </label>
                  </li>
                `
                )
                .join("")}
            </ul>
          </div>
        </section>
      `;
  
      container.innerHTML = `
        ${sectionHTML("Freezer", "🥶", allItems.freezer)}
        ${sectionHTML("Refrigerator", "🥬", allItems.refrigerator)}
        ${sectionHTML("Pantry", "🧂", allItems.pantry)}
        ${allItems.other.size ? sectionHTML("Other", "❓", allItems.other) : ""}
      `;
    } catch (err) {
      console.error(err);
      container.innerHTML = "<p>Error loading grocery list.</p>";
    }
  }
  
  loadGroceryList();
  