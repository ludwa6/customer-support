/**
 * Special script for Replit Agent to use during remix setup
 * 
 * This script is designed to be used by the Replit Agent when a user remixes the project.
 * It helps detect and configure existing Notion databases and explicitly prevents
 * the need to set NOTION_CONFIG_PATH.
 */

import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const exec = promisify(execCallback);

// Styling functions for console output
function printTitle(text) {
  console.log('\n\x1b[1;36m' + text + '\x1b[0m');
}

function printStep(text) {
  console.log('\n\x1b[1;34m' + text + '\x1b[0m');
}

function printInfo(text) {
  console.log('\x1b[90m' + text + '\x1b[0m');
}

function printSuccess(text) {
  console.log('\x1b[1;32m' + text + '\x1b[0m');
}

function printError(text) {
  console.log('\x1b[1;31m' + text + '\x1b[0m');
}

function printWarning(text) {
  console.log('\x1b[1;33m' + text + '\x1b[0m');
}

// Main setup function
async function runAgentSetup() {
  printTitle('Replit Agent Remix Setup Script');
  printInfo('This script will help configure your project with existing Notion databases');
  
  // Check if we have the required environment variables
  if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
    printError('Required environment variables are missing:');
    if (!process.env.NOTION_INTEGRATION_SECRET) printError('- NOTION_INTEGRATION_SECRET is not set');
    if (!process.env.NOTION_PAGE_URL) printError('- NOTION_PAGE_URL is not set');
    printInfo('Please add these secrets before proceeding');
    return;
  }
  
  printSuccess('Required Notion environment variables are set');
  
  // Step 1: List databases
  printStep('Step 1: Detecting existing Notion databases');
  await runCommand('npx tsx list-databases.ts');
  
  // Step 2: Run database detection
  printStep('Step 2: Configuring Notion databases');
  await runCommand('node server/detect-notion-db.js');
  
  // Step 3: Check if the configuration was created
  const configFile = 'notion-config.json';
  
  if (fs.existsSync(configFile)) {
    printSuccess('Notion database configuration has been created!');
    
    try {
      const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      const databases = configData.databases || {};
      const foundDatabaseCount = Object.keys(databases)
        .filter(key => databases[key] !== null)
        .length;
        
      if (foundDatabaseCount > 0) {
        printSuccess(`Found ${foundDatabaseCount} database(s) in your Notion page`);
        
        // List the detected databases
        Object.keys(databases).forEach(key => {
          if (databases[key]) {
            printInfo(`- ${key}: ${databases[key]}`);
          }
        });
        
        printInfo('\nThe application will automatically find and use the notion-config.json file.');
        printWarning('IMPORTANT: Do NOT set the NOTION_CONFIG_PATH environment variable - it is no longer needed!');
        
        // Run validation
        printStep('Step 3: Validating database schemas');
        await runCommand('npx tsx server/validate-notion-schema.ts');
        
        printSuccess('Setup completed successfully!');
        printInfo('You can now start the application with: npm run dev');
      } else {
        printWarning('No matching databases were detected in your Notion page');
        printInfo('You might need to run the manual configuration:');
        printInfo('node use-existing-db.js');
      }
    } catch (err) {
      printError('Error reading configuration file');
      console.error(err);
    }
  } else {
    printWarning('No configuration file was created');
    printInfo('Please run the manual setup: node use-existing-db.js');
  }
}

// Helper to run a command and return a promise
async function runCommand(command) {
  console.log(`\n> ${command}`);
  
  try {
    const { stdout, stderr } = await exec(command);
    console.log(stdout);
    if (stderr) console.error(stderr);
    return stdout;
  } catch (error) {
    printError(`Error executing command: ${command}`);
    console.error(error);
    // Still continue to next steps
    return '';
  }
}

// Run the setup
runAgentSetup().catch(error => {
  printError('Error during setup:');
  console.error(error);
});