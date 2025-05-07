/**
 * Notion database schema validation types
 * 
 * This file defines types and constants for validating Notion database schemas
 * against expected structures.
 */

export interface DatabaseSchema {
  requiredProperties: string[];
  propertyTypes: {
    [key: string]: {
      type: string;
      required?: boolean;
      options?: string[]; // For select/multi-select properties
    };
  };
}

export const DATABASE_SCHEMAS: { [key: string]: DatabaseSchema } = {
  faqs: {
    requiredProperties: ['Question', 'Answer', 'CategoryId', 'CategoryName'],
    propertyTypes: {
      Question: { type: 'title', required: true },
      Answer: { type: 'rich_text', required: true },
      CategoryId: { type: 'rich_text', required: true },
      CategoryName: { type: 'rich_text', required: true }
    }
  },
  supportTickets: {
    requiredProperties: ['full_name', 'email', 'status'],
    propertyTypes: {
      full_name: { type: 'title', required: true },
      email: { type: 'email', required: true },
      description: { type: 'rich_text', required: true },
      status: { 
        type: 'select', 
        required: true,
        options: ['new', 'in-progress', 'resolved', 'closed']
      },
      submission_date: { type: 'date', required: false }
    }
  },
  categories: {
    requiredProperties: ['Name', 'Description', 'Icon'],
    propertyTypes: {
      Name: { type: 'title', required: true },
      Description: { type: 'rich_text', required: false },
      Icon: { type: 'rich_text', required: false }
    }
  },
  articles: {
    requiredProperties: ['Title', 'Content', 'CategoryId', 'CategoryName', 'IsPopular'],
    propertyTypes: {
      Title: { type: 'title', required: true },
      Content: { type: 'rich_text', required: true },
      CategoryId: { type: 'rich_text', required: true },
      CategoryName: { type: 'rich_text', required: true },
      IsPopular: { type: 'checkbox', required: false }
    }
  }
};