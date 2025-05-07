#!/usr/bin/env node

/**
 * Notion Database Detection Script
 * 
 * This script checks if the provided Notion page already contains databases
 * before automatically creating new ones.
 */

const { Client } = require('@notionhq/client');

// Access environment variables
const NOTION_INTEGRATION_SECRET = process.env.NOTION_INTEGRATION_SECRET;
const NOTION_PAGE_URL = process.env.NOTION_PAGE_URL;

// Check required environment variables
if (!NOTION_INTEGRATION_SECRET || !NOTION_PAGE_URL) {
  console.log('Missing required environment variables: NOTION_INTEGRATION_SECRET and/or NOTION_PAGE_URL');
  console.log('Please set these variables in your environment before running the application.');
  process.exit(1);
}

// Initialize Notion client
const notion = new Client({ auth: NOTION_INTEGRATION_SECRET });

// Extract page ID from URL
function extractPageIdFromUrl(pageUrl) {
  const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  throw Error("Failed to extract page ID from Notion URL");
}

async function detectDatabases() {
  try {
    // Extract page ID from the URL
    const pageId = extractPageIdFromUrl(NOTION_PAGE_URL);
    console.log(`Checking Notion page ${pageId} for existing databases...`);
    
    // List all blocks (including databases) in the page
    const response = await notion.blocks.children.list({
      block_id: pageId
    });
    
    // Filter for databases
    const databases = response.results.filter(block => block.type === 'child_database');
    
    if (databases.length > 0) {
      console.log(`Found ${databases.length} existing database(s) in your Notion page.`);
      
      // Get database info
      const databasesInfo = await Promise.all(
        databases.map(async db => {
          const info = await notion.databases.retrieve({ database_id: db.id });
          let title = '';
          if (info.title && info.title.length > 0) {
            title = info.title[0]?.plain_text || 'Untitled Database';
          }
          return { id: db.id, title: title };
        })
      );
      
      // Display found databases
      console.log('\nExisting databases:');
      databasesInfo.forEach(db => {
        console.log(`- ${db.title} (ID: ${db.id})`);
      });
      
      console.log('\nTo use these existing databases, run:');
      console.log('node use-existing-db.js');
      
      // Create a flag file to indicate existing databases were found
      require('fs').writeFileSync('.notion-db-exists', JSON.stringify({ 
        timestamp: new Date().toISOString(),
        databaseCount: databases.length 
      }));
      
      return true;
    } else {
      console.log('No existing databases found in your Notion page.');
      return false;
    }
  } catch (error) {
    console.error('Error detecting Notion databases:', error);
    return false;
  }
}

// Run the detection
detectDatabases().then(hasExistingDatabases => {
  if (!hasExistingDatabases) {
    console.log('\nYou can create new databases by running:');
    console.log('node server/setup-notion.ts');
  }
});