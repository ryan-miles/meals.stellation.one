import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";

// Use Lambda's provided AWS_REGION or default
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });
const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

// Get secret name from environment variable set by Terraform
const GEMINI_API_KEY_SECRET_NAME = process.env.GEMINI_API_KEY_SECRET_NAME;

// Get S3 details from environment variables set by Terraform
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const RECIPES_PREFIX = process.env.S3_RECIPES_PREFIX || 'website/json/recipes/'; // Default prefix if not set
const SCHEDULE_KEY = process.env.S3_SCHEDULE_KEY || 'website/schedule.json'; // Default key if not set

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

// Function to get the date of the next Monday
function getNextMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

// Function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to list recipe IDs from S3
async function listRecipeIdsFromS3(bucket, prefix) {
    if (!bucket || !prefix) {
        throw new Error("S3 bucket name or recipes prefix is not configured.");
    }
    console.log(`Listing objects in bucket '${bucket}' with prefix '${prefix}'`);
    const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
    });

    try {
        const response = await s3.send(command);
        console.log(`Found ${response.Contents?.length || 0} objects.`);
        if (!response.Contents || response.Contents.length === 0) {
            return [];
        }
        // Filter for .json files and extract the base name (ID)
        const recipeIds = response.Contents
            .filter(item => item.Key.endsWith('.json') && item.Key !== prefix) // Exclude the prefix itself if listed
            .map(item => {
                const parts = item.Key.split('/');
                const filename = parts[parts.length - 1];
                return filename.replace('.json', ''); // Get name without extension
            });
        console.log(`Extracted ${recipeIds.length} recipe IDs.`);
        return recipeIds;
    } catch (error) {
        console.error(`Error listing objects in S3 bucket ${bucket} with prefix ${prefix}:`, error);
        throw new Error(`Failed to list recipes from S3: ${error.message}`);
    }
}

// Function to write schedule to S3
async function writeScheduleToS3(bucket, key, scheduleData) {
    if (!bucket || !key) {
        throw new Error("S3 bucket name or schedule key is not configured.");
    }
    console.log(`Writing schedule to S3 bucket '${bucket}' with key '${key}'`);
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(scheduleData, null, 2),
        ContentType: 'application/json',
    });

    try {
        await s3.send(command);
        console.log(`Successfully wrote schedule to s3://${bucket}/${key}`);
    } catch (error) {
        console.error(`Error writing schedule to S3 bucket ${bucket} with key ${key}:`, error);
        throw new Error(`Failed to write schedule to S3: ${error.message}`);
    }
}

export async function handler(event) {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // --- CORS Preflight Handling & Origin Check ---
  const requestOrigin = event.headers?.origin || event.headers?.Origin; // Get origin header (case-insensitive)

  // Handle OPTIONS preflight request first
  if (event.requestContext?.http?.method?.toUpperCase() === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    // Check if the origin is allowed for preflight
    if (requestOrigin === allowedOrigin) {
        return {
            statusCode: 200,
            headers: corsHeaders, // Send CORS headers back
            body: JSON.stringify({ message: 'CORS preflight check successful' })
        };
    } else {
        console.warn(`OPTIONS request from disallowed origin: ${requestOrigin}`);
        return {
            statusCode: 403, // Forbidden
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Origin not allowed for CORS preflight' })
        };
    }
  }

  // For non-OPTIONS requests (like GET), check origin *only if* it's present
  if (requestOrigin && requestOrigin !== allowedOrigin) {
      console.error(`Origin mismatch: Request origin \"${requestOrigin}\" is not \"${allowedOrigin}\". Denying request.`);
      return {
          statusCode: 403, // Forbidden
          // Return CORS headers even for forbidden origin on actual requests (good practice)
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Origin not allowed' })
      };
  }
  // If origin is missing OR matches allowedOrigin, proceed.

  // --- Main Logic (POST requests) ---
  if (event.requestContext?.http?.method?.toUpperCase() === 'POST') {
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

  // --- Main Logic (GET requests) ---
  if (event.requestContext?.http?.method?.toUpperCase() === 'GET') {
    console.log("Handling GET request (Surprise Plan Logic)");
    if (!BUCKET_NAME || !RECIPES_PREFIX || !SCHEDULE_KEY) {
        console.error("S3 environment variables (S3_BUCKET_NAME, S3_RECIPES_PREFIX, S3_SCHEDULE_KEY) are not fully configured.");
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Server configuration error: S3 details missing.' })
        };
    }

    try {
      // 1. Read available recipes from S3
      let recipeIds = await listRecipeIdsFromS3(BUCKET_NAME, RECIPES_PREFIX);

      if (recipeIds.length === 0) {
        console.warn(`No recipe files found in s3://${BUCKET_NAME}/${RECIPES_PREFIX}`);
        // Decide how to handle: error out or return an empty schedule? Let's return empty for now.
         return {
            statusCode: 200, // Or maybe 404? 200 seems ok.
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "No recipes found to generate a schedule.", schedule: null })
         };
      }

      // 2. Calculate next Monday's date
      const nextMondayDate = getNextMonday();
      const weekStartDate = formatDate(nextMondayDate);

      // 3. Shuffle and select recipes
      recipeIds = shuffleArray(recipeIds);
      const mealsToAssign = Math.min(recipeIds.length, 5);
      const assignedMeals = {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

      for (let i = 0; i < mealsToAssign; i++) {
        assignedMeals[days[i]] = recipeIds[i];
      }
      for (let i = mealsToAssign; i < 5; i++) {
          assignedMeals[days[i]] = null; // Assign null for remaining days
      }

      // 4. Create the new schedule object
      const newSchedule = {
        weekStart: weekStartDate,
        ...assignedMeals
      };

      // 5. Write the new schedule to S3
      await writeScheduleToS3(BUCKET_NAME, SCHEDULE_KEY, newSchedule);

      // 6. Return Success Response with the generated schedule
      console.log(`✅ Successfully generated and saved random schedule for week starting ${weekStartDate}`);
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: "Successfully generated and saved schedule.", schedule: newSchedule }),
      };

    } catch (error) {
      console.error('Error processing GET request:', error);
      let errorMessage = 'Internal Server Error generating schedule';
      if (error instanceof Error) {
          errorMessage = error.message;
      }
       // Check for specific AWS SDK errors
      if (error.name === 'AccessDeniedException') {
          errorMessage = 'Lambda function does not have permission to access the S3 bucket/objects.';
          console.error('AccessDeniedException: Check Lambda execution role IAM permissions for S3.');
      } else if (error.name === 'NoSuchBucket') {
          errorMessage = `S3 bucket ${BUCKET_NAME} not found.`;
          console.error('NoSuchBucket: Verify the bucket name and region.');
      }

      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: errorMessage }),
      };
    }
  }

  // If method is not POST or GET
  return {
    statusCode: 405, // Method Not Allowed
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Method not allowed. Use POST or GET.' })
  };
}