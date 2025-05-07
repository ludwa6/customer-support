# SerenityFlow Documentation Portal

An AI-powered customer support portal leveraging Notion databases for dynamic documentation and intelligent ticket management. The application provides a streamlined, user-friendly interface for submitting and tracking support requests with advanced filtering capabilities.

## Getting Started

This application uses Notion as its database, so you'll need to set up a Notion integration and provide a Notion page to store your content before you can use it.

### Prerequisites

- A Notion account
- Node.js and npm (included in this Replit template)

### Quick Setup (Recommended)

The easiest way to get started is to use the interactive setup script:

```bash
node setup.js
```

This guide will walk you through:
1. Creating a Notion integration
2. Sharing a page with your integration
3. Setting up the environment variables
4. Initializing the Notion databases with sample content

### Manual Setup

If you prefer to set up manually, follow these steps:

#### Setting Up Your Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give your integration a name (e.g., "SerenityFlow Portal")
4. Select the workspace where you want to use the integration
5. Click **"Submit"**
6. Copy the **"Internal Integration Secret"** - this will be your `NOTION_INTEGRATION_SECRET`

#### Preparing Your Notion Page

1. Create a new page in Notion or use an existing one
2. Share this page with your integration:
   - Open the page in Notion
   - Click the "•••" (three dots) menu in the top right
   - Select "Add connections"
   - Search for and select your integration name
3. Copy the URL of this page - this will be your `NOTION_PAGE_URL`

#### Setting Up Environment Variables

1. In your Replit project, click on the lock icon 🔒 in the left sidebar (or press Ctrl+Shift+L)
2. Add the following secrets:
   - **Key**: `NOTION_INTEGRATION_SECRET` 
   - **Value**: *paste your integration secret here*
   - **Key**: `NOTION_PAGE_URL`
   - **Value**: *paste your Notion page URL here*

#### Initializing Your Notion Database

Run the setup script to create the necessary database structure in your Notion page:

```bash
node server/setup-notion.ts
```

This script will:
1. Create three databases in your Notion page:
   - Categories
   - Articles
   - FAQs
2. Populate these databases with sample content

## Using the Application

After setting up, you can use the application to:

- Browse categories and documentation articles
- Search for specific documentation
- Read FAQs
- Submit support tickets which are stored in Notion
- Chat with the AI assistant for quick help

## Application Structure

- **Frontend**: React with wouter for routing
- **Backend**: Node.js (Express)
- **Storage**: Notion API
- **Styling**: Tailwind CSS with shadcn/ui components

## Additional Commands

- `npm run dev` - Start the development server
- `node server/populate-notion.ts` - Add more sample content to your Notion databases
- `node server/inspect-notion.ts` - Inspect your Notion database structure

## Customization

You can customize the application by:

1. Modifying the sample content in `server/setup-notion.ts`
2. Adding new categories and articles directly in your Notion page
3. Customizing the UI components in the `client/src/components` directory

## Troubleshooting

If you encounter issues:

- Make sure your Notion integration has access to your page
- Verify your environment variables are set correctly
- Check the console logs for specific error messages

## License

This project is available as an open-source template.