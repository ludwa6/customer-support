import { notion, NOTION_PAGE_ID } from "./services/notion";

/**
 * The chat database is no longer required.
 * 
 * We now use a different approach for storing chat conversations. Instead of creating a database,
 * we directly create child pages under the main Notion page for each conversation.
 * 
 * This approach is more compatible with Notion's API constraints which don't allow creating
 * databases under other databases.
 * 
 * Each chat conversation is stored as a separate page with:
 * - Title: Contains the session ID and timestamp
 * - Content: Contains the user message and AI response formatted in sections
 * 
 * This script is kept for documentation purposes only and has no actual functionality.
 */

async function checkNotionSetup() {
  try {
    if (!process.env.NOTION_INTEGRATION_SECRET) {
      console.error("❌ NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
      return false;
    }
    
    if (!NOTION_PAGE_ID) {
      console.error("❌ NOTION_PAGE_ID is not valid or not defined. Please check your NOTION_PAGE_URL environment variable.");
      return false;
    }
    
    // Check if we can access the page
    try {
      const page = await notion.pages.retrieve({ page_id: NOTION_PAGE_ID });
      console.log("✅ Successfully connected to Notion page:", NOTION_PAGE_ID);
      return true;
    } catch (error) {
      console.error("❌ Could not access the Notion page. Make sure the integration has access to it:", error);
      return false;
    }
  } catch (error) {
    console.error("Error checking Notion setup:", error);
    return false;
  }
}

// Run the check
checkNotionSetup()
  .then((success) => {
    if (success) {
      console.log("✅ Notion setup is correct and ready for chat conversation tracking!");
    } else {
      console.log("❌ Notion setup has issues. Please check the errors above.");
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("Chat setup check failed:", error);
    process.exit(1);
  });