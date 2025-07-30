# Google Meet MCP Server

[![smithery badge](https://smithery.ai/badge/@cool-man-vk/google-meet-mcp-server)](https://smithery.ai/server/@cool-man-vk/google-meet-mcp-server)

A Model Context Protocol (MCP) server for interacting with Google Meet through the Google Calendar API and Google Meet API. This server provides comprehensive tools for creating, managing, and configuring Google Meet meetings programmatically, including support for recording capabilities.

## Description

This project implements an MCP server that allows AI agents to interact with Google Meet by creating, retrieving, and managing meetings through the Google Calendar API and Google Meet API. It leverages the MCP (Model Context Protocol) specification to expose these capabilities as tools that can be used by compatible AI systems like Claude Desktop.

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
   - Google Meet API (for recording features)
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

This will open a browser window where you can authorize the application to access your Google Calendar and Meet APIs.

## Usage

Once setup is complete, you can start the MCP server:

```bash
npm run start
```

The server will run and expose the following tools:

### Available Tools

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

#### 3. `create_meeting`
Create a new Google Meet meeting with optional recording capabilities.

**Parameters:**
- `summary` (required): Title of the meeting
- `start_time` (required): Start time in ISO format
- `end_time` (required): End time in ISO format
- `description` (optional): Description for the meeting
- `attendees` (optional): Array of email addresses for attendees
- `enable_recording` (optional): Enable recording for the meeting (requires Google Workspace Business Standard or higher)

#### 4. `update_meeting`
Update an existing Google Meet meeting.

**Parameters:**
- `meeting_id` (required): ID of the meeting to update
- `summary` (optional): Updated title
- `description` (optional): Updated description
- `start_time` (optional): Updated start time in ISO format
- `end_time` (optional): Updated end time in ISO format
- `attendees` (optional): Updated list of attendee emails

#### 5. `delete_meeting`
Delete a Google Meet meeting.

**Parameters:**
- `meeting_id` (required): ID of the meeting to delete

#### 6. `get_meeting_recordings`
Get recording information for a Google Meet meeting (requires Google Workspace).

**Parameters:**
- `meeting_code` (required): The meeting code from the Google Meet URL (e.g., "abc-defg-hij")

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

## Features

### Core Capabilities
- ✅ Create Google Meet meetings with custom settings
- ✅ List upcoming meetings with filtering options
- ✅ Retrieve detailed meeting information including join URLs
- ✅ Update existing meetings (title, time, description, attendees)
- ✅ Delete meetings
- ✅ Automatic Google Meet link generation for all calendar events

### Advanced Features
- 📹 **Recording Support** (requires Google Workspace Business Standard+)
  - Enable recording when creating meetings
  - Recording status indicator in meeting details
  - Placeholder for retrieving recording information
- 🔐 **OAuth2 Authentication** with token refresh
- 📅 **Full Calendar Integration** via Google Calendar API
- 🤖 **MCP Protocol Support** for AI agent integration

### Meeting Information Provided
- Meeting ID and Google Meet link
- Start and end times
- Meeting title and description
- Attendee list with response status
- Creator and organizer information
- Recording enabled status

## Requirements

- Node.js 16 or higher
- Google account with Calendar access
- Google Cloud project with APIs enabled
- For recording features: Google Workspace Business Standard or higher

## Limitations

- Recording features require a paid Google Workspace subscription
- The Meet API v2 integration for advanced recording management is partially implemented
- All times are handled in UTC by default

## Troubleshooting

### Common Issues

1. **"No valid credentials" error**
   - Ensure you've run `npm run setup` and completed the OAuth flow
   - Check that environment variables are set correctly
   - Verify your credentials file is valid

2. **"Token expired" error**
   - The server automatically refreshes tokens, but if issues persist, run setup again
   
3. **Recording not working**
   - Verify you have Google Workspace Business Standard or higher
   - Ensure the Google Meet API is enabled in your Google Cloud project

4. **Missing environment variables**
   - Set `GOOGLE_MEET_CREDENTIALS_PATH` and `GOOGLE_MEET_TOKEN_PATH` before running

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC
