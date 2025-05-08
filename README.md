# SerenityFlow Documentation Portal

An AI-powered customer support portal leveraging Notion databases for dynamic documentation and intelligent ticket management.

## Quick Start

1. Make sure you have the required Notion integration keys set up:
   - `NOTION_INTEGRATION_SECRET`
   - `NOTION_PAGE_URL`

2. **Identify databases in your Notion page** (important when remixing!):
   ```bash
   # First, check what databases exist in your Notion page:
   npx tsx list-databases.ts
   ```

3. Run one of these setup commands:
   ```bash
   # RECOMMENDED: Automatic database detection & configuration:
   node auto-setup.js
   
   # For users without ANY existing databases - creates fresh databases:
   node setup-new-notion-db.js
   
   # Alternative: Interactive setup for new users:
   node setup.js
   
   # Alternative: Use existing databases in your Notion page:
   node use-existing-db.js
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

## Remixing This Project

If you're remixing this project, please follow these steps to ensure proper database connection:

1. Set up your Notion integration
2. Connect your page to the integration
3. Add `NOTION_INTEGRATION_SECRET` and `NOTION_PAGE_URL` to your secrets
4. **IMPORTANT:** Run `npx tsx list-databases.ts` to identify your databases
5. Run `node auto-setup.js` to configure the application

For detailed remix instructions, see [REMIXING.md](REMIXING.md).

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

> **Important:** We recommend creating a dedicated integration specifically for this project rather than reusing an existing one. This helps avoid conflicts and makes it easier to identify the correct databases during the setup process.

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

1. Run `npx tsx list-databases.ts` to identify all available databases (titles and IDs)
2. Run `node auto-setup.js` to automatically detect and configure them
3. Or run `node use-existing-db.js` for a guided setup process
4. The configuration will be automatically detected - no additional environment variables needed!

> **Pro Tip:** Always start with the list-databases.ts script to identify databases that exist in your Notion page. This will give you a clear list of all available databases with their titles and IDs.

## Troubleshooting

- **Content not appearing**: Check that your Notion page is shared with the integration
- **Database connection issues**: Make sure the notion-config.json file exists in the project root
- **Missing databases**: First run `npx tsx list-databases.ts` to identify available databases, then use `node use-existing-db.js` to configure them
- **Database identification issues**: Always start with `npx tsx list-databases.ts` to get a complete list of database titles and IDs

## About Remixing

When remixing this project, you can seamlessly use your existing Notion databases instead of creating new ones.

### Quick Remix Instructions

1. **See [REMIXING.md](./REMIXING.md) for a complete guide with ready-to-use prompts**
2. **Set Notion Secrets**: Add your `NOTION_INTEGRATION_SECRET` and `NOTION_PAGE_URL` environment variables
3. **Use the AI Assistant**: Ask it to detect and configure your existing Notion databases
4. **Start the App**: Once configured, the app will use your existing Notion content

### Preventing Database Duplication

The app includes enhanced safeguards to prevent any database creation in remixed projects:
- A `.prevent-notion-setup` marker file is automatically created on startup
- All database creation functions have been modified to never create new databases
- The remixing logic in auto-setup.js prioritizes existing databases
- Detection of existing databases happens automatically during server startup

### Supported Database Types

The system requires:
- FAQs database (the main content type)
- Support Tickets database (for ticket management)

**Notes:** 
- The application doesn't require a dedicated Categories database - it can extract categories from any database with select-type properties
- Articles functionality has been deprecated and merged with FAQs

Before remixing, make sure your Notion page contains both a FAQs database and a Support Tickets database. The application will only use existing databases, never creating new ones in remixed projects.