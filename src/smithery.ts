/**
 * Smithery Entry Point for Google Meet MCP Server v3.0
 * Complete implementation with all 23 production tools
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import dotenv from "dotenv";
import GoogleMeetAPI from "./GoogleMeetAPI.js";

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

  // Initialize Google Meet API
  let googleMeetAPI: GoogleMeetAPI | null = null;
  
  const initializeAPI = async () => {
    if (!googleMeetAPI) {
      // Set environment variables from config
      if (config.CLIENT_ID) process.env.CLIENT_ID = config.CLIENT_ID;
      if (config.CLIENT_SECRET) process.env.CLIENT_SECRET = config.CLIENT_SECRET;
      if (config.REFRESH_TOKEN) process.env.REFRESH_TOKEN = config.REFRESH_TOKEN;
      if (config.googleOAuthCredentials) process.env.G_OAUTH_CREDENTIALS = config.googleOAuthCredentials;
      if (config.googleMeetCredentialsPath) process.env.GOOGLE_MEET_CREDENTIALS_PATH = config.googleMeetCredentialsPath;
      if (config.googleMeetTokenPath) process.env.GOOGLE_MEET_TOKEN_PATH = config.googleMeetTokenPath;
      
      googleMeetAPI = new GoogleMeetAPI();
    }
    return googleMeetAPI;
  };

  // Health check tool
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

  // Calendar API v3 Tools (6 tools)
  server.tool(
    "calendar_v3_list_calendars",
    "[Calendar API v3] List all calendars available to the user",
    {},
    async () => {
      const api = await initializeAPI();
      const result = await api.listCalendars();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "calendar_v3_list_events",
    "[Calendar API v3] List upcoming calendar events with Google Meet conferences",
    {
      max_results: { type: "number", description: "Maximum number of results to return (default: 10)" },
      time_min: { type: "string", description: "Start time in ISO format (default: now)" },
      time_max: { type: "string", description: "End time in ISO format (optional)" },
      calendar_id: { type: "string", description: "Calendar ID to list events from (default: 'primary')" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.listEvents(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "calendar_v3_get_event",
    "[Calendar API v3] Get details of a specific calendar event",
    {
      event_id: { type: "string", description: "ID of the calendar event to retrieve" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.getEvent(args.event_id as string);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "calendar_v3_create_event",
    "[Calendar API v3] Create a new calendar event with Google Meet conference and guest permissions",
    {
      summary: { type: "string", description: "Title of the event" },
      description: { type: "string", description: "Description for the event (optional)" },
      location: { type: "string", description: "Location for the event (optional)" },
      start_time: { type: "string", description: "Start time in ISO format" },
      end_time: { type: "string", description: "End time in ISO format" },
      time_zone: { type: "string", description: "Time zone (default: UTC)" },
      attendees: { type: "array", items: { type: "string" }, description: "List of email addresses for attendees (optional)" },
      create_meet_conference: { type: "boolean", description: "Create Google Meet conference for this event (default: false)" },
      guest_can_invite_others: { type: "boolean", description: "Allow guests to invite other people (default: true)" },
      guest_can_modify: { type: "boolean", description: "Allow guests to modify the event (default: false)" },
      guest_can_see_other_guests: { type: "boolean", description: "Allow guests to see other attendees (default: true)" },
      calendar_id: { type: "string", description: "Calendar ID to create event in (default: 'primary')" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.createEvent(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "calendar_v3_update_event",
    "[Calendar API v3] Update an existing calendar event",
    {
      event_id: { type: "string", description: "ID of the event to update" },
      summary: { type: "string", description: "Updated title of the event (optional)" },
      description: { type: "string", description: "Updated description for the event (optional)" },
      location: { type: "string", description: "Updated location for the event (optional)" },
      start_time: { type: "string", description: "Updated start time in ISO format (optional)" },
      end_time: { type: "string", description: "Updated end time in ISO format (optional)" },
      time_zone: { type: "string", description: "Updated time zone (optional)" },
      attendees: { type: "array", items: { type: "string" }, description: "Updated list of email addresses for attendees (optional)" },
      guest_can_invite_others: { type: "boolean", description: "Updated guest invite permission (optional)" },
      guest_can_modify: { type: "boolean", description: "Updated guest modify permission (optional)" },
      guest_can_see_other_guests: { type: "boolean", description: "Updated guest visibility permission (optional)" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.updateEvent(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "calendar_v3_delete_event",
    "[Calendar API v3] Delete a calendar event",
    {
      event_id: { type: "string", description: "ID of the event to delete" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.deleteEvent(args.event_id as string);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Meet API v2 Tools (17 tools)
  server.tool(
    "meet_v2_create_space",
    "[Meet API v2 GA] Create a Google Meet space with advanced configuration",
    {
      access_type: { type: "string", enum: ["OPEN", "TRUSTED", "RESTRICTED"], description: "Access type for the space (default: TRUSTED)" },
      enable_recording: { type: "boolean", description: "Enable automatic recording (requires Google Workspace Business Standard+)" },
      enable_transcription: { type: "boolean", description: "Enable automatic transcription (requires Google Workspace)" },
      enable_smart_notes: { type: "boolean", description: "Enable automatic smart notes with Gemini (requires Gemini license)" },
      attendance_report: { type: "boolean", description: "Enable attendance report generation" },
      moderation_mode: { type: "string", enum: ["ON", "OFF"], description: "Enable moderation for the space (default: OFF)" },
      chat_restriction: { type: "string", enum: ["HOSTS_ONLY", "NO_RESTRICTION"], description: "Chat restriction level (default: NO_RESTRICTION)" },
      present_restriction: { type: "string", enum: ["HOSTS_ONLY", "NO_RESTRICTION"], description: "Presentation restriction level (default: NO_RESTRICTION)" },
      default_join_as_viewer: { type: "boolean", description: "Join participants as viewers by default (default: false)" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.createSpace(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "meet_v2_get_space",
    "[Meet API v2 GA] Get details of a Google Meet space",
    {
      space_name: { type: "string", description: "Name of the space (spaces/{space_id})" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.getSpace(args.space_name as string);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "meet_v2_list_conference_records",
    "[Meet API v2 GA] List conference records for historical meetings",
    {
      filter: { type: "string", description: 'Filter for conference records (e.g., space.name="spaces/{space_id}")' },
      page_size: { type: "number", description: "Maximum number of results to return (default: 10, max: 50)" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.listConferenceRecords(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "meet_v2_get_conference_record",
    "[Meet API v2 GA] Get details of a specific conference record",
    {
      conference_record_name: { type: "string", description: "Name of the conference record (conferenceRecords/{record_id})" },
    },
    async (args) => {
      const api = await initializeAPI();
      const result = await api.getConferenceRecord(args.conference_record_name as string);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Additional Meet API v2 tools with simplified implementations for Smithery
  const meetV2Tools = [
    { name: "meet_v2_update_space", description: "[Meet API v2 GA] Update configuration of a Google Meet space", method: "updateSpace" },
    { name: "meet_v2_end_active_conference", description: "[Meet API v2 GA] End the active conference in a Google Meet space", method: "endActiveConference" },
    { name: "meet_v2_list_recordings", description: "[Meet API v2 GA] List recordings for a conference record", method: "listRecordings" },
    { name: "meet_v2_get_recording", description: "[Meet API v2 GA] Get details of a specific recording", method: "getRecording" },
    { name: "meet_v2_list_transcripts", description: "[Meet API v2 GA] List transcripts for a conference record", method: "listTranscripts" },
    { name: "meet_v2_get_transcript", description: "[Meet API v2 GA] Get details of a specific transcript", method: "getTranscript" },
    { name: "meet_v2_list_transcript_entries", description: "[Meet API v2 GA] List transcript entries (individual speech segments)", method: "listTranscriptEntries" },
    { name: "meet_v2_get_participant", description: "[Meet API v2 GA] Get details of a specific participant", method: "getParticipant" },
    { name: "meet_v2_list_participants", description: "[Meet API v2 GA] List participants for a conference record", method: "listParticipants" },
    { name: "meet_v2_get_participant_session", description: "[Meet API v2 GA] Get details of a specific participant session", method: "getParticipantSession" },
    { name: "meet_v2_list_participant_sessions", description: "[Meet API v2 GA] List sessions for a specific participant", method: "listParticipantSessions" },
    { name: "calendar_v3_freebusy_query", description: "[Calendar API v3] Query free/busy information for calendars", method: "freebusyQuery" },
    { name: "calendar_v3_quick_add", description: "[Calendar API v3] Create event using natural language", method: "quickAdd" },
  ];

  // Register all remaining tools dynamically
  meetV2Tools.forEach(({ name, description, method }) => {
    server.tool(
      name,
      description,
      { args: { type: "object", description: "Tool arguments (varies by tool)" } },
      async (args) => {
        try {
          const api = await initializeAPI();
          const result = await (api as any)[method](args);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          };
        }
      }
    );
  });

  return server.server;
}