/**
 * Google APIs TypeScript Definitions
 * Comprehensive types for Google Calendar API v3 and Google Meet API v2
 */

// =============================================================================
// Google OAuth2 Types
// =============================================================================

// Google OAuth2Client wrapper - maps to google.auth.OAuth2
export interface GoogleOAuth2Client {
  getAccessToken(): Promise<{ token?: string }>;
  setCredentials(tokens: GoogleTokens): void;
  generateAuthUrl(options: AuthUrlOptions): string;
  getToken(code: string): Promise<{ tokens: GoogleTokens }>;
  credentials: GoogleTokens;
  // Note: refreshToken is protected in the actual OAuth2Client
  // We'll handle this with type assertions where needed
}

export interface GoogleTokens {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
}

export interface AuthUrlOptions {
  access_type: 'offline' | 'online';
  scope: string[];
  redirect_uri?: string;
}

// =============================================================================
// Google Calendar API v3 Types
// =============================================================================

// Google Calendar client wrapper - maps to google.calendar('v3')
export interface GoogleCalendarClient {
  calendars: {
    list(): Promise<CalendarListResponse>;
  };
  events: {
    list(params: EventListParams): Promise<EventListResponse>;
    get(params: EventGetParams): Promise<EventResponse>;
    insert(params: EventInsertParams): Promise<EventResponse>;
    patch(params: EventUpdateParams): Promise<EventResponse>;
    update(params: EventUpdateParams): Promise<EventResponse>;
    delete(params: EventDeleteParams): Promise<void>;
  };
}

export interface CalendarListResponse {
  data: {
    items?: GoogleCalendar[];
  };
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface EventListParams {
  calendarId: string;
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
  orderBy?: 'startTime' | 'updated';
  singleEvents?: boolean;
  conferenceDataVersion?: number;
}

export interface EventListResponse {
  data: {
    items?: GoogleCalendarEvent[];
  };
}

export interface EventGetParams {
  calendarId: string;
  eventId: string;
}

export interface EventResponse {
  data: GoogleCalendarEvent;
}

export interface EventInsertParams {
  calendarId: string;
  conferenceDataVersion?: number;
  resource: GoogleCalendarEvent;
}

export interface EventUpdateParams {
  calendarId: string;
  eventId: string;
  resource: Partial<GoogleCalendarEvent>;
}

export interface EventDeleteParams {
  calendarId: string;
  eventId: string;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: EventDateTime;
  end?: EventDateTime;
  attendees?: EventAttendee[];
  conferenceData?: ConferenceData;
  guestsCanInviteOthers?: boolean;
  guestsCanModify?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  hangoutLink?: string;
  htmlLink?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
}

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface EventAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
}

export interface ConferenceData {
  createRequest?: {
    requestId: string;
    conferenceSolutionKey: {
      type: 'hangoutsMeet';
    };
  };
  conferenceId?: string;
  conferenceSolution?: {
    key: {
      type: string;
    };
    name: string;
    iconUri: string;
  };
  entryPoints?: ConferenceEntryPoint[];
}

export interface ConferenceEntryPoint {
  entryPointType: 'video' | 'phone' | 'sip' | 'more';
  uri: string;
  label?: string;
  pin?: string;
  accessCode?: string;
  meetingCode?: string;
  passcode?: string;
  password?: string;
}

// =============================================================================
// Google Meet API v2 Types  
// =============================================================================

export interface MeetSpace {
  name: string;
  meetingUri?: string;
  meetingCode?: string;
  config?: SpaceConfig;
  activeConference?: ActiveConference;
}

export interface SpaceConfig {
  accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
  entryPointAccess?: 'ALL' | 'CREATOR_APP_ONLY';
  moderation?: 'ON' | 'OFF';
  moderationRestrictions?: ModerationRestrictions;
  artifactConfig?: ArtifactConfig;
  attendanceReportGenerationType?: 'GENERATE_REPORT' | 'DO_NOT_GENERATE';
}

export interface ModerationRestrictions {
  chatRestriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
  presentRestriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
  defaultJoinAsViewerType?: 'ON' | 'OFF';
}

export interface ArtifactConfig {
  recordingConfig?: {
    autoRecordingGeneration: 'ON' | 'OFF';
  };
  transcriptionConfig?: {
    autoTranscriptionGeneration: 'ON' | 'OFF';
  };
  smartNotesConfig?: {
    autoSmartNotesGeneration: 'ON' | 'OFF';
  };
}

export interface ActiveConference {
  conferenceRecord?: string;
}

export interface ConferenceRecord {
  name: string;
  startTime?: string;
  endTime?: string;
  expireTime?: string;
  space?: string;
}

export interface Recording {
  name: string;
  driveDestination?: DriveDestination;
  state?: 'FILE_GENERATED' | 'GENERATING_FILE' | 'UPLOAD_IN_PROGRESS';
  startTime?: string;
  endTime?: string;
}

export interface DriveDestination {
  file?: string;
  exportUri?: string;
}

export interface Transcript {
  name: string;
  docsDestination?: DocsDestination;
  state?: 'FILE_GENERATED' | 'GENERATING_FILE' | 'UPLOAD_IN_PROGRESS';
  startTime?: string;
  endTime?: string;
}

export interface DocsDestination {
  document?: string;
  exportUri?: string;
}

export interface TranscriptEntry {
  name: string;
  participant?: string;
  text?: string;
  languageCode?: string;
  startTime?: string;
  endTime?: string;
}

export interface Participant {
  name: string;
  earliestStartTime?: string;
  latestEndTime?: string;
  signalingId?: string;
  anonymousUser?: AnonymousUser;
  phoneUser?: PhoneUser;
}

export interface AnonymousUser {
  displayName?: string;
}

export interface PhoneUser {
  displayName?: string;
}

export interface ParticipantSession {
  name: string;
  startTime?: string;
  endTime?: string;
}

// =============================================================================
// Google APIs Library Compatibility Types
// =============================================================================

// Type for the actual google.auth.OAuth2 instance
export type GoogleAuthOAuth2Instance = any; // Temporary until proper typing

// Type for the actual google.calendar instance  
export type GoogleCalendarInstance = any; // Temporary until proper typing

// =============================================================================
// Error Types
// =============================================================================

export interface GoogleApiError extends Error {
  response?: {
    status: number;
    statusText: string;
    data?: {
      error?: {
        code: number;
        message: string;
        status: string;
        details?: any[];
      };
    };
  };
  code?: string;
}

export interface NodeError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  path?: string;
}