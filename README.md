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
- **Missing databases**: Run `node server/setup-notion.ts` to create the required databases

## About Remixing

When remixing this project:

1. The app will automatically detect any existing databases in your Notion page
2. It will create a configuration file (notion-config.json) to map these databases
3. Add the `NOTION_CONFIG_PATH=./notion-config.json` environment variable to use your existing databases