import { Client } from "@notionhq/client";
import { 
  DatabaseObjectResponse, 
  PageObjectResponse,
  RichTextItemResponse
} from "@notionhq/client/build/src/api-endpoints";
import * as fs from "fs";

// Helper function to extract page ID from URL
function extractPageIdFromUrl(pageUrl: string): string {
  const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  throw Error("Failed to extract page ID from Notion URL");
}

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET
});

// Get the Notion page ID from the environment variable
const NOTION_PAGE_ID = process.env.NOTION_PAGE_URL 
  ? extractPageIdFromUrl(process.env.NOTION_PAGE_URL)
  : null;

/**
 * Find a Notion database with the matching title
 */
async function findDatabaseByTitle(title: string): Promise<DatabaseObjectResponse | null> {
  const databases = await getNotionDatabases();

  for (const db of databases) {
    const titleProp = db.title;
    if (titleProp) {
      let dbTitle = "";
      for (const richText of titleProp) {
        dbTitle += richText.plain_text;
      }
      if (dbTitle.toLowerCase() === title.toLowerCase()) {
        return db;
      }
    }
  }

  return null;
}

/**
 * Lists all child databases contained within the Notion page
 */
async function getNotionDatabases(): Promise<DatabaseObjectResponse[]> {
  if (!NOTION_PAGE_ID) {
    throw new Error("NOTION_PAGE_ID is not set");
  }

  // Array to store the child databases
  const childDatabases: DatabaseObjectResponse[] = [];

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
        if ('type' in block && block.type === "child_database") {
          const databaseId = block.id;

          // Retrieve the database title
          try {
            const databaseInfo = await notion.databases.retrieve({
              database_id: databaseId,
            });

            // Add the database to our list
            childDatabases.push(databaseInfo as DatabaseObjectResponse);
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
 * Find an existing database with matching title but never create new ones
 * 
 * This function has been modified to prevent creation of new databases
 * and instead only look for existing ones
 */
async function createDatabaseIfNotExists(title: string, properties: any): Promise<DatabaseObjectResponse> {
  if (!NOTION_PAGE_ID) {
    throw new Error("NOTION_PAGE_ID is not set");
  }

  // Always try to find an existing database first
  const existingDb = await findDatabaseByTitle(title);
  if (existingDb) {
    console.log(`Database "${title}" already exists with ID: ${existingDb.id}`);
    return existingDb;
  }

  // Instead of creating a new database, throw an error or log a message
  console.log(`⚠️ Not creating "${title}" database to prevent data loss in remixed projects`);
  console.log(`Please run 'node use-existing-db.js' to configure existing databases`);
  
  // Return null or a placeholder object that can be safely used
  return {
    id: "placeholder-id",
    title: [{ type: "text", text: { content: title }, plain_text: title, annotations: {}, href: null }],
    properties: properties,
    parent: { type: "page_id", page_id: NOTION_PAGE_ID },
    url: "",
    created_time: new Date().toISOString(),
    last_edited_time: new Date().toISOString(),
    is_inline: false,
    archived: false,
    object: "database",
  } as unknown as DatabaseObjectResponse;
}

async function setupNotionDatabases() {
  if (!NOTION_PAGE_ID || !process.env.NOTION_INTEGRATION_SECRET) {
    console.error("Missing required environment variables: NOTION_INTEGRATION_SECRET and/or NOTION_PAGE_URL");
    console.error("Please set these variables and try again.");
    process.exit(1);
  }

  console.log(`Setting up Notion databases in page ID: ${NOTION_PAGE_ID}`);

  try {
    // 1. First, let's create the Categories database
    const categoriesDb = await createDatabaseIfNotExists("Categories", {
      Name: {
        title: {}
      },
      Description: {
        rich_text: {}
      },
      Icon: {
        rich_text: {}
      }
    });
    
    // 2. Create Articles database
    const articlesDb = await createDatabaseIfNotExists("Articles", {
      Title: {
        title: {}
      },
      Content: {
        rich_text: {}
      },
      CategoryId: {
        rich_text: {}
      },
      CategoryName: {
        rich_text: {}
      },
      IsPopular: {
        checkbox: {}
      }
    });
    
    // 3. Create FAQs database
    const faqsDb = await createDatabaseIfNotExists("FAQs", {
      Question: {
        title: {}
      },
      Answer: {
        rich_text: {}
      },
      CategoryId: {
        rich_text: {}
      },
      CategoryName: {
        rich_text: {}
      }
    });

    console.log("✅ Notion databases setup completed successfully!");
    return { categoriesDb, articlesDb, faqsDb };
  } catch (error) {
    console.error("❌ Error setting up Notion databases:", error);
    throw error;
  }
}

interface CategoryInfo {
  id: string;
  name: string;
}

async function seedCategories(): Promise<CategoryInfo[]> {
  console.log("⚠️ Skipping category seeding to prevent duplicate data in remixed projects");
  console.log("Please use existing categories in your Notion database");
  
  // Return an empty array instead of creating new categories
  return [];
}

async function seedArticles(categories: CategoryInfo[]) {
  console.log("⚠️ Skipping article seeding to prevent duplicate data in remixed projects");
  console.log("Please use existing articles in your Notion database");
  
  // No need to do anything in this function anymore
  return;
}

async function seedFAQs(categories: CategoryInfo[]) {
  console.log("⚠️ Skipping FAQ seeding to prevent duplicate data in remixed projects");
  console.log("Please use existing FAQs in your Notion database");
  
  // No need to do anything in this function anymore
  return;
}

// Main function to run the setup and seeding
// Check if a marker file exists to prevent setup
function shouldPreventSetup() {
  try {
    return fs.existsSync('.prevent-notion-setup');
  } catch (error) {
    console.error("Error checking for prevent setup marker:", error);
    return false;
  }
}

async function main() {
  try {
    // Check if we have the required environment variables
    if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
      console.error("Missing required environment variables: NOTION_INTEGRATION_SECRET and/or NOTION_PAGE_URL");
      console.error("Please set these variables and try again.");
      process.exit(1);
    }

    // Check if we should prevent setup because existing databases were found
    if (shouldPreventSetup()) {
      console.log("⚠️ Existing Notion databases detected!");
      console.log("To prevent data loss, this script will not create new databases.");
      console.log("To use existing databases, run: node use-existing-db.js");
      console.log("If you really want to create new databases, delete the .prevent-notion-setup file and run this script again.");
      process.exit(0);
    }

    // 1. First, create the databases
    await setupNotionDatabases();
    
    // 2. Seed categories
    const categories = await seedCategories();
    
    // 3. Seed articles
    await seedArticles(categories);
    
    // 4. Seed FAQs
    await seedFAQs(categories);
    
    console.log("🎉 Notion setup and seeding completed successfully!");
    console.log("You can now refresh your application to see the content.");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run the main function
main();