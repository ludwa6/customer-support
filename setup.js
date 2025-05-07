#!/usr/bin/env node

/**
 * Interactive setup script for the SerenityFlow Documentation Portal
 * 
 * This script guides new users through the process of setting up their Notion
 * integration and connecting it to the application.
 */

import * as readline from 'readline';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const exec = promisify(execCallback);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Add colorful output functions
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

function printTitle(text) {
  console.log('\n' + colors.fg.cyan + colors.bright + text + colors.reset + '\n');
}

function printStep(number, text) {
  console.log(colors.fg.yellow + colors.bright + `Step ${number}: ` + colors.reset + text);
}

function printInfo(text) {
  console.log(colors.fg.white + text + colors.reset);
}

function printSuccess(text) {
  console.log(colors.fg.green + colors.bright + '✓ ' + text + colors.reset);
}

function printError(text) {
  console.log(colors.fg.red + colors.bright + '✗ ' + text + colors.reset);
}

function printSubStep(text) {
  console.log('  ' + colors.fg.cyan + '• ' + colors.reset + text);
}

function printLink(text, url) {
  console.log(colors.fg.blue + colors.underscore + text + colors.reset + ': ' + url);
}

// Start the setup process
function startSetup() {
  printTitle('SerenityFlow Documentation Portal Setup');
  
  printInfo('This script will guide you through setting up your Notion integration for the SerenityFlow Documentation Portal.');
  printInfo('You\'ll need to create a Notion integration and share a page with it to store your content.');
  
  rl.question('\nPress Enter to continue...', () => {
    notionIntegrationInstructions();
  });
}

// Step 1: Notion Integration Instructions
function notionIntegrationInstructions() {
  printStep(1, 'Create a Notion Integration');
  
  printSubStep('Go to the Notion integrations page:');
  printLink('Notion Integrations', 'https://www.notion.so/my-integrations');
  
  printSubStep('Click "New integration"');
  printSubStep('Give it a name (e.g., "SerenityFlow Portal")');
  printSubStep('Select the workspace where you want to use it');
  printSubStep('Click "Submit"');
  printSubStep('Copy the "Internal Integration Secret" that appears');
  
  rl.question('\nDo you have your Notion Integration Secret? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      collectNotionSecret();
    } else {
      printInfo('\nPlease create your Notion integration first, then run this script again.');
      rl.close();
    }
  });
}

// Step 2: Collect Notion Integration Secret
function collectNotionSecret() {
  printStep(2, 'Enter Your Notion Integration Secret');
  
  printInfo('This will be stored as an environment variable for the application to use.');
  printInfo('Your secret looks like: secret_abc123...');
  
  rl.question('\nEnter your Notion Integration Secret: ', (secret) => {
    if (secret.trim() === '') {
      printError('The secret cannot be empty.');
      collectNotionSecret();
      return;
    }
    
    if (!secret.startsWith('secret_')) {
      printError('This doesn\'t look like a valid Notion secret. It should start with "secret_".');
      rl.question('Continue anyway? (y/n): ', (confirm) => {
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
          notionPageInstructions(secret);
        } else {
          collectNotionSecret();
        }
      });
      return;
    }
    
    notionPageInstructions(secret);
  });
}

// Step 3: Notion Page Instructions
function notionPageInstructions(secret) {
  printStep(3, 'Share a Notion Page with your Integration');
  
  printInfo('Now you need to create or select a Notion page and share it with your integration:');
  
  printSubStep('Create a new page in Notion or open an existing one');
  printSubStep('Click the "..." (three dots) menu in the top right');
  printSubStep('Select "Add connections"');
  printSubStep('Find and select your integration ("SerenityFlow Portal")');
  printSubStep('Copy the URL of this page from your browser');
  
  rl.question('\nDo you have your Notion page URL? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      collectNotionPageUrl(secret);
    } else {
      printInfo('\nPlease share a Notion page with your integration, then run this script again.');
      rl.close();
    }
  });
}

// Step 4: Collect Notion Page URL
function collectNotionPageUrl(secret) {
  printStep(4, 'Enter Your Notion Page URL');
  
  printInfo('This is the URL of the page you shared with your integration.');
  printInfo('It should look like: https://www.notion.so/username/Page-Title-1234abcd...');
  
  rl.question('\nEnter your Notion Page URL: ', (pageUrl) => {
    if (pageUrl.trim() === '') {
      printError('The page URL cannot be empty.');
      collectNotionPageUrl(secret);
      return;
    }
    
    if (!pageUrl.includes('notion.so')) {
      printError('This doesn\'t look like a Notion URL.');
      rl.question('Continue anyway? (y/n): ', (confirm) => {
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
          saveEnvironmentVariables(secret, pageUrl);
        } else {
          collectNotionPageUrl(secret);
        }
      });
      return;
    }
    
    saveEnvironmentVariables(secret, pageUrl);
  });
}

// Step 5: Save Environment Variables
function saveEnvironmentVariables(secret, pageUrl) {
  printStep(5, 'Saving Environment Variables');
  
  // In Replit environment, we'll guide the user to add secrets
  printInfo('For Replit environment, you need to add these secrets:');
  printSubStep('Click on the lock icon 🔒 in the left sidebar (or press Ctrl+Shift+L)');
  printSubStep('Add a new secret with:');
  printInfo('  - Key: NOTION_INTEGRATION_SECRET');
  printInfo('  - Value: ' + secret);
  printSubStep('Add another secret with:');
  printInfo('  - Key: NOTION_PAGE_URL');
  printInfo('  - Value: ' + pageUrl);
  
  rl.question('\nHave you added these secrets to Replit? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      confirmSetup(secret, pageUrl);
    } else {
      printInfo('\nPlease add the secrets and then run this script again.');
      rl.close();
    }
  });
}

// Step 6: Confirm Setup
function confirmSetup(secret, pageUrl) {
  printStep(6, 'Initialize Notion Databases');
  
  printInfo('Now we\'ll run the setup script to create the necessary databases in your Notion page.');
  printInfo('This will create Categories, Articles, and FAQs databases and populate them with sample content.');
  
  rl.question('\nWould you like to initialize the Notion databases now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      runSetupScript(secret, pageUrl);
    } else {
      printInfo('\nYou can initialize the databases later by running:');
      printInfo('node server/setup-notion.ts');
      finishSetup();
    }
  });
}

// Step 7: Run Setup Script
async function runSetupScript(secret, pageUrl) {
  printInfo('\nRunning setup script...');
  
  // Run the setup script with environment variables
  const env = { 
    ...process.env, 
    NOTION_INTEGRATION_SECRET: secret, 
    NOTION_PAGE_URL: pageUrl 
  };
  
  try {
    const { stdout, stderr } = await exec('tsx server/setup-notion.ts', { env });
    
    if (stderr) {
      console.error(stderr);
    }
    
    console.log(stdout);
    printSuccess('Notion databases initialized successfully!');
  } catch (error) {
    printError('Error running setup script:');
    console.error(error.message);
    printInfo('\nYou can try running it manually later with:');
    printInfo('node server/setup-notion.ts');
  } finally {
    finishSetup();
  }
}

// Finish setup
function finishSetup() {
  printStep(7, 'Setup Complete');
  
  printSuccess('Your SerenityFlow Documentation Portal is ready to use!');
  printInfo('\nYou can now:');
  printSubStep('Start the application with: npm run dev');
  printSubStep('Access the portal in your browser');
  printSubStep('Add more content directly in your Notion databases');
  
  printInfo('\nThanks for using SerenityFlow Documentation Portal!');
  
  rl.close();
}

// Start the setup process
startSetup();