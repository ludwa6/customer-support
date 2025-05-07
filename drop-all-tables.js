// Script to completely delete all SQL tables
import { Pool } from '@neondatabase/serverless';
import * as fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function dropAllTables() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL environment variable not set");
    return;
  }
  
  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // First, get a list of all tables in the public schema
    console.log("Getting list of all tables...");
    const { rows } = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tableNames = rows.map(row => row.tablename);
    console.log(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);
    
    if (tableNames.length > 0) {
      // Disable foreign key constraints for the session
      await pool.query('SET session_replication_role = replica;');
      
      // Drop each table
      for (const tableName of tableNames) {
        console.log(`Dropping table: ${tableName}`);
        await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
      }
      
      // Re-enable foreign key constraints
      await pool.query('SET session_replication_role = DEFAULT;');
      
      console.log("All tables have been dropped successfully!");
    } else {
      console.log("No tables found in the database.");
    }
    
    // Now let's also drop sequences
    console.log("\nGetting list of all sequences...");
    const seqResult = await pool.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);
    
    const sequenceNames = seqResult.rows.map(row => row.sequence_name);
    console.log(`Found ${sequenceNames.length} sequences: ${sequenceNames.join(', ')}`);
    
    if (sequenceNames.length > 0) {
      // Drop each sequence
      for (const sequenceName of sequenceNames) {
        console.log(`Dropping sequence: ${sequenceName}`);
        await pool.query(`DROP SEQUENCE IF EXISTS "${sequenceName}" CASCADE;`);
      }
      
      console.log("All sequences have been dropped successfully!");
    } else {
      console.log("No sequences found in the database.");
    }
    
  } catch (error) {
    console.error("Error dropping tables:", error);
  } finally {
    await pool.end();
    console.log("Database connection closed.");
  }
}

// Run the function
dropAllTables().catch(console.error);