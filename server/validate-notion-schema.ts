/**
 * Notion Database Schema Validation Script
 * 
 * This script validates that Notion databases match the expected schema configurations.
 * It identifies missing properties, incorrect types, and other issues to help
 * troubleshoot integration problems.
 */

import { Client } from "@notionhq/client";
import * as fs from "fs";
import { validateDatabaseSchema, printValidationResult } from "./services/notion-validation";
import { extractPageIdFromUrl } from "./services/utils";

// Check environment variables
if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
  console.error("Error: NOTION_INTEGRATION_SECRET or NOTION_PAGE_URL environment variable is not set.");
  console.error("Please set these variables and try again.");
  process.exit(1);
}

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET
});

// Get the page ID from the URL
const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);

// Load database configuration from file if specified
let databaseConfig = {
  databases: {
    categories: null,
    articles: null,
    faqs: null,
    supportTickets: null
  }
};

// Check if a configuration file path is specified
if (process.env.NOTION_CONFIG_PATH) {
  try {
    const configPath = process.env.NOTION_CONFIG_PATH;
    console.log(`Loading Notion database configuration from ${configPath}`);
    
    // Load the configuration file
    const configData = fs.readFileSync(configPath, 'utf8');
    const parsedConfig = JSON.parse(configData);
    
    // Make sure we have a proper structure
    if (parsedConfig && parsedConfig.databases) {
      databaseConfig = parsedConfig;
      
      console.log('Successfully loaded database configuration:');
      Object.keys(databaseConfig.databases).forEach(dbKey => {
        const dbId = databaseConfig.databases[dbKey];
        console.log(`- ${dbKey} database: ${dbId || 'Not configured'}`);
      });
    } else {
      console.error('Invalid configuration format in Notion config file');
    }
  } catch (error: any) {
    console.error(`Error loading Notion configuration file: ${error.message}`);
  }
}

/**
 * Lists all child databases contained within the Notion page
 */
async function getNotionDatabases() {
  if (!NOTION_PAGE_ID) {
    throw new Error("NOTION_PAGE_ID is not set");
  }

  // Array to store the child databases
  const childDatabases = [];

  try {
    // Query all child blocks in the specified page
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.blocks.children.list({
        block_id: NOTION_PAGE_ID,
        start_cursor: startCursor,
      });

      // Process the results
      for (const block of response.results) {
        // Check if the block is a child database
        if (block.type === "child_database") {
          const databaseId = block.id;

          // Retrieve the database title
          try {
            const databaseInfo = await notion.databases.retrieve({
              database_id: databaseId,
            });

            // Add the database to our list
            childDatabases.push(databaseInfo);
          } catch (error) {
            console.error(`Error retrieving database ${databaseId}:`, error);
          }
        }
      }

      // Check if there are more results to fetch
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return childDatabases;
  } catch (error) {
    console.error("Error listing child databases:", error);
    throw error;
  }
}

/**
 * Main function to validate all databases
 */
async function validateDatabases() {
  try {
    console.log("🔍 Starting Notion database schema validation...");

    // Validate databases from config if they exist
    const validationPromises = [];
    const validationResults = {};

    // Process databases from config file
    if (databaseConfig.databases) {
      for (const [dbType, dbId] of Object.entries(databaseConfig.databases)) {
        if (dbId) {
          console.log(`Validating ${dbType} database (ID: ${dbId})...`);
          
          try {
            const result = await validateDatabaseSchema(notion, dbId as string, dbType);
            validationResults[dbType] = result;
            printValidationResult(result, dbType);
          } catch (error) {
            console.error(`Error validating ${dbType} database:`, error);
          }
        }
      }
    } else {
      console.log("No database configuration found. Searching for databases...");
      
      // Find all databases
      const databases = await getNotionDatabases();
      
      if (databases.length === 0) {
        console.log("No databases found in the Notion page.");
        return;
      }
      
      console.log(`Found ${databases.length} databases in the Notion page.`);
      
      // Try to identify databases by their titles
      for (const db of databases) {
        if (!db.title || !Array.isArray(db.title) || db.title.length === 0) {
          continue;
        }
        
        const dbTitle = db.title[0]?.plain_text || "";
        
        if (dbTitle.toLowerCase().includes("faq")) {
          console.log(`Validating FAQs database (${db.id})...`);
          const result = await validateDatabaseSchema(notion, db.id, "faqs");
          validationResults["faqs"] = result;
          printValidationResult(result, "faqs");
        } else if (dbTitle.toLowerCase().includes("ticket")) {
          console.log(`Validating Support Tickets database (${db.id})...`);
          const result = await validateDatabaseSchema(notion, db.id, "supportTickets");
          validationResults["supportTickets"] = result;
          printValidationResult(result, "supportTickets");
        } else if (dbTitle.toLowerCase().includes("categor")) {
          console.log(`Validating Categories database (${db.id})...`);
          const result = await validateDatabaseSchema(notion, db.id, "categories");
          validationResults["categories"] = result;
          printValidationResult(result, "categories");
        } else if (dbTitle.toLowerCase().includes("article")) {
          console.log(`Validating Articles database (${db.id})...`);
          const result = await validateDatabaseSchema(notion, db.id, "articles");
          validationResults["articles"] = result;
          printValidationResult(result, "articles");
        }
      }
    }
    
    // Summary
    console.log("\n📊 Validation Summary:");
    let allValid = true;
    
    for (const [dbType, result] of Object.entries(validationResults)) {
      const validationResult = result as any;
      if (!validationResult.isValid) {
        allValid = false;
        console.error(`❌ ${dbType}: Invalid schema (${validationResult.errors.length} errors)`);
      } else {
        console.log(`✅ ${dbType}: Valid schema`);
      }
    }
    
    if (allValid) {
      console.log("\n🎉 All databases have valid schemas!");
    } else {
      console.error("\n⚠️ Some databases have invalid schemas. Please fix the errors and try again.");
    }
    
  } catch (error) {
    console.error("Error validating databases:", error);
  }
}

// Run the validation
validateDatabases().then(() => {
  console.log("Schema validation complete!");
}).catch(error => {
  console.error("Validation failed:", error);
  process.exit(1);
});