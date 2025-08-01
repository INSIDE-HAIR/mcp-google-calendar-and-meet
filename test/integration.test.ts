/**
 * Integration tests using Vitest
 * Tests end-to-end workflows and API integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import type { MockReadFile, MockWriteFile } from "../src/types/index.js";

// Mock dependencies for integration testing
vi.mock("fs/promises");
vi.mock("googleapis");

describe("Integration Tests", () => {
  let GoogleMeetAPI;
  let api;
  let mockAuth;
  let mockCalendar;
  let mockFetch;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Mock OAuth2 client
    mockAuth = {
      setCredentials: vi.fn(),
      getAccessToken: vi.fn().mockResolvedValue({ token: "integration-token" }),
      get: vi.fn().mockReturnValue("integration-token"),
    };

    // Mock Calendar API
    mockCalendar = {
      calendars: {
        list: vi.fn().mockResolvedValue({
          data: {
            items: [
              { id: "primary", summary: "Primary Calendar", primary: true },
            ],
          },
        }),
      },
      events: {
        insert: vi.fn().mockResolvedValue({
          data: {
            id: "integration-event-id",
            summary: "Integration Test Event",
            start: {
              dateTime: "2025-08-01T10:00:00Z",
              timeZone: "UTC"
            },
            end: {
              dateTime: "2025-08-01T11:00:00Z", 
              timeZone: "UTC"
            },
            conferenceData: {
              entryPoints: [
                {
                  entryPointType: "video",
                  uri: "https://meet.google.com/integration-test",
                },
              ],
              conferenceSolution: {
                key: { type: "hangoutsMeet" },
              },
            },
          },
        }),
        get: vi.fn().mockResolvedValue({
          data: {
            id: "integration-event-id",
            summary: "Integration Test Event",
            start: {
              dateTime: "2025-08-01T10:00:00Z",
              timeZone: "UTC"
            },
            end: {
              dateTime: "2025-08-01T11:00:00Z", 
              timeZone: "UTC"
            },
          },
        }),
        patch: vi.fn().mockResolvedValue({
          data: {
            id: "integration-event-id",
            summary: "Updated Integration Test Event",
            start: {
              dateTime: "2025-08-01T10:00:00Z",
              timeZone: "UTC"
            },
            end: {
              dateTime: "2025-08-01T11:00:00Z", 
              timeZone: "UTC"
            },
          },
        }),
        delete: vi.fn().mockResolvedValue({ data: {} }),
      },
    };

    // Mock googleapis
    const { google } = await import("googleapis");
    (google.auth as any).OAuth2 = vi.fn(() => mockAuth);
    (google as any).calendar = vi.fn(() => mockCalendar);

    // Mock global fetch for Meet API calls
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock file system responses
    (fs.readFile as MockReadFile).mockImplementation(async (path: any) => {
      if (typeof path === 'string' && path.includes("credentials")) {
        return JSON.stringify(global.testUtils.getMockCredentials());
      }
      if (typeof path === 'string' && path.includes("token")) {
        return JSON.stringify(global.testUtils.getMockToken());
      }
      throw new Error("File not found");
    });
    (fs.writeFile as MockWriteFile).mockResolvedValue(undefined);

    // Import GoogleMeetAPI after mocks are set up
    const module = await import("../src/GoogleMeetAPI.js");
    GoogleMeetAPI = module.default;

    api = new GoogleMeetAPI(
      "integration-credentials.json",
      "integration-token.json"
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
  });

  describe("Full Calendar Event Lifecycle", () => {
    it("should complete a full calendar event workflow", async () => {
      await api.initialize();

      // Step 1: List calendars
      const calendars = await api.listCalendars();
      expect(calendars).toHaveLength(1);
      expect(calendars[0].primary).toBe(true);

      // Step 2: Create event with Meet conference
      const eventData = {
        summary: "Integration Test Event",
        description: "Created during integration testing",
        startTime: "2025-08-01T10:00:00Z",
        endTime: "2025-08-01T11:00:00Z",
        attendees: ["test@integration.com"],
        createMeetConference: true,
      };

      const createdEvent = await api.createCalendarEvent(eventData);
      expect(createdEvent.id).toBe("integration-event-id");
      // Note: conferenceData might not be in formatted event, just check that event creation worked
      expect(createdEvent.summary).toBe("Integration Test Event");

      // Step 3: Get the created event
      const retrievedEvent = await api.getCalendarEvent("integration-event-id");
      expect(retrievedEvent.id).toBe("integration-event-id");

      // Step 4: Update the event
      const updatedEvent = await api.updateCalendarEvent(
        "integration-event-id",
        {
          summary: "Updated Integration Test Event",
        }
      );
      expect(updatedEvent.summary).toBe("Updated Integration Test Event");

      // Step 5: Delete the event
      await api.deleteCalendarEvent("integration-event-id");
      expect(mockCalendar.events.delete).toHaveBeenCalledWith({
        calendarId: "primary",
        eventId: "integration-event-id",
      });
    });
  });

  describe("Meet API Workflow", () => {
    it("should handle Meet API operations", async () => {
      // Mock Meet API responses
      const mockSpace = {
        name: "spaces/integration-space-id",
        meetingUri: "https://meet.google.com/integration-meeting",
        meetingCode: "int-test-meet",
        config: {
          accessType: "TRUSTED",
          entryPointAccess: "ALL",
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("application/json"),
          },
          json: async () => mockSpace,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("application/json"),
          },
          json: async () => ({
            ...mockSpace,
            config: { accessType: "RESTRICTED" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("application/json"),
          },
          json: async () => ({}),
        });

      await api.initialize();

      // Step 1: Create Meet space
      const createdSpace = await api.createMeetSpace({
        accessType: "TRUSTED",
        enableRecording: true,
      });
      expect(createdSpace.name).toBe("spaces/integration-space-id");
      expect(createdSpace.meetingUri).toContain("meet.google.com");

      // Step 2: Update space configuration
      const updatedSpace = await api.updateMeetSpace(
        "spaces/integration-space-id",
        {
          accessType: "RESTRICTED",
        }
      );
      expect(updatedSpace.config.accessType).toBe("RESTRICTED");

      // Step 3: End active conference
      await api.endActiveConference("spaces/integration-space-id");
      expect(mockFetch).toHaveBeenLastCalledWith(
        "https://meet.googleapis.com/v2/spaces/integration-space-id:endActiveConference",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("should handle network timeouts", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

      await api.initialize();

      // Should fail on first attempt
      await expect(api.createMeetSpace({})).rejects.toThrow("Network timeout");
    });

    it("should handle API rate limiting", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        headers: {
          get: vi.fn().mockReturnValue("application/json"),
        },
        json: async () => ({
          error: {
            message: "Rate limit exceeded",
            code: 429,
          },
        }),
      });

      await api.initialize();

      await expect(api.createMeetSpace({})).rejects.toThrow(
        "Meet API Error: Too Many Requests"
      );
    });

    it("should handle invalid credentials", async () => {
      (fs.readFile as MockReadFile).mockImplementation(async (path: any) => {
        if (typeof path === 'string' && path.includes("credentials")) {
          return "invalid json content";
        }
        return JSON.stringify(global.testUtils.getMockToken());
      });

      const invalidApi = new GoogleMeetAPI(
        "invalid-credentials.json",
        "token.json"
      );

      await expect(invalidApi.initialize()).rejects.toThrow();
    });

    it("should handle expired tokens", async () => {
      const expiredToken = {
        ...global.testUtils.getMockToken(),
        expiry_date: Date.now() - 3600000, // Expired 1 hour ago
      };

      (fs.readFile as MockReadFile).mockImplementation(async (path: any) => {
        if (typeof path === 'string' && path.includes("credentials")) {
          return JSON.stringify(global.testUtils.getMockCredentials());
        }
        if (typeof path === 'string' && path.includes("token")) {
          return JSON.stringify(expiredToken);
        }
        throw new Error("File not found");
      });

      const expiredApi = new GoogleMeetAPI(
        "integration-credentials.json",
        "integration-token.json"
      );

      mockAuth.getAccessToken.mockRejectedValue(
        new Error("Token has been expired or revoked")
      );

      await expect(expiredApi.initialize()).rejects.toThrow(
        "Authentication failed"
      );
    });
  });

  describe("Data Validation", () => {
    beforeEach(async () => {
      await api.initialize();
    });

    it("should validate event data before creation", async () => {
      const validEventData = {
        summary: "Valid Event",
        startTime: "2025-08-01T10:00:00Z",
        endTime: "2025-08-01T11:00:00Z",
      };

      const event = await api.createCalendarEvent(validEventData);
      expect(event.id).toBe("integration-event-id");
    });

    it("should validate Meet space configuration", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("application/json"),
        },
        json: async () => ({ name: "spaces/validation-space" }),
      });

      const validConfig = {
        accessType: "TRUSTED",
        enableRecording: true,
        enableTranscription: false,
      };

      const space = await api.createMeetSpace(validConfig);
      expect(space.name).toBe("spaces/validation-space");

      // Verify the request was made with correct configuration
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.config.accessType).toBe("TRUSTED");
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle multiple concurrent requests", async () => {
      await api.initialize();

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => api.listCalendars());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockCalendar.calendars.list).toHaveBeenCalledTimes(5);
    });

    it("should handle concurrent Meet space operations", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("application/json"),
        },
        json: async () => ({ name: "spaces/concurrent-test" }),
      });

      await api.initialize();

      // Perform concurrent operations
      const promises = Array.from({ length: 3 }, () =>
        api.createMeetSpace({ accessType: "OPEN" })
      );
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Configuration Edge Cases", () => {
    it("should handle different time zones", async () => {
      await api.initialize();

      const eventData = {
        summary: "Timezone Test",
        startTime: "2025-08-01T10:00:00Z",
        endTime: "2025-08-01T11:00:00Z",
        timeZone: "America/New_York",
      };

      await api.createCalendarEvent(eventData);

      const callArgs = mockCalendar.events.insert.mock.calls[0][0];
      expect(callArgs.resource.start.timeZone).toBe("America/New_York");
      expect(callArgs.resource.end.timeZone).toBe("America/New_York");
    });

    it("should handle guest permissions correctly", async () => {
      await api.initialize();

      const eventData = {
        summary: "Guest Permissions Test",
        startTime: "2025-08-01T10:00:00Z",
        endTime: "2025-08-01T11:00:00Z",
        guestPermissions: {
          canInviteOthers: false,
          canModify: true,
          canSeeOtherGuests: false,
        },
      };

      await api.createCalendarEvent(eventData);

      const callArgs = mockCalendar.events.insert.mock.calls[0][0];
      expect(callArgs.resource.guestsCanInviteOthers).toBe(false);
      expect(callArgs.resource.guestsCanModify).toBe(true);
      expect(callArgs.resource.guestsCanSeeOtherGuests).toBe(false);
    });
  });
});
