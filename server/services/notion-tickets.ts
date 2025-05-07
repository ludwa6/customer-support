import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, findDatabaseByTitle, createDatabaseIfNotExists } from "./notion";
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
    
    // If database doesn't exist, create it
    if (NOTION_PAGE_ID) {
      console.log(`Creating new Support Tickets database in page: ${NOTION_PAGE_ID}`);
      
      const newDb = await createDatabaseIfNotExists("Support Tickets", {
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
      
      console.log(`Created new Support Tickets database with ID: ${newDb.id}`);
      return newDb.id;
    }
    
    throw new Error("Could not find or create Support Tickets database");
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
          property: "created_at",
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
    const properties: any = {
      full_name: {
        title: [
          {
            text: {
              content: ticket.name
            }
          }
        ]
      },
      email: {
        email: ticket.email
      },
      description: {
        rich_text: [
          {
            text: {
              // Just use the description directly
              content: ticket.description.substring(0, 2000) // Using full available space
            }
          }
        ]
      },
      status: {
        select: {
          name: ticket.status || 'new'
        }
      },
      submission_date: {
        date: {
          start: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : new Date().toISOString()
        }
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
    createdAt: properties.submission_date?.date?.start || page.created_time
  };
}