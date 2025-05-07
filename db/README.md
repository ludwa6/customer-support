# Database

This application uses Notion for data storage instead of a SQL database.

All data is stored in Notion databases via the Notion API. The SQL database has been removed from the application.

## Migration

All SQL tables have been removed, and the application has been refactored to use Notion APIs exclusively for data storage.

## Notion API Integration

- Categories, articles, and FAQs are stored in Notion databases
- Support tickets are created in a Notion database
- All data access is handled through the Notion API