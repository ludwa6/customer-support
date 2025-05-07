// Script to drop all SQL tables since we're using Notion as the data store
import { Pool } from '@neondatabase/serverless';

console.log("Removing SQL tables from the database...");

async function dropTables() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Drop tables in order that respects foreign key constraints
    const tableNames = ["faqs", "articles", "tickets", "categories", "users"];
    
    for (const tableName of tableNames) {
      console.log(`Dropping table: ${tableName}`);
      await pool.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
    }
    
    console.log("All tables have been dropped successfully.");
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error("Error dropping tables:", error);
  }
}

dropTables();