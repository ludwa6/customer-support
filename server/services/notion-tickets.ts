import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, findDatabaseByTitle } from "./notion";
import { validateDatabaseSchema, printValidationResult } from "./notion-validation";
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

// Check if a configuration file exists
const configPath = './notion-config.json';
if (fs.existsSync(configPath)) {
  try {
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
 * Get the Support Tickets database ID and validate its schema
 */
export async function getSupportTicketsDatabase() {
  try {
    console.log("Looking for Support Tickets database...");
    
    // First, try to use the database ID from configuration
    if (databaseConfig.databases.supportTickets) {
      const configuredDatabaseId = databaseConfig.databases.supportTickets as string;
      try {
        // Check if we can access this database
        console.log(`Attempting to use configured database ID: ${configuredDatabaseId}`);
        await notion.databases.retrieve({
          database_id: configuredDatabaseId
        });
        
        // Validate the database schema
        console.log("Validating Support Tickets database schema...");
        const validationResult = await validateDatabaseSchema(
          notion, 
          configuredDatabaseId, 
          "supportTickets"
        );
        
        if (validationResult.isValid) {
          console.log("✅ Support Tickets database schema is valid");
        } else {
          console.warn("⚠️ Support Tickets database schema has issues:");
          printValidationResult(validationResult, "supportTickets");
          
          // Still return the database ID even if there are schema issues
          // The app will try to work with what's available
          console.log("Continuing with the existing database despite schema issues.");
        }
        
        console.log(`Successfully connected to Support Tickets database: ${configuredDatabaseId}`);
        return configuredDatabaseId;
      } catch (configError: any) {
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
        
        // Validate the database schema
        console.log("Validating Support Tickets database schema...");
        const validationResult = await validateDatabaseSchema(
          notion, 
          ticketsDb.id, 
          "supportTickets"
        );
        
        if (validationResult.isValid) {
          console.log("✅ Support Tickets database schema is valid");
        } else {
          console.warn("⚠️ Support Tickets database schema has issues:");
          printValidationResult(validationResult, "supportTickets");
          console.log("Continuing with the existing database despite schema issues.");
        }
        
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
        const localConfigPath = './notion-config.json';
        if (fs.existsSync(localConfigPath)) {
          try {
            const configData = fs.readFileSync(localConfigPath, 'utf8');
            const config = JSON.parse(configData);
            
            // Store the found database ID
            config.databases = config.databases || {};
            config.databases.supportTickets = firstDb.id;
            
            fs.writeFileSync(localConfigPath, JSON.stringify(config, null, 2));
            console.log(`Saved database ID ${firstDb.id} to configuration file`);
          } catch (error) {
            console.error("Error updating configuration file:", error);
          }
        }
        
        // Validate the database schema
        console.log("Validating Support Tickets database schema...");
        try {
          const validationResult = await validateDatabaseSchema(
            notion, 
            firstDb.id, 
            "supportTickets"
          );
          
          if (validationResult.isValid) {
            console.log("✅ Support Tickets database schema is valid");
          } else {
            console.warn("⚠️ Support Tickets database schema has issues:");
            printValidationResult(validationResult, "supportTickets");
            console.log("Continuing with the existing database despite schema issues.");
          }
        } catch (validationError) {
          console.error("Error validating database schema:", validationError);
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
    
    // Validate schema before creating ticket
    try {
      console.log("Validating database schema before creating ticket...");
      const validationResult = await validateDatabaseSchema(
        notion, 
        databaseId, 
        "supportTickets"
      );
      
      if (!validationResult.isValid) {
        console.warn("⚠️ Support Tickets database schema has issues:");
        printValidationResult(validationResult, "supportTickets");
        
        // Continue with available properties, but log a warning
        console.log("Will attempt to create ticket with available properties.");
        
        // Check for critical missing properties
        const criticalProps = ["full_name", "email"];
        const missingCritical = criticalProps.filter(prop => 
          validationResult.properties.missing.includes(prop)
        );
        
        if (missingCritical.length > 0) {
          console.error(`Critical properties missing: ${missingCritical.join(", ")}`);
          console.error("Cannot create ticket without these properties.");
          throw new Error(`Database schema missing critical properties: ${missingCritical.join(", ")}`);
        }
      } else {
        console.log("✅ Support Tickets database schema is valid");
      }
    } catch (validationError: any) {
      console.error("Error validating database schema:", validationError.message);
      // Continue despite validation error, we'll try our best with the ticket creation
    }
    
    // Retrieve the database to get the actual schema
    let dbSchema;
    let availableProperties = [];
    
    try {
      console.log("Retrieving database schema before creating page...");
      dbSchema = await notion.databases.retrieve({
        database_id: databaseId
      });
      
      // Log the available properties for debugging
      availableProperties = Object.keys(dbSchema.properties);
      console.log("Available properties in database:", availableProperties.join(", "));
    } catch (error) {
      console.error("Error retrieving database schema:", error);
      // Continue with default properties even if we couldn't retrieve the schema
    }
    
    // Create properties based on the schema we defined when creating the database
    const properties: any = {};
    
    // The title property must use the correct name (usually 'full_name' or 'name' or 'title')
    // Detect the title property from the schema
    let titlePropertyName = "full_name"; // Default
    
    if (dbSchema && dbSchema.properties) {
      // Look for a title property
      for (const [propName, propDetails] of Object.entries(dbSchema.properties)) {
        if ((propDetails as any).type === "title") {
          titlePropertyName = propName;
          console.log(`Found title property: ${titlePropertyName}`);
          break;
        }
      }
    }
    
    // Set the title property
    properties[titlePropertyName] = {
      title: [
        {
          text: {
            content: ticket.name
          }
        }
      ]
    };
    
    // Add email if it exists in the schema
    if (!availableProperties.length || availableProperties.includes("email")) {
      properties.email = {
        email: ticket.email
      };
    }
    
    // Add description as rich text if it exists in the schema
    if (!availableProperties.length || availableProperties.includes("description")) {
      properties.description = {
        rich_text: [
          {
            text: {
              content: ticket.description.substring(0, 2000) // Using full available space
            }
          }
        ]
      };
    }
    
    // Add status field if it exists in the schema
    if (!availableProperties.length || availableProperties.includes("status")) {
      properties.status = {
        select: {
          name: ticket.status || 'new'
        }
      };
    }
    
    // Add submission_date field with the current date (matching the actual database schema)
    if (!availableProperties.length || availableProperties.includes("submission_date")) {
      properties.submission_date = {
        date: {
          start: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : new Date().toISOString()
        }
      };
    }
    
    // Create array of child blocks with content details
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
    const pageData: any = {
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
  } catch (error: any) {
    console.error("Error adding ticket to Notion:", error.message);
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