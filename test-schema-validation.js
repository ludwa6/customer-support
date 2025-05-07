/**
 * Test script for Notion Database Schema Validation
 * 
 * This script tests the validation functionality by running the
 * validate-notion-schema.ts script and checking database schemas.
 */

// Run the schema validation script
const { spawn } = require('child_process');

console.log("🔍 Testing Notion database schema validation...");

// Execute the validation script
const validation = spawn('npx', ['tsx', 'server/validate-notion-schema.ts']);

// Capture output
validation.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
});

validation.stderr.on('data', (data) => {
  const errorOutput = data.toString();
  console.error(errorOutput);
});

validation.on('close', (code) => {
  console.log(`Schema validation complete with exit code ${code}`);
  
  if (code === 0) {
    console.log("✅ Schema validation test completed successfully!");
  } else {
    console.error("❌ Schema validation test failed - see errors above");
  }
});