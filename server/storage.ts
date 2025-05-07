// Import Notion service functions
import { 
  getCategories as notionGetCategories, 
  getArticles as notionGetArticles, 
  getArticleById as notionGetArticleById, 
  getFAQs as notionGetFAQs 
} from "./services/notion";

import {
  getTickets as notionGetTickets,
  getTicketById as notionGetTicketById,
  addTicket as notionAddTicket,
  updateTicketStatus as notionUpdateTicketStatus
} from "./services/notion-tickets";

// This storage interface is now a wrapper around Notion API calls
// All data is stored in Notion, not in a SQL database
export const storage = {
  /**
   * TICKET OPERATIONS
   */
  
  // Get all tickets directly from Notion
  async getTickets() {
    return notionGetTickets();
  },
  
  // Get ticket by ID from Notion
  async getTicketById(id: string) {
    return notionGetTicketById(id);
  },
  
  // Insert a new ticket into Notion
  async insertTicket(ticketData: any) {
    return notionAddTicket(ticketData);
  },
  
  // Update ticket status in Notion
  async updateTicketStatus(id: string, status: string) {
    return notionUpdateTicketStatus(id, status);
  },
  
  /**
   * CATEGORY OPERATIONS
   */
  
  // Get all categories from Notion
  async getCategories() {
    return notionGetCategories();
  },
  
  // Get category by ID from Notion (pass-through function)
  async getCategoryById(id: string) {
    const categories = await notionGetCategories();
    return categories.find(category => category.id === id) || null;
  },
  
  /**
   * ARTICLE OPERATIONS
   */
  
  // Get all articles from Notion with optional filtering
  async getArticles(categoryId?: string, isPopular?: boolean) {
    return notionGetArticles(categoryId, isPopular);
  },
  
  // Get article by ID from Notion
  async getArticleById(id: string) {
    return notionGetArticleById(id);
  },
  
  /**
   * FAQ OPERATIONS
   */
  
  // Get all FAQs from Notion with optional category filtering
  async getFAQs(categoryId?: string) {
    return notionGetFAQs(categoryId);
  },
  
  // Get FAQ by ID from Notion
  async getFAQById(id: string) {
    const faqs = await notionGetFAQs();
    return faqs.find(faq => faq.id === id) || null;
  }
};
