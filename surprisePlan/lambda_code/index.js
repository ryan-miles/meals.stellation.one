import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
let SCHEDULE_KEY = process.env.S3_SCHEDULE_KEY || "schedule.json";
let RECIPES_PREFIX = process.env.S3_RECIPES_PREFIX || "json/recipes/";

// Remove leading 'website/' if present
if (SCHEDULE_KEY.startsWith("website/")) SCHEDULE_KEY = SCHEDULE_KEY.replace(/^website\//, "");
if (RECIPES_PREFIX.startsWith("website/")) RECIPES_PREFIX = RECIPES_PREFIX.replace(/^website\//, "");

const s3 = new S3Client({ region: REGION });

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

async function listRecipeIdsFromS3(bucket, prefix) {
  const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
  const response = await s3.send(command);
  if (!response.Contents) return [];
  return response.Contents
    .filter(item => item.Key.endsWith('.json') && item.Key !== prefix)
    .map(item => {
      const parts = item.Key.split('/');
      const filename = parts[parts.length - 1];
      return filename.replace('.json', '');
    });
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
  if (!BUCKET_NAME || !RECIPES_PREFIX || !SCHEDULE_KEY) {
    console.error("Missing required environment variables.");
    return;
  }
  try {
    let recipeIds = await listRecipeIdsFromS3(BUCKET_NAME, RECIPES_PREFIX);
    if (recipeIds.length === 0) {
      console.warn(`No recipe files found in s3://${BUCKET_NAME}/${RECIPES_PREFIX}`);
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
  } catch (error) {
    console.error('Error generating or saving schedule:', error);
  }
}