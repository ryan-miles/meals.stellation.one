import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Use Lambda's provided AWS_REGION or default
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });
// Get secret name from environment variable set by Terraform
const GEMINI_API_KEY_SECRET_NAME = process.env.GEMINI_API_KEY_SECRET_NAME;

// Allow requests from your specific origin
const allowedOrigin = "https://meals.stellation.one";

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

let genAI; // GoogleGenerativeAI client instance
let geminiApiKey; // Cache the key within the Lambda execution environment
let model; // Gemini model instance

// DynamoDB setup
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);
const RECIPES_TABLE = process.env.RECIPES_TABLE || "meals-recipes";

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
      return response.SecretString.trim();
    }
    throw new Error(`SecretString is empty for ${secretName}`);
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    throw error;
  }
}

async function initializeGoogleAI() {
  if (!genAI) {
    if (!geminiApiKey) {
      geminiApiKey = await getSecretValue(GEMINI_API_KEY_SECRET_NAME);
      if (!geminiApiKey) {
        throw new Error(`Gemini API key retrieved from ${GEMINI_API_KEY_SECRET_NAME} is empty or invalid.`);
      }
      console.log('Successfully retrieved and cached Gemini API key.');
    }
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log('Google Generative AI client initialized.');
  }
  if (!model) {
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log('Gemini model (gemini-2.0-flash) initialized.');
  }
  return { genAI, model };
}

function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export async function handler(event) {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const requestOrigin = event.headers?.origin || event.headers?.Origin;
  if (requestOrigin !== allowedOrigin && event.requestContext?.http?.method?.toUpperCase() !== 'OPTIONS') {
      console.error(`Origin mismatch: Request origin "${requestOrigin}" is not "${allowedOrigin}". Denying non-OPTIONS request.`);
      return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Origin not allowed' })
      };
  }

  if (event.requestContext?.http?.method?.toUpperCase() === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS preflight check successful' })
    };
  }

  console.log("Handling POST request (Full Gemini Logic)");
  try {
    await initializeGoogleAI();

    if (!event.body) {
      console.error("Request body is missing");
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing request body' }) };
    }
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
      console.log("Parsed request body.");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON in request body' }) };
    }

    if (!requestBody.recipeText || typeof requestBody.recipeText !== 'string' || requestBody.recipeText.trim() === '') {
      console.error("Missing or invalid 'recipeText' in parsed body");
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing or invalid recipeText field in JSON body' }) };
    }
    const recipeText = requestBody.recipeText;

const detailedPrompt = `You are a structured data formatter. Convert the following plain text recipe into a JSON object.
The JSON object must have the following fields:
- "title": A string for the recipe title.
- "day": A string for the date in "YYYY-MM-DD" format. If not available in the text, use an empty string.
- "description": A brief string describing the recipe.
- "link": A string for the source URL if available in the text, otherwise an empty string.
- "sections": An array of section objects. The array should ideally include the following sections in this order if the information can be derived from the recipe text:
  1. A section with "type": "checklist", "title": "Quick Ingredient Checklist". Its "items" should be a list of all ingredients, suitable for a checklist. If possible, try to group these items by categories like "Pantry", "Refrigerator", "Produce" by adding sub-headings or prefixes to the items.
  2. A section with "type": "ingredients", "title": "Ingredients". Its "items" should be the detailed list of ingredients with quantities.
  3. A section with "type": "steps", "title": "Instructions". Its "items" should be the numbered cooking steps.
  4. A section with "type": "nutrition", "title": "Estimated Nutrition". Its "items" should list estimated nutrition facts (e.g., "Calories: 300", "Protein: 20g"). If nutrition information is not present and cannot be reasonably estimated, this section's items can be empty or the section omitted.

Each section object in the "sections" array must have:
  - "title": A string for the section title as described above.
  - "type": A string indicating the type of section (e.g., "checklist", "ingredients", "steps", "nutrition").
  - "items": An array of strings, formatted appropriately for the section type.

Do NOT include an "id" field in the JSON output.
Do NOT include any extra text, comments, or markdown formatting outside the main JSON object. Only return the valid JSON object.

Here is the recipe text:
${recipeText}`;

    console.log("Sending request to Gemini API with detailed prompt...");
    const result = await model.generateContent(detailedPrompt);
    const response = await result.response;
    const aiResponseText = await response.text();

    console.log("Received response from Gemini API.");

    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch || !jsonMatch[0]) {
      console.error("No valid JSON object found in Gemini response:", aiResponseText);
      throw new Error('AI response did not contain a parsable JSON object.');
    }

    let recipeJson;
    try {
      recipeJson = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse extracted JSON from AI response:", jsonMatch[0], e);
      throw new Error("AI did not return valid JSON content after extraction.");
    }

    // ADDED LOGGING HERE:
    console.log("Received recipeJson from AI:", JSON.stringify(recipeJson, null, 2));

    if (!recipeJson.title) {
      console.warn("AI response missing 'title' field. Defaulting slug.");
    }
    const slug = slugify(recipeJson.title || 'untitled-recipe');
    recipeJson.id = slug;

    // Insert into DynamoDB
    try {
      await ddbDocClient.send(new PutCommand({
        TableName: RECIPES_TABLE,
        Item: recipeJson
      }));
      console.log(`Inserted recipe ${slug} into DynamoDB table ${RECIPES_TABLE}`);
    } catch (ddbErr) {
      console.error("Failed to insert recipe into DynamoDB:", ddbErr);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to save recipe to database", details: ddbErr.message }),
      };
    }

    // AND HERE:
    console.log("Generated slug:", slug);

    console.log("Returning successful response with generatedRecipe.");

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: `${slug}.json`,
        generatedRecipe: recipeJson,
        savedToDynamo: true
      }),
    };

  } catch (error) {
    console.error('Error processing POST request:', error);
    let errorMessage = 'Internal Server Error processing request';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (error?.errorDetails) {
        console.error('Google API Error Details:', error.errorDetails);
    }
    if (error.name === 'AccessDeniedException') {
        errorMessage = 'Lambda function does not have permission to access the secret.';
        console.error('AccessDeniedException: Check Lambda execution role IAM permissions for Secrets Manager.');
    } else if (error.name === 'ResourceNotFoundException') {
        errorMessage = `Secret ${GEMINI_API_KEY_SECRET_NAME} not found in Secrets Manager.`;
        console.error('ResourceNotFoundException: Verify the secret name and region.');
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
}