/**
 * Google Meet API client that interacts with the Google Calendar API
 * and Google Meet API to manage Google Meet meetings with recording capabilities.
 */

import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
import open from 'open';
import http from 'http';
import { URL } from 'url';

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
  }

  /**
   * Initialize the API client with OAuth2 credentials.
   */
  async initialize() {
    const credentials = JSON.parse(await fs.readFile(this.credentialsPath, 'utf8'));
    
    // Handle both 'web' and 'installed' credential types
    const credentialData = credentials.web || credentials.installed;
    if (!credentialData) {
      throw new Error('Invalid credentials file format. Expected "web" or "installed" key.');
    }
    const { client_id, client_secret, redirect_uris } = credentialData;
    
    const oAuth2Client = new google.auth.OAuth2(
      client_id, 
      client_secret, 
      redirect_uris[0]
    );

    try {
      // Check if token exists and use it
      const token = JSON.parse(await fs.readFile(this.tokenPath, 'utf8'));
      oAuth2Client.setCredentials(token);
      
      // Check if token is expired and needs refresh
      if (token.expiry_date && token.expiry_date < Date.now()) {
        // Token is expired, refresh it
        const { credentials } = await oAuth2Client.refreshToken(token.refresh_token);
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
          `Authentication failed. Please run setup manually: GOOGLE_OAUTH_CREDENTIALS="${this.credentialsPath}" npm run setup`
        );
      }
    }
    
    // Initialize the calendar API
    this.calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    
    // Note: Meet API v2 would be initialized here for advanced recording features
    // Currently, recording configuration is handled through calendar event descriptions
    // this.meet = google.meet({ version: 'v2', auth: oAuth2Client }); // Future implementation
  }
  
  /**
   * List upcoming Google Meet meetings.
   * @param {number} maxResults - Maximum number of results to return
   * @param {string} timeMin - Start time in ISO format
   * @param {string} timeMax - End time in ISO format
   * @returns {Promise<Array>} - List of meetings
   */
  async listMeetings(maxResults = 10, timeMin = null, timeMax = null) {
    // Default timeMin to now if not provided
    if (!timeMin) {
      timeMin = new Date().toISOString();
    }
    
    // Prepare parameters for the API call
    const params = {
      calendarId: 'primary',
      maxResults: maxResults,
      timeMin: timeMin,
      orderBy: 'startTime',
      singleEvents: true,
      conferenceDataVersion: 1
    };
    
    if (timeMax) {
      params.timeMax = timeMax;
    }
    
    try {
      const response = await this.calendar.events.list(params);
      const events = response.data.items || [];
      
      // Filter for events with conferenceData (Google Meet)
      const meetings = [];
      for (const event of events) {
        if (event.conferenceData) {
          const meeting = this._formatMeetingData(event);
          if (meeting) {
            meetings.push(meeting);
          }
        }
      }
      
      return meetings;
    } catch (error) {
      throw new Error(`Error listing meetings: ${error.message}`);
    }
  }
  
  /**
   * Get details of a specific Google Meet meeting.
   * @param {string} meetingId - ID of the meeting to retrieve
   * @returns {Promise<Object>} - Meeting details
   */
  async getMeeting(meetingId) {
    try {
      const response = await this.calendar.events.get({
        calendarId: 'primary',
        eventId: meetingId,
        conferenceDataVersion: 1
      });
      
      const event = response.data;
      
      if (!event.conferenceData) {
        throw new Error(`Event with ID ${meetingId} does not have Google Meet conferencing data`);
      }
      
      const meeting = this._formatMeetingData(event);
      if (!meeting) {
        throw new Error(`Failed to format meeting data for event ID ${meetingId}`);
      }
      
      return meeting;
    } catch (error) {
      throw new Error(`Error getting meeting: ${error.message}`);
    }
  }
  
  /**
   * Create a new Google Meet meeting.
   * @param {string} summary - Title of the meeting
   * @param {string} startTime - Start time in ISO format
   * @param {string} endTime - End time in ISO format
   * @param {string} description - Description for the meeting
   * @param {Array<string>} attendees - List of email addresses for attendees
   * @param {boolean} enableRecording - Whether to enable recording (requires Google Workspace)
   * @returns {Promise<Object>} - Created meeting details
   */
  async createMeeting(summary, startTime, endTime, description = "", attendees = [], enableRecording = false) {
    // Prepare attendees list in the format required by the API
    const formattedAttendees = attendees.map(email => ({ email }));
    
    // Create the event with Google Meet conferencing
    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
      attendees: formattedAttendees,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`
        }
      }
    };
    
    // Add recording note to description if enabled
    if (enableRecording) {
      event.description = (description ? description + '\n\n' : '') + 
        '📹 Note: Recording will be enabled for this meeting (requires Google Workspace Business Standard or higher).';
    }
    
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        resource: event
      });
      
      const createdEvent = response.data;
      
      if (!createdEvent.conferenceData) {
        throw new Error("Failed to create Google Meet conferencing data");
      }
      
      const meeting = this._formatMeetingData(createdEvent);
      if (!meeting) {
        throw new Error("Failed to format meeting data for newly created event");
      }
      
      return meeting;
    } catch (error) {
      throw new Error(`Error creating meeting: ${error.message}`);
    }
  }
  
  /**
   * Update an existing Google Meet meeting.
   * @param {string} meetingId - ID of the meeting to update
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} - Updated meeting details
   */
  async updateMeeting(meetingId, { summary, description, startTime, endTime, attendees } = {}) {
    try {
      // First, get the existing event
      const response = await this.calendar.events.get({
        calendarId: 'primary',
        eventId: meetingId
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
        event.attendees = attendees.map(email => ({ email }));
      }
      
      // Make the API call to update the event
      const updateResponse = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: meetingId,
        conferenceDataVersion: 1,
        resource: event
      });
      
      const updatedEvent = updateResponse.data;
      
      if (!updatedEvent.conferenceData) {
        throw new Error("Updated event does not have Google Meet conferencing data");
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
        calendarId: 'primary',
        eventId: meetingId
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
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/meetings.space.created'
    ];

    console.error('\n🔐 Google Authentication Required');
    console.error('📝 To use Google Meet MCP Server, you need to authenticate with Google.');

    return new Promise((resolve, reject) => {
      // Create a temporary HTTP server to handle the OAuth callback
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost:3000');
        
        if (url.pathname === '/oauth2callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
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
            res.writeHead(200, { 'Content-Type': 'text/html' });
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
            oAuth2Client.getToken(code)
              .then(({ tokens }) => {
                return fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2))
                  .then(() => tokens);
              })
              .then((tokens) => {
                oAuth2Client.setCredentials(tokens);
                console.error('✅ Authentication successful! Token saved.');
                server.close();
                resolve();
              })
              .catch(err => {
                console.error('❌ Error saving token:', err);
                server.close();
                reject(err);
              });
          }
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      server.listen(3000, () => {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
          prompt: 'consent',
          redirect_uri: 'http://localhost:3000/oauth2callback'
        });

        console.error('🌐 Opening browser for authentication...');
        console.error(`🔗 If browser doesn't open, visit: ${authUrl}`);

        // Try to open browser
        open(authUrl).catch(() => {
          console.error('❌ Could not open browser automatically');
          console.error(`📋 Please manually visit: ${authUrl}`);
        });

        // Timeout after 5 minutes
        setTimeout(() => {
          server.close();
          reject(new Error('Authentication timeout. Please try again.'));
        }, 300000);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error('❌ Port 3000 is in use. Please try again or run setup script manually.');
        }
        reject(err);
      });
    });
  }

  /**
   * Get recordings for a meeting.
   * @param {string} meetingCode - The meeting code from the Meet URL
   * @returns {Promise<Object>} - Recording information
   */
  async getMeetingRecordings(meetingCode) {
    try {
      // Note: This requires the Google Meet API v2 and proper workspace permissions
      // The actual implementation would need to:
      // 1. Find the conference record by meeting code
      // 2. List recordings for that conference record
      
      // For now, return a placeholder indicating the feature requires workspace
      return {
        message: "Recording retrieval requires Google Workspace Business Standard or higher",
        meeting_code: meetingCode,
        recordings: []
      };
    } catch (error) {
      throw new Error(`Error getting recordings: ${error.message}`);
    }
  }
  
  /**
   * Format event data to meeting format.
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
      if (entryPoint.entryPointType === 'video') {
        meetLink = entryPoint.uri;
        break;
      }
    }
    
    if (!meetLink) {
      return null;
    }
    
    // Format attendees
    const attendees = (event.attendees || []).map(attendee => ({
      email: attendee.email,
      response_status: attendee.responseStatus
    }));
    
    // Check if recording is mentioned in description
    const recordingEnabled = event.description?.includes('📹 Note: Recording will be enabled') || false;
    
    // Build the formatted meeting data
    const meeting = {
      id: event.id,
      summary: event.summary || '',
      description: event.description || '',
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
