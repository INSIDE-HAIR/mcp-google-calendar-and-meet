// Next.js MCP Adapter - Integrates Google Meet MCP Server with Next.js
import { GoogleMeetAPI } from '../src/GoogleMeetAPI.js';

export class NextJSMCPAdapter {
  constructor(userCredentials) {
    this.userCredentials = userCredentials;
    this.googleMeetAPI = null;
  }

  async initialize() {
    if (!this.googleMeetAPI) {
      this.googleMeetAPI = new GoogleMeetAPI();
      
      // Set user credentials instead of reading from file
      if (this.userCredentials) {
        this.googleMeetAPI.oauth2Client.setCredentials({
          access_token: this.userCredentials.access_token,
          refresh_token: this.userCredentials.refresh_token,
          scope: this.userCredentials.scope,
          token_type: this.userCredentials.token_type,
          expiry_date: this.userCredentials.expiry_date
        });
      }
    }
  }

  async handleMCPRequest(mcpRequest) {
    try {
      await this.initialize();

      const { method, params } = mcpRequest;
      
      if (method === 'tools/list') {
        return this.listTools();
      }
      
      if (method === 'tools/call') {
        return await this.callTool(params.name, params.arguments);
      }

      throw new Error(`Unknown MCP method: ${method}`);
    } catch (error) {
      console.error('MCP Adapter Error:', error);
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }]
      };
    }
  }

  listTools() {
    return {
      tools: [
        // Calendar API v3 tools
        {
          name: "calendar_v3_list_events",
          description: "List calendar events with optional Meet links filtering",
          inputSchema: {
            type: "object",
            properties: {
              calendar_id: { type: "string", default: "primary" },
              time_min: { type: "string", description: "RFC3339 timestamp" },
              time_max: { type: "string", description: "RFC3339 timestamp" },
              max_results: { type: "number", default: 10 },
              single_events: { type: "boolean", default: true },
              order_by: { type: "string", default: "startTime" }
            }
          }
        },
        {
          name: "calendar_v3_get_event",
          description: "Get specific calendar event details including guest permissions",
          inputSchema: {
            type: "object",
            properties: {
              calendar_id: { type: "string", default: "primary" },
              event_id: { type: "string", description: "Calendar event ID" }
            },
            required: ["event_id"]
          }
        },
        {
          name: "calendar_v3_create_event",
          description: "Create calendar event with optional Google Meet conference and guest permissions",
          inputSchema: {
            type: "object",
            properties: {
              calendar_id: { type: "string", default: "primary" },
              summary: { type: "string", description: "Event title" },
              description: { type: "string", description: "Event description" },
              start_time: { type: "string", description: "RFC3339 timestamp" },
              end_time: { type: "string", description: "RFC3339 timestamp" },
              attendees: { 
                type: "array", 
                items: { type: "string" }, 
                description: "Array of email addresses" 
              },
              create_meet_conference: { type: "boolean", default: false },
              guest_can_invite_others: { type: "boolean", default: true },
              guest_can_modify: { type: "boolean", default: false },
              guest_can_see_other_guests: { type: "boolean", default: true }
            },
            required: ["summary", "start_time", "end_time"]
          }
        },
        {
          name: "calendar_v3_update_event",
          description: "Update existing calendar event including all guest permissions",
          inputSchema: {
            type: "object",
            properties: {
              calendar_id: { type: "string", default: "primary" },
              event_id: { type: "string", description: "Calendar event ID" },
              summary: { type: "string" },
              description: { type: "string" },
              start_time: { type: "string", description: "RFC3339 timestamp" },
              end_time: { type: "string", description: "RFC3339 timestamp" },
              attendees: { type: "array", items: { type: "string" } },
              guest_can_invite_others: { type: "boolean" },
              guest_can_modify: { type: "boolean" },
              guest_can_see_other_guests: { type: "boolean" }
            },
            required: ["event_id"]
          }
        },
        {
          name: "calendar_v3_delete_event",
          description: "Delete calendar event",
          inputSchema: {
            type: "object",
            properties: {
              calendar_id: { type: "string", default: "primary" },
              event_id: { type: "string", description: "Calendar event ID" }
            },
            required: ["event_id"]
          }
        },
        
        // Meet API v2 tools
        {
          name: "meet_v2_create_space",
          description: "Create Google Meet space with advanced enterprise configuration",
          inputSchema: {
            type: "object",
            properties: {
              access_type: { 
                type: "string", 
                enum: ["OPEN", "TRUSTED", "RESTRICTED"], 
                default: "TRUSTED" 
              },
              enable_recording: { type: "boolean", default: false },
              enable_transcription: { type: "boolean", default: false },
              enable_smart_notes: { type: "boolean", default: false },
              moderation_mode: { 
                type: "string", 
                enum: ["OFF", "ON"], 
                default: "OFF" 
              },
              chat_restriction: { 
                type: "string", 
                enum: ["UNRESTRICTED", "HOSTS_ONLY"], 
                default: "UNRESTRICTED" 
              },
              presentation_restriction: { 
                type: "string", 
                enum: ["UNRESTRICTED", "HOSTS_ONLY"], 
                default: "UNRESTRICTED" 
              }
            }
          }
        },
        {
          name: "meet_v2_get_space",
          description: "Get Google Meet space details and configuration",
          inputSchema: {
            type: "object",
            properties: {
              space_name: { type: "string", description: "Space resource name (spaces/xxx)" }
            },
            required: ["space_name"]
          }
        },
        {
          name: "meet_v2_update_space",
          description: "Update Google Meet space configuration",
          inputSchema: {
            type: "object",
            properties: {
              space_name: { type: "string", description: "Space resource name" },
              access_type: { type: "string", enum: ["OPEN", "TRUSTED", "RESTRICTED"] },
              enable_recording: { type: "boolean" },
              enable_transcription: { type: "boolean" },
              moderation_mode: { type: "string", enum: ["OFF", "ON"] }
            },
            required: ["space_name"]
          }
        },
        {
          name: "meet_v2_end_active_conference",
          description: "End active conference in a Meet space",
          inputSchema: {
            type: "object",
            properties: {
              space_name: { type: "string", description: "Space resource name" }
            },
            required: ["space_name"]
          }
        },
        {
          name: "meet_v2_list_conference_records",
          description: "List conference records for past meetings",
          inputSchema: {
            type: "object",
            properties: {
              filter: { type: "string", description: "Filter expression" },
              page_size: { type: "number", default: 10 }
            }
          }
        },
        {
          name: "meet_v2_get_conference_record",
          description: "Get specific conference record details",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: { type: "string", description: "Conference record resource name" }
            },
            required: ["conference_record_name"]
          }
        },
        {
          name: "meet_v2_list_recordings",
          description: "List recordings for a conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: { type: "string", description: "Conference record resource name" },
              page_size: { type: "number", default: 10 }
            },
            required: ["conference_record_name"]
          }
        },
        {
          name: "meet_v2_get_recording",
          description: "Get recording details and download information",
          inputSchema: {
            type: "object",
            properties: {
              recording_name: { type: "string", description: "Recording resource name" }
            },
            required: ["recording_name"]
          }
        },
        {
          name: "meet_v2_list_transcripts",
          description: "List transcripts for a conference record",
          inputSchema: {
            type: "object",
            properties: {
              conference_record_name: { type: "string", description: "Conference record resource name" },
              page_size: { type: "number", default: 10 }
            },
            required: ["conference_record_name"]
          }
        },
        {
          name: "meet_v2_get_transcript",
          description: "Get transcript details and content",
          inputSchema: {
            type: "object",
            properties: {
              transcript_name: { type: "string", description: "Transcript resource name" }
            },
            required: ["transcript_name"]
          }
        },
        {
          name: "meet_v2_list_transcript_entries",
          description: "List individual transcript entries (speech segments)",
          inputSchema: {
            type: "object",
            properties: {
              transcript_name: { type: "string", description: "Transcript resource name" },
              page_size: { type: "number", default: 10 }
            },
            required: ["transcript_name"]
          }
        }
      ]
    };
  }

  async callTool(toolName, args) {
    try {
      let result;

      // Calendar API v3 tools
      if (toolName === "calendar_v3_list_events") {
        result = await this.googleMeetAPI.listCalendarEvents(args);
      }
      else if (toolName === "calendar_v3_get_event") {
        result = await this.googleMeetAPI.getCalendarEvent(args);
      }
      else if (toolName === "calendar_v3_create_event") {
        result = await this.googleMeetAPI.createCalendarEvent(args);
      }
      else if (toolName === "calendar_v3_update_event") {
        result = await this.googleMeetAPI.updateCalendarEvent(args);
      }
      else if (toolName === "calendar_v3_delete_event") {
        result = await this.googleMeetAPI.deleteCalendarEvent(args);
      }
      
      // Meet API v2 tools
      else if (toolName === "meet_v2_create_space") {
        result = await this.googleMeetAPI.createMeetSpace(args);
      }
      else if (toolName === "meet_v2_get_space") {
        result = await this.googleMeetAPI.getMeetSpace(args);
      }
      else if (toolName === "meet_v2_update_space") {
        result = await this.googleMeetAPI.updateMeetSpace(args);
      }
      else if (toolName === "meet_v2_end_active_conference") {
        result = await this.googleMeetAPI.endActiveConference(args);
      }
      else if (toolName === "meet_v2_list_conference_records") {
        result = await this.googleMeetAPI.listConferenceRecords(args);
      }
      else if (toolName === "meet_v2_get_conference_record") {
        result = await this.googleMeetAPI.getConferenceRecord(args);
      }
      else if (toolName === "meet_v2_list_recordings") {
        result = await this.googleMeetAPI.listRecordings(args);
      }
      else if (toolName === "meet_v2_get_recording") {
        result = await this.googleMeetAPI.getRecording(args);
      }
      else if (toolName === "meet_v2_list_transcripts") {
        result = await this.googleMeetAPI.listTranscripts(args);
      }
      else if (toolName === "meet_v2_get_transcript") {
        result = await this.googleMeetAPI.getTranscript(args);
      }
      else if (toolName === "meet_v2_list_transcript_entries") {
        result = await this.googleMeetAPI.listTranscriptEntries(args);
      }
      else {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      return {
        content: [{
          type: "text",
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }]
      };

    } catch (error) {
      console.error(`Tool ${toolName} error:`, error);
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Error executing ${toolName}: ${error.message}`
        }]
      };
    }
  }
}

export default NextJSMCPAdapter;