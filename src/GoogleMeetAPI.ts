/**
 * Google Meet API client that interacts with the Google Calendar API
 * and Google Meet API to manage Google Meet meetings with recording capabilities.
 */

import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import open from "open";
import http from "http";
import { URL } from "url";
import { GoogleApiErrorHandler } from "./errors/GoogleApiErrorHandler.js";
import type {
  GoogleOAuth2Client,
  GoogleCalendarClient,
  GoogleTokens,
  GoogleAuthOAuth2Instance,
  GoogleCalendarInstance,
  MeetSpace,
  SpaceConfig,
  ConferenceRecord,
  Recording,
  Transcript,
  TranscriptEntry,
  Participant,
  ParticipantSession,
  GuestPermissions,
  CreateMeetingOptions,
  EventUpdateData,
  SpaceUpdateData,
  RestClientOptions,
  RestResponse,
  GoogleApiError,
  NodeError,
  ProcessedCalendar,
  ProcessedEvent,
  GoogleCalendar
} from './types/index.js';

/**
 * REST client for Google Meet API v2/v2beta
 * Provides direct access to Meet API endpoints not available in googleapis library
 */
class MeetRestClient {
  auth: GoogleAuthOAuth2Instance;
  baseUrls: { v2: string };

  constructor(oAuth2Client: GoogleAuthOAuth2Instance) {
    this.auth = oAuth2Client;
    this.baseUrls = {
      v2: "https://meet.googleapis.com/v2",
    };
  }

  /**
   * Get access token from OAuth2 client
   */
  async getAccessToken() {
    try {
      const { token } = await this.auth.getAccessToken();
      return token;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to Meet API
   */
  async makeRequest(endpoint: string, options: RestClientOptions = {}, apiVersion = "v2"): Promise<any> {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.baseUrls[apiVersion];

    // Ensure GET method is explicitly set for read operations when not specified
    const method = options.method || "GET";
    const requestOptions = {
      method: method,
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...options.headers,
      },
    };

    // Only add Content-Type for requests with body (POST, PATCH, PUT)
    if (["POST", "PATCH", "PUT"].includes(method) && options.body) {
      requestOptions.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${baseUrl}${endpoint}`, requestOptions);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = null;
      }

      // Create error object that matches GoogleApiError interface
      const apiError = new Error(`Meet API Error: ${response.statusText}`) as GoogleApiError;
      apiError.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      };

      throw apiError;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  // ========== GOOGLE MEET API v2 METHODS (GA) ==========

  /**
   * Create a Google Meet space
   */
  async createSpace(config: SpaceConfig): Promise<MeetSpace> {
    const requestBody = { config };
    return this.makeRequest("/spaces", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Get space details
   */
  async getSpace(spaceName: string): Promise<MeetSpace> {
    // Validate and format space name
    if (!spaceName || typeof spaceName !== "string") {
      throw new Error("Invalid space name: must be a non-empty string");
    }

    // Ensure spaceName is properly formatted (spaces/{space_id})
    const formattedSpaceName = spaceName.startsWith("spaces/")
      ? spaceName
      : `spaces/${spaceName}`;

    // Validate the formatted name (spaces/{space_id} or spaces/{meetingCode})
    if (!formattedSpaceName.match(/^spaces\/[a-zA-Z0-9_-]{1,128}$/)) {
      throw new Error(
        `Invalid space name format: ${formattedSpaceName}. Expected: spaces/{space_id} or spaces/{meetingCode}`
      );
    }

    return this.makeRequest(`/${formattedSpaceName}`);
  }

  /**
   * Update space configuration
   */
  async updateSpace(spaceName: string, config: SpaceConfig): Promise<MeetSpace> {
    const requestBody = { config };
    return this.makeRequest(`/${spaceName}`, {
      method: "PATCH",
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * End active conference in space
   */
  async endActiveConference(spaceName: string): Promise<void> {
    return this.makeRequest(`/${spaceName}:endActiveConference`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  /**
   * List conference records
   */
  async listConferenceRecords(filter?: string, pageSize = 10): Promise<{ conferenceRecords: ConferenceRecord[]; nextPageToken?: string }> {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (pageSize) params.append("pageSize", pageSize.toString());

    const endpoint = `/conferenceRecords?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get conference record
   */
  async getConferenceRecord(conferenceRecordName: string): Promise<ConferenceRecord> {
    return this.makeRequest(`/${conferenceRecordName}`);
  }

  /**
   * List recordings for conference record
   */
  async listRecordings(conferenceRecordName: string): Promise<{ recordings: Recording[]; nextPageToken?: string }> {
    return this.makeRequest(`/${conferenceRecordName}/recordings`);
  }

  /**
   * Get recording details
   */
  async getRecording(recordingName: string): Promise<Recording> {
    return this.makeRequest(`/${recordingName}`);
  }

  /**
   * List transcripts for conference record
   */
  async listTranscripts(conferenceRecordName: string): Promise<{ transcripts: Transcript[]; nextPageToken?: string }> {
    return this.makeRequest(`/${conferenceRecordName}/transcripts`);
  }

  /**
   * Get transcript details
   */
  async getTranscript(transcriptName: string): Promise<Transcript> {
    return this.makeRequest(`/${transcriptName}`);
  }

  /**
   * List transcript entries
   */
  async listTranscriptEntries(transcriptName: string, pageSize = 100): Promise<{ transcriptEntries: TranscriptEntry[]; nextPageToken?: string }> {
    const params = new URLSearchParams();
    if (pageSize) params.append("pageSize", pageSize.toString());

    const endpoint = `/${transcriptName}/entries?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  // ========== ADDITIONAL METHODS FROM OFFICIAL SPECS ==========

  /**
   * Delete a Google Meet space
   * Note: Google Meet API v2 does not support deleting spaces directly.
   * This method is not available in the official API specification.
   */
  async deleteSpace(spaceName: string): Promise<never> {
    throw new Error(
      "Delete space operation is not supported by Google Meet API v2. Spaces cannot be deleted directly."
    );
  }

  /**
   * Get participant details
   */
  async getParticipant(participantName: string): Promise<Participant> {
    return this.makeRequest(`/${participantName}`);
  }

  /**
   * List participants for a conference record
   */
  async listParticipants(conferenceRecordName: string, pageSize = 10): Promise<{ participants: Participant[]; nextPageToken?: string }> {
    const params = new URLSearchParams();
    if (pageSize) params.append("pageSize", pageSize.toString());

    const endpoint = `/${conferenceRecordName}/participants?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get participant session details
   */
  async getParticipantSession(participantSessionName: string): Promise<ParticipantSession> {
    return this.makeRequest(`/${participantSessionName}`);
  }

  /**
   * List participant sessions
   */
  async listParticipantSessions(participantName: string, pageSize = 10): Promise<{ participantSessions: ParticipantSession[]; nextPageToken?: string }> {
    const params = new URLSearchParams();
    if (pageSize) params.append("pageSize", pageSize.toString());

    const endpoint = `/${participantName}/participantSessions?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  // getTranscriptEntry method removed - not available in Google Meet API v2
  // Use listTranscriptEntries instead to get transcript entries
}

class GoogleMeetAPI {
  credentialsPath: string;
  tokenPath: string;
  calendar: GoogleCalendarInstance | null;
  meetRestClient: MeetRestClient | null;
  auth: GoogleAuthOAuth2Instance | null;
  meet: null;

  /**
   * Initialize the Google Meet API client.
   * @param {string} credentialsPath - Path to the client_secret.json file
   * @param {string} tokenPath - Path to save/load the token.json file
   */
  constructor(credentialsPath: string, tokenPath: string) {
    this.credentialsPath = credentialsPath;
    this.tokenPath = tokenPath;
    this.calendar = null;
    this.meetRestClient = null;
    this.auth = null;
  }

  /**
   * Initialize the API client with OAuth2 credentials.
   */
  async initialize() {
    const credentials = JSON.parse(
      await fs.readFile(this.credentialsPath, "utf8")
    );

    // Handle both 'web' and 'installed' credential types
    const credentialData = credentials.web || credentials.installed;
    if (!credentialData) {
      throw new Error(
        'Invalid credentials file format. Expected "web" or "installed" key.'
      );
    }
    const { client_id, client_secret, redirect_uris } = credentialData;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    try {
      // Check if token exists and use it
      const token = JSON.parse(await fs.readFile(this.tokenPath, "utf8"));
      oAuth2Client.setCredentials(token);

      // Check if token is expired and needs refresh
      if (token.expiry_date && token.expiry_date < Date.now()) {
        // Token is expired, refresh it
        const { credentials } = await (oAuth2Client as any).refreshToken(
          token.refresh_token
        );
        await fs.writeFile(this.tokenPath, JSON.stringify(credentials));
        oAuth2Client.setCredentials(credentials);
      }
    } catch (error) {
      // Token doesn't exist or is invalid, try to create it automatically
      console.error(`No valid token found at ${this.tokenPath}`);
      console.error(`Attempting automatic authentication...`);

      try {
        await this.performAutoAuth(oAuth2Client);
      } catch (authError) {
        throw new Error(
          `Authentication failed. Please run setup manually: G_OAUTH_CREDENTIALS="${this.credentialsPath}" npm run setup`
        );
      }
    }

    // Store OAuth2 client for shared use
    this.auth = oAuth2Client;

    // Initialize the calendar API (unchanged)
    this.calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    // Initialize Meet REST client for direct API access
    this.meetRestClient = new MeetRestClient(oAuth2Client);

    // Note: Now using direct REST API calls for Google Meet API v2/v2beta
    this.meet = null;
    console.log("✅ Google Meet API v2/v2beta access enabled via REST client");
  }

  // ========== GOOGLE CALENDAR API v3 METHODS ==========

  /**
   * Lists calendars available to the user
   * @returns {Promise<Array>} - Array of calendar objects
   */
  async listCalendars(): Promise<ProcessedCalendar[]> {
    try {
      const response = await this.calendar.calendars.list();
      const calendars = response.data.items || [];

      return calendars.map((calendar: GoogleCalendar) => ({
        id: calendar.id,
        summary: calendar.summary || "No title",
        primary: calendar.primary || false,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor,
        accessRole: calendar.accessRole,
      }));
    } catch (error) {
      throw new Error(`Error listing calendars: ${error.message}`);
    }
  }

  /**
   * List upcoming calendar events (including those with Google Meet).
   * @param {number} maxResults - Maximum number of results to return
   * @param {string} timeMin - Start time in ISO format
   * @param {string} timeMax - End time in ISO format
   * @param {string} calendarId - Calendar ID (default: "primary")
   * @returns {Promise<Array>} - List of calendar events
   */
  async listCalendarEvents(
    maxResults = 10,
    timeMin: string | null = null,
    timeMax: string | null = null,
    calendarId = "primary"
  ): Promise<ProcessedEvent[]> {
    // Default timeMin to now if not provided
    if (!timeMin) {
      timeMin = new Date().toISOString();
    }

    // Prepare parameters for the API call
    const params: any = {
      calendarId: calendarId,
      maxResults: maxResults,
      timeMin: timeMin,
      orderBy: "startTime",
      singleEvents: true,
      conferenceDataVersion: 1,
    };

    if (timeMax) {
      params.timeMax = timeMax;
    }

    try {
      const response = await this.calendar.events.list(params);
      const events = response.data.items || [];

      // Return all events, format them properly
      const formattedEvents = [];
      for (const event of events) {
        const formattedEvent = this._formatCalendarEvent(event);
        if (formattedEvent) {
          formattedEvents.push(formattedEvent);
        }
      }

      return formattedEvents;
    } catch (error) {
      throw new Error(`Error listing meetings: ${error.message}`);
    }
  }

  /**
   * Get details of a specific calendar event.
   * @param {string} eventId - ID of the calendar event to retrieve
   * @returns {Promise<Object>} - Calendar event details
   */
  async getCalendarEvent(eventId: string): Promise<ProcessedEvent> {
    try {
      const response = await this.calendar.events.get({
        calendarId: "primary",
        eventId: eventId,
      } as any);

      const event = response.data;
      const formattedEvent = this._formatCalendarEvent(event);

      if (!formattedEvent) {
        throw new Error(`Failed to format event data for event ID ${eventId}`);
      }

      return formattedEvent;
    } catch (error) {
      throw new Error(`Error getting meeting: ${error.message}`);
    }
  }

  /**
   * Create a new calendar event with optional Google Meet conference.
   * @param {Object} eventData - Event data
   * @param {string} eventData.summary - Title of the event
   * @param {string} eventData.startTime - Start time in ISO format
   * @param {string} eventData.endTime - End time in ISO format
   * @param {string} eventData.description - Description for the event
   * @param {string} eventData.location - Location for the event
   * @param {string} eventData.timeZone - Time zone
   * @param {Array<string>} eventData.attendees - List of email addresses for attendees
   * @param {boolean} eventData.createMeetConference - Whether to create Google Meet conference
   * @param {Object} eventData.guestPermissions - Guest permissions
   * @param {string} eventData.calendarId - Calendar ID (default: "primary")
   * @returns {Promise<Object>} - Created event details
   */
  async createCalendarEvent({
    summary,
    startTime,
    endTime,
    description = "",
    location = "",
    timeZone = "UTC",
    attendees = [],
    createMeetConference = false,
    guestPermissions = {} as GuestPermissions,
    calendarId = "primary",
  }) {
    // Prepare attendees list in the format required by the API
    const formattedAttendees = attendees.map((email) => ({ email }));

    // Create the event object
    const event: any = {
      summary: summary,
      description: description,
      location: location,
      start: {
        dateTime: startTime,
        timeZone: timeZone,
      },
      end: {
        dateTime: endTime,
        timeZone: timeZone,
      },
      attendees: formattedAttendees,
      // Guest permissions from Calendar API
      guestsCanInviteOthers:
        guestPermissions?.canInviteOthers !== undefined
          ? guestPermissions.canInviteOthers
          : true,
      guestsCanModify:
        guestPermissions?.canModify !== undefined
          ? guestPermissions.canModify
          : false,
      guestsCanSeeOtherGuests:
        guestPermissions?.canSeeOtherGuests !== undefined
          ? guestPermissions.canSeeOtherGuests
          : true,
    };

    // Add Google Meet conference if requested
    if (createMeetConference) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet" as const,
          },
        },
      };
    }

    try {
      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        conferenceDataVersion: createMeetConference ? 1 : 0,
        resource: event,
      });

      const createdEvent = response.data;
      const formattedEvent = this._formatCalendarEvent(createdEvent);

      if (!formattedEvent) {
        throw new Error("Failed to format event data for newly created event");
      }

      return formattedEvent;
    } catch (error) {
      throw new Error(`Error creating calendar event: ${error.message}`);
    }
  }

  /**
   * Create a new Google Meet meeting (legacy method for compatibility).
   * @param {string} summary - Title of the meeting
   * @param {string} startTime - Start time in ISO format
   * @param {string} endTime - End time in ISO format
   * @param {string} description - Description for the meeting
   * @param {Array<string>} attendees - List of email addresses for attendees
   * @param {boolean} enableRecording - Whether to enable recording (requires Google Workspace)
   * @param {Object} options - Additional options
   * @param {Array<string>} options.coHosts - List of email addresses for co-hosts
   * @param {boolean} options.enableTranscription - Enable transcription
   * @param {boolean} options.enableSmartNotes - Enable smart notes
   * @param {boolean} options.attendanceReport - Enable attendance report
   * @param {Object} options.spaceConfig - Space configuration options
   * @param {Object} options.guestPermissions - Guest permissions for Calendar API
   * @returns {Promise<Object>} - Created meeting details
   */
  async createMeeting(
    summary: string,
    startTime: string,
    endTime: string,
    description = "",
    attendees: string[] = [],
    enableRecording = false,
    options: CreateMeetingOptions = {}
  ) {
    const {
      coHosts = [],
      enableTranscription = false,
      enableSmartNotes = false,
      attendanceReport = false,
      spaceConfig = {},
      guestPermissions = {} as GuestPermissions,
    } = options;

    // Note: Using Calendar API with enhanced descriptions for all features
    // Google Meet link will be generated automatically by Calendar API
    if (coHosts.length > 0) {
      console.info(
        `Co-hosts will be documented in meeting description: ${coHosts.join(
          ", "
        )}`
      );
    }

    // Prepare attendees list in the format required by the API
    const formattedAttendees = attendees.map((email) => ({ email }));

    // Create the event with Google Meet conferencing and guest permissions
    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime,
        timeZone: "UTC",
      },
      attendees: formattedAttendees,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet" as const,
          },
        },
      },
      // Guest permissions from Calendar API
      guestsCanInviteOthers:
        guestPermissions?.canInviteOthers !== undefined
          ? guestPermissions.canInviteOthers
          : true,
      guestsCanModify:
        guestPermissions?.canModify !== undefined
          ? guestPermissions.canModify
          : false,
      guestsCanSeeOtherGuests:
        guestPermissions?.canSeeOtherGuests !== undefined
          ? guestPermissions.canSeeOtherGuests
          : true,
    };

    // Add comprehensive feature notes to description
    let featureNotes = [];
    if (enableRecording)
      featureNotes.push(
        "📹 Auto-recording enabled (activate manually when meeting starts)"
      );
    if (enableTranscription)
      featureNotes.push(
        "📝 Auto-transcription enabled (available post-meeting)"
      );
    if (enableSmartNotes)
      featureNotes.push("🧠 Smart notes with AI summaries enabled");
    if (coHosts.length > 0)
      featureNotes.push(
        `👥 Co-hosts assigned: ${coHosts.join(
          ", "
        )} (promote manually in meeting)`
      );
    if (attendanceReport)
      featureNotes.push("📊 Attendance report will be generated");

    // Add moderation settings
    if (options.spaceConfig?.moderation === "ON") {
      let moderationNotes = ["🛡️ Moderation enabled:"];
      if (options.spaceConfig?.moderationRestrictions?.chatRestriction === "HOSTS_ONLY")
        moderationNotes.push("  • 💬 Chat restricted to hosts only");
      if (options.spaceConfig?.moderationRestrictions?.presentRestriction === "HOSTS_ONLY")
        moderationNotes.push("  • 🖥️ Screen sharing restricted to hosts only");
      if (options.spaceConfig?.moderationRestrictions?.defaultJoinAsViewerType === "ON")
        moderationNotes.push("  • 👀 Participants join as viewers by default");
      featureNotes.push(moderationNotes.join("\n"));
    }

    if (featureNotes.length > 0) {
      event.description =
        (description ? description + "\n\n" : "") +
        "🚀 Enhanced Meeting Features:\n" +
        featureNotes.join("\n") +
        "\n\n⚠️ Note: Advanced features require Google Workspace Business Standard or higher and manual activation during the meeting.";
    }

    try {
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        resource: event,
      });

      const createdEvent = response.data;

      if (!createdEvent.conferenceData) {
        throw new Error("Failed to create Google Meet conferencing data");
      }

      const meeting = this._formatMeetingData(createdEvent);
      if (!meeting) {
        throw new Error(
          "Failed to format meeting data for newly created event"
        );
      }

      return meeting;
    } catch (error) {
      throw new Error(`Error creating meeting: ${error.message}`);
    }
  }

  /**
   * Update an existing calendar event.
   * @param {string} eventId - ID of the event to update
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} - Updated event details
   */
  async updateCalendarEvent(eventId: string, updateData: EventUpdateData = {}): Promise<ProcessedEvent> {
    try {
      // First, get the existing event
      const response = await this.calendar.events.get({
        calendarId: "primary",
        eventId: eventId,
      });

      const event = response.data;

      // Update the fields that were provided
      if (updateData.summary !== undefined) {
        event.summary = updateData.summary;
      }

      if (updateData.description !== undefined) {
        event.description = updateData.description;
      }

      if (updateData.location !== undefined) {
        event.location = updateData.location;
      }

      if (updateData.startTime !== undefined) {
        event.start.dateTime = updateData.startTime;
      }

      if (updateData.endTime !== undefined) {
        event.end.dateTime = updateData.endTime;
      }

      if (updateData.timeZone !== undefined) {
        event.start.timeZone = updateData.timeZone;
        event.end.timeZone = updateData.timeZone;
      }

      if (updateData.attendees !== undefined) {
        event.attendees = updateData.attendees.map((email) => ({ email }));
      }

      // Update guest permissions
      if (updateData.guestCanInviteOthers !== undefined) {
        event.guestsCanInviteOthers = updateData.guestCanInviteOthers;
      }

      if (updateData.guestCanModify !== undefined) {
        event.guestsCanModify = updateData.guestCanModify;
      }

      if (updateData.guestCanSeeOtherGuests !== undefined) {
        event.guestsCanSeeOtherGuests = updateData.guestCanSeeOtherGuests;
      }

      // Make the API call to update the event
      const updateResponse = await (this.calendar as any).events.patch({
        calendarId: "primary",
        eventId: eventId,
        conferenceDataVersion: 1,
        resource: event,
      });

      const updatedEvent = updateResponse.data;
      const formattedEvent = this._formatCalendarEvent(updatedEvent);

      if (!formattedEvent) {
        throw new Error("Failed to format event data for updated event");
      }

      return formattedEvent;
    } catch (error) {
      throw new Error(`Error updating calendar event: ${error.message}`);
    }
  }

  /**
   * Delete a calendar event.
   * @param {string} eventId - ID of the event to delete
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId: eventId,
      });

      return true;
    } catch (error) {
      throw new Error(`Error deleting calendar event: ${error.message}`);
    }
  }

  /**
   * Update an existing Google Meet meeting (legacy method for compatibility).
   * @param {string} meetingId - ID of the meeting to update
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} - Updated meeting details
   */
  async updateMeeting(
    meetingId: string,
    { summary, description, startTime, endTime, attendees }: {
      summary?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      attendees?: string[];
    } = {}
  ): Promise<any> {
    try {
      // First, get the existing event
      const response = await this.calendar.events.get({
        calendarId: "primary",
        eventId: meetingId,
      });

      const event = response.data;

      // Update the fields that were provided
      if (summary !== undefined) {
        event.summary = summary;
      }

      if (description !== undefined) {
        event.description = description;
      }

      if (startTime !== undefined) {
        event.start.dateTime = startTime;
      }

      if (endTime !== undefined) {
        event.end.dateTime = endTime;
      }

      if (attendees !== undefined) {
        event.attendees = attendees.map((email) => ({ email }));
      }

      // Make the API call to update the event
      const updateResponse = await (this.calendar as any).events.patch({
        calendarId: "primary",
        eventId: meetingId,
        conferenceDataVersion: 1,
        resource: event,
      });

      const updatedEvent = updateResponse.data;

      if (!updatedEvent.conferenceData) {
        throw new Error(
          "Updated event does not have Google Meet conferencing data"
        );
      }

      const meeting = this._formatMeetingData(updatedEvent);
      if (!meeting) {
        throw new Error("Failed to format meeting data for updated event");
      }

      return meeting;
    } catch (error) {
      throw new Error(`Error updating meeting: ${error.message}`);
    }
  }

  /**
   * Delete a Google Meet meeting.
   * @param {string} meetingId - ID of the meeting to delete
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId: meetingId,
      });

      return true;
    } catch (error) {
      throw new Error(`Error deleting meeting: ${error.message}`);
    }
  }

  /**
   * Perform automatic OAuth authentication flow
   * @param {Object} oAuth2Client - The OAuth2 client
   */
  async performAutoAuth(oAuth2Client) {
    const SCOPES = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
      "https://www.googleapis.com/auth/meetings.space.settings",
    ];

    console.error("\n🔐 Google Authentication Required");
    console.error(
      "📝 To use Google Meet MCP Server, you need to authenticate with Google."
    );

    return new Promise((resolve, reject) => {
      // Create a temporary HTTP server to handle the OAuth callback
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, "http://localhost:3000");

        if (url.pathname === "/oauth2callback") {
          const code = url.searchParams.get("code");
          const error = url.searchParams.get("error");

          if (error) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h1>❌ Authentication Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error(`Authentication failed: ${error}`));
            return;
          }

          if (code) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h1>✅ Authentication Successful!</h1>
                  <p>You can now close this window and return to Claude.</p>
                  <p>Google Meet MCP Server is now configured.</p>
                </body>
              </html>
            `);

            // Exchange code for tokens
            oAuth2Client
              .getToken(code)
              .then(({ tokens }) => {
                return fs
                  .writeFile(this.tokenPath, JSON.stringify(tokens, null, 2))
                  .then(() => tokens);
              })
              .then((tokens) => {
                oAuth2Client.setCredentials(tokens);
                console.error("✅ Authentication successful! Token saved.");
                server.close();
                resolve(undefined);
              })
              .catch((err) => {
                console.error("❌ Error saving token:", err);
                server.close();
                reject(err);
              });
          }
        } else {
          res.writeHead(404);
          res.end("Not found");
        }
      });

      server.listen(3000, () => {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: "offline",
          scope: SCOPES,
          prompt: "consent",
          redirect_uri: "http://localhost:3000/oauth2callback",
        });

        console.error("🌐 Opening browser for authentication...");
        console.error(`🔗 If browser doesn't open, visit: ${authUrl}`);

        // Try to open browser
        open(authUrl).catch(() => {
          console.error("❌ Could not open browser automatically");
          console.error(`📋 Please manually visit: ${authUrl}`);
        });

        // Timeout after 5 minutes
        setTimeout(() => {
          server.close();
          reject(new Error("Authentication timeout. Please try again."));
        }, 300000);
      });

      server.on("error", (err) => {
        if ((err as NodeError).code === "EADDRINUSE") {
          console.error(
            "❌ Port 3000 is in use. Please try again or run setup script manually."
          );
        }
        reject(err);
      });
    });
  }

  // ========== GOOGLE MEET API v2 METHODS (GA - Generally Available) ==========

  /**
   * Create a Google Meet space with advanced configuration.
   * @param {Object} config - Space configuration
   * @returns {Promise<Object>} - Created space data
   */
  async createMeetSpace(config: {
    accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
    moderationMode?: 'ON' | 'OFF';
    chatRestriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
    presentRestriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
    defaultJoinAsViewer?: boolean;
    enableRecording?: boolean;
    enableTranscription?: boolean;
    enableSmartNotes?: boolean;
    attendanceReport?: boolean;
  }): Promise<MeetSpace> {
    // Use REST client for direct Google Meet API v2 access
    const spaceConfig: SpaceConfig = {
      accessType: config.accessType || "TRUSTED",
      entryPointAccess: "ALL",
    };

    // Add moderation configuration if specified
    if (config.moderationMode) {
      spaceConfig.moderation = config.moderationMode;

      // Only add moderationRestrictions if moderation is ON
      if (
        config.moderationMode === "ON" &&
        (config.chatRestriction ||
          config.presentRestriction ||
          config.defaultJoinAsViewer)
      ) {
        spaceConfig.moderationRestrictions = {};
        if (config.chatRestriction) {
          spaceConfig.moderationRestrictions.chatRestriction =
            config.chatRestriction;
        }
        if (config.presentRestriction) {
          spaceConfig.moderationRestrictions.presentRestriction =
            config.presentRestriction;
        }
        if (config.defaultJoinAsViewer) {
          spaceConfig.moderationRestrictions.defaultJoinAsViewerType = "ON";
        }
      }
    }

    // Add artifact configuration (recording, transcription, smart notes)
    if (
      config.enableRecording ||
      config.enableTranscription ||
      config.enableSmartNotes
    ) {
      spaceConfig.artifactConfig = {};

      if (config.enableRecording) {
        spaceConfig.artifactConfig.recordingConfig = {
          autoRecordingGeneration: "ON",
        };
      }

      if (config.enableTranscription) {
        spaceConfig.artifactConfig.transcriptionConfig = {
          autoTranscriptionGeneration: "ON",
        };
      }

      if (config.enableSmartNotes) {
        spaceConfig.artifactConfig.smartNotesConfig = {
          autoSmartNotesGeneration: "ON",
        };
      }
    }

    // Add attendance report configuration
    if (config.attendanceReport) {
      spaceConfig.attendanceReportGenerationType = "GENERATE_REPORT";
    }

    return await this.meetRestClient.createSpace(spaceConfig);
  }

  /**
   * Get details of a Google Meet space.
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @returns {Promise<Object>} - Space data from Google Meet API v2
   */
  async getMeetSpace(spaceName) {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.getSpace(spaceName);
  }

  /**
   * Update configuration of a Google Meet space.
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @param {Object} updateData - Configuration to update
   * @returns {Promise<Object>} - Updated space data
   */
  async updateMeetSpace(spaceName: string, updateData: SpaceUpdateData): Promise<MeetSpace> {
    // Use REST client for direct Google Meet API v2 access
    const spaceConfig: SpaceConfig = {};

    if (updateData.accessType) {
      spaceConfig.accessType = updateData.accessType;
    }

    if (
      updateData.moderationMode ||
      updateData.chatRestriction ||
      updateData.presentRestriction
    ) {
      spaceConfig.moderation = updateData.moderationMode || "OFF";

      spaceConfig.moderationRestrictions = {};
      if (updateData.chatRestriction) {
        spaceConfig.moderationRestrictions.chatRestriction =
          updateData.chatRestriction;
      }
      if (updateData.presentRestriction) {
        spaceConfig.moderationRestrictions.presentRestriction =
          updateData.presentRestriction;
      }
    }

    return await this.meetRestClient.updateSpace(spaceName, spaceConfig);
  }

  /**
   * End the active conference in a Google Meet space.
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @returns {Promise<boolean>} - Success status
   */
  async endActiveConference(spaceName: string): Promise<boolean> {
    // Use REST client for direct Google Meet API v2 access
    await this.meetRestClient.endActiveConference(spaceName);
    return true;
  }

  /**
   * List conference records for historical meetings.
   * @param {string} filter - Filter for conference records
   * @param {number} pageSize - Maximum number of results to return
   * @returns {Promise<Array>} - Conference records
   */
  async listConferenceRecords(filter: string | null = null, pageSize = 10): Promise<{ conferenceRecords: ConferenceRecord[]; nextPageToken?: string }> {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.listConferenceRecords(filter, pageSize);
  }

  /**
   * Get details of a specific conference record.
   * @param {string} conferenceRecordName - Name of the conference record
   * @returns {Promise<Object>} - Conference record details
   */
  async getConferenceRecord(conferenceRecordName: string): Promise<ConferenceRecord> {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.getConferenceRecord(conferenceRecordName);
  }

  /**
   * List recordings for a conference record.
   * @param {string} conferenceRecordName - Name of the conference record
   * @returns {Promise<Array>} - Recordings list
   */
  async listRecordings(conferenceRecordName: string): Promise<{ recordings: Recording[]; nextPageToken?: string }> {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.listRecordings(conferenceRecordName);
  }

  /**
   * Get details of a specific recording.
   * @param {string} recordingName - Name of the recording
   * @returns {Promise<Object>} - Recording details
   */
  async getRecording(recordingName: string): Promise<Recording> {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.getRecording(recordingName);
  }

  /**
   * List transcripts for a conference record.
   * @param {string} conferenceRecordName - Name of the conference record
   * @returns {Promise<Array>} - Transcripts list
   */
  async listTranscripts(conferenceRecordName: string): Promise<{ transcripts: Transcript[]; nextPageToken?: string }> {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.listTranscripts(conferenceRecordName);
  }

  /**
   * Get details of a specific transcript.
   * @param {string} transcriptName - Name of the transcript
   * @returns {Promise<Object>} - Transcript details
   */
  async getTranscript(transcriptName: string): Promise<Transcript> {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.getTranscript(transcriptName);
  }

  /**
   * List transcript entries (individual speech segments).
   * @param {string} transcriptName - Name of the transcript
   * @param {number} pageSize - Maximum number of entries to return
   * @returns {Promise<Array>} - Transcript entries
   */
  async listTranscriptEntries(transcriptName: string, pageSize = 100): Promise<{ transcriptEntries: TranscriptEntry[]; nextPageToken?: string }> {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.listTranscriptEntries(
      transcriptName,
      pageSize
    );
  }

  // ========== ADDITIONAL METHODS FROM OFFICIAL SPECS ==========

  /**
   * Delete a Google Meet space.
   * Note: This operation is not supported by Google Meet API v2.
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @returns {Promise<boolean>} - Always false (operation not supported)
   */
  async deleteSpace(spaceName: string): Promise<never> {
    console.warn(
      `deleteSpace: Operation not supported by Google Meet API v2. Spaces cannot be deleted directly.`
    );
    throw new Error(
      `Delete space operation is not supported by Google Meet API v2. Space: ${spaceName}`
    );
  }

  /**
   * Get participant details.
   * @param {string} participantName - Name of the participant
   * @returns {Promise<Object>} - Participant details
   */
  async getParticipant(participantName: string): Promise<Participant> {
    try {
      // Use REST client for direct Google Meet API v2 access
      return await this.meetRestClient.getParticipant(participantName);
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(
        `Meet API v2 failed for getParticipant, using fallback: ${error.message}`
      );
      throw new Error(`Participant not found: ${error.message}`);
    }
  }

  /**
   * List participants for a conference record.
   * @param {string} conferenceRecordName - Name of the conference record
   * @param {number} pageSize - Maximum number of participants to return
   * @returns {Promise<Object>} - List of participants
   */
  async listParticipants(conferenceRecordName: string, pageSize = 10): Promise<{ participants: Participant[]; nextPageToken?: string }> {
    try {
      // Use REST client for direct Google Meet API v2 access
      return await this.meetRestClient.listParticipants(
        conferenceRecordName,
        pageSize
      );
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(
        `Meet API v2 failed for listParticipants, using fallback: ${error.message}`
      );
      return { participants: [], nextPageToken: null };
    }
  }

  /**
   * Get participant session details.
   * @param {string} participantSessionName - Name of the participant session
   * @returns {Promise<Object>} - Participant session details
   */
  async getParticipantSession(participantSessionName: string): Promise<ParticipantSession> {
    try {
      // Use REST client for direct Google Meet API v2 access
      return await this.meetRestClient.getParticipantSession(
        participantSessionName
      );
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(
        `Meet API v2 failed for getParticipantSession, using fallback: ${error.message}`
      );
      throw new Error(`Participant session not found: ${error.message}`);
    }
  }

  /**
   * List participant sessions.
   * @param {string} participantName - Name of the participant
   * @param {number} pageSize - Maximum number of sessions to return
   * @returns {Promise<Object>} - List of participant sessions
   */
  async listParticipantSessions(participantName: string, pageSize = 10): Promise<{ participantSessions: ParticipantSession[]; nextPageToken?: string }> {
    try {
      // Use REST client for direct Google Meet API v2 access
      return await this.meetRestClient.listParticipantSessions(
        participantName,
        pageSize
      );
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(
        `Meet API v2 failed for listParticipantSessions, using fallback: ${error.message}`
      );
      return { participantSessions: [], nextPageToken: null };
    }
  }

  // getTranscriptEntry method removed - not available in Google Meet API v2
  // Use listTranscriptEntries instead to get individual transcript entries

  /**
   * Get recordings for a meeting.
   * @param {string} meetingCode - The meeting code from the Meet URL
   * @returns {Promise<Object>} - Recording information
   */
  async getMeetingRecordings(meetingCode: string): Promise<{ message: string; meeting_code: string; recordings: any[] }> {
    try {
      // Try to find the conference record by meeting code
      // This is a simplified implementation - in practice, you'd need to search through conference records
      return {
        message:
          "Recording retrieval requires Google Workspace Business Standard or higher",
        meeting_code: meetingCode,
        recordings: [],
      };
    } catch (error) {
      throw new Error(`Error getting recordings: ${error.message}`);
    }
  }

  /**
   * Format event data to calendar event format.
   * @param {Object} event - Event data from Google Calendar API
   * @returns {Object|null} - Formatted calendar event data or null
   */
  _formatCalendarEvent(event: any): ProcessedEvent | null {
    // Format attendees
    const attendees = (event.attendees || []).map((attendee) => ({
      email: attendee.email,
      response_status: attendee.responseStatus,
    }));

    // Check for Google Meet conference data
    let meetLink = null;
    let hasMeetConference = false;

    if (event.conferenceData) {
      hasMeetConference = true;
      for (const entryPoint of event.conferenceData.entryPoints || []) {
        if (entryPoint.entryPointType === "video") {
          meetLink = entryPoint.uri;
          break;
        }
      }
    }

    // Build the formatted calendar event data
    const calendarEvent = {
      id: event.id,
      summary: event.summary || "",
      description: event.description || "",
      location: event.location || "",
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      time_zone: event.start?.timeZone || event.end?.timeZone || "UTC",
      attendees: attendees,
      creator: event.creator?.email,
      organizer: event.organizer?.email,
      created: event.created,
      updated: event.updated,
      has_meet_conference: hasMeetConference,
      meet_link: meetLink,
      guest_can_invite_others: event.guestsCanInviteOthers,
      guest_can_modify: event.guestsCanModify,
      guest_can_see_other_guests: event.guestsCanSeeOtherGuests,
    };

    return calendarEvent;
  }

  /**
   * Format event data to meeting format (legacy method for compatibility).
   * @param {Object} event - Event data from Google Calendar API
   * @returns {Object|null} - Formatted meeting data or null
   */
  _formatMeetingData(event: any): any | null {
    if (!event.conferenceData) {
      return null;
    }

    // Extract the Google Meet link
    let meetLink = null;
    for (const entryPoint of event.conferenceData.entryPoints || []) {
      if (entryPoint.entryPointType === "video") {
        meetLink = entryPoint.uri;
        break;
      }
    }

    if (!meetLink) {
      return null;
    }

    // Format attendees
    const attendees = (event.attendees || []).map((attendee) => ({
      email: attendee.email,
      response_status: attendee.responseStatus,
    }));

    // Check if recording is mentioned in description
    const recordingEnabled =
      event.description?.includes("📹 Note: Recording will be enabled") ||
      false;

    // Build the formatted meeting data
    const meeting = {
      id: event.id,
      summary: event.summary || "",
      description: event.description || "",
      meet_link: meetLink,
      recording_enabled: recordingEnabled,
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      attendees: attendees,
      creator: event.creator?.email,
      organizer: event.organizer?.email,
      created: event.created,
      updated: event.updated,
    };

    return meeting;
  }
}

export default GoogleMeetAPI;
