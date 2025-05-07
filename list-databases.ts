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
  const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  throw Error("Failed to extract page ID from URL");
}

async function listAllDatabases() {
  try {
    const pageId = extractPageIdFromUrl(process.env.NOTION_PAGE_URL || '');
    console.log(`Inspecting page ID: ${pageId}`);
    
    // Query all child blocks in the page
    let hasMore = true;
    let startCursor: string | undefined = undefined;
    let databaseCount = 0;
    
    console.log('Databases found on this page:');
    console.log('----------------------------');
    
    while (hasMore) {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: startCursor,
      });
      
      // Process the results
      for (const block of response.results) {
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
    }
    
    if (databaseCount === 0) {
      console.log('No databases found on this page');
    } else {
      console.log(`Found ${databaseCount} databases on this page`);
    }
    
  } catch (error) {
    console.error('Error listing databases:', error);
  }
}

// Run the function
listAllDatabases();