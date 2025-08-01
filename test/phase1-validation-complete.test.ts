/**
 * FASE 1 COMPLETADA: Tests para verificar que todas las 17 herramientas tienen validación Zod
 * Este test verifica que la Fase 1 de expansión de validación se completó exitosamente
 */

import { describe, it, expect } from 'vitest';
import { ValidationSchemas, validateToolArgs } from '../src/validation/meetSchemas.js';

describe('FASE 1: Validación Zod Completa - 17/17 Herramientas', () => {
  
  // Lista completa de las 21 herramientas del servidor
  const ALL_TOOLS = [
    // Calendar API v3 (6 herramientas)
    'calendar_v3_list_calendars',
    'calendar_v3_list_events',
    'calendar_v3_get_event',
    'calendar_v3_create_event',
    'calendar_v3_update_event',
    'calendar_v3_delete_event',
    
    // Meet API v2 (15 herramientas)
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

  describe('Schema Coverage Verification', () => {
    it('should have schemas for all 21 tools', () => {
      expect(ALL_TOOLS).toHaveLength(21);
      
      const schemasKeys = Object.keys(ValidationSchemas);
      expect(schemasKeys).toHaveLength(21);
      
      // Verificar que cada herramienta tiene su schema
      ALL_TOOLS.forEach(toolName => {
        expect(ValidationSchemas).toHaveProperty(toolName);
        expect(ValidationSchemas[toolName as keyof typeof ValidationSchemas]).toBeDefined();
      });
    });

    it('should not have extra schemas beyond the 17 tools', () => {
      const schemasKeys = Object.keys(ValidationSchemas);
      const extraSchemas = schemasKeys.filter(key => !ALL_TOOLS.includes(key));
      
      expect(extraSchemas).toHaveLength(0);
    });
  });

  describe('Calendar API v3 Validation (6 herramientas)', () => {
    it('calendar_v3_list_calendars - should validate empty args', () => {
      expect(() => validateToolArgs('calendar_v3_list_calendars', {})).not.toThrow();
    });

    it('calendar_v3_list_events - should validate with defaults', () => {
      const result = validateToolArgs('calendar_v3_list_events', {});
      expect(result.max_results).toBe(10);
      expect(result.calendar_id).toBe('primary');
    });

    it('calendar_v3_list_events - should validate custom parameters', () => {
      const args = {
        max_results: 25,
        time_min: '2024-01-01T00:00:00Z',
        time_max: '2024-12-31T23:59:59Z',
        calendar_id: 'custom@example.com'
      };
      
      const result = validateToolArgs('calendar_v3_list_events', args);
      expect(result.max_results).toBe(25);
      expect(result.time_min).toBe('2024-01-01T00:00:00Z');
    });

    it('calendar_v3_list_events - should reject invalid max_results', () => {
      expect(() => validateToolArgs('calendar_v3_list_events', { max_results: 0 }))
        .toThrow('Maximum results must be at least 1');
      
      expect(() => validateToolArgs('calendar_v3_list_events', { max_results: 3000 }))
        .toThrow('Maximum results cannot exceed 2500');
    });

    it('calendar_v3_get_event - should require event_id', () => {
      expect(() => validateToolArgs('calendar_v3_get_event', {}))
        .toThrow('Required');
      
      const result = validateToolArgs('calendar_v3_get_event', { event_id: 'test-event-123' });
      expect(result.event_id).toBe('test-event-123');
    });

    it('calendar_v3_create_event - should validate complete event', () => {
      const eventData = {
        summary: 'Test Meeting',
        start_time: '2024-12-01T10:00:00Z',
        end_time: '2024-12-01T11:00:00Z',
        description: 'Test description',
        attendees: ['user@example.com', 'guest@example.com'],
        create_meet_conference: true,
        guest_can_invite_others: false
      };
      
      const result = validateToolArgs('calendar_v3_create_event', eventData);
      expect(result.summary).toBe('Test Meeting');
      expect(result.create_meet_conference).toBe(true);
      expect(result.guest_can_invite_others).toBe(false);
      expect(result.time_zone).toBe('UTC'); // default
    });

    it('calendar_v3_create_event - should reject invalid times', () => {
      const eventData = {
        summary: 'Test Meeting',
        start_time: '2024-12-01T11:00:00Z',  // End before start
        end_time: '2024-12-01T10:00:00Z',
      };
      
      expect(() => validateToolArgs('calendar_v3_create_event', eventData))
        .toThrow('End time must be after start time');
    });

    it('calendar_v3_update_event - should require event_id and validate optional fields', () => {
      expect(() => validateToolArgs('calendar_v3_update_event', {}))
        .toThrow('Required');
      
      const updateData = {
        event_id: 'event-123',
        summary: 'Updated Meeting',
        start_time: '2024-12-01T10:00:00Z',
        end_time: '2024-12-01T11:00:00Z'
      };
      
      const result = validateToolArgs('calendar_v3_update_event', updateData);
      expect(result.event_id).toBe('event-123');
      expect(result.summary).toBe('Updated Meeting');
    });

    it('calendar_v3_delete_event - should require event_id', () => {
      expect(() => validateToolArgs('calendar_v3_delete_event', {}))
        .toThrow('Required');
      
      const result = validateToolArgs('calendar_v3_delete_event', { event_id: 'delete-me-123' });
      expect(result.event_id).toBe('delete-me-123');
    });
  });

  describe('Meet API v2 Core Validation (5 herramientas principales)', () => {
    it('meet_v2_create_space - should validate with defaults', () => {
      const result = validateToolArgs('meet_v2_create_space', {});
      expect(result.access_type).toBe('TRUSTED');
      expect(result.enable_recording).toBe(false);
      expect(result.enable_transcription).toBe(false);
      expect(result.moderation_mode).toBe('OFF');
    });

    it('meet_v2_create_space - should validate custom configuration', () => {
      const config = {
        access_type: 'RESTRICTED',
        enable_recording: true,
        enable_transcription: true,
        enable_smart_notes: true,
        moderation_mode: 'ON',
        chat_restriction: 'HOSTS_ONLY',
        present_restriction: 'HOSTS_ONLY',
        default_join_as_viewer: true
      };
      
      const result = validateToolArgs('meet_v2_create_space', config);
      expect(result.access_type).toBe('RESTRICTED');
      expect(result.enable_recording).toBe(true);
      expect(result.enable_smart_notes).toBe(true);
    });

    it('meet_v2_create_space - should enforce business logic rules', () => {
      // Recording + OPEN access should fail
      expect(() => validateToolArgs('meet_v2_create_space', {
        access_type: 'OPEN',
        enable_recording: true
      })).toThrow('Recording cannot be enabled for OPEN access meetings');
      
      // Smart notes without transcription should fail
      expect(() => validateToolArgs('meet_v2_create_space', {
        enable_smart_notes: true,
        enable_transcription: false
      })).toThrow('Smart notes require transcription to be enabled');
    });

    it('meet_v2_get_space - should validate space name format', () => {
      expect(() => validateToolArgs('meet_v2_get_space', {}))
        .toThrow('Required');
      
      expect(() => validateToolArgs('meet_v2_get_space', { space_name: 'invalid-format' }))
        .toThrow('Space name must be in format');
      
      const result = validateToolArgs('meet_v2_get_space', { space_name: 'spaces/abc-defg-hij' });
      expect(result.space_name).toBe('spaces/abc-defg-hij');
    });

    it('meet_v2_update_space - should validate space name and optional updates', () => {
      const updateData = {
        space_name: 'spaces/meeting-123',
        access_type: 'RESTRICTED',
        moderation_mode: 'ON'
      };
      
      const result = validateToolArgs('meet_v2_update_space', updateData);
      expect(result.space_name).toBe('spaces/meeting-123');
      expect(result.access_type).toBe('RESTRICTED');
    });

    it('meet_v2_list_conference_records - should validate page_size limits', () => {
      const result = validateToolArgs('meet_v2_list_conference_records', {});
      expect(result.page_size).toBe(10); // default
      
      expect(() => validateToolArgs('meet_v2_list_conference_records', { page_size: 0 }))
        .toThrow('Page size must be at least 1');
      
      expect(() => validateToolArgs('meet_v2_list_conference_records', { page_size: 100 }))
        .toThrow('Page size cannot exceed 50');
    });
  });

  describe('Meet API v2 Advanced Validation (6 herramientas restantes)', () => {
    it('meet_v2_end_active_conference - should validate space name', () => {
      const result = validateToolArgs('meet_v2_end_active_conference', { 
        space_name: 'spaces/end-this-meeting' 
      });
      expect(result.space_name).toBe('spaces/end-this-meeting');
    });

    it('meet_v2_get_conference_record - should validate conference record name format', () => {
      expect(() => validateToolArgs('meet_v2_get_conference_record', { 
        conference_record_name: 'invalid-format' 
      })).toThrow('Conference record name must be in format');
      
      const result = validateToolArgs('meet_v2_get_conference_record', { 
        conference_record_name: 'conferenceRecords/record-123' 
      });
      expect(result.conference_record_name).toBe('conferenceRecords/record-123');
    });

    it('meet_v2_list_recordings - should validate conference record name', () => {
      const result = validateToolArgs('meet_v2_list_recordings', { 
        conference_record_name: 'conferenceRecords/with-recordings' 
      });
      expect(result.conference_record_name).toBe('conferenceRecords/with-recordings');
    });

    it('meet_v2_get_recording - should validate recording name format', () => {
      expect(() => validateToolArgs('meet_v2_get_recording', { 
        recording_name: 'conferenceRecords/incomplete' 
      })).toThrow('Recording name must be in format');
      
      const result = validateToolArgs('meet_v2_get_recording', { 
        recording_name: 'conferenceRecords/record-123/recordings/rec-456' 
      });
      expect(result.recording_name).toBe('conferenceRecords/record-123/recordings/rec-456');
    });

    it('meet_v2_list_transcripts - should validate conference record name', () => {
      const result = validateToolArgs('meet_v2_list_transcripts', { 
        conference_record_name: 'conferenceRecords/with-transcripts' 
      });
      expect(result.conference_record_name).toBe('conferenceRecords/with-transcripts');
    });

    it('meet_v2_get_transcript - should validate transcript name format', () => {
      const result = validateToolArgs('meet_v2_get_transcript', { 
        transcript_name: 'conferenceRecords/record-123/transcripts/trans-456' 
      });
      expect(result.transcript_name).toBe('conferenceRecords/record-123/transcripts/trans-456');
    });
  });

  describe('Meet API v2 Participant Management (5 herramientas)', () => {
    it('meet_v2_list_transcript_entries - should validate transcript name and page_size', () => {
      const result = validateToolArgs('meet_v2_list_transcript_entries', { 
        transcript_name: 'conferenceRecords/rec-123/transcripts/trans-456' 
      });
      expect(result.page_size).toBe(100); // default
      
      expect(() => validateToolArgs('meet_v2_list_transcript_entries', { 
        transcript_name: 'conferenceRecords/rec-123/transcripts/trans-456',
        page_size: 1500 
      })).toThrow('Page size cannot exceed 1000');
    });

    it('meet_v2_get_participant - should validate participant name format', () => {
      const result = validateToolArgs('meet_v2_get_participant', { 
        participant_name: 'conferenceRecords/rec-123/participants/part-456' 
      });
      expect(result.participant_name).toBe('conferenceRecords/rec-123/participants/part-456');
    });

    it('meet_v2_list_participants - should validate conference record and page_size', () => {
      const result = validateToolArgs('meet_v2_list_participants', { 
        conference_record_name: 'conferenceRecords/with-participants' 
      });
      expect(result.page_size).toBe(10); // default
      
      expect(() => validateToolArgs('meet_v2_list_participants', { 
        conference_record_name: 'conferenceRecords/with-participants',
        page_size: 150 
      })).toThrow('Page size cannot exceed 100');
    });

    it('meet_v2_get_participant_session - should validate session name format', () => {
      const sessionName = 'conferenceRecords/rec-123/participants/part-456/participantSessions/sess-789';
      const result = validateToolArgs('meet_v2_get_participant_session', { 
        participant_session_name: sessionName 
      });
      expect(result.participant_session_name).toBe(sessionName);
    });

    it('meet_v2_list_participant_sessions - should validate participant name and page_size', () => {
      const result = validateToolArgs('meet_v2_list_participant_sessions', { 
        participant_name: 'conferenceRecords/rec-123/participants/part-456' 
      });
      expect(result.page_size).toBe(10); // default
    });
  });

  describe('Error Handling Verification', () => {
    it('should provide helpful error messages for validation failures', () => {
      try {
        validateToolArgs('calendar_v3_create_event', {
          summary: '', // Empty title
          start_time: 'invalid-date',
          end_time: 'also-invalid'
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('❌ Validation failed for calendar_v3_create_event');
        expect(error.message).toContain('Meeting title is required');
        expect(error.message).toContain('Start time must be in ISO 8601 format');
        expect(error.message).toContain('💡 Tip: Check parameter format and required fields');
      }
    });

    it('should handle unknown tool names gracefully', () => {
      const result = validateToolArgs('unknown_tool', { any: 'data' });
      expect(result).toEqual({ any: 'data' }); // Should return as-is for unknown tools
    });
  });

  describe('FASE 1 Success Metrics', () => {
    it('should achieve 100% validation coverage', () => {
      const totalTools = ALL_TOOLS.length;
      const validatedTools = Object.keys(ValidationSchemas).length;
      const coveragePercentage = (validatedTools / totalTools) * 100;
      
      expect(coveragePercentage).toBe(100);
      expect(validatedTools).toBe(21);
    });

    it('should maintain backwards compatibility', () => {
      // All existing tools should still work with validateToolArgs
      const sampleValidations = [
        ['calendar_v3_list_calendars', {}],
        ['calendar_v3_create_event', {
          summary: 'Test',
          start_time: '2024-12-01T10:00:00Z',
          end_time: '2024-12-01T11:00:00Z'
        }],
        ['meet_v2_create_space', {}],
        ['meet_v2_get_space', { space_name: 'spaces/test-123' }]
      ];
      
      sampleValidations.forEach(([toolName, args]) => {
        expect(() => validateToolArgs(toolName as string, args)).not.toThrow();
      });
    });
  });
});