import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  notionId: text("notion_id").unique(),
});

export const insertCategorySchema = createInsertSchema(categories);
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Articles table
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  isPopular: boolean("is_popular").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  notionId: text("notion_id").unique(),
});

export const insertArticleSchema = createInsertSchema(articles);
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

// FAQs table
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  notionId: text("notion_id").unique(),
});

export const insertFAQSchema = createInsertSchema(faqs);
export type InsertFAQ = z.infer<typeof insertFAQSchema>;
export type FAQ = typeof faqs.$inferSelect;

// Support Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  attachments: jsonb("attachments"),
  status: text("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  updatedAt: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
  faqs: many(faqs),
}));

export const articlesRelations = relations(articles, ({ one }) => ({
  category: one(categories, { fields: [articles.categoryId], references: [categories.id] }),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  category: one(categories, { fields: [faqs.categoryId], references: [categories.id] }),
}));
