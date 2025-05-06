import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, findDatabaseByTitle, createDatabaseIfNotExists } from "./notion";
import { tickets } from "@shared/schema";
import { storage } from "../storage";

// Database ID for support tickets
let SUPPORT_TICKETS_DATABASE_ID: string | null = null;

/**
 * Find or create the Support Tickets database in Notion
 */
export async function getSupportTicketsDatabase() {
  // If we already have the database ID, return it
  if (SUPPORT_TICKETS_DATABASE_ID) {
    return SUPPORT_TICKETS_DATABASE_ID;
  }
  
  try {
    // Try to find existing database
    const existingDb = await findDatabaseByTitle("Support Tickets");
    
    if (existingDb) {
      SUPPORT_TICKETS_DATABASE_ID = existingDb.id;
      return existingDb.id;
    }
    
    // We're not going to create a new database, since you already have one
    // Just throw an error if we can't find the existing database
    throw new Error("Could not find Support Tickets database in Notion. Please make sure it exists and the integration has access.");
  } catch (error) {
    console.error("Error getting Support Tickets database:", error);
    throw error;
  }
}

/**
 * Add a support ticket to Notion database
 */
export async function addTicketToNotion(ticket: any) {
  try {
    // Get the database ID
    const databaseId = await getSupportTicketsDatabase();
    
    if (!databaseId) {
      throw new Error("Could not find or create Support Tickets database");
    }
    
    // Format attachments as a string (if any)
    let attachmentsText = "";
    
    if (ticket.attachments) {
      try {
        const attachments = JSON.parse(ticket.attachments);
        attachmentsText = attachments.map((attachment: any) => 
          `${attachment.originalName} (${attachment.size} bytes)`
        ).join("\n");
      } catch (e) {
        attachmentsText = String(ticket.attachments);
      }
    }
    
    // Create the page in Notion
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId
      },
      properties: {
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
                content: ticket.description
              }
            }
          ]
        },
        attachments: {
          rich_text: attachmentsText ? [
            {
              text: {
                content: attachmentsText
              }
            }
          ] : []
        }
      }
    });
    
    return response;
  } catch (error) {
    console.error("Error adding ticket to Notion:", error);
    throw error;
  }
}