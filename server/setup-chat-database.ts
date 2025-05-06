import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle } from "./services/notion";

async function setupChatDatabase() {
  try {
    console.log("Setting up Chat Conversations database in Notion...");
    
    // Create the Conversations database if it doesn't exist
    const conversationsDb = await createDatabaseIfNotExists("Chat Conversations", {
      // Title property (required for all databases)
      SessionId: {
        title: {}
      },
      // Message properties
      UserMessage: {
        rich_text: {}
      },
      AiResponse: {
        rich_text: {}
      },
      CreatedAt: {
        date: {}
      }
    });
    
    console.log("Chat Conversations database created or already exists with ID:", conversationsDb.id);
    
    return conversationsDb;
  } catch (error) {
    console.error("Error setting up Chat Conversations database:", error);
    throw error;
  }
}

// Run the setup
setupChatDatabase()
  .then(() => {
    console.log("Chat database setup complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Chat database setup failed:", error);
    process.exit(1);
  });