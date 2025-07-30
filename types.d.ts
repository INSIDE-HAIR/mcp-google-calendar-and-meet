/**
 * TypeScript definitions for Google Meet MCP Server
 * These interfaces provide type definitions for the enhanced Google Meet API integration
 */

export interface Member {
  name: string; // "spaces/{space}/members/{member}"
  user: {
    email: string;
  };
  role: "COHOST" | "MEMBER" | "VIEWER";
}

export interface SpaceConfig {
  accessType?: "ALL" | "RESTRICTED";
  entryPointAccess?: "ALL" | "CREATOR_APP_ONLY";
  
  moderation?: {
    mode: "ON" | "OFF" | "UNSPECIFIED";
  };
  
  moderationRestrictions?: {
    chatRestriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    reactionRestriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    presentRestriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    defaultJoinAsViewerType?: "ON" | "OFF";
  };
  
  artifactConfig?: {
    recordingConfig?: {
      autoRecordingEnabled: boolean;
    };
    transcriptConfig?: {
      autoTranscriptionEnabled: boolean;
    };
    smartNotesConfig?: {
      autoNotesEnabled: boolean;
    };
  };
  
  attendanceReportGenerationType?: "ENABLED" | "DISABLED";
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
}

export interface CreateMeetingParams {
  summary: string;
  start_time: string;
  end_time: string;
  description?: string;
  attendees?: string[];
  
  // Enhanced parameters
  co_hosts?: string[];
  enable_recording?: boolean;
  enable_transcription?: boolean;
  enable_smart_notes?: boolean;
  attendance_report?: boolean;
  
  // Advanced space configuration
  space_config?: {
    moderation_mode?: "ON" | "OFF";
    chat_restriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    present_restriction?: "HOSTS_ONLY" | "NO_RESTRICTION";
    default_join_as_viewer?: boolean;
  };
}

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

export interface SpaceData {
  name: string; // "spaces/{space_id}"
  meetingUri: string;
  config: SpaceConfig;
  activeConference?: {
    conferenceRecord: string;
  };
}

export interface RecordingData {
  message: string;
  meeting_code: string;
  recordings: Array<{
    name?: string;
    uri?: string;
    state?: "STARTED" | "ENDED" | "FILE_GENERATED";
  }>;
}

// MCP Tool Schemas
export interface MCPToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

// OAuth Scopes
export type GoogleMeetScope = 
  | "https://www.googleapis.com/auth/calendar"
  | "https://www.googleapis.com/auth/meetings.space.created"
  | "https://www.googleapis.com/auth/meetings.space.readonly"
  | "https://www.googleapis.com/auth/meetings.space.settings";

// API Response Types
export interface GoogleAPIResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface ListMembersResponse {
  members?: Member[];
  nextPageToken?: string;
}

export interface ConferenceRecord {
  name: string; // "conferenceRecords/{conference_record}"
  startTime: string;
  endTime: string;
  expireTime: string;
  space: string; // "spaces/{space}"
}