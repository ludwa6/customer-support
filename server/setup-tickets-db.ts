import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists } from "./services/notion";

// Check if the required environment variables are set
if (!process.env.NOTION_INTEGRATION_SECRET || !NOTION_PAGE_ID) {
  console.error("Missing required environment variables: NOTION_INTEGRATION_SECRET and/or NOTION_PAGE_URL");
  console.error("Please set these variables and try again.");
  process.exit(1);
}

async function setupTicketsDatabase() {
  try {
    console.log(`Setting up Support Tickets database in Notion page ID: ${NOTION_PAGE_ID}`);
    
    // Create Support Tickets database if it doesn't exist
    const ticketsDb = await createDatabaseIfNotExists("Support Tickets", {
      // Name/title property - required for all Notion databases
      full_name: {
        title: {}
      },
      email: {
        email: {}
      },
      subject: {
        rich_text: {}
      },
      category: {
        select: {
          options: [
            { name: "General", color: "gray" },
            { name: "Account", color: "blue" },
            { name: "Billing", color: "green" },
            { name: "Technical", color: "red" },
            { name: "Feature Request", color: "purple" },
            { name: "Other", color: "orange" }
          ]
        }
      },
      description: {
        rich_text: {}
      },
      status: {
        select: {
          options: [
            { name: "new", color: "blue" },
            { name: "in-progress", color: "yellow" },
            { name: "resolved", color: "green" },
            { name: "closed", color: "gray" }
          ]
        }
      },
      created_at: {
        date: {}
      }
    });
    
    console.log("✅ Support Tickets database setup completed successfully!");
    console.log("Database ID:", ticketsDb.id);
    return ticketsDb;
  } catch (error) {
    console.error("❌ Error setting up Support Tickets database:", error);
    throw error;
  }
}

// Run the setup
setupTicketsDatabase()
  .then(() => {
    console.log("Support Tickets database setup complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Setup failed:", error);
    process.exit(1);
  });