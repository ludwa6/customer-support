/**
 * Notion database schema validation service
 * 
 * This service provides functions to validate Notion database schemas
 * against expected configurations to ensure they have the required
 * properties and types.
 */

import { Client } from "@notionhq/client";
import { DATABASE_SCHEMAS } from '../types/notion-schemas';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  properties: {
    present: string[];
    missing: string[];
    incorrect: string[];
  }
}

/**
 * Validates a Notion database schema against the expected configuration
 * 
 * @param notion - The Notion client
 * @param databaseId - The ID of the database to validate
 * @param databaseType - The type of database (must match a key in DATABASE_SCHEMAS)
 * @returns ValidationResult object with validation details
 */
export async function validateDatabaseSchema(
  notion: Client,
  databaseId: string,
  databaseType: string
): Promise<ValidationResult> {
  const schema = DATABASE_SCHEMAS[databaseType];
  
  // Initialize the validation result
  const result: ValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
    properties: {
      present: [],
      missing: [],
      incorrect: []
    }
  };
  
  // Check if we have a schema definition for this database type
  if (!schema) {
    result.errors.push(`No schema defined for database type: ${databaseType}`);
    return result;
  }

  try {
    // Fetch database info from Notion
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });

    // Check if database was retrieved
    if (!database || !database.properties) {
      result.errors.push(`Could not retrieve database with ID: ${databaseId}`);
      return result;
    }

    // First build a map of required property types for easier checking
    // For example, we need a title property for questions but it could be named
    // "Question", "question", "Title", etc.
    const requiredPropertyTypes = new Map<string, string[]>();
    
    // Initialize with empty arrays for each type
    requiredPropertyTypes.set('title', []);
    requiredPropertyTypes.set('rich_text', []);
    requiredPropertyTypes.set('select', []);
    requiredPropertyTypes.set('email', []);
    requiredPropertyTypes.set('date', []);
    requiredPropertyTypes.set('checkbox', []);
    
    // Organize required properties by their type
    for (const [propName, propConfig] of Object.entries(schema.propertyTypes)) {
      if (propConfig.required) {
        const propsOfType = requiredPropertyTypes.get(propConfig.type) || [];
        propsOfType.push(propName);
        requiredPropertyTypes.set(propConfig.type, propsOfType);
      }
    }
    
    // Check if we have all required property types
    const dbPropertyTypes = new Map<string, string[]>();
    
    // Group database properties by type
    for (const [propName, property] of Object.entries(database.properties)) {
      const propsOfType = dbPropertyTypes.get(property.type) || [];
      propsOfType.push(propName);
      dbPropertyTypes.set(property.type, propsOfType);
    }
    
    // Check required property types
    for (const [type, requiredProps] of requiredPropertyTypes.entries()) {
      if (requiredProps.length > 0) {
        // We need at least one property of this type
        const dbProps = dbPropertyTypes.get(type) || [];
        
        if (dbProps.length === 0) {
          // Missing this property type completely
          result.errors.push(`Missing required property type: "${type}"`);
          result.properties.missing.push(...requiredProps);
        } else {
          // We have this type, but need to check if specific required properties exist
          // For FAQs, we handle specifically to allow alternate property names
          if (databaseType === 'faqs') {
            // For FAQs, we're more lenient - we just need properties of the right types
            // with common names pattern (e.g., Question or Title for the title property)
            
            // Check for the question/title property (title type)
            if (type === 'title' && requiredProps.includes('Question')) {
              const titleProps = dbProps.filter(prop => 
                prop.toLowerCase().includes('question') || 
                prop.toLowerCase().includes('title'));
              
              if (titleProps.length === 0) {
                result.errors.push('Missing title property for questions (no property with "question" or "title" in the name)');
                result.properties.missing.push('Question');
              } else {
                result.properties.present.push('Question');
              }
            }
            
            // Check for the answer/content property (rich_text type)
            if (type === 'rich_text' && requiredProps.includes('Answer')) {
              const contentProps = dbProps.filter(prop => 
                prop.toLowerCase().includes('answer') || 
                prop.toLowerCase().includes('content') ||
                prop.toLowerCase().includes('description'));
              
              if (contentProps.length === 0) {
                result.errors.push('Missing content property for answers (no property with "answer", "content", or "description" in the name)');
                result.properties.missing.push('Answer');
              } else {
                result.properties.present.push('Answer');
              }
            }
          } else {
            // For other database types, check the exact required properties
            for (const requiredProp of requiredProps) {
              if (!database.properties[requiredProp]) {
                result.errors.push(`Missing required property: "${requiredProp}"`);
                result.properties.missing.push(requiredProp);
              } else {
                result.properties.present.push(requiredProp);
              }
            }
          }
        }
      }
    }

    // Validate property types and options for existing properties
    for (const [propName, propConfig] of Object.entries(schema.propertyTypes)) {
      const property = database.properties[propName];
      
      if (!property) {
        // Skip properties that don't exist in the database
        // They've already been handled in the required properties check
        continue;
      }

      // Property exists, check its type
      if (property.type !== propConfig.type) {
        result.errors.push(
          `Property "${propName}" has wrong type. Expected "${propConfig.type}", got "${property.type}"`
        );
        result.properties.incorrect.push(propName);
      }

      // Check select options if applicable
      if (
        propConfig.type === 'select' && 
        propConfig.options && 
        property.type === 'select' &&
        property.select &&
        property.select.options
      ) {
        // For Support Tickets status, we won't warn about missing options
        // This allows users to customize their own status values
        if (!(databaseType === 'supportTickets' && propName === 'status')) {
          const existingOptions = new Set(property.select.options.map((o: any) => o.name));
          const missingOptions = propConfig.options.filter(
            option => !existingOptions.has(option)
          );
          
          if (missingOptions.length > 0) {
            result.warnings.push(
              `Property "${propName}" is missing select options: ${missingOptions.join(', ')}`
            );
          }
        }
      }
    }

    // Check for extra properties not in our schema (just as informational)
    const extraProps = Object.keys(database.properties).filter(
      prop => !Object.keys(schema.propertyTypes).includes(prop)
    );
    
    if (extraProps.length > 0) {
      result.warnings.push(
        `Database contains additional properties not in schema: ${extraProps.join(', ')}`
      );
    }

    // Set isValid to true if there are no errors
    result.isValid = result.errors.length === 0;
    
    return result;
  } catch (error: any) {
    result.errors.push(`Error validating database: ${error.message}`);
    return result;
  }
}

/**
 * Prints a validation result to the console in a readable format
 * 
 * @param result - The validation result to print
 * @param databaseType - The type of database that was validated
 */
export function printValidationResult(result: ValidationResult, databaseType: string): void {
  if (result.isValid) {
    console.log(`✅ ${databaseType} database schema is valid`);
    
    if (result.warnings.length > 0) {
      console.log(`ℹ️ Warnings:`);
      result.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
  } else {
    console.error(`❌ ${databaseType} database schema is invalid`);
    
    if (result.errors.length > 0) {
      console.error(`Errors:`);
      result.errors.forEach(error => {
        console.error(`  - ${error}`);
      });
    }
    
    if (result.properties.missing.length > 0) {
      console.error(`Missing properties:`);
      result.properties.missing.forEach(prop => {
        console.error(`  - ${prop}`);
      });
    }
    
    if (result.properties.incorrect.length > 0) {
      console.error(`Incorrect property types:`);
      result.properties.incorrect.forEach(prop => {
        console.error(`  - ${prop}`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.warn(`Warnings:`);
      result.warnings.forEach(warning => {
        console.warn(`  - ${warning}`);
      });
    }
  }
}