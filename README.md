# SerenityFlow Documentation Portal

An AI-powered customer support portal leveraging Notion databases for dynamic documentation and intelligent ticket management.

## Quick Start

1. Make sure you have the required Notion integration keys set up:
   - `NOTION_INTEGRATION_SECRET`
   - `NOTION_PAGE_URL`

2. Run one of these setup commands:
   ```
   # Interactive setup for new users:
   node setup.js
   
   # Automatic database detection & configuration:
   node auto-setup.js
   
   # Use existing databases in your Notion page:
   node use-existing-db.js
   ```

3. Start the application:
   ```
   npm run dev
   ```

## Features

- **Dynamic Documentation**: Content managed through Notion
- **Intelligent Ticket Management**: Support tickets stored in Notion database
- **Auto-detection**: Automatically finds and uses existing Notion databases
- **Category Filtering**: Filter content by category
- **Responsive Design**: Works on mobile, tablet, and desktop

## Setting Up Notion Integration

### Step 1: Create a Notion Integration

1. Go to the [Notion integrations page](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name your integration (e.g., "SerenityFlow Portal")
4. Select the workspace where you want to use it
5. Click "Submit"
6. Copy the "Internal Integration Secret"

### Step 2: Share a Notion Page

1. Create a new page in Notion or use an existing one
2. Click the "..." menu in the top right
3. Select "Add connections"
4. Find and select your integration
5. Copy the URL of the page

### Step 3: Set Up Environment Variables

Add these environment variables to your project:
- `NOTION_INTEGRATION_SECRET`: Your integration secret
- `NOTION_PAGE_URL`: The URL of your shared Notion page

### Reusing Existing Databases

If your Notion page already has databases:

1. Run `node auto-setup.js` to automatically detect and configure them
2. Or run `node use-existing-db.js` for a guided setup process
3. Add the environment variable `NOTION_CONFIG_PATH=./notion-config.json`

## Troubleshooting

- **Content not appearing**: Check that your Notion page is shared with the integration
- **Database connection issues**: Verify that the `NOTION_CONFIG_PATH` environment variable is set correctly
- **Missing databases**: Use the `node use-existing-db.js` script to configure existing databases in your Notion page

## About Remixing

When remixing this project, you can seamlessly use your existing Notion databases instead of creating new ones:

### Recommended Remix Workflow

1. **Set Notion Secrets**: Add your `NOTION_INTEGRATION_SECRET` and `NOTION_PAGE_URL` environment variables
2. **Run Auto-Setup**: Execute `node auto-setup.js` which will:
   - Detect this is a remixed project
   - Find existing databases in your Notion page
   - Create a configuration to use them instead of creating duplicates
3. **Make Config Permanent**: Add `NOTION_CONFIG_PATH=./notion-config.json` to your environment variables

### Preventing Database Duplication

The app includes enhanced safeguards to prevent any database creation in remixed projects:
- A `.prevent-notion-setup` marker file is automatically created on startup
- All database creation functions have been modified to never create new databases
- The remixing logic in auto-setup.js prioritizes existing databases
- Detection of existing databases happens automatically during server startup

### Supported Database Types

The system can detect and use these database types:
- Categories (select options list)
- Articles/Documentation
- FAQs
- Support Tickets

Before remixing, make sure your Notion page already contains these databases. The application is now designed to only use existing databases, never creating new ones in remixed projects.