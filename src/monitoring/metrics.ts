/**
 * Metrics Collection System for Google Meet MCP Server
 * Collects and provides operational metrics for monitoring
 */

export interface MetricsData {
  requests_total: number;
  requests_per_minute: number;
  errors_total: number;
  error_rate: number;
  avg_response_time: number;
  google_api_calls: number;
  active_tokens: number;
  tool_usage: Record<string, ToolMetrics>;
  api_performance: Record<string, ApiMetrics>;
  system_metrics: SystemMetrics;
}

export interface ToolMetrics {
  name: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  last_called: string;
  error_rate: number;
}

export interface ApiMetrics {
  api_name: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_response_time: number;
  last_call: string;
  rate_limit_hits: number;
  quota_usage: number;
}

export interface SystemMetrics {
  uptime_seconds: number;
  memory_usage_mb: number;
  memory_usage_percent: number;
  cpu_usage_percent: number;
  active_connections: number;
  health_status: string;
}

export interface MetricEvent {
  type: 'request' | 'tool_call' | 'api_call' | 'error';
  timestamp: number;
  duration_ms?: number;
  tool_name?: string;
  api_name?: string;
  success: boolean;
  error_type?: string;
  details?: Record<string, any>;
}

export class MetricsCollector {
  private events: MetricEvent[] = [];
  private toolMetrics: Map<string, ToolMetrics> = new Map();
  private apiMetrics: Map<string, ApiMetrics> = new Map();
  private requestCount = 0;
  private errorCount = 0;
  private startTime = Date.now();
  private lastCleanup = Date.now();
  
  // Configuration
  private readonly MAX_EVENTS = 10000; // Keep last 10k events
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly METRICS_WINDOW = 60 * 60 * 1000; // 1 hour for calculations

  constructor() {
    // Initialize known tool metrics
    this.initializeToolMetrics();
    
    // Start periodic cleanup
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  /**
   * Record a tool execution
   */
  recordToolCall(toolName: string, durationMs: number, success: boolean, error?: Error): void {
    const event: MetricEvent = {
      type: 'tool_call',
      timestamp: Date.now(),
      duration_ms: durationMs,
      tool_name: toolName,
      success,
      error_type: error?.constructor.name,
      details: error ? { message: error.message } : undefined
    };

    this.addEvent(event);
    this.updateToolMetrics(toolName, durationMs, success);
    this.requestCount++;
    
    if (!success) {
      this.errorCount++;
    }
  }

  /**
   * Record a Google API call
   */
  recordApiCall(apiName: string, durationMs: number, success: boolean, statusCode?: number, rateLimitHit = false): void {
    const event: MetricEvent = {
      type: 'api_call',
      timestamp: Date.now(),
      duration_ms: durationMs,
      api_name: apiName,
      success,
      details: { 
        status_code: statusCode,
        rate_limit_hit: rateLimitHit
      }
    };

    this.addEvent(event);
    this.updateApiMetrics(apiName, durationMs, success, rateLimitHit);
  }

  /**
   * Record a general error
   */
  recordError(errorType: string, details?: Record<string, any>): void {
    const event: MetricEvent = {
      type: 'error',
      timestamp: Date.now(),
      success: false,
      error_type: errorType,
      details
    };

    this.addEvent(event);
    this.errorCount++;
  }

  /**
   * Get comprehensive metrics data
   */
  getMetrics(): MetricsData {
    const now = Date.now();
    const windowStart = now - this.METRICS_WINDOW;
    const recentEvents = this.events.filter(e => e.timestamp >= windowStart);

    // Calculate request rate (per minute)
    const minuteAgo = now - 60000;
    const recentRequests = recentEvents.filter(e => 
      e.timestamp >= minuteAgo && e.type === 'tool_call'
    ).length;

    // Calculate average response time
    const requestEvents = recentEvents.filter(e => e.type === 'tool_call' && e.duration_ms);
    const avgResponseTime = requestEvents.length > 0
      ? requestEvents.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / requestEvents.length
      : 0;

    // Calculate error rate
    const totalRequests = Math.max(this.requestCount, 1);
    const errorRate = (this.errorCount / totalRequests) * 100;

    // Count Google API calls
    const apiCalls = recentEvents.filter(e => e.type === 'api_call').length;

    return {
      requests_total: this.requestCount,
      requests_per_minute: recentRequests,
      errors_total: this.errorCount,
      error_rate: Math.round(errorRate * 100) / 100,
      avg_response_time: Math.round(avgResponseTime * 100) / 100,
      google_api_calls: apiCalls,
      active_tokens: 1, // Simplified - we typically have 1 token
      tool_usage: Object.fromEntries(this.toolMetrics),
      api_performance: Object.fromEntries(this.apiMetrics),
      system_metrics: this.getSystemMetrics()
    };
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Helper function to add metric
    const addMetric = (name: string, type: string, help: string, value: number, labels?: Record<string, string>) => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} ${type}`);
      const labelStr = labels ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : '';
      lines.push(`${name}${labelStr} ${value}`);
      lines.push('');
    };

    // Basic metrics
    addMetric('gmcp_requests_total', 'counter', 'Total number of MCP requests', metrics.requests_total);
    addMetric('gmcp_requests_per_minute', 'gauge', 'Requests per minute', metrics.requests_per_minute);
    addMetric('gmcp_errors_total', 'counter', 'Total number of errors', metrics.errors_total);
    addMetric('gmcp_error_rate', 'gauge', 'Error rate percentage', metrics.error_rate);
    addMetric('gmcp_avg_response_time_ms', 'gauge', 'Average response time in milliseconds', metrics.avg_response_time);
    addMetric('gmcp_google_api_calls', 'gauge', 'Google API calls in the last hour', metrics.google_api_calls);

    // Tool-specific metrics
    for (const [toolName, toolMetrics] of Object.entries(metrics.tool_usage)) {
      const labels = { tool: toolName };
      addMetric('gmcp_tool_calls_total', 'counter', 'Total tool calls', toolMetrics.total_calls, labels);
      addMetric('gmcp_tool_success_total', 'counter', 'Successful tool calls', toolMetrics.successful_calls, labels);
      addMetric('gmcp_tool_error_total', 'counter', 'Failed tool calls', toolMetrics.failed_calls, labels);
      addMetric('gmcp_tool_duration_avg_ms', 'gauge', 'Average tool duration', toolMetrics.avg_duration_ms, labels);
      addMetric('gmcp_tool_error_rate', 'gauge', 'Tool error rate percentage', toolMetrics.error_rate, labels);
    }

    // API-specific metrics
    for (const [apiName, apiMetrics] of Object.entries(metrics.api_performance)) {
      const labels = { api: apiName };
      addMetric('gmcp_api_calls_total', 'counter', 'Total API calls', apiMetrics.total_calls, labels);
      addMetric('gmcp_api_success_total', 'counter', 'Successful API calls', apiMetrics.successful_calls, labels);
      addMetric('gmcp_api_error_total', 'counter', 'Failed API calls', apiMetrics.failed_calls, labels);
      addMetric('gmcp_api_response_time_avg', 'gauge', 'Average API response time', apiMetrics.avg_response_time, labels);
      addMetric('gmcp_api_rate_limit_hits', 'counter', 'API rate limit hits', apiMetrics.rate_limit_hits, labels);
    }

    // System metrics
    addMetric('gmcp_uptime_seconds', 'gauge', 'Server uptime in seconds', metrics.system_metrics.uptime_seconds);
    addMetric('gmcp_memory_usage_mb', 'gauge', 'Memory usage in MB', metrics.system_metrics.memory_usage_mb);
    addMetric('gmcp_memory_usage_percent', 'gauge', 'Memory usage percentage', metrics.system_metrics.memory_usage_percent);

    return lines.join('\n');
  }

  /**
   * Get tool-specific metrics
   */
  getToolMetrics(toolName: string): ToolMetrics | undefined {
    return this.toolMetrics.get(toolName);
  }

  /**
   * Get API-specific metrics
   */
  getApiMetrics(apiName: string): ApiMetrics | undefined {
    return this.apiMetrics.get(apiName);
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.events = [];
    this.toolMetrics.clear();
    this.apiMetrics.clear();
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    this.initializeToolMetrics();
  }

  /**
   * Get recent events (for debugging)
   */
  getRecentEvents(limit = 100): MetricEvent[] {
    return this.events.slice(-limit);
  }

  // Private methods

  private addEvent(event: MetricEvent): void {
    this.events.push(event);
    
    // Keep only recent events to prevent memory issues
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS * 0.8); // Keep 80% of max
    }
  }

  private updateToolMetrics(toolName: string, durationMs: number, success: boolean): void {
    let metrics = this.toolMetrics.get(toolName);
    
    if (!metrics) {
      metrics = {
        name: toolName,
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        avg_duration_ms: 0,
        min_duration_ms: Infinity,
        max_duration_ms: 0,
        last_called: new Date().toISOString(),
        error_rate: 0
      };
    }

    metrics.total_calls++;
    metrics.last_called = new Date().toISOString();
    
    if (success) {
      metrics.successful_calls++;
    } else {
      metrics.failed_calls++;
    }

    // Update duration statistics
    metrics.min_duration_ms = Math.min(metrics.min_duration_ms, durationMs);
    metrics.max_duration_ms = Math.max(metrics.max_duration_ms, durationMs);
    
    // Calculate running average
    const totalDuration = (metrics.avg_duration_ms * (metrics.total_calls - 1)) + durationMs;
    metrics.avg_duration_ms = totalDuration / metrics.total_calls;
    
    // Calculate error rate
    metrics.error_rate = (metrics.failed_calls / metrics.total_calls) * 100;

    this.toolMetrics.set(toolName, metrics);
  }

  private updateApiMetrics(apiName: string, durationMs: number, success: boolean, rateLimitHit: boolean): void {
    let metrics = this.apiMetrics.get(apiName);
    
    if (!metrics) {
      metrics = {
        api_name: apiName,
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        avg_response_time: 0,
        last_call: new Date().toISOString(),
        rate_limit_hits: 0,
        quota_usage: 0
      };
    }

    metrics.total_calls++;
    metrics.last_call = new Date().toISOString();
    
    if (success) {
      metrics.successful_calls++;
    } else {
      metrics.failed_calls++;
    }

    if (rateLimitHit) {
      metrics.rate_limit_hits++;
    }

    // Calculate running average response time
    const totalTime = (metrics.avg_response_time * (metrics.total_calls - 1)) + durationMs;
    metrics.avg_response_time = totalTime / metrics.total_calls;

    this.apiMetrics.set(apiName, metrics);
  }

  private getSystemMetrics(): SystemMetrics {
    const memory = process.memoryUsage();
    const uptimeSeconds = process.uptime();
    
    return {
      uptime_seconds: Math.round(uptimeSeconds),
      memory_usage_mb: Math.round(memory.heapUsed / 1024 / 1024),
      memory_usage_percent: Math.round((memory.heapUsed / memory.heapTotal) * 100),
      cpu_usage_percent: 0, // Simplified - would need process.cpuUsage() tracking
      active_connections: 1, // Simplified for MCP server
      health_status: this.calculateHealthStatus()
    };
  }

  private calculateHealthStatus(): string {
    const errorRate = (this.errorCount / Math.max(this.requestCount, 1)) * 100;
    
    if (errorRate > 10) return 'unhealthy';
    if (errorRate > 5) return 'degraded';
    return 'healthy';
  }

  private initializeToolMetrics(): void {
    // Initialize metrics for all known tools
    const knownTools = [
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

    for (const toolName of knownTools) {
      if (!this.toolMetrics.has(toolName)) {
        this.toolMetrics.set(toolName, {
          name: toolName,
          total_calls: 0,
          successful_calls: 0,
          failed_calls: 0,
          avg_duration_ms: 0,
          min_duration_ms: 0,
          max_duration_ms: 0,
          last_called: '',
          error_rate: 0
        });
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.METRICS_WINDOW * 2; // Keep events for 2x the metrics window
    
    // Remove old events
    this.events = this.events.filter(e => e.timestamp >= cutoff);
    
    this.lastCleanup = now;
  }
}