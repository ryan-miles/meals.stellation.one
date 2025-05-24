// Local development configuration
// This file overrides API endpoints for local testing
const LOCAL_API_CONFIG = {
    // Local development server endpoints
    recipes_api: "http://localhost:3001/recipes",
    schedule_api: "http://localhost:3001/schedule", 
    schedule_s3: "http://localhost:3001/schedule",
    gemini_api: "http://localhost:3001/generate-recipe",
    
    // Production endpoints (for reference)
    production: {
        recipes_api: "https://ida2uil5ed.execute-api.us-east-1.amazonaws.com/recipes",
        schedule_api: "https://eyfzhv6w38.execute-api.us-east-1.amazonaws.com/recipes",
        schedule_s3: "https://s3.us-east-1.amazonaws.com/meals.stellation.one/schedule.json",
        gemini_api: "https://zw2vq81phe.execute-api.us-east-1.amazonaws.com/generate-recipe"
    }
};

// Check if we're running locally (localhost or file://)
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.protocol === 'file:';

// Export the appropriate configuration
window.API_ENDPOINTS = isLocal ? LOCAL_API_CONFIG : LOCAL_API_CONFIG.production;

console.log('🔧 API Configuration loaded:', isLocal ? 'LOCAL' : 'PRODUCTION');
console.log('📡 Using endpoints:', window.API_ENDPOINTS);
