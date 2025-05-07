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

    // Check required properties
    for (const requiredProp of schema.requiredProperties) {
      if (!database.properties[requiredProp]) {
        result.errors.push(`Missing required property: "${requiredProp}"`);
        result.properties.missing.push(requiredProp);
      }
    }

    // Validate property types and options
    for (const [propName, propConfig] of Object.entries(schema.propertyTypes)) {
      const property = database.properties[propName];
      
      if (propConfig.required && !property) {
        // Already logged above in required properties check
        continue;
      }

      if (property) {
        result.properties.present.push(propName);
        
        // Check property type
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
      } else if (!propConfig.required) {
        result.warnings.push(`Optional property "${propName}" is not present in the database`);
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