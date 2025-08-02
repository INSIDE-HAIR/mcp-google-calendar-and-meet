/**
 * Smithery Entry Point for Google Meet MCP Server v3.0
 * Complete implementation with all 23 production tools
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import dotenv from "dotenv";
// Dynamic import for GoogleMeetAPI to avoid static dependency issues
// Import validation schemas
import { validateToolArgs } from "./validation/meetSchemas.js";

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
  let googleMeetAPI: any = null;
  
  const initializeAPI = async () => {
    if (!googleMeetAPI) {
      // Debug logging
      console.error("🔧 Initializing Google Meet API...");
      
      // Set environment variables from config
      if (config.CLIENT_ID) process.env.CLIENT_ID = config.CLIENT_ID;
      if (config.CLIENT_SECRET) process.env.CLIENT_SECRET = config.CLIENT_SECRET;
      if (config.REFRESH_TOKEN) process.env.REFRESH_TOKEN = config.REFRESH_TOKEN;
      if (config.googleOAuthCredentials) process.env.G_OAUTH_CREDENTIALS = config.googleOAuthCredentials;
      if (config.googleMeetCredentialsPath) process.env.GOOGLE_MEET_CREDENTIALS_PATH = config.googleMeetCredentialsPath;
      if (config.googleMeetTokenPath) process.env.GOOGLE_MEET_TOKEN_PATH = config.googleMeetTokenPath;
      
      // Debug: Check which auth method will be used
      if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.REFRESH_TOKEN) {
        console.error("🔑 Will use direct token authentication");
      } else if (process.env.G_OAUTH_CREDENTIALS) {
        console.error("📁 Will use file-based OAuth credentials");
      } else {
        console.error("⚠️ No authentication method detected");
      }
      
      // Dynamic import to avoid static dependency issues
      const { default: GoogleMeetAPI } = await import("./GoogleMeetAPI.js");
      // Use dummy paths since we're using direct token authentication
      googleMeetAPI = new GoogleMeetAPI("", "");
      
      // Initialize the API with credentials
      console.error("⚡ Calling initialize()...");
      await googleMeetAPI.initialize();
      console.error("✅ API initialized successfully");
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
      try {
        const api = await initializeAPI();
        const result = await api.listCalendars();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Check that CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN are set\n- Verify that the refresh token is still valid\n- Ensure Google Calendar API is enabled in your Google Cloud project` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "calendar_v3_list_events",
    "[Calendar API v3] List upcoming calendar events with Google Meet conferences",
    {
      type: "object",
      properties: {
        max_results: { type: "number", description: "Maximum number of events to return (default: 10, max: 2500)", minimum: 1, maximum: 2500, default: 10 },
        time_min: { type: "string", description: "Lower bound for event start times in ISO 8601 format (e.g., \"2024-02-01T10:00:00Z\")", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?$" },
        time_max: { type: "string", description: "Upper bound for event start times in ISO 8601 format (e.g., \"2024-02-01T23:59:59Z\")", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?$" },
        calendar_id: { type: "string", description: "Calendar ID to list events from (default: 'primary')", default: "primary" }
      },
      required: []
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("calendar_v3_list_events", args);
        const api = await initializeAPI();
        const result = await api.listCalendarEvents(validatedArgs.max_results, validatedArgs.time_min, validatedArgs.time_max, validatedArgs.calendar_id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Check time format (ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ)\n- time_max must be after time_min\n- Verify that you have read permissions to the calendar` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "calendar_v3_get_event",
    "[Calendar API v3] Get details of a specific calendar event",
    {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Calendar event ID to retrieve", minLength: 1 }
      },
      required: ["event_id"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("calendar_v3_get_event", args);
        const api = await initializeAPI();
        const result = await api.getCalendarEvent(validatedArgs.event_id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Check that the event ID is correct\n- Verify that you have access to this calendar event` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "calendar_v3_create_event",
    "[Calendar API v3] Create a new calendar event with Google Meet conference and guest permissions",
    {
      type: "object",
      properties: {
        summary: { 
          type: "string", 
          description: "The title/subject of the meeting",
          minLength: 1,
          maxLength: 255
        },
        start_time: { 
          type: "string", 
          description: 'Meeting start time in ISO format with timezone (e.g., "2024-02-01T10:00:00Z" or "2024-02-01T10:00:00-05:00")',
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?$"
        },
        end_time: { 
          type: "string", 
          description: 'Meeting end time in ISO format with timezone (e.g., "2024-02-01T11:00:00Z" or "2024-02-01T11:00:00-05:00")',
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?$"
        },
        description: { type: "string", description: "Optional meeting description or agenda", maxLength: 8192 },
        location: { type: "string", description: "Location for the event (optional)", maxLength: 1024 },
        time_zone: { type: "string", description: 'Timezone for the event (e.g., "America/New_York", "Europe/London")', default: "UTC" },
        attendees: { type: "array", items: { type: "string", format: "email" }, description: "List of attendee email addresses" },
        create_meet_conference: { type: "boolean", description: "Automatically creates a Google Meet link for this event", default: false },
        guest_can_invite_others: { type: "boolean", description: "Allow attendees to invite additional people", default: true },
        guest_can_modify: { type: "boolean", description: "Allow attendees to modify the event details", default: false },
        guest_can_see_other_guests: { type: "boolean", description: "Allow attendees to see the full guest list", default: true },
        calendar_id: { type: "string", description: 'Calendar ID to create the event in (default: "primary")', default: "primary" }
      },
      required: ["summary", "start_time", "end_time"]
    },
    async (args) => {
      try {
        // Use your complete Zod validation schemas
        const validatedArgs = validateToolArgs("calendar_v3_create_event", args);
        const api = await initializeAPI();
        
        // Transform snake_case to camelCase to match API expectations
        const result = await api.createCalendarEvent({
          summary: validatedArgs.summary,
          description: validatedArgs.description,
          location: validatedArgs.location,
          startTime: validatedArgs.start_time,
          endTime: validatedArgs.end_time,
          timeZone: validatedArgs.time_zone || "UTC",
          attendees: validatedArgs.attendees,
          createMeetConference: validatedArgs.create_meet_conference,
          guestPermissions: {
            canInviteOthers: validatedArgs.guest_can_invite_others,
            canModify: validatedArgs.guest_can_modify,
            canSeeOtherGuests: validatedArgs.guest_can_see_other_guests,
          },
          calendarId: validatedArgs.calendar_id || "primary",
        });
        
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Check that summary, start_time, and end_time are provided\n- Verify time format (ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ)\n- End time must be after start time\n- Meeting duration cannot exceed 24 hours\n- Ensure you have write permissions to the calendar` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "calendar_v3_update_event",
    "[Calendar API v3] Update an existing calendar event",
    {
      type: "object",
      properties: {
        event_id: { type: "string", description: "ID of the event to update", minLength: 1 },
        summary: { type: "string", description: "Updated title of the event (optional)", minLength: 1 },
        description: { type: "string", description: "Updated description for the event (optional)" },
        location: { type: "string", description: "Updated location for the event (optional)" },
        start_time: { type: "string", description: "Updated start time in ISO format (optional)", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?$" },
        end_time: { type: "string", description: "Updated end time in ISO format (optional)", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?$" },
        time_zone: { type: "string", description: "Updated time zone (optional)", default: "UTC" },
        attendees: { type: "array", items: { type: "string", format: "email" }, description: "Updated list of email addresses for attendees (optional)" },
        guest_can_invite_others: { type: "boolean", description: "Updated guest invite permission (optional)" },
        guest_can_modify: { type: "boolean", description: "Updated guest modify permission (optional)" },
        guest_can_see_other_guests: { type: "boolean", description: "Updated guest visibility permission (optional)" }
      },
      required: ["event_id"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("calendar_v3_update_event", args);
        const api = await initializeAPI();
        
        // Transform snake_case to camelCase for API
        const updateData: any = {};
        if (validatedArgs.summary !== undefined) updateData.summary = validatedArgs.summary;
        if (validatedArgs.description !== undefined) updateData.description = validatedArgs.description;
        if (validatedArgs.location !== undefined) updateData.location = validatedArgs.location;
        if (validatedArgs.start_time !== undefined) updateData.startTime = validatedArgs.start_time;
        if (validatedArgs.end_time !== undefined) updateData.endTime = validatedArgs.end_time;
        if (validatedArgs.time_zone !== undefined) updateData.timeZone = validatedArgs.time_zone;
        if (validatedArgs.attendees !== undefined) updateData.attendees = validatedArgs.attendees;
        if (validatedArgs.guest_can_invite_others !== undefined)
          updateData.guestCanInviteOthers = validatedArgs.guest_can_invite_others;
        if (validatedArgs.guest_can_modify !== undefined)
          updateData.guestCanModify = validatedArgs.guest_can_modify;
        if (validatedArgs.guest_can_see_other_guests !== undefined)
          updateData.guestCanSeeOtherGuests = validatedArgs.guest_can_see_other_guests;
        
        const result = await api.updateCalendarEvent(validatedArgs.event_id, updateData);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Check that the event ID is correct\n- If updating times, end time must be after start time\n- Verify that you have write permissions to this calendar event` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "calendar_v3_delete_event",
    "[Calendar API v3] Delete a calendar event",
    {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Calendar event ID to delete", minLength: 1 }
      },
      required: ["event_id"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("calendar_v3_delete_event", args);
        const api = await initializeAPI();
        const result = await api.deleteCalendarEvent(validatedArgs.event_id);
        return {
          content: [{ type: "text", text: JSON.stringify({ success: result, message: "Event deleted successfully" }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Check that the event ID is correct\n- Verify that you have delete permissions to this calendar event` 
          }],
          isError: true,
        };
      }
    }
  );

  // Meet API v2 Tools (17 tools)
  server.tool(
    "meet_v2_create_space",
    "[Meet API v2 GA] Create a Google Meet space with advanced configuration",
    {
      type: "object",
      properties: {
        access_type: { type: "string", enum: ["OPEN", "TRUSTED", "RESTRICTED"], description: "Access control: OPEN (anyone with link), TRUSTED (Google account required), RESTRICTED (invitation only)", default: "TRUSTED" },
        enable_recording: { type: "boolean", description: "⚠️ Prepares recording capability - must be manually activated during the meeting", default: false },
        enable_transcription: { type: "boolean", description: "Enables automatic transcription generation post-meeting", default: false },
        enable_smart_notes: { type: "boolean", description: "🧠 Enables AI-powered meeting summaries (requires Gemini license)", default: false },
        attendance_report: { type: "boolean", description: "Generates detailed attendance tracking report", default: false },
        moderation_mode: { type: "string", enum: ["ON", "OFF"], description: "Host moderation controls for chat and presentation permissions", default: "OFF" },
        chat_restriction: { type: "string", enum: ["HOSTS_ONLY", "NO_RESTRICTION"], description: "Chat permissions: HOSTS_ONLY restricts chat to hosts only" },
        present_restriction: { type: "string", enum: ["HOSTS_ONLY", "NO_RESTRICTION"], description: "Presentation permissions: HOSTS_ONLY restricts screen sharing to hosts" },
        default_join_as_viewer: { type: "boolean", description: "Forces participants to join as viewers (cannot unmute/present by default)", default: false }
      },
      required: []
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_create_space", args);
        const api = await initializeAPI();
        
        // Transform snake_case to camelCase for API
        const config = {
          accessType: validatedArgs.access_type,
          enableRecording: validatedArgs.enable_recording,
          enableTranscription: validatedArgs.enable_transcription,
          enableSmartNotes: validatedArgs.enable_smart_notes,
          attendanceReport: validatedArgs.attendance_report,
          moderationMode: validatedArgs.moderation_mode,
          chatRestriction: validatedArgs.chat_restriction,
          presentRestriction: validatedArgs.present_restriction,
          defaultJoinAsViewer: validatedArgs.default_join_as_viewer,
        };
        
        const result = await api.createMeetSpace(config);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- 🔒 Recording cannot be enabled for OPEN access meetings\n- 🧠 Smart notes require transcription to be enabled\n- Ensure Google Meet API v2 is enabled in your Google Cloud project\n- Verify that you have the required Google Workspace subscription for advanced features` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_get_space",
    "[Meet API v2 GA] Get details of a Google Meet space",
    {
      type: "object",
      properties: {
        space_name: { type: "string", description: "The space identifier (e.g., \"spaces/abc-defg-hij\" or \"spaces/meeting-code\")", pattern: "^spaces\/[a-zA-Z0-9_-]{1,128}$" }
      },
      required: ["space_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_get_space", args);
        const api = await initializeAPI();
        const result = await api.getMeetSpace(validatedArgs.space_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Space name must be in format: spaces/{space_id} or spaces/{meeting_code}\n- Verify that the space exists and you have access to it` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_list_conference_records",
    "[Meet API v2 GA] List conference records for historical meetings",
    {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter expression (e.g., space.name=\"spaces/{space_id}\" or startTime>\"2024-01-01T00:00:00Z\")" },
        page_size: { type: "number", description: "Maximum number of conference records to return", minimum: 1, maximum: 50, default: 10 }
      },
      required: []
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_list_conference_records", args);
        const api = await initializeAPI();
        const result = await api.listConferenceRecords(validatedArgs.filter, validatedArgs.page_size);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Page size must be between 1 and 50\n- Check that the filter syntax is correct\n- Verify that you have access to conference records` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_get_conference_record",
    "[Meet API v2 GA] Get details of a specific conference record",
    {
      type: "object",
      properties: {
        conference_record_name: { type: "string", description: "Name of the conference record (conferenceRecords/{record_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+$" }
      },
      required: ["conference_record_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_get_conference_record", args);
        const api = await initializeAPI();
        const result = await api.getConferenceRecord(validatedArgs.conference_record_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Conference record name must be in format: conferenceRecords/{record_id}\n- Verify that the conference record exists and you have access to it` 
          }],
          isError: true,
        };
      }
    }
  );

  // Meet API v2 - Additional Tools with Complete Validation
  server.tool(
    "meet_v2_update_space",
    "[Meet API v2 GA] Update configuration of a Google Meet space",
    {
      type: "object",
      properties: {
        space_name: { type: "string", description: "Name of the space (spaces/{space_id})", pattern: "^spaces\/[a-zA-Z0-9_-]{1,128}$" },
        access_type: { type: "string", enum: ["OPEN", "TRUSTED", "RESTRICTED"], description: "Access control type" },
        moderation_mode: { type: "string", enum: ["ON", "OFF"], description: "Moderation mode" },
        chat_restriction: { type: "string", enum: ["HOSTS_ONLY", "NO_RESTRICTION"], description: "Chat restriction level" },
        present_restriction: { type: "string", enum: ["HOSTS_ONLY", "NO_RESTRICTION"], description: "Presentation restriction level" }
      },
      required: ["space_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_update_space", args);
        const api = await initializeAPI();
        
        // Transform snake_case to camelCase for API
        const updateData: any = {};
        if (validatedArgs.access_type !== undefined)
          updateData.accessType = validatedArgs.access_type;
        if (validatedArgs.moderation_mode !== undefined)
          updateData.moderationMode = validatedArgs.moderation_mode;
        if (validatedArgs.chat_restriction !== undefined)
          updateData.chatRestriction = validatedArgs.chat_restriction;
        if (validatedArgs.present_restriction !== undefined)
          updateData.presentRestriction = validatedArgs.present_restriction;
        
        const result = await api.updateMeetSpace(validatedArgs.space_name, updateData);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Space name must be in format: spaces/{space-id} or spaces/{meeting-code}\n- Verify that you have the necessary permissions for this operation` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_end_active_conference",
    "[Meet API v2 GA] End the active conference in a Google Meet space",
    {
      type: "object",
      properties: {
        space_name: { type: "string", description: "Name of the space (spaces/{space_id})", pattern: "^spaces\/[a-zA-Z0-9_-]{1,128}$" }
      },
      required: ["space_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_end_active_conference", args);
        const api = await initializeAPI();
        const result = await api.endActiveConference(validatedArgs.space_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Space name must be in format: spaces/{space-id} or spaces/{meeting-code}\n- Verify that there is an active conference to end` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_list_recordings",
    "[Meet API v2 GA] List recordings for a conference record",
    {
      type: "object",
      properties: {
        conference_record_name: { type: "string", description: "Name of the conference record (conferenceRecords/{record_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+$" }
      },
      required: ["conference_record_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_list_recordings", args);
        const api = await initializeAPI();
        const result = await api.listRecordings(validatedArgs.conference_record_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Conference record name must be in format: conferenceRecords/{record_id}\n- Verify that the conference record exists and has recordings` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_get_recording",
    "[Meet API v2 GA] Get details of a specific recording",
    {
      type: "object",
      properties: {
        recording_name: { type: "string", description: "Name of the recording (conferenceRecords/{record_id}/recordings/{recording_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+\/recordings\/[a-zA-Z0-9_-]+$" }
      },
      required: ["recording_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_get_recording", args);
        const api = await initializeAPI();
        const result = await api.getRecording(validatedArgs.recording_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Recording name must be in format: conferenceRecords/{record_id}/recordings/{recording_id}\n- Verify that the recording exists and is accessible` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_list_transcripts",
    "[Meet API v2 GA] List transcripts for a conference record",
    {
      type: "object",
      properties: {
        conference_record_name: { type: "string", description: "Name of the conference record (conferenceRecords/{record_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+$" }
      },
      required: ["conference_record_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_list_transcripts", args);
        const api = await initializeAPI();
        const result = await api.listTranscripts(validatedArgs.conference_record_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Conference record name must be in format: conferenceRecords/{record_id}\n- Verify that the conference record exists and has transcripts` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_get_transcript",
    "[Meet API v2 GA] Get details of a specific transcript",
    {
      type: "object",
      properties: {
        transcript_name: { type: "string", description: "Name of the transcript (conferenceRecords/{record_id}/transcripts/{transcript_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+\/transcripts\/[a-zA-Z0-9_-]+$" }
      },
      required: ["transcript_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_get_transcript", args);
        const api = await initializeAPI();
        const result = await api.getTranscript(validatedArgs.transcript_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Transcript name must be in format: conferenceRecords/{record_id}/transcripts/{transcript_id}\n- Verify that the transcript exists and is accessible` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_list_transcript_entries",
    "[Meet API v2 GA] List transcript entries (individual speech segments)",
    {
      type: "object",
      properties: {
        transcript_name: { type: "string", description: "Name of the transcript (conferenceRecords/{record_id}/transcripts/{transcript_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+\/transcripts\/[a-zA-Z0-9_-]+$" },
        page_size: { type: "number", description: "Maximum number of entries to return (default: 100, max: 1000)", minimum: 1, maximum: 1000, default: 100 }
      },
      required: ["transcript_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_list_transcript_entries", args);
        const api = await initializeAPI();
        const result = await api.listTranscriptEntries(validatedArgs.transcript_name, validatedArgs.page_size);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Transcript name must be in format: conferenceRecords/{record_id}/transcripts/{transcript_id}\n- Page size must be between 1 and 1000\n- Verify that the transcript exists and has entries` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_get_participant",
    "[Meet API v2 GA] Get details of a specific participant",
    {
      type: "object",
      properties: {
        participant_name: { type: "string", description: "Full participant resource name", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+\/participants\/[a-zA-Z0-9_-]+$" }
      },
      required: ["participant_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_get_participant", args);
        const api = await initializeAPI();
        const result = await api.getParticipant(validatedArgs.participant_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Participant name must be in format: conferenceRecords/{record_id}/participants/{participant_id}\n- Verify that the participant exists` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_list_participants",
    "[Meet API v2 GA] List participants for a conference record",
    {
      type: "object",
      properties: {
        conference_record_name: { type: "string", description: "Name of the conference record (conferenceRecords/{record_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+$" },
        page_size: { type: "number", description: "Maximum number of participants to return (default: 10, max: 100)", minimum: 1, maximum: 100, default: 10 }
      },
      required: ["conference_record_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_list_participants", args);
        const api = await initializeAPI();
        const result = await api.listParticipants(validatedArgs.conference_record_name, validatedArgs.page_size);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Conference record name must be in format: conferenceRecords/{record_id}\n- Page size must be between 1 and 100\n- Verify that the conference record exists` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_get_participant_session",
    "[Meet API v2 GA] Get details of a specific participant session",
    {
      type: "object",
      properties: {
        participant_session_name: { type: "string", description: "Name of the participant session (conferenceRecords/{record_id}/participants/{participant_id}/participantSessions/{session_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+\/participants\/[a-zA-Z0-9_-]+\/participantSessions\/[a-zA-Z0-9_-]+$" }
      },
      required: ["participant_session_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_get_participant_session", args);
        const api = await initializeAPI();
        const result = await api.getParticipantSession(validatedArgs.participant_session_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Participant session name must be in format: conferenceRecords/{record_id}/participants/{participant_id}/participantSessions/{session_id}\n- Verify that the participant session exists` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "meet_v2_list_participant_sessions",
    "[Meet API v2 GA] List sessions for a specific participant",
    {
      type: "object",
      properties: {
        participant_name: { type: "string", description: "Name of the participant (conferenceRecords/{record_id}/participants/{participant_id})", pattern: "^conferenceRecords\/[a-zA-Z0-9_-]+\/participants\/[a-zA-Z0-9_-]+$" },
        page_size: { type: "number", description: "Maximum number of sessions to return (default: 10, max: 100)", minimum: 1, maximum: 100, default: 10 }
      },
      required: ["participant_name"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("meet_v2_list_participant_sessions", args);
        const api = await initializeAPI();
        const result = await api.listParticipantSessions(validatedArgs.participant_name, validatedArgs.page_size);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Participant name must be in format: conferenceRecords/{record_id}/participants/{participant_id}\n- Page size must be between 1 and 100\n- Verify that the participant exists` 
          }],
          isError: true,
        };
      }
    }
  );

  // Utility Tools
  server.tool(
    "get_current_time",
    "Get the current time in UTC or a specific timezone",
    {
      type: "object",
      properties: {
        timeZone: { type: "string", description: "IANA timezone identifier (e.g., 'America/New_York', 'Europe/London'). If not provided, returns UTC time." }
      },
      required: []
    },
    async (args) => {
      try {
        const now = new Date();
        const requestedTimeZone = args.timeZone;
        
        let result: any = {
          utc: now.toISOString(),
          timestamp: now.getTime(),
        };
        
        if (requestedTimeZone) {
          try {
            // Validate timezone
            Intl.DateTimeFormat(undefined, { timeZone: requestedTimeZone });
            
            // Format time in requested timezone
            const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: requestedTimeZone,
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'long'
            });
            
            result.requestedTimeZone = {
              timeZone: requestedTimeZone,
              formatted: formatter.format(now),
              iso: now.toLocaleString('sv-SE', { timeZone: requestedTimeZone }).replace(' ', 'T') + getTimezoneOffset(now, requestedTimeZone)
            };
          } catch (e) {
            return {
              content: [{ 
                type: "text", 
                text: `Error: Invalid timezone '${requestedTimeZone}'. Use IANA timezone format like 'America/Los_Angeles' or 'UTC'.` 
              }],
              isError: true,
            };
          }
        }
        
        // Helper function to get timezone offset
        function getTimezoneOffset(date: Date, timeZone: string): string {
          const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
          const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
          const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
          
          if (offset === 0) return 'Z';
          
          const hours = Math.floor(Math.abs(offset) / 60);
          const minutes = Math.abs(offset) % 60;
          const sign = offset >= 0 ? '+' : '-';
          
          return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}` 
          }],
          isError: true,
        };
      }
    }
  );

  // Calendar API v3 - Additional Tools
  server.tool(
    "calendar_v3_freebusy_query",
    "[Calendar API v3] Query free/busy information for calendars",
    {
      type: "object",
      properties: {
        calendar_ids: { type: "array", items: { type: "string", minLength: 1 }, description: "List of calendar IDs to query", minItems: 1, maxItems: 50 },
        time_min: { type: "string", description: "Start time in ISO 8601 format (e.g., \"2024-02-01T10:00:00Z\")", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?$" },
        time_max: { type: "string", description: "End time in ISO 8601 format (e.g., \"2024-02-01T23:59:59Z\")", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(Z|[+-]\\d{2}:\\d{2})?$" }
      },
      required: ["calendar_ids", "time_min", "time_max"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("calendar_v3_freebusy_query", args);
        const api = await initializeAPI();
        const result = await api.queryFreeBusy(validatedArgs.calendar_ids, validatedArgs.time_min, validatedArgs.time_max);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- At least one calendar ID is required (max 50)\n- Check time format (ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ)\n- Verify calendar access permissions` 
          }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "calendar_v3_quick_add",
    "[Calendar API v3] Create event using natural language",
    {
      type: "object",
      properties: {
        calendar_id: { type: "string", description: "Calendar ID to add event to (defaults to \"primary\")", default: "primary" },
        text: { type: "string", description: "Natural language description (e.g., \"Lunch with John tomorrow at 2pm\")", minLength: 1, maxLength: 1000 }
      },
      required: ["text"]
    },
    async (args) => {
      try {
        const validatedArgs = validateToolArgs("calendar_v3_quick_add", args);
        const api = await initializeAPI();
        const result = await api.quickAddEvent(validatedArgs.calendar_id || "primary", validatedArgs.text);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Event text cannot be empty and must be under 1000 characters\n- Use natural language (e.g., \"Meeting tomorrow at 3pm\")\n- Verify calendar write permissions` 
          }],
          isError: true,
        };
      }
    }
  );

  return server.server;
}