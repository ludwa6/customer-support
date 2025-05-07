#!/usr/bin/env node

/**
 * Simple check script to verify Notion integration setup
 * 
 * This script checks if Notion credentials are configured properly
 * and verifies connection to the Notion API.
 */

const { Client } = require('@notionhq/client');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`${colors.cyan}${colors.bold}SerenityFlow Notion Setup Checker${colors.reset}\n`);
console.log('Checking your Notion integration configuration...\n');

// Check environment variables
const NOTION_INTEGRATION_SECRET = process.env.NOTION_INTEGRATION_SECRET;
const NOTION_PAGE_URL = process.env.NOTION_PAGE_URL;

let hasErrors = false;

// Check if Notion integration secret is set
if (!NOTION_INTEGRATION_SECRET) {
  console.log(`${colors.red}✗ NOTION_INTEGRATION_SECRET is missing${colors.reset}`);
  console.log('  Please add it to your environment variables');
  hasErrors = true;
} else {
  console.log(`${colors.green}✓ NOTION_INTEGRATION_SECRET is configured${colors.reset}`);
}

// Check if Notion page URL is set
if (!NOTION_PAGE_URL) {
  console.log(`${colors.red}✗ NOTION_PAGE_URL is missing${colors.reset}`);
  console.log('  Please add it to your environment variables');
  hasErrors = true;
} else {
  console.log(`${colors.green}✓ NOTION_PAGE_URL is configured${colors.reset}`);
  
  // Try to extract page ID from URL
  try {
    const match = NOTION_PAGE_URL.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
      const pageId = match[1];
      console.log(`${colors.green}✓ Page ID successfully extracted: ${pageId}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Could not extract page ID from URL${colors.reset}`);
      console.log('  Make sure your Notion page URL is correct');
      hasErrors = true;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error processing page URL: ${error.message}${colors.reset}`);
    hasErrors = true;
  }
}

// Only test connection if we have the required variables
if (NOTION_INTEGRATION_SECRET && NOTION_PAGE_URL) {
  console.log('\nTesting connection to Notion API...');
  
  try {
    // Initialize Notion client
    const notion = new Client({ auth: NOTION_INTEGRATION_SECRET });
    
    // Extract page ID from URL
    const pageId = NOTION_PAGE_URL.match(/([a-f0-9]{32})(?:[?#]|$)/i)[1];
    
    // Test connection by retrieving the page
    notion.pages.retrieve({ page_id: pageId })
      .then(() => {
        console.log(`${colors.green}✓ Successfully connected to Notion API${colors.reset}`);
        console.log(`${colors.green}✓ Page access verified${colors.reset}`);
        
        // Check for databases
        return notion.blocks.children.list({ block_id: pageId });
      })
      .then((response) => {
        // Look for database blocks
        const databases = response.results.filter(block => block.type === 'child_database');
        
        if (databases.length > 0) {
          console.log(`${colors.green}✓ Found ${databases.length} database(s) in your Notion page${colors.reset}`);
          
          // Get info about each database
          return Promise.all(
            databases.map(db => 
              notion.databases.retrieve({ database_id: db.id })
                .then(dbInfo => {
                  let title = '';
                  if (dbInfo.title && dbInfo.title.length > 0) {
                    title = dbInfo.title[0]?.plain_text || 'Untitled Database';
                  }
                  return title;
                })
            )
          );
        } else {
          console.log(`${colors.yellow}⚠ No databases found in your Notion page${colors.reset}`);
          console.log('  You may need to run the setup script to create the required databases:');
          console.log('  node server/setup-notion.ts');
          return [];
        }
      })
      .then((databaseNames) => {
        if (databaseNames.length > 0) {
          console.log('  Found databases:');
          databaseNames.forEach(name => {
            console.log(`  - ${name}`);
          });
        }
        
        console.log('\nSetup check complete!');
        
        if (!hasErrors) {
          console.log(`${colors.green}${colors.bold}✓ All checks passed! Your Notion integration is configured correctly.${colors.reset}`);
          console.log('\nYou can now start the application with:');
          console.log('npm run dev');
        } else {
          console.log(`${colors.yellow}${colors.bold}⚠ Some issues were detected. Please fix them before proceeding.${colors.reset}`);
          console.log('\nFor help, run the interactive setup script:');
          console.log('node setup.js');
        }
      })
      .catch((error) => {
        console.log(`${colors.red}✗ Error connecting to Notion: ${error.message}${colors.reset}`);
        
        if (error.code === 'object_not_found') {
          console.log(`${colors.yellow}  This probably means your integration doesn't have access to the page.${colors.reset}`);
          console.log('  Make sure you shared the page with your integration:');
          console.log('  1. Open your page in Notion');
          console.log('  2. Click "..." in the top right');
          console.log('  3. Select "Add connections"');
          console.log('  4. Search for and select your integration');
        }
        
        console.log('\nSetup check complete with errors.');
        console.log(`${colors.yellow}${colors.bold}⚠ Please fix the issues above before proceeding.${colors.reset}`);
        console.log('\nFor help, run the interactive setup script:');
        console.log('node setup.js');
      });
  } catch (error) {
    console.log(`${colors.red}✗ Error initializing Notion client: ${error.message}${colors.reset}`);
    console.log('\nSetup check complete with errors.');
    console.log(`${colors.yellow}${colors.bold}⚠ Please fix the issues above before proceeding.${colors.reset}`);
    console.log('\nFor help, run the interactive setup script:');
    console.log('node setup.js');
  }
} else {
  console.log('\nSetup check complete with errors.');
  console.log(`${colors.yellow}${colors.bold}⚠ Please fix the issues above before proceeding.${colors.reset}`);
  console.log('\nFor help, run the interactive setup script:');
  console.log('node setup.js');
}