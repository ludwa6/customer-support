#!/usr/bin/env node

/**
 * Initial Notion Database Setup for Remixed Projects
 * 
 * This script creates the necessary Notion databases for remixed projects
 * when the user doesn't have any existing databases.
 * 
 * It bypasses the normal prevention mechanisms to ensure that first-time
 * users can get set up properly.
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

function printStep(text) {
  console.log(colors.blue + '➔ ' + colors.reset + text);
}

function printSuccess(text) {
  console.log(colors.green + '✓ ' + colors.reset + text);
}

function printWarning(text) {
  console.log(colors.yellow + '⚠ ' + colors.reset + text);
}

function printInfo(text) {
  console.log(colors.white + 'ℹ ' + colors.reset + text);
}

function printError(text) {
  console.log(colors.red + '✗ ' + colors.reset + text);
}

async function setupNewDatabases() {
  printTitle('NOTION DATABASE CREATOR FOR REMIXED PROJECTS');
  
  // Check for required environment variables
  if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
    printError('Missing required environment variables!');
    printInfo('Please set these variables in your Replit Secrets:');
    printInfo('- NOTION_INTEGRATION_SECRET');
    printInfo('- NOTION_PAGE_URL');
    printInfo('\nYou can create a Notion integration at: https://www.notion.so/my-integrations');
    process.exit(1);
  }
  
  // First check if we already have databases via list-databases.ts
  printStep('Checking for existing databases in your Notion page...');
  
  try {
    const output = await runCommand('npx tsx list-databases.ts');
    
    // Check if any databases were found
    if (output.includes('database(s) found via search API') || 
        output.includes('child database(s) directly in your Notion page')) {
      printSuccess('Existing databases found!');
      printInfo('Use auto-setup.js to configure them instead:');
      printInfo('node auto-setup.js');
      return;
    }
    
    printWarning('No existing databases found in your Notion page.');
    printInfo('This script will create new databases for you.');
    
    // Temporarily remove the prevention marker if it exists
    const preventSetupFile = '.prevent-notion-setup';
    let markerExisted = false;
    
    if (fs.existsSync(preventSetupFile)) {
      printInfo('Temporarily removing prevention marker...');
      fs.renameSync(preventSetupFile, '.prevent-notion-setup.bak');
      markerExisted = true;
    }
    
    // Run the setup script to create databases
    printStep('Creating Notion databases...');
    await runCommand('npx tsx server/setup-notion.ts');
    
    // Restore the marker if it existed
    if (markerExisted) {
      printInfo('Restoring prevention marker...');
      fs.renameSync('.prevent-notion-setup.bak', preventSetupFile);
    }
    
    // Run auto-setup to finalize configuration
    printStep('Configuring application to use the new databases...');
    await runCommand('node auto-setup.js');
    
    printSuccess('Setup complete! Your application is now configured with new Notion databases.');
    printInfo('Start the application with: npm run dev');
    
  } catch (error) {
    printError('Error during setup:');
    console.error(error);
    printInfo('Please try again or run the individual setup steps manually:');
    printInfo('1. npx tsx server/setup-notion.ts');
    printInfo('2. node auto-setup.js');
  }
}

// Helper to run a command and return a promise
async function runCommand(command) {
  try {
    const { stdout, stderr } = await exec(command);
    console.log(stdout);
    if (stderr) console.error(stderr);
    return stdout;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    throw error;
  }
}

// Run the setup
setupNewDatabases().catch(error => {
  console.error('Error during setup:', error);
});