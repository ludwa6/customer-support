#!/usr/bin/env node

/**
 * Script to update the notion service to use existing databases
 */

const fs = require('fs');
const path = require('path');

const notionServicePath = 'server/services/notion.ts';

console.log('Updating Notion service to use existing databases...');

try {
  // Read the current file
  const content = fs.readFileSync(notionServicePath, 'utf8');
  
  // Define the modification - add code to load configuration
  const configLoaderCode = `
// Load database configuration from file if specified
let databaseConfig = {
  databases: {
    categories: null,
    articles: null,
    faqs: null
  }
};

// Check if a configuration file path is specified
if (process.env.NOTION_CONFIG_PATH) {
  try {
    const configPath = process.env.NOTION_CONFIG_PATH;
    console.log(\`Loading Notion database configuration from \${configPath}\`);
    
    // Load the configuration file
    const configData = fs.readFileSync(configPath, 'utf8');
    databaseConfig = JSON.parse(configData);
    
    console.log('Successfully loaded database configuration:');
    console.log(\`- Categories database: \${databaseConfig.databases.categories}\`);
    console.log(\`- Articles database: \${databaseConfig.databases.articles}\`);
    console.log(\`- FAQs database: \${databaseConfig.databases.faqs}\`);
  } catch (error) {
    console.error(\`Error loading Notion configuration file: \${error.message}\`);
  }
}`;
  
  // Find the right spot to add the code - after the imports
  const importSection = content.match(/import[\s\S]+?from[\s\S]+?;\n/g);
  let lastImportIndex = 0;
  
  if (importSection && importSection.length > 0) {
    lastImportIndex = content.lastIndexOf(importSection[importSection.length - 1]) + 
                      importSection[importSection.length - 1].length;
  }
  
  // Add fs import
  const fsImport = 'import * as fs from "fs";\n';
  
  // Modify the functions that need to use the config
  let modifiedContent = content.slice(0, lastImportIndex) + 
                       fsImport +
                       content.slice(lastImportIndex, lastImportIndex) + 
                       configLoaderCode + 
                       content.slice(lastImportIndex);
  
  // Replace database IDs in getCategories function
  modifiedContent = modifiedContent.replace(
    'const DATABASE_ID = "1ebc922b6d5b80729c9dd0d4f7ccf567";', 
    'const DATABASE_ID = databaseConfig.databases.faqs || "1ebc922b6d5b80729c9dd0d4f7ccf567";'
  );
  
  // Replace database IDs in getArticles function
  modifiedContent = modifiedContent.replace(
    'const DATABASE_ID = articlesDb ? articlesDb.id : "1ebc922b6d5b80729c9dd0d4f7ccf567";',
    'const DATABASE_ID = databaseConfig.databases.articles || (articlesDb ? articlesDb.id : "1ebc922b6d5b80729c9dd0d4f7ccf567");'
  );
  
  // Replace database IDs in getFAQs function - second instance
  modifiedContent = modifiedContent.replace(
    'const DATABASE_ID = "1ebc922b6d5b80729c9dd0d4f7ccf567";', 
    'const DATABASE_ID = databaseConfig.databases.faqs || "1ebc922b6d5b80729c9dd0d4f7ccf567";'
  );
  
  // Write the modified content back to the file
  fs.writeFileSync(notionServicePath, modifiedContent);
  
  console.log('Successfully updated Notion service!');
  console.log('You can now use your existing Notion databases with the application.');
  console.log('Make sure to add the NOTION_CONFIG_PATH environment variable to point to your configuration file.');
} catch (error) {
  console.error(`Error updating Notion service: ${error.message}`);
}