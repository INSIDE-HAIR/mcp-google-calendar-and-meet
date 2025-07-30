# Google Meet MCP Server v2.0

[![smithery badge](https://smithery.ai/badge/@cool-man-vk/google-meet-mcp-server)](https://smithery.ai/server/@cool-man-vk/google-meet-mcp-server)

An advanced Model Context Protocol (MCP) server for comprehensive Google Meet management through Google Calendar API v3 and Google Meet API v2/v2beta. This server provides enterprise-grade tools for creating, managing, and configuring Google Meet meetings with advanced features like co-hosts, transcription, smart notes, and moderation controls.

## 🚀 What's New in v2.0

### Clear API Separation
- 📅 **Google Calendar API v3** - Full calendar event management with guest permissions
- 🎥 **Google Meet API v2 (GA)** - Space management and conference records
- 🧪 **Google Meet API v2beta** - Advanced member management and co-host features

### Enterprise Features
- 👥 **Co-host Management** - Assign co-hosts with specific roles
- 📝 **Auto-Transcription** - Enable automatic meeting transcription
- 🧠 **Smart Notes** - AI-generated meeting summaries with Gemini
- 📊 **Attendance Reports** - Generate detailed attendance tracking
- 🛡️ **Meeting Moderation** - Chat/presentation restrictions and controls
- 👀 **Viewer Mode** - Force participants to join as viewers by default

### Advanced Space Management
- 🏗️ **Google Meet Spaces** - Direct space creation and configuration
- 👤 **Member Roles** - Manage HOST, COHOST, MEMBER, and VIEWER roles
- 🔒 **Access Controls** - OPEN, TRUSTED, or RESTRICTED access types
- ⚙️ **Artifact Configuration** - Recording, transcription, and smart notes settings

## Description

This project implements a comprehensive MCP server that allows AI agents to interact with Google Meet using both Google Calendar API v3 and Google Meet API v2/v2beta. It leverages the MCP (Model Context Protocol) specification to expose enterprise-grade meeting management capabilities for compatible AI systems like Claude Desktop.

## Installation

### Installing via Smithery

To install Google Meet MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@cool-man-vk/google-meet-mcp-server):

```bash
npx -y @smithery/cli install @cool-man-vk/google-meet-mcp-server --client claude
```

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/INSIDE-HAIR/mcp-google-meet.git

# Navigate to the project directory
cd mcp-google-meet

# Install dependencies
npm install
```

## Setup

Before using the Google Meet MCP server, you need to set up your Google API credentials:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google Meet API (for advanced features)
4. Create OAuth 2.0 credentials (Desktop application)
5. Download the credentials JSON file
6. Set the environment variables with the paths to your credentials:
   ```bash
   export GOOGLE_MEET_CREDENTIALS_PATH="/path/to/your/credentials.json"
   export GOOGLE_MEET_TOKEN_PATH="./token.json"
   ```
7. Run the setup script to authenticate and generate the token:
   ```bash
   npm run setup
   ```

This will request authorization for the following scopes:
- `https://www.googleapis.com/auth/calendar` - Calendar management
- `https://www.googleapis.com/auth/meetings.space.created` - Create Meet spaces
- `https://www.googleapis.com/auth/meetings.space.readonly` - Read space information
- `https://www.googleapis.com/auth/meetings.space.settings` - Configure advanced features

### Automatic Authentication (MCP/Claude Desktop)

When using this server through Claude Desktop or other MCP clients, the server will automatically handle authentication:

1. **First time setup**: If no token exists, the server will:
   - Automatically open your browser to Google's authorization page
   - Start a temporary local server to receive the OAuth callback
   - Save the authentication token automatically
   - Continue with normal operation

2. **Subsequent runs**: The server will use the saved token and refresh it automatically when needed.

## Usage

Once setup is complete, you can start the MCP server:

```bash
npm run start
```

### Testing Enhanced Features

Run the comprehensive test suite to validate all functionality:

```bash
npm test
```

## Available Tools

### 📅 Google Calendar API v3 Tools

#### 1. `calendar_v3_list_events`
List upcoming calendar events (including those with Google Meet conferences).

**Parameters:**
- `max_results` (optional): Maximum number of results to return (default: 10)
- `time_min` (optional): Start time in ISO format (default: now)
- `time_max` (optional): End time in ISO format

#### 2. `calendar_v3_get_event`
Get detailed information about a specific calendar event.

**Parameters:**
- `event_id` (required): ID of the calendar event to retrieve

#### 3. `calendar_v3_create_event`
Create a new calendar event with optional Google Meet conference and guest permissions.

**Parameters:**
- `summary` (required): Title of the event
- `start_time` (required): Start time in ISO format
- `end_time` (required): End time in ISO format
- `description` (optional): Description for the event
- `location` (optional): Location for the event
- `time_zone` (optional): Time zone (default: UTC)
- `attendees` (optional): Array of email addresses for attendees
- `create_meet_conference` (optional): Create Google Meet conference for this event
- `guest_can_invite_others` (optional): Allow guests to invite others (default: true)
- `guest_can_modify` (optional): Allow guests to modify the event (default: false)
- `guest_can_see_other_guests` (optional): Allow guests to see other attendees (default: true)

**Example:**
```javascript
{
  "summary": "Team Sync",
  "start_time": "2024-02-01T10:00:00Z",
  "end_time": "2024-02-01T11:00:00Z",
  "location": "Virtual Meeting Room",
  "time_zone": "America/New_York",
  "create_meet_conference": true,
  "guest_can_invite_others": false,
  "guest_can_modify": false,
  "guest_can_see_other_guests": true
}
```

#### 4. `calendar_v3_update_event`
Update an existing calendar event.

**Parameters:**
- `event_id` (required): ID of the event to update
- All optional parameters from `calendar_v3_create_event`

#### 5. `calendar_v3_delete_event`
Delete a calendar event.

**Parameters:**
- `event_id` (required): ID of the event to delete

### 🎥 Google Meet API v2 Tools (Generally Available)

#### 6. `meet_v2_create_space`
Create a Google Meet space with advanced configuration.

**Parameters:**
- `access_type` (optional): "OPEN" | "TRUSTED" | "RESTRICTED" (default: "TRUSTED")
- `enable_recording` (optional): Enable automatic recording
- `enable_transcription` (optional): Enable automatic transcription
- `enable_smart_notes` (optional): Enable smart notes with Gemini
- `attendance_report` (optional): Enable attendance report generation
- `moderation_mode` (optional): "ON" | "OFF" (default: "OFF")
- `chat_restriction` (optional): "HOSTS_ONLY" | "NO_RESTRICTION"
- `present_restriction` (optional): "HOSTS_ONLY" | "NO_RESTRICTION"
- `default_join_as_viewer` (optional): Join participants as viewers by default

**Example:**
```javascript
{
  "access_type": "RESTRICTED",
  "enable_recording": true,
  "enable_transcription": true,
  "enable_smart_notes": true,
  "attendance_report": true,
  "moderation_mode": "ON",
  "chat_restriction": "HOSTS_ONLY",
  "present_restriction": "HOSTS_ONLY",
  "default_join_as_viewer": true
}
```

#### 7. `meet_v2_get_space`
Get details of a Google Meet space.

**Parameters:**
- `space_name` (required): Name of the space (spaces/{space_id})

#### 8. `meet_v2_update_space`
Update configuration of a Google Meet space.

**Parameters:**
- `space_name` (required): Name of the space (spaces/{space_id})
- `access_type` (optional): Updated access type
- `moderation_mode` (optional): Updated moderation mode
- `chat_restriction` (optional): Updated chat restriction
- `present_restriction` (optional): Updated presentation restriction

#### 9. `meet_v2_end_active_conference`
End the active conference in a Google Meet space.

**Parameters:**
- `space_name` (required): Name of the space (spaces/{space_id})

#### 10. `meet_v2_list_conference_records`
List conference records for historical meetings.

**Parameters:**
- `filter` (optional): Filter for conference records (e.g., space.name="spaces/{space_id}")
- `page_size` (optional): Maximum number of results (default: 10, max: 50)

#### 11. `meet_v2_get_conference_record`
Get details of a specific conference record.

**Parameters:**
- `conference_record_name` (required): Name of the conference record (conferenceRecords/{record_id})

#### 12. `meet_v2_list_recordings`
List recordings for a conference record.

**Parameters:**
- `conference_record_name` (required): Name of the conference record (conferenceRecords/{record_id})

#### 13. `meet_v2_get_recording`
Get details of a specific recording.

**Parameters:**
- `recording_name` (required): Name of the recording (conferenceRecords/{record_id}/recordings/{recording_id})

#### 14. `meet_v2_list_transcripts`
List transcripts for a conference record.

**Parameters:**
- `conference_record_name` (required): Name of the conference record

#### 15. `meet_v2_get_transcript`
Get details of a specific transcript.

**Parameters:**
- `transcript_name` (required): Name of the transcript

#### 16. `meet_v2_list_transcript_entries`
List transcript entries (individual speech segments).

**Parameters:**
- `transcript_name` (required): Name of the transcript
- `page_size` (optional): Maximum number of entries (default: 100, max: 1000)

### 🧪 Google Meet API v2beta Tools (Developer Preview)

#### 17. `meet_v2beta_create_member`
Add a member (co-host/member/viewer) to a Google Meet space.

**Parameters:**
- `space_name` (required): Name of the space (spaces/{space_id})
- `user_email` (required): Email address of the user to add
- `role` (optional): "COHOST" | "MEMBER" | "VIEWER" (default: "MEMBER")

**Example:**
```javascript
{
  "space_name": "spaces/abc123",
  "user_email": "cohost@company.com",
  "role": "COHOST"
}
```

#### 18. `meet_v2beta_list_members`
List members of a Google Meet space.

**Parameters:**
- `space_name` (required): Name of the space (spaces/{space_id})
- `page_size` (optional): Maximum number of members to return (default: 10, max: 100)

#### 19. `meet_v2beta_get_member`
Get details of a specific space member.

**Parameters:**
- `member_name` (required): Full name of the member (spaces/{space_id}/members/{member_id})

#### 20. `meet_v2beta_delete_member`
Remove a member from a Google Meet space.

**Parameters:**
- `member_name` (required): Full name of the member to remove

## MCP Configuration

To use this server with MCP-compatible systems, add the following to your MCP settings configuration file:

```json
{
  "mcpServers": {
    "google-meet": {
      "command": "node",
      "args": ["path/to/mcp-google-meet/src/index.js"],
      "env": {
        "GOOGLE_MEET_CREDENTIALS_PATH": "/path/to/your/credentials.json",
        "GOOGLE_MEET_TOKEN_PATH": "/path/to/your/token.json"
      },
      "disabled": false
    }
  }
}
```

## 🎯 Features

### Core Capabilities
- ✅ Create calendar events with optional Google Meet conferences
- ✅ List upcoming events with filtering options
- ✅ Retrieve detailed event information including Meet links
- ✅ Update existing events with guest permissions
- ✅ Delete calendar events
- ✅ Create and manage Google Meet spaces
- ✅ Configure advanced meeting settings

### v2.0 Enhanced Features
- ✅ **Co-host Assignment** - Automatically assign co-hosts to meetings
- ✅ **Auto-Recording** - Enable recording that starts automatically (requires manual activation)
- ✅ **Auto-Transcription** - Generate meeting transcripts automatically
- ✅ **Smart Notes** - AI-powered meeting summaries with Gemini
- ✅ **Attendance Tracking** - Generate detailed attendance reports
- ✅ **Meeting Moderation** - Control chat, presentation, and participant permissions
- ✅ **Viewer Mode** - Configure meetings where participants join as viewers by default
- ✅ **Guest Permissions** - Control what guests can do in calendar events
- ✅ **Historical Data Access** - Access conference records, recordings, and transcripts

### Requirements
- ✅ Zero configuration required (beyond initial Google OAuth setup)
- ✅ Automatic token refresh
- ✅ Works with any Google account
- ✅ Compatible with Claude Desktop and other MCP clients
- ✅ Enhanced features require Google Workspace Business Standard or higher

## Docker Support

You can also run this MCP server using Docker:

```bash
# Build the Docker image
docker build -t google-meet-mcp .

# Run the container with credentials mounted
docker run -it \
  -v /path/to/credentials.json:/app/credentials.json \
  -v /path/to/token.json:/app/token.json \
  -e GOOGLE_MEET_CREDENTIALS_PATH=/app/credentials.json \
  -e GOOGLE_MEET_TOKEN_PATH=/app/token.json \
  google-meet-mcp
```

## Development

### Project Structure
```
mcp-google-meet/
├── src/
│   ├── index.js           # Main MCP server implementation
│   ├── GoogleMeetAPI.js   # Google Calendar/Meet API wrapper
│   └── setup.js           # OAuth setup script
├── types.d.ts             # TypeScript definitions
├── package.json           # Project configuration
├── Dockerfile             # Docker configuration
└── README.md              # This file
```

### Running in Development
```bash
# Run the server
npm run start

# Run tests
npm test

# Run OAuth setup
npm run setup
```

## API Limitations

### Google Meet API v2beta
- Member management features are in Developer Preview
- Some advanced features require Google Workspace licenses
- Recording cannot be started programmatically (requires manual activation)
- Smart Notes require Gemini Business/Enterprise license

### Fallback Implementation
Since Google Meet API v2beta is not available in the googleapis library, advanced features are implemented through:
- Calendar API for basic meeting creation
- Descriptive documentation of features in meeting descriptions
- Simulated responses for space and member management

## Troubleshooting

### Authentication Issues
- Ensure your credentials file has the correct OAuth2 client configuration
- Check that all required scopes are authorized
- Delete `token.json` and re-run setup if permissions have changed

### Missing Features
- Some features require Google Workspace Business Standard or higher
- Recording and transcription must be manually activated during meetings
- Smart Notes require additional Gemini licensing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the GitHub issues page.

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Powered by Google Calendar API and Google Meet API
- Compatible with Claude Desktop and other MCP clients