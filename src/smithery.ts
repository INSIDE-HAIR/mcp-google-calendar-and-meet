/**
 * Smithery Entry Point for Google Meet MCP Server v3.0
 * Following the exact pattern from the working example
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

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

function createMcpServer({ config }: { config: z.infer<typeof configSchema> }) {
  const CLIENT_ID = config?.CLIENT_ID || process.env.CLIENT_ID;
  const CLIENT_SECRET = config?.CLIENT_SECRET || process.env.CLIENT_SECRET;
  const REFRESH_TOKEN = config?.REFRESH_TOKEN || process.env.REFRESH_TOKEN;

  console.error("🚀 Creating MCP Server with config keys:", Object.keys(config || {}));
  console.error("🔑 Auth check - CLIENT_ID:", !!CLIENT_ID, "CLIENT_SECRET:", !!CLIENT_SECRET, "REFRESH_TOKEN:", !!REFRESH_TOKEN);

  const server = new McpServer(
    {
      name: "google-meet-server",
      version: "3.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize Google Meet API
  let googleMeetAPI: any = null;
  
  const initializeAPI = async () => {
    if (!googleMeetAPI) {
      console.error("🔧 Initializing Google Meet API...");
      
      // Set environment variables from config
      if (config.CLIENT_ID) process.env.CLIENT_ID = config.CLIENT_ID;
      if (config.CLIENT_SECRET) process.env.CLIENT_SECRET = config.CLIENT_SECRET;
      if (config.REFRESH_TOKEN) process.env.REFRESH_TOKEN = config.REFRESH_TOKEN;
      if (config.googleOAuthCredentials) process.env.G_OAUTH_CREDENTIALS = config.googleOAuthCredentials;
      if (config.googleMeetCredentialsPath) process.env.GOOGLE_MEET_CREDENTIALS_PATH = config.googleMeetCredentialsPath;
      if (config.googleMeetTokenPath) process.env.GOOGLE_MEET_TOKEN_PATH = config.googleMeetTokenPath;
      
      try {
        // Dynamic import to avoid static dependency issues
        const { default: GoogleMeetAPI } = await import("./GoogleMeetAPI.js");
        googleMeetAPI = new GoogleMeetAPI("", "");
        await googleMeetAPI.initialize();
        console.error("✅ API initialized successfully");
      } catch (error) {
        console.error("❌ API initialization failed:", error);
        throw error;
      }
    }
    return googleMeetAPI;
  };

  // Error handling
  server.server.onerror = (error) => console.error("[MCP Error]", error);

  // Set up tool handlers
  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("🔧 ListToolsRequestSchema handler called - returning tools");
    return {
      tools: [
        {
          name: "health_check",
          description: "Check if the Google Meet MCP Server is healthy",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        // Google Calendar API v3 Tools
        {
          name: "calendar_v3_list_calendars",
          description: "[Calendar API v3] List all calendars available to the user",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "calendar_v3_list_events",
          description: "[Calendar API v3] List upcoming calendar events with Google Meet conferences",
          inputSchema: {
            type: "object",
            properties: {
              max_results: {
                type: "number",
                description: "Maximum number of results to return (default: 10)",
              },
              time_min: {
                type: "string",
                description: "Start time in ISO format (default: now)",
              },
              time_max: {
                type: "string",
                description: "End time in ISO format (optional)",
              },
              calendar_id: {
                type: "string",
                description: "Calendar ID to list events from (default: 'primary')",
              },
            },
            required: [],
          },
        },
        {
          name: "calendar_v3_get_event",
          description: "[Calendar API v3] Get details of a specific calendar event",
          inputSchema: {
            type: "object",
            properties: {
              event_id: {
                type: "string",
                description: "ID of the calendar event to retrieve",
              },
            },
            required: ["event_id"],
          },
        },
        {
          name: "calendar_v3_create_event",
          description: "[Calendar API v3] Create a new calendar event with Google Meet conference and guest permissions",
          inputSchema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "Title of the event",
              },
              description: {
                type: "string",
                description: "Description for the event (optional)",
              },
              location: {
                type: "string",
                description: "Location for the event (optional)",
              },
              start_time: {
                type: "string",
                description: "Start time in ISO format",
              },
              end_time: {
                type: "string",
                description: "End time in ISO format",
              },
              time_zone: {
                type: "string",
                description: "Time zone (default: UTC)",
              },
              attendees: {
                type: "array",
                description: "List of email addresses for attendees (optional)",
                items: {
                  type: "string",
                },
              },
              create_meet_conference: {
                type: "boolean",
                description: "Create Google Meet conference for this event (default: false)",
              },
              guest_can_invite_others: {
                type: "boolean",
                description: "Allow guests to invite other people (default: true)",
              },
              guest_can_modify: {
                type: "boolean",
                description: "Allow guests to modify the event (default: false)",
              },
              guest_can_see_other_guests: {
                type: "boolean",
                description: "Allow guests to see other attendees (default: true)",
              },
              calendar_id: {
                type: "string",
                description: "Calendar ID to create event in (default: 'primary')",
              },
            },
            required: ["summary", "start_time", "end_time"],
          },
        },
        {
          name: "calendar_v3_update_event",
          description: "[Calendar API v3] Update an existing calendar event",
          inputSchema: {
            type: "object",
            properties: {
              event_id: {
                type: "string",
                description: "ID of the event to update",
              },
              summary: {
                type: "string",
                description: "Updated title of the event (optional)",
              },
              description: {
                type: "string",
                description: "Updated description for the event (optional)",
              },
              location: {
                type: "string",
                description: "Updated location for the event (optional)",
              },
              start_time: {
                type: "string",
                description: "Updated start time in ISO format (optional)",
              },
              end_time: {
                type: "string",
                description: "Updated end time in ISO format (optional)",
              },
              time_zone: {
                type: "string",
                description: "Updated time zone (optional)",
              },
              attendees: {
                type: "array",
                description: "Updated list of email addresses for attendees (optional)",
                items: {
                  type: "string",
                },
              },
              guest_can_invite_others: {
                type: "boolean",
                description: "Updated guest invite permission (optional)",
              },
              guest_can_modify: {
                type: "boolean",
                description: "Updated guest modify permission (optional)",
              },
              guest_can_see_other_guests: {
                type: "boolean",
                description: "Updated guest visibility permission (optional)",
              },
            },
            required: ["event_id"],
          },
        },
        {
          name: "calendar_v3_delete_event",
          description: "[Calendar API v3] Delete a calendar event",
          inputSchema: {
            type: "object",
            properties: {
              event_id: {
                type: "string",
                description: "ID of the event to delete",
              },
            },
            required: ["event_id"],
          },
        },
        {
          name: "calendar_v3_freebusy_query",
          description: "[Calendar API v3] Query free/busy information for calendars",
          inputSchema: {
            type: "object",
            properties: {
              calendar_ids: {
                type: "array",
                items: { type: "string" },
                description: "Array of calendar IDs to query",
              },
              time_min: {
                type: "string",
                description: "Start time in ISO 8601 format (e.g., '2024-01-01T00:00:00Z')",
              },
              time_max: {
                type: "string", 
                description: "End time in ISO 8601 format (e.g., '2024-01-01T23:59:59Z')",
              },
            },
            required: ["calendar_ids", "time_min", "time_max"],
          },
        },
        {
          name: "calendar_v3_quick_add",
          description: "[Calendar API v3] Create event using natural language",
          inputSchema: {
            type: "object", 
            properties: {
              calendar_id: {
                type: "string",
                description: "Calendar ID to add event to (default: 'primary')",
              },
              text: {
                type: "string",
                description: "Natural language description (e.g., 'Lunch with John tomorrow at 2pm')",
              },
            },
            required: ["text"],
          },
        },

        // Google Meet API v2 Tools (GA - Generally Available)
        {
          name: "meet_v2_create_space",
          description: "[Meet API v2 GA] Create a Google Meet space with advanced configuration",
          inputSchema: {
            type: "object",
            properties: {
              access_type: {
                type: "string",
                enum: ["OPEN", "TRUSTED", "RESTRICTED"],
                description: "Access type for the space (default: TRUSTED)",
              },
              enable_recording: {
                type: "boolean",
                description: "Enable automatic recording (requires Google Workspace Business Standard+)",
              },
              enable_transcription: {
                type: "boolean",
                description: "Enable automatic transcription (requires Google Workspace)",
              },
              enable_smart_notes: {
                type: "boolean",
                description: "Enable automatic smart notes with Gemini (requires Gemini license)",
              },
              attendance_report: {
                type: "boolean",
                description: "Enable attendance report generation",
              },
              moderation_mode: {
                type: "string",
                enum: ["ON", "OFF"],
                description: "Enable moderation for the space (default: OFF)",
              },
              chat_restriction: {
                type: "string",
                enum: ["HOSTS_ONLY", "NO_RESTRICTION"],
                description: "Chat restriction level (default: NO_RESTRICTION)",
              },
              present_restriction: {
                type: "string",
                enum: ["HOSTS_ONLY", "NO_RESTRICTION"],
                description: "Presentation restriction level (default: NO_RESTRICTION)",
              },
              default_join_as_viewer: {
                type: "boolean",
                description: "Join participants as viewers by default (default: false)",
              },
            },
            required: [],
          },
        },
        {
          name: "meet_v2_get_space",
          description: "[Meet API v2 GA] Get details of a Google Meet space",
          inputSchema: {
            type: "object",
            properties: {
              space_name: {
                type: "string",
                description: "Name of the space (spaces/{space_id})",
              },
            },
            required: ["space_name"],
          },
        },
        {
          name: "meet_v2_update_space",
          description: "[Meet API v2 GA] Update configuration of a Google Meet space",
          inputSchema: {
            type: "object",
            properties: {
              space_name: {
                type: "string",
                description: "Name of the space (spaces/{space_id})",
              },
              access_type: {
                type: "string",
                enum: ["OPEN", "TRUSTED", "RESTRICTED"],
                description: "Updated access type for the space (optional)",
              },
              moderation_mode: {
                type: "string",
                enum: ["ON", "OFF"],
                description: "Updated moderation mode (optional)",
              },
              chat_restriction: {
                type: "string",
                enum: ["HOSTS_ONLY", "NO_RESTRICTION"],
                description: "Updated chat restriction level (optional)",
              },
              present_restriction: {
                type: "string",
                enum: ["HOSTS_ONLY", "NO_RESTRICTION"],
                description: "Updated presentation restriction level (optional)",
              },
            },
            required: ["space_name"],
          },
        },
        {
          name: "meet_v2_end_active_conference",
          description: "[Meet API v2 GA] End the active conference in a Google Meet space",
          inputSchema: {
            type: "object",
            properties: {
              space_name: {
                type: "string",
                description: "Name of the space (spaces/{space_id})",
              },
            },
            required: ["space_name"],
          },
        },
        {
          name: "meet_v2_list_conference_records",
          description: "[Meet API v2 GA] List conference records for historical meetings",
          inputSchema: {
            type: "object",
            properties: {
              filter: {
                type: "string",
                description: 'Filter for conference records (e.g., space.name="spaces/{space_id}")',
              },
              page_size: {
                type: "number",
                description: "Maximum number of results to return (default: 10, max: 50)",
              },
            },
            required: [],
          },
        },
        {
          name: "meet_v2_get_conference_record",
          description: "[Meet API v2 GA] Get details of a specific conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: {
                type: "string",
                description: "Name of the conference record (conferenceRecords/{record_id})",
              },
            },
            required: ["conference_record_name"],
          },
        },
        {
          name: "meet_v2_list_recordings",
          description: "[Meet API v2 GA] List recordings for a conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: {
                type: "string",
                description: "Name of the conference record (conferenceRecords/{record_id})",
              },
            },
            required: ["conference_record_name"],
          },
        },
        {
          name: "meet_v2_get_recording",
          description: "[Meet API v2 GA] Get details of a specific recording",
          inputSchema: {
            type: "object",
            properties: {
              recording_name: {
                type: "string",
                description: "Name of the recording (conferenceRecords/{record_id}/recordings/{recording_id})",
              },
            },
            required: ["recording_name"],
          },
        },
        {
          name: "meet_v2_list_transcripts",
          description: "[Meet API v2 GA] List transcripts for a conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: {
                type: "string",
                description: "Name of the conference record (conferenceRecords/{record_id})",
              },
            },
            required: ["conference_record_name"],
          },
        },
        {
          name: "meet_v2_get_transcript",
          description: "[Meet API v2 GA] Get details of a specific transcript",
          inputSchema: {
            type: "object",
            properties: {
              transcript_name: {
                type: "string",
                description: "Name of the transcript (conferenceRecords/{record_id}/transcripts/{transcript_id})",
              },
            },
            required: ["transcript_name"],
          },
        },
        {
          name: "meet_v2_list_transcript_entries",
          description: "[Meet API v2 GA] List transcript entries (individual speech segments)",
          inputSchema: {
            type: "object",
            properties: {
              transcript_name: {
                type: "string",
                description: "Name of the transcript (conferenceRecords/{record_id}/transcripts/{transcript_id})",
              },
              page_size: {
                type: "number",
                description: "Maximum number of entries to return (default: 100, max: 1000)",
              },
            },
            required: ["transcript_name"],
          },
        },
        {
          name: "meet_v2_get_participant",
          description: "[Meet API v2 GA] Get details of a specific participant",
          inputSchema: {
            type: "object",
            properties: {
              participant_name: {
                type: "string",
                description: "Name of the participant (conferenceRecords/{record_id}/participants/{participant_id})",
              },
            },
            required: ["participant_name"],
          },
        },
        {
          name: "meet_v2_list_participants",
          description: "[Meet API v2 GA] List participants for a conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: {
                type: "string",
                description: "Name of the conference record (conferenceRecords/{record_id})",
              },
              page_size: {
                type: "number",
                description: "Maximum number of participants to return (default: 10, max: 100)",
              },
            },
            required: ["conference_record_name"],
          },
        },
        {
          name: "meet_v2_get_participant_session",
          description: "[Meet API v2 GA] Get details of a specific participant session",
          inputSchema: {
            type: "object",
            properties: {
              participant_session_name: {
                type: "string",
                description: "Name of the participant session (conferenceRecords/{record_id}/participants/{participant_id}/sessions/{session_id})",
              },
            },
            required: ["participant_session_name"],
          },
        },
        {
          name: "meet_v2_list_participant_sessions",
          description: "[Meet API v2 GA] List sessions for a specific participant",
          inputSchema: {
            type: "object",
            properties: {
              participant_name: {
                type: "string",
                description: "Name of the participant (conferenceRecords/{record_id}/participants/{participant_id})",
              },
              page_size: {
                type: "number",
                description: "Maximum number of sessions to return (default: 10, max: 100)",
              },
            },
            required: ["participant_name"],
          },
        },
        {
          name: "get_current_time",
          description: "Get the current time in UTC or specific timezone",
          inputSchema: {
            type: "object",
            properties: {
              timeZone: { type: "string", description: "IANA timezone identifier" },
            },
          },
        },
      ],
    };
  });

  server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.error(`🎯 CallToolRequestSchema handler called for: ${request.params.name}`);
    
    switch (request.params.name) {
      case "health_check":
        return await handleHealthCheck(request.params.arguments);
      
      // Calendar API v3 Tools
      case "calendar_v3_list_calendars":
        return await handleListCalendars(request.params.arguments);
      case "calendar_v3_list_events":
        return await handleListEvents(request.params.arguments);
      case "calendar_v3_get_event":
        return await handleGetEvent(request.params.arguments);
      case "calendar_v3_create_event":
        return await handleCreateEvent(request.params.arguments);
      case "calendar_v3_update_event":
        return await handleUpdateEvent(request.params.arguments);
      case "calendar_v3_delete_event":
        return await handleDeleteEvent(request.params.arguments);
      case "calendar_v3_freebusy_query":
        return await handleFreeBusyQuery(request.params.arguments);
      case "calendar_v3_quick_add":
        return await handleQuickAdd(request.params.arguments);
      
      // Meet API v2 Tools
      case "meet_v2_create_space":
        return await handleCreateSpace(request.params.arguments);
      case "meet_v2_get_space":
        return await handleGetSpace(request.params.arguments);
      case "meet_v2_update_space":
        return await handleUpdateSpace(request.params.arguments);
      case "meet_v2_end_active_conference":
        return await handleEndActiveConference(request.params.arguments);
      case "meet_v2_list_conference_records":
        return await handleListConferenceRecords(request.params.arguments);
      case "meet_v2_get_conference_record":
        return await handleGetConferenceRecord(request.params.arguments);
      case "meet_v2_list_recordings":
        return await handleListRecordings(request.params.arguments);
      case "meet_v2_get_recording":
        return await handleGetRecording(request.params.arguments);
      case "meet_v2_list_transcripts":
        return await handleListTranscripts(request.params.arguments);
      case "meet_v2_get_transcript":
        return await handleGetTranscript(request.params.arguments);
      case "meet_v2_list_transcript_entries":
        return await handleListTranscriptEntries(request.params.arguments);
      case "meet_v2_get_participant":
        return await handleGetParticipant(request.params.arguments);
      case "meet_v2_list_participants":
        return await handleListParticipants(request.params.arguments);
      case "meet_v2_get_participant_session":
        return await handleGetParticipantSession(request.params.arguments);
      case "meet_v2_list_participant_sessions":
        return await handleListParticipantSessions(request.params.arguments);
      
      // Utility Tools
      case "get_current_time":
        return await handleGetCurrentTime(request.params.arguments);
      
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  });

  // Tool handler functions
  async function handleHealthCheck(args: any) {
    return {
      content: [
        {
          type: "text",
          text: "Google Meet MCP Server v3.0 is healthy and ready to use!",
        },
      ],
    };
  }

  async function handleListCalendars(args: any) {
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
          text: `Error: ${error instanceof Error ? error.message : String(error)}\n\nTroubleshooting:\n- Check that CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN are set\n- Verify that the refresh token is still valid` 
        }],
        isError: true,
      };
    }
  }

  async function handleListEvents(args: any) {
    try {
      console.error("🎯 handleListEvents args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.listCalendarEvents(args.max_results, args.time_min, args.time_max, args.calendar_id);
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

  async function handleGetEvent(args: any) {
    try {
      console.error("🎯 handleGetEvent args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.getCalendarEvent(args.event_id);
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

  async function handleCreateEvent(args: any) {
    try {
      console.error("🎯 handleCreateEvent args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      
      const result = await api.createCalendarEvent({
        summary: args.summary,
        description: args.description,
        location: args.location,
        startTime: args.start_time,
        endTime: args.end_time,
        attendees: args.attendees,
        createMeetConference: args.create_meet_conference,
        guestPermissions: {
          canInviteOthers: args.guest_can_invite_others,
          canModify: args.guest_can_modify,
          canSeeOtherGuests: args.guest_can_see_other_guests,
        },
      });
      
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

  async function handleUpdateEvent(args: any) {
    try {
      console.error("🎯 handleUpdateEvent args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      
      const updateData: any = {};
      if (args.summary !== undefined) updateData.summary = args.summary;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.location !== undefined) updateData.location = args.location;
      if (args.start_time !== undefined) updateData.startTime = args.start_time;
      if (args.end_time !== undefined) updateData.endTime = args.end_time;
      if (args.attendees !== undefined) updateData.attendees = args.attendees;
      
      const result = await api.updateCalendarEvent(args.event_id, updateData);
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

  async function handleDeleteEvent(args: any) {
    try {
      console.error("🎯 handleDeleteEvent args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.deleteCalendarEvent(args.event_id);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result, message: "Event deleted successfully" }, null, 2) }],
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

  async function handleCreateSpace(args: any) {
    try {
      console.error("🎯 handleCreateSpace args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      
      const config = {
        accessType: args.access_type,
        enableRecording: args.enable_recording,
        enableTranscription: args.enable_transcription,
        enableSmartNotes: args.enable_smart_notes,
      };
      
      const result = await api.createMeetSpace(config);
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

  // Additional Calendar API v3 handlers
  async function handleFreeBusyQuery(args: any) {
    try {
      console.error("🎯 handleFreeBusyQuery args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.queryFreeBusy(args.calendar_ids, args.time_min, args.time_max);
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

  async function handleQuickAdd(args: any) {
    try {
      console.error("🎯 handleQuickAdd args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.quickAddEvent(args.calendar_id || "primary", args.text);
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

  // Additional Meet API v2 handlers
  async function handleGetSpace(args: any) {
    try {
      console.error("🎯 handleGetSpace args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.getMeetSpace(args.space_name);
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

  async function handleUpdateSpace(args: any) {
    try {
      console.error("🎯 handleUpdateSpace args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      
      const updateData: any = {};
      if (args.access_type !== undefined) updateData.accessType = args.access_type;
      if (args.moderation_mode !== undefined) updateData.moderationMode = args.moderation_mode;
      if (args.chat_restriction !== undefined) updateData.chatRestriction = args.chat_restriction;  
      if (args.present_restriction !== undefined) updateData.presentRestriction = args.present_restriction;
      
      const result = await api.updateMeetSpace(args.space_name, updateData);
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

  async function handleEndActiveConference(args: any) {
    try {
      console.error("🎯 handleEndActiveConference args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.endActiveConference(args.space_name);
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

  async function handleListConferenceRecords(args: any) {
    try {
      console.error("🎯 handleListConferenceRecords args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.listConferenceRecords(args.filter, args.page_size);
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

  async function handleGetConferenceRecord(args: any) {
    try {
      console.error("🎯 handleGetConferenceRecord args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.getConferenceRecord(args.conference_record_name);
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

  async function handleListRecordings(args: any) {
    try {
      console.error("🎯 handleListRecordings args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.listRecordings(args.conference_record_name);
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

  async function handleGetRecording(args: any) {
    try {
      console.error("🎯 handleGetRecording args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.getRecording(args.recording_name);
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

  async function handleListTranscripts(args: any) {
    try {
      console.error("🎯 handleListTranscripts args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.listTranscripts(args.conference_record_name);
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

  async function handleGetTranscript(args: any) {
    try {
      console.error("🎯 handleGetTranscript args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.getTranscript(args.transcript_name);
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

  async function handleListTranscriptEntries(args: any) {
    try {
      console.error("🎯 handleListTranscriptEntries args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.listTranscriptEntries(args.transcript_name, args.page_size);
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

  async function handleGetParticipant(args: any) {
    try {
      console.error("🎯 handleGetParticipant args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.getParticipant(args.participant_name);
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

  async function handleListParticipants(args: any) {
    try {
      console.error("🎯 handleListParticipants args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.listParticipants(args.conference_record_name, args.page_size);
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

  async function handleGetParticipantSession(args: any) {
    try {
      console.error("🎯 handleGetParticipantSession args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.getParticipantSession(args.participant_session_name);
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

  async function handleListParticipantSessions(args: any) {
    try {
      console.error("🎯 handleListParticipantSessions args:", JSON.stringify(args, null, 2));
      const api = await initializeAPI();
      const result = await api.listParticipantSessions(args.participant_name, args.page_size);
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

  async function handleGetCurrentTime(args: any) {
    try {
      const now = new Date();
      const result = {
        utc: now.toISOString(),
        timestamp: now.getTime(),
        timezone: args?.timeZone ? {
          requested: args.timeZone,
          formatted: new Intl.DateTimeFormat('en-US', {
            timeZone: args.timeZone,
            dateStyle: 'full',
            timeStyle: 'full'
          }).format(now)
        } : null
      };
      
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

  console.error("✅ MCP Server created with tools and handlers");
  return server;
}

// Export using the exact pattern from the working example
export default function createStatelessServer({ config }: { config: z.infer<typeof configSchema> }) {
  console.error("🚀 createStatelessServer called");
  return createMcpServer({ config });
}