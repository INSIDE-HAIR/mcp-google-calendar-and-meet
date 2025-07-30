# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Meet MCP Server v2.0 - An enhanced Model Context Protocol (MCP) server that interacts with Google Meet through both Google Calendar API and Google Meet API v2beta. This server provides comprehensive tools for creating and managing Google Meet meetings with advanced enterprise features.

## Common Development Commands

- **Start the server**: `npm run start`
- **Initial setup (OAuth authentication)**: `npm run setup`
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
   - Manages 10 tools: list_meetings, get_meeting, create_meeting, update_meeting, delete_meeting, get_meeting_recordings, list_space_members, get_space_member, add_space_members, remove_space_member

2. **src/GoogleMeetAPI.js** - Google Calendar and Meet API wrapper
   - Handles OAuth2 authentication with Google
   - Provides methods for CRUD operations on calendar events with Google Meet
   - Integrates with Google Meet API v2beta for advanced features
   - Supports comprehensive meeting configuration (recording, transcription, smart notes)
   - Manages co-hosts and space members
   - Implements moderation and space configuration features
   - Manages token persistence and refresh

3. **src/setup.js** - Initial OAuth setup script
   - Runs the OAuth flow to obtain initial credentials
   - Saves tokens for future use

### Authentication Flow

The server requires Google OAuth2 credentials with enhanced scopes:
1. Environment variables `GOOGLE_MEET_CREDENTIALS_PATH` and `GOOGLE_MEET_TOKEN_PATH` must be set
2. Initial setup via `npm run setup` to obtain OAuth tokens
3. Tokens are persisted and automatically refreshed when expired
4. Additional scopes required for v2beta features:
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.space.readonly`

### MCP Protocol Implementation

- Uses stdio transport for communication
- Implements standard MCP tool handlers
- All responses are JSON formatted
- Error handling includes both MCP errors and Google API errors

## Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `googleapis` - Google Calendar API and Meet API v2beta client
- `open` - For opening browser during OAuth flow

## Enhanced Features (v2.0)

### Advanced Meeting Configuration
- **Recording**: `enable_recording: true` - Auto-start recording
- **Transcription**: `enable_transcription: true` - Auto-enable transcription
- **Smart Notes**: `enable_smart_notes: true` - Auto-generate meeting notes
- **Co-hosts**: `co_hosts: ['email1', 'email2']` - Assign co-host roles
- **Attendance Reports**: `attendance_report: true` - Generate attendance reports

### Space Management
- **Member Management**: Add/remove/list space members with specific roles
- **Moderation Settings**: Configure chat/presentation restrictions
- **Join Settings**: Control default join behavior (viewer/participant)

### Requirements
- Google Workspace Business Standard or higher for advanced features
- Additional OAuth scopes for space management
- Google Meet API v2beta integration

### New Tools Available
1. `list_space_members` - List members of a Google Meet space
2. `get_space_member` - Get details of a specific space member
3. `add_space_members` - Add members to a space with roles (COHOST/MEMBER/VIEWER)
4. `remove_space_member` - Remove a member from a space

### Example Usage
```javascript
// Create meeting with all features
await create_meeting({
  summary: "Enterprise Meeting",
  start_time: "2024-01-01T10:00:00Z",
  end_time: "2024-01-01T11:00:00Z",
  co_hosts: ["cohost@company.com"],
  enable_recording: true,
  enable_transcription: true,
  enable_smart_notes: true,
  attendance_report: true,
  space_config: {
    moderation_mode: "ON",
    chat_restriction: "HOSTS_ONLY",
    present_restriction: "HOSTS_ONLY"
  },
  guest_permissions: {
    can_invite_others: false,
    can_modify: false,
    can_see_other_guests: true
  }
});
```