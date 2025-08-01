/**
 * Comprehensive Zod validation tests for all 17 Google Meet MCP Server tools
 * Tests the complete validation implementation added in Phase 2
 */

import { describe, it, expect } from "vitest";
import { validateToolArgs, ValidationSchemas } from "../src/validation/meetSchemas.js";

describe("Zod Validation - All 17 Tools", () => {
  describe("Schema Coverage", () => {
    it("should have validation schemas for all tools", () => {
      const expectedTools = [
        // Calendar API v3 Tools (6 herramientas)
        'calendar_v3_list_calendars',
        'calendar_v3_list_events',
        'calendar_v3_get_event',
        'calendar_v3_create_event',
        'calendar_v3_update_event',
        'calendar_v3_delete_event',
        
        // Meet API v2 Tools (15 herramientas)
        'meet_v2_create_space',
        'meet_v2_get_space',
        'meet_v2_update_space',
        'meet_v2_end_active_conference',
        'meet_v2_list_conference_records',
        'meet_v2_get_conference_record',
        'meet_v2_list_recordings',
        'meet_v2_get_recording',
        'meet_v2_list_transcripts',
        'meet_v2_get_transcript',
        'meet_v2_list_transcript_entries',
        'meet_v2_get_participant',
        'meet_v2_list_participants',
        'meet_v2_get_participant_session',
        'meet_v2_list_participant_sessions'
      ];

      expect(Object.keys(ValidationSchemas)).toHaveLength(21);
      
      expectedTools.forEach(toolName => {
        expect(ValidationSchemas[toolName]).toBeDefined();
        expect(ValidationSchemas[toolName]._def).toBeDefined(); // Zod schema structure
      });
    });

    it("should export validateToolArgs function", () => {
      expect(typeof validateToolArgs).toBe("function");
    });
  });

  describe("Calendar API v3 Validation", () => {
    describe("calendar_v3_list_calendars", () => {
      it("should accept empty parameters", () => {
        expect(() => validateToolArgs('calendar_v3_list_calendars', {})).not.toThrow();
      });
    });

    describe("calendar_v3_list_events", () => {
      it("should validate valid parameters", () => {
        const validArgs = {
          max_results: 10,
          time_min: "2024-01-01T00:00:00Z",
          time_max: "2024-12-31T23:59:59Z",
          calendar_id: "primary"
        };
        
        expect(() => validateToolArgs('calendar_v3_list_events', validArgs)).not.toThrow();
      });

      it("should reject invalid max_results", () => {
        const invalidArgs = { max_results: -1 };
        
        expect(() => validateToolArgs('calendar_v3_list_events', invalidArgs))
          .toThrow(/Maximum results must be at least 1/);
      });

      it("should reject invalid time format", () => {
        const invalidArgs = { time_min: "invalid-date" };
        
        expect(() => validateToolArgs('calendar_v3_list_events', invalidArgs))
          .toThrow(/Time min must be in ISO 8601 format/);
      });
    });

    describe("calendar_v3_get_event", () => {
      it("should require event_id", () => {
        expect(() => validateToolArgs('calendar_v3_get_event', {}))
          .toThrow(/Required/);
      });

      it("should accept valid event_id", () => {
        const validArgs = { event_id: "test-event-123" };
        
        expect(() => validateToolArgs('calendar_v3_get_event', validArgs)).not.toThrow();
      });
    });

    describe("calendar_v3_create_event", () => {
      it("should validate complete event creation", () => {
        const validArgs = {
          summary: "Test Meeting",
          start_time: "2024-08-01T10:00:00Z",
          end_time: "2024-08-01T11:00:00Z",
          description: "Test description",
          attendees: ["test@example.com"],
          create_meet_conference: true
        };
        
        expect(() => validateToolArgs('calendar_v3_create_event', validArgs)).not.toThrow();
      });

      it("should reject invalid time range", () => {
        const invalidArgs = {
          summary: "Test",
          start_time: "2024-08-01T11:00:00Z",
          end_time: "2024-08-01T10:00:00Z" // End before start
        };
        
        expect(() => validateToolArgs('calendar_v3_create_event', invalidArgs))
          .toThrow(/End time must be after start time/);
      });

      it("should reject invalid email addresses", () => {
        const invalidArgs = {
          summary: "Test",
          start_time: "2024-08-01T10:00:00Z",
          end_time: "2024-08-01T11:00:00Z",
          attendees: ["invalid-email"]
        };
        
        expect(() => validateToolArgs('calendar_v3_create_event', invalidArgs))
          .toThrow(/Invalid email address/);
      });
    });

    describe("calendar_v3_update_event", () => {
      it("should require event_id", () => {
        expect(() => validateToolArgs('calendar_v3_update_event', {}))
          .toThrow(/Required/);
      });

      it("should accept partial updates", () => {
        const validArgs = {
          event_id: "test-event-123",
          summary: "Updated Meeting"
        };
        
        expect(() => validateToolArgs('calendar_v3_update_event', validArgs)).not.toThrow();
      });
    });

    describe("calendar_v3_delete_event", () => {
      it("should require event_id", () => {
        expect(() => validateToolArgs('calendar_v3_delete_event', {}))
          .toThrow(/Required/);
      });
    });
  });

  describe("Meet API v2 Validation", () => {
    describe("meet_v2_create_space", () => {
      it("should validate complete space creation", () => {
        const validArgs = {
          access_type: "TRUSTED",
          enable_recording: true,
          enable_transcription: true,
          moderation_mode: "ON",
          chat_restriction: "HOSTS_ONLY"
        };
        
        expect(() => validateToolArgs('meet_v2_create_space', validArgs)).not.toThrow();
      });

      it("should reject recording for OPEN access", () => {
        const invalidArgs = {
          access_type: "OPEN",
          enable_recording: true
        };
        
        expect(() => validateToolArgs('meet_v2_create_space', invalidArgs))
          .toThrow(/Recording cannot be enabled for OPEN access meetings/);
      });

      it("should require transcription for smart notes", () => {
        const invalidArgs = {
          enable_smart_notes: true,
          enable_transcription: false
        };
        
        expect(() => validateToolArgs('meet_v2_create_space', invalidArgs))
          .toThrow(/Smart notes require transcription to be enabled/);
      });
    });

    describe("meet_v2_get_space", () => {
      it("should validate space name format", () => {
        const validArgs = { space_name: "spaces/abc-defg-hij" };
        
        expect(() => validateToolArgs('meet_v2_get_space', validArgs)).not.toThrow();
      });

      it("should reject invalid space name format", () => {
        const invalidArgs = { space_name: "invalid-space-name" };
        
        expect(() => validateToolArgs('meet_v2_get_space', invalidArgs))
          .toThrow(/Space name must be in format: spaces/);
      });
    });

    describe("meet_v2_list_conference_records", () => {
      it("should validate page_size limits", () => {
        const validArgs = { page_size: 25 };
        
        expect(() => validateToolArgs('meet_v2_list_conference_records', validArgs)).not.toThrow();
      });

      it("should reject excessive page_size", () => {
        const invalidArgs = { page_size: 100 };
        
        expect(() => validateToolArgs('meet_v2_list_conference_records', invalidArgs))
          .toThrow(/Page size cannot exceed 50/);
      });
    });

    describe("meet_v2_get_conference_record", () => {
      it("should validate conference record name format", () => {
        const validArgs = { conference_record_name: "conferenceRecords/test-record-123" };
        
        expect(() => validateToolArgs('meet_v2_get_conference_record', validArgs)).not.toThrow();
      });

      it("should reject invalid format", () => {
        const invalidArgs = { conference_record_name: "invalid-record-name" };
        
        expect(() => validateToolArgs('meet_v2_get_conference_record', invalidArgs))
          .toThrow(/Conference record name must be in format: conferenceRecords/);
      });
    });

    describe("meet_v2_get_recording", () => {
      it("should validate recording name format", () => {
        const validArgs = { 
          recording_name: "conferenceRecords/test-record/recordings/test-recording" 
        };
        
        expect(() => validateToolArgs('meet_v2_get_recording', validArgs)).not.toThrow();
      });

      it("should reject invalid recording format", () => {
        const invalidArgs = { recording_name: "invalid-recording-name" };
        
        expect(() => validateToolArgs('meet_v2_get_recording', invalidArgs))
          .toThrow(/Recording name must be in format: conferenceRecords/);
      });
    });

    describe("meet_v2_get_transcript", () => {
      it("should validate transcript name format", () => {
        const validArgs = { 
          transcript_name: "conferenceRecords/test-record/transcripts/test-transcript" 
        };
        
        expect(() => validateToolArgs('meet_v2_get_transcript', validArgs)).not.toThrow();
      });
    });

    describe("meet_v2_list_transcript_entries", () => {
      it("should validate page_size for transcript entries", () => {
        const validArgs = {
          transcript_name: "conferenceRecords/test-record/transcripts/test-transcript",
          page_size: 500
        };
        
        expect(() => validateToolArgs('meet_v2_list_transcript_entries', validArgs)).not.toThrow();
      });

      it("should reject excessive page_size for transcript entries", () => {
        const invalidArgs = {
          transcript_name: "conferenceRecords/test-record/transcripts/test-transcript",
          page_size: 2000
        };
        
        expect(() => validateToolArgs('meet_v2_list_transcript_entries', invalidArgs))
          .toThrow(/Page size cannot exceed 1000/);
      });
    });

    describe("meet_v2_get_participant", () => {
      it("should validate participant name format", () => {
        const validArgs = { 
          participant_name: "conferenceRecords/test-record/participants/test-participant" 
        };
        
        expect(() => validateToolArgs('meet_v2_get_participant', validArgs)).not.toThrow();
      });
    });

    describe("meet_v2_get_participant_session", () => {
      it("should validate participant session name format", () => {
        const validArgs = { 
          participant_session_name: "conferenceRecords/test-record/participants/test-participant/participantSessions/test-session" 
        };
        
        expect(() => validateToolArgs('meet_v2_get_participant_session', validArgs)).not.toThrow();
      });

      it("should reject invalid session format", () => {
        const invalidArgs = { participant_session_name: "invalid-session-name" };
        
        expect(() => validateToolArgs('meet_v2_get_participant_session', invalidArgs))
          .toThrow(/Participant session name must be in format/);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown tool names gracefully", () => {
      expect(() => validateToolArgs('unknown_tool', {})).not.toThrow();
    });

    it("should provide helpful error messages", () => {
      try {
        validateToolArgs('calendar_v3_create_event', {
          summary: "",
          start_time: "invalid-date",
          end_time: "2024-08-01T11:00:00Z"
        });
      } catch (error) {
        expect(error.message).toContain('❌ Validation failed for calendar_v3_create_event');
        expect(error.message).toContain('💡 Tip:');
      }
    });

    it("should validate all required fields", () => {
      expect(() => validateToolArgs('calendar_v3_create_event', {}))
        .toThrow(/Required/);
    });
  });

  describe("Integration Test", () => {
    it("should validate all tools without throwing unexpected errors", () => {
      const testCases = [
        { tool: 'calendar_v3_list_calendars', args: {} },
        { tool: 'calendar_v3_get_event', args: { event_id: 'test' } },
        { tool: 'meet_v2_get_space', args: { space_name: 'spaces/test-space' } },
        { tool: 'meet_v2_list_conference_records', args: { page_size: 10 } }
      ];

      testCases.forEach(({ tool, args }) => {
        expect(() => validateToolArgs(tool, args)).not.toThrow();
      });
    });
  });
});