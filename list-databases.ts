import { Client } from "@notionhq/client";
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET,
});

// Extract page ID from URL
function extractPageIdFromUrl(pageUrl: string): string {
  console.log(`Trying to extract page ID from URL: ${pageUrl}`);
  
  // Match the 32-character ID at the end of the URL
  const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    console.log(`Extracted ID using regex pattern 1: ${match[1]}`);
    return match[1];
  }
  
  // Alternative pattern for URLs like notion.so/workspace/page-name-<id>
  const altMatch = pageUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:[?#]|$)/i);
  if (altMatch && altMatch[1]) {
    console.log(`Extracted ID using regex pattern 2: ${altMatch[1]}`);
    return altMatch[1].replace(/-/g, '');
  }
  
  // Try to extract just the last part of the URL
  const lastPart = pageUrl.split('-').pop();
  if (lastPart && lastPart.length >= 32) {
    const possibleId = lastPart.substring(0, 32);
    console.log(`Extracted possible ID from URL end: ${possibleId}`);
    return possibleId;
  }
  
  console.error("Failed to extract page ID from URL using any method");
  throw Error("Failed to extract page ID from URL");
}

async function listAllDatabases() {
  try {
    const pageId = extractPageIdFromUrl(process.env.NOTION_PAGE_URL || '');
    console.log(`Inspecting page ID: ${pageId}`);
    console.log(`Integration secret exists: ${Boolean(process.env.NOTION_INTEGRATION_SECRET)}`);
    
    // First, try the search API to find any databases the integration can access
    console.log("\nAttempting to find databases via search API:");
    console.log('---------------------------------------');
    
    try {
      const searchResponse = await notion.search({
        query: "Support Tickets",
        filter: {
          property: "object",
          value: "database"
        }
      });
      
      if (searchResponse.results.length > 0) {
        console.log(`Found ${searchResponse.results.length} databases via search:`);
        
        for (let i = 0; i < searchResponse.results.length; i++) {
          const db = searchResponse.results[i];
          // @ts-ignore
          const title = db.title?.[0]?.plain_text || 'Untitled Database';
          console.log(`${i+1}. Database: "${title}"`);
          console.log(`   ID: ${db.id}`);
          // @ts-ignore
          console.log(`   Properties: ${Object.keys(db.properties || {}).join(', ')}`);
          console.log('----------------------------');
        }
      } else {
        console.log("No databases found via search");
      }
    } catch (error) {
      console.error("Error searching for databases:", error);
    }
    
    // Try to list all pages the integration can access
    console.log("\nAttempting to list all pages the integration can access:");
    console.log('---------------------------------------------------');
    
    try {
      const pagesResponse = await notion.search({
        filter: {
          property: "object",
          value: "page"
        }
      });
      
      console.log(`The integration can access ${pagesResponse.results.length} pages.`);
      
      for (let i = 0; i < Math.min(5, pagesResponse.results.length); i++) {
        // @ts-ignore
        console.log(`- Page ${i+1}: ${pagesResponse.results[i].id} (${pagesResponse.results[i].url})`);
      }
    } catch (error) {
      console.error("Error listing pages:", error);
    }
    
    // Now try to list child blocks on the specified page
    console.log("\nListing databases on the specified page:");
    console.log('-------------------------------------');
    
    // Query all child blocks in the page
    let hasMore = true;
    let startCursor: string | undefined = undefined;
    let databaseCount = 0;
    
    while (hasMore) {
      try {
        const response = await notion.blocks.children.list({
          block_id: pageId,
          start_cursor: startCursor,
        });
        
        console.log(`Got ${response.results.length} blocks on this page`);
        
        // Process the results
        for (const block of response.results) {
          console.log(`Block type: ${(block as any).type}`);
          
          // @ts-ignore
          if (block.type === "child_database") {
            databaseCount++;
            try {
              // Get database info
              const db = await notion.databases.retrieve({
                database_id: block.id,
              });
              
              // @ts-ignore
              const title = db.title?.[0]?.plain_text || 'Untitled Database';
              console.log(`${databaseCount}. Database: "${title}"`);
              console.log(`   ID: ${block.id}`);
              console.log(`   Properties: ${Object.keys(db.properties).join(', ')}`);
              console.log('----------------------------');
            } catch (error) {
              console.error(`Error retrieving database ${block.id}:`, error);
            }
          }
        }
        
        // Check if there are more results to fetch
        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;
      } catch (error) {
        console.error("Error listing blocks on page:", error);
        hasMore = false;
      }
    }
    
    if (databaseCount === 0) {
      console.log('No databases found on this page');
    } else {
      console.log(`Found ${databaseCount} databases on this page`);
    }
    
    // Try to directly access a database with the ID from the error message
    console.log("\nTrying to directly access the database mentioned in error messages:");
    console.log('-----------------------------------------------------------');
    
    try {
      const manualDbId = "1ebc922b6d5b8006b3d0c0b013b4f2fb";
      console.log(`Attempting to access database with ID: ${manualDbId}`);
      
      const dbInfo = await notion.databases.retrieve({
        database_id: manualDbId
      });
      
      // @ts-ignore
      console.log(`Successfully accessed database: ${dbInfo.title?.[0]?.plain_text || 'Untitled'}`);
      console.log(`Properties: ${Object.keys(dbInfo.properties).join(', ')}`);
    } catch (error) {
      console.error("Error accessing database directly:", error);
    }
    
  } catch (error) {
    console.error('Error listing databases:', error);
  }
}

// Run the function
listAllDatabases();