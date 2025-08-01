// TypeScript definitions for MCP integration with Prisma types
import type { User, ApiKey as PrismaApiKey, McpRequest, MeetSpace, ConferenceRecord, Recording, Transcript, Participant, CalendarEvent } from '@prisma/client';

export interface MCPUser extends User {
  mcpEnabled?: boolean;
  googleCredentialsUpdatedAt?: Date;
  googleTokens?: {
    access_token: string;
    refresh_token: string;
    expires_at: Date;
  };
}

export interface ApiKey extends PrismaApiKey {
  apiKeyPreview: string;
  fullApiKey?: string; // Only included for user's own keys
  userName?: string;
  userEmail?: string;
}

export interface MCPRequest {
  method: 'tools/list' | 'tools/call';
  params?: {
    name?: string;
    arguments?: Record<string, any>;
  };
}

export interface MCPResponse {
  tools?: MCPTool[];
  content?: MCPContent[];
  isError?: boolean;
  _meta?: {
    userId: string;
    timestamp: string;
    version: string;
    toolsCount?: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPContent {
  type: 'text';
  text: string;
}

export interface MCPAnalytics {
  totalRequests: number;
  timeRange: string;
  toolsUsage: Array<{
    _id: string;
    count: number;
    lastUsed: Date;
  }>;
  generatedAt: Date;
}

export interface MCPStatus {
  enabled: boolean;
  hasCredentials: boolean;
  needsSetup: boolean;
}

export interface GoogleCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface MCPLogEntry {
  userId: string;
  method: string;
  toolName?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
}

export interface MCPStats {
  overview: {
    totalUsers: number;
    totalApiKeys: number;
    activeApiKeys: number;
    recentlyActive: number;
    timeRange: string;
  };
  apiKeyStats: {
    totalKeys: number;
    activeKeys: number;
    recentlyActive: number;
    usageByUser: Array<{
      _id: string;
      totalUsage: number;
      lastUsed: Date;
    }>;
  };
  users: MCPUser[];
  topUsers: Array<{
    _id: string;
    totalUsage: number;
    lastUsed: Date;
  }>;
  generatedAt: string;
}

// Extended types for Prisma relationships
export interface UserWithApiKeys extends User {
  apiKeys: PrismaApiKey[];
  mcpRequests: McpRequest[];
}

export interface MeetSpaceWithRecords extends MeetSpace {
  conferenceRecords: ConferenceRecord[];
}

export interface ConferenceRecordWithDetails extends ConferenceRecord {
  space: MeetSpace;
  recordings: Recording[];
  transcripts: Transcript[];
  participants: Participant[];
}

export interface CalendarEventWithDetails extends CalendarEvent {
  attendees: string[]; // JSON field converted to array
}

// Database operation types
export interface CreateUserInput {
  email: string;
  name?: string;
  googleCredentials?: string;
  tokenPath?: string;
}

export interface CreateMeetSpaceInput {
  spaceName: string;
  meetingUri?: string;
  accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
  createdBy: string;
  enableRecording?: boolean;
  enableTranscription?: boolean;
  enableSmartNotes?: boolean;
  moderationMode?: 'ON' | 'OFF';
  chatRestriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
  presentRestriction?: 'HOSTS_ONLY' | 'NO_RESTRICTION';
}

export interface CreateCalendarEventInput {
  eventId: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  timeZone?: string;
  createdBy: string;
  meetConference?: boolean;
  meetingUri?: string;
  guestCanInviteOthers?: boolean;
  guestCanModify?: boolean;
  guestCanSeeOtherGuests?: boolean;
  attendees?: string[];
}

export interface LogMcpRequestInput {
  userId: string;
  toolName: string;
  arguments?: any;
  response?: any;
  success: boolean;
  errorMsg?: string;
  duration?: number;
  userAgent?: string;
  ipAddress?: string;
}