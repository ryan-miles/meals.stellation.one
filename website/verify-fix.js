

// Temporary test script to verify the fix works
const fs = require('fs');

// Load the all-recipes.html file
const htmlContent = fs.readFileSync('all-recipes.html', 'utf8');

// Check if the variable was fixed
const expectedFix = 'recipeContainer.innerHTML = dataSourceNotice + recipesHtml;';
const oldCode = 'container.innerHTML = dataSourceNotice + recipesHtml;';

if (htmlContent.includes(expectedFix) && !htmlContent.includes(oldCode)) {
  console.log('✅ Fix was successfully applied! The page should now display recipes correctly.');
} else {
  console.log('❌ Fix was not applied correctly. Please check the file manually.');
}

