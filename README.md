# SerenityFlow Portal - Notion-Powered Documentation & Support

An AI-powered customer support portal leveraging Notion databases for dynamic documentation and intelligent ticket management. The application provides a streamlined, user-friendly interface for submitting and tracking support requests with advanced filtering capabilities.

## Getting Started

### Prerequisites

- A Notion account
- Notion integration with access to your workspace

### Setting Up Your Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give your integration a name (e.g., "SerenityFlow Portal")
4. Select the workspace where you want to use the integration
5. Click **"Submit"**
6. Copy the **"Internal Integration Secret"** - this will be your `NOTION_INTEGRATION_SECRET`

### Preparing Your Notion Page

1. Create a new page in Notion or use an existing one
2. Share this page with your integration:
   - Open the page in Notion
   - Click the "•••" (three dots) menu in the top right
   - Select "Add connections"
   - Search for and select your integration name
3. Copy the URL of this page - this will be your `NOTION_PAGE_URL`

### Setting Up Environment Variables

1. In your Replit project, click on the lock icon 🔒 in the left sidebar (or press Ctrl+Shift+L)
2. Add the following secrets:
   - **Key**: `NOTION_INTEGRATION_SECRET` 
   - **Value**: *paste your integration secret here*
   - **Key**: `NOTION_PAGE_URL`
   - **Value**: *paste your Notion page URL here*

### Working with Notion Databases

The application will work with your Notion page in one of two ways:

#### Option 1: Auto-detect Existing Databases

If you already have databases in your Notion page, the application will automatically detect and use them if they match the expected names:
- "Support Tickets" 
- "Articles"
- "FAQs"
- "Categories"

The application will prefer to use your existing databases first before creating new ones.

#### Option 2: Create New Databases

If no databases exist yet, you can run the setup script to create the necessary database structure in your Notion page:

```bash
node server/setup-notion.ts
```

This script will:
1. Create databases in your Notion page:
   - Support Tickets
   - Articles (if needed)
   - FAQs (if needed)
   - Categories (if needed)
2. Populate these databases with sample data

## Features

- **Dynamic Documentation**: Content managed through Notion
- **Intelligent Ticket Management**: Support tickets stored in Notion database
- **Auto-detection**: Automatically finds and uses existing Notion databases
- **Category Filtering**: Filter content by category
- **Responsive Design**: Works on mobile, tablet, and desktop

## Technology Stack

- React frontend with wouter routing
- Node.js backend
- Notion API integration
- TypeScript
- Serverless architecture

## Usage

Simply run the application and navigate to the web interface. All content is dynamically loaded from your Notion databases.

## Troubleshooting

If you encounter issues with connecting to Notion:

1. Make sure your Notion integration secret is correct
2. Verify that you've shared your Notion page with the integration
3. Check that your page contains databases with the expected names, or run the setup script

For any other issues, please submit a support ticket through the application itself.