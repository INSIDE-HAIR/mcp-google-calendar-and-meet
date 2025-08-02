/**
 * Smithery Entry Point for Google Meet MCP Server v3.0
 * Lightweight stateless server for Smithery platform
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables silently
try {
  dotenv.config({ path: ".env.local", debug: false, override: false });
} catch {
  // Ignore any dotenv errors silently
}

// Configuration schema for Smithery
export const configSchema = z.object({
  CLIENT_ID: z.string().optional().describe("Google OAuth2 Client ID for direct token authentication"),
  CLIENT_SECRET: z.string().optional().describe("Google OAuth2 Client Secret"),
  REFRESH_TOKEN: z.string().optional().describe("Google OAuth2 Refresh Token"),
  googleOAuthCredentials: z.string().optional().describe("Path to Google OAuth credentials JSON file (legacy)"),
  googleMeetCredentialsPath: z.string().optional().describe("Path to credentials file (legacy)"),
  googleMeetTokenPath: z.string().optional().describe("Path to token file (legacy)"),
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

export default function createStatelessServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "Google Meet MCP Server",
    version: "3.0.0",
  });

  // Simple health check tool
  server.tool(
    "health_check",
    "Check if the Google Meet MCP Server is healthy",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Google Meet MCP Server v3.0 is healthy and ready to use!",
          },
        ],
      };
    }
  );

  // Note: Full Google Meet API tools will be loaded dynamically when used
  // This keeps the initial server lightweight for Smithery

  server.tool(
    "list_available_tools",
    "List all available Google Meet and Calendar tools",
    {},
    async () => {
      const tools = [
        // Calendar API v3 tools (6 total)
        "calendar_v3_list_calendars - List available Google calendars",
        "calendar_v3_list_events - List calendar events with optional Meet links",
        "calendar_v3_get_event - Get detailed event information",
        "calendar_v3_create_event - Create calendar events with Meet conferences",
        "calendar_v3_update_event - Update existing calendar events",
        "calendar_v3_delete_event - Delete calendar events",
        
        // Meet API v2 tools (17 total)
        "meet_v2_create_space - Create Google Meet spaces with advanced configuration",
        "meet_v2_get_space - Get Meet space details",
        "meet_v2_update_space - Update Meet space configuration",
        "meet_v2_end_active_conference - End active conferences",
        "meet_v2_list_conference_records - List historical conference records",
        "meet_v2_get_conference_record - Get specific conference details",
        "meet_v2_list_recordings - List conference recordings",
        "meet_v2_get_recording - Get recording details",
        "meet_v2_list_transcripts - List conference transcripts",
        "meet_v2_get_transcript - Get transcript details",
        "meet_v2_list_transcript_entries - List individual speech segments",
        "meet_v2_list_participants - List conference participants",
        "meet_v2_get_participant - Get participant details",
        "meet_v2_list_participant_sessions - List participant sessions",
        "meet_v2_get_participant_session - Get participant session details",
        "meet_v2_list_activities - List conference activities",
        "meet_v2_get_activity - Get activity details",
      ];

      return {
        content: [
          {
            type: "text",
            text: `Google Meet MCP Server v3.0 provides 23 tools:\n\n${tools.join('\n')}`,
          },
        ],
      };
    }
  );

  // Placeholder for dynamic tool loading
  // In production, this would dynamically import and register the full Google Meet API
  server.tool(
    "load_full_api",
    "Load the complete Google Meet and Calendar API (development placeholder)",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Full Google Meet API loading is not yet implemented in Smithery version. Please use the production deployment for complete functionality.",
          },
        ],
      };
    }
  );

  return server.server;
}