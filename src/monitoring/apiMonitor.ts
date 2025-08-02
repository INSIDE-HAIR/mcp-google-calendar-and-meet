/**
 * API Monitor for Google Meet MCP Server v3.0
 * 
 * Comprehensive monitoring system for Google Calendar API v3 and Meet API v2 calls.
 * Integrates with the v3.0 monitoring system providing real-time API performance tracking,
 * rate limit detection, quota management, and debugging capabilities.
 * 
 * Features:
 * - Real-time API call monitoring and performance tracking
 * - Rate limit detection and intelligent retry recommendations  
 * - Quota usage tracking and threshold alerts
 * - Integration with health check endpoints (/health, /metrics, /api-status)
 * - Debug mode support with detailed logging
 * - Prometheus metrics generation for production monitoring
 * 
 * Usage with v3.0 Debug Modes:
 * - LOG_LEVEL=debug: Detailed API call logging with request/response info
 * - DEBUG_CALENDAR_API=true: Monitor only Calendar API v3 calls
 * - DEBUG_MEET_API=true: Monitor only Meet API v2 calls
 * - ENABLE_HEALTH_CHECK=true: Expose monitoring data via HTTP endpoints
 * 
 * Monitoring Endpoints Integration:
 * - /health: Includes API connectivity status from this monitor
 * - /metrics: Includes performance metrics collected by this monitor  
 * - /api-status: Real-time API health overview from this monitor
 * - /api/performance: Detailed performance analytics from this monitor
 */

import { MetricsCollector } from './metrics.js';

export interface ApiCallInfo {
  apiName: string;
  method: string;
  endpoint: string;
  startTime: number;
  endTime?: number;
  statusCode?: number;
  success?: boolean;
  error?: Error;
  rateLimitHit?: boolean;
  retryAttempt?: number;
}

export interface ApiQuotaInfo {
  apiName: string;
  quotaUsed: number;
  quotaLimit: number;
  quotaRemaining: number;
  resetTime?: Date;
}

export interface RateLimitInfo {
  apiName: string;
  isLimited: boolean;
  retryAfter?: number;
  limitType?: 'user' | 'project' | 'global';
  requestsPerMinute?: number;
  requestsRemaining?: number;
}

export class ApiMonitor {
  private metricsCollector: MetricsCollector;
  private activeCalls: Map<string, ApiCallInfo> = new Map();
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private quotaInfo: Map<string, ApiQuotaInfo> = new Map();
  
  // Google API rate limits (requests per minute)
  private readonly API_RATE_LIMITS = {
    'calendar': 1000,
    'meet': 100,  // More conservative for Meet API
  };

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  /**
   * Start monitoring an API call
   */
  startApiCall(callId: string, apiName: string, method: string, endpoint: string): void {
    const callInfo: ApiCallInfo = {
      apiName,
      method,
      endpoint,
      startTime: Date.now()
    };

    this.activeCalls.set(callId, callInfo);
  }

  /**
   * End monitoring an API call
   */
  endApiCall(
    callId: string, 
    statusCode: number, 
    success: boolean, 
    error?: Error,
    responseHeaders?: Headers
  ): void {
    const callInfo = this.activeCalls.get(callId);
    if (!callInfo) {
      return; // Call not found
    }

    const endTime = Date.now();
    const duration = endTime - callInfo.startTime;

    // Update call info
    callInfo.endTime = endTime;
    callInfo.statusCode = statusCode;
    callInfo.success = success;
    callInfo.error = error;

    // Check for rate limiting
    const rateLimitHit = this.checkRateLimit(statusCode, responseHeaders);
    callInfo.rateLimitHit = rateLimitHit;

    // Update rate limit info if headers are available
    if (responseHeaders) {
      this.updateRateLimitInfo(callInfo.apiName, responseHeaders);
      this.updateQuotaInfo(callInfo.apiName, responseHeaders);
    }

    // Record metrics
    this.metricsCollector.recordApiCall(
      callInfo.apiName,
      duration,
      success,
      statusCode,
      rateLimitHit
    );

    // Log significant events
    if (rateLimitHit) {
      console.warn(`Rate limit hit for ${callInfo.apiName} API: ${callInfo.method} ${callInfo.endpoint}`);
    }

    if (!success && statusCode >= 500) {
      console.error(`Server error for ${callInfo.apiName} API: ${statusCode} ${callInfo.method} ${callInfo.endpoint}`);
    }

    // Clean up
    this.activeCalls.delete(callId);
  }

  /**
   * Create a wrapper for API calls that automatically monitors them
   */
  wrapApiCall<T>(
    apiName: string,
    method: string,
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const callId = this.generateCallId();
    
    this.startApiCall(callId, apiName, method, endpoint);

    return apiCall()
      .then((result) => {
        this.endApiCall(callId, 200, true);
        return result;
      })
      .catch((error) => {
        const statusCode = this.extractStatusCode(error);
        this.endApiCall(callId, statusCode, false, error);
        throw error;
      });
  }

  /**
   * Create a wrapper for fetch calls to Google APIs
   */
  async wrapFetch(
    apiName: string,
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const callId = this.generateCallId();
    const method = options.method || 'GET';
    
    this.startApiCall(callId, apiName, method, url);

    try {
      const response = await fetch(url, options);
      
      this.endApiCall(
        callId,
        response.status,
        response.ok,
        undefined,
        response.headers
      );

      return response;
    } catch (error) {
      this.endApiCall(
        callId,
        0,
        false,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(apiName: string): RateLimitInfo | undefined {
    return this.rateLimits.get(apiName);
  }

  /**
   * Get current quota information
   */
  getQuotaInfo(apiName: string): ApiQuotaInfo | undefined {
    return this.quotaInfo.get(apiName);
  }

  /**
   * Get all active API calls
   */
  getActiveCalls(): ApiCallInfo[] {
    return Array.from(this.activeCalls.values());
  }

  /**
   * Check if an API is currently rate limited
   */
  isRateLimited(apiName: string): boolean {
    const rateLimitInfo = this.rateLimits.get(apiName);
    return rateLimitInfo?.isLimited || false;
  }

  /**
   * Get recommended delay before next API call
   */
  getRecommendedDelay(apiName: string): number {
    const rateLimitInfo = this.rateLimits.get(apiName);
    
    if (rateLimitInfo?.isLimited && rateLimitInfo.retryAfter) {
      return rateLimitInfo.retryAfter * 1000; // Convert to milliseconds
    }

    // Calculate delay based on current usage
    const quotaInfo = this.quotaInfo.get(apiName);
    if (quotaInfo && quotaInfo.quotaRemaining < 10) {
      return 1000; // 1 second delay when quota is low
    }

    return 0; // No delay needed
  }

  /**
   * Get API performance summary
   */
  getApiPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const [apiName, rateLimitInfo] of this.rateLimits) {
      const quotaInfo = this.quotaInfo.get(apiName);
      const apiMetrics = this.metricsCollector.getApiMetrics(apiName);

      summary[apiName] = {
        rate_limit: {
          is_limited: rateLimitInfo.isLimited,
          requests_remaining: rateLimitInfo.requestsRemaining,
          retry_after: rateLimitInfo.retryAfter
        },
        quota: quotaInfo ? {
          used: quotaInfo.quotaUsed,
          limit: quotaInfo.quotaLimit,
          remaining: quotaInfo.quotaRemaining,
          usage_percent: Math.round((quotaInfo.quotaUsed / quotaInfo.quotaLimit) * 100)
        } : null,
        performance: apiMetrics ? {
          total_calls: apiMetrics.total_calls,
          success_rate: Math.round((apiMetrics.successful_calls / apiMetrics.total_calls) * 100),
          avg_response_time: Math.round(apiMetrics.avg_response_time),
          rate_limit_hits: apiMetrics.rate_limit_hits
        } : null
      };
    }

    return summary;
  }

  // Private methods

  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkRateLimit(statusCode: number, responseHeaders?: Headers): boolean {
    // HTTP 429 is the standard rate limit status code
    if (statusCode === 429) {
      return true;
    }

    // Check for Google-specific rate limit headers
    if (responseHeaders) {
      const rateLimitRemaining = responseHeaders.get('X-RateLimit-Remaining');
      if (rateLimitRemaining === '0') {
        return true;
      }
    }

    return false;
  }

  private updateRateLimitInfo(apiName: string, responseHeaders: Headers): void {
    const rateLimitInfo: RateLimitInfo = {
      apiName,
      isLimited: false
    };

    // Check various rate limit headers
    const remaining = responseHeaders.get('X-RateLimit-Remaining');
    const limit = responseHeaders.get('X-RateLimit-Limit');
    const reset = responseHeaders.get('X-RateLimit-Reset');
    const retryAfter = responseHeaders.get('Retry-After');

    if (remaining !== null) {
      rateLimitInfo.requestsRemaining = parseInt(remaining, 10);
      rateLimitInfo.isLimited = rateLimitInfo.requestsRemaining === 0;
    }

    if (limit !== null) {
      rateLimitInfo.requestsPerMinute = parseInt(limit, 10);
    }

    if (retryAfter !== null) {
      rateLimitInfo.retryAfter = parseInt(retryAfter, 10);
      rateLimitInfo.isLimited = true;
    }

    // Google-specific headers
    const quotaUser = responseHeaders.get('X-Goog-Quota-User');
    if (quotaUser) {
      rateLimitInfo.limitType = 'user';
    }

    this.rateLimits.set(apiName, rateLimitInfo);
  }

  private updateQuotaInfo(apiName: string, responseHeaders: Headers): void {
    // Google APIs sometimes include quota information in headers
    const quotaUsed = responseHeaders.get('X-Goog-Quota-Used');
    const quotaLimit = responseHeaders.get('X-Goog-Quota-Limit');

    if (quotaUsed && quotaLimit) {
      const used = parseInt(quotaUsed, 10);
      const limit = parseInt(quotaLimit, 10);
      
      const quotaInfo: ApiQuotaInfo = {
        apiName,
        quotaUsed: used,
        quotaLimit: limit,
        quotaRemaining: limit - used
      };

      const resetTime = responseHeaders.get('X-Goog-Quota-Reset');
      if (resetTime) {
        quotaInfo.resetTime = new Date(resetTime);
      }

      this.quotaInfo.set(apiName, quotaInfo);
    } else {
      // Use default/estimated quota info if headers not available
      const defaultLimit = this.API_RATE_LIMITS[apiName as keyof typeof this.API_RATE_LIMITS] || 1000;
      const currentQuota = this.quotaInfo.get(apiName);
      
      if (currentQuota) {
        currentQuota.quotaUsed += 1;
        currentQuota.quotaRemaining = Math.max(0, currentQuota.quotaLimit - currentQuota.quotaUsed);
      } else {
        this.quotaInfo.set(apiName, {
          apiName,
          quotaUsed: 1,
          quotaLimit: defaultLimit,
          quotaRemaining: defaultLimit - 1
        });
      }
    }
  }

  private extractStatusCode(error: any): number {
    // Try to extract status code from various error formats
    if (error.status) return error.status;
    if (error.statusCode) return error.statusCode;
    if (error.code === 'ENOTFOUND') return 0; // Network error
    if (error.code === 'ECONNRESET') return 0; // Connection reset
    if (error.message?.includes('timeout')) return 408; // Timeout
    
    return 500; // Default to server error
  }
}

/**
 * Utility function to create a monitored Google API client
 */
export function createMonitoredGoogleApi(
  apiMonitor: ApiMonitor,
  googleApiClient: any,
  apiName: string
): any {
  // Create a proxy that wraps all methods with monitoring
  return new Proxy(googleApiClient, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);
      
      if (typeof originalValue === 'function') {
        return function(...args: any[]) {
          // Wrap the API call with monitoring
          return apiMonitor.wrapApiCall(
            apiName,
            String(prop),
            'google-api-call',
            () => originalValue.apply(target, args)
          );
        };
      }
      
      return originalValue;
    }
  });
}