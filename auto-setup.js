#!/usr/bin/env node

/**
 * Automatic setup script for the SerenityFlow Documentation Portal
 * 
 * This script runs automatically to handle database detection and configuration
 * when someone remixes the project.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  console.log(colors.yellow + colors.bright + '✓ ' + colors.reset + text);
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

function printWarning(text) {
  console.log(colors.yellow + colors.bright + '! ' + text + colors.reset);
}

// Function to check if this is likely a remixed project
function checkIfRemix() {
  // These conditions might indicate a project is a remix:
  
  // 1. Check for remix-specific environment variable (could be set by the remixing system)
  if (process.env.IS_REMIX === 'true') return true;
  
  // 2. Check if the project was recently created (remixes start fresh)
  try {
    const projectCreationTime = fs.statSync('.').birthtimeMs;
    const currentTime = Date.now();
    const projectAgeHours = (currentTime - projectCreationTime) / (1000 * 60 * 60);
    
    // If project is less than 1 hour old, it's likely a fresh remix
    if (projectAgeHours < 1) return true;
  } catch (err) {
    // Ignore errors with file stats
  }
  
  // 3. Check if this auto-setup.js is being run for the first time
  // If we already have setup markers but no config, likely a remix scenario
  if (!fs.existsSync('notion-config.json') && 
      (fs.existsSync('.notion-db-exists') || fs.existsSync('.prevent-notion-setup'))) {
    return true;
  }
  
  return false;
}

// Main function to run the auto setup
async function runAutoSetup() {
  printTitle('SerenityFlow Documentation Portal - Auto Setup');
  
  // Check for Notion credentials
  const NOTION_SECRET = process.env.NOTION_INTEGRATION_SECRET;
  const NOTION_PAGE_URL = process.env.NOTION_PAGE_URL;
  
  if (!NOTION_SECRET || !NOTION_PAGE_URL) {
    printWarning('Notion credentials not found');
    printInfo('To set up this project, you need to provide your Notion integration credentials:');
    printInfo('1. Run the interactive setup: node setup.js');
    printInfo('2. Or add the NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL environment variables');
    return;
  }
  
  printSuccess('Notion credentials found');
  
  // Check for existing configuration
  const configFile = 'notion-config.json';
  const flagFile = '.notion-db-exists';
  const preventSetupFile = '.prevent-notion-setup';
  
  // SPECIAL CASE FOR REMIXING: Check if this is likely a remixed project
  const isRemix = checkIfRemix();
  if (isRemix) {
    printStep('🔄 Detected that this is likely a remixed project');
    printInfo('Will configure to use your existing databases instead of creating new ones');
    
    // Always create the prevent-setup file in remix case to prevent database duplication
    if (!fs.existsSync(preventSetupFile)) {
      fs.writeFileSync(preventSetupFile, 'true');
      printInfo('Created prevention marker to avoid database duplication');
    }
    
    // Force detection even if we already have a flag
    printStep('Checking for databases in your Notion page...');
    try {
      await runCommand('node server/detect-notion-db.js');
      
      // If detection created or updated the config, it means databases were found
      if (fs.existsSync(configFile)) {
        // Set environment variable
        if (!process.env.NOTION_CONFIG_PATH) {
          process.env.NOTION_CONFIG_PATH = './' + configFile;
          printInfo('Set NOTION_CONFIG_PATH to ./notion-config.json');
        }
        
        // Try to read the config to see what was found
        try {
          const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'));
          const databases = configData.databases || {};
          const foundDatabases = Object.keys(databases)
            .filter(key => databases[key] !== null)
            .join(', ');
            
          if (foundDatabases) {
            printSuccess(`Found these databases: ${foundDatabases}`);
          } else {
            printWarning('No matching databases were found in your Notion page');
            printInfo('You might need to run the configuration tool:');
            printInfo('node use-existing-db.js');
          }
        } catch (err) {
          printError('Error reading configuration file');
        }
      }
      
      // Add reminder for permanent configuration
      printInfo('\nIMPORTANT: To make this configuration permanent, add this to your environment variables:');
      printInfo('NOTION_CONFIG_PATH=./notion-config.json');
      
      printSuccess('Remix setup completed!');
      printInfo('Your application is now configured to use your existing Notion databases.');
      printInfo('To start the application, run: npm run dev');
    } catch (error) {
      printError('Error during remixed project setup:');
      console.error(error);
      printInfo('Please run the setup manually:');
      printInfo('node use-existing-db.js');
    }
    return;
  }
  
  // REGULAR SETUP FLOW (not a remix)
  if (fs.existsSync(configFile)) {
    printSuccess('Configuration file exists');
    
    // Set NOTION_CONFIG_PATH if not already set
    if (!process.env.NOTION_CONFIG_PATH) {
      console.log('Setting NOTION_CONFIG_PATH environment variable');
      process.env.NOTION_CONFIG_PATH = './' + configFile;
    }
    
    printInfo('Your application is already configured to use Notion databases');
    printInfo('You can start it with: npm run dev');
    return;
  }
  
  // Check for existing databases
  printStep('Checking for existing Notion databases');
  
  try {
    // Run database detection script
    await runCommand('node server/detect-notion-db.js');
    
    // Check if databases were found and config was created
    if (fs.existsSync(configFile)) {
      printSuccess('Automatically configured Notion databases');
      printInfo('Configuration file created: notion-config.json');
      
      // Set environment variable
      process.env.NOTION_CONFIG_PATH = './' + configFile;
      printInfo('Set NOTION_CONFIG_PATH to ./notion-config.json');
      
      // Add reminder for permanent configuration
      printInfo('\nIMPORTANT: To make this configuration permanent, add this to your environment variables:');
      printInfo('NOTION_CONFIG_PATH=./notion-config.json');
      
      // Check if any database is null
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      const { categories, articles, faqs, supportTickets } = config.databases;
      
      if (!categories || !articles || !faqs || !supportTickets) {
        printWarning('Some database mappings could not be detected automatically');
        printInfo('For custom database mapping, run: node use-existing-db.js');
      }
      
      return;
    }
    
    // If config wasn't created but databases were found
    if (fs.existsSync(flagFile)) {
      printWarning('Databases found but not automatically configured');
      printInfo('To manually configure existing databases, run:');
      printInfo('node use-existing-db.js');
      return;
    }
    
    // No existing databases found, recommend setup
    printWarning('No existing databases found in your Notion page');
    printInfo('To set up new databases, run:');
    printInfo('node server/setup-notion.ts');
  } catch (error) {
    printError('Error during auto-setup:');
    console.error(error);
    printInfo('Please run the setup manually:');
    printInfo('node setup.js');
  }
}

// Helper to run a command and return a promise
function runCommand(command) {
  return new Promise((resolve, reject) => {
    const proc = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
    
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
  });
}

// Run the auto setup
runAutoSetup().catch(error => {
  console.error('Error during auto-setup:', error);
});