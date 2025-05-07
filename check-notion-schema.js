// Script to check Notion database schema
import { Client } from '@notionhq/client';

// Access environment variables
const NOTION_INTEGRATION_SECRET = process.env.NOTION_INTEGRATION_SECRET;

const notion = new Client({ auth: NOTION_INTEGRATION_SECRET });

async function checkDatabaseSchema() {
  try {
    const databaseId = '1ebc922b6d5b8006b3d0c0b013b4f2fb';
    console.log('Checking schema for database:', databaseId);
    
    const response = await notion.databases.retrieve({
      database_id: databaseId
    });
    
    console.log('Database title:', response.title[0]?.plain_text || 'Untitled');
    console.log('Available properties:');
    
    for (const [key, value] of Object.entries(response.properties)) {
      console.log(`- ${key} (${value.type})`);
    }
    
  } catch (error) {
    console.error('Error checking database schema:', error.message);
    console.error(error);
  }
}

checkDatabaseSchema();