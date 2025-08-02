# Claude Desktop Setup Guide

## ✅ Server Status: FUNCTIONAL

Google Meet MCP Server v3.0 with direct token authentication support!

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Google OAuth credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)
- Claude Desktop installed

### 2. Authentication Setup (Two Methods)

#### Method 1: Direct Token Authentication (Recommended)
```bash
# 1. Install dependencies
npm install

# 2. Use direct tokens - no file setup needed!
# Get your tokens from Google Cloud Console OAuth2 setup
```

#### Method 2: File-based Authentication (Legacy)
```bash
# 1. Install dependencies
npm install

# 2. Set up OAuth authentication with credentials file
export G_OAUTH_CREDENTIALS="/absolute/path/to/your/credentials.json"
npm run setup

# 3. Test server startup
npm run start
```

### 3. Claude Desktop Configuration

#### Option A: Direct Token Configuration (Recommended)
Create or update `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-meet-mcp": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/google-meet-mcp-server/src/index.ts"],
      "env": {
        "CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "CLIENT_SECRET": "GOCSPX-your-client-secret",
        "REFRESH_TOKEN": "1//your-refresh-token"
      }
    }
  }
}
```

#### Option B: File-based Configuration (Legacy)
```json
{
  "mcpServers": {
    "google-meet-mcp": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/google-meet-mcp-server/src/index.ts"],
      "env": {
        "G_OAUTH_CREDENTIALS": "/ABSOLUTE/PATH/TO/credentials.json"
      }
    }
  }
}
```

**Important**: Use absolute paths, not relative paths!

### 4. Verification

1. Restart Claude Desktop completely
2. Open a new conversation
3. Check that Claude shows Google Meet tools available
4. Test a simple operation like listing calendars

## Available Tools

The server provides 23 tools across two APIs:

### Google Calendar API v3 (6 tools)
- `calendar_v3_list_calendars` - List available calendars
- `calendar_v3_list_events` - List events with Meet links
- `calendar_v3_get_event` - Get event details
- `calendar_v3_create_event` - Create events with Meet conferences
- `calendar_v3_update_event` - Update existing events
- `calendar_v3_delete_event` - Delete events

### Google Meet API v2 (17 tools)
- **Spaces**: `meet_v2_create_space`, `meet_v2_get_space`, `meet_v2_update_space`, `meet_v2_end_active_conference`
- **Records**: `meet_v2_list_conference_records`, `meet_v2_get_conference_record`
- **Recordings**: `meet_v2_list_recordings`, `meet_v2_get_recording`
- **Transcripts**: `meet_v2_list_transcripts`, `meet_v2_get_transcript`, `meet_v2_list_transcript_entries`
- **Participants**: `meet_v2_list_participants`, `meet_v2_get_participant`
- **Participant Sessions**: `meet_v2_list_participant_sessions`, `meet_v2_get_participant_session`
- **Activities**: `meet_v2_list_activities`, `meet_v2_get_activity`

## Features

✅ **TypeScript Support** - Full type safety and IntelliSense  
✅ **Input Validation** - Zod schemas for parameter validation  
✅ **Error Handling** - Claude Desktop-friendly error messages  
✅ **Advanced Meet Features** - Recording, transcription, moderation  
✅ **Enterprise Features** - Access controls, participant management

## Troubleshooting

### Server won't start
- Check that all import extensions use `.js` (not `.ts`)
- Verify Node.js and npm are installed
- Run `npm install` to ensure dependencies

### Authentication issues
- Verify `G_OAUTH_CREDENTIALS` points to valid JSON file
- Re-run `npm run setup` if token is expired
- Check Google Cloud Console for API permissions

### Claude Desktop doesn't show tools
- Use absolute paths in config
- Restart Claude Desktop completely
- Check that server starts without errors manually

## Success Indicators

When working correctly:
- Server starts with "Google Meet MCP server connected"
- Claude Desktop shows Google Meet tools
- No import or TypeScript errors
- Authentication flows work seamlessly