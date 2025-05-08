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
    
    // Array to store all found databases
    let allDatabases = [];
    
    // METHOD 1: List all blocks (including databases) in the page
    const response = await notion.blocks.children.list({
      block_id: pageId
    });
    
    // Filter for databases
    const childDatabases = response.results.filter(block => block.type === 'child_database');
    
    if (childDatabases.length > 0) {
      console.log(`Found ${childDatabases.length} child database(s) directly in your Notion page.`);
      
      // Get database info
      const childDatabasesInfo = await Promise.all(
        childDatabases.map(async db => {
          const info = await notion.databases.retrieve({ database_id: db.id });
          let title = '';
          if (info.title && info.title.length > 0) {
            title = info.title[0]?.plain_text || 'Untitled Database';
          }
          return { id: db.id, title: title, properties: Object.keys(info.properties) };
        })
      );
      
      allDatabases = [...childDatabasesInfo];
    } else {
      console.log("No child databases found directly on the page. Trying search method...");
    }
    
    // METHOD 2: Try to find databases using search API
    try {
      const searchResponse = await notion.search({
        filter: {
          property: "object",
          value: "database"
        }
      });
      
      if (searchResponse.results.length > 0) {
        console.log(`Found ${searchResponse.results.length} database(s) via search API.`);
        
        // Get detailed info for each database found via search
        const searchDatabasesInfo = await Promise.all(
          searchResponse.results.map(async db => {
            let title = 'Untitled Database';
            if (db.title && db.title.length > 0) {
              title = db.title[0]?.plain_text || 'Untitled Database';
            }
            
            // Get properties
            const properties = Object.keys(db.properties || {});
            
            return { 
              id: db.id, 
              title: title, 
              properties: properties 
            };
          })
        );
        
        // Add databases found via search to our collection
        // Only add those that aren't already in the list
        searchDatabasesInfo.forEach(searchDb => {
          if (!allDatabases.some(db => db.id === searchDb.id)) {
            allDatabases.push(searchDb);
          }
        });
      }
    } catch (searchError) {
      console.log("Search method error:", searchError.message);
    }
    
    // If we found databases by either method
    if (allDatabases.length > 0) {
      console.log(`Total of ${allDatabases.length} database(s) found.`);
      
      // Display found databases
      console.log('\nExisting databases:');
      allDatabases.forEach(db => {
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
      for (const db of allDatabases) {
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
        databaseCount: allDatabases.length,
        databaseIds: allDatabases.map(db => ({ id: db.id, title: db.title }))
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

// Create a marker file to indicate if we should prevent setup-notion.ts from running
function createPreventSetupMarker() {
  try {
    fs.writeFileSync('.prevent-notion-setup', 'true');
    console.log('Created marker file to prevent automatic database creation');
  } catch (error) {
    console.error('Error creating marker file:', error);
  }
}

// Run the detection
detectDatabases().then(hasExistingDatabases => {
  if (hasExistingDatabases) {
    // If we found databases, create a marker to prevent setup-notion.ts from running
    createPreventSetupMarker();
    console.log('\nTo use these existing databases, run either:');
    console.log('- node auto-setup.js (for automatic configuration)');
    console.log('- node use-existing-db.js (for guided setup)');
  } else {
    console.log('\nNo existing databases found. You can create new databases by running:');
    console.log('node server/setup-notion.ts');
  }
});