# ⚠️ IMPORTANT: This is the Original Template - Not Production Code

**This repository contains Manny Bernabe's original "SerenityFlow Documentation Portal" template.**

**Production App Location:** The actual production code is running on Replit at:
- Replit Project: `customer-support-walt6`
- Live URL: https://customer-support-walt6.replit.app/

**For Production Documentation:** See `docs/` folder or https://github.com/ludwa6/claude-workspace/tree/main/projects/customer-support

---

# SerenityFlow Documentation Portal (Original Template)

**Original Author:** Manny Bernabe  
**Tutorial:** https://www.notion.so/mannybernabe/Tutorial-Customer-Support-Page-with-Notion-Backend-1edc922b6d5b802faa2bfacc83da185d

An AI-powered customer support portal leveraging Notion databases for dynamic documentation and intelligent ticket management.

## Note for Developers

**If you're working on the Vale da Lama production deployment:**
- The production code is in Replit: `customer-support-walt6`
- See `/docs` folder in this repo for deployment documentation
- Contact Walt Ludwig for access to production environment

**If you want to remix this template:**
- Follow the instructions below
- This is the original template code
- The production app has customizations not in this template

---

## Quick Start (Template Only)

1. Make sure you have the required Notion integration keys set up:
   - `NOTION_INTEGRATION_SECRET`
   - `NOTION_PAGE_URL`

2. **Identify databases in your Notion page** (important when remixing!):\n   ```bash
   # First, check what databases exist in your Notion page:
   npx tsx list-databases.ts
   ```

3. Run one of these setup commands:
   ```bash
   # RECOMMENDED: Automatic database detection & configuration:
   node auto-setup.js
   
   # Alternative: Interactive setup for new users:
   node setup.js
   
   # Alternative: Use existing databases in your Notion page:
   node use-existing-db.js
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

## Remixing This Template

If you're remixing this project, please follow these steps to ensure proper database connection:

1. Set up your Notion integration
2. Connect your page to the integration
3. Add `NOTION_INTEGRATION_SECRET` and `NOTION_PAGE_URL` to your secrets
4. Run our dedicated remix setup script:
   ```bash
   node setup-remix.js
   ```

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

## Troubleshooting

- **Content not appearing**: Check that your Notion page is shared with the integration
- **Database connection issues**: Make sure the notion-config.json file exists in the project root
- **Missing databases**: First run `npx tsx list-databases.ts` to identify available databases

---

## Production Deployment (Vale da Lama)

**This section is for the production deployment team only.**

The production app (running on Replit) is a customized version of this template with:
- Categories feature removed
- Dual-domain support (farm + hotel)
- Custom branding and content
- Modified database structure

**For production deployment documentation:**
- See [docs/](./docs/) folder
- Contact: Walt Ludwig
- Replit Project: `customer-support-walt6`

---

**Original Template Credits:** Manny Bernabe  
**Production Customization:** Walt Ludwig / Vale da Lama
