# Replit.md - SerenityFlow Documentation Portal

## Overview

This is a customer support portal called "SerenityFlow Documentation Portal" (rebranded as "Quinta Vale da Lama" in the frontend) that provides AI-powered customer support through Notion databases for dynamic documentation and intelligent ticket management. The application integrates with Notion for data storage and uses OpenAI for intelligent chat assistance.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: Notion API (replacing traditional SQL database)
- **File Storage**: Local filesystem with Multer for file uploads
- **API Integration**: 
  - Notion API for data operations
  - OpenAI API for chat assistance
- **Validation**: Zod schemas for data validation

### Data Storage Strategy
- **Primary Storage**: Notion databases instead of traditional SQL
- **Database Migration**: Application has been migrated from PostgreSQL/Drizzle to Notion API
- **Backup References**: SQL schemas maintained in `shared/schema.ts` for reference

## Key Components

### Core Services
1. **Notion Integration** (`server/services/notion.ts`)
   - Handles all Notion API operations
   - Provides CRUD operations for categories, articles, and FAQs
   - Includes database schema validation

2. **Ticket Management** (`server/services/notion-tickets.ts`)
   - Manages support tickets in Notion databases
   - Provides ticket creation, retrieval, and status updates

3. **AI Chat Assistant** (`server/services/openai.ts`)
   - Integrates with OpenAI API for intelligent responses
   - Uses FAQ data as context for better responses
   - Determines when to redirect users to support

4. **Database Validation** (`server/services/notion-validation.ts`)
   - Validates Notion database schemas against expected structures
   - Provides detailed error reporting for schema mismatches

### Frontend Components
1. **Chat Assistant** (`client/src/components/ChatAssistant.tsx`)
   - Real-time chat interface with AI assistance
   - Persistent chat history during session

2. **Documentation System** (`client/src/components/DocumentationSection.tsx`)
   - Category-based article organization
   - Search functionality across all content

3. **Ticket Submission** (`client/src/components/TicketForm.tsx`)
   - Form for creating support tickets
   - File upload support for attachments

4. **FAQ Management** (`client/src/components/FAQSection.tsx`)
   - Accordion-style FAQ display
   - Category filtering capabilities

## Data Flow

### Setup and Configuration
1. **Database Detection**: `list-databases.ts` scans Notion page for existing databases
2. **Configuration**: `notion-config.json` stores database IDs and mappings
3. **Validation**: Schema validation ensures database compatibility
4. **Auto-setup**: Multiple setup scripts handle different deployment scenarios

### User Interactions
1. **Search**: Users search across articles and FAQs stored in Notion
2. **Chat**: AI assistant queries FAQ data from Notion for context
3. **Tickets**: Support tickets are created directly in Notion databases
4. **Navigation**: Categories and articles are dynamically loaded from Notion

### Data Synchronization
- Real-time data fetching from Notion APIs
- Client-side caching with TanStack Query
- Automatic schema validation on database operations

## External Dependencies

### Required APIs
- **Notion API**: Core data storage and retrieval
  - Requires `NOTION_INTEGRATION_SECRET`
  - Requires `NOTION_PAGE_URL`
- **OpenAI API**: Chat assistance functionality
  - Requires `OPENAI_API_KEY`

### Optional Services
- **Database**: PostgreSQL connection maintained for legacy compatibility
  - `DATABASE_URL` environment variable
- **File Upload**: Local storage for ticket attachments

### Development Tools
- **Drizzle ORM**: Database schema management (legacy)
- **ESBuild**: Production build optimization
- **TypeScript**: Type safety across the application

## Deployment Strategy

### Environment Setup
1. **Notion Configuration**:
   - Create Notion integration at https://www.notion.so/my-integrations
   - Duplicate template page with pre-configured databases
   - Connect integration to the duplicated page

2. **Environment Variables**:
   - `NOTION_INTEGRATION_SECRET`: Notion API key
   - `NOTION_PAGE_URL`: URL of the Notion page containing databases
   - `OPENAI_API_KEY`: OpenAI API key for chat functionality
   - `DATABASE_URL`: PostgreSQL connection (optional, for legacy support)

### Setup Scripts
- `auto-setup.js`: Automatic database detection and configuration
- `setup-remix.js`: Specialized setup for remixed projects
- `agent-remix-setup.js`: Agent-specific setup for Replit remixes
- `list-databases.ts`: Database discovery and validation

### Build Process
1. **Development**: `npm run dev` - Uses Vite dev server with HMR
2. **Production Build**: `npm run build` - Builds client and server bundles
3. **Production Start**: `npm run start` - Runs production server

### Configuration Management
- Configuration stored in `notion-config.json`
- Automatic database ID detection and mapping
- Schema validation before operations
- Prevention of duplicate database creation in remixed projects

## Changelog

- July 05, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.