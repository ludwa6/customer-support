import { Client } from "@notionhq/client";
import { extractPageIdFromUrl } from "./utils";

// Initialize Notion client
export const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET
});

// Get the Notion page ID from the environment variable
export const NOTION_PAGE_ID = process.env.NOTION_PAGE_URL 
  ? extractPageIdFromUrl(process.env.NOTION_PAGE_URL)
  : null;

/**
 * Helper function to extract the page ID from a Notion URL
 */
export function extractPageIdFromUrl(pageUrl: string): string {
  const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  throw Error("Failed to extract page ID from Notion URL");
}

/**
 * Lists all child databases contained within the Notion page
 */
export async function getNotionDatabases() {
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
 * Find a Notion database with the matching title
 */
export async function findDatabaseByTitle(title: string) {
  const databases = await getNotionDatabases();

  for (const db of databases) {
    if (db.title && Array.isArray(db.title) && db.title.length > 0) {
      const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
      if (dbTitle === title.toLowerCase()) {
        return db;
      }
    }
  }

  return null;
}

/**
 * Create a new database if one with a matching title does not exist
 */
export async function createDatabaseIfNotExists(title: string, properties: any) {
  if (!NOTION_PAGE_ID) {
    throw new Error("NOTION_PAGE_ID is not set");
  }

  const existingDb = await findDatabaseByTitle(title);
  if (existingDb) {
    return existingDb;
  }

  return await notion.databases.create({
    parent: {
      type: "page_id",
      page_id: NOTION_PAGE_ID
    },
    title: [
      {
        type: "text",
        text: {
          content: title
        }
      }
    ],
    properties
  });
}

/**
 * Query a Notion database and transform the results
 */
export async function queryDatabase(databaseId: string, filter = {}, sorts = []) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter,
      sorts
    });

    return response.results;
  } catch (error) {
    console.error("Error querying Notion database:", error);
    throw error;
  }
}

/**
 * Get all categories from the FAQ database
 */
export async function getCategories() {
  try {
    // Using the direct DATABASE_ID since we know it now
    const DATABASE_ID = "1ebc922b6d5b80729c9dd0d4f7ccf567";
    
    // Retrieve the database to get category options
    const dbInfo = await notion.databases.retrieve({
      database_id: DATABASE_ID
    });

    // Extract category options from the database properties
    const categoryProperty = dbInfo.properties.category;
    if (categoryProperty && categoryProperty.type === 'select' && categoryProperty.select.options) {
      return categoryProperty.select.options.map(option => ({
        id: option.id,
        name: option.name,
        description: `${option.name} category for SerenityFlow`,
        icon: option.color || "default",
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching categories from Notion:", error);
    return []; // Return empty array instead of throwing to prevent app crashes
  }
}

/**
 * Get all articles or filter by category
 */
export async function getArticles(categoryId?: string, isPopular?: boolean) {
  try {
    const articlesDb = await findDatabaseByTitle("Articles");
    if (!articlesDb) {
      return [];
    }

    let filter = {};
    
    if (categoryId) {
      filter = {
        property: "CategoryId",
        rich_text: {
          equals: categoryId
        }
      };
    }
    
    if (isPopular !== undefined) {
      filter = {
        ...filter,
        property: "IsPopular",
        checkbox: {
          equals: isPopular
        }
      };
    }

    const results = await queryDatabase(articlesDb.id, filter);
    
    return results.map((page: any) => {
      const properties = page.properties;
      
      return {
        id: page.id,
        title: properties.Title?.title?.[0]?.plain_text || "Untitled Article",
        content: properties.Content?.rich_text?.[0]?.plain_text || "",
        categoryId: properties.CategoryId?.rich_text?.[0]?.plain_text || "",
        categoryName: properties.CategoryName?.rich_text?.[0]?.plain_text || "Uncategorized",
        isPopular: properties.IsPopular?.checkbox || false,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time
      };
    });
  } catch (error) {
    console.error("Error fetching articles from Notion:", error);
    throw error;
  }
}

/**
 * Get a single article by ID
 */
export async function getArticleById(articleId: string) {
  try {
    const response = await notion.pages.retrieve({
      page_id: articleId
    });
    
    const properties = response.properties;
    
    return {
      id: response.id,
      title: properties.Title?.title?.[0]?.plain_text || "Untitled Article",
      content: properties.Content?.rich_text?.[0]?.plain_text || "",
      categoryId: properties.CategoryId?.rich_text?.[0]?.plain_text || "",
      categoryName: properties.CategoryName?.rich_text?.[0]?.plain_text || "Uncategorized",
      isPopular: properties.IsPopular?.checkbox || false,
      createdAt: response.created_time,
      updatedAt: response.last_edited_time
    };
  } catch (error) {
    console.error(`Error fetching article ${articleId} from Notion:`, error);
    throw error;
  }
}

/**
 * Get all FAQs or filter by category
 */
export async function getFAQs(categoryId?: string) {
  try {
    // Using the direct DATABASE_ID since we know it now
    const DATABASE_ID = "1ebc922b6d5b80729c9dd0d4f7ccf567";
    
    // Use properly formatted filter object or no filter
    const queryOptions: any = {
      database_id: DATABASE_ID
    };
    
    if (categoryId) {
      queryOptions.filter = {
        property: "category",
        select: {
          equals: categoryId
        }
      };
    }

    const response = await notion.databases.query(queryOptions);
    
    return response.results.map((page: any) => {
      const properties = page.properties;
      
      return {
        id: page.id,
        question: properties.question?.title?.[0]?.plain_text || "Untitled Question",
        answer: properties.answer?.rich_text?.[0]?.plain_text || "",
        categoryId: properties.category?.select?.id || "",
        categoryName: properties.category?.select?.name || "Uncategorized"
      };
    });
  } catch (error) {
    console.error("Error fetching FAQs from Notion:", error);
    return []; // Return empty array instead of throwing to prevent app crashes
  }
}
