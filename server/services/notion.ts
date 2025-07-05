import { Client } from "@notionhq/client";
import * as fs from "fs";
import { extractPageIdFromUrl } from "./utils";
import { validateDatabaseSchema, printValidationResult } from "./notion-validation";

/**
 * Replace SerenityFlow branding with Quinta Vale da Lama branding in text
 */
function replaceSerenityFlowBranding(text: string): string {
  if (!text) return text;
  return text.replace(/SerenityFlow/g, 'Quinta Vale da Lama');
}

// Load database configuration from file if specified
let databaseConfig = {
  databases: {
    categories: null,
    articles: null,
    faqs: null,
    supportTickets: null
  }
};

// Check if a configuration file exists
const configPath = './notion-config.json';
if (fs.existsSync(configPath)) {
  try {
    console.log(`Loading Notion database configuration from ${configPath}`);
    
    // Load the configuration file
    const configData = fs.readFileSync(configPath, 'utf8');
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
          description: `${option.name} category for Quinta Vale da Lama`,
          icon: option.color || "default",
        }));
      }
    }

    // Last resort - return default categories if nothing can be found
    console.log("No categories database found, using fallback categories");
    return [
      { id: "XODu", name: "Getting Started", description: "Getting Started category for Quinta Vale da Lama", icon: "blue" },
      { id: "QbD8", name: "Account Settings", description: "Account Settings category for Quinta Vale da Lama", icon: "green" },
      { id: "LcVm", name: "Workflows & Automations", description: "Workflows & Automations category for Quinta Vale da Lama", icon: "purple" },
      { id: "PqXj", name: "Integrations", description: "Integrations category for Quinta Vale da Lama", icon: "orange" }
    ];
  } catch (error) {
    console.error("Error fetching categories from Notion:", error);
    // Return default categories as fallback
    return [
      { id: "XODu", name: "Getting Started", description: "Getting Started category for Quinta Vale da Lama", icon: "blue" },
      { id: "QbD8", name: "Account Settings", description: "Account Settings category for Quinta Vale da Lama", icon: "green" },
      { id: "LcVm", name: "Workflows & Automations", description: "Workflows & Automations category for Quinta Vale da Lama", icon: "purple" },
      { id: "PqXj", name: "Integrations", description: "Integrations category for Quinta Vale da Lama", icon: "orange" }
    ];
  }
}

/**
 * Get all articles or filter by category (DEPRECATED - Use getFAQs instead)
 * This function is kept for backward compatibility and redirects to FAQs
 */
export async function getArticles(categoryId?: string, isPopular?: boolean) {
  console.log('DEPRECATED: getArticles is deprecated, using getFAQs instead');
  try {
    // Get FAQs using the getFAQs function
    const faqs = await getFAQs(categoryId);
    
    // Transform FAQs to match the Article format for backwards compatibility
    return faqs.map(faq => ({
      id: faq.id,
      title: faq.question,
      content: faq.answer,
      categoryId: faq.categoryId,
      categoryName: faq.categoryName,
      isPopular: isPopular || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error transforming FAQs to Articles:', error);
    return []; // Return empty array instead of throwing to prevent app crashes
  }
}

/**
 * Get a single article by ID (DEPRECATED - Use getFAQById instead)
 * This function is kept for backward compatibility and redirects to FAQs
 */
export async function getArticleById(articleId: string) {
  console.log('DEPRECATED: getArticleById is deprecated, using getFAQById instead');
  try {
    // Search all FAQs to find matching id
    const allFaqs = await getFAQs();
    const faq = allFaqs.find(faq => faq.id === articleId);
    
    if (!faq) {
      return null;
    }
    
    // Transform FAQ to match Article format
    return {
      id: faq.id,
      title: faq.question,
      content: faq.answer,
      categoryId: faq.categoryId,
      categoryName: faq.categoryName,
      isPopular: false,
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error transforming FAQ to Article ${articleId}:`, error);
    return null; // Return null instead of throwing to prevent app crashes
  }
}

/**
 * Get all FAQs or filter by category
 */
export async function getFAQs(categoryId?: string) {
  try {
    // We'll search for any database that has FAQ in its name
    let faqsDb = null;
    
    // Get all databases and look for any with "FAQ" in the name
    try {
      const databases = await getNotionDatabases();
      
      for (const db of databases) {
        // Check if database title contains "FAQ" (case insensitive)
        if (db.title && Array.isArray(db.title) && db.title.length > 0) {
          const dbTitle = db.title[0]?.plain_text || "";
          if (dbTitle.toLowerCase().includes("faq")) {
            console.log(`Found database with FAQ in name: ${dbTitle}`);
            faqsDb = db;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error searching for FAQ databases:", error);
    }
    
    // Determine which database to use
    let DATABASE_ID;
    
    if (faqsDb) {
      console.log("Using FAQs database found by name");
      DATABASE_ID = faqsDb.id;
    } else if (databaseConfig.databases.faqs) {
      console.log("Using FAQs database from config");
      DATABASE_ID = databaseConfig.databases.faqs;
    } else {
      console.log("No FAQs database found. Attempting to search for any database...");
      
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
          console.log(`Using first available database for FAQs: ${firstDb.id}`);
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
    
    // Validate the database schema if we have a DATABASE_ID
    if (DATABASE_ID) {
      try {
        console.log("Validating FAQs database schema...");
        
        // Import the validation function if we haven't already
        // This is imported at the top of the file in the real implementation
        const { validateDatabaseSchema, printValidationResult } = await import("./notion-validation");
        
        const validationResult = await validateDatabaseSchema(
          notion,
          DATABASE_ID,
          "faqs"
        );
        
        if (validationResult.isValid) {
          console.log("✅ FAQs database schema is valid");
        } else {
          console.warn("⚠️ FAQs database schema has issues:");
          printValidationResult(validationResult, "faqs");
          
          // Check for critical missing properties
          const criticalProps = ["Question", "Answer"];
          const missingCritical = criticalProps.filter(prop => 
            validationResult.properties.missing.includes(prop)
          );
          
          if (missingCritical.length > 0) {
            console.error(`Critical properties missing: ${missingCritical.join(", ")}`);
            console.error("Will attempt to continue but data may be incomplete.");
          }
        }
      } catch (validationError: any) {
        console.error("Error validating FAQs database schema:", validationError.message);
        // Continue despite validation error
      }
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

    // Fetch the database to get its actual schema
    let dbSchema;
    try {
      dbSchema = await notion.databases.retrieve({
        database_id: DATABASE_ID
      });
      
      // Log the available properties for debugging
      const availableProperties = Object.keys(dbSchema.properties);
      console.log("Available properties in FAQs database:", availableProperties.join(", "));
    } catch (error) {
      console.error("Error retrieving database schema:", error);
      // Continue without schema info
    }

    const response = await notion.databases.query(queryOptions);
    
    return response.results.map((page: any) => {
      const properties = page.properties;
      
      // Determine which property is the title (question) property
      let questionProperty = "question";
      let answerProperty = "answer";
      let categoryProperty = "category";
      
      // If we have the schema, find the title property for questions
      if (dbSchema && dbSchema.properties) {
        for (const [propName, propDetails] of Object.entries(dbSchema.properties)) {
          if ((propDetails as any).type === "title") {
            questionProperty = propName.toLowerCase();
            console.log(`Found title property for questions: ${propName}`);
            break;
          }
        }
        
        // Look for likely answer property
        for (const propName of Object.keys(dbSchema.properties)) {
          if (propName.toLowerCase().includes("answer") || 
              propName.toLowerCase().includes("content") ||
              propName.toLowerCase().includes("description")) {
            answerProperty = propName;
            console.log(`Found likely answer property: ${propName}`);
            break;
          }
        }
        
        // Look for likely category property
        for (const propName of Object.keys(dbSchema.properties)) {
          if (propName.toLowerCase().includes("category") || 
              propName.toLowerCase().includes("type") ||
              propName.toLowerCase().includes("section")) {
            categoryProperty = propName;
            console.log(`Found likely category property: ${propName}`);
            break;
          }
        }
      }
      
      const titleProp = properties[questionProperty] || 
                       properties["Question"] || 
                       properties["Title"] || 
                       Object.values(properties).find((p: any) => p.type === "title");
                       
      const questionText = titleProp?.title?.[0]?.plain_text || "Untitled Question";
      
      // Try to find answer in various possible properties
      const answerProp = properties[answerProperty] || 
                        properties["Answer"] || 
                        properties["Content"] || 
                        properties["Description"];
                        
      const answerText = answerProp?.rich_text?.[0]?.plain_text || "";
      
      // Try to find category in various possible properties
      const catProp = properties[categoryProperty] || 
                      properties["Category"] || 
                      properties["Type"] || 
                      properties["Section"];
                      
      return {
        id: page.id,
        question: replaceSerenityFlowBranding(questionText),
        answer: replaceSerenityFlowBranding(answerText),
        categoryId: catProp?.select?.id || "",
        categoryName: catProp?.select?.name || "Uncategorized"
      };
    });
  } catch (error) {
    console.error("Error fetching FAQs from Notion:", error);
    return []; // Return empty array instead of throwing to prevent app crashes
  }
}
