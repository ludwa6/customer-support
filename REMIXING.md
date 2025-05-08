# Remixing this Notion Documentation Portal

This guide will help you successfully remix this project and connect it to your own Notion workspace.

## Prerequisites

Before you remix, make sure you have:

1. A Notion account with admin access to a workspace
2. The ability to create a Notion integration
3. A Notion page that will serve as your documentation portal's root

## Step-by-Step Remix Guide

### 1. Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name your integration (e.g., "Documentation Portal")
4. Select the workspace where your documentation will live
5. Click "Submit"
6. **Copy the "Internal Integration Secret"** - you'll need this later

### 2. Prepare a Notion Page

1. Open Notion and create a new page (or use an existing one)
2. Click the "..." menu in the top right
3. Select "Add connections"
4. Find and select the integration you just created
5. **Copy the URL of this page** - you'll need this later

### 3. Remix the Project

1. Click the "Remix" button to create your own copy of this project
2. Once the remix completes, go to the "Secrets" tool in the left sidebar
3. Add the following secrets:
   - `NOTION_INTEGRATION_SECRET`: Paste the integration secret you copied
   - `NOTION_PAGE_URL`: Paste the Notion page URL you copied

### 4. Set Up with the AI Assistant

Once you've added your secrets, use this exact prompt with the AI assistant:

```
I'd like to set up this Notion-powered documentation portal with my existing Notion page. I've already:

1. Created a Notion integration at https://www.notion.so/my-integrations
2. Shared a Notion page with this integration
3. Added my NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL as secrets

Please help me:
1. Detect existing databases in my Notion page
2. Configure the application to use these databases
3. Ensure the portal properly displays my Notion content
```

The AI will guide you through:
- Running the detection script to find existing databases
- Configuring the application to use your databases
- Testing that content displays correctly

## Database Requirements

This application expects to find these databases in your Notion page:

1. **Categories**: A database with category information
2. **Articles/Documentation**: Your main documentation content
3. **FAQs**: Frequently asked questions
4. **Support Tickets**: For ticket management

If you don't have these databases already, the application will find similar databases and adapt to them. For best results, create these databases in your Notion page before setting up.

## Troubleshooting

If you run into issues during setup:

- **No databases detected**: Add at least one database to your Notion page and try again
- **Content not appearing**: Ensure your page is properly shared with the integration
- **Configuration issues**: Run `node use-existing-db.js` manually for a guided setup

## Getting Help

If you need additional assistance, ask the AI assistant using a clear description of what you're trying to accomplish and where you're stuck.