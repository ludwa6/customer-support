#!/usr/bin/env node

/**
 * Test script to verify that database creation is properly prevented
 */

import { execSync } from 'child_process';
import fs from 'fs';

// We'll try to run the setup-notion.ts script and see if it's properly prevented
try {
  console.log("Testing Notion database setup prevention...");
  
  // Check if the prevention marker exists
  if (!fs.existsSync('.prevent-notion-setup')) {
    console.log("Warning: Prevention marker doesn't exist, creating it now");
    fs.writeFileSync('.prevent-notion-setup', 'true');
  } else {
    console.log("✅ Prevention marker file exists");
  }
  
  // Try to run the setup script
  console.log("\nAttempting to run setup script (this should be prevented):");
  const output = execSync('tsx server/setup-notion.ts', { encoding: 'utf8' });
  console.log(output);
  
  // Check if our modifications are working properly
  if (output.includes("Not creating") && output.includes("to prevent data loss in remixed projects")) {
    console.log("\n✅ Success! Database creation is properly prevented");
    console.log("The setup script is properly respecting the prevention mechanism");
  } else if (output.includes("Existing Notion databases detected")) {
    console.log("\n✅ Success! Database creation is properly prevented");
    console.log("The setup script detected the prevention marker and stopped execution");
  } else {
    console.log("\n❌ Warning: Could not confirm the database creation prevention");
    console.log("Check the output above to see what happened");
  }
} catch (error) {
  console.error("Error running test:", error.message);
  
  if (error.stdout) {
    console.log("\nOutput from script:");
    console.log(error.stdout);
  }
  
  if (error.stderr) {
    console.log("\nErrors from script:");
    console.log(error.stderr);
  }
}