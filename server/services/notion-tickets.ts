import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, findDatabaseByTitle, createDatabaseIfNotExists, getNotionDatabases } from "./notion";
import { tickets } from "@shared/schema";
import { storage } from "../storage";

// Database ID for support tickets - extracted directly from the URL
const SUPPORT_TICKETS_DATABASE_ID = "1ebc922b6d5b8006b3d0c0b013b4f2fb";

/**
 * Get the Support Tickets database ID
 */
export async function getSupportTicketsDatabase() {
  return SUPPORT_TICKETS_DATABASE_ID;
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
    
    // Log the database ID we're using
    console.log(`Adding ticket to Notion database with ID: ${databaseId}`);
    
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