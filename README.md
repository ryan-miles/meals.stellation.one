# 🍽️ meals.stellation.one — Miles Family Meal Planner

A sleek, static web app for planning and presenting the weekly meals and grocery list for the Miles family. Designed for speed, style, and simplicity using pure HTML/CSS/JS, deployed via AWS (S3 + CloudFront). AI-powered recipe JSON generation is handled by an AWS Lambda function managed with Terraform.

Live site: [meals.stellation.one](https://meals.stellation.one)

---

## 📦 Project Structure

```
meals.stellation.one/
├── website/                  # Static frontend web app (HTML, CSS, JS, recipes, scripts)
│   ├── all-recipes.html      # Recipe browser page
│   ├── all-recipes.json      # Aggregated recipes (plain JSON)
│   ├── all-recipesdynamo.html# Recipe browser (DynamoDB version)
│   ├── all-recipesdynamo.json# Aggregated recipes (DynamoDB format)
│   ├── favicon.ico           # Site icon
│   ├── friday.html           # Friday meal page
│   ├── meal-ai.html          # AI-powered recipe builder UI
│   ├── meals.html            # Weekly meal plan overview
│   ├── mealsdynamo.html      # Weekly plan (DynamoDB version)
│   ├── mealsux2.html         # Alternate UI/UX for meals
│   ├── monday.html           # Monday meal page
│   ├── package.json          # Frontend dependencies (Node.js scripts)
│   ├── schedule.html         # Schedule UI
│   ├── schedule.json         # Weekly meal schedule (plain JSON)
│   ├── scheduledynamo.json   # Weekly meal schedule (DynamoDB format)
│   ├── thursday.html         # Thursday meal page
│   ├── tuesday.html          # Tuesday meal page
│   ├── wednesday.html        # Wednesday meal page
│   ├── week.html             # Grocery list page
│   ├── css/                  # Stylesheets
│   ├── images/               # Static images/assets
│   ├── js/                   # Frontend JavaScript modules
│   ├── json/                 # Recipe data (plain and DynamoDB)
│   └── scripts/              # Node.js helper/build scripts
├── meals-gemini-api/         # AWS Lambda (Node.js) for AI recipe API + Terraform IaC
│   ├── lambda_code/          # Lambda function source code
│   └── terraform/            # Infrastructure as Code for Lambda/API Gateway/IAM
├── surprisePlan/             # AWS Lambda (Node.js) for automatic weekly meal plan + Terraform IaC
│   ├── lambda_code/          # Lambda function source code
│   └── terraform/            # Infrastructure as Code for Lambda/IAM
├── get-recipes-dynamo/       # AWS Lambda (Node.js) for DynamoDB recipe access + Terraform IaC
│   ├── lambda_code/          # Lambda function source code
│   └── terraform/            # Infrastructure as Code for Lambda/DynamoDB/IAM
├── README.md                 # Project documentation
├── .gitignore                # Git ignore rules
```

---

## 📦 Website & Backend File Reference

Below is a reference for key files in the `/website` folder and backend Lambda `index.js` files. Each entry lists the file's purpose, its inputs, outputs, and dependencies, so you always know why a file exists and how it fits into the project.

### Website Folder

| File / Script                | Purpose / Description                                              | Inputs / Reads From                                 | Outputs / Generates                | Dependencies / Interacts With                |
|-----------------------------|-------------------------------------------------------------------|-----------------------------------------------------|-------------------------------------|----------------------------------------------|
| all-recipes.html            | Recipe browser UI (static, plain JSON)                            | all-recipes.json                                    | -                                   | JS: loadRecipe.js, loadWeek.js              |
| all-recipes.json            | Aggregated recipes (plain JSON format for static site)             | Built from /json/recipes/*.json via build script    | -                                   | Used by all-recipes.html, loadRecipe.js      |
| all-recipesdynamo.html      | Recipe browser UI (DynamoDB version)                              | all-recipesdynamo.json (or API)                     | -                                   | JS: fetchAllRecipesDynamo.js                |
| all-recipesdynamo.json      | Aggregated recipes (DynamoDB export format)                        | Built from DynamoDB or /json/recipes-dynamo/*.json  | -                                   | Used by all-recipesdynamo.html, scripts      |
| meals.html                  | Weekly meal plan overview (static, plain JSON)                     | schedule.json, all-recipes.json                     | -                                   | JS: loadWeek.js                             |
| mealsdynamo.html            | Weekly meal plan (DynamoDB version)                                | scheduledynamo.json (or API)                        | -                                   | JS: setWeeklyScheduleDynamo.js              |
| mealsux2.html               | Alternate UI/UX for meals (experimental/variant)                   | schedule.json, all-recipes.json                     | -                                   | JS: loadWeek.js                             |
| meal-ai.html                | AI-powered recipe builder UI (Cognito-protected)                   | User input, backend API                             | Downloadable recipe JSON            | Backend: meals-gemini-api Lambda             |
| schedule.html               | Schedule UI (may be legacy/alternate)                              | schedule.json                                       | -                                   | JS: loadWeek.js                             |
| schedule.json               | Weekly meal schedule (plain JSON for static site)                  | Manually edited or setWeeklySchedule.js             | -                                   | Used by meals.html, loadWeek.js              |
| scheduledynamo.json         | Weekly meal schedule (DynamoDB format/export)                      | Built from DynamoDB or scripts                      | -                                   | Used by mealsdynamo.html, scripts            |
| friday.html, monday.html,   | Daily meal pages (static, one per weekday)                         | schedule.json, all-recipes.json                     | -                                   | JS: loadRecipe.js                            |
| tuesday.html, wednesday.html, thursday.html |                                                         |                                                     |                                     |                                              |
| week.html                   | Grocery list page (interactive checklist)                          | schedule.json, all-recipes.json                     | -                                   | JS: loadGroceryList.js                      |
| css/                        | Stylesheets (site-wide CSS)                                        | -                                                   | -                                   | Used by all HTML pages                       |
| images/                     | Static images/assets                                               | -                                                   | -                                   | Used by HTML/CSS                             |
| js/                         | Frontend JavaScript modules (loaders, config)                      | -                                                   | -                                   | Used by HTML pages                           |
| json/recipes/               | Source-of-truth recipe JSON files (plain format)                   | Manually added or via meal-ai.html                  | -                                   | Used by buildAllRecipes.js                   |
| json/recipes-dynamo/        | Recipe JSON files in DynamoDB export format                        | Scripts or DynamoDB export                          | -                                   | Used by convertDynamoToPlainJson.js          |
| scripts/buildAllRecipes.js  | Builds all-recipes.json from /json/recipes/                        | /json/recipes/*.json                                | all-recipes.json                    | Node.js, used in dev workflow                |
| scripts/validateAllRecipes.js| Validates all recipe files in /json/recipes/                       | /json/recipes/*.json                                | -                                   | Node.js, used in dev workflow                |
| scripts/setWeeklySchedule.js| Interactive CLI to set weekly plan (plain JSON)                    | schedule.json, all-recipes.json                     | schedule.json                       | Node.js, used in dev workflow                |
| scripts/convertDynamoToPlainJson.js | Converts DynamoDB recipe JSON to plain JSON format         | /json/recipes-dynamo/*.json                         | /json/recipes/*.json                | Node.js, used in dev workflow                |
| scripts/convertRecipesForDynamo.js | Converts plain JSON recipes to DynamoDB format             | /json/recipes/*.json                                | /json/recipes-dynamo/*.json         | Node.js, used in dev workflow                |
| scripts/fetchAllRecipesDynamo.js | Fetches all recipes from DynamoDB and saves as JSON         | DynamoDB                                            | all-recipesdynamo.json              | Node.js, AWS SDK                             |
| scripts/setWeeklyScheduleDynamo.js | CLI to set weekly plan in DynamoDB format                 | scheduledynamo.json, all-recipesdynamo.json         | scheduledynamo.json                  | Node.js, used in dev workflow                |
| scripts/surprisePlan.js     | Generates a random meal plan for the week (plain or DynamoDB)      | all-recipes.json or all-recipesdynamo.json          | schedule.json or scheduledynamo.json| Node.js, used in dev workflow                |
| scripts/uploadRecipesToDynamo.js | Uploads recipes to DynamoDB                                 | /json/recipes/*.json                                | DynamoDB                            | Node.js, AWS SDK                             |

### Backend Lambda Functions (index.js)

| Path                                      | Purpose / Description                                 | Inputs / Reads From         | Outputs / Generates         | Dependencies / Interacts With         |
|-------------------------------------------|------------------------------------------------------|----------------------------|-----------------------------|---------------------------------------|
| meals-gemini-api/lambda_code/index.js     | Handles AI recipe generation API requests             | API Gateway event, user input| AI-generated recipe JSON    | Google Gemini API, AWS Lambda         |
| surprisePlan/lambda_code/index.js         | Generates and stores a random weekly meal plan        | DynamoDB (recipes table)    | Updated meal plan in DynamoDB| AWS SDK, DynamoDB                     |
| get-recipes-dynamo/lambda_code/index.js   | Provides recipe data from DynamoDB for frontend/API   | DynamoDB (recipes table)    | Recipe JSON for frontend/API | AWS SDK, DynamoDB                     |

---

## 🧠 Key Concepts

### Dynamic Weekly Plan ([meals.html](website/meals.html))
- Displays a date-ranged meal overview for Mon–Fri
- JS-powered rendering via [`loadWeek.js`](website/js/loadWeek.js)
- Includes shortcut buttons for:
  - 📚 All Recipes
  - 🛒 Grocery List
  - 🤖 AI Recipe Builder

### Individual Day Pages ([monday.html](website/monday.html), etc.)
- Shared layout powered by [`loadRecipe.js`](website/js/loadRecipe.js)
- Fetches from [`schedule.json`](website/schedule.json) and [`all-recipes.json`](website/all-recipes.json)

### Grocery List Builder ([week.html](website/week.html))
- Fully interactive checklist via [`loadGroceryList.js`](website/js/loadGroceryList.js)
- Categorized by `freezer`, `refrigerator`, `pantry`
- Responsive and mobile-friendly design

### Recipe Explorer ([all-recipes.html](website/all-recipes.html))
- Auto-generates cards from [`all-recipes.json`](website/all-recipes.json)
- JS-driven client-side rendering

### AI Tooling ([meal-ai.html](website/meal-ai.html))
- Protected by **Amazon Cognito Hosted UI**
- Accepts raw text → sends to backend API → returns downloadable recipe JSON
- Backend: **AWS Lambda** function (Node.js) fronted by **API Gateway**, deployed via **Terraform**

---

## 🔐 Cognito Authentication

Used exclusively on [`meal-ai.html`](website/meal-ai.html). Basic flow:

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
3. Edit [`schedule.json`](website/schedule.json) or add recipes in [`/website/json/recipes/`](website/json/recipes/)
4. Validate all recipes:
   ```bash
   node website/scripts/validateAllRecipes.js
   ```
5. Build [`all-recipes.json`](website/all-recipes.json):
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

### Individual Recipes ([website/json/recipes/*.json](website/json/recipes/))
Each contains:
- `id`, `title`, `description`, `day` (optional)
- `sections`: list of ingredients, steps, and nutrition blocks

Example section types:
- `"categorized-ingredients"`
- `"steps"`
- `"list"`

---

## ➕ How to Add a New Recipe

Adding a new recipe is simple and can be done with family favorites, original creations, or recipes found online:

1. **Generate the Recipe JSON:**
   - Open [`meal-ai.html`](website/meal-ai.html) in your browser.
   - Enter the recipe details (link, ingredients, instructions).
   - Click **Generate JSON** to download a new recipe file.

2. **Add the Recipe File:**
   - Move the downloaded `.json` file into [`website/json/recipes/`](website/json/recipes/).

3. **Update the Recipe Index:**
   - From the project root, run:
     ```bash
     node website/scripts/buildAllRecipes.js
     ```
   - This script collects all recipe files and updates [`all-recipes.json`](website/all-recipes.json).

4. **Assign the Recipe to the Weekly Plan:**
   - **Manual Option:**
     - Run:
       ```bash
       node website/scripts/setWeeklySchedule.js
       ```
     - Pick recipes for each weekday (Mon–Fri) from all available recipes.
   - **Automatic Option:**
     - The `surprise-plan-lambda` function runs automatically early Saturday morning, randomly assigning recipes for the upcoming week.

Your new recipe will now appear in the recipe browser and can be included in the weekly meal plan.

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
