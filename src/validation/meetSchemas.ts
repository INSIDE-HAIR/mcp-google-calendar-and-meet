/**
 * Zod validation schemas for Google Meet MCP Server tools
 * Focuses on the main Meet API v2 and Calendar tools with clear error messages
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/;
const spaceNameRegex = /^spaces\/[a-zA-Z0-9_-]{1,128}$/;
const conferenceRecordRegex = /^conferenceRecords\/[a-zA-Z0-9_-]+$/;

/**
 * Meet API v2 Schemas - Top 4 most used tools
 */

// 1. meet_v2_create_space - Most complex and commonly used
export const CreateSpaceSchema = z.object({
  access_type: z.enum(['OPEN', 'TRUSTED', 'RESTRICTED'])
    .default('TRUSTED')
    .describe('Access control: OPEN (anyone with link), TRUSTED (Google account required), RESTRICTED (invitation only)'),
    
  enable_recording: z.boolean()
    .default(false)
    .describe('⚠️ Prepares recording capability - must be manually activated during the meeting'),
    
  enable_transcription: z.boolean()
    .default(false)
    .describe('Enables automatic transcription generation post-meeting'),
    
  enable_smart_notes: z.boolean()
    .default(false)
    .describe('🧠 Enables AI-powered meeting summaries (requires Gemini license)'),
    
  attendance_report: z.boolean()
    .default(false)
    .describe('Generates detailed attendance tracking report'),
    
  moderation_mode: z.enum(['ON', 'OFF'])
    .default('OFF')
    .describe('Host moderation controls for chat and presentation permissions'),
    
  chat_restriction: z.enum(['HOSTS_ONLY', 'NO_RESTRICTION'])
    .optional()
    .describe('Chat permissions: HOSTS_ONLY restricts chat to hosts only'),
    
  present_restriction: z.enum(['HOSTS_ONLY', 'NO_RESTRICTION'])
    .optional()
    .describe('Presentation permissions: HOSTS_ONLY restricts screen sharing to hosts'),
    
  default_join_as_viewer: z.boolean()
    .default(false)
    .describe('Forces participants to join as viewers (cannot unmute/present by default)')
}).refine(
  (data) => {
    // Business logic validation
    if (data.enable_recording && data.access_type === 'OPEN') {
      throw new Error('🔒 Recording cannot be enabled for OPEN access meetings due to privacy and compliance concerns');
    }
    if (data.enable_smart_notes && !data.enable_transcription) {
      throw new Error('🧠 Smart notes require transcription to be enabled');
    }
    return true;
  },
  'Meet space configuration validation failed'
);

// 2. meet_v2_get_space - Simple but frequently used
export const GetSpaceSchema = z.object({
  space_name: z.string()
    .regex(spaceNameRegex, 'Space name must be in format: spaces/{space_id} or spaces/{meeting_code}')
    .describe('The space identifier (e.g., "spaces/abc-defg-hij" or "spaces/meeting-code")')
});

// 3. meet_v2_list_conference_records - Important for historical data
export const ListConferenceRecordsSchema = z.object({
  filter: z.string()
    .optional()
    .describe('Filter expression (e.g., space.name="spaces/{space_id}" or startTime>"2024-01-01T00:00:00Z")'),
    
  page_size: z.number()
    .min(1, 'Page size must be at least 1')
    .max(50, 'Page size cannot exceed 50 (Google API limit)')
    .default(10)
    .describe('Maximum number of conference records to return')
});

// 4. meet_v2_get_participant - Key for participant tracking
export const GetParticipantSchema = z.object({
  participant_name: z.string()
    .regex(/^conferenceRecords\/[a-zA-Z0-9_-]+\/participants\/[a-zA-Z0-9_-]+$/, 
           'Participant name must be in format: conferenceRecords/{record_id}/participants/{participant_id}')
    .describe('Full participant resource name')
});

/**
 * Calendar API v3 Schemas - Top 2 most used tools
 */

// 1. calendar_v3_create_event - Most commonly used calendar tool
export const CreateEventSchema = z.object({
  summary: z.string()
    .min(1, 'Meeting title is required')
    .max(255, 'Meeting title must be less than 255 characters')
    .describe('The title/subject of the meeting'),
    
  start_time: z.string()
    .regex(isoDateTimeRegex, 'Start time must be in ISO 8601 format (e.g., "2024-02-01T10:00:00Z" or "2024-02-01T10:00:00-05:00")')
    .describe('Meeting start time in ISO format with timezone'),
    
  end_time: z.string()
    .regex(isoDateTimeRegex, 'End time must be in ISO 8601 format (e.g., "2024-02-01T11:00:00Z" or "2024-02-01T11:00:00-05:00")')
    .describe('Meeting end time in ISO format with timezone'),
    
  description: z.string()
    .max(8192, 'Description cannot exceed 8192 characters')
    .optional()
    .describe('Optional meeting description or agenda'),
    
  location: z.string()
    .max(1024, 'Location cannot exceed 1024 characters')
    .optional(),
    
  time_zone: z.string()
    .default('UTC')
    .describe('Timezone for the event (e.g., "America/New_York", "Europe/London")'),
    
  attendees: z.array(z.string().email('Invalid email address'))
    .optional()
    .describe('List of attendee email addresses'),
    
  create_meet_conference: z.boolean()
    .default(false)
    .describe('Automatically creates a Google Meet link for this event'),
    
  guest_can_invite_others: z.boolean()
    .default(true)
    .describe('Allow attendees to invite additional people'),
    
  guest_can_modify: z.boolean()
    .default(false)
    .describe('Allow attendees to modify the event details'),
    
  guest_can_see_other_guests: z.boolean()
    .default(true)
    .describe('Allow attendees to see the full guest list'),
    
  calendar_id: z.string()
    .default('primary')
    .describe('Calendar ID to create the event in (default: "primary")')
}).refine(
  (data) => {
    // Time validation
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    
    if (endTime <= startTime) {
      throw new Error('⏰ End time must be after start time');
    }
    
    const diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      throw new Error('📅 Meeting duration cannot exceed 24 hours');
    }
    
    return true;
  },
  'Event time validation failed'
);

// 2. calendar_v3_list_events - Frequently used for viewing meetings
export const ListEventsSchema = z.object({
  max_results: z.number()
    .min(1, 'Maximum results must be at least 1')
    .max(2500, 'Maximum results cannot exceed 2500 (Google API limit)')
    .default(10)
    .describe('Maximum number of events to return'),
    
  time_min: z.string()
    .regex(isoDateTimeRegex, 'Time min must be in ISO 8601 format')
    .optional()
    .describe('Lower bound (inclusive) for event start times. Defaults to current time.'),
    
  time_max: z.string()
    .regex(isoDateTimeRegex, 'Time max must be in ISO 8601 format')  
    .optional()
    .describe('Upper bound (exclusive) for event start times'),
    
  calendar_id: z.string()
    .default('primary')
    .describe('Calendar ID to list events from (default: "primary")')
}).refine(
  (data) => {
    if (data.time_min && data.time_max) {
      const minTime = new Date(data.time_min);
      const maxTime = new Date(data.time_max);
      
      if (maxTime <= minTime) {
        throw new Error('⏰ time_max must be after time_min');
      }
    }
    return true;
  },
  'Time range validation failed'
);

// ========== CALENDAR API v3 - HERRAMIENTAS RESTANTES ==========

// calendar_v3_list_calendars - Sin parámetros requeridos
export const ListCalendarsSchema = z.object({}).describe('List all calendars - no parameters required');

// calendar_v3_get_event - Requiere event_id
export const GetEventSchema = z.object({
  event_id: z.string()
    .min(1, 'Event ID is required')
    .describe('Calendar event ID to retrieve')
}).describe('Get specific calendar event details');

// calendar_v3_update_event - Requiere event_id, otros opcionales
export const UpdateEventSchema = z.object({
  event_id: z.string()
    .min(1, 'Event ID is required'),
  summary: z.string()
    .min(1, 'Event title cannot be empty')
    .optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string()
    .regex(isoDateTimeRegex, 'Start time must be in ISO format (e.g., "2024-02-01T10:00:00Z")')
    .optional(),
  end_time: z.string()
    .regex(isoDateTimeRegex, 'End time must be in ISO format (e.g., "2024-02-01T11:00:00Z")')
    .optional(),
  time_zone: z.string().default('UTC'),
  attendees: z.array(z.string().email('Invalid email address')).optional(),
  guest_can_invite_others: z.boolean().optional(),
  guest_can_modify: z.boolean().optional(),  
  guest_can_see_other_guests: z.boolean().optional()
}).refine((data) => {
  if (data.start_time && data.end_time) {
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    if (endTime <= startTime) {
      throw new Error('⏰ End time must be after start time');
    }
  }
  return true;
}, 'Time validation failed').describe('Update existing calendar event');

// calendar_v3_delete_event - Requiere event_id
export const DeleteEventSchema = z.object({
  event_id: z.string()
    .min(1, 'Event ID is required')
    .describe('Calendar event ID to delete')
}).describe('Delete calendar event');

// ========== MEET API v2 - HERRAMIENTAS RESTANTES ==========

// meet_v2_update_space - Ya existe, pero necesitamos asegurar que esté incluido
export const UpdateSpaceSchema = z.object({
  space_name: z.string()
    .regex(spaceNameRegex, 'Space name must be in format: spaces/{space-id} or spaces/{meeting-code}')
    .describe('Name of the space (spaces/{space_id})'),
  access_type: z.enum(['OPEN', 'TRUSTED', 'RESTRICTED']).optional(),
  moderation_mode: z.enum(['ON', 'OFF']).optional(),
  chat_restriction: z.enum(['HOSTS_ONLY', 'NO_RESTRICTION']).optional(),
  present_restriction: z.enum(['HOSTS_ONLY', 'NO_RESTRICTION']).optional()
}).describe('Update Meet space configuration');

// meet_v2_end_active_conference - Requiere space_name
export const EndActiveConferenceSchema = z.object({
  space_name: z.string()
    .regex(spaceNameRegex, 'Space name must be in format: spaces/{space-id} or spaces/{meeting-code}')
    .describe('Name of the space (spaces/{space_id})')
}).describe('End active conference in Meet space');

// meet_v2_get_conference_record - Requiere conference_record_name
export const GetConferenceRecordSchema = z.object({
  conference_record_name: z.string()
    .regex(conferenceRecordRegex, 'Conference record name must be in format: conferenceRecords/{record_id}')
    .describe('Name of the conference record (conferenceRecords/{record_id})')
}).describe('Get specific conference record details');

// meet_v2_list_recordings - Requiere conference_record_name
export const ListRecordingsSchema = z.object({
  conference_record_name: z.string()
    .regex(conferenceRecordRegex, 'Conference record name must be in format: conferenceRecords/{record_id}')
    .describe('Name of the conference record (conferenceRecords/{record_id})')
}).describe('List recordings for a conference record');

// meet_v2_get_recording - Requiere recording_name
const recordingNameRegex = /^conferenceRecords\/[a-zA-Z0-9_-]+\/recordings\/[a-zA-Z0-9_-]+$/;
export const GetRecordingSchema = z.object({
  recording_name: z.string()
    .regex(recordingNameRegex, 'Recording name must be in format: conferenceRecords/{record_id}/recordings/{recording_id}')
    .describe('Name of the recording (conferenceRecords/{record_id}/recordings/{recording_id})')
}).describe('Get specific recording details');

// meet_v2_list_transcripts - Requiere conference_record_name  
export const ListTranscriptsSchema = z.object({
  conference_record_name: z.string()
    .regex(conferenceRecordRegex, 'Conference record name must be in format: conferenceRecords/{record_id}')
    .describe('Name of the conference record (conferenceRecords/{record_id})')
}).describe('List transcripts for a conference record');

// meet_v2_get_transcript - Requiere transcript_name
const transcriptNameRegex = /^conferenceRecords\/[a-zA-Z0-9_-]+\/transcripts\/[a-zA-Z0-9_-]+$/;
export const GetTranscriptSchema = z.object({
  transcript_name: z.string()
    .regex(transcriptNameRegex, 'Transcript name must be in format: conferenceRecords/{record_id}/transcripts/{transcript_id}')
    .describe('Name of the transcript (conferenceRecords/{record_id}/transcripts/{transcript_id})')
}).describe('Get specific transcript details');

// meet_v2_list_transcript_entries - Requiere transcript_name, page_size opcional
export const ListTranscriptEntriesSchema = z.object({
  transcript_name: z.string()
    .regex(transcriptNameRegex, 'Transcript name must be in format: conferenceRecords/{record_id}/transcripts/{transcript_id}')
    .describe('Name of the transcript (conferenceRecords/{record_id}/transcripts/{transcript_id})'),
  page_size: z.number()
    .min(1, 'Page size must be at least 1')
    .max(1000, 'Page size cannot exceed 1000')
    .default(100)
    .describe('Maximum number of entries to return (default: 100, max: 1000)')
}).describe('List transcript entries (individual speech segments)');

// meet_v2_list_participants - Requiere conference_record_name, page_size opcional  
export const ListParticipantsSchema = z.object({
  conference_record_name: z.string()
    .regex(conferenceRecordRegex, 'Conference record name must be in format: conferenceRecords/{record_id}')
    .describe('Name of the conference record (conferenceRecords/{record_id})'),
  page_size: z.number()
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size cannot exceed 100')
    .default(10)
    .describe('Maximum number of participants to return (default: 10, max: 100)')
}).describe('List participants for a conference record');

// meet_v2_get_participant_session - Requiere participant_session_name
const participantSessionNameRegex = /^conferenceRecords\/[a-zA-Z0-9_-]+\/participants\/[a-zA-Z0-9_-]+\/participantSessions\/[a-zA-Z0-9_-]+$/;
export const GetParticipantSessionSchema = z.object({
  participant_session_name: z.string()
    .regex(participantSessionNameRegex, 'Participant session name must be in format: conferenceRecords/{record_id}/participants/{participant_id}/participantSessions/{session_id}')
    .describe('Name of the participant session (conferenceRecords/{record_id}/participants/{participant_id}/participantSessions/{session_id})')
}).describe('Get specific participant session details');

// meet_v2_list_participant_sessions - Requiere participant_name, page_size opcional
const participantNameRegex = /^conferenceRecords\/[a-zA-Z0-9_-]+\/participants\/[a-zA-Z0-9_-]+$/;
export const ListParticipantSessionsSchema = z.object({
  participant_name: z.string()
    .regex(participantNameRegex, 'Participant name must be in format: conferenceRecords/{record_id}/participants/{participant_id}')
    .describe('Name of the participant (conferenceRecords/{record_id}/participants/{participant_id})'),
  page_size: z.number()
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size cannot exceed 100')
    .default(10)
    .describe('Maximum number of sessions to return (default: 10, max: 100)')
}).describe('List sessions for a specific participant');

/**
 * TODAS LAS 17 HERRAMIENTAS - Schemas de validación completos
 */
export const ValidationSchemas = {
  // Calendar API v3 Tools (6 herramientas)
  'calendar_v3_list_calendars': ListCalendarsSchema,
  'calendar_v3_list_events': ListEventsSchema,  
  'calendar_v3_get_event': GetEventSchema,
  'calendar_v3_create_event': CreateEventSchema,
  'calendar_v3_update_event': UpdateEventSchema,
  'calendar_v3_delete_event': DeleteEventSchema,
  
  // Meet API v2 Tools (11 herramientas)
  'meet_v2_create_space': CreateSpaceSchema,
  'meet_v2_get_space': GetSpaceSchema,
  'meet_v2_update_space': UpdateSpaceSchema,
  'meet_v2_end_active_conference': EndActiveConferenceSchema,
  'meet_v2_list_conference_records': ListConferenceRecordsSchema,
  'meet_v2_get_conference_record': GetConferenceRecordSchema,
  'meet_v2_list_recordings': ListRecordingsSchema,
  'meet_v2_get_recording': GetRecordingSchema,
  'meet_v2_list_transcripts': ListTranscriptsSchema,
  'meet_v2_get_transcript': GetTranscriptSchema,
  'meet_v2_list_transcript_entries': ListTranscriptEntriesSchema,
  'meet_v2_get_participant': GetParticipantSchema,
  'meet_v2_list_participants': ListParticipantsSchema,
  'meet_v2_get_participant_session': GetParticipantSessionSchema,
  'meet_v2_list_participant_sessions': ListParticipantSessionsSchema
};

/**
 * Helper function to validate tool arguments
 * @param {string} toolName - Name of the MCP tool
 * @param {any} args - Arguments to validate
 * @returns {any} Validated and parsed arguments
 * @throws {Error} Validation error with helpful message
 */
export function validateToolArgs(toolName: string, args: any): any {
  const schema = ValidationSchemas[toolName as keyof typeof ValidationSchemas];
  
  if (!schema) {
    // If no schema exists, return args as-is (backwards compatibility)
    return args;
  }
  
  try {
    return schema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `• ${issue.path.join('.')}: ${issue.message}`
      ).join('\n');
      
      throw new Error(`❌ Validation failed for ${toolName}:\n${issues}\n\n💡 Tip: Check parameter format and required fields`);
    }
    throw error;
  }
}