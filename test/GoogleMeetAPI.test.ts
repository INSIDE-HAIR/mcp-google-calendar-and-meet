/**
 * Unit tests for GoogleMeetAPI using Vitest
 * Tests core functionality with proper mocking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import type { MockReadFile, MockWriteFile, MockFetch, MockError } from "../src/types/index.js";

// Mock fs before importing GoogleMeetAPI
vi.mock("fs/promises");
vi.mock("googleapis");
vi.mock("open");

describe("GoogleMeetAPI", () => {
  let GoogleMeetAPI;
  let mockAuth;
  let mockCalendar;
  let api;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Mock OAuth2 client
    mockAuth = {
      setCredentials: vi.fn(),
      getAccessToken: vi.fn().mockResolvedValue({ token: "mock-token" }),
      generateAuthUrl: vi.fn().mockReturnValue("http://mock-auth-url"),
      getToken: vi.fn().mockResolvedValue({
        tokens: {
          access_token: "mock-token",
          refresh_token: "mock-refresh",
        },
      }),
      get: vi.fn().mockReturnValue("mock-token"),
    };

    // Mock Calendar API
    mockCalendar = {
      calendars: {
        list: vi.fn().mockResolvedValue({
          data: {
            items: [
              { id: "primary", summary: "Primary Calendar", primary: true },
              { id: "secondary", summary: "Secondary Calendar" },
            ],
          },
        }),
      },
      events: {
        list: vi.fn().mockResolvedValue({
          data: { items: [global.testUtils.getMockCalendarEvent()] },
        }),
        get: vi.fn().mockResolvedValue({
          data: global.testUtils.getMockCalendarEvent(),
        }),
        insert: vi.fn().mockResolvedValue({
          data: {
            ...global.testUtils.getMockCalendarEvent(),
            id: "new-event-id",
          },
        }),
        patch: vi.fn().mockResolvedValue({
          data: {
            ...global.testUtils.getMockCalendarEvent(),
            summary: "Updated Event",
          },
        }),
        delete: vi.fn().mockResolvedValue({ data: {} }),
      },
    };

    // Mock googleapis
    const { google } = await import("googleapis");
    (google.auth as any).OAuth2 = vi.fn(() => mockAuth);
    (google as any).calendar = vi.fn(() => mockCalendar);

    // Mock global fetch for Meet API
    global.fetch = vi.fn();

    // Mock fs operations
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

    api = new GoogleMeetAPI("mock-credentials.json", "mock-token.json");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
  });

  describe("Constructor", () => {
    it("should initialize with credentials and token paths", () => {
      expect(api.credentialsPath).toBe("mock-credentials.json");
      expect(api.tokenPath).toBe("mock-token.json");
      expect(api.auth).toBeNull();
      expect(api.calendar).toBeNull();
    });

    it("should handle different parameter types", () => {
      const api1 = new GoogleMeetAPI("", "");
      expect(api1.credentialsPath).toBe("");
      expect(api1.tokenPath).toBe("");

      const api2 = new GoogleMeetAPI(null, null);
      expect(api2.credentialsPath).toBeNull();
      expect(api2.tokenPath).toBeNull();
    });
  });

  describe("initialize()", () => {
    it("should initialize successfully with valid credentials and token", async () => {
      await api.initialize();

      expect(fs.readFile).toHaveBeenCalledWith("mock-credentials.json", "utf8");
      expect(fs.readFile).toHaveBeenCalledWith("mock-token.json", "utf8");
      expect(mockAuth.setCredentials).toHaveBeenCalled();
      expect(api.auth).toBeTruthy();
      expect(api.calendar).toBeTruthy();
    });

    it("should throw error if credentials file not found", async () => {
      (fs.readFile as MockReadFile).mockImplementation(async (path: any) => {
        if (typeof path === 'string' && path.includes("credentials")) {
          const error = new Error("ENOENT: no such file or directory") as MockError;
          error.code = "ENOENT";
          throw error;
        }
        return JSON.stringify(global.testUtils.getMockToken());
      });

      await expect(api.initialize()).rejects.toThrow();
    });

    it("should handle invalid JSON in credentials file", async () => {
      (fs.readFile as MockReadFile).mockImplementation(async (path: any) => {
        if (typeof path === 'string' && path.includes("credentials")) {
          return "invalid json content";
        }
        return JSON.stringify(global.testUtils.getMockToken());
      });

      await expect(api.initialize()).rejects.toThrow();
    });

    it("should handle missing token file", async () => {
      (fs.readFile as MockReadFile).mockImplementation(async (path: any) => {
        if (typeof path === 'string' && path.includes("token")) {
          const error = new Error("ENOENT: no such file or directory") as MockError;
          error.code = "ENOENT";
          throw error;
        }
        return JSON.stringify(global.testUtils.getMockCredentials());
      });

      await expect(api.initialize()).rejects.toThrow();
    });
  });

  describe("Calendar API Methods", () => {
    beforeEach(async () => {
      await api.initialize();
    });

    describe("listCalendars()", () => {
      it("should list calendars successfully", async () => {
        const calendars = await api.listCalendars();

        expect(mockCalendar.calendars.list).toHaveBeenCalled();
        expect(calendars).toHaveLength(2);
        expect(calendars[0].primary).toBe(true);
      });

      it("should handle calendar list API errors", async () => {
        mockCalendar.calendars.list.mockRejectedValue(new Error("API Error"));

        await expect(api.listCalendars()).rejects.toThrow(
          "Error listing calendars: API Error"
        );
      });
    });

    describe("listCalendarEvents()", () => {
      it("should list events with default parameters", async () => {
        const events = await api.listCalendarEvents();

        expect(mockCalendar.events.list).toHaveBeenCalledWith(
          expect.objectContaining({
            calendarId: "primary",
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
            conferenceDataVersion: 1,
          })
        );
        expect(events).toHaveLength(1);
      });

      it("should list events with custom parameters", async () => {
        const events = await api.listCalendarEvents(
          5,
          "2025-08-01T00:00:00Z",
          "2025-08-02T00:00:00Z",
          "secondary"
        );

        expect(mockCalendar.events.list).toHaveBeenCalledWith(
          expect.objectContaining({
            calendarId: "secondary",
            maxResults: 5,
            singleEvents: true,
            orderBy: "startTime",
            timeMin: "2025-08-01T00:00:00Z",
            timeMax: "2025-08-02T00:00:00Z",
            conferenceDataVersion: 1,
          })
        );
      });

      it("should handle events list API errors", async () => {
        mockCalendar.events.list.mockRejectedValue(new Error("API Error"));

        await expect(api.listCalendarEvents()).rejects.toThrow(
          "Error listing meetings: API Error"
        );
      });
    });

    describe("getCalendarEvent()", () => {
      it("should get event by ID", async () => {
        const event = await api.getCalendarEvent("test-event-id");

        expect(mockCalendar.events.get).toHaveBeenCalledWith({
          calendarId: "primary",
          eventId: "test-event-id",
        });
        expect(event.id).toBe("test-event-id");
      });

      it("should handle get event API errors", async () => {
        mockCalendar.events.get.mockRejectedValue(new Error("Event not found"));

        await expect(api.getCalendarEvent("invalid-id")).rejects.toThrow(
          "Error getting meeting: Event not found"
        );
      });
    });

    describe("createCalendarEvent()", () => {
      const eventData = {
        summary: "Test Meeting",
        description: "Test Description",
        startTime: "2025-08-01T10:00:00Z",
        endTime: "2025-08-01T11:00:00Z",
        timeZone: "Europe/Madrid",
        attendees: ["test@example.com"],
        createMeetConference: true,
        guestPermissions: {
          canInviteOthers: false,
          canModify: false,
          canSeeOtherGuests: true,
        },
        location: "",
        calendarId: "primary",
      };

      it("should create event with Meet conference", async () => {
        const event = await api.createCalendarEvent(eventData);

        expect(mockCalendar.events.insert).toHaveBeenCalledWith({
          calendarId: "primary",
          conferenceDataVersion: 1,
          resource: expect.objectContaining({
            summary: "Test Meeting",
            description: "Test Description",
            start: {
              dateTime: "2025-08-01T10:00:00Z",
              timeZone: "Europe/Madrid",
            },
            end: {
              dateTime: "2025-08-01T11:00:00Z",
              timeZone: "Europe/Madrid",
            },
            attendees: [{ email: "test@example.com" }],
            conferenceData: expect.objectContaining({
              createRequest: expect.objectContaining({
                requestId: expect.any(String),
                conferenceSolutionKey: { type: "hangoutsMeet" },
              }),
            }),
            guestsCanInviteOthers: false,
            guestsCanModify: false,
            guestsCanSeeOtherGuests: true,
          }),
        });
      });

      it("should create event without Meet conference", async () => {
        const eventDataNoMeet = { ...eventData, createMeetConference: false };
        await api.createCalendarEvent(eventDataNoMeet);

        const callArgs = mockCalendar.events.insert.mock.calls[0][0];
        expect(callArgs.resource.conferenceData).toBeUndefined();
        expect(callArgs.conferenceDataVersion).toBe(0);
      });

      it("should handle create event API errors", async () => {
        mockCalendar.events.insert.mockRejectedValue(
          new Error("Creation failed")
        );

        await expect(api.createCalendarEvent(eventData)).rejects.toThrow(
          "Error creating calendar event: Creation failed"
        );
      });
    });

    describe("updateCalendarEvent()", () => {
      const updateData = {
        summary: "Updated Meeting",
        description: "Updated Description",
      };

      it("should update event successfully", async () => {
        await api.updateCalendarEvent("test-event-id", updateData);

        expect(mockCalendar.events.patch).toHaveBeenCalledWith({
          calendarId: "primary",
          eventId: "test-event-id",
          conferenceDataVersion: 1,
          resource: expect.objectContaining(updateData),
        });
      });

      it("should handle update event API errors", async () => {
        mockCalendar.events.patch.mockRejectedValue(new Error("Update failed"));

        await expect(
          api.updateCalendarEvent("test-event-id", updateData)
        ).rejects.toThrow("Error updating calendar event: Update failed");
      });
    });

    describe("deleteCalendarEvent()", () => {
      it("should delete event successfully", async () => {
        await api.deleteCalendarEvent("test-event-id");

        expect(mockCalendar.events.delete).toHaveBeenCalledWith({
          calendarId: "primary",
          eventId: "test-event-id",
        });
      });

      it("should handle delete event API errors", async () => {
        mockCalendar.events.delete.mockRejectedValue(
          new Error("Delete failed")
        );

        await expect(api.deleteCalendarEvent("test-event-id")).rejects.toThrow(
          "Error deleting calendar event: Delete failed"
        );
      });
    });
  });

  describe("Meet API Methods", () => {
    beforeEach(async () => {
      await api.initialize();

      // Mock successful fetch responses
      (global.fetch as MockFetch).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("application/json"),
        },
        json: async () => global.testUtils.getMockMeetSpace(),
      });
    });

    describe("createMeetSpace()", () => {
      it("should create Meet space with default config", async () => {
        const space = await api.createMeetSpace({});

        expect(global.fetch).toHaveBeenCalledWith(
          "https://meet.googleapis.com/v2/spaces",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining("TRUSTED"),
          })
        );
      });

      it("should create Meet space with custom config", async () => {
        const config = {
          accessType: "RESTRICTED",
          enableRecording: true,
          enableTranscription: true,
          moderationMode: "ON",
        };

        await api.createMeetSpace(config);

        const fetchCall = (global.fetch as MockFetch).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.config.accessType).toBe("RESTRICTED");
      });

      it("should handle Meet API errors", async () => {
        (global.fetch as MockFetch).mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: async () => ({ error: { message: "Permission denied" } }),
        });

        await expect(api.createMeetSpace({})).rejects.toThrow(
          "Meet API Error: Forbidden"
        );
      });
    });

    describe("getMeetSpace()", () => {
      it("should get Meet space by name", async () => {
        await api.getMeetSpace("spaces/test-space");

        expect(global.fetch).toHaveBeenCalledWith(
          "https://meet.googleapis.com/v2/spaces/test-space",
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          })
        );
      });
    });

    describe("Error handling in Meet API", () => {
      it("should handle network errors", async () => {
        (global.fetch as MockFetch).mockRejectedValue(new Error("Network error"));

        await expect(api.createMeetSpace({})).rejects.toThrow("Network error");
      });

      it("should handle invalid JSON responses", async () => {
        (global.fetch as MockFetch).mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => {
            throw new Error("Invalid JSON");
          },
        });

        await expect(api.createMeetSpace({})).rejects.toThrow(
          "Meet API Error:"
        );
      });
    });
  });

  describe("Method availability checks", () => {
    it("should have all expected public methods", () => {
      const expectedMethods = [
        "initialize",
        "listCalendars",
        "listCalendarEvents",
        "getCalendarEvent",
        "createCalendarEvent",
        "updateCalendarEvent",
        "deleteCalendarEvent",
        "createMeeting",
        "updateMeeting",
        "deleteMeeting",
        "createMeetSpace",
        "getMeetSpace",
        "updateMeetSpace",
        "endActiveConference",
        "listConferenceRecords",
        "getConferenceRecord",
        "listRecordings",
        "getRecording",
        "listTranscripts",
        "getTranscript",
        "listTranscriptEntries",
        "getParticipant",
        "listParticipants",
        "getParticipantSession",
        "listParticipantSessions",
      ];

      expectedMethods.forEach((method) => {
        expect(typeof api[method]).toBe("function");
      });
    });

    it("should throw errors when methods called without initialization", async () => {
      const uninitializedApi = new GoogleMeetAPI("test.json", "token.json");

      await expect(uninitializedApi.listCalendars()).rejects.toThrow();
      await expect(uninitializedApi.createMeetSpace({})).rejects.toThrow();
    });
  });
});
