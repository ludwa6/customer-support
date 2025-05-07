import { Client } from "@notionhq/client";
import * as fs from "fs";
import { extractPageIdFromUrl } from "./utils";

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
    
    // Resolve relative path if needed
    const resolvedPath = configPath.startsWith('./')
      ? require('path').resolve(process.cwd(), configPath.slice(2))
      : configPath;
    
    // Load the configuration file
    const configData = fs.readFileSync(resolvedPath, 'utf8');
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
    console.error('Using default configuration instead');
  }
}
// Initialize Notion client
export const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET
});

// Get the Notion page ID from the environment variable
export let NOTION_PAGE_ID: string | null = null;

try {
  if (process.env.NOTION_PAGE_URL) {
    console.log("Extracting page ID from NOTION_PAGE_URL:", process.env.NOTION_PAGE_URL);
    NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
    console.log("Successfully extracted NOTION_PAGE_ID:", NOTION_PAGE_ID);
  } else {
    console.error("NOTION_PAGE_URL environment variable is not set");
  }
} catch (error) {
  console.error("Error extracting page ID from NOTION_PAGE_URL:", error);
}

// If we still don't have a page ID, try to get it from notion-config.json
if (!NOTION_PAGE_ID && databaseConfig.databases.supportTickets) {
  console.log("No page ID extracted from URL, but we have a supportTickets database ID in config");
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
    // Try multiple sources for the categories database ID
    // 1. First check config file
    let DATABASE_ID = null;
    if (databaseConfig.databases.categories) {
      console.log("Using Categories database from config");
      DATABASE_ID = databaseConfig.databases.categories;
    } 
    // 2. Try to find by name
    else {
      const categoriesDb = await findDatabaseByTitle("Categories");
      if (categoriesDb) {
        console.log("Using Categories database found by name");
        DATABASE_ID = categoriesDb.id;
      }
    }
    
    // 3. Try FAQs database if no categories db found
    if (!DATABASE_ID) {
      if (databaseConfig.databases.faqs) {
        console.log("Using FAQs database from config");
        DATABASE_ID = databaseConfig.databases.faqs;
      } else {
        const faqsDb = await findDatabaseByTitle("FAQs");
        if (faqsDb) {
          console.log("Using FAQs database for categories");
          DATABASE_ID = faqsDb.id;
        }
      }
    }

    // 4. Use any available database as a last resort (Support Tickets has categories)
    if (!DATABASE_ID && databaseConfig.databases.supportTickets) {
      console.log("Using Support Tickets database for categories");
      DATABASE_ID = databaseConfig.databases.supportTickets;
    }
    
    // 5. If still no database found, try to search for any databases
    if (!DATABASE_ID) {
      console.log("No Categories database found. Attempting to search for any database...");
      
      try {
        // Search for any database the integration can access
        const searchResponse = await notion.search({
          filter: {
            property: "object",
            value: "database"
          },
          page_size: 1
        });
        
        if (searchResponse.results.length > 0) {
          const firstDb = searchResponse.results[0];
          console.log(`Using first available database for categories: ${firstDb.id}`);
          DATABASE_ID = firstDb.id;
        } else {
          console.error("No databases found that the integration can access");
          return []; // Return empty array if no database found
        }
      } catch (error) {
        console.error("Error searching for databases:", error);
        return []; // Return empty array on error
      }
    }
    
    // If we found a database ID, use it
    if (DATABASE_ID) {
      // Retrieve the database to get category options
      const dbInfo = await notion.databases.retrieve({
        database_id: DATABASE_ID
      });

      // Extract category options from the database properties
      const properties = dbInfo.properties;
      
      // Look for a property that might be categories
      let categoryOptions = [];
      
      // First look for a "category" property
      if (properties.category && properties.category.type === 'select' && properties.category.select.options) {
        categoryOptions = properties.category.select.options;
      } 
      // Then look for "Category" property
      else if (properties.Category && properties.Category.type === 'select' && properties.Category.select.options) {
        categoryOptions = properties.Category.select.options;
      }
      // Look for any select-type property as fallback
      else {
        for (const [key, prop] of Object.entries(properties)) {
          if (prop.type === 'select' && prop.select && prop.select.options && prop.select.options.length > 0) {
            categoryOptions = prop.select.options;
            console.log(`Using ${key} property for categories`);
            break;
          }
        }
      }
      
      if (categoryOptions.length > 0) {
        return categoryOptions.map(option => ({
          id: option.id,
          name: option.name,
          description: `${option.name} category for SerenityFlow`,
          icon: option.color || "default",
        }));
      }
    }

    // Last resort - return default categories if nothing can be found
    console.log("No categories database found, using fallback categories");
    return [
      { id: "XODu", name: "Getting Started", description: "Getting Started category for SerenityFlow", icon: "blue" },
      { id: "QbD8", name: "Account Settings", description: "Account Settings category for SerenityFlow", icon: "green" },
      { id: "LcVm", name: "Workflows & Automations", description: "Workflows & Automations category for SerenityFlow", icon: "purple" },
      { id: "PqXj", name: "Integrations", description: "Integrations category for SerenityFlow", icon: "orange" }
    ];
  } catch (error) {
    console.error("Error fetching categories from Notion:", error);
    // Return default categories as fallback
    return [
      { id: "XODu", name: "Getting Started", description: "Getting Started category for SerenityFlow", icon: "blue" },
      { id: "QbD8", name: "Account Settings", description: "Account Settings category for SerenityFlow", icon: "green" },
      { id: "LcVm", name: "Workflows & Automations", description: "Workflows & Automations category for SerenityFlow", icon: "purple" },
      { id: "PqXj", name: "Integrations", description: "Integrations category for SerenityFlow", icon: "orange" }
    ];
  }
}

/**
 * Get all articles or filter by category
 */
export async function getArticles(categoryId?: string, isPopular?: boolean) {
  try {
    // Look for the Articles database first
    const articlesDb = await findDatabaseByTitle("Articles");
    const faqsDb = await findDatabaseByTitle("FAQs");
    
    // Determine which database to use
    let DATABASE_ID;
    let usingArticlesDb = false;
    
    if (articlesDb) {
      console.log("Using Articles database found by name");
      DATABASE_ID = articlesDb.id;
      usingArticlesDb = true;
    } else if (databaseConfig.databases.articles) {
      console.log("Using Articles database from config");
      DATABASE_ID = databaseConfig.databases.articles;
      usingArticlesDb = true;
    } else if (faqsDb) {
      console.log("Using FAQs database as fallback for articles");
      DATABASE_ID = faqsDb.id;
      usingArticlesDb = false;
    } else if (databaseConfig.databases.faqs) {
      console.log("Using FAQs database from config as fallback for articles");
      DATABASE_ID = databaseConfig.databases.faqs;
      usingArticlesDb = false;
    } else {
      console.log("No Articles or FAQs database found. Attempting to search for any database...");
      
      try {
        // Search for any database the integration can access
        const searchResponse = await notion.search({
          filter: {
            property: "object",
            value: "database"
          },
          page_size: 1
        });
        
        if (searchResponse.results.length > 0) {
          const firstDb = searchResponse.results[0];
          console.log(`Using first available database for articles: ${firstDb.id}`);
          DATABASE_ID = firstDb.id;
          usingArticlesDb = false;
        } else {
          console.error("No databases found that the integration can access");
          return []; // Return empty array if no database found
        }
      } catch (error) {
        console.error("Error searching for databases:", error);
        return []; // Return empty array on error
      }
    }
    
    // Use properly formatted query options
    const queryOptions: any = {
      database_id: DATABASE_ID,
    };
    
    // Add filter if categoryId is provided
    if (categoryId) {
      // For Articles database
      if (usingArticlesDb) {
        queryOptions.filter = {
          property: "Category",
          relation: {
            contains: categoryId
          }
        };
      } else {
        // For FAQ database
        queryOptions.filter = {
          property: "category",
          select: {
            equals: categoryId
          }
        };
      }
    }
    
    // Sort by appropriate field based on database
    queryOptions.sorts = [
      {
        property: usingArticlesDb ? "Title" : "category",
        direction: "ascending"
      }
    ];

    console.log(`Querying Notion database (${DATABASE_ID}) for articles with options:`, JSON.stringify(queryOptions));
    const response = await notion.databases.query(queryOptions);
    console.log(`Got ${response.results.length} results from Notion`);
    
    // Transform the results based on which database we're using
    return response.results.map((page: any) => {
      const properties = page.properties;
      
      if (usingArticlesDb) {
        // Format for Articles database
        return {
          id: page.id,
          title: properties.Title?.title?.[0]?.plain_text || "Untitled Article",
          content: properties.Content?.rich_text?.[0]?.plain_text || "",
          categoryId: properties.Category?.relation?.[0]?.id || "",
          categoryName: properties.CategoryName?.select?.name || "Uncategorized",
          isPopular: properties.IsPopular?.checkbox || false,
          createdAt: page.created_time,
          updatedAt: page.last_edited_time
        };
      } else {
        // Format for FAQ database
        return {
          id: page.id,
          title: properties.question?.title?.[0]?.plain_text || "Untitled Question",
          content: properties.answer?.rich_text?.[0]?.plain_text || "",
          categoryId: properties.category?.select?.id || "",
          categoryName: properties.category?.select?.name || "Uncategorized",
          isPopular: false,
          createdAt: page.created_time,
          updatedAt: page.last_edited_time
        };
      }
    });
  } catch (error) {
    console.error("Error fetching articles from Notion:", error);
    return []; // Return empty array instead of throwing to prevent app crashes
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
    
    const properties = response.properties as any;
    
    return {
      id: response.id,
      title: properties.question?.title?.[0]?.plain_text || "Untitled Question",
      content: properties.answer?.rich_text?.[0]?.plain_text || "",
      categoryId: properties.category?.select?.id || "",
      categoryName: properties.category?.select?.name || "Uncategorized",
      isPopular: false,
      createdAt: (response as any).created_time,
      updatedAt: (response as any).last_edited_time
    };
  } catch (error) {
    console.error(`Error fetching article ${articleId} from Notion:`, error);
    return null; // Return null instead of throwing to prevent app crashes
  }
}

/**
 * Get all FAQs or filter by category
 */
export async function getFAQs(categoryId?: string) {
  try {
    // First look for a FAQs database by name
    const faqsDb = await findDatabaseByTitle("FAQs");
    
    // Determine which database to use
    let DATABASE_ID;
    
    if (faqsDb) {
      console.log("Using FAQs database found by name");
      DATABASE_ID = faqsDb.id;
    } else if (databaseConfig.databases.faqs) {
      console.log("Using FAQs database from config");
      DATABASE_ID = databaseConfig.databases.faqs;
    } else {
      console.log("Using hardcoded FAQ database ID");
      DATABASE_ID = "1ebc922b6d5b80729c9dd0d4f7ccf567";
    }
    
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
