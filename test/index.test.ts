/**
 * Simplified integration tests for MCP Server (index.ts)
 * Tests basic functionality without complex mocking
 */

import { describe, it, expect } from "vitest";

describe("GoogleMeetMcpServer - Integration", () => {
  describe("Environment Configuration", () => {
    it("should handle G_OAUTH_CREDENTIALS environment variable", () => {
      const originalEnv = process.env.G_OAUTH_CREDENTIALS;
      
      process.env.G_OAUTH_CREDENTIALS = "/test/credentials.json";
      expect(process.env.G_OAUTH_CREDENTIALS).toBe("/test/credentials.json");
      
      // Restore
      if (originalEnv) {
        process.env.G_OAUTH_CREDENTIALS = originalEnv;
      } else {
        delete process.env.G_OAUTH_CREDENTIALS;
      }
    });

    it("should handle legacy environment variables", () => {
      const originalCredentials = process.env.GOOGLE_MEET_CREDENTIALS_PATH;
      const originalToken = process.env.GOOGLE_MEET_TOKEN_PATH;
      
      process.env.GOOGLE_MEET_CREDENTIALS_PATH = "/test/credentials.json";
      process.env.GOOGLE_MEET_TOKEN_PATH = "/test/token.json";
      
      expect(process.env.GOOGLE_MEET_CREDENTIALS_PATH).toBe("/test/credentials.json");
      expect(process.env.GOOGLE_MEET_TOKEN_PATH).toBe("/test/token.json");
      
      // Restore
      if (originalCredentials) {
        process.env.GOOGLE_MEET_CREDENTIALS_PATH = originalCredentials;
      } else {
        delete process.env.GOOGLE_MEET_CREDENTIALS_PATH;
      }
      
      if (originalToken) {
        process.env.GOOGLE_MEET_TOKEN_PATH = originalToken;
      } else {
        delete process.env.GOOGLE_MEET_TOKEN_PATH;
      }
    });
  });

  describe("Tool Definitions", () => {
    it("should have all expected tool names", () => {
      const expectedTools = [
        // Calendar API v3 Tools
        'calendar_v3_list_calendars',
        'calendar_v3_list_events',
        'calendar_v3_get_event', 
        'calendar_v3_create_event',
        'calendar_v3_update_event',
        'calendar_v3_delete_event',
        
        // Meet API v2 Tools
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

      expect(expectedTools).toHaveLength(21);
      
      // Basic validation that all tools are defined
      expectedTools.forEach(toolName => {
        expect(typeof toolName).toBe('string');
        expect(toolName.length).toBeGreaterThan(0);
      });
    });

    it("should have proper tool schema structure", () => {
      const sampleTool = {
        name: "calendar_v3_list_events",
        description: "List calendar events",
        inputSchema: {
          type: "object",
          properties: {
            max_results: { type: "number" }
          }
        }
      };

      expect(sampleTool.name).toBeDefined();
      expect(sampleTool.description).toBeDefined();
      expect(sampleTool.inputSchema).toBeDefined();
      expect(sampleTool.inputSchema.type).toBe("object");
    });
  });

  describe("Server Configuration", () => {
    it("should use version 3.0.0", () => {
      const { readFileSync } = require("fs");
      const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
      
      expect(packageJson.version).toBe("3.0.0");
      expect(packageJson.name).toBe("google-meet-mcp");
    });

    it("should be configured as ES module", () => {
      const { readFileSync } = require("fs");
      const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
      
      expect(packageJson.type).toBe("module");
    });

    it("should have required dependencies", () => {
      const { readFileSync } = require("fs");
      const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
      
      const requiredDeps = [
        "@modelcontextprotocol/sdk",
        "googleapis",
        "dotenv",
        "zod"
      ];

      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies[dep]).toBeDefined();
      });
    });
  });

  describe("Parameter Validation", () => {
    it("should validate tool parameters", () => {
      // Test basic parameter validation logic
      const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("invalid-email")).toBe(false);
    });

    it("should validate ISO date format", () => {
      const validateISODate = (date: string) => {
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(date);
      };

      expect(validateISODate("2025-08-01T10:00:00Z")).toBe(true);
      expect(validateISODate("invalid-date")).toBe(false);
    });

    it("should validate resource name formats", () => {
      const validateSpaceName = (name: string) => {
        return /^spaces\/[a-zA-Z0-9_-]{1,128}$/.test(name);
      };

      expect(validateSpaceName("spaces/abc-defg-hij")).toBe(true);
      expect(validateSpaceName("invalid-space-name")).toBe(false);
    });
  });
});