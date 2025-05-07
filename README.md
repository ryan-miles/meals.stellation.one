# 🍽️ meals.stellation.one — Miles Family Meal Planner

A sleek, static web app for planning and presenting the weekly meals and grocery list for the Miles family. Designed for speed, style, and simplicity using pure HTML/CSS/JS, deployed via AWS (S3 + CloudFront). The AI features and surprise meal plan generator are powered by AWS Lambda functions managed with Terraform.

Live site: [meals.stellation.one](https://meals.stellation.one)

---

## 📦 Project Structure

```
meals.stellation.one/
├── website/                  # Static frontend files served via S3/CloudFront
│   ├── meals.html            # Landing hub for the weekly plan
│   ├── monday.html           # Daily meal pages (Mon–Fri)
│   ├── tuesday.html
│   ├── wednesday.html
│   ├── thursday.html
│   ├── friday.html
│   ├── week.html             # Grocery list view
│   ├── all-recipes.html      # Dynamic recipe browser
│   ├── meal-ai.html          # Cognito-authenticated AI tool (interfaces with Lambda)
│   ├── all-recipes.json      # 🔄 Auto-generated from /json/recipes/*.json
│   ├── schedule.json         # Weekly mapping of meals to days (updated by Lambda)
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── config.js         # API endpoint configuration
│   │   ├── loadRecipe.js     # Loads daily meals
│   │   ├── loadWeek.js       # Populates weekly grid
│   │   └── loadGroceryList.js# Builds grocery checklist
│   ├── json/
│   │   └── recipes/          # Source-of-truth JSON recipes
│   │       ├── butter-chicken.json
│   │       ├── dominos-pizza-night.json
│   │       ├── hothoney-groundbeef-bowls.json
│   │       ├── meatballs-with-zoodles.json
│   │       ├── pams-ranch-chicken.json
│   │       ├── Shakshuka.json
│   │       ├── shrimp-bowl-with-avocado-crema.json
│   │       ├── spaghetti.json
│   │       ├── spinach-artichoke-gnocchi-skillet-with-feta.json
│   │       ├── tacos.json
│   │       └── tuna-melt.json
│   ├── scripts/              # Node.js helper scripts
│   │   ├── buildAllRecipes.js
│   │   ├── setWeeklySchedule.js
│   │   ├── surprisePlan.js   # Local random plan generator
│   │   ├── validateAllRecipes.js
│   │   └── validateRecipe.js
│   ├── .github/workflows/
│   │   └── deploy.yml        # GitHub Action CI/CD pipeline for website
│   ├── images/
│   │   ├── ryan_miles.png
│   │   └── tes-tile.png      # Background pattern
│   └── favicon.ico
│
├── meals-gemini-api/         # AI recipe generator backend (Lambda + API Gateway)
│   ├── lambda_code/
│   │   ├── index.js
│   │   ├── package.json
│   │   └── test-G-API.ps1
│   └── terraform/
│       ├── main.tf
│       ├── providers.tf
│       ├── variables.tf
│       ├── lambda_deployment_package.zip
│       ├── apply.bat
│       ├── destroy.bat
│       └── plan.bat
│
└── surprisePlan/             # Surprise meal plan generator backend (Lambda + API Gateway)
    ├── lambda_code/
    │   ├── index.js
    │   ├── package.json
    │   └── test-G-API.ps1
    └── terraform/
        ├── main.tf
        ├── providers.tf
        ├── variables.tf
        ├── lambda_deployment_package.zip
        ├── apply.bat
        ├── destroy.bat
        └── plan.bat
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
- Accepts raw text → sends to backend API → returns downloadable recipe JSON
- Backend: **AWS Lambda** function (Node.js) fronted by **API Gateway**, deployed via **Terraform**.

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
- **Backend API:** AWS Lambda (Node.js), API Gateway
- **Infrastructure as Code (IaC):** Terraform (for backend API)
- **Data:** Static `.json` files in `/website/json/recipes` + `schedule.json`
- **Build Scripts:** Node.js (uses `date-fns`, `inquirer`)
- **CI/CD:** GitHub Actions → AWS S3 sync + CloudFront invalidate (for frontend)
- **Deploy Target (Frontend):**
  - AWS Account: `243728312407`
  - Region: `us-east-1`

---

## 🧪 Local Dev Workflow

1. Clone repo
2. Open `meals.html` or any weekday file in a browser
3. Edit `schedule.json` or add recipes in `/recipes/`
4. Validate:
```bash
node website/scripts/validateAllRecipes.js
```
5. Build `all-recipes.json`:
```bash
node website/scripts/buildAllRecipes.js
```
6. Serve locally (from `website` directory):
```bash
cd website
npx serve .
```
7. (Optional) Test/Deploy Backend API:
   - Navigate to `meals-gemini-api/terraform`
   - Use `plan.bat`, `apply.bat`, `destroy.bat`
8. (Optional) Test/Deploy Surprise Plan API:
   - Navigate to `surprisePlan/terraform`
   - Use `plan.bat`, `apply.bat`, `destroy.bat`

---

## 🧩 How It All Works Together

### Data Flow

1. **Recipe Creation**: Recipes are created (manually or via AI) and saved as `/website/json/recipes/*.json`.
2. **Recipe Indexing**: Run `buildAllRecipes.js` to generate `all-recipes.json` (used by the frontend).
3. **Weekly Plan**: `schedule.json` is updated (by Lambda or manually) to map days to recipe IDs.
4. **Frontend**: `meals.html` and other pages use `all-recipes.json` and `schedule.json` to display the plan.

---

## 🛠 Scripts in /website/scripts/

- **buildAllRecipes.js**: Scans `/json/recipes/*.json` and generates `all-recipes.json` for the frontend. Run this after adding or editing any recipe file.
- **setWeeklySchedule.js**: Manually set the weekly meal plan (updates `schedule.json`).
- **surprisePlan.js**: Locally generate a random meal plan for testing (mimics Lambda behavior).
- **validateAllRecipes.js**: Validates all recipe files for correct structure.
- **validateRecipe.js**: Validates a single recipe file.

---

## 🤖 Using the AI Recipe Generator (meal-ai.html)

1. Open `meal-ai.html` and log in via Cognito.
2. Enter your recipe idea and submit.
3. Download the generated JSON file.
4. Place the file in `/website/json/recipes/`.
5. Run `node website/scripts/buildAllRecipes.js` to update `all-recipes.json`.

---

## 🧪 Local Dev Workflow (Expanded)

1. Clone repo
2. Open `meals.html` or any weekday file in a browser
3. Add or edit recipes in `/website/json/recipes/`
4. Validate recipes:
```bash
node website/scripts/validateAllRecipes.js
```
5. Build `all-recipes.json`:
```bash
node website/scripts/buildAllRecipes.js
```
6. Edit or update `schedule.json` (manually, with `setWeeklySchedule.js`, or via Lambda)
7. Serve locally (from `website` directory):
```bash
cd website
npx serve .
```
8. (Optional) Test/Deploy Backend API:
   - Navigate to `meals-gemini-api/terraform`
   - Use `plan.bat`, `apply.bat`, `destroy.bat`
9. (Optional) Test/Deploy Surprise Plan API:
   - Navigate to `surprisePlan/terraform`
   - Use `plan.bat`, `apply.bat`, `destroy.bat`

---

## 🛠 Troubleshooting & Tips

- **If a day is missing on the frontend:**
  - Check that `schedule.json` uses recipe IDs that exactly match those in `all-recipes.json` (case-sensitive).
  - Ensure all weekdays (monday–friday) are present as keys in `schedule.json`.
- **If a new recipe isn’t showing up:**
  - Make sure you’ve run `buildAllRecipes.js` after adding it.
  - Validate the new recipe with `validateRecipe.js`.
- **If the AI tool output isn’t working:**
  - Download the JSON, place it in `/website/json/recipes/`, and rebuild `all-recipes.json`.
- **Automated vs. Manual Steps:**
  - Lambda (surprisePlan) can update `schedule.json` automatically on a schedule.
  - Scripts in `/website/scripts/` are for local/manual updates and validation.

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

### Individual Recipes (`/website/json/recipes/*.json`)
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
