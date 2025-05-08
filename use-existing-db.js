#!/usr/bin/env node

/**
 * Script to configure SerenityFlow Portal to use existing Notion databases
 * 
 * This script helps users connect to existing Notion databases instead of creating new ones.
 * It will map the existing database structure to the application's expected format.
 * 
 * When a user forks this template, it will automatically detect existing databases
 * in their Notion page and prompt them to use those instead of creating new ones.
 */

import readline from 'readline';
import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function printTitle(text) {
  console.log('\n' + colors.cyan + colors.bright + text + colors.reset + '\n');
}

function printStep(number, text) {
  console.log(colors.yellow + colors.bright + `Step ${number}: ` + colors.reset + text);
}

function printInfo(text) {
  console.log(colors.white + text + colors.reset);
}

function printSuccess(text) {
  console.log(colors.green + colors.bright + '✓ ' + text + colors.reset);
}

function printError(text) {
  console.log(colors.red + colors.bright + '✗ ' + text + colors.reset);
}

function printSubStep(text) {
  console.log('  ' + colors.cyan + '• ' + colors.reset + text);
}

// Configuration object to store database IDs
let config = {
  databases: {
    categories: '',
    articles: '',
    faqs: ''
  }
};

// Start the setup process
function startSetup() {
  printTitle('Use Existing Notion Databases');
  
  printInfo('This script will help you configure the application to use your existing Notion databases.');
  printInfo('You\'ll need to have the Notion integration secret and page URL already set up.');
  
  checkCredentials();
}

// Check if Notion credentials are configured
async function checkCredentials() {
  printStep(1, 'Checking Notion Credentials');
  
  const NOTION_INTEGRATION_SECRET = process.env.NOTION_INTEGRATION_SECRET;
  const NOTION_PAGE_URL = process.env.NOTION_PAGE_URL;
  
  if (!NOTION_INTEGRATION_SECRET || !NOTION_PAGE_URL) {
    printError('Missing Notion credentials!');
    printInfo('Please make sure you have the following environment variables set:');
    printInfo('- NOTION_INTEGRATION_SECRET');
    printInfo('- NOTION_PAGE_URL');
    printInfo('\nYou can run the setup.js script first to configure these:');
    printInfo('node setup.js');
    rl.close();
    return;
  }
  
  printSuccess('Notion credentials found');
  
  try {
    // Extract page ID from URL
    const match = NOTION_PAGE_URL.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (!match || !match[1]) {
      printError('Could not extract page ID from URL');
      rl.close();
      return;
    }
    
    const pageId = match[1];
    printSuccess(`Page ID extracted: ${pageId}`);
    
    // Initialize Notion client
    const notion = new Client({ auth: NOTION_INTEGRATION_SECRET });
    
    // Test connection
    await notion.pages.retrieve({ page_id: pageId });
    printSuccess('Successfully connected to Notion API');
    
    // Proceed to listing databases
    listDatabases(notion, pageId);
  } catch (error) {
    printError(`Error connecting to Notion: ${error.message}`);
    rl.close();
  }
}

// List all databases in the page
async function listDatabases(notion, pageId) {
  printStep(2, 'Finding Databases in Your Notion Page');
  
  try {
    const response = await notion.blocks.children.list({ block_id: pageId });
    
    // Filter for databases
    const databases = response.results.filter(block => block.type === 'child_database');
    
    if (databases.length === 0) {
      printError('No databases found in your Notion page.');
      printInfo('You need to have databases in your Notion page to use this feature.');
      rl.close();
      return;
    }
    
    printSuccess(`Found ${databases.length} database(s) in your Notion page`);
    
    // Get database info
    const databasesInfo = await Promise.all(
      databases.map(async db => {
        const info = await notion.databases.retrieve({ database_id: db.id });
        let title = '';
        if (info.title && info.title.length > 0) {
          title = info.title[0]?.plain_text || 'Untitled Database';
        }
        return {
          id: db.id,
          title: title,
          properties: Object.keys(info.properties)
        };
      })
    );
    
    // Display databases
    printInfo('\nAvailable databases:');
    databasesInfo.forEach((db, index) => {
      console.log(`${index + 1}. ${colors.bright}${db.title}${colors.reset} (ID: ${db.id})`);
      console.log(`   Properties: ${db.properties.join(', ')}`);
    });
    
    // Map databases
    mapDatabases(notion, databasesInfo);
  } catch (error) {
    printError(`Error listing databases: ${error.message}`);
    rl.close();
  }
}

// Map databases to the application's expected structure
function mapDatabases(notion, databasesInfo) {
  printStep(3, 'Mapping Databases');
  
  printInfo('Now you need to map your databases to the application\'s expected structure:');
  printInfo('1. Categories database - Stores category information');
  printInfo('2. Articles database - Stores documentation articles');
  printInfo('3. FAQs database - Stores frequently asked questions');
  
  mapCategoriesDatabase(notion, databasesInfo, 0);
}

// Map Categories database
function mapCategoriesDatabase(notion, databasesInfo, attempt) {
  if (attempt > 2) {
    printError('Too many failed attempts. Please make sure your databases have the required properties.');
    rl.close();
    return;
  }
  
  printSubStep('Select your Categories database:');
  rl.question('Enter the number of the database to use for Categories: ', async (answer) => {
    const index = parseInt(answer) - 1;
    
    if (isNaN(index) || index < 0 || index >= databasesInfo.length) {
      printError('Invalid selection. Please enter a valid number.');
      mapCategoriesDatabase(notion, databasesInfo, attempt + 1);
      return;
    }
    
    const selectedDb = databasesInfo[index];
    config.databases.categories = selectedDb.id;
    
    // Validate database properties
    try {
      const dbInfo = await notion.databases.retrieve({ database_id: selectedDb.id });
      const properties = dbInfo.properties;
      
      const requiredProps = ['Name', 'Description', 'Icon'];
      const missingProps = requiredProps.filter(prop => 
        !Object.keys(properties).some(p => p.toLowerCase() === prop.toLowerCase())
      );
      
      if (missingProps.length > 0) {
        printError(`The selected database is missing required properties: ${missingProps.join(', ')}`);
        printInfo('Do you want to continue anyway? The application might not work correctly.');
        rl.question('Continue? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            printSuccess(`Categories database set to: ${selectedDb.title}`);
            mapArticlesDatabase(notion, databasesInfo, 0);
          } else {
            mapCategoriesDatabase(notion, databasesInfo, attempt + 1);
          }
        });
        return;
      }
      
      printSuccess(`Categories database set to: ${selectedDb.title}`);
      mapArticlesDatabase(notion, databasesInfo, 0);
    } catch (error) {
      printError(`Error validating database: ${error.message}`);
      mapCategoriesDatabase(notion, databasesInfo, attempt + 1);
    }
  });
}

// Map Articles database
function mapArticlesDatabase(notion, databasesInfo, attempt) {
  if (attempt > 2) {
    printError('Too many failed attempts. Please make sure your databases have the required properties.');
    rl.close();
    return;
  }
  
  printSubStep('Select your Articles database:');
  rl.question('Enter the number of the database to use for Articles: ', async (answer) => {
    const index = parseInt(answer) - 1;
    
    if (isNaN(index) || index < 0 || index >= databasesInfo.length) {
      printError('Invalid selection. Please enter a valid number.');
      mapArticlesDatabase(notion, databasesInfo, attempt + 1);
      return;
    }
    
    const selectedDb = databasesInfo[index];
    config.databases.articles = selectedDb.id;
    
    // Validate database properties
    try {
      const dbInfo = await notion.databases.retrieve({ database_id: selectedDb.id });
      const properties = dbInfo.properties;
      
      const requiredProps = ['Title', 'Content', 'CategoryId', 'CategoryName', 'IsPopular'];
      const missingProps = requiredProps.filter(prop => 
        !Object.keys(properties).some(p => p.toLowerCase() === prop.toLowerCase())
      );
      
      if (missingProps.length > 0) {
        printError(`The selected database is missing required properties: ${missingProps.join(', ')}`);
        printInfo('Do you want to continue anyway? The application might not work correctly.');
        rl.question('Continue? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            printSuccess(`Articles database set to: ${selectedDb.title}`);
            mapFAQsDatabase(notion, databasesInfo, 0);
          } else {
            mapArticlesDatabase(notion, databasesInfo, attempt + 1);
          }
        });
        return;
      }
      
      printSuccess(`Articles database set to: ${selectedDb.title}`);
      mapFAQsDatabase(notion, databasesInfo, 0);
    } catch (error) {
      printError(`Error validating database: ${error.message}`);
      mapArticlesDatabase(notion, databasesInfo, attempt + 1);
    }
  });
}

// Map FAQs database
function mapFAQsDatabase(notion, databasesInfo, attempt) {
  if (attempt > 2) {
    printError('Too many failed attempts. Please make sure your databases have the required properties.');
    rl.close();
    return;
  }
  
  printSubStep('Select your FAQs database:');
  rl.question('Enter the number of the database to use for FAQs: ', async (answer) => {
    const index = parseInt(answer) - 1;
    
    if (isNaN(index) || index < 0 || index >= databasesInfo.length) {
      printError('Invalid selection. Please enter a valid number.');
      mapFAQsDatabase(notion, databasesInfo, attempt + 1);
      return;
    }
    
    const selectedDb = databasesInfo[index];
    config.databases.faqs = selectedDb.id;
    
    // Validate database properties
    try {
      const dbInfo = await notion.databases.retrieve({ database_id: selectedDb.id });
      const properties = dbInfo.properties;
      
      const requiredProps = ['Question', 'Answer', 'CategoryId', 'CategoryName'];
      const missingProps = requiredProps.filter(prop => 
        !Object.keys(properties).some(p => p.toLowerCase() === prop.toLowerCase())
      );
      
      if (missingProps.length > 0) {
        printError(`The selected database is missing required properties: ${missingProps.join(', ')}`);
        printInfo('Do you want to continue anyway? The application might not work correctly.');
        rl.question('Continue? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            printSuccess(`FAQs database set to: ${selectedDb.title}`);
            saveConfiguration();
          } else {
            mapFAQsDatabase(notion, databasesInfo, attempt + 1);
          }
        });
        return;
      }
      
      printSuccess(`FAQs database set to: ${selectedDb.title}`);
      saveConfiguration();
    } catch (error) {
      printError(`Error validating database: ${error.message}`);
      mapFAQsDatabase(notion, databasesInfo, attempt + 1);
    }
  });
}

// Save the configuration
function saveConfiguration() {
  printStep(4, 'Saving Configuration');
  
  const configJson = JSON.stringify(config, null, 2);
  
  try {
    fs.writeFileSync('notion-config.json', configJson);
    printSuccess('Configuration saved to notion-config.json');
    
    // Configuration is now auto-detected
    printInfo('\nThe configuration has been saved and will be automatically detected by the application.');
    printInfo('No additional environment variables are needed!');
    
    printInfo('\nYou can now restart your application to use these existing databases.');
    
    finishSetup();
  } catch (error) {
    printError(`Error saving configuration: ${error.message}`);
    rl.close();
  }
}

// Create the update script for the notion service
function createUpdateScript() {
  const updateScriptPath = 'update-notion-service.js';
  const scriptContent = `#!/usr/bin/env node

/**
 * Script to update the notion service to use existing databases
 */

import fs from 'fs';
import path from 'path';

const notionServicePath = 'server/services/notion.ts';

console.log('Updating Notion service to use existing databases...');

try {
  // Read the current file
  const content = fs.readFileSync(notionServicePath, 'utf8');
  
  // Define the modification - add code to load configuration
  const configLoaderCode = \`
// Load database configuration from file if specified
let databaseConfig = {
  databases: {
    categories: null,
    articles: null,
    faqs: null
  }
};

// Check if a configuration file exists
const configPath = './notion-config.json';
if (fs.existsSync(configPath)) {
  try {
    console.log(\\\`Loading Notion database configuration from \\\${configPath}\\\`);
    
    // Load the configuration file
    const configData = fs.readFileSync(configPath, 'utf8');
    databaseConfig = JSON.parse(configData);
    
    console.log('Successfully loaded database configuration:');
    console.log(\\\`- Categories database: \\\${databaseConfig.databases.categories}\\\`);
    console.log(\\\`- Articles database: \\\${databaseConfig.databases.articles}\\\`);
    console.log(\\\`- FAQs database: \\\${databaseConfig.databases.faqs}\\\`);
  } catch (error) {
    console.error(\\\`Error loading Notion configuration file: \\\${error.message}\\\`);
  }
}\`;
  
  // Find the right spot to add the code - after the imports
  const importSection = content.match(/import[\\s\\S]+?from[\\s\\S]+?;\\n/g);
  let lastImportIndex = 0;
  
  if (importSection && importSection.length > 0) {
    lastImportIndex = content.lastIndexOf(importSection[importSection.length - 1]) + 
                      importSection[importSection.length - 1].length;
  }
  
  // Add fs import
  const fsImport = 'import * as fs from "fs";\\n';
  
  // Modify the functions that need to use the config
  const modifiedContent = content.slice(0, lastImportIndex) + 
                         fsImport +
                         content.slice(lastImportIndex, lastImportIndex) + 
                         configLoaderCode + 
                         content.slice(lastImportIndex)
                         .replace(
                           'const DATABASE_ID = "1ebc922b6d5b80729c9dd0d4f7ccf567";', 
                           'const DATABASE_ID = databaseConfig.databases.faqs || "1ebc922b6d5b80729c9dd0d4f7ccf567";'
                         )
                         .replace(
                           'const DATABASE_ID = articlesDb ? articlesDb.id : "1ebc922b6d5b80729c9dd0d4f7ccf567";',
                           'const DATABASE_ID = databaseConfig.databases.articles || (articlesDb ? articlesDb.id : "1ebc922b6d5b80729c9dd0d4f7ccf567");'
                         );
  
  // Write the modified content back to the file
  fs.writeFileSync(notionServicePath, modifiedContent);
  
  console.log('Successfully updated Notion service!');
  console.log('You can now use your existing Notion databases with the application.');
  console.log('The application will automatically find and use the notion-config.json file.');
  console.log('No additional environment variables are needed.');
} catch (error) {
  console.error(\`Error updating Notion service: \${error.message}\`);
}
`;

  try {
    fs.writeFileSync(updateScriptPath, scriptContent);
    fs.chmodSync(updateScriptPath, '755');
    printSuccess(`Created ${updateScriptPath}`);
  } catch (error) {
    printError(`Error creating update script: ${error.message}`);
  }
}

// Finish setup
function finishSetup() {
  createUpdateScript();
  
  printStep(5, 'Setup Complete');
  
  printSuccess('Configuration for using existing Notion databases is complete!');
  printInfo('\nFollow these steps to finish the setup:');
  printInfo('1. Run node update-notion-service.js to update the service code');
  printInfo('2. Restart the application with npm run dev');
  printInfo('\nNote: The application will automatically find and use the notion-config.json file.');
  
  rl.close();
}

// Start the setup process
startSetup();