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

You can verify your setup is working correctly with:

```bash
node check-setup.js
```

This will check if your Notion credentials are configured properly and verify connection to your Notion page.

To use existing databases instead of creating new ones:

```bash
node use-existing-db.js
```

This will help you map your existing Notion databases to the application.

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

You have two options:

#### Option 1: Create New Databases (Recommended for New Users)

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

#### Option 2: Use Existing Databases

If you already have databases in your Notion page that you want to use:

```bash
node use-existing-db.js
```

This script will:
1. List all the databases in your Notion page
2. Let you select which database to use for each type (Categories, Articles, FAQs)
3. Create a configuration file mapping your databases
4. Update the application code to use your existing databases

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

## Understanding the Notion Integration

This application uses Notion as its database through the Notion API. Here's how it works:

```
┌─────────────────┐     ┌────────────────┐     ┌────────────────┐
│                 │     │                │     │                │
│  Your Notion    │     │  Notion API    │     │  SerenityFlow  │
│  Page           │◄────┤  (with secret) │◄────┤  Application   │
│                 │     │                │     │                │
└─────────────────┘     └────────────────┘     └────────────────┘
       ▲                                              │
       │                                              │
       └──────────────────────────────────────────────┘
            Integration connection (user setup)
```

### What happens during setup:

1. You create a Notion integration in your workspace
2. You connect a Notion page to this integration (giving it access)
3. **Automatic Database Detection**: The application checks if your Notion page already contains databases
   - If databases exist, it will prompt you to use the existing ones
   - If no databases exist, it will offer to create new ones
4. Based on your choice, the application either:
   - **Option A**: Creates new databases in your Notion page (Categories, Articles, FAQs) and populates them with sample content
   - **Option B**: Connects to your existing databases that you've selected
5. The application reads from and writes to these Notion databases when running

### Data flow:

- When users browse documentation in the app → Data is fetched from Notion
- When support tickets are submitted → They're stored in Notion
- When content is updated in Notion → Changes appear in the app

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

- Run the setup check to verify your configuration:
  ```bash
  node check-setup.js
  ```
- Make sure your Notion integration has access to your page
- Verify your environment variables are set correctly
- Check the console logs for specific error messages
- If you're still having trouble, try the interactive setup script:
  ```bash
  node setup.js
  ```

## License

This project is available as an open-source template.