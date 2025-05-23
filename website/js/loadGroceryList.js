async function loadGroceryList() {
  const container = document.getElementById("grocery-list-container");
  const weekDates = document.getElementById("week-dates");
  container.innerHTML = "<p style='text-align:center;'>Loading grocery list...</p>";

  try {    // Fetch schedule and recipes using configuration
    const [scheduleRes, recipesRes] = await Promise.all([
      fetch(window.API_ENDPOINTS?.schedule_s3 || "https://s3.us-east-1.amazonaws.com/meals.stellation.one/schedule.json?ts=" + Date.now()),
      fetch(window.API_ENDPOINTS?.recipes_api || "https://ida2uil5ed.execute-api.us-east-1.amazonaws.com/recipes")
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
    const weekRecipes = recipeIds.map(id => recipes.find(r => r && r.id === id)).filter(Boolean);

    // Aggregate all ingredients by storage type from sections/items
    const storageTypes = [
      { key: "freezer", label: "🥶 Freezer" },
      { key: "refrigerator", label: "🥬 Refrigerator" },
      { key: "pantry", label: "🧂 Pantry" }
    ];
    const grouped = { freezer: [], refrigerator: [], pantry: [] };

    for (const recipe of weekRecipes) {
      if (Array.isArray(recipe.sections)) {
        for (const section of recipe.sections) {
          if (!section.items) continue;
          // Special handling for Quick Ingredient Checklist with storage prefixes
          if (section.type === "checklist" && Array.isArray(section.items)) {
            for (const ing of section.items) {
              if (typeof ing === "string") {
                let matched = false;
                // Check for storage prefixes
                for (const storage of ["freezer", "refrigerator", "pantry"]) {
                  const prefix = storage.charAt(0).toUpperCase() + storage.slice(1) + ":";
                  if (ing.toLowerCase().startsWith(prefix.toLowerCase())) {
                    grouped[storage].push({ name: ing.slice(prefix.length).trim() });
                    matched = true;
                    break;
                  }
                }
                // NEW: Check for Produce prefix and treat as refrigerator
                if (!matched && ing.toLowerCase().startsWith("produce:")) {
                  grouped.refrigerator.push({ name: ing.slice("produce:".length).trim() });
                  matched = true;
                }
                if (!matched) grouped.pantry.push({ name: ing }); // fallback
              } else if (typeof ing === "object" && ing) {
                grouped.pantry.push(ing);
              }
            }
            continue;
          }
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

    // Remove duplicates (by name + unit + note)
    function uniqueIngredients(ings) {
      const seen = new Set();
      return ings.filter(ing => {
        const key = `${ing.name||ing}|${ing.unit||''}|${ing.note||''}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    let html = "";
    let itemCounter = 0; // For unique IDs
    
    for (const { key, label } of storageTypes) {
      const ings = uniqueIngredients(grouped[key]);
      html += `<section class="bento-box"><h2>${label}</h2>`;
      if (ings.length === 0) {
        html += `<p style='text-align:center;'>None</p>`;
      } else {
        html += `<ul class="grocery-list grocery-checklist">`;
        for (const ing of ings) {
          itemCounter++;
          const itemId = `grocery-item-${itemCounter}`;
          
          let line = `<li class="grocery-item">`;
          line += `<input type="checkbox" id="${itemId}" class="grocery-checkbox">`;
          line += `<label for="${itemId}" class="grocery-label">`;
          
          if (ing.amount) line += `${ing.amount} `;
          if (ing.unit) line += `${ing.unit} `;
          line += `${ing.name || ing}`;
          if (ing.note) line += ` <span class="note">(${ing.note})</span>`;
          
          line += `</label>`;
          line += `</li>`;
          html += line;
        }
        html += `</ul>`;
      }
      html += `</section>`;
    }
    container.innerHTML = html;

    // Add event listeners for checkbox interactions
    addCheckboxListeners();
    
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='text-align:center;'>Error loading grocery list.</p>";
  }
}

// Function to handle checkbox interactions
function addCheckboxListeners() {
  const checkboxes = document.querySelectorAll('.grocery-checkbox');
  
  checkboxes.forEach(checkbox => {
    // Load saved state from localStorage
    const savedState = localStorage.getItem(checkbox.id);
    if (savedState === 'true') {
      checkbox.checked = true;
      checkbox.closest('.grocery-item').classList.add('checked');
    }
    
    // Add change event listener
    checkbox.addEventListener('change', function() {
      const listItem = this.closest('.grocery-item');
      
      if (this.checked) {
        listItem.classList.add('checked');
        localStorage.setItem(this.id, 'true');
      } else {
        listItem.classList.remove('checked');
        localStorage.setItem(this.id, 'false');
      }
    });
  });
}

loadGroceryList();