# Local Development Setup for Meals.Stellation.One

This directory contains a local development server that allows you to test your website functionality without deploying to AWS.

## Quick Start

1. **Install dependencies:**
   ```powershell
   cd k:\Dev\meals.stellation.one\website\local-server
   npm install
   ```

2. **Start the local development server:**
   ```powershell
   npm start
   ```

3. **Open your browser:**
   - Navigate to `http://localhost:3001`
   - The server will automatically serve your website files and provide mock API endpoints

## What This Solves

Your website currently depends on several AWS services that only work when deployed:

- **DynamoDB API** (`ida2uil5ed.execute-api.us-east-1.amazonaws.com/recipes`) - Used by all-recipes.html
- **Schedule API** (`eyfzhv6w38.execute-api.us-east-1.amazonaws.com/recipes`) - Used by meals.html 
- **S3 Bucket** (`s3.us-east-1.amazonaws.com/meals.stellation.one/schedule.json`) - Used by week.html
- **Gemini API** (`zw2vq81phe.execute-api.us-east-1.amazonaws.com/generate-recipe`) - Used by meal-ai.html

## Mock API Endpoints

The local server provides these mock endpoints:

- `GET /recipes` - Returns sample recipe data (replaces DynamoDB API)
- `GET /schedule` - Returns sample schedule data (replaces schedule API and S3)
- `POST /generate-recipe` - Returns mock AI-generated recipe (replaces Gemini API)

## Configuration System

The website now includes a smart configuration system:

- **config-local.js** - Automatically detects if running locally and switches to local APIs
- **config.js** - Updated to use the configuration system
- When running on `localhost` or `127.0.0.1`, uses local mock APIs
- When running on your production domain, uses production AWS APIs

## Sample Data

The local server includes realistic sample data:
- 5 sample recipes with proper structure
- Sample weekly schedule 
- Mock AI responses for recipe generation

## Development Workflow

1. **Local Development:**
   - Run `npm start` in the local-server directory
   - Open `http://localhost:3001` in your browser
   - Make changes to HTML/CSS/JS files
   - Refresh browser to see changes

2. **Testing Production APIs:**
   - Simply deploy your site to your production domain
   - The configuration will automatically switch to production APIs

## File Structure

```
website/
├── local-server/
│   ├── package.json      # Dependencies
│   ├── server.js         # Express server with mock APIs
│   └── README.md         # This file
├── js/
│   ├── config-local.js   # Configuration system
│   ├── config.js         # Updated to use configuration
│   ├── loadWeek.js       # Updated to use configuration
│   ├── loadGroceryList.js # Updated to use configuration
│   └── loadRecipe.js     # Updated to use configuration
└── [all HTML files]      # Updated to include config-local.js
```

## Troubleshooting

- **Port 3001 already in use:** Change the PORT in server.js or use `PORT=3002 npm start`
- **APIs not switching:** Check browser console for configuration messages
- **Mock data not realistic enough:** Edit the sample data in server.js

## Next Steps

This setup allows you to:
- ✅ Test all website functionality locally
- ✅ Develop new features without AWS dependencies  
- ✅ Debug JavaScript issues in a controlled environment
- ✅ Seamlessly switch between local and production environments

No changes are needed to your production deployment - the configuration system automatically handles the environment detection!
