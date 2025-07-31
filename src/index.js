#!/usr/bin/env node

/**
 * Google Meet MCP Server
 * This implements the Model Context Protocol server for Google Meet
 * functionality via the Google Calendar API.
 */

import path from "path";
import { fileURLToPath } from "url";
import process from "process";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import GoogleMeetAPI from "./GoogleMeetAPI.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoogleMeetMcpServer {
  /**
   * Initialize the Google Meet MCP server
   */
  constructor() {
    this.server = new Server(
      {
        name: "google-meet-mcp",
        version: "2.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Setup Google Meet API client - support both configuration methods
    let credentialsPath, tokenPath;

    if (process.env.G_OAUTH_CREDENTIALS) {
      // Simplified configuration (single variable)
      credentialsPath = process.env.G_OAUTH_CREDENTIALS;
      tokenPath = credentialsPath.replace(/\.json$/, ".token.json");
    } else if (
      process.env.GOOGLE_MEET_CREDENTIALS_PATH &&
      process.env.GOOGLE_MEET_TOKEN_PATH
    ) {
      // Local development configuration (two variables)
      credentialsPath = process.env.GOOGLE_MEET_CREDENTIALS_PATH;
      tokenPath = process.env.GOOGLE_MEET_TOKEN_PATH;
    } else {
      console.error("Error: Missing required environment variables.");
      console.error("Please set either:");
      console.error("  - G_OAUTH_CREDENTIALS (path to OAuth credentials file)");
      console.error(
        "  - OR both GOOGLE_MEET_CREDENTIALS_PATH and GOOGLE_MEET_TOKEN_PATH"
      );
      process.exit(1);
    }

    this.googleMeet = new GoogleMeetAPI(credentialsPath, tokenPath);

    // Setup request handlers
    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error(`[MCP Error] ${error}`);

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up the tool request handlers
   */
  setupToolHandlers() {
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      this.handleListTools.bind(this)
    );
    this.server.setRequestHandler(
      CallToolRequestSchema,
      this.handleCallTool.bind(this)
    );
  }

  /**
   * Handle requests to list available tools
   */
  async handleListTools() {
    return {
      tools: [
        // Google Calendar API v3 Tools
        {
          name: "calendar_v3_list_calendars",
          description:
            "[Calendar API v3] List all calendars available to the user",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "calendar_v3_list_events",
          description:
            "[Calendar API v3] List upcoming calendar events with Google Meet conferences",
          inputSchema: {
            type: "object",
            properties: {
              max_results: {
                type: "number",
                description:
                  "Maximum number of results to return (default: 10)",
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
          description:
            "[Calendar API v3] Get details of a specific calendar event",
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
          description:
            "[Calendar API v3] Create a new calendar event with Google Meet conference and guest permissions",
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
                description:
                  "Create Google Meet conference for this event (default: false)",
              },
              guest_can_invite_others: {
                type: "boolean",
                description:
                  "Allow guests to invite other people (default: true)",
              },
              guest_can_modify: {
                type: "boolean",
                description:
                  "Allow guests to modify the event (default: false)",
              },
              guest_can_see_other_guests: {
                type: "boolean",
                description:
                  "Allow guests to see other attendees (default: true)",
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
                description:
                  "Updated list of email addresses for attendees (optional)",
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

        // Google Meet API v2 Tools (GA - Generally Available)
        {
          name: "meet_v2_create_space",
          description:
            "[Meet API v2 GA] Create a Google Meet space with advanced configuration",
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
                description:
                  "Enable automatic recording (requires Google Workspace Business Standard+)",
              },
              enable_transcription: {
                type: "boolean",
                description:
                  "Enable automatic transcription (requires Google Workspace)",
              },
              enable_smart_notes: {
                type: "boolean",
                description:
                  "Enable automatic smart notes with Gemini (requires Gemini license)",
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
                description:
                  "Presentation restriction level (default: NO_RESTRICTION)",
              },
              default_join_as_viewer: {
                type: "boolean",
                description:
                  "Join participants as viewers by default (default: false)",
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
          description:
            "[Meet API v2 GA] Update configuration of a Google Meet space",
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
                description:
                  "Updated presentation restriction level (optional)",
              },
            },
            required: ["space_name"],
          },
        },
        {
          name: "meet_v2_end_active_conference",
          description:
            "[Meet API v2 GA] End the active conference in a Google Meet space",
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
          description:
            "[Meet API v2 GA] List conference records for historical meetings",
          inputSchema: {
            type: "object",
            properties: {
              filter: {
                type: "string",
                description:
                  'Filter for conference records (e.g., space.name="spaces/{space_id}")',
              },
              page_size: {
                type: "number",
                description:
                  "Maximum number of results to return (default: 10, max: 50)",
              },
            },
            required: [],
          },
        },
        {
          name: "meet_v2_get_conference_record",
          description:
            "[Meet API v2 GA] Get details of a specific conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: {
                type: "string",
                description:
                  "Name of the conference record (conferenceRecords/{record_id})",
              },
            },
            required: ["conference_record_name"],
          },
        },
        {
          name: "meet_v2_list_recordings",
          description:
            "[Meet API v2 GA] List recordings for a conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: {
                type: "string",
                description:
                  "Name of the conference record (conferenceRecords/{record_id})",
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
                description:
                  "Name of the recording (conferenceRecords/{record_id}/recordings/{recording_id})",
              },
            },
            required: ["recording_name"],
          },
        },
        {
          name: "meet_v2_list_transcripts",
          description:
            "[Meet API v2 GA] List transcripts for a conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: {
                type: "string",
                description:
                  "Name of the conference record (conferenceRecords/{record_id})",
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
                description:
                  "Name of the transcript (conferenceRecords/{record_id}/transcripts/{transcript_id})",
              },
            },
            required: ["transcript_name"],
          },
        },
        {
          name: "meet_v2_list_transcript_entries",
          description:
            "[Meet API v2 GA] List transcript entries (individual speech segments)",
          inputSchema: {
            type: "object",
            properties: {
              transcript_name: {
                type: "string",
                description:
                  "Name of the transcript (conferenceRecords/{record_id}/transcripts/{transcript_id})",
              },
              page_size: {
                type: "number",
                description:
                  "Maximum number of entries to return (default: 100, max: 1000)",
              },
            },
            required: ["transcript_name"],
          },
        },

        // Additional Google Meet API v2 Tools (From Official Specs)
        // NOTE: Delete space removed - not supported by Google Meet API v2
        {
          name: "meet_v2_get_participant",
          description:
            "[Meet API v2 GA] Get details of a specific participant",
          inputSchema: {
            type: "object",
            properties: {
              participant_name: {
                type: "string",
                description:
                  "Name of the participant (conferenceRecords/{record_id}/participants/{participant_id})",
              },
            },
            required: ["participant_name"],
          },
        },
        {
          name: "meet_v2_list_participants",
          description:
            "[Meet API v2 GA] List participants for a conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: {
                type: "string",
                description:
                  "Name of the conference record (conferenceRecords/{record_id})",
              },
              page_size: {
                type: "number",
                description:
                  "Maximum number of participants to return (default: 10, max: 100)",
              },
            },
            required: ["conference_record_name"],
          },
        },
        {
          name: "meet_v2_get_participant_session",
          description:
            "[Meet API v2 GA] Get details of a specific participant session",
          inputSchema: {
            type: "object",
            properties: {
              participant_session_name: {
                type: "string",
                description:
                  "Name of the participant session (conferenceRecords/{record_id}/participants/{participant_id}/sessions/{session_id})",
              },
            },
            required: ["participant_session_name"],
          },
        },
        {
          name: "meet_v2_list_participant_sessions",
          description:
            "[Meet API v2 GA] List sessions for a specific participant",
          inputSchema: {
            type: "object",
            properties: {
              participant_name: {
                type: "string",
                description:
                  "Name of the participant (conferenceRecords/{record_id}/participants/{participant_id})",
              },
              page_size: {
                type: "number",
                description:
                  "Maximum number of sessions to return (default: 10, max: 100)",
              },
            },
            required: ["participant_name"],
          },
        },
        // NOTE: get_transcript_entry removed - not supported by Google Meet API v2
        // Use meet_v2_list_transcript_entries instead


      ],
    };
  }

  /**
   * Handle tool calls
   */
  async handleCallTool(request) {
    // Initialize the API if not already initialized
    if (!this.googleMeet.calendar) {
      try {
        await this.googleMeet.initialize();
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error initializing Google Meet API: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    const toolName = request.params.name;
    const args = request.params.arguments || {};

    try {
      // Google Calendar API v3 Tools
      if (toolName === "calendar_v3_list_calendars") {
        const calendars = await this.googleMeet.listCalendars();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(calendars, null, 2),
            },
          ],
        };
      } else if (toolName === "calendar_v3_list_events") {
        const maxResults = args.max_results || 10;
        const timeMin = args.time_min || null;
        const timeMax = args.time_max || null;
        const calendarId = args.calendar_id || "primary";

        const events = await this.googleMeet.listCalendarEvents(
          maxResults,
          timeMin,
          timeMax,
          calendarId
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      } else if (toolName === "calendar_v3_get_event") {
        const eventId = args.event_id;
        if (!eventId) {
          throw new McpError(ErrorCode.InvalidParams, "event_id is required");
        }

        const event = await this.googleMeet.getCalendarEvent(eventId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(event, null, 2),
            },
          ],
        };
      } else if (toolName === "calendar_v3_create_event") {
        const {
          summary,
          description = "",
          location = "",
          start_time,
          end_time,
          time_zone = "UTC",
          attendees = [],
          create_meet_conference = false,
          guest_can_invite_others = true,
          guest_can_modify = false,
          guest_can_see_other_guests = true,
          calendar_id = "primary",
        } = args;

        // Validate required parameters
        if (!summary || !start_time || !end_time) {
          const missing = [];
          if (!summary) missing.push("summary");
          if (!start_time) missing.push("start_time");
          if (!end_time) missing.push("end_time");

          throw new McpError(
            ErrorCode.InvalidParams,
            `Missing required parameters: ${missing.join(", ")}`
          );
        }

        const event = await this.googleMeet.createCalendarEvent({
          summary,
          description,
          location,
          startTime: start_time,
          endTime: end_time,
          timeZone: time_zone,
          attendees,
          createMeetConference: create_meet_conference,
          guestPermissions: {
            canInviteOthers: guest_can_invite_others,
            canModify: guest_can_modify,
            canSeeOtherGuests: guest_can_see_other_guests,
          },
          calendarId: calendar_id,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(event, null, 2),
            },
          ],
        };
      } else if (toolName === "calendar_v3_update_event") {
        const {
          event_id,
          summary,
          description,
          location,
          start_time,
          end_time,
          time_zone,
          attendees,
          guest_can_invite_others,
          guest_can_modify,
          guest_can_see_other_guests,
        } = args;

        if (!event_id) {
          throw new McpError(ErrorCode.InvalidParams, "event_id is required");
        }

        // Extract optional parameters
        const updateData = {};
        if (summary !== undefined) updateData.summary = summary;
        if (description !== undefined) updateData.description = description;
        if (location !== undefined) updateData.location = location;
        if (start_time !== undefined) updateData.startTime = start_time;
        if (end_time !== undefined) updateData.endTime = end_time;
        if (time_zone !== undefined) updateData.timeZone = time_zone;
        if (attendees !== undefined) updateData.attendees = attendees;
        if (guest_can_invite_others !== undefined)
          updateData.guestCanInviteOthers = guest_can_invite_others;
        if (guest_can_modify !== undefined)
          updateData.guestCanModify = guest_can_modify;
        if (guest_can_see_other_guests !== undefined)
          updateData.guestCanSeeOtherGuests = guest_can_see_other_guests;

        if (Object.keys(updateData).length === 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "At least one field to update must be provided"
          );
        }

        const event = await this.googleMeet.updateCalendarEvent(
          event_id,
          updateData
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(event, null, 2),
            },
          ],
        };
      } else if (toolName === "calendar_v3_delete_event") {
        const { event_id } = args;

        if (!event_id) {
          throw new McpError(ErrorCode.InvalidParams, "event_id is required");
        }

        await this.googleMeet.deleteCalendarEvent(event_id);

        return {
          content: [
            {
              type: "text",
              text: "Calendar event successfully deleted",
            },
          ],
        };
      }

      // Google Meet API v2 Tools (GA - Generally Available)
      else if (toolName === "meet_v2_create_space") {
        const config = {
          accessType: args.access_type || "TRUSTED",
          enableRecording: args.enable_recording || false,
          enableTranscription: args.enable_transcription || false,
          enableSmartNotes: args.enable_smart_notes || false,
          attendanceReport: args.attendance_report || false,
          moderationMode: args.moderation_mode || "OFF",
          chatRestriction: args.chat_restriction || "NO_RESTRICTION",
          presentRestriction: args.present_restriction || "NO_RESTRICTION",
          defaultJoinAsViewer: args.default_join_as_viewer || false,
        };

        const space = await this.googleMeet.createMeetSpace(config);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(space, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_get_space") {
        const { space_name } = args;

        if (!space_name) {
          throw new McpError(ErrorCode.InvalidParams, "space_name is required");
        }

        const space = await this.googleMeet.getMeetSpace(space_name);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(space, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_update_space") {
        const {
          space_name,
          access_type,
          moderation_mode,
          chat_restriction,
          present_restriction,
        } = args;

        if (!space_name) {
          throw new McpError(ErrorCode.InvalidParams, "space_name is required");
        }

        const updateData = {};
        if (access_type !== undefined) updateData.accessType = access_type;
        if (moderation_mode !== undefined)
          updateData.moderationMode = moderation_mode;
        if (chat_restriction !== undefined)
          updateData.chatRestriction = chat_restriction;
        if (present_restriction !== undefined)
          updateData.presentRestriction = present_restriction;

        if (Object.keys(updateData).length === 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "At least one field to update must be provided"
          );
        }

        const space = await this.googleMeet.updateMeetSpace(
          space_name,
          updateData
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(space, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_end_active_conference") {
        const { space_name } = args;

        if (!space_name) {
          throw new McpError(ErrorCode.InvalidParams, "space_name is required");
        }

        const result = await this.googleMeet.endActiveConference(space_name);

        return {
          content: [
            {
              type: "text",
              text: result
                ? "Active conference ended successfully"
                : "No active conference to end",
            },
          ],
        };
      } else if (toolName === "meet_v2_list_conference_records") {
        const filter = args.filter || null;
        const pageSize = args.page_size || 10;

        const records = await this.googleMeet.listConferenceRecords(
          filter,
          pageSize
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(records, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_get_conference_record") {
        const { conference_record_name } = args;

        if (!conference_record_name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "conference_record_name is required"
          );
        }

        const record = await this.googleMeet.getConferenceRecord(
          conference_record_name
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(record, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_list_recordings") {
        const { conference_record_name } = args;

        if (!conference_record_name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "conference_record_name is required"
          );
        }

        const recordings = await this.googleMeet.listRecordings(
          conference_record_name
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(recordings, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_get_recording") {
        const { recording_name } = args;

        if (!recording_name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "recording_name is required"
          );
        }

        const recording = await this.googleMeet.getRecording(recording_name);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(recording, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_list_transcripts") {
        const { conference_record_name } = args;

        if (!conference_record_name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "conference_record_name is required"
          );
        }

        const transcripts = await this.googleMeet.listTranscripts(
          conference_record_name
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(transcripts, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_get_transcript") {
        const { transcript_name } = args;

        if (!transcript_name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "transcript_name is required"
          );
        }

        const transcript = await this.googleMeet.getTranscript(transcript_name);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(transcript, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_list_transcript_entries") {
        const { transcript_name, page_size = 100 } = args;

        if (!transcript_name) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "transcript_name is required"
          );
        }

        const entries = await this.googleMeet.listTranscriptEntries(
          transcript_name,
          page_size
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(entries, null, 2),
            },
          ],
        };
      }

 

      // Additional Google Meet API v2 Tools (From Official Specs)
      // NOTE: delete_space handler removed - not supported by API
      else if (toolName === "meet_v2_get_participant") {
        const { participant_name } = args;

        if (!participant_name) {
          throw new McpError(ErrorCode.InvalidParams, "participant_name is required");
        }

        const participant = await this.googleMeet.getParticipant(participant_name);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(participant, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_list_participants") {
        const { conference_record_name, page_size = 10 } = args;

        if (!conference_record_name) {
          throw new McpError(ErrorCode.InvalidParams, "conference_record_name is required");
        }

        const participants = await this.googleMeet.listParticipants(
          conference_record_name,
          page_size
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(participants, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_get_participant_session") {
        const { participant_session_name } = args;

        if (!participant_session_name) {
          throw new McpError(ErrorCode.InvalidParams, "participant_session_name is required");
        }

        const session = await this.googleMeet.getParticipantSession(participant_session_name);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(session, null, 2),
            },
          ],
        };
      } else if (toolName === "meet_v2_list_participant_sessions") {
        const { participant_name, page_size = 10 } = args;

        if (!participant_name) {
          throw new McpError(ErrorCode.InvalidParams, "participant_name is required");
        }

        const sessions = await this.googleMeet.listParticipantSessions(
          participant_name,
          page_size
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(sessions, null, 2),
            },
          ],
        };
      } 
      // NOTE: get_transcript_entry handler removed - not supported by API
      // NOTE: All v2beta handlers removed - beta features are disabled
      else {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`
        );
      }
    } catch (error) {
      // Handle any errors from Google API or MCP errors
      if (error instanceof McpError) {
        throw error;
      }

      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Run the server
   */
  async run() {
    const transport = new StdioServerTransport();
    console.error("Google Meet MCP server starting on stdio...");
    await this.server.connect(transport);
    console.error("Google Meet MCP server connected");
  }
}

// Create and run the server
const server = new GoogleMeetMcpServer();
server.run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
