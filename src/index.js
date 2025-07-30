#!/usr/bin/env node

/**
 * Google Meet MCP Server
 * This implements the Model Context Protocol server for Google Meet
 * functionality via the Google Calendar API.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ErrorCode,
  ListToolsRequestSchema, 
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import GoogleMeetAPI from './GoogleMeetAPI.js';

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
        name: 'google-meet-mcp',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        }
      }
    );

    // Setup Google Meet API client - support both configuration methods
    let credentialsPath, tokenPath;
    
    if (process.env.GOOGLE_OAUTH_CREDENTIALS) {
      // Simplified configuration (single variable)
      credentialsPath = process.env.GOOGLE_OAUTH_CREDENTIALS;
      tokenPath = credentialsPath.replace(/\.json$/, '.token.json');
    } else if (process.env.GOOGLE_MEET_CREDENTIALS_PATH && process.env.GOOGLE_MEET_TOKEN_PATH) {
      // Local development configuration (two variables)
      credentialsPath = process.env.GOOGLE_MEET_CREDENTIALS_PATH;
      tokenPath = process.env.GOOGLE_MEET_TOKEN_PATH;
    } else {
      console.error("Error: Missing required environment variables.");
      console.error("Please set either:");
      console.error("  - GOOGLE_OAUTH_CREDENTIALS (path to OAuth credentials file)");
      console.error("  - OR both GOOGLE_MEET_CREDENTIALS_PATH and GOOGLE_MEET_TOKEN_PATH");
      process.exit(1);
    }

    this.googleMeet = new GoogleMeetAPI(credentialsPath, tokenPath);
    
    // Setup request handlers
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = error => console.error(`[MCP Error] ${error}`);
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up the tool request handlers
   */
  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, this.handleListTools.bind(this));
    this.server.setRequestHandler(CallToolRequestSchema, this.handleCallTool.bind(this));
  }

  /**
   * Handle requests to list available tools
   */
  async handleListTools() {
    return {
      tools: [
        {
          name: 'calendar_list_meetings',
          description: '[Calendar API] List upcoming Google Meet meetings from calendar',
          inputSchema: {
            type: 'object',
            properties: {
              max_results: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)'
              },
              time_min: {
                type: 'string',
                description: 'Start time in ISO format (default: now)'
              },
              time_max: {
                type: 'string',
                description: 'End time in ISO format (optional)'
              }
            },
            required: []
          }
        },
        {
          name: 'calendar_get_meeting',
          description: '[Calendar API] Get details of a specific Google Meet meeting',
          inputSchema: {
            type: 'object',
            properties: {
              meeting_id: {
                type: 'string',
                description: 'ID of the meeting to retrieve'
              }
            },
            required: ['meeting_id']
          }
        },
        {
          name: 'calendar_create_meeting',
          description: '[Calendar API] Create a new Google Meet meeting with advanced features documented',
          inputSchema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'Title of the meeting'
              },
              description: {
                type: 'string', 
                description: 'Description for the meeting (optional)'
              },
              start_time: {
                type: 'string',
                description: 'Start time in ISO format'
              },
              end_time: {
                type: 'string',
                description: 'End time in ISO format'
              },
              attendees: {
                type: 'array',
                description: 'List of email addresses for attendees (optional)',
                items: {
                  type: 'string'
                }
              },
              enable_recording: {
                type: 'boolean',
                description: 'Enable recording for the meeting (requires Google Workspace Business Standard or higher)'
              },
              co_hosts: {
                type: 'array',
                description: 'List of email addresses for co-hosts (optional)',
                items: {
                  type: 'string'
                }
              },
              enable_transcription: {
                type: 'boolean',
                description: 'Enable automatic transcription (requires Google Workspace)'
              },
              enable_smart_notes: {
                type: 'boolean',
                description: 'Enable automatic smart notes (requires Google Workspace)'
              },
              attendance_report: {
                type: 'boolean',
                description: 'Enable attendance report generation'
              },
              space_config: {
                type: 'object',
                description: 'Advanced space configuration options',
                properties: {
                  moderation_mode: {
                    type: 'string',
                    enum: ['ON', 'OFF'],
                    description: 'Enable moderation for the meeting'
                  },
                  chat_restriction: {
                    type: 'string',
                    enum: ['HOSTS_ONLY', 'NO_RESTRICTION'],
                    description: 'Chat restriction level'
                  },
                  present_restriction: {
                    type: 'string',
                    enum: ['HOSTS_ONLY', 'NO_RESTRICTION'],
                    description: 'Presentation restriction level'
                  },
                  default_join_as_viewer: {
                    type: 'boolean',
                    description: 'Join participants as viewers by default'
                  }
                }
              },
              guest_permissions: {
                type: 'object',
                description: 'Guest permissions for Calendar API',
                properties: {
                  can_invite_others: {
                    type: 'boolean',
                    description: 'Allow guests to invite other people (default: true)'
                  },
                  can_modify: {
                    type: 'boolean', 
                    description: 'Allow guests to modify the event (default: false)'
                  },
                  can_see_other_guests: {
                    type: 'boolean',
                    description: 'Allow guests to see other attendees (default: true)'
                  }
                }
              }
            },
            required: ['summary', 'start_time', 'end_time']
          }
        },
        {
          name: 'calendar_update_meeting',
          description: '[Calendar API] Update an existing Google Meet meeting',
          inputSchema: {
            type: 'object',
            properties: {
              meeting_id: {
                type: 'string',
                description: 'ID of the meeting to update'
              },
              summary: {
                type: 'string', 
                description: 'Updated title of the meeting (optional)'
              },
              description: {
                type: 'string', 
                description: 'Updated description for the meeting (optional)'
              },
              start_time: {
                type: 'string', 
                description: 'Updated start time in ISO format (optional)'
              },
              end_time: {
                type: 'string', 
                description: 'Updated end time in ISO format (optional)'
              },
              attendees: {
                type: 'array', 
                description: 'Updated list of email addresses for attendees (optional)',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['meeting_id']
          }
        },
        {
          name: 'calendar_delete_meeting',
          description: '[Calendar API] Delete a Google Meet meeting',
          inputSchema: {
            type: 'object',
            properties: {
              meeting_id: {
                type: 'string',
                description: 'ID of the meeting to delete'
              }
            },
            required: ['meeting_id']
          }
        },
        {
          name: 'meet_get_recordings',
          description: '[Meet API - Simulated] Get recordings info for a Google Meet (requires Google Workspace)',
          inputSchema: {
            type: 'object',
            properties: {
              meeting_code: {
                type: 'string',
                description: 'The meeting code from the Google Meet URL (e.g., "abc-defg-hij")'
              }
            },
            required: ['meeting_code']
          }
        },
        {
          name: 'meet_list_members',
          description: '[Meet API - Simulated] List members of a Google Meet space (returns empty list)',
          inputSchema: {
            type: 'object',
            properties: {
              space_name: {
                type: 'string',
                description: 'Name of the space (spaces/{space_id})'
              }
            },
            required: ['space_name']
          }
        },
        {
          name: 'meet_get_member',
          description: '[Meet API - Not Available] Get details of a specific space member',
          inputSchema: {
            type: 'object',
            properties: {
              member_name: {
                type: 'string',
                description: 'Full name of the member (spaces/{space}/members/{member})'
              }
            },
            required: ['member_name']
          }
        },
        {
          name: 'meet_add_cohosts',
          description: '[Meet API - Documented] Add co-hosts info to meeting description (manual promotion needed)',
          inputSchema: {
            type: 'object',
            properties: {
              meeting_id: {
                type: 'string',
                description: 'Meeting ID to add co-hosts documentation to'
              },
              cohost_emails: {
                type: 'array',
                description: 'List of email addresses to document as co-hosts',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['meeting_id', 'cohost_emails']
          }
        },
        {
          name: 'meet_remove_member',
          description: '[Meet API - Not Available] Remove a member from a Google Meet space',
          inputSchema: {
            type: 'object',
            properties: {
              member_name: {
                type: 'string',
                description: 'Full name of the member to remove (spaces/{space}/members/{member})'
              }
            },
            required: ['member_name']
          }
        }
      ]
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
              type: 'text',
              text: `Error initializing Google Meet API: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }

    const toolName = request.params.name;
    const args = request.params.arguments || {};

    try {
      if (toolName === 'calendar_list_meetings') {
        const maxResults = args.max_results || 10;
        const timeMin = args.time_min || null;
        const timeMax = args.time_max || null;

        const meetings = await this.googleMeet.listMeetings(
          maxResults,
          timeMin,
          timeMax
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(meetings, null, 2)
            }
          ]
        };
      } 
      else if (toolName === 'calendar_get_meeting') {
        const meetingId = args.meeting_id;
        if (!meetingId) {
          throw new McpError(ErrorCode.InvalidParams, 'meeting_id is required');
        }

        const meeting = await this.googleMeet.getMeeting(meetingId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(meeting, null, 2)
            }
          ]
        };
      } 
      else if (toolName === 'calendar_create_meeting') {
        const { 
          summary, 
          description = '', 
          start_time, 
          end_time, 
          attendees = [], 
          enable_recording = false,
          co_hosts = [],
          enable_transcription = false,
          enable_smart_notes = false,
          attendance_report = false,
          space_config = {},
          guest_permissions = {}
        } = args;

        // Validate required parameters
        if (!summary || !start_time || !end_time) {
          const missing = [];
          if (!summary) missing.push('summary');
          if (!start_time) missing.push('start_time');
          if (!end_time) missing.push('end_time');

          throw new McpError(
            ErrorCode.InvalidParams,
            `Missing required parameters: ${missing.join(', ')}`
          );
        }

        const meeting = await this.googleMeet.createMeeting(
          summary,
          start_time,
          end_time,
          description,
          attendees,
          enable_recording,
          {
            coHosts: co_hosts,
            enableTranscription: enable_transcription,
            enableSmartNotes: enable_smart_notes,
            attendanceReport: attendance_report,
            spaceConfig: space_config,
            guestPermissions: guest_permissions
          }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(meeting, null, 2)
            }
          ]
        };
      } 
      else if (toolName === 'calendar_update_meeting') {
        const { meeting_id, summary, description, start_time, end_time, attendees } = args;

        if (!meeting_id) {
          throw new McpError(ErrorCode.InvalidParams, 'meeting_id is required');
        }

        // Extract optional parameters
        const updateData = {};
        if (summary !== undefined) updateData.summary = summary;
        if (description !== undefined) updateData.description = description;
        if (start_time !== undefined) updateData.startTime = start_time;
        if (end_time !== undefined) updateData.endTime = end_time;
        if (attendees !== undefined) updateData.attendees = attendees;

        if (Object.keys(updateData).length === 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'At least one field to update must be provided'
          );
        }

        const meeting = await this.googleMeet.updateMeeting(meeting_id, updateData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(meeting, null, 2)
            }
          ]
        };
      } 
      else if (toolName === 'calendar_delete_meeting') {
        const { meeting_id } = args;
        
        if (!meeting_id) {
          throw new McpError(ErrorCode.InvalidParams, 'meeting_id is required');
        }

        await this.googleMeet.deleteMeeting(meeting_id);

        return {
          content: [
            {
              type: 'text',
              text: 'Meeting successfully deleted'
            }
          ]
        };
      }
      else if (toolName === 'meet_get_recordings') {
        const { meeting_code } = args;
        
        if (!meeting_code) {
          throw new McpError(ErrorCode.InvalidParams, 'meeting_code is required');
        }

        const recordings = await this.googleMeet.getMeetingRecordings(meeting_code);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(recordings, null, 2)
            }
          ]
        };
      }
      else if (toolName === 'meet_list_members') {
        const { space_name } = args;
        
        if (!space_name) {
          throw new McpError(ErrorCode.InvalidParams, 'space_name is required');
        }

        const members = await this.googleMeet.listSpaceMembers(space_name);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(members, null, 2)
            }
          ]
        };
      }
      else if (toolName === 'meet_get_member') {
        const { member_name } = args;
        
        if (!member_name) {
          throw new McpError(ErrorCode.InvalidParams, 'member_name is required');
        }

        const member = await this.googleMeet.getSpaceMember(member_name);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(member, null, 2)
            }
          ]
        };
      }
      else if (toolName === 'meet_add_cohosts') {
        const { meeting_id, cohost_emails } = args;
        
        if (!meeting_id || !cohost_emails || cohost_emails.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, 'meeting_id and cohost_emails are required');
        }

        // Get current meeting
        const meeting = await this.googleMeet.getMeeting(meeting_id);
        
        // Update description with co-host information
        const cohostInfo = `\\n\\n👥 Co-hosts assigned: ${cohost_emails.join(', ')} (promote manually in meeting)`;
        const updatedDescription = (meeting.description || '') + cohostInfo;
        
        const updatedMeeting = await this.googleMeet.updateMeeting(meeting_id, {
          description: updatedDescription
        });

        return {
          content: [
            {
              type: 'text',
              text: `Co-hosts documented in meeting description: ${cohost_emails.join(', ')}`
            }
          ]
        };
      }
      else if (toolName === 'meet_remove_member') {
        const { member_name } = args;
        
        if (!member_name) {
          throw new McpError(ErrorCode.InvalidParams, 'member_name is required');
        }

        const result = await this.googleMeet.removeSpaceMember(member_name);

        return {
          content: [
            {
              type: 'text',
              text: result ? 'Member successfully removed' : 'Failed to remove member'
            }
          ]
        };
      }
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
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Run the server
   */
  async run() {
    const transport = new StdioServerTransport();
    console.error('Google Meet MCP server starting on stdio...');
    await this.server.connect(transport);
    console.error('Google Meet MCP server connected');
  }
}

// Create and run the server
const server = new GoogleMeetMcpServer();
server.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
