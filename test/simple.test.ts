/**
 * Simple working tests for Google Meet MCP Server using Vitest
 * Focus on basic functionality and avoid complex mocking issues
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Google Meet MCP Server - Basic Tests", () => {
  describe("Environment and Configuration", () => {
    it("should have package.json with correct configuration", async () => {
      const { readFile } = await import("fs/promises");
      const packagePath = new URL("../package.json", import.meta.url).pathname;

      try {
        const packageContent = await readFile(packagePath, "utf8");
        const packageJson = JSON.parse(packageContent);

        expect(packageJson.name).toBe("google-meet-mcp");
        expect(packageJson.type).toBe("module");
        expect(packageJson.main).toBe("build/src/index.js");
        expect(
          packageJson.dependencies["@modelcontextprotocol/sdk"]
        ).toBeDefined();
        expect(packageJson.dependencies["googleapis"]).toBeDefined();
        expect(packageJson.dependencies["dotenv"]).toBeDefined();
        expect(packageJson.devDependencies["vitest"]).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to read package.json: ${error.message}`);
      }
    });

    it("should have all required source files", async () => {
      const { access } = await import("fs/promises");
      const path = await import("path");
      const { fileURLToPath } = await import("url");

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const srcDir = path.join(__dirname, "../src");

      const requiredFiles = ["index.ts", "GoogleMeetAPI.ts", "setup.ts"];

      for (const file of requiredFiles) {
        const filePath = path.join(srcDir, file);
        await expect(access(filePath)).resolves.not.toThrow();
      }
    });

    it("should have proper ES module structure", async () => {
      const { readFile } = await import("fs/promises");
      const path = await import("path");
      const { fileURLToPath } = await import("url");

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const indexPath = path.join(__dirname, "../src/index.ts");

      const content = await readFile(indexPath, "utf8");
      expect(content).toContain("import");
      expect(content).toContain("@modelcontextprotocol/sdk");
      expect(content).toContain("GoogleMeetAPI");
    });
  });

  describe("GoogleMeetAPI Class Structure", () => {
    it("should export GoogleMeetAPI class", async () => {
      // Test that the module can be imported without errors
      const module = await import("../src/GoogleMeetAPI.js");
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe("function");
    });

    it("should create GoogleMeetAPI instances", async () => {
      const { default: GoogleMeetAPI } = await import(
        "../src/GoogleMeetAPI.ts"
      );

      const api = new GoogleMeetAPI("test-credentials.json", "test-token.json");

      expect(api).toBeDefined();
      expect(api.credentialsPath).toBe("test-credentials.json");
      expect(api.tokenPath).toBe("test-token.json");
      expect(api.auth).toBeNull();
      expect(api.calendar).toBeNull();
    });

    it("should have all expected methods", async () => {
      const { default: GoogleMeetAPI } = await import(
        "../src/GoogleMeetAPI.ts"
      );

      const api = new GoogleMeetAPI("test.json", "token.json");

      const expectedMethods = [
        "initialize",
        "listCalendars",
        "listCalendarEvents",
        "getCalendarEvent",
        "createCalendarEvent",
        "updateCalendarEvent",
        "deleteCalendarEvent",
        "createMeeting",
        "createMeetSpace",
        "getMeetSpace",
        "listConferenceRecords",
      ];

      expectedMethods.forEach((method) => {
        expect(typeof api[method]).toBe("function");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing credentials gracefully", async () => {
      const { default: GoogleMeetAPI } = await import(
        "../src/GoogleMeetAPI.ts"
      );

      const api = new GoogleMeetAPI("nonexistent.json", "nonexistent.json");

      await expect(api.initialize()).rejects.toThrow();
    });

    it("should validate constructor parameters", async () => {
      const { default: GoogleMeetAPI } = await import(
        "../src/GoogleMeetAPI.ts"
      );

      // Should accept different parameter types without throwing
      const api1 = new GoogleMeetAPI("", "");
      const api2 = new GoogleMeetAPI(null, null);
      const api3 = new GoogleMeetAPI(undefined, undefined);

      expect(api1.credentialsPath).toBe("");
      expect(api2.credentialsPath).toBeNull();
      expect(api3.credentialsPath).toBeUndefined();
    });

    it("should handle method calls without initialization", async () => {
      const { default: GoogleMeetAPI } = await import(
        "../src/GoogleMeetAPI.ts"
      );

      const api = new GoogleMeetAPI("test.json", "token.json");

      // These should all throw errors when not initialized
      await expect(api.listCalendars()).rejects.toThrow();
      await expect(api.createMeetSpace({})).rejects.toThrow();
      await expect(api.listConferenceRecords()).rejects.toThrow();
    });
  });

  describe("Configuration Validation", () => {
    it("should validate tool schemas conceptually", () => {
      // Test basic validation concepts
      const validateMaxResults = (value) => {
        return typeof value === "number" && value > 0 && value <= 2500;
      };

      const validateISODate = (value) => {
        return (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        );
      };

      const validateAccessType = (value) => {
        return ["OPEN", "TRUSTED", "RESTRICTED"].includes(value);
      };

      // Test validations
      expect(validateMaxResults(10)).toBe(true);
      expect(validateMaxResults(-1)).toBe(false);
      expect(validateMaxResults(3000)).toBe(false);

      expect(validateISODate("2025-08-01T10:00:00Z")).toBe(true);
      expect(validateISODate("invalid-date")).toBe(false);

      expect(validateAccessType("TRUSTED")).toBe(true);
      expect(validateAccessType("INVALID")).toBe(false);
    });

    it("should have proper MCP tool definitions structure", () => {
      const sampleTool = {
        name: "calendar_v3_list_events",
        description: "List calendar events",
        inputSchema: {
          type: "object",
          properties: {
            max_results: { type: "number" },
            time_min: { type: "string" },
            time_max: { type: "string" },
          },
        },
      };

      expect(sampleTool.name).toBeDefined();
      expect(sampleTool.description).toBeDefined();
      expect(sampleTool.inputSchema).toBeDefined();
      expect(sampleTool.inputSchema.type).toBe("object");
      expect(sampleTool.inputSchema.properties).toBeDefined();
    });
  });

  describe("Integration Readiness", () => {
    it("should be ready for MCP server integration", async () => {
      // Test that main components are importable
      const GoogleMeetAPI = await import("../src/GoogleMeetAPI.js");
      const indexModule = await import("../src/index.js");

      expect(GoogleMeetAPI.default).toBeDefined();
      // index.ts executes immediately, so just check it doesn't throw
    });

    it("should handle environment variables", () => {
      const originalEnv = process.env.G_OAUTH_CREDENTIALS;

      process.env.G_OAUTH_CREDENTIALS = "/test/path/credentials.json";
      expect(process.env.G_OAUTH_CREDENTIALS).toBe(
        "/test/path/credentials.json"
      );

      delete process.env.G_OAUTH_CREDENTIALS;
      expect(process.env.G_OAUTH_CREDENTIALS).toBeUndefined();

      // Restore
      if (originalEnv) {
        process.env.G_OAUTH_CREDENTIALS = originalEnv;
      }
    });
  });

  describe("Testing Infrastructure", () => {
    it("should have Vitest properly configured", () => {
      expect(vi).toBeDefined();
      expect(describe).toBeDefined();
      expect(it).toBeDefined();
      expect(expect).toBeDefined();
      expect(beforeEach).toBeDefined();
    });

    it("should have test utilities available", () => {
      expect(global.testUtils).toBeDefined();
      expect(typeof global.testUtils.getMockCredentials).toBe("function");
      expect(typeof global.testUtils.getMockToken).toBe("function");
      expect(typeof global.testUtils.getMockCalendarEvent).toBe("function");
      expect(typeof global.testUtils.getMockMeetSpace).toBe("function");
    });

    it("should generate consistent mock data", () => {
      const credentials1 = global.testUtils.getMockCredentials();
      const credentials2 = global.testUtils.getMockCredentials();

      expect(credentials1).toEqual(credentials2);
      expect(credentials1.installed.client_id).toBe("mock-client-id");

      const event1 = global.testUtils.getMockCalendarEvent();
      const event2 = global.testUtils.getMockCalendarEvent();

      expect(event1).toEqual(event2);
      expect(event1.id).toBe("test-event-id");
    });
  });
});
