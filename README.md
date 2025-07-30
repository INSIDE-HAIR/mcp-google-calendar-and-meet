# Google Meet MCP Server v2.0

[![smithery badge](https://smithery.ai/badge/@cool-man-vk/google-meet-mcp-server)](https://smithery.ai/server/@cool-man-vk/google-meet-mcp-server)

An advanced Model Context Protocol (MCP) server for comprehensive Google Meet management through Google Calendar API and Google Meet API v2beta. This server provides enterprise-grade tools for creating, managing, and configuring Google Meet meetings with advanced features like co-hosts, transcription, smart notes, and moderation controls.

## 🚀 What's New in v2.0

### Enterprise Features
- 👥 **Co-host Management** - Automatically assign co-hosts to meetings
- 📝 **Auto-Transcription** - Enable automatic meeting transcription
- 🧠 **Smart Notes** - AI-generated meeting summaries and notes
- 📊 **Attendance Reports** - Generate detailed attendance tracking
- 🛡️ **Meeting Moderation** - Chat/presentation restrictions and controls
- 👀 **Viewer Mode** - Force participants to join as viewers by default

### Advanced Space Management
- 🏗️ **Google Meet Spaces** - Direct integration with Meet API v2beta
- 👤 **Member Roles** - Manage COHOST, MEMBER, and VIEWER roles
- 🔒 **Access Controls** - Configure who can join and how
- ⚙️ **Real-time Configuration** - Dynamic meeting settings

## Description

This project implements a comprehensive MCP server that allows AI agents to interact with Google Meet using both Google Calendar API and Google Meet API v2beta. It leverages the MCP (Model Context Protocol) specification to expose enterprise-grade meeting management capabilities for compatible AI systems like Claude Desktop.

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

### Core Meeting Management

#### 1. `list_meetings`
List upcoming Google Meet meetings from your calendar.

**Parameters:**
- `max_results` (optional): Maximum number of results to return (default: 10)
- `time_min` (optional): Start time in ISO format (default: now)
- `time_max` (optional): End time in ISO format

#### 2. `get_meeting`
Get detailed information about a specific Google Meet meeting.

**Parameters:**
- `meeting_id` (required): ID of the meeting to retrieve

#### 3. `create_meeting` ✨ **Enhanced**
Create a new Google Meet meeting with advanced enterprise features.

**Basic Parameters:**
- `summary` (required): Title of the meeting
- `start_time` (required): Start time in ISO format
- `end_time` (required): End time in ISO format
- `description` (optional): Description for the meeting
- `attendees` (optional): Array of email addresses for attendees

**🆕 Advanced Parameters:**
- `co_hosts` (optional): Array of email addresses for co-hosts
- `enable_recording` (optional): Enable auto-recording (requires Google Workspace Business+)
- `enable_transcription` (optional): Enable auto-transcription
- `enable_smart_notes` (optional): Enable AI-generated meeting notes
- `attendance_report` (optional): Generate attendance reports
- `space_config` (optional): Advanced moderation settings
  - `moderation_mode`: "ON" | "OFF"
  - `chat_restriction`: "HOSTS_ONLY" | "NO_RESTRICTION"
  - `present_restriction`: "HOSTS_ONLY" | "NO_RESTRICTION"
  - `default_join_as_viewer`: boolean
- `guest_permissions` (optional): Calendar API guest permissions
  - `can_invite_others`: boolean (default: true)
  - `can_modify`: boolean (default: false)
  - `can_see_other_guests`: boolean (default: true)

**Example:**
```javascript
{
  "summary": "Board Meeting",
  "start_time": "2024-02-01T10:00:00Z",
  "end_time": "2024-02-01T11:00:00Z",
  "co_hosts": ["coo@company.com", "cto@company.com"],
  "enable_recording": true,
  "enable_transcription": true,
  "enable_smart_notes": true,
  "attendance_report": true,
  "space_config": {
    "moderation_mode": "ON",
    "chat_restriction": "HOSTS_ONLY",
    "present_restriction": "HOSTS_ONLY",
    "default_join_as_viewer": true
  },
  "guest_permissions": {
    "can_invite_others": false,
    "can_modify": false,
    "can_see_other_guests": true
  }
}
```

#### 4. `update_meeting`
Update an existing Google Meet meeting.

**Parameters:**
- `meeting_id` (required): ID of the meeting to update
- All optional parameters from `create_meeting`

#### 5. `delete_meeting`
Delete a Google Meet meeting.

**Parameters:**
- `meeting_id` (required): ID of the meeting to delete

### 🆕 Space Member Management

#### 6. `list_space_members`
List all members of a Google Meet space.

**Parameters:**
- `space_name` (required): Name of the space (spaces/{space_id})

#### 7. `get_space_member`
Get details of a specific space member.

**Parameters:**
- `member_name` (required): Full name of the member (spaces/{space}/members/{member})

#### 8. `add_space_members`
Add members to a Google Meet space with specific roles.

**Parameters:**
- `space_name` (required): Name of the space
- `member_emails` (required): Array of email addresses to add
- `role` (optional): "COHOST" | "MEMBER" | "VIEWER" (default: "MEMBER")

#### 9. `remove_space_member`
Remove a member from a Google Meet space.

**Parameters:**
- `member_name` (required): Full name of the member to remove

### Recording & Analytics

#### 10. `get_meeting_recordings`
Get recording information for a Google Meet meeting (requires Google Workspace).

**Parameters:**
- `meeting_code` (required): The meeting code from the Google Meet URL

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
- ✅ Create Google Meet meetings with custom settings
- ✅ List upcoming meetings with filtering options
- ✅ Retrieve detailed meeting information including join URLs
- ✅ Update existing meetings (title, time, description, attendees)
- ✅ Delete meetings
- ✅ Automatic Google Meet link generation for all calendar events

### 🆕 Enterprise Features (v2.0)
- 👥 **Co-host Assignment** - Automatically promote users to co-hosts
- 📝 **Auto-Transcription** - Enable real-time transcription services
- 🧠 **Smart Notes** - AI-powered meeting summaries and action items
- 📊 **Attendance Tracking** - Detailed participant analytics and reports
- 🛡️ **Meeting Moderation** - Host-only chat, presentation controls
- 👀 **Viewer Controls** - Force participants to join as viewers
- 🏗️ **Direct Space Management** - Google Meet API v2beta integration
- 🔐 **Advanced Access Controls** - Fine-grained permission management

### Space Management
- 🏢 **Enterprise Spaces** - Create spaces with full configuration
- 👤 **Role Management** - COHOST, MEMBER, VIEWER role assignment
- 📋 **Member Operations** - Add, remove, list space members
- ⚙️ **Real-time Config** - Dynamic meeting setting updates

### Meeting Information Provided
- Meeting ID and Google Meet link
- Start and end times with timezone support
- Meeting title and description
- Attendee list with response status and roles
- Creator and organizer information
- Recording, transcription, and smart notes status
- Space configuration and member list
- Moderation settings and restrictions

## Requirements

- Node.js 16 or higher
- Google account with Calendar access
- Google Cloud project with APIs enabled
- **For advanced features**: Google Workspace Business Standard or higher

## Enterprise Requirements

### Google Workspace Tiers
- **Basic Features** (Free Google Account): Meeting creation, basic management
- **Business Standard+** (Paid): Recording, transcription, smart notes, attendance reports
- **Enterprise** (Paid): Advanced moderation, space management, enhanced analytics

### API Quotas
- Google Calendar API: 1,000,000 requests/day
- Google Meet API: 100 requests/100 seconds per user

## Use Cases

### 🏢 Enterprise Scenarios
```javascript
// Executive board meeting with full control
create_meeting({
  summary: "Q4 Board Meeting",
  co_hosts: ["ceo@company.com", "cfo@company.com"],
  enable_recording: true,
  enable_transcription: true,
  enable_smart_notes: true,
  space_config: {
    moderation_mode: "ON",
    chat_restriction: "HOSTS_ONLY",
    present_restriction: "HOSTS_ONLY"
  }
})

// Large webinar with viewer restrictions
create_meeting({
  summary: "Product Launch Webinar",
  attendees: ["marketing@company.com", "sales@company.com"],
  space_config: {
    default_join_as_viewer: true,
    chat_restriction: "HOSTS_ONLY"
  }
})

// Training session with attendance tracking
create_meeting({
  summary: "Security Training",
  attendance_report: true,
  enable_transcription: true,
  enable_smart_notes: true
})
```

## Troubleshooting

### Common Issues

1. **"No valid credentials" error**
   - Ensure you've run `npm run setup` and completed the OAuth flow
   - Check that environment variables are set correctly
   - Verify your credentials file is valid

2. **"Token expired" error**
   - The server automatically refreshes tokens, but if issues persist, run setup again
   
3. **Advanced features not working**
   - Verify you have Google Workspace Business Standard or higher
   - Ensure the Google Meet API is enabled in your Google Cloud project
   - Check that all required OAuth scopes are granted

4. **Space creation failures**
   - Ensure Google Meet API v2beta is enabled
   - Verify workspace permissions for space creation
   - Check quota limits haven't been exceeded

5. **Co-host assignment issues**
   - Verify co-host emails have Google accounts
   - Ensure they have appropriate workspace permissions
   - Check that the space was created successfully first

6. **Missing environment variables**
   - Set `GOOGLE_OAUTH_CREDENTIALS` (simplified) or both `GOOGLE_MEET_CREDENTIALS_PATH` and `GOOGLE_MEET_TOKEN_PATH` (advanced)

7. **Authentication timeout or port issues**
   - If port 3000 is in use, close other applications using it
   - If authentication times out, try running the manual setup script
   - Check that your credentials file has `http://localhost` in redirect URIs

8. **Browser doesn't open automatically**
   - Copy the authentication URL from the console and open it manually
   - Complete the authorization and return to Claude

### Workspace Feature Limitations

- Recording features require Google Workspace Business Standard or higher
- Transcription requires Google Workspace with Meet recording enabled
- Smart notes require Google Workspace Enterprise
- Some moderation features may require specific workspace policies

## Development

### Testing
```bash
# Run comprehensive feature tests
npm test

# Start server in development mode
npm run start
```

### Architecture
- **src/index.js** - MCP server implementation with 10 tools
- **src/GoogleMeetAPI.js** - Google Calendar API + Meet API v2beta wrapper
- **src/setup.js** - OAuth authentication setup script
- **types.d.ts** - TypeScript definitions for all interfaces
- **test-enhanced-features.js** - Comprehensive test suite

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
- Follow existing code patterns and conventions
- Add tests for new features
- Update documentation for API changes
- Ensure backward compatibility where possible

## License

ISC

## Changelog

### v2.0.0 (Latest)
- ✨ Added Google Meet API v2beta integration
- 👥 Co-host management functionality
- 📝 Auto-transcription and smart notes
- 🛡️ Meeting moderation and access controls
- 📊 Attendance report generation
- 🏗️ Direct space management tools
- 🔧 Enhanced OAuth scopes and permissions
- 📋 Comprehensive test suite
- 📚 Complete TypeScript definitions
- 🎯 Fixed API properties to match official Google documentation
- 👥 Added Calendar API guest permissions support

### v1.0.0
- 🎉 Initial release with basic meeting management
- 📅 Google Calendar API integration
- 📹 Basic recording support
- 🔐 OAuth2 authentication