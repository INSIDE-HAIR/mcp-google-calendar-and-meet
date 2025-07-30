# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Meet MCP Server - A Model Context Protocol (MCP) server that interacts with Google Meet through the Google Calendar API. This server provides tools for creating and managing Google Meet meetings programmatically.

## Common Development Commands

- **Start the server**: `npm run start`
- **Initial setup (OAuth authentication)**: `npm run setup`
- **Install dependencies**: `npm install`

Note: No test, lint, or build commands are currently configured in package.json.

## Architecture

The project uses ES modules (`"type": "module"` in package.json) and follows this structure:

### Core Components

1. **src/index.js** - Main MCP server implementation
   - Entry point for the application
   - Implements the MCP server using `@modelcontextprotocol/sdk`
   - Handles tool registration and request routing
   - Manages 6 tools: list_meetings, get_meeting, create_meeting, update_meeting, delete_meeting, get_meeting_recordings

2. **src/GoogleMeetAPI.js** - Google Calendar and Meet API wrapper
   - Handles OAuth2 authentication with Google
   - Provides methods for CRUD operations on calendar events with Google Meet
   - Supports recording configuration for meetings (requires Google Workspace)
   - Manages token persistence and refresh

3. **src/setup.js** - Initial OAuth setup script
   - Runs the OAuth flow to obtain initial credentials
   - Saves tokens for future use

### Authentication Flow

The server requires Google OAuth2 credentials:
1. Environment variables `GOOGLE_MEET_CREDENTIALS_PATH` and `GOOGLE_MEET_TOKEN_PATH` must be set
2. Initial setup via `npm run setup` to obtain OAuth tokens
3. Tokens are persisted and automatically refreshed when expired

### MCP Protocol Implementation

- Uses stdio transport for communication
- Implements standard MCP tool handlers
- All responses are JSON formatted
- Error handling includes both MCP errors and Google API errors

## Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `googleapis` - Google Calendar API and Meet API client
- `open` - For opening browser during OAuth flow

## Recording Feature

The server now supports enabling recordings for Google Meet meetings:
- Pass `enable_recording: true` when creating a meeting
- Requires Google Workspace Business Standard or higher
- Recording status is indicated in meeting description
- Use `get_meeting_recordings` tool to retrieve recording information (placeholder implementation)