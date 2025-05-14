import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
let SCHEDULE_KEY = process.env.S3_SCHEDULE_KEY || "schedule.json";
let RECIPES_PREFIX = process.env.S3_RECIPES_PREFIX || "json/recipes/";
const DYNAMO_TABLE = process.env.DYNAMODB_TABLE_NAME || "meals-recipes";

// Remove leading 'website/' if present
if (SCHEDULE_KEY.startsWith("website/")) SCHEDULE_KEY = SCHEDULE_KEY.replace(/^website\//, "");
if (RECIPES_PREFIX.startsWith("website/")) RECIPES_PREFIX = RECIPES_PREFIX.replace(/^website\//, "");

const s3 = new S3Client({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });

function getNextMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function listRecipeIdsFromDynamoDB() {
  const command = new ScanCommand({ TableName: DYNAMO_TABLE, ProjectionExpression: "id" });
  const response = await dynamo.send(command);
  // id may be a string or { S: ... } depending on how items were written
  return (response.Items || []).map(item => (item.id && item.id.S) ? item.id.S : item.id);
}

async function writeScheduleToS3(bucket, key, scheduleData) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(scheduleData, null, 2),
    ContentType: 'application/json',
  });
  await s3.send(command);
}

export async function handler() {
  if (!BUCKET_NAME || !SCHEDULE_KEY) {
    console.error("Missing required environment variables.");
    return;
  }
  try {
    let recipeIds = await listRecipeIdsFromDynamoDB();
    if (recipeIds.length === 0) {
      console.warn(`No recipes found in DynamoDB table ${DYNAMO_TABLE}`);
      return;
    }
    const nextMondayDate = getNextMonday();
    const weekStartDate = formatDate(nextMondayDate);
    recipeIds = shuffleArray(recipeIds);
    const mealsToAssign = Math.min(recipeIds.length, 5);
    const assignedMeals = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    for (let i = 0; i < mealsToAssign; i++) {
      assignedMeals[days[i]] = recipeIds[i];
    }
    for (let i = mealsToAssign; i < 5; i++) {
      assignedMeals[days[i]] = null;
    }
    const newSchedule = {
      weekStart: weekStartDate,
      ...assignedMeals
    };
    await writeScheduleToS3(BUCKET_NAME, SCHEDULE_KEY, newSchedule);
    console.log(`✅ Successfully generated and saved random schedule for week starting ${weekStartDate}`);

    // --- CloudFront Invalidation ---
    const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    if (distributionId) {
      const cfClient = new CloudFrontClient({ region: REGION });
      const invalidationParams = {
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `invalidate-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: ["/*"]
          }
        }
      };
      try {
        const invalidationResult = await cfClient.send(new CreateInvalidationCommand(invalidationParams));
        console.log(`✅ CloudFront invalidation created: ${invalidationResult.Invalidation?.Id}`);
      } catch (cfErr) {
        console.error("CloudFront invalidation failed:", cfErr);
      }
    } else {
      console.warn("CLOUDFRONT_DISTRIBUTION_ID not set, skipping invalidation.");
    }
  } catch (error) {
    console.error('Error generating or saving schedule:', error);
  }
}