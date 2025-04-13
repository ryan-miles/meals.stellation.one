import { OpenAI } from 'openai';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager();
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://meals.stellation.one',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

async function getSecretValue(secretName) {
  try {
    const response = await secretsManager.getSecretValue({ SecretId: secretName });
    console.log(`Successfully retrieved secret: ${secretName}`);
    return JSON.parse(response.SecretString).key;
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
}

let openai;
async function initializeOpenAI() {
  if (!openai) {
    try {
      const apiKey = await getSecretValue(process.env.OPENAI_API_KEY_SECRET);
      console.log('OpenAI client initialized with API key length:', apiKey.length);
      openai = new OpenAI({ apiKey });
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      throw error;
    }
  }
  return openai;
}

export async function handler(event) {
  // Handle OPTIONS preflight
  if (
    event.requestContext &&
    event.requestContext.http &&
    event.requestContext.http.method === 'OPTIONS'
  ) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS preflight OK' })
    };
  }

  try {
    // Parse input
    const body = JSON.parse(event.body || '{}');
    if (!body.text) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing recipe text in request body' })
      };
    }

    // Initialize OpenAI
    await initializeOpenAI();

    // Construct prompt
    const systemPrompt = `You are a structured data formatter for the meals.stellation.one website. 
    Convert plain text recipes into the following JSON structure:
    {
      "id": "unique-recipe-id",
      "title": "Recipe Title",
      "day": "YYYY-MM-DD",
      "description": "Brief description",
      "link": "Source URL if available",
      "sections": [
        {
          "title": "Ingredients",
          "type": "ingredients",
          "items": ["formatted ingredients"]
        },
        {
          "title": "Instructions",
          "type": "steps",
          "items": ["numbered steps"]
        },
        {
          "title": "Nutrition",
          "type": "nutrition",
          "items": ["nutrition facts"]
        }
      ]
    }`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: body.text }
      ]
    });

    // Extract and parse JSON from response
    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const parsedRecipe = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(parsedRecipe)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}
