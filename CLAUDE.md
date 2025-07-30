# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Meet MCP Server v2.0 - An advanced Model Context Protocol (MCP) server that interacts with Google Meet through Google Calendar API v3 and Google Meet API v2/v2beta. This server provides comprehensive tools for creating and managing Google Meet meetings with advanced enterprise features.

## Common Development Commands

- **Start the server**: `npm run start`
- **Initial setup (OAuth authentication)**: `npm run setup`
- **Manual authentication with G_OAUTH_CREDENTIALS**: `G_OAUTH_CREDENTIALS="/path/to/credentials.json" npm run setup`
- **Install dependencies**: `npm install`
- **Test enhanced features**: `npm test`

Note: No lint or build commands are currently configured in package.json.

## Architecture

The project uses ES modules (`"type": "module"` in package.json) and follows this structure:

### Core Components

1. **src/index.js** - Main MCP server implementation
   - Entry point for the application
   - Implements the MCP server using `@modelcontextprotocol/sdk`
   - Handles tool registration and request routing
   - Manages 21 tools across three APIs:
     - 5 Calendar API v3 tools: calendar_v3_*
     - 12 Meet API v2 (GA) tools: meet_v2_*
     - 4 Meet API v2beta tools: meet_v2beta_*

2. **src/GoogleMeetAPI.js** - Google Calendar and Meet API wrapper
   - Handles OAuth2 authentication with Google
   - Three distinct sections for different APIs:
     - Google Calendar API v3 methods (calendar events with guest permissions)
     - Google Meet API v2 methods (spaces, conference records, recordings)
     - Google Meet API v2beta methods (member management)
   - Provides fallback implementations since Meet API v2beta isn't available in googleapis
   - Manages token persistence and refresh

3. **src/setup.js** - Initial OAuth setup script
   - Runs the OAuth flow to obtain initial credentials
   - Saves tokens for future use

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

### Google Meet API v2beta Tools (Developer Preview)
- **meet_v2beta_create_member** - Add members with roles (COHOST/MEMBER/VIEWER)
- **meet_v2beta_list_members** - List space members
- **meet_v2beta_get_member** - Get member details
- **meet_v2beta_delete_member** - Remove space members

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
  guest_can_modify: false
});

// Create advanced Meet space
await meet_v2_create_space({
  access_type: "RESTRICTED",
  enable_recording: true,
  enable_transcription: true,
  moderation_mode: "ON",
  chat_restriction: "HOSTS_ONLY"
});

// Add co-host to space
await meet_v2beta_create_member({
  space_name: "spaces/abc123",
  user_email: "cohost@company.com",
  role: "COHOST"
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

- Google Meet API v2beta is not available in the googleapis library
- Advanced features are implemented via fallback methods
- Recording and transcription features are documented in meeting descriptions
- Member management returns simulated data for compatibility
- Use `G_OAUTH_CREDENTIALS` environment variable for simplified configuration
- The token file is automatically created adjacent to the credentials file when using `G_OAUTH_CREDENTIALS`