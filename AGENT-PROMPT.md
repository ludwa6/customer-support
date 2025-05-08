# Notion Portal Setup: Use This Exact Prompt with Replit Agent

When you remix this documentation portal, use this *exact prompt* to help the Replit Agent correctly find and use your Notion databases:

```
I'd like to set up this Notion-powered documentation portal with my Notion page. I've already:

1. Duplicated the template Notion page with pre-configured databases
2. Created a dedicated Notion integration at https://www.notion.so/my-integrations
3. Connected my duplicated page with this integration
4. Added my NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL as secrets

Please help me:
1. First run the list-databases.ts script using: npx tsx list-databases.ts
2. Then run auto-setup.js to configure the application
3. Ensure the portal properly displays my Notion content

Note: The application will automatically find and use the notion-config.json file. No need to set NOTION_CONFIG_PATH or any other environment variables!
```

## Why This Works

The prompt above ensures that:
1. The system uses the enhanced list-databases.ts script that employs multiple methods to find databases
2. This happens BEFORE any configuration attempt is made
3. The agent can see the full output with database IDs and titles
4. The auto-setup.js script runs with this information already available

## Important: Always Run list-databases.ts First!

The most common issue during remixing is that the Agent skips the list-databases.ts script and goes straight to configuration, potentially missing your databases.

By explicitly asking to run `npx tsx list-databases.ts` first, you ensure all databases are found before configuration.