# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Meet MCP Server v3.0 - An advanced Model Context Protocol (MCP) server that interacts with Google Meet through Google Calendar API v3 and Google Meet API v2. This server provides comprehensive tools for creating and managing Google Meet meetings with advanced enterprise features including production monitoring, 21 validated tools, and TypeScript compilation.

## Common Development Commands

- **Start the server**: `npm run start`
- **Initial setup (OAuth authentication)**: `npm run setup`
- **Manual authentication with G_OAUTH_CREDENTIALS**: `G_OAUTH_CREDENTIALS="/path/to/credentials.json" npm run setup`
- **Install dependencies**: `npm install`
- **Test enhanced features**: `npm test`

Build commands available: `npm run build`, `npm run type-check`, `npm run start:js`

## Architecture

The project uses ES modules (`"type": "module"` in package.json) and follows this structure:

### Core Components

1. **src/index.ts** - Main MCP server implementation

   - Entry point for the application
   - Implements the MCP server using `@modelcontextprotocol/sdk`
   - Handles tool registration and request routing
   - Manages 21 tools across two APIs:
     - 6 Calendar API v3 tools: calendar*v3*\*
     - 15 Meet API v2 (GA) tools: meet*v2*\*
   - Includes v3.0 production monitoring system with health checks and metrics

2. **src/GoogleMeetAPI.ts** - Google Calendar and Meet API wrapper

   - Handles OAuth2 authentication with Google
   - Two distinct sections for different APIs:
     - Google Calendar API v3 methods (calendar events with guest permissions)
     - Google Meet API v2 methods (spaces, conference records, recordings)
   - Manages token persistence and refresh

3. **src/setup.ts** - Initial OAuth setup script
   - Runs the OAuth flow to obtain initial credentials
   - Saves tokens for future use

4. **src/monitoring/** - Production monitoring system (v3.0)
   - **healthCheck.ts** - Comprehensive health monitoring with OAuth, API, and system checks
   - **metrics.ts** - Advanced metrics collection with Prometheus format support
   - **apiMonitor.ts** - Real-time API call monitoring with rate limit detection

5. **src/endpoints/** - HTTP monitoring endpoints (v3.0)
   - **monitoring.ts** - HTTP server with 7 monitoring endpoints (/health, /metrics, etc.)

6. **src/validation/** - Zod validation system
   - **meetSchemas.ts** - Complete validation for all 21 tools with business logic

### Authentication Flow

The server requires Google OAuth2 credentials and supports two configuration methods:

**Primary Method (Recommended for Claude Desktop):**

1. Environment variable `G_OAUTH_CREDENTIALS` must be set to the path of credentials file
2. Token will be automatically saved to `{credentials_file}.token.json`
3. Initial setup: `G_OAUTH_CREDENTIALS="/path/to/credentials.json" npm run setup`

**Legacy Method:**

1. Environment variables `GOOGLE_MEET_CREDENTIALS_PATH` and `GOOGLE_MEET_TOKEN_PATH` must be set
2. Initial setup via `npm run setup` to obtain OAuth tokens

**Both methods:**

- Tokens are persisted and automatically refreshed when expired
- Required scopes:
  - `https://www.googleapis.com/auth/calendar` - Calendar management
  - `https://www.googleapis.com/auth/meetings.space.created` - Create Meet spaces
  - `https://www.googleapis.com/auth/meetings.space.readonly` - Read space information
  - `https://www.googleapis.com/auth/meetings.space.settings` - Configure advanced features

### MCP Protocol Implementation

- Uses stdio transport for communication
- Implements standard MCP tool handlers
- All responses are JSON formatted
- Error handling includes both MCP errors and Google API errors

## Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `googleapis` - Google Calendar API client
- `open` - For opening browser during OAuth flow

## API Organization (v2.0)

### Google Calendar API v3 Tools

- **calendar_v3_list_events** - List calendar events with optional Meet links
- **calendar_v3_get_event** - Get event details including guest permissions
- **calendar_v3_create_event** - Create events with Meet conferences and guest permissions
- **calendar_v3_update_event** - Update events including all guest settings
- **calendar_v3_delete_event** - Delete calendar events

### Google Meet API v2 Tools (Generally Available)

- **meet_v2_create_space** - Create Meet spaces with advanced configuration
- **meet_v2_get_space** - Get space details
- **meet_v2_update_space** - Update space configuration
- **meet_v2_end_active_conference** - End active conferences
- **meet_v2_list_conference_records** - List historical conference records
- **meet_v2_get_conference_record** - Get specific conference details
- **meet_v2_list_recordings** - List conference recordings
- **meet_v2_get_recording** - Get recording details
- **meet_v2_list_transcripts** - List conference transcripts
- **meet_v2_get_transcript** - Get transcript details
- **meet_v2_list_transcript_entries** - List individual speech segments

## Enhanced Features (v2.0)

### Calendar Event Guest Permissions

- `guest_can_invite_others` - Control if guests can invite others
- `guest_can_modify` - Control if guests can modify the event
- `guest_can_see_other_guests` - Control guest list visibility

### Space Configuration Options

- **Access Types**: OPEN, TRUSTED, RESTRICTED
- **Moderation**: Enable/disable moderation mode
- **Restrictions**: Chat and presentation restrictions
- **Artifacts**: Recording, transcription, smart notes configuration
- **Default Roles**: Viewer-only mode for participants

### Requirements

- Google Workspace Business Standard or higher for advanced features
- Gemini license for smart notes functionality
- Manual activation required for recording during meetings

### Example Usage

```javascript
// Create calendar event with Meet conference
await calendar_v3_create_event({
  summary: "Team Meeting",
  start_time: "2024-02-01T10:00:00Z",
  end_time: "2024-02-01T11:00:00Z",
  create_meet_conference: true,
  guest_can_invite_others: false,
  guest_can_modify: false,
});

// Create advanced Meet space
await meet_v2_create_space({
  access_type: "RESTRICTED",
  enable_recording: true,
  enable_transcription: true,
  moderation_mode: "ON",
  chat_restriction: "HOSTS_ONLY",
});
```

## Environment Configuration

Create a `.env` file in your project root or set environment variables:

```bash
# Primary configuration (recommended for Claude Desktop)
G_OAUTH_CREDENTIALS="/path/to/your/credentials.json"

# Alternative configuration for local development
GOOGLE_MEET_CREDENTIALS_PATH="/path/to/your/credentials.json"
GOOGLE_MEET_TOKEN_PATH="./token.json"
```

## Important Notes

- Advanced features are implemented via direct REST API calls
- Recording and transcription features are documented in meeting descriptions
- Use `G_OAUTH_CREDENTIALS` environment variable for simplified configuration
- The token file is automatically created adjacent to the credentials file when using `G_OAUTH_CREDENTIALS`
