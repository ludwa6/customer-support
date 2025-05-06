import { db } from "@db";
import { tickets, insertTicketSchema, categories, articles, faqs } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export const storage = {
  /**
   * TICKET OPERATIONS
   */
  
  // Get all tickets
  async getTickets() {
    return db.query.tickets.findMany({
      orderBy: desc(tickets.createdAt)
    });
  },
  
  // Get ticket by ID
  async getTicketById(id: number) {
    return db.query.tickets.findFirst({
      where: eq(tickets.id, id)
    });
  },
  
  // Insert a new ticket
  async insertTicket(ticketData: any) {
    try {
      const validatedData = insertTicketSchema.parse(ticketData);
      const [newTicket] = await db.insert(tickets).values(validatedData).returning();
      return newTicket;
    } catch (error) {
      console.error("Error inserting ticket:", error);
      throw error;
    }
  },
  
  // Update ticket status
  async updateTicketStatus(id: number, status: string) {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ status })
      .where(eq(tickets.id, id))
      .returning();
      
    return updatedTicket;
  },
  
  /**
   * CATEGORY OPERATIONS
   */
  
  // Get all categories
  async getCategories() {
    return db.query.categories.findMany();
  },
  
  // Get category by ID
  async getCategoryById(id: number) {
    return db.query.categories.findFirst({
      where: eq(categories.id, id)
    });
  },
  
  /**
   * ARTICLE OPERATIONS
   */
  
  // Get all articles
  async getArticles(categoryId?: number, isPopular?: boolean) {
    let query = db.query.articles;
    
    if (categoryId && isPopular !== undefined) {
      return query.findMany({
        where: and(
          eq(articles.categoryId, categoryId),
          eq(articles.isPopular, isPopular)
        )
      });
    } else if (categoryId) {
      return query.findMany({
        where: eq(articles.categoryId, categoryId)
      });
    } else if (isPopular !== undefined) {
      return query.findMany({
        where: eq(articles.isPopular, isPopular)
      });
    }
    
    return query.findMany();
  },
  
  // Get article by ID
  async getArticleById(id: number) {
    return db.query.articles.findFirst({
      where: eq(articles.id, id)
    });
  },
  
  /**
   * FAQ OPERATIONS
   */
  
  // Get all FAQs
  async getFAQs(categoryId?: number) {
    if (categoryId) {
      return db.query.faqs.findMany({
        where: eq(faqs.categoryId, categoryId)
      });
    }
    
    return db.query.faqs.findMany();
  },
  
  // Get FAQ by ID
  async getFAQById(id: number) {
    return db.query.faqs.findFirst({
      where: eq(faqs.id, id)
    });
  }
};
