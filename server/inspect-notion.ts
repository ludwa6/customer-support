import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET
});

// Will be populated with a database ID found at runtime
let DATABASE_ID: string;

async function getDatabaseSchema() {
  try {
    console.log(`Retrieving database schema for ID: ${DATABASE_ID}`);
    const databaseInfo = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });
    
    console.log("Database title:", databaseInfo.title);
    console.log("Database properties:", JSON.stringify(databaseInfo.properties, null, 2));
    
    return databaseInfo;
  } catch (error) {
    console.error("Error retrieving database schema:", error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Check if we have the required environment variable
    if (!process.env.NOTION_INTEGRATION_SECRET) {
      console.error("Missing required environment variable: NOTION_INTEGRATION_SECRET");
      console.error("Please set this variable and try again.");
      process.exit(1);
    }
    
    // Search for databases
    console.log("Searching for databases the integration can access...");
    const searchResponse = await notion.search({
      filter: {
        property: "object",
        value: "database"
      }
    });
    
    if (searchResponse.results.length === 0) {
      console.error("No databases found. Make sure your integration has access to at least one database.");
      process.exit(1);
    }
    
    // List all found databases
    console.log(`Found ${searchResponse.results.length} databases:`);
    for (let i = 0; i < searchResponse.results.length; i++) {
      const db = searchResponse.results[i];
      console.log(`[${i + 1}] Database ID: ${db.id}`);
      
      try {
        // Try to get the database title if available
        const dbInfo = await notion.databases.retrieve({ database_id: db.id });
        let title = "Untitled";
        if (dbInfo.title && dbInfo.title.length > 0) {
          title = dbInfo.title.map((t: any) => t.plain_text).join("");
        }
        console.log(`    Title: ${title}`);
      } catch (error) {
        console.log("    Could not retrieve database details");
      }
    }
    
    // Use the first database for inspection
    DATABASE_ID = searchResponse.results[0].id;
    console.log(`\nInspecting database with ID: ${DATABASE_ID}\n`);
    
    await getDatabaseSchema();
    
    console.log("✅ Database schema inspection completed!");
  } catch (error) {
    console.error("❌ Inspection failed:", error);
    process.exit(1);
  }
}

// Run the main function
main();