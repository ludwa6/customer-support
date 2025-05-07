import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, findDatabaseByTitle } from "./notion";
import * as fs from "fs";

// Load configuration if available
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
    
    // Load the configuration file
    const configData = fs.readFileSync(configPath, 'utf8');
    databaseConfig = JSON.parse(configData);
    
    console.log('Loaded tickets database configuration:');
    console.log(`- Support Tickets database: ${databaseConfig.databases.supportTickets}`);
  } catch (error) {
    console.error(`Error loading Notion configuration file: ${error.message}`);
  }
}

/**
 * Get the Support Tickets database ID
 */
export async function getSupportTicketsDatabase() {
  try {
    console.log("Looking for Support Tickets database...");
    
    // First, try to use the database ID from configuration
    if (databaseConfig.databases.supportTickets) {
      const configuredDatabaseId = databaseConfig.databases.supportTickets;
      try {
        // Check if we can access this database
        console.log(`Attempting to use configured database ID: ${configuredDatabaseId}`);
        await notion.databases.retrieve({
          database_id: configuredDatabaseId
        });
        console.log(`Successfully connected to Support Tickets database: ${configuredDatabaseId}`);
        return configuredDatabaseId;
      } catch (configError) {
        console.error(`Error accessing configured database ID: ${configError.message}`);
        console.log("Falling back to searching for database by title...");
      }
    } else {
      console.log("No Support Tickets database ID found in configuration");
    }
    
    // If that fails, continue with the original logic
    try {
      console.log("Searching for Support Tickets database by title...");
      const ticketsDb = await findDatabaseByTitle("Support Tickets");
      
      if (ticketsDb) {
        console.log(`Found existing Support Tickets database with ID: ${ticketsDb.id}`);
        return ticketsDb.id;
      } else {
        console.log("No Support Tickets database found by title");
      }
    } catch (e) {
      console.error("Error searching for Support Tickets database by title:", e);
    }
    
    // Try to find any accessible database as a last resort
    console.log("No Support Tickets database found by name. Attempting to find any accessible database...");
    
    try {
      // Search for any database the integration can access
      const searchResponse = await notion.search({
        query: "Tickets", // Optional: try searching for databases with "Tickets" in the name
        filter: {
          property: "object",
          value: "database"
        }
      });
      
      if (searchResponse.results.length > 0) {
        // Use the first database found
        const firstDb = searchResponse.results[0];
        console.log(`Using first available database for tickets: ${firstDb.id}`);
        
        // Save this database ID in configuration for future use
        if (process.env.NOTION_CONFIG_PATH) {
          try {
            const configData = fs.readFileSync(process.env.NOTION_CONFIG_PATH, 'utf8');
            const config = JSON.parse(configData);
            
            // Store the found database ID
            config.databases = config.databases || {};
            config.databases.supportTickets = firstDb.id;
            
            fs.writeFileSync(process.env.NOTION_CONFIG_PATH, JSON.stringify(config, null, 2));
            console.log(`Saved database ID ${firstDb.id} to configuration file`);
          } catch (error) {
            console.error("Error updating configuration file:", error);
          }
        }
        
        return firstDb.id;
      }
      
      // If still no database found, throw error
      console.error("ERROR: Could not find any accessible database");
      console.error("Please ensure a database exists in your Notion workspace");
      console.error("And make sure your Notion integration has access to it!");
      
      throw new Error("Could not find any accessible database for tickets");
    } catch (searchError) {
      console.error("Error searching for available databases:", searchError);
      throw new Error("Could not find Support Tickets database and search failed");
    }
  } catch (error) {
    console.error("Error getting Support Tickets database:", error);
    throw error;
  }
}

/**
 * Get all tickets from the Notion database
 */
export async function getTickets() {
  try {
    const databaseId = await getSupportTicketsDatabase();
    
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: "submission_date",
          direction: "descending"
        }
      ]
    });
    
    return response.results.map((page: any) => transformTicketFromNotion(page));
  } catch (error) {
    console.error("Error fetching tickets from Notion:", error);
    return [];
  }
}

/**
 * Get a ticket by ID from the Notion database
 */
export async function getTicketById(ticketId: string) {
  try {
    const response = await notion.pages.retrieve({
      page_id: ticketId
    });
    
    return transformTicketFromNotion(response);
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId} from Notion:`, error);
    return null;
  }
}

/**
 * Add a support ticket to Notion database
 */
export async function addTicket(ticket: any) {
  try {
    console.log("Adding ticket to Notion:", JSON.stringify(ticket, null, 2));
    
    // Debug NOTION_PAGE_ID
    console.log("NOTION_PAGE_ID:", NOTION_PAGE_ID);
    
    // Get the database ID
    const databaseId = await getSupportTicketsDatabase();
    
    if (!databaseId) {
      throw new Error("Could not find or create Support Tickets database");
    }
    
    // Log the database ID we're using
    console.log(`Adding ticket to Notion database with ID: ${databaseId}`);
    
    // Create the page properties - matched to the exact schema of the database
    // First, retrieve the database to get the actual schema
    try {
      console.log("Retrieving database schema before creating page...");
      const dbSchema = await notion.databases.retrieve({
        database_id: databaseId
      });
      
      // Log the available properties for debugging
      console.log("Available properties in database:", Object.keys(dbSchema.properties));
    } catch (error) {
      console.error("Error retrieving database schema:", error);
    }
    
    // Create properties based on the schema we defined when creating the database
    const properties: any = {
      // The title property must use the correct name (likely 'full_name')
      full_name: {
        title: [
          {
            text: {
              content: ticket.name
            }
          }
        ]
      }
    };
    
    // Add email if it exists in the schema
    properties.email = {
      email: ticket.email
    };
    
    // Add description as rich text if it exists in the schema
    properties.description = {
      rich_text: [
        {
          text: {
            content: ticket.description.substring(0, 2000) // Using full available space
          }
        }
      ]
    };
    
    // Add status field if it exists in the schema
    properties.status = {
      select: {
        name: ticket.status || 'new'
      }
    };
    
    // Add submission_date field with the current date (matching the actual database schema)
    properties.submission_date = {
      date: {
        start: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : new Date().toISOString()
      }
    };
    
    // Create array of child blocks - omitting Subject and Category as requested
    const children = [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Support Ticket Details" } }]
        }
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `Name: ${ticket.name}` } }]
        }
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `Email: ${ticket.email}` } }]
        }
      },
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: "Description" } }]
        }
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: ticket.description } }]
        }
      }
    ];
    
    // Prepare the full page data
    const pageData = {
      parent: {
        database_id: databaseId
      },
      properties: properties,
      children: children
    };
    
    console.log("Creating page in Notion...");
    
    // Create the page in Notion
    const response = await notion.pages.create(pageData);
    console.log("Response from Notion:", response.id);
    
    // Return the transformed ticket for consistent API responses
    return transformTicketFromNotion(response);
  } catch (error) {
    console.error("Error adding ticket to Notion:", error);
    throw error;
  }
}

/**
 * Update a ticket's status in the Notion database
 */
export async function updateTicketStatus(ticketId: string, status: string) {
  try {
    const response = await notion.pages.update({
      page_id: ticketId,
      properties: {
        status: {
          select: {
            name: status
          }
        }
      }
    });
    
    return transformTicketFromNotion(response);
  } catch (error) {
    console.error(`Error updating ticket ${ticketId} status in Notion:`, error);
    throw error;
  }
}

/**
 * Helper function to transform a Notion page to a ticket object
 */
function transformTicketFromNotion(page: any) {
  const properties = page.properties;
  
  return {
    id: page.id,
    name: properties.full_name?.title?.[0]?.plain_text || "",
    email: properties.email?.email || "",
    subject: "Support Request", // Default subject as requested
    category: "General", // Default since we don't have this field in Notion
    description: properties.description?.rich_text?.[0]?.plain_text || "",
    status: properties.status?.select?.name || "new",
    createdAt: properties.submission_date?.date?.start || properties.created_at?.date?.start || page.created_time
  };
}