import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Lambda's provided AWS_REGION or default
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });
// Get secret name from environment variable set by Terraform
const GEMINI_API_KEY_SECRET_NAME = process.env.GEMINI_API_KEY_SECRET_NAME;

// Allow requests from your specific origin
const allowedOrigin = "https://meals.stellation.one";

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization', // Keep Authorization
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

let genAI; // GoogleGenerativeAI client instance
let geminiApiKey; // Cache the key within the Lambda execution environment

// Function to get secret value (expecting plain text)
async function getSecretValue(secretName) {
  if (!secretName) {
    throw new Error("Secret name environment variable (GEMINI_API_KEY_SECRET_NAME) is not set.");
  }
  console.log(`Attempting to retrieve secret: ${secretName}`);
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsManager.send(command);
    console.log(`Successfully retrieved secret: ${secretName}`);
    if (response.SecretString) {
      // Assuming the secret is stored as plain text, trim whitespace
      return response.SecretString.trim();
    }
    // Handle binary secrets if needed, though unlikely for API keys
    // if (response.SecretBinary) { ... }
    throw new Error(`SecretString is empty for ${secretName}`);
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    // Rethrow the specific error for better debugging upstream
    throw error;
  }
}

// Initialize Google AI client (fetches key if not already cached)
async function initializeGoogleAI() {
  if (!genAI) { // Only initialize if the client doesn't exist
    if (!geminiApiKey) { // Only fetch the key if it's not cached
      geminiApiKey = await getSecretValue(GEMINI_API_KEY_SECRET_NAME);
      if (!geminiApiKey) { // Double check after retrieval
        throw new Error(`Gemini API key retrieved from ${GEMINI_API_KEY_SECRET_NAME} is empty or invalid.`);
      }
      console.log('Successfully retrieved and cached Gemini API key.');
    }
    // Initialize the client with the retrieved key
    // Note: The GoogleGenerativeAI constructor expects the key directly.
    // No need for x-goog-api-key header setup here, the library handles it.
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log('Google Generative AI client initialized.');
  }
  return genAI;
}

export async function handler(event) {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // --- CORS Preflight Handling ---
  const requestOrigin = event.headers?.origin || event.headers?.Origin;
  // Basic check - allow if origin matches or if it's an OPTIONS request (preflight)
  if (requestOrigin !== allowedOrigin && event.requestContext?.http?.method?.toUpperCase() !== 'OPTIONS') {
      console.error(`Origin mismatch: Request origin "${requestOrigin}" is not "${allowedOrigin}". Denying non-OPTIONS request.`);
      return {
          statusCode: 403, // Forbidden
          headers: { 'Content-Type': 'application/json' }, // No CORS headers for denied origin
          body: JSON.stringify({ error: 'Origin not allowed' })
      };
  }

  // Handle OPTIONS preflight request
  if (event.requestContext?.http?.method?.toUpperCase() === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return {
      statusCode: 200,
      headers: corsHeaders, // Send CORS headers back
      body: JSON.stringify({ message: 'CORS preflight check successful' })
    };
  }

  // --- Main Logic (POST requests) ---
  console.log("Handling POST request (Full Gemini Logic)");
  try {
    // Ensure Google AI client is initialized (fetches secret on first call)
    await initializeGoogleAI();

    // --- Body Parsing ---
    if (!event.body) {
      console.error("Request body is missing");
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing request body' }) };
    }
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
      console.log("Parsed request body."); // Don't log full body in production if sensitive
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON in request body' }) };
    }

    // --- Input Validation ---
    if (!requestBody.recipeText || typeof requestBody.recipeText !== 'string' || requestBody.recipeText.trim() === '') {
      console.error("Missing or invalid 'recipeText' in parsed body");
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing or invalid recipeText field in JSON body' }) };
    }
    const recipeText = requestBody.recipeText;

    // --- Call Gemini API ---
    console.log("Sending request to Gemini API (gemini-1.5-flash)...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"}); // Use the confirmed model
    // Simple prompt - adjust as needed for better formatting
    const prompt = `Please format the following recipe text clearly, separating ingredients and instructions. Ensure proper line breaks and list formatting:\n\n${recipeText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponseText = await response.text();

    console.log("Received response from Gemini API.");

    // --- Return Success Response ---
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders, // Include CORS headers
        'Content-Type': 'application/json' // Set correct content type
      },
      // Structure the response as expected by the frontend
      body: JSON.stringify({ generatedRecipe: aiResponseText }),
    };

  } catch (error) {
    console.error('Error processing POST request:', error);
    // Provide a more specific error message if possible
    let errorMessage = 'Internal Server Error processing request';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Check if it's a Google API error with specific details
    if (error?.errorDetails) { // Check if errorDetails exists
        console.error('Google API Error Details:', error.errorDetails);
        // Potentially add more specific info to errorMessage based on errorDetails
    }
    // Check for specific AWS SDK errors (e.g., Secrets Manager access denied)
    if (error.name === 'AccessDeniedException') {
        errorMessage = 'Lambda function does not have permission to access the secret.';
        console.error('AccessDeniedException: Check Lambda execution role IAM permissions for Secrets Manager.');
    } else if (error.name === 'ResourceNotFoundException') {
        errorMessage = `Secret ${GEMINI_API_KEY_SECRET_NAME} not found in Secrets Manager.`;
        console.error('ResourceNotFoundException: Verify the secret name and region.');
    }

    return {
      statusCode: 500, // Use 500 for server-side errors
      headers: corsHeaders,
      body: JSON.stringify({ error: errorMessage }), // Return the error message
    };
  }
}