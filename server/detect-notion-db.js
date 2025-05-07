#!/usr/bin/env node

/**
 * Notion Database Detection Script
 * 
 * This script checks if the provided Notion page already contains databases
 * before automatically creating new ones.
 */

import { Client } from '@notionhq/client';
import fs from 'fs';

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
          return { id: db.id, title: title, properties: Object.keys(info.properties) };
        })
      );
      
      // Display found databases
      console.log('\nExisting databases:');
      databasesInfo.forEach(db => {
        console.log(`- ${db.title} (ID: ${db.id})`);
        console.log(`  Properties: ${db.properties.join(', ')}`);
      });
      
      // Try to auto-detect databases based on names and create basic config
      const config = {
        databases: {
          categories: null,
          articles: null,
          faqs: null,
          supportTickets: null
        }
      };
      
      // Automatically map databases by title
      for (const db of databasesInfo) {
        const dbTitle = db.title.toLowerCase();
        
        if (dbTitle.includes('category') || dbTitle.includes('categories')) {
          config.databases.categories = db.id;
          console.log(`Auto-detected Categories database: ${db.title} (${db.id})`);
        }
        else if (dbTitle.includes('article') || dbTitle.includes('articles') || dbTitle.includes('documentation')) {
          config.databases.articles = db.id;
          console.log(`Auto-detected Articles database: ${db.title} (${db.id})`);
        }
        else if (dbTitle.includes('faq') || dbTitle.includes('faqs') || dbTitle.includes('question')) {
          config.databases.faqs = db.id;
          console.log(`Auto-detected FAQs database: ${db.title} (${db.id})`);
        }
        else if (dbTitle.includes('ticket') || dbTitle.includes('tickets') || dbTitle.includes('support')) {
          config.databases.supportTickets = db.id;
          console.log(`Auto-detected Support Tickets database: ${db.title} (${db.id})`);
        }
      }
      
      // Write the basic config file if any database was detected
      if (config.databases.categories || config.databases.articles || config.databases.faqs || config.databases.supportTickets) {
        fs.writeFileSync('notion-config.json', JSON.stringify(config, null, 2));
        console.log('\nCreated basic configuration file: notion-config.json');
        console.log('To use these databases, add this environment variable in your .env file or Replit Secrets:');
        console.log('NOTION_CONFIG_PATH=./notion-config.json');
      } else {
        console.log('\nTo use these existing databases with a custom mapping, run:');
        console.log('node use-existing-db.js');
      }
      
      // Create a flag file to indicate existing databases were found
      fs.writeFileSync('.notion-db-exists', JSON.stringify({ 
        timestamp: new Date().toISOString(),
        databaseCount: databases.length,
        databaseIds: databasesInfo.map(db => ({ id: db.id, title: db.title }))
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