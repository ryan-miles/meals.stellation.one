const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the website directory
app.use(express.static(path.join(__dirname, '..')));

// Sample recipes data for local testing
const sampleRecipes = [
  {
    id: "chicken-teriyaki-bowl",
    title: "Chicken Teriyaki Bowl", 
    description: "A delicious Asian-inspired bowl with tender chicken and vegetables",
    day: "2025-05-26",
    link: "https://example.com/chicken-teriyaki",
    sections: [
      {
        type: "checklist",
        title: "Quick Ingredient Checklist",
        items: [
          "Refrigerator: Chicken breast (1 lb)",
          "Refrigerator: Broccoli (1 head)",
          "Pantry: Soy sauce (1/4 cup)",
          "Pantry: Brown sugar (2 tbsp)",
          "Pantry: Rice (1 cup)",
          "Pantry: Garlic (3 cloves)",
          "Pantry: Ginger (1 inch piece)"
        ]
      },
      {
        type: "ingredients", 
        title: "Ingredients",
        items: [
          "1 lb chicken breast, cut into bite-sized pieces",
          "1 head broccoli, cut into florets",
          "1 cup jasmine rice",
          "1/4 cup soy sauce",
          "2 tbsp brown sugar",
          "3 cloves garlic, minced",
          "1 inch fresh ginger, grated",
          "2 tbsp vegetable oil",
          "1 tbsp cornstarch",
          "2 tbsp water"
        ]
      },
      {
        type: "steps",
        title: "Instructions", 
        items: [
          "Cook rice according to package directions",
          "Heat oil in a large skillet over medium-high heat",
          "Add chicken and cook until golden brown, about 5-6 minutes",
          "Add garlic and ginger, cook for 1 minute",
          "In a small bowl, whisk together soy sauce, brown sugar, cornstarch and water",
          "Pour sauce over chicken and add broccoli",
          "Cook until broccoli is tender and sauce has thickened, about 3-4 minutes",
          "Serve over rice"
        ]
      },
      {
        type: "nutrition",
        title: "Estimated Nutrition",
        items: [
          "Calories: 425",
          "Protein: 32g",
          "Carbohydrates: 48g", 
          "Fat: 12g",
          "Fiber: 3g"
        ]
      }
    ]
  },
  {
    id: "pasta-marinara",
    title: "Classic Pasta Marinara",
    description: "Simple and delicious pasta with homemade marinara sauce",
    day: "2025-05-27",
    link: "https://example.com/pasta-marinara",
    sections: [
      {
        type: "checklist",
        title: "Quick Ingredient Checklist",
        items: [
          "Pantry: Pasta (12 oz)",
          "Pantry: Canned tomatoes (28 oz)",
          "Pantry: Olive oil (3 tbsp)",
          "Pantry: Garlic (4 cloves)",
          "Refrigerator: Fresh basil (1/4 cup)",
          "Pantry: Salt and pepper"
        ]
      },
      {
        type: "ingredients",
        title: "Ingredients", 
        items: [
          "12 oz spaghetti or your favorite pasta",
          "28 oz can crushed tomatoes",
          "3 tbsp olive oil",
          "4 cloves garlic, minced",
          "1/4 cup fresh basil, chopped",
          "Salt and pepper to taste",
          "Parmesan cheese for serving"
        ]
      },
      {
        type: "steps",
        title: "Instructions",
        items: [
          "Bring a large pot of salted water to boil",
          "Cook pasta according to package directions until al dente",
          "While pasta cooks, heat olive oil in a large pan over medium heat",
          "Add garlic and cook until fragrant, about 1 minute",
          "Add crushed tomatoes, salt, and pepper",
          "Simmer for 10-15 minutes until sauce thickens",
          "Drain pasta and add to sauce",
          "Toss with fresh basil and serve with Parmesan"
        ]
      },
      {
        type: "nutrition",
        title: "Estimated Nutrition",
        items: [
          "Calories: 380",
          "Protein: 12g", 
          "Carbohydrates: 72g",
          "Fat: 8g",
          "Fiber: 4g"
        ]
      }
    ]
  },
  {
    id: "salmon-vegetables",
    title: "Baked Salmon with Roasted Vegetables",
    description: "Healthy and flavorful salmon with a medley of roasted vegetables",
    day: "2025-05-28", 
    link: "https://example.com/salmon-vegetables",
    sections: [
      {
        type: "checklist",
        title: "Quick Ingredient Checklist",
        items: [
          "Refrigerator: Salmon fillets (4 pieces)",
          "Refrigerator: Bell peppers (2)",
          "Refrigerator: Zucchini (2 medium)",
          "Pantry: Olive oil (4 tbsp)",
          "Pantry: Lemon (1)",
          "Pantry: Garlic powder",
          "Pantry: Salt and pepper"
        ]
      },
      {
        type: "ingredients",
        title: "Ingredients",
        items: [
          "4 salmon fillets (6 oz each)",
          "2 bell peppers, sliced",
          "2 medium zucchini, sliced",
          "1 red onion, sliced",
          "4 tbsp olive oil",
          "1 lemon, juiced and zested",
          "2 tsp garlic powder",
          "Salt and pepper to taste",
          "Fresh dill for garnish"
        ]
      },
      {
        type: "steps",
        title: "Instructions",
        items: [
          "Preheat oven to 425°F (220°C)",
          "Line a large baking sheet with parchment paper",
          "Toss vegetables with 2 tbsp olive oil, salt, and pepper",
          "Spread vegetables on one side of the baking sheet",
          "Season salmon with remaining oil, lemon juice, garlic powder, salt, and pepper",
          "Place salmon on the other side of the baking sheet",
          "Bake for 12-15 minutes until salmon flakes easily",
          "Garnish with lemon zest and fresh dill"
        ]
      },
      {
        type: "nutrition", 
        title: "Estimated Nutrition",
        items: [
          "Calories: 385",
          "Protein: 35g",
          "Carbohydrates: 12g",
          "Fat: 22g",
          "Omega-3: High"
        ]
      }
    ]
  },
  {
    id: "beef-stir-fry",
    title: "Beef and Vegetable Stir Fry",
    description: "Quick and easy beef stir fry with fresh vegetables",
    day: "2025-05-29",
    link: "https://example.com/beef-stir-fry", 
    sections: [
      {
        type: "checklist",
        title: "Quick Ingredient Checklist",
        items: [
          "Refrigerator: Beef sirloin (1 lb)",
          "Refrigerator: Bell peppers (2)",
          "Refrigerator: Snap peas (1 cup)",
          "Pantry: Soy sauce (3 tbsp)",
          "Pantry: Garlic (3 cloves)",
          "Pantry: Vegetable oil (2 tbsp)",
          "Pantry: Rice (1 cup)"
        ]
      },
      {
        type: "ingredients",
        title: "Ingredients",
        items: [
          "1 lb beef sirloin, sliced thin",
          "2 bell peppers, sliced",
          "1 cup snap peas",
          "1 cup jasmine rice",
          "3 tbsp soy sauce",
          "3 cloves garlic, minced",
          "2 tbsp vegetable oil",
          "1 tbsp cornstarch",
          "1 tsp sesame oil",
          "Green onions for garnish"
        ]
      },
      {
        type: "steps",
        title: "Instructions",
        items: [
          "Cook rice according to package directions",
          "Toss beef with cornstarch and 1 tbsp soy sauce",
          "Heat vegetable oil in a large wok or skillet over high heat",
          "Add beef and stir-fry for 2-3 minutes until browned",
          "Add garlic and stir for 30 seconds",
          "Add bell peppers and snap peas, stir-fry 2-3 minutes",
          "Add remaining soy sauce and sesame oil",
          "Serve over rice, garnish with green onions"
        ]
      },
      {
        type: "nutrition",
        title: "Estimated Nutrition", 
        items: [
          "Calories: 445",
          "Protein: 28g",
          "Carbohydrates: 52g",
          "Fat: 14g",
          "Iron: High"
        ]
      }
    ]
  },
  {
    id: "vegetarian-tacos",
    title: "Black Bean and Corn Tacos",
    description: "Flavorful vegetarian tacos with black beans and fresh corn",
    day: "2025-05-30",
    link: "https://example.com/vegetarian-tacos",
    sections: [
      {
        type: "checklist", 
        title: "Quick Ingredient Checklist",
        items: [
          "Pantry: Black beans (2 cans)",
          "Freezer: Corn (1 cup)",
          "Pantry: Taco shells (8)",
          "Refrigerator: Avocado (2)",
          "Refrigerator: Lime (2)",
          "Pantry: Cumin (1 tsp)",
          "Pantry: Chili powder (1 tsp)"
        ]
      },
      {
        type: "ingredients",
        title: "Ingredients",
        items: [
          "2 cans black beans, drained and rinsed",
          "1 cup frozen corn, thawed",
          "8 taco shells",
          "2 avocados, diced",
          "2 limes, juiced",
          "1 tsp cumin",
          "1 tsp chili powder",
          "1/2 red onion, diced",
          "Fresh cilantro",
          "Salsa and sour cream for serving"
        ]
      },
      {
        type: "steps",
        title: "Instructions", 
        items: [
          "Heat taco shells according to package directions",
          "In a large pan, heat black beans with cumin and chili powder",
          "Add corn and heat through, about 2 minutes",
          "Warm bean mixture until heated through",
          "Mash avocados with lime juice and salt",
          "Fill taco shells with bean mixture",
          "Top with avocado, onion, and cilantro",
          "Serve with salsa and sour cream"
        ]
      },
      {
        type: "nutrition",
        title: "Estimated Nutrition",
        items: [
          "Calories: 320",
          "Protein: 12g",
          "Carbohydrates: 45g",
          "Fat: 12g",
          "Fiber: 14g"
        ]
      }
    ]
  }
];

// Sample schedule data
const sampleSchedule = {
  weekStart: "2025-05-26",
  monday: "chicken-teriyaki-bowl",
  tuesday: "pasta-marinara", 
  wednesday: "salmon-vegetables",
  thursday: "beef-stir-fry",
  friday: "vegetarian-tacos"
};

// Mock API routes

// Get all recipes (mimics DynamoDB API)
app.get('/recipes', (req, res) => {
  console.log('📦 Serving recipes from local mock API');
  res.json(sampleRecipes);
});

// Get schedule (mimics schedule API and S3)
app.get('/schedule', (req, res) => {
  console.log('📅 Serving schedule from local mock API');
  res.json(sampleSchedule);
});

// Mock Gemini AI recipe generation
app.post('/generate-recipe', (req, res) => {
  console.log('🤖 Mock AI recipe generation called');
  
  const { recipeText } = req.body;
  
  if (!recipeText) {
    return res.status(400).json({ error: 'Missing recipeText field' });
  }

  // Generate a simple mock recipe based on the input
  const mockRecipe = {
    title: `Mock Recipe: ${recipeText.substring(0, 30)}...`,
    description: "This is a mock recipe generated for local testing",
    day: new Date().toISOString().split('T')[0],
    link: "",
    sections: [
      {
        type: "checklist",
        title: "Quick Ingredient Checklist", 
        items: [
          "Pantry: Mock ingredient 1",
          "Refrigerator: Mock ingredient 2", 
          "Freezer: Mock ingredient 3"
        ]
      },
      {
        type: "ingredients",
        title: "Ingredients",
        items: [
          "1 cup mock ingredient",
          "2 tbsp mock seasoning",
          "1 lb mock protein"
        ]
      },
      {
        type: "steps",
        title: "Instructions",
        items: [
          "This is a mock recipe step 1",
          "This is a mock recipe step 2", 
          "This is a mock recipe step 3"
        ]
      }
    ]
  };

  res.json({
    filename: "mock-recipe.json",
    generatedRecipe: mockRecipe,
    savedToDynamo: false
  });
});

// Serve index.html for the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'meals.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Local development server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '..')}`);
  console.log(`\n📋 Available API endpoints:`);
  console.log(`   GET  /recipes - Mock recipes API`);
  console.log(`   GET  /schedule - Mock schedule API`);
  console.log(`   POST /generate-recipe - Mock AI recipe generation`);
  console.log(`\n🌐 Open http://localhost:${PORT} to view your site locally`);
  console.log(`\n💡 To switch back to production APIs, update the config in js/config-local.js\n`);
});
