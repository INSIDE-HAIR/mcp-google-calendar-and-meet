/**
 * TypeScript definitions for Google Meet MCP Server v2.0
 * These interfaces provide type definitions for Google Calendar API v3 and Google Meet API v2
 */

// ========== GOOGLE CALENDAR API v3 TYPES ==========

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  time_zone: string;
  attendees: Array<{
    email: string;
    response_status: string;
  }>;
  creator?: string;
  organizer?: string;
  created: string;
  updated: string;
  has_meet_conference: boolean;
  meet_link?: string;
  guest_can_invite_others?: boolean;
  guest_can_modify?: boolean;
  guest_can_see_other_guests?: boolean;
}

export interface CreateCalendarEventParams {
  summary: string;
  start_time: string;
  end_time: string;
  description?: string;
  location?: string;
  time_zone?: string;
  attendees?: string[];
  create_meet_conference?: boolean;
  guest_can_invite_others?: boolean;
  guest_can_modify?: boolean;
  guest_can_see_other_guests?: boolean;
}

export interface UpdateCalendarEventParams {
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
}

// ========== GOOGLE MEET API v2 TYPES (GA) ==========

export interface Space {
  name: string; // "spaces/{space_id}"
  meetingUri?: string; // "https://meet.google.com/{meeting_code}"
  meetingCode?: string;
  config?: SpaceConfig;
  activeConference?: {
    conferenceRecord: string; // "conferenceRecords/{conference_record}"
  };
}

export interface SpaceConfig {
  accessType?: "OPEN" | "TRUSTED" | "RESTRICTED";
  entryPointAccess?: "ALL" | "CREATOR_APP_ONLY";
  moderation?: "OFF" | "ON";
  moderationRestrictions?: {
    chatRestriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    reactionRestriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    presentRestriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    defaultJoinAsViewerType?: "ON" | "OFF";
  };
  attendanceReportGenerationType?: "GENERATE_REPORT" | "DO_NOT_GENERATE";
  artifactConfig?: {
    recordingConfig?: {
      autoRecordingGeneration: "ON" | "OFF";
    };
    transcriptionConfig?: {
      autoTranscriptionGeneration: "ON" | "OFF";
    };
    smartNotesConfig?: {
      autoSmartNotesGeneration: "ON" | "OFF";
    };
  };
}

export interface ConferenceRecord {
  name: string; // "conferenceRecords/{conference_record}"
  startTime: string;
  endTime: string;
  expireTime: string;
  space: string; // "spaces/{space_id}"
}

export interface Recording {
  name: string; // "conferenceRecords/{conference_record}/recordings/{recording}"
  driveDestination?: {
    file: string;
    exportUri: string;
  };
  state: RecordingState;
  startTime: string;
  endTime: string;
}

export interface Transcript {
  name: string; // "conferenceRecords/{conference_record}/transcripts/{transcript}"
  docsDestination?: {
    document: string;
    exportUri: string;
  };
  state: TranscriptState;
  startTime: string;
  endTime: string;
}

export interface TranscriptEntry {
  name: string; // "conferenceRecords/{conference_record}/transcripts/{transcript}/entries/{entry}"
  participant: string; // "conferenceRecords/{conference_record}/participants/{participant}"
  text: string;
  languageCode: string;
  startTime: string;
  endTime: string;
}


// ========== MCP TOOL PARAMETERS ==========

export interface CreateSpaceParams {
  access_type?: "OPEN" | "TRUSTED" | "RESTRICTED";
  entry_point_access?: "ALL" | "CREATOR_APP_ONLY";
  enable_recording?: boolean;
  enable_transcription?: boolean;
  enable_smart_notes?: boolean;
  attendance_report?: boolean;
  moderation_mode?: "ON" | "OFF";
  chat_restriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
  reaction_restriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
  present_restriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
  default_join_as_viewer?: boolean;
}


// ========== LEGACY TYPES (for backward compatibility) ==========

export interface Meeting {
  id: string;
  summary: string;
  description: string;
  meet_link: string;
  recording_enabled: boolean;
  start_time: string;
  end_time: string;
  attendees: Array<{
    email: string;
    response_status: string;
  }>;
  creator?: string;
  organizer?: string;
  created: string;
  updated: string;
}

export interface CreateMeetingOptions {
  coHosts?: string[];
  enableTranscription?: boolean;
  enableSmartNotes?: boolean;
  attendanceReport?: boolean;
  spaceConfig?: {
    moderation_mode?: "ON" | "OFF";
    chat_restriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    present_restriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    default_join_as_viewer?: boolean;
  };
  guestPermissions?: {
    canInviteOthers?: boolean;
    canModify?: boolean;
    canSeeOtherGuests?: boolean;
  };
}

// ========== MCP TYPES ==========

export interface MCPToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

// ========== ENUM TYPES ==========

export type AccessType = "OPEN" | "TRUSTED" | "RESTRICTED";
export type EntryPointAccess = "ALL" | "CREATOR_APP_ONLY";
export type Moderation = "OFF" | "ON";
export type RestrictionType = "HOSTS_ONLY" | "NO_RESTRICTION";
export type DefaultJoinAsViewerType = "ON" | "OFF";
export type AttendanceReportGenerationType = "GENERATE_REPORT" | "DO_NOT_GENERATE";
export type AutoGenerationType = "ON" | "OFF";
export type MemberRole = "HOST" | "COHOST" | "MEMBER" | "VIEWER";
export type RecordingState = "STARTED" | "ENDED" | "FILE_GENERATED";
export type TranscriptState = "STARTED" | "ENDED" | "FILE_GENERATED";

// ========== OAUTH SCOPES ==========

export type GoogleMeetScope = 
  | "https://www.googleapis.com/auth/calendar"
  | "https://www.googleapis.com/auth/meetings.space.created"
  | "https://www.googleapis.com/auth/meetings.space.readonly"
  | "https://www.googleapis.com/auth/meetings.space.settings"
  | "https://www.googleapis.com/auth/drive.readonly";

// ========== API RESPONSE TYPES ==========

export interface GoogleAPIResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface ListResponse<T> {
  items?: T[];
  nextPageToken?: string;
}