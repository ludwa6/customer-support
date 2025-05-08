#!/usr/bin/env node

/**
 * Special Remix Setup Script for SerenityFlow Documentation Portal
 * 
 * This script is designed specifically for users who remix this project.
 * It prioritizes finding existing databases in your Notion page.
 */

import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';

const exec = promisify(execCallback);

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
  console.log(colors.bright + colors.blue + `Step ${number}: ${text}` + colors.reset);
}

function printInfo(text) {
  console.log(colors.white + text + colors.reset);
}

function printSuccess(text) {
  console.log(colors.green + '✓ ' + text + colors.reset);
}

function printError(text) {
  console.log(colors.red + '✗ ' + text + colors.reset);
}

function printWarning(text) {
  console.log(colors.yellow + '⚠ ' + text + colors.reset);
}

async function setup() {
  printTitle('SerenityFlow Documentation Portal - Remix Setup');
  printInfo('This script will help you set up your remixed project with your Notion databases.');
  
  // Check for required environment variables
  printStep(1, 'Checking Environment Variables');
  
  const NOTION_INTEGRATION_SECRET = process.env.NOTION_INTEGRATION_SECRET;
  const NOTION_PAGE_URL = process.env.NOTION_PAGE_URL;
  
  if (!NOTION_INTEGRATION_SECRET || !NOTION_PAGE_URL) {
    printError('Missing required environment variables!');
    printInfo('Please make sure you have the following secrets set:');
    printInfo('- NOTION_INTEGRATION_SECRET: Your Notion integration secret');
    printInfo('- NOTION_PAGE_URL: URL of your Notion page shared with the integration');
    printInfo('\nAdd these in the Replit Secrets panel (lock icon in the sidebar).');
    return;
  }
  
  printSuccess('Environment variables found!');
  
  // Step 2: List databases
  printStep(2, 'Discovering Notion Databases');
  printInfo('Running list-databases.ts to find all databases in your Notion page...');
  
  try {
    const { stdout: listOutput } = await exec('npx tsx list-databases.ts');
    console.log(listOutput);
    
    if (listOutput.includes('Database:') || listOutput.includes('database with ID:')) {
      printSuccess('Databases found in your Notion page!');
    } else {
      printWarning('No databases found in your Notion page.');
      printInfo('You may need to:');
      printInfo('1. Check that your page is properly shared with the integration');
      printInfo('2. Duplicate the template page with databases first');
      printInfo('3. Make sure databases are directly on the page, not nested in sub-pages');
      return;
    }
  } catch (error) {
    printError('Error listing databases:');
    console.error(error);
    return;
  }
  
  // Step 3: Configure with auto-setup
  printStep(3, 'Configuring Application');
  printInfo('Running auto-setup.js to configure found databases...');
  
  try {
    const { stdout: setupOutput } = await exec('node auto-setup.js');
    console.log(setupOutput);
    
    // Check if notion-config.json was created
    if (fs.existsSync('notion-config.json')) {
      try {
        const configData = JSON.parse(fs.readFileSync('notion-config.json', 'utf8'));
        const databases = configData.databases || {};
        const configuredDbs = Object.keys(databases).filter(key => databases[key] !== null);
        
        if (configuredDbs.length > 0) {
          printSuccess(`Successfully configured databases: ${configuredDbs.join(', ')}`);
          
          // Create a file to indicate automatic configuration was successful
          fs.writeFileSync('.notion-setup-complete', 'true');
          printInfo('Created .notion-setup-complete marker file');
          
          // No need to set environment variables - the app will automatically find notion-config.json
          printSuccess('Configuration complete! No additional environment variables needed.');
        } else {
          printWarning('No databases were automatically configured.');
          printInfo('You may need to run the guided setup:');
          printInfo('node use-existing-db.js');
          return;
        }
      } catch (configError) {
        printError('Error reading configuration:');
        console.error(configError);
      }
    } else {
      printWarning('No configuration file was created.');
      printInfo('You may need to run the guided setup:');
      printInfo('node use-existing-db.js');
      return;
    }
  } catch (error) {
    printError('Error during auto-setup:');
    console.error(error);
    printInfo('You can try the guided setup:');
    printInfo('node use-existing-db.js');
    return;
  }
  
  // Step 4: Start the application
  printStep(4, 'Starting the Application');
  printInfo('Your remix setup is complete! You can now start the application with:');
  printInfo('npm run dev');
  
  printTitle('Setup Complete!');
  printInfo('You have successfully configured your remixed SerenityFlow Documentation Portal.');
  printInfo('Your Notion databases are now connected to the application.');
}

// Run the setup
setup().catch(error => {
  printError('Unhandled error during setup:');
  console.error(error);
});