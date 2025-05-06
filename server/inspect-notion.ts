import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET
});

// Use the provided database ID directly
const DATABASE_ID = "1ebc922b6d5b80729c9dd0d4f7ccf567";

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

    await getDatabaseSchema();
    
    console.log("✅ Database schema inspection completed!");
  } catch (error) {
    console.error("❌ Inspection failed:", error);
    process.exit(1);
  }
}

// Run the main function
main();