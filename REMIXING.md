# Remixing this Notion Documentation Portal

This guide will help you successfully remix this project and connect it to your own Notion workspace. We provide a ready-to-use Notion template with pre-configured databases that you can duplicate to get started quickly.

## Prerequisites

Before you remix, make sure you have:

1. A Notion account with admin access to a workspace
2. The ability to create a Notion integration
3. Permission to duplicate a template in your Notion workspace

## Step-by-Step Remix Guide

### 1. Duplicate the Notion Template

Start by duplicating our pre-configured Notion template that includes all the necessary databases:

1. Go to the template page: [Customer Support Admin TEMPLATE](https://mannybernabe.notion.site/Customer-Support-Admin-TEMPLATE-1ebc922b6d5b808e827ae3f3ab4fbe43)
2. Click "Duplicate" in the top-right corner
3. Select the workspace where you want to save the template
4. Once duplicated, this page will contain all the required databases already structured correctly

### 2. Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name your integration (e.g., "Documentation Portal")
4. Select the workspace where your documentation will live
5. Click "Submit"
6. **Copy the "Internal Integration Secret"** - you'll need this later

> **Important:** Create a dedicated integration specifically for this project instead of reusing an existing one. Using a dedicated integration helps avoid conflicts with other applications and makes it much easier to identify the correct databases during setup.

### 3. Connect the Integration to Your Page

1. Open your duplicated template page from step 1
2. Click the "..." menu in the top right
3. Select "Add connections"
4. Find and select the integration you just created
5. **Copy the URL of this page** - you'll need this later

### 4. Remix the Project

1. Click the "Remix" button to create your own copy of this project
2. Once the remix completes, go to the "Secrets" tool in the left sidebar
3. Add the following secrets:
   - `NOTION_INTEGRATION_SECRET`: Paste the integration secret you copied
   - `NOTION_PAGE_URL`: Paste the Notion page URL you copied

### 5. Set Up with the AI Assistant

Once you've added your secrets, use this exact prompt with the Replit Agent:

```
I'd like to set up this Notion-powered documentation portal with my Notion page. I've already:

1. Duplicated the template Notion page with pre-configured databases
2. Created a dedicated Notion integration at https://www.notion.so/my-integrations
3. Connected my duplicated page with this integration
4. Added my NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL as secrets

Please help me:
1. First run the list-databases.ts script to identify all databases in my Notion page
2. Configure the application to use these databases
3. Ensure the portal properly displays my Notion content
```

The AI will guide you through:
- Running the list-databases.ts script to identify all available databases
- Configuring the application to use these databases
- Testing that content displays correctly

### Important: Always Run list-databases.ts First

The most reliable way to identify databases in your Notion page is to run:

```bash
npx tsx list-databases.ts
```

This script will:
1. Connect to your Notion page using the provided secrets
2. List all available databases with their titles and IDs
3. Help you correctly identify which databases to use for FAQs and Support Tickets

**Note:** Your configuration will be automatically detected and loaded from notion-config.json - no additional environment variables needed!

## Database Requirements

The application requires specific databases to function properly:

- A database for FAQs (main content type)
- A database for Support Tickets (required for ticket management)

**Important Notes:**
- You don't need a dedicated Categories database - the application can extract category information from any database with select-type properties (like dropdown fields)
- The application previously used an Articles database, but that functionality has been merged with FAQs
- Databases with different names will work as long as they have compatible schemas - the system will detect and adapt to them

For proper functionality, make sure your Notion page contains both a FAQs database and a Support Tickets database. The application will validate their schemas and configure itself based on what it finds.

## Troubleshooting

If you run into issues during setup:

- **Missing required databases**: Ensure you have both a FAQs database and a Support Tickets database in your Notion page
- **Content not appearing**: Verify your page is properly shared with the integration
- **Schema validation errors**: Check that your databases contain the required properties (Title, Description, Status, etc.)
- **Missing Support Tickets functionality**: Make sure you've configured both the FAQs and Support Tickets databases
- **Status field warnings**: The application now accepts any status values in your Support Tickets database
- **Configuration issues**: Run `node use-existing-db.js` manually for a guided setup

## Customizing the AI Chatbot

Once you've set up your project with your Notion content, you might want to customize the AI chatbot to better represent your brand and specific needs. Use this prompt with the Replit Agent:

```
I want to customize the AI Chatbot in my remixed SerenityFlow Documentation Portal. Can you help me with the following:

1. Open the file at server/services/openai.ts and modify the systemMessage to match my brand. I want the AI to:
   - Represent [MY COMPANY NAME: {insert company name}]
   - Help with questions about [MY PRODUCT/SERVICE: {insert product/service}]
   - Use a [TONE: professional/casual/friendly/technical] tone
   - Have expertise in [DOMAIN: {insert domain}]

2. Then update the welcome message in client/src/components/ChatAssistant.tsx to:
   "👋 Hi there! I'm your {insert company name} assistant. I can help with {specific things the assistant can help with}. How can I help you today?"

3. Also change the chat button text to say "Chat with {insert name} Support" 

4. I'd also like to customize the AI model parameters in server/services/openai.ts:
   - Adjust the temperature to [VALUE: 0.0-1.0] (higher for more creative responses)
   - Change the max_tokens to [VALUE: 100-1000] to adjust response length

Please make these changes while preserving all the existing functionality. After you're done, restart the application so I can see my customized AI Assistant in action.
```

Remember to replace the values in curly braces `{}` with your specific information before submitting the prompt to the Replit Agent.

## Getting Help

If you need additional assistance, ask the AI assistant using a clear description of what you're trying to accomplish and where you're stuck.