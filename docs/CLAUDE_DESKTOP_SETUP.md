# Claude Desktop Setup Guide

## ✅ Server Status: FUNCTIONAL

The import extension issues have been resolved and the server now starts successfully!

## Setup Instructions

### 1. Prerequisites

- Node.js installed
- Google OAuth credentials (JSON file)
- Claude Desktop installed

### 2. Server Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up OAuth authentication
export G_OAUTH_CREDENTIALS="/absolute/path/to/your/credentials.json"
npm run setup

# 3. Test server startup
npm run start
# Should show: "Google Meet MCP server starting on stdio..."
# Should show: "Google Meet MCP server connected"
```

### 3. Claude Desktop Configuration

Create or update `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-meet-mcp": {
      "command": "node",
      "args": ["--loader", "tsx/esm", "/ABSOLUTE/PATH/TO/google-meet-mcp-server/src/index.ts"],
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

The server provides 17 tools across two APIs:

### Google Calendar API v3 (6 tools)
- `calendar_v3_list_calendars` - List available calendars
- `calendar_v3_list_events` - List events with Meet links
- `calendar_v3_get_event` - Get event details
- `calendar_v3_create_event` - Create events with Meet conferences
- `calendar_v3_update_event` - Update existing events
- `calendar_v3_delete_event` - Delete events

### Google Meet API v2 (11 tools)
- **Spaces**: `meet_v2_create_space`, `meet_v2_get_space`, `meet_v2_update_space`, `meet_v2_end_active_conference`
- **Records**: `meet_v2_list_conference_records`, `meet_v2_get_conference_record`
- **Recordings**: `meet_v2_list_recordings`, `meet_v2_get_recording`
- **Transcripts**: `meet_v2_list_transcripts`, `meet_v2_get_transcript`, `meet_v2_list_transcript_entries`

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