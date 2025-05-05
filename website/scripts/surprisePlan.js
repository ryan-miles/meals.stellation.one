const fs = require('fs');
const path = require('path');

const recipesDir = path.join(__dirname, '..', 'json', 'recipes');
const scheduleFilePath = path.join(__dirname, '..', 'schedule.json');

// Function to get the date of the next Monday
function getNextMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday, next day is Monday. Otherwise, calculate days remaining.
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0); // Set time to midnight
  return nextMonday;
}

// Function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

try {
  // 1. Read available recipes
  const allFiles = fs.readdirSync(recipesDir);
  const recipeFiles = allFiles.filter(file => file.endsWith('.json'));
  let recipeIds = recipeFiles.map(file => path.parse(file).name); // Get filename without extension

  if (recipeIds.length === 0) {
    throw new Error('No recipe files found in ' + recipesDir);
  }

  // 2. Calculate next Monday's date
  const nextMondayDate = getNextMonday();
  const weekStartDate = formatDate(nextMondayDate);

  // 3. Shuffle and select recipes
  recipeIds = shuffleArray(recipeIds);

  // Ensure we don't try to pick more recipes than available
  const mealsToAssign = Math.min(recipeIds.length, 5);
  const assignedMeals = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  for (let i = 0; i < mealsToAssign; i++) {
    assignedMeals[days[i]] = recipeIds[i];
  }
  // Fill remaining days with null or a default if fewer than 5 recipes
  for (let i = mealsToAssign; i < 5; i++) {
      assignedMeals[days[i]] = null; // Or a placeholder like 'leftovers'
  }


  // 4. Create the new schedule object
  const newSchedule = {
    weekStart: weekStartDate,
    ...assignedMeals
  };

  // 5. Write the new schedule to schedule.json
  fs.writeFileSync(scheduleFilePath, JSON.stringify(newSchedule, null, 2)); // Pretty print JSON

  // 6. Log confirmation
  console.log(`✅ Successfully generated random schedule for the week starting ${weekStartDate}:`);
  console.log(JSON.stringify(newSchedule, null, 2));
  console.log(`
📝 Updated schedule written to: ${scheduleFilePath}`);

} catch (error) {
  console.error('❌ Error generating random schedule:', error.message);
  process.exit(1); // Exit with error code
}
