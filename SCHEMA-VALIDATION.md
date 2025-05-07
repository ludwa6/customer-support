# Notion Database Schema Validation

This component provides validation for Notion database schemas to ensure they meet the requirements of the application.

## Overview

The schema validation system checks that Notion databases have the expected properties with correct types. This helps to:

- Catch configuration issues early
- Provide clear error messages about missing or incorrect properties
- Make the application more robust by validating schemas before operations
- Improve diagnostics when something goes wrong

## Components

### 1. Schema Definitions

Schema definitions are located in `server/types/notion-schemas.ts`. These define the expected structure for each type of database:

```typescript
export const DATABASE_SCHEMAS = {
  faqs: {
    requiredProperties: ['Question', 'Answer', 'CategoryId', 'CategoryName'],
    propertyTypes: {
      Question: { type: 'title', required: true },
      Answer: { type: 'rich_text', required: true },
      CategoryId: { type: 'rich_text', required: true },
      CategoryName: { type: 'rich_text', required: true }
    }
  },
  // Other database schemas...
}
```

### 2. Validation Service

The validation service is in `server/services/notion-validation.ts`. It provides functions to validate database schemas:

```typescript
const validationResult = await validateDatabaseSchema(
  notion,             // Notion client
  databaseId,         // Database ID to validate
  "supportTickets"    // Database type from schema definitions
);

if (validationResult.isValid) {
  console.log("Database schema is valid");
} else {
  console.error("Schema validation errors:", validationResult.errors);
}
```

### 3. Testing Tool

A standalone script for validating all databases is available at `server/validate-notion-schema.ts`.

## How to Use

### 1. Testing Your Database Schemas

To check if your Notion databases match the expected schemas:

```bash
node test-schema-validation.js
```

This will validate all your databases and provide detailed reports about any issues.

### 2. In Application Code

The validation is integrated into the application code. For example, in the support tickets functionality:

```typescript
// 1. When getting a database ID
const databaseId = await getSupportTicketsDatabase();
// This validates the schema before returning the ID

// 2. Before operations like adding a ticket
const result = await validateDatabaseSchema(notion, databaseId, "supportTickets");
if (!result.isValid) {
  console.warn("Database schema has issues:", result.errors);
  // Handle accordingly...
}
```

### 3. Customizing Schemas

To add a new database type or modify existing schema requirements:

1. Edit `server/types/notion-schemas.ts`
2. Add or modify the schema definition with required properties and types
3. Run validation to confirm your changes

## Validation Results

The validation provides detailed information about any issues:

- `isValid`: Boolean indicating if schema is valid
- `errors`: Array of error messages
- `warnings`: Non-critical issues that don't prevent operation
- `properties`: Details about present, missing, and incorrect properties

## Troubleshooting

If validation fails:

1. Check the error messages for specific missing or incorrect properties
2. Verify your Notion database has the required properties with correct types
3. If you need to use a different schema, update the schema definitions to match your actual Notion structure

Remember that the application will try to work with available properties even if validation fails, but certain critical properties are required for basic functionality.