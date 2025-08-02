/**
 * Google Meet MCP Server TypeScript Definitions
 * Types specific to our MCP server implementation
 */

import type {
  GoogleOAuth2Client,
  GoogleCalendarClient,
  MeetSpace,
  SpaceConfig,
  ConferenceRecord,
  Recording,
  Transcript,
  TranscriptEntry,
  Participant,
  ParticipantSession,
  GoogleCalendarEvent
} from './google-apis.js';

// =============================================================================
// MCP Server Configuration Types
// =============================================================================

export interface MeetServerConfig {
  auth: AuthConfig;
  meet: MeetConfig;
  debug: boolean;
  logLevel: LogLevel;
}

export interface AuthConfig {
  credentialsPath: string;
  tokenPath?: string;
}

export interface MeetConfig {
  maxRetries: number;
  timeoutMs: number;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// =============================================================================
// Tool Input/Output Types
// =============================================================================

// Calendar API Tool Types
export interface ListCalendarsInput {
  // No parameters required
}

export interface ListEventsInput {
  max_results?: number;
  time_min?: string;
  time_max?: string;
  calendar_id?: string;
}

export interface GetEventInput {
  event_id: string;
  calendar_id?: string;
}

export interface CreateEventInput {
  summary: string;
  start_time: string;
  end_time: string;
  description?: string;
  location?: string;
  attendees?: string[];
  time_zone?: string;
  calendar_id?: string;
  create_meet_conference?: boolean;
  guest_can_invite_others?: boolean;
  guest_can_modify?: boolean;
  guest_can_see_other_guests?: boolean;
}

export interface UpdateEventInput {
  event_id: string;
  summary?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  time_zone?: string;
  attendees?: string[];
  guest_can_invite_others?: boolean;
  guest_can_modify?: boolean;
  guest_can_see_other_guests?: boolean;
  calendar_id?: string;
}

export interface DeleteEventInput {
  event_id: string;
  calendar_id?: string;
}

// Meet API Tool Types
export interface CreateSpaceInput {
  access_type?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
  enable_recording?: boolean;
  enable_transcription?: boolean;
  enable_smart_notes?: boolean;
  moderation_mode?: 'ON' | 'OFF';
  chat_restriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
  present_restriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
  default_join_as_viewer?: boolean;
  attendance_report?: boolean;
}

export interface GetSpaceInput {
  space_name: string;
}

export interface UpdateSpaceInput {
  space_name: string;
  access_type?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
  moderation_mode?: 'ON' | 'OFF';
  chat_restriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
  present_restriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
}

export interface EndActiveConferenceInput {
  space_name: string;
}

export interface ListConferenceRecordsInput {
  filter?: string;
}

export interface GetConferenceRecordInput {
  conference_record_name: string;
}

export interface ListRecordingsInput {
  conference_record_name: string;
}

export interface GetRecordingInput {
  recording_name: string;
}

export interface ListTranscriptsInput {
  conference_record_name: string;
}

export interface GetTranscriptInput {
  transcript_name: string;
}

export interface ListTranscriptEntriesInput {
  transcript_name: string;
}

export interface GetParticipantInput {
  participant_name: string;
}

export interface ListParticipantsInput {
  conference_record_name: string;
}

export interface GetParticipantSessionInput {
  participant_session_name: string;
}

export interface ListParticipantSessionsInput {
  participant_name: string;
}

// =============================================================================
// Internal Processing Types
// =============================================================================

export interface GuestPermissions {
  canInviteOthers?: boolean;
  canModify?: boolean;
  canSeeOtherGuests?: boolean;
}

export interface CreateMeetingOptions {
  coHosts?: string[];
  enableTranscription?: boolean;
  enableSmartNotes?: boolean;
  attendanceReport?: boolean;
  spaceConfig?: Partial<SpaceConfig>;
  guestPermissions?: GuestPermissions;
}

export interface EventUpdateData {
  summary?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  attendees?: string[];
  guestCanInviteOthers?: boolean;
  guestCanModify?: boolean;
  guestCanSeeOtherGuests?: boolean;
}

export interface SpaceUpdateData {
  accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
  moderationMode?: 'ON' | 'OFF';
  chatRestriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
  presentRestriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
}

// =============================================================================
// API Response Processing Types
// =============================================================================

export interface ProcessedCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface ProcessedEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  calendar_id?: string;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  meetLink?: string;
  hangoutLink?: string;
  htmlLink?: string;
  status?: string;
}

// =============================================================================
// REST Client Types
// =============================================================================

export interface RestClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

export interface RestResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<T>;
  text(): Promise<string>;
}

// =============================================================================
// Validation Types (for Zod schemas)
// =============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    path?: string[];
  };
}

// =============================================================================
// Server Initialization Types
// =============================================================================

export interface ServerInfo {
  name: string;
  version: string;
}

export interface ServerCapabilities {
  tools: Record<string, unknown>;
}

export interface McpServerOptions {
  serverInfo: ServerInfo;
  capabilities: ServerCapabilities;
}