import type { Express } from "express";
import { createServer, type Server } from "http";
import { NOTION_PAGE_ID } from "./services/notion";
import { generateAIResponse, shouldRedirectToSupport } from "./services/openai";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage_dir = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(storage_dir)) {
  fs.mkdirSync(storage_dir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, storage_dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, and DOC files are allowed.') as any);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Verify if the necessary environment variables are set
  if (!process.env.NOTION_INTEGRATION_SECRET || !NOTION_PAGE_ID) {
    console.warn("Notion integration is not configured. Set NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL in your environment variables.");
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI integration is not configured. Set OPENAI_API_KEY in your environment variables.");
  }
  
  // Categories API
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  // Articles API
  app.get('/api/articles', async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const isPopular = req.query.isPopular === 'true';
      
      const articles = await storage.getArticles(categoryId, isPopular);
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ message: 'Failed to fetch articles' });
    }
  });
  
  // Popular Articles API
  app.get('/api/articles/popular', async (req, res) => {
    try {
      // Get all articles and take the first 5 as popular ones
      // In a real app, you would have a specific flag in Notion for popular articles
      const allArticles = await storage.getArticles();
      
      // Just get 5 articles from the list
      const popularArticles = allArticles.slice(0, 5);
      
      res.json(popularArticles);
    } catch (error) {
      console.error('Error fetching popular articles:', error);
      res.status(500).json({ message: 'Failed to fetch popular articles' });
    }
  });
  
  // Article Details API
  app.get('/api/articles/:id', async (req, res) => {
    try {
      const articleId = req.params.id;
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      res.json(article);
    } catch (error) {
      console.error(`Error fetching article ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch article' });
    }
  });
  
  // FAQs API
  app.get('/api/faqs', async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const faqs = await storage.getFAQs(categoryId);
      res.json(faqs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      res.status(500).json({ message: 'Failed to fetch FAQs' });
    }
  });
  
  // Chat API
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }
      
      // Always generate AI response without checking for redirection
      const response = await generateAIResponse(message);
      
      // Always set shouldRedirect to false
      res.json({ response, shouldRedirect: false });
    } catch (error) {
      console.error('Error generating chat response:', error);
      res.status(500).json({ message: 'Failed to generate response' });
    }
  });
  
  // Notion status API - used to check configuration for auto-setup
  app.get('/api/notion-status', (req, res) => {
    try {
      const databasesDetected = fs.existsSync('.notion-db-exists');
      const configExists = fs.existsSync('notion-config.json');
      const preventSetupExists = fs.existsSync('.prevent-notion-setup');
      
      res.json({
        notionIntegrationConfigured: !!process.env.NOTION_INTEGRATION_SECRET,
        notionPageConfigured: !!process.env.NOTION_PAGE_URL,
        notionConfigPathConfigured: !!process.env.NOTION_CONFIG_PATH,
        databasesDetected,
        configExists,
        preventSetupExists
      });
    } catch (error) {
      console.error('Error checking Notion status:', error);
      res.status(500).json({ message: 'Failed to check Notion status' });
    }
  });

  // Support Tickets API
  app.post('/api/tickets', async (req, res) => {
    try {
      const { name, email, description } = req.body;
      
      // Validate required fields
      if (!name || !email || !description) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Use default value for subject
      const subject = 'Support Request';
      
      // Verify Notion integration is configured
      if (!process.env.NOTION_INTEGRATION_SECRET || !NOTION_PAGE_ID) {
        return res.status(503).json({ 
          message: 'Notion integration is not configured. Please set up the required environment variables.'
        });
      }
      
      // Create new ticket using storage interface
      const newTicket = await storage.insertTicket({
        name,
        email,
        subject,
        category: 'General', // Default category
        description,
        status: 'new',
        createdAt: new Date()
      });
      
      res.status(201).json({
        message: 'Ticket submitted successfully',
        ticket: newTicket
      });
    } catch (error) {
      console.error('Error submitting ticket:', error);
      res.status(500).json({ message: 'Failed to submit ticket' });
    }
  });
  
  // Get tickets from Notion
  app.get('/api/tickets', async (req, res) => {
    try {
      // Verify Notion integration is configured
      if (!process.env.NOTION_INTEGRATION_SECRET || !NOTION_PAGE_ID) {
        return res.status(503).json({ 
          message: 'Notion integration is not configured. Please set up the required environment variables.'
        });
      }
      
      const tickets = await storage.getTickets();
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });
  
  // Get ticket by ID from Notion
  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const ticketId = req.params.id;
      
      // Verify Notion integration is configured
      if (!process.env.NOTION_INTEGRATION_SECRET || !NOTION_PAGE_ID) {
        return res.status(503).json({ 
          message: 'Notion integration is not configured. Please set up the required environment variables.'
        });
      }
      
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error(`Error fetching ticket ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch ticket' });
    }
  });
  
  // Update ticket status in Notion
  app.patch('/api/tickets/:id/status', async (req, res) => {
    try {
      const ticketId = req.params.id;
      const { status } = req.body;
      
      if (!status || !['new', 'in-progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // Verify Notion integration is configured
      if (!process.env.NOTION_INTEGRATION_SECRET || !NOTION_PAGE_ID) {
        return res.status(503).json({ 
          message: 'Notion integration is not configured. Please set up the required environment variables.'
        });
      }
      
      const updatedTicket = await storage.updateTicketStatus(ticketId, status);
      
      res.json({
        message: 'Ticket status updated successfully',
        ticket: updatedTicket
      });
    } catch (error) {
      console.error(`Error updating ticket ${req.params.id} status:`, error);
      res.status(500).json({ message: 'Failed to update ticket status' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
