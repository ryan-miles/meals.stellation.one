// config.js - Front-end API configuration
// This file defines settings used by front-end scripts (e.g., meal-ai.html) to:
//  - configure network calls to the AI recipe generator API
//  - display API Gateway and AWS Lambda details in the UI

const API_CONFIG = {
    // The full URL (custom domain + path) for AI recipe generation
    api_endpoint: "https://api.meals.stellation.one/gemini",
    // The API Gateway identifier for display in the footer
    gateway_id: "zw2vq81phe",
    // The AWS Lambda function name backing the AI recipe generator
    lambda_name: "meals-gemini-generator"
};