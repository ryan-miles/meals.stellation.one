# 🍽️ meals.stellation.one — Miles Family Meal Planner

A sleek, static web app for planning and presenting the weekly meals and grocery list for the Miles family. Designed for speed, style, and simplicity using pure HTML/CSS/JS, deployed via AWS (S3 + CloudFront).

Live site: [meals.stellation.one](https://meals.stellation.one)

---

## 📦 Project Structure

```
meals.stellation.one/
├── meals.html              # Landing hub for the weekly plan
├── monday.html             # Daily meal pages (Mon–Fri)
├── tuesday.html
├── wednesday.html
├── thursday.html
├── friday.html
├── week.html               # Grocery list view
├── all-recipes.html        # Dynamic recipe browser
├── meal-ai.html            # Cognito-authenticated AI tool
│
├── all-recipes.json        # 🔄 Auto-generated from /recipes/*.json
├── schedule.json           # Weekly mapping of meals to days
│
├── css/
│   └── styles.css
│
├── js/
│   ├── loadRecipe.js       # Loads daily meals
│   ├── loadWeek.js         # Populates weekly grid
│   └── loadGroceryList.js  # Builds grocery checklist
│
├── recipes/                # Source-of-truth JSON recipes
│   ├── butter-chicken.json
│   ├── classic-protein-bowl.json
│   ├── hot-honey-ground-beef-bowls.json
│   ├── pams-ranch-chicken.json
│   ├── shrimp-bowl-with-avocado-crema.json
│   ├── spaghetti.json
│   ├── tacos.json
│   └── dominos-pizza-night.json
│
├── scripts/
│   ├── buildAllRecipes.js
│   ├── validateRecipe.js
│   └── validateAllRecipes.js
│
├── .github/workflows/
│   └── deploy.yml          # GitHub Action CI/CD pipeline
├── images/
│   ├── ryan_miles.png
│   └── tes-tile.png        # Background pattern
└── favicon.ico
```

---

## 🧠 Key Concepts

### Dynamic Weekly Plan (`meals.html`)
- Displays date-ranged meal overview for Mon–Fri
- JS-powered rendering via `loadWeek.js`
- Includes shortcut buttons for:
  - 📚 All Recipes
  - 🛒 Grocery List
  - 🤖 AI Recipe Generator

### Individual Day Pages (`monday.html`, etc.)
- Shared layout powered by `loadRecipe.js`
- Fetches from `schedule.json` + `all-recipes.json`

### Grocery List Builder (`week.html`)
- Fully interactive checklist via `loadGroceryList.js`
- Categorized by `freezer`, `refrigerator`, `pantry`
- Responsive + mobile-friendly design

### Recipe Explorer (`all-recipes.html`)
- Auto-generates cards from `all-recipes.json`
- JS-driven client-side rendering

### AI Tooling (`meal-ai.html`)
- Protected by **Amazon Cognito Hosted UI**
- Accepts raw text → returns downloadable recipe JSON
- Integrated with API Gateway backend

---

## 🔐 Cognito Authentication

Used exclusively on `meal-ai.html`. Basic flow:

1. Redirect to Cognito-hosted login if no token
2. Exchange auth code → access/id token
3. Display AI UI if authenticated
4. Logout = sessionStorage clear + redirect

**Config:**
- User Pool: `MealAiUsers`
- Region: `us-east-1`
- Client ID: `1qi2sj7lbi13k4v21b5rr7d6nm`
- Domain: `https://us-east-1s3w0rq4v6.auth.us-east-1.amazoncognito.com`
- Callback/Sign-out: `https://meals.stellation.one/meal-ai.html`

---

## 🛠 Tech Stack

- **Frontend:** Pure HTML, CSS (custom properties), vanilla JS
- **Data:** Static `.json` files in `/recipes` + `schedule.json`
- **Build Scripts:** Node.js (uses `date-fns`, `inquirer`)
- **CI/CD:** GitHub Actions → AWS S3 sync + CloudFront invalidate
- **Deploy Target:**  
  - AWS Account: `243728312407`  
  - Region: `us-east-1`

---

## 🧪 Local Dev Workflow

1. Clone repo
2. Open `meals.html` or any weekday file in a browser
3. Edit `schedule.json` or add recipes in `/recipes/`
4. Validate:
```bash
node scripts/validateAllRecipes.js
```
5. Build `all-recipes.json`:
```bash
node scripts/buildAllRecipes.js
```
6. Serve locally:
```bash
npx serve .
```

---

## 🧬 Data Format

### `schedule.json`
```json
{
  "weekStart": "2025-03-31",
  "monday": "butter-chicken",
  "tuesday": "hot-honey-ground-beef-bowls",
  "wednesday": "butter-chicken",
  "thursday": "classic-protein-bowl",
  "friday": "dominos-pizza-night"
}
```

### Individual Recipes (`/recipes/*.json`)
Each contains:
- `id`, `title`, `description`, `day` (optional)
- `sections`: list of ingredients, steps, and nutrition blocks

Example section types:
- `"categorized-ingredients"`
- `"steps"`
- `"list"`

---

## 🎨 Styling

- Custom CSS Grid + bento-box layout
- CSS variables for easy theming
- Smooth mobile responsiveness
- Tile background from `/images/tes-tile.png`

---

## ✅ Recent Enhancements

- ✅ New recipes: Butter Chicken, Shrimp Bowls, etc.
- ✅ Grocery list auto-categorization
- ✅ Cognito authentication + logout flow
- ✅ AI JSON generation tool
- ✅ Improved styling & layout logic

---

## 📋 To-Do / Roadmap

- [ ] Add Saturday/Sunday support
- [ ] Frontend UI to modify `schedule.json`
- [ ] Grocery list persistence via LocalStorage
- [ ] Print button for grocery list
- [ ] Add thumbnail/preview images to recipes
- [ ] Mobile JSON editor for recipes
- [ ] “Surprise Me” meal plan generator
- [ ] AI-powered meal suggestions

---

## 👨‍👩‍👧‍👦 Built for the Miles Family
Handcrafted with ❤️ to make weeknight dinners easier, faster, and yummier.
