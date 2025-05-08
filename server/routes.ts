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
  
  // Test endpoint to verify Support Tickets database connection
  app.get('/api/test-tickets-db', async (req, res) => {
    try {
      const { notion } = await import('./services/notion');
      const { getSupportTicketsDatabase } = await import('./services/notion-tickets');
      
      // Try to get the database ID
      const databaseId = await getSupportTicketsDatabase();
      console.log(`Testing Support Tickets database with ID: ${databaseId}`);
      
      // Try to fetch the database schema
      const dbInfo = await notion.databases.retrieve({
        database_id: databaseId
      });
      
      // Try to query the database
      const ticketsResponse = await notion.databases.query({
        database_id: databaseId,
        page_size: 5
      });
      
      // Format the response
      const result = {
        databaseId,
        properties: Object.keys(dbInfo.properties),
        ticketsCount: ticketsResponse.results.length,
        tickets: ticketsResponse.results.map(page => {
          const props = page.properties;
          return {
            id: page.id,
            name: props.full_name?.title?.[0]?.plain_text || "Unknown",
            email: props.email?.email || "No email",
            status: props.status?.select?.name || "unknown",
            date: props.submission_date?.date?.start || page.created_time
          };
        })
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error testing Support Tickets database:', error);
      res.status(500).json({ 
        error: 'Failed to test Support Tickets database',
        message: error.message,
        stack: error.stack
      });
    }
  });
  
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
  
  // Articles API (Deprecated - Redirects to FAQs)
  app.get('/api/articles', async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      
      // Redirect to FAQs with the same category filter
      const faqs = await storage.getFAQs(categoryId);
      
      // Transform FAQs to match Article format for backwards compatibility
      const transformedFaqs = faqs.map(faq => ({
        id: faq.id,
        title: faq.question,
        content: faq.answer,
        categoryId: faq.categoryId,
        categoryName: faq.categoryName,
        createdAt: new Date().toISOString(), // FAQs don't have timestamps
        updatedAt: new Date().toISOString(),
        isPopular: false
      }));
      
      res.json(transformedFaqs);
    } catch (error) {
      console.error('Error transforming FAQs to Articles:', error);
      res.status(500).json({ message: 'Failed to fetch articles' });
    }
  });
  
  // Popular Articles API (Deprecated - Redirects to FAQs)
  app.get('/api/articles/popular', async (req, res) => {
    try {
      // Get all FAQs and transform the first 5
      const allFaqs = await storage.getFAQs();
      
      // Transform FAQs to match Article format for backwards compatibility
      const transformedFaqs = allFaqs.slice(0, 5).map(faq => ({
        id: faq.id,
        title: faq.question,
        content: faq.answer,
        categoryId: faq.categoryId,
        categoryName: faq.categoryName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPopular: true
      }));
      
      res.json(transformedFaqs);
    } catch (error) {
      console.error('Error transforming FAQs to popular Articles:', error);
      res.status(500).json({ message: 'Failed to fetch popular articles' });
    }
  });
  
  // Article Details API (Deprecated - Redirects to FAQs)
  app.get('/api/articles/:id', async (req, res) => {
    try {
      const faqId = req.params.id;
      
      // Try to find a FAQ with the same ID
      const faq = await storage.getFAQById(faqId);
      
      if (!faq) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      // Transform FAQ to match Article format
      const transformedFaq = {
        id: faq.id,
        title: faq.question,
        content: faq.answer,
        categoryId: faq.categoryId,
        categoryName: faq.categoryName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPopular: false
      };
      
      res.json(transformedFaq);
    } catch (error) {
      console.error(`Error transforming FAQ to Article ${req.params.id}:`, error);
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
        configFileExists: configExists, // We're using this instead of NOTION_CONFIG_PATH
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
