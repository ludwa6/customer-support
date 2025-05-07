// Import Notion service functions
import { 
  getCategories as notionGetCategories, 
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
   * ARTICLE OPERATIONS (Deprecated - Redirects to FAQs)
   */
  
  // Get all articles from Notion with optional filtering
  // Now transforming FAQs into Article format for backward compatibility
  async getArticles(categoryId?: string, isPopular?: boolean) {
    console.log('Warning: getArticles is deprecated. Using getFAQs instead.');
    const faqs = await this.getFAQs(categoryId);
    
    // Transform FAQs to match Article format
    return faqs.map(faq => ({
      id: faq.id,
      title: faq.question,
      content: faq.answer,
      categoryId: faq.categoryId,
      categoryName: faq.categoryName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPopular: isPopular || false
    }));
  },
  
  // Get article by ID from Notion
  // Now returning a transformed FAQ for backward compatibility
  async getArticleById(id: string) {
    console.log('Warning: getArticleById is deprecated. Using getFAQById instead.');
    const faq = await this.getFAQById(id);
    
    if (!faq) return null;
    
    // Transform FAQ to match Article format
    return {
      id: faq.id,
      title: faq.question,
      content: faq.answer,
      categoryId: faq.categoryId,
      categoryName: faq.categoryName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPopular: false
    };
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
