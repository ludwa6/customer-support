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
    requiredProperties: ['Question', 'Answer'],
    propertyTypes: {
      // We accept multiple variations of property names for the question title
      Question: { type: 'title', required: true },
      question: { type: 'title', required: true },
      Title: { type: 'title', required: true },
      title: { type: 'title', required: true },
      
      // Accept multiple variations for the answer content
      Answer: { type: 'rich_text', required: true },
      answer: { type: 'rich_text', required: true },
      Content: { type: 'rich_text', required: true },
      content: { type: 'rich_text', required: true },
      Description: { type: 'rich_text', required: true },
      description: { type: 'rich_text', required: true },
      
      // Category fields are optional but recommended
      Category: { type: 'select', required: false },
      category: { type: 'select', required: false },
      CategoryId: { type: 'rich_text', required: false },
      CategoryName: { type: 'rich_text', required: false },
      categoryId: { type: 'rich_text', required: false },
      categoryName: { type: 'rich_text', required: false },
      
      // Optional but helpful metadata
      Status: { type: 'select', required: false },
      status: { type: 'select', required: false },
      IsPopular: { type: 'checkbox', required: false },
      isPopular: { type: 'checkbox', required: false },
      CreatedAt: { type: 'date', required: false },
      createdAt: { type: 'date', required: false },
      UpdatedAt: { type: 'date', required: false }, 
      updatedAt: { type: 'date', required: false }
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
        required: true
        // Allow any status values - don't enforce specific options
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