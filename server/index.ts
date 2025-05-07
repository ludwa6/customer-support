import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Check for existing Notion databases if needed
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Function to check if Notion databases exist
async function checkExistingNotionDatabases() {
  // Only run if Notion environment variables are set
  if (process.env.NOTION_INTEGRATION_SECRET && process.env.NOTION_PAGE_URL) {
    // Check if we've already detected databases
    const flagFile = '.notion-db-exists';
    const configFile = 'notion-config.json';
    
    // If config exists but NOTION_CONFIG_PATH isn't set, add it to process.env
    if (fs.existsSync(configFile) && !process.env.NOTION_CONFIG_PATH) {
      console.log('Found notion-config.json but NOTION_CONFIG_PATH is not set');
      console.log('Setting NOTION_CONFIG_PATH to ./notion-config.json');
      process.env.NOTION_CONFIG_PATH = './notion-config.json';
    }
    
    if (!fs.existsSync(flagFile)) {
      console.log('Checking for existing Notion databases...');
      
      // Run the detection script
      return new Promise<void>((resolve) => {
        exec('node server/detect-notion-db.js', (error, stdout, stderr) => {
          if (error) {
            console.error('Error checking Notion databases:', error);
          } else {
            console.log(stdout);
            
            // If databases were found and use-existing-db hasn't been run yet
            if (fs.existsSync(flagFile) && !fs.existsSync(configFile)) {
              console.log('Databases detected but not configured. For automatic configuration:');
              console.log('Run: node use-existing-db.js');
            }
          }
          resolve();
        });
      });
    } else {
      // If flag exists but config doesn't, remind user to run use-existing-db.js
      if (!fs.existsSync(configFile) && !process.env.NOTION_CONFIG_PATH) {
        console.log('Existing databases detected but not configured');
        console.log('To use them, run: node use-existing-db.js');
      }
    }
  }
}

(async () => {
  // Check for existing Notion databases before proceeding
  await checkExistingNotionDatabases();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
