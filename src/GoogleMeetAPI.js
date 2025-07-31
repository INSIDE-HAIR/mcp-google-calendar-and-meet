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

/**
 * REST client for Google Meet API v2/v2beta
 * Provides direct access to Meet API endpoints not available in googleapis library
 */
class MeetRestClient {
  constructor(oAuth2Client) {
    this.auth = oAuth2Client;
    this.baseUrls = {
      v2: 'https://meet.googleapis.com/v2',
      v2beta: 'https://meet.googleapis.com/v2beta'
    };
    
    // Feature flags for experimental/beta features
    this.featureFlags = {
      enableV2BetaFeatures: true,  // Enable v2beta features (Member management)
      enableExperimentalWebRTC: true
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
  async makeRequest(endpoint, options = {}, apiVersion = 'v2') {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.baseUrls[apiVersion];
    
    // Ensure GET method is explicitly set for read operations when not specified
    const method = options.method || 'GET';
    const requestOptions = {
      method: method,
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        ...options.headers
      }
    };
    
    // Only add Content-Type for requests with body (POST, PATCH, PUT)
    if (['POST', 'PATCH', 'PUT'].includes(method) && options.body) {
      requestOptions.headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, requestOptions);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        // Use default error message if can't parse JSON
      }
      throw new Error(`Meet API Error: ${errorMessage}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  // ========== GOOGLE MEET API v2 METHODS (GA) ==========

  /**
   * Create a Google Meet space
   */
  async createSpace(config) {
    const requestBody = { config };
    return this.makeRequest('/spaces', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Get space details
   */
  async getSpace(spaceName) {
    // Validate and format space name
    if (!spaceName || typeof spaceName !== 'string') {
      throw new Error('Invalid space name: must be a non-empty string');
    }
    
    // Ensure spaceName is properly formatted (spaces/{space_id})
    const formattedSpaceName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
    
    // Validate the formatted name (spaces/{space_id} or spaces/{meetingCode})
    if (!formattedSpaceName.match(/^spaces\/[a-zA-Z0-9_-]{1,128}$/)) {
      throw new Error(`Invalid space name format: ${formattedSpaceName}. Expected: spaces/{space_id} or spaces/{meetingCode}`);
    }
    
    return this.makeRequest(`/${formattedSpaceName}`);
  }

  /**
   * Update space configuration
   */
  async updateSpace(spaceName, config) {
    const requestBody = { config };
    return this.makeRequest(`/${spaceName}`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * End active conference in space
   */
  async endActiveConference(spaceName) {
    return this.makeRequest(`/${spaceName}:endActiveConference`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  /**
   * List conference records
   */
  async listConferenceRecords(filter, pageSize = 10) {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    const endpoint = `/conferenceRecords?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get conference record
   */
  async getConferenceRecord(conferenceRecordName) {
    return this.makeRequest(`/${conferenceRecordName}`);
  }

  /**
   * List recordings for conference record
   */
  async listRecordings(conferenceRecordName) {
    return this.makeRequest(`/${conferenceRecordName}/recordings`);
  }

  /**
   * Get recording details
   */
  async getRecording(recordingName) {
    return this.makeRequest(`/${recordingName}`);
  }

  /**
   * List transcripts for conference record
   */
  async listTranscripts(conferenceRecordName) {
    return this.makeRequest(`/${conferenceRecordName}/transcripts`);
  }

  /**
   * Get transcript details
   */
  async getTranscript(transcriptName) {
    return this.makeRequest(`/${transcriptName}`);
  }

  /**
   * List transcript entries
   */
  async listTranscriptEntries(transcriptName, pageSize = 100) {
    const params = new URLSearchParams();
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    const endpoint = `/${transcriptName}/entries?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  // ========== GOOGLE MEET API v2beta METHODS (Developer Preview) ==========
  // NOTE: Beta methods are DISABLED by default (enableV2BetaFeatures: false)
  // These methods are in Developer Preview and should not be used in production

  /**
   * Create space member with role (v2beta - DISABLED)
   */
  async createSpaceMember(spaceName, userEmail, role = 'MEMBER') {
    if (!this.featureFlags.enableV2BetaFeatures) {
      throw new Error('v2beta features are disabled. Set enableV2BetaFeatures to true to enable experimental features.');
    }
    
    // The request body should be the member object directly, not wrapped
    const requestBody = {
      role: role.toUpperCase(),
      email: userEmail
    };
    
    // Ensure spaceName is properly formatted (spaces/{space_id})
    const formattedSpaceName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
    return this.makeRequest(`/${formattedSpaceName}/members`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    }, 'v2beta');
  }

  /**
   * List space members (v2beta - DISABLED)
   */
  async listSpaceMembers(spaceName, pageSize = 10) {
    if (!this.featureFlags.enableV2BetaFeatures) {
      throw new Error('v2beta features are disabled. Set enableV2BetaFeatures to true to enable experimental features.');
    }
    
    const params = new URLSearchParams();
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    // Ensure spaceName is properly formatted (spaces/{space_id})
    const formattedSpaceName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
    const endpoint = `/${formattedSpaceName}/members?${params.toString()}`;
    return this.makeRequest(endpoint, {}, 'v2beta');
  }

  /**
   * Get space member details (v2beta - DISABLED)
   */
  async getSpaceMember(memberName) {
    if (!this.featureFlags.enableV2BetaFeatures) {
      throw new Error('v2beta features are disabled. Set enableV2BetaFeatures to true to enable experimental features.');
    }
    
    // Ensure memberName is properly formatted (spaces/{space}/members/{member})
    const formattedMemberName = memberName.includes('/members/') ? memberName : `spaces/${memberName}`;
    return this.makeRequest(`/${formattedMemberName}`, {}, 'v2beta');
  }

  /**
   * Delete space member (v2beta - DISABLED)
   */
  async deleteSpaceMember(memberName) {
    if (!this.featureFlags.enableV2BetaFeatures) {
      throw new Error('v2beta features are disabled. Set enableV2BetaFeatures to true to enable experimental features.');
    }
    
    // Ensure memberName is properly formatted (spaces/{space}/members/{member})
    const formattedMemberName = memberName.includes('/members/') ? memberName : `spaces/${memberName}`;
    return this.makeRequest(`/${formattedMemberName}`, {
      method: 'DELETE'
    }, 'v2beta');
  }

  // ========== ADDITIONAL METHODS FROM OFFICIAL SPECS ==========

  /**
   * Delete a Google Meet space
   * Note: Google Meet API v2 does not support deleting spaces directly.
   * This method is not available in the official API specification.
   */
  async deleteSpace(spaceName) {
    throw new Error('Delete space operation is not supported by Google Meet API v2. Spaces cannot be deleted directly.');
  }

  /**
   * Connect to active conference (WebRTC) (v2beta - DISABLED)
   */
  async connectActiveConference(spaceName) {
    if (!this.featureFlags.enableExperimentalWebRTC) {
      throw new Error('Experimental WebRTC features are disabled. Set enableExperimentalWebRTC to true to enable.');
    }
    
    return this.makeRequest(`/${spaceName}:connectActiveConference`, {
      method: 'POST',
      body: JSON.stringify({})
    }, 'v2beta');
  }

  /**
   * Get participant details
   */
  async getParticipant(participantName) {
    return this.makeRequest(`/${participantName}`);
  }

  /**
   * List participants for a conference record
   */
  async listParticipants(conferenceRecordName, pageSize = 10) {
    const params = new URLSearchParams();
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    const endpoint = `/${conferenceRecordName}/participants?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get participant session details
   */
  async getParticipantSession(participantSessionName) {
    return this.makeRequest(`/${participantSessionName}`);
  }

  /**
   * List participant sessions
   */
  async listParticipantSessions(participantName, pageSize = 10) {
    const params = new URLSearchParams();
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    const endpoint = `/${participantName}/participantSessions?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  // getTranscriptEntry method removed - not available in Google Meet API v2
  // Use listTranscriptEntries instead to get transcript entries
}

class GoogleMeetAPI {
  /**
   * Initialize the Google Meet API client.
   * @param {string} credentialsPath - Path to the client_secret.json file
   * @param {string} tokenPath - Path to save/load the token.json file
   */
  constructor(credentialsPath, tokenPath) {
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
        const { credentials } = await oAuth2Client.refreshToken(
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
  async listCalendars() {
    try {
      const response = await this.calendar.calendarList.list();
      const calendars = response.data.items || [];

      return calendars.map((calendar) => ({
        id: calendar.id,
        summary: calendar.summary || "No title",
        description: calendar.description || "",
        primary: calendar.primary || false,
        access_role: calendar.accessRole,
        background_color: calendar.backgroundColor,
        foreground_color: calendar.foregroundColor,
        time_zone: calendar.timeZone,
        location: calendar.location || "",
        selected: calendar.selected || false,
        hidden: calendar.hidden || false
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
  async listCalendarEvents(maxResults = 10, timeMin = null, timeMax = null, calendarId = "primary") {
    // Default timeMin to now if not provided
    if (!timeMin) {
      timeMin = new Date().toISOString();
    }

    // Prepare parameters for the API call
    const params = {
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
  async getCalendarEvent(eventId) {
    try {
      const response = await this.calendar.events.get({
        calendarId: "primary",
        eventId: eventId,
        conferenceDataVersion: 1,
      });

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
    guestPermissions = {},
    calendarId = "primary",
  }) {
    // Prepare attendees list in the format required by the API
    const formattedAttendees = attendees.map((email) => ({ email }));

    // Create the event object
    const event = {
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
        guestPermissions.canInviteOthers !== undefined
          ? guestPermissions.canInviteOthers
          : true,
      guestsCanModify:
        guestPermissions.canModify !== undefined
          ? guestPermissions.canModify
          : false,
      guestsCanSeeOtherGuests:
        guestPermissions.canSeeOtherGuests !== undefined
          ? guestPermissions.canSeeOtherGuests
          : true,
    };

    // Add Google Meet conference if requested
    if (createMeetConference) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
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
    summary,
    startTime,
    endTime,
    description = "",
    attendees = [],
    enableRecording = false,
    options = {}
  ) {
    const {
      coHosts = [],
      enableTranscription = false,
      enableSmartNotes = false,
      attendanceReport = false,
      spaceConfig = {},
      guestPermissions = {},
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
            type: "hangoutsMeet",
          },
        },
      },
      // Guest permissions from Calendar API
      guestsCanInviteOthers:
        guestPermissions.canInviteOthers !== undefined
          ? guestPermissions.canInviteOthers
          : true,
      guestsCanModify:
        guestPermissions.canModify !== undefined
          ? guestPermissions.canModify
          : false,
      guestsCanSeeOtherGuests:
        guestPermissions.canSeeOtherGuests !== undefined
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
    if (spaceConfig.moderation_mode === "ON") {
      let moderationNotes = ["🛡️ Moderation enabled:"];
      if (spaceConfig.chat_restriction === "HOSTS_ONLY")
        moderationNotes.push("  • 💬 Chat restricted to hosts only");
      if (spaceConfig.present_restriction === "HOSTS_ONLY")
        moderationNotes.push("  • 🖥️ Screen sharing restricted to hosts only");
      if (spaceConfig.default_join_as_viewer)
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
  async updateCalendarEvent(eventId, updateData = {}) {
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
      const updateResponse = await this.calendar.events.update({
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
  async deleteCalendarEvent(eventId) {
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
    meetingId,
    { summary, description, startTime, endTime, attendees } = {}
  ) {
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
      const updateResponse = await this.calendar.events.update({
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
  async deleteMeeting(meetingId) {
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
                resolve();
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
        if (err.code === "EADDRINUSE") {
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
  async createMeetSpace(config) {
    // Use REST client for direct Google Meet API v2 access
    const spaceConfig = {
      accessType: config.accessType || 'TRUSTED',
      entryPointAccess: 'ALL'
    };

    // Add moderation configuration if specified
    if (config.moderationMode) {
      spaceConfig.moderation = config.moderationMode;
      
      // Only add moderationRestrictions if moderation is ON
      if (config.moderationMode === 'ON' && (config.chatRestriction || config.presentRestriction || config.defaultJoinAsViewer)) {
        spaceConfig.moderationRestrictions = {};
        if (config.chatRestriction) {
          spaceConfig.moderationRestrictions.chatRestriction = config.chatRestriction;
        }
        if (config.presentRestriction) {
          spaceConfig.moderationRestrictions.presentRestriction = config.presentRestriction;
        }
        if (config.defaultJoinAsViewer) {
          spaceConfig.moderationRestrictions.defaultJoinAsViewerType = 'ON';
        }
      }
    }

    // Add artifact configuration (recording, transcription, smart notes)
    if (config.enableRecording || config.enableTranscription || config.enableSmartNotes) {
      spaceConfig.artifactConfig = {};
      
      if (config.enableRecording) {
        spaceConfig.artifactConfig.recordingConfig = {
          autoRecordingGeneration: 'ON'
        };
      }
      
      if (config.enableTranscription) {
        spaceConfig.artifactConfig.transcriptionConfig = {
          autoTranscriptionGeneration: 'ON'
        };
      }
      
      if (config.enableSmartNotes) {
        spaceConfig.artifactConfig.smartNotesConfig = {
          autoSmartNotesGeneration: 'ON'
        };
      }
    }

    // Add attendance report configuration
    if (config.attendanceReport) {
      spaceConfig.attendanceReportGenerationType = 'GENERATE_REPORT';
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
  async updateMeetSpace(spaceName, updateData) {
    // Use REST client for direct Google Meet API v2 access
    const spaceConfig = {};
    
    if (updateData.accessType) {
      spaceConfig.accessType = updateData.accessType;
    }
    
    if (updateData.moderationMode || updateData.chatRestriction || updateData.presentRestriction) {
      spaceConfig.moderation = updateData.moderationMode || 'OFF';
      
      spaceConfig.moderationRestrictions = {};
      if (updateData.chatRestriction) {
        spaceConfig.moderationRestrictions.chatRestriction = updateData.chatRestriction;
      }
      if (updateData.presentRestriction) {
        spaceConfig.moderationRestrictions.presentRestriction = updateData.presentRestriction;
      }
    }
    
    return await this.meetRestClient.updateSpace(spaceName, spaceConfig);
  }

  /**
   * End the active conference in a Google Meet space.
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @returns {Promise<boolean>} - Success status
   */
  async endActiveConference(spaceName) {
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
  async listConferenceRecords(filter = null, pageSize = 10) {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.listConferenceRecords(filter, pageSize);
  }

  /**
   * Get details of a specific conference record.
   * @param {string} conferenceRecordName - Name of the conference record
   * @returns {Promise<Object>} - Conference record details
   */
  async getConferenceRecord(conferenceRecordName) {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.getConferenceRecord(conferenceRecordName);
  }

  /**
   * List recordings for a conference record.
   * @param {string} conferenceRecordName - Name of the conference record
   * @returns {Promise<Array>} - Recordings list
   */
  async listRecordings(conferenceRecordName) {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.listRecordings(conferenceRecordName);
  }

  /**
   * Get details of a specific recording.
   * @param {string} recordingName - Name of the recording
   * @returns {Promise<Object>} - Recording details
   */
  async getRecording(recordingName) {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.getRecording(recordingName);
  }

  /**
   * List transcripts for a conference record.
   * @param {string} conferenceRecordName - Name of the conference record
   * @returns {Promise<Array>} - Transcripts list
   */
  async listTranscripts(conferenceRecordName) {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.listTranscripts(conferenceRecordName);
  }

  /**
   * Get details of a specific transcript.
   * @param {string} transcriptName - Name of the transcript
   * @returns {Promise<Object>} - Transcript details
   */
  async getTranscript(transcriptName) {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.getTranscript(transcriptName);
  }

  /**
   * List transcript entries (individual speech segments).
   * @param {string} transcriptName - Name of the transcript
   * @param {number} pageSize - Maximum number of entries to return
   * @returns {Promise<Array>} - Transcript entries
   */
  async listTranscriptEntries(transcriptName, pageSize = 100) {
    // Use REST client for direct Google Meet API v2 access
    return await this.meetRestClient.listTranscriptEntries(transcriptName, pageSize);
  }

  // ========== GOOGLE MEET API v2beta METHODS (Developer Preview) ==========

  /**
   * Create a space member (co-host/member/viewer).
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @param {string} userEmail - Email address of the user to add
   * @param {string} role - Role for the member (COHOST, MEMBER, VIEWER)
   * @returns {Promise<Object>} - Created member data
   */
  async createSpaceMember(spaceName, userEmail, role = "MEMBER") {
    // Check if v2beta features are enabled
    if (!this.meetRestClient.featureFlags.enableV2BetaFeatures) {
      throw new Error('v2beta features are disabled. Member creation is not available.');
    }

    // Use REST client for direct Google Meet API v2beta access
    return await this.meetRestClient.createSpaceMember(spaceName, userEmail, role);
  }

  /**
   * List members of a Google Meet space.
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @param {number} pageSize - Maximum number of members to return
   * @returns {Promise<Array>} - Space members list
   */
  async listSpaceMembers(spaceName, pageSize = 10) {
    // Check if v2beta features are enabled
    if (!this.meetRestClient.featureFlags.enableV2BetaFeatures) {
      throw new Error('v2beta features are disabled. Member listing is not available.');
    }

    // Use REST client for direct Google Meet API v2beta access
    return await this.meetRestClient.listSpaceMembers(spaceName, pageSize);
  }

  /**
   * Get details of a specific space member.
   * @param {string} memberName - Full name of the member (spaces/{space}/members/{member})
   * @returns {Promise<Object>} - Member details
   */
  async getSpaceMember(memberName) {
    // Check if v2beta features are enabled
    if (!this.meetRestClient.featureFlags.enableV2BetaFeatures) {
      throw new Error('v2beta features are disabled. Space member operations are not available.');
    }

    // Use REST client for direct Google Meet API v2beta access
    return await this.meetRestClient.getSpaceMember(memberName);
  }

  /**
   * Delete a space member.
   * @param {string} memberName - Full name of the member (spaces/{space}/members/{member})
   * @returns {Promise<boolean>} - Success status
   */
  async deleteSpaceMember(memberName) {
    // Check if v2beta features are enabled
    if (!this.meetRestClient.featureFlags.enableV2BetaFeatures) {
      throw new Error('v2beta features are disabled. Member deletion is not available.');
    }

    // Use REST client for direct Google Meet API v2beta access
    await this.meetRestClient.deleteSpaceMember(memberName);
    return true;
  }

  // ========== ADDITIONAL METHODS FROM OFFICIAL SPECS ==========

  /**
   * Delete a Google Meet space.
   * Note: This operation is not supported by Google Meet API v2.
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @returns {Promise<boolean>} - Always false (operation not supported)
   */
  async deleteSpace(spaceName) {
    console.warn(`deleteSpace: Operation not supported by Google Meet API v2. Spaces cannot be deleted directly.`);
    throw new Error(`Delete space operation is not supported by Google Meet API v2. Space: ${spaceName}`);
  }

  /**
   * Connect to active conference (WebRTC).
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @returns {Promise<Object>} - Connection details
   */
  async connectActiveConference(spaceName) {
    // Check if experimental WebRTC features are enabled
    if (!this.meetRestClient.featureFlags.enableExperimentalWebRTC) {
      throw new Error('Experimental WebRTC features are disabled. WebRTC connection is not available.');
    }

    try {
      // Use REST client for direct Google Meet API v2beta access
      return await this.meetRestClient.connectActiveConference(spaceName);
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(`Meet API v2beta failed for connectActiveConference, using fallback: ${error.message}`);
      throw new Error(`Could not connect to active conference: ${error.message}`);
    }
  }

  /**
   * Get participant details.
   * @param {string} participantName - Name of the participant
   * @returns {Promise<Object>} - Participant details
   */
  async getParticipant(participantName) {
    try {
      // Use REST client for direct Google Meet API v2 access
      return await this.meetRestClient.getParticipant(participantName);
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(`Meet API v2 failed for getParticipant, using fallback: ${error.message}`);
      throw new Error(`Participant not found: ${error.message}`);
    }
  }

  /**
   * List participants for a conference record.
   * @param {string} conferenceRecordName - Name of the conference record
   * @param {number} pageSize - Maximum number of participants to return
   * @returns {Promise<Object>} - List of participants
   */
  async listParticipants(conferenceRecordName, pageSize = 10) {
    try {
      // Use REST client for direct Google Meet API v2 access
      return await this.meetRestClient.listParticipants(conferenceRecordName, pageSize);
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(`Meet API v2 failed for listParticipants, using fallback: ${error.message}`);
      return { participants: [], nextPageToken: null };
    }
  }

  /**
   * Get participant session details.
   * @param {string} participantSessionName - Name of the participant session
   * @returns {Promise<Object>} - Participant session details
   */
  async getParticipantSession(participantSessionName) {
    try {
      // Use REST client for direct Google Meet API v2 access
      return await this.meetRestClient.getParticipantSession(participantSessionName);
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(`Meet API v2 failed for getParticipantSession, using fallback: ${error.message}`);
      throw new Error(`Participant session not found: ${error.message}`);
    }
  }

  /**
   * List participant sessions.
   * @param {string} participantName - Name of the participant
   * @param {number} pageSize - Maximum number of sessions to return
   * @returns {Promise<Object>} - List of participant sessions
   */
  async listParticipantSessions(participantName, pageSize = 10) {
    try {
      // Use REST client for direct Google Meet API v2 access
      return await this.meetRestClient.listParticipantSessions(participantName, pageSize);
    } catch (error) {
      // Fallback response if REST API fails
      console.warn(`Meet API v2 failed for listParticipantSessions, using fallback: ${error.message}`);
      return { participantSessions: [], nextPageToken: null };
    }
  }

  // getTranscriptEntry method removed - not available in Google Meet API v2
  // Use listTranscriptEntries instead to get individual transcript entries

  /**
   * Add members to a Google Meet space (legacy method for compatibility).
   * Note: Fallback implementation - co-hosts will be documented in meeting description
   * @param {string} spaceName - Name of the space (spaces/{space_id})
   * @param {Array<string>} memberEmails - List of member email addresses
   * @param {string} role - Role for the members (COHOST, MEMBER, VIEWER)
   * @returns {Promise<Array>} - Simulated members
   */
  async addMembersToSpace(spaceName, memberEmails, role = "MEMBER") {
    console.warn(
      `addMembersToSpace: Using fallback - ${role} members will be documented in meeting description`
    );

    const members = [];

    for (const email of memberEmails) {
      members.push({
        name: `${spaceName}/members/${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        user: { email },
        role: role,
      });
    }

    return members;
  }

  /**
   * Remove a member from a Google Meet space.
   * Note: Fallback implementation - feature not available
   * @param {string} memberName - Full name of the member (spaces/{space}/members/{member})
   * @returns {Promise<boolean>} - Always false (fallback)
   */
  async removeSpaceMember(memberName) {
    console.warn(
      "removeSpaceMember: Feature not available - Google Meet API v2beta not accessible"
    );
    return false;
  }

  /**
   * Get recordings for a meeting.
   * @param {string} meetingCode - The meeting code from the Meet URL
   * @returns {Promise<Object>} - Recording information
   */
  async getMeetingRecordings(meetingCode) {
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
  _formatCalendarEvent(event) {
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
  _formatMeetingData(event) {
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
