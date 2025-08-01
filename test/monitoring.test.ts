/**
 * Tests for the monitoring system
 * Tests health checks, metrics collection, and API monitoring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HealthChecker } from "../src/monitoring/healthCheck.js";
import { MetricsCollector } from "../src/monitoring/metrics.js";
import { ApiMonitor } from "../src/monitoring/apiMonitor.js";
import { MonitoringEndpoints } from "../src/endpoints/monitoring.js";

// Mock global fetch
global.fetch = vi.fn();

describe("Monitoring System", () => {
  let mockOAuth2Client: any;
  let healthChecker: HealthChecker;
  let metricsCollector: MetricsCollector;
  let apiMonitor: ApiMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock OAuth2 client
    mockOAuth2Client = {
      getAccessToken: vi.fn().mockResolvedValue({ token: "mock-token" }),
      credentials: {
        expiry_date: Date.now() + 3600000, // 1 hour from now
        scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/meetings.space.created"
      }
    };

    // Initialize monitoring components
    healthChecker = new HealthChecker(mockOAuth2Client);
    metricsCollector = new MetricsCollector();
    apiMonitor = new ApiMonitor(metricsCollector);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("HealthChecker", () => {
    it("should perform basic health check", async () => {
      // Mock successful API responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("application/json")
        },
        json: async () => ({ items: [] })
      });

      const health = await healthChecker.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.status).toBeOneOf(['healthy', 'degraded', 'unhealthy']);
      expect(health.timestamp).toBeDefined();
      expect(health.version).toBeDefined();
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.memory).toBeDefined();
      expect(health.auth).toBeDefined();
      expect(health.apis).toBeDefined();
      expect(health.dependencies).toBeInstanceOf(Array);
    });

    it("should detect healthy auth status", async () => {
      const health = await healthChecker.getHealthStatus();
      
      expect(health.auth.status).toBe('healthy');
      expect(health.auth.token_valid).toBe(true);
      expect(health.auth.expires_in).toBeGreaterThan(0);
      expect(health.auth.scopes_granted).toBeInstanceOf(Array);
    });

    it("should detect unhealthy auth when token is invalid", async () => {
      mockOAuth2Client.getAccessToken.mockRejectedValue(new Error("Token expired"));

      const health = await healthChecker.getHealthStatus();
      
      expect(health.auth.status).toBe('unhealthy');
      expect(health.auth.token_valid).toBe(false);
      expect(health.auth.error).toContain("Token expired");
    });

    it("should check API health", async () => {
      // Mock successful API responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("application/json")
        }
      });

      const health = await healthChecker.getHealthStatus();
      
      expect(health.apis.calendar_api.status).toBe('healthy');
      expect(health.apis.meet_api.status).toBe('healthy');
      expect(health.apis.overall_status).toBe('healthy');
    });

    it("should detect API failures", async () => {
      // Mock failed API responses
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          get: vi.fn().mockReturnValue("application/json")
        }
      });

      const health = await healthChecker.getHealthStatus();
      
      expect(health.apis.calendar_api.status).toBeOneOf(['degraded', 'unhealthy']);
      expect(health.apis.meet_api.status).toBeOneOf(['degraded', 'unhealthy']);
    });

    it("should provide simple health check", async () => {
      // Mock successful responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("application/json")
        }
      });

      const isHealthy = await healthChecker.isHealthy();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe("MetricsCollector", () => {
    it("should initialize with empty metrics", () => {
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.requests_total).toBe(0);
      expect(metrics.errors_total).toBe(0);
      expect(metrics.error_rate).toBe(0);
      expect(typeof metrics.tool_usage).toBe('object');
      expect(typeof metrics.api_performance).toBe('object');
      expect(typeof metrics.system_metrics).toBe('object');
    });

    it("should record tool calls", () => {
      metricsCollector.recordToolCall("calendar_v3_list_events", 150, true);
      metricsCollector.recordToolCall("meet_v2_create_space", 300, false, new Error("Test error"));

      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.requests_total).toBe(2);
      expect(metrics.errors_total).toBe(1);
      expect(metrics.error_rate).toBe(50);
      
      const calendarTool = metrics.tool_usage["calendar_v3_list_events"];
      expect(calendarTool.total_calls).toBe(1);
      expect(calendarTool.successful_calls).toBe(1);
      expect(calendarTool.failed_calls).toBe(0);
      expect(calendarTool.avg_duration_ms).toBe(150);
      
      const meetTool = metrics.tool_usage["meet_v2_create_space"];
      expect(meetTool.total_calls).toBe(1);
      expect(meetTool.successful_calls).toBe(0);
      expect(meetTool.failed_calls).toBe(1);
      expect(meetTool.avg_duration_ms).toBe(300);
    });

    it("should record API calls", () => {
      metricsCollector.recordApiCall("calendar", 200, true, 200);
      metricsCollector.recordApiCall("meet", 500, false, 429, true);

      const metrics = metricsCollector.getMetrics();
      
      const calendarApi = metrics.api_performance["calendar"];
      expect(calendarApi.total_calls).toBe(1);
      expect(calendarApi.successful_calls).toBe(1);
      expect(calendarApi.failed_calls).toBe(0);
      expect(calendarApi.avg_response_time).toBe(200);
      
      const meetApi = metrics.api_performance["meet"];
      expect(meetApi.total_calls).toBe(1);
      expect(meetApi.successful_calls).toBe(0);
      expect(meetApi.failed_calls).toBe(1);
      expect(meetApi.rate_limit_hits).toBe(1);
    });

    it("should record errors", () => {
      metricsCollector.recordError("validation_error", { field: "test" });
      
      const metrics = metricsCollector.getMetrics();
      expect(metrics.errors_total).toBe(1);
    });

    it("should generate Prometheus metrics", () => {
      metricsCollector.recordToolCall("calendar_v3_list_events", 150, true);
      metricsCollector.recordApiCall("calendar", 200, true, 200);

      const prometheusMetrics = metricsCollector.getPrometheusMetrics();
      
      expect(prometheusMetrics).toContain("gmcp_requests_total");
      expect(prometheusMetrics).toContain("gmcp_tool_calls_total");
      expect(prometheusMetrics).toContain("gmcp_api_calls_total");
      expect(prometheusMetrics).toContain("# HELP");
      expect(prometheusMetrics).toContain("# TYPE");
    });

    it("should calculate requests per minute", () => {
      // Record several calls
      for (let i = 0; i < 5; i++) {
        metricsCollector.recordToolCall("test_tool", 100, true);
      }

      const metrics = metricsCollector.getMetrics();
      expect(metrics.requests_per_minute).toBeGreaterThan(0);
    });

    it("should reset metrics", () => {
      metricsCollector.recordToolCall("test_tool", 100, true);
      metricsCollector.recordError("test_error");
      
      metricsCollector.reset();
      
      const metrics = metricsCollector.getMetrics();
      expect(metrics.requests_total).toBe(0);
      expect(metrics.errors_total).toBe(0);
    });
  });

  describe("ApiMonitor", () => {
    it("should track API calls", () => {
      const callId = "test-call-1";
      
      apiMonitor.startApiCall(callId, "calendar", "GET", "https://api.example.com");
      apiMonitor.endApiCall(callId, 200, true);
      
      const activeCalls = apiMonitor.getActiveCalls();
      expect(activeCalls).toHaveLength(0); // Should be removed after ending
    });

    it("should detect rate limiting", () => {
      const callId = "test-call-2";
      const mockHeaders = new Headers();
      mockHeaders.set('X-RateLimit-Remaining', '0');
      mockHeaders.set('Retry-After', '60');
      
      apiMonitor.startApiCall(callId, "calendar", "GET", "https://api.example.com");
      apiMonitor.endApiCall(callId, 429, false, undefined, mockHeaders);
      
      const rateLimitInfo = apiMonitor.getRateLimitInfo("calendar");
      expect(rateLimitInfo?.isLimited).toBe(true);
      expect(rateLimitInfo?.retryAfter).toBe(60);
    });

    it("should wrap API calls", async () => {
      let callExecuted = false;
      const mockApiCall = async () => {
        callExecuted = true;
        return "success";
      };

      const result = await apiMonitor.wrapApiCall(
        "calendar",
        "GET",
        "https://api.example.com",
        mockApiCall
      );

      expect(callExecuted).toBe(true);
      expect(result).toBe("success");
    });

    it("should handle API call failures", async () => {
      const mockApiCall = async () => {
        throw new Error("API Error");
      };

      await expect(
        apiMonitor.wrapApiCall("calendar", "GET", "https://api.example.com", mockApiCall)
      ).rejects.toThrow("API Error");
    });

    it("should wrap fetch calls", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers()
      });

      const response = await apiMonitor.wrapFetch(
        "calendar",
        "https://api.example.com"
      );

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com", {});
    });

    it("should get performance summary", () => {
      // Create some activity
      const callId = "test-call-3";
      apiMonitor.startApiCall(callId, "calendar", "GET", "https://api.example.com");
      apiMonitor.endApiCall(callId, 200, true);

      const summary = apiMonitor.getApiPerformanceSummary();
      expect(typeof summary).toBe('object');
    });

    it("should recommend delays for rate limited APIs", () => {
      // Set up rate limit
      const callId = "test-call-4";
      const mockHeaders = new Headers();
      mockHeaders.set('Retry-After', '30');
      
      apiMonitor.startApiCall(callId, "calendar", "GET", "https://api.example.com");
      apiMonitor.endApiCall(callId, 429, false, undefined, mockHeaders);
      
      const delay = apiMonitor.getRecommendedDelay("calendar");
      expect(delay).toBe(30000); // 30 seconds in milliseconds
    });
  });

  describe("MonitoringEndpoints", () => {
    let monitoringEndpoints: MonitoringEndpoints;
    let mockServer: any;

    beforeEach(() => {
      // Mock HTTP server
      mockServer = {
        listen: vi.fn((port: number, host: string, callback: () => void) => {
          callback();
        }),
        close: vi.fn((callback: () => void) => {
          callback();
        }),
        on: vi.fn(),
        listening: true
      };

      // Mock http.createServer
      vi.doMock('http', () => ({
        createServer: vi.fn(() => mockServer)
      }));
    });

    it("should create monitoring endpoints", () => {
      const config = {
        port: 3001,
        host: '0.0.0.0',
        enableCors: true
      };

      monitoringEndpoints = new MonitoringEndpoints(
        healthChecker,
        metricsCollector,
        apiMonitor,
        config
      );

      expect(monitoringEndpoints).toBeDefined();
    });

    it("should check if server is running", () => {
      const config = { port: 3001 };
      
      monitoringEndpoints = new MonitoringEndpoints(
        healthChecker,
        metricsCollector,
        apiMonitor,
        config
      );

      // Before starting
      expect(monitoringEndpoints.isRunning()).toBe(false);
    });
  });

  describe("System Integration", () => {
    it("should work together for comprehensive monitoring", async () => {
      // Simulate tool execution
      metricsCollector.recordToolCall("calendar_v3_list_events", 150, true);
      metricsCollector.recordApiCall("calendar", 120, true, 200);

      // Check health
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("application/json")
        }
      });

      const health = await healthChecker.getHealthStatus();
      const metrics = metricsCollector.getMetrics();

      expect(health.status).toBe('healthy');
      expect(metrics.requests_total).toBe(1);
      expect(metrics.google_api_calls).toBeGreaterThanOrEqual(0);
    });

    it("should handle monitoring initialization failures gracefully", () => {
      // Test that monitoring failures don't crash the main system
      const invalidOAuth = null;
      
      expect(() => {
        new HealthChecker(invalidOAuth as any);
      }).not.toThrow();
    });
  });
});