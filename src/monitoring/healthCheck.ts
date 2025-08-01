/**
 * Health Check System for Google Meet MCP Server
 * Provides comprehensive system health monitoring
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  auth: AuthHealthStatus;
  apis: ApiHealthStatus;
  dependencies: DependencyHealth[];
}

export interface AuthHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  token_valid: boolean;
  expires_in?: number;
  scopes_granted?: string[];
  error?: string;
}

export interface ApiHealthStatus {
  calendar_api: ApiEndpointHealth;
  meet_api: ApiEndpointHealth;
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ApiEndpointHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms?: number;
  last_success?: string;
  last_error?: string;
  error_count: number;
}

export interface DependencyHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  type: 'service' | 'database' | 'api' | 'file';
  details?: Record<string, any>;
}

export interface HealthCheckConfig {
  timeout: number;
  checkIntervalMs: number;
  unhealthyThreshold: number;
  degradedThreshold: number;
}

export class HealthChecker {
  private config: HealthCheckConfig;
  private oauth2Client: any;
  private lastHealthCheck?: HealthStatus;
  private errorCounts: Map<string, number> = new Map();
  private lastSuccessTime: Map<string, Date> = new Map();

  constructor(
    oauth2Client: any,
    config: Partial<HealthCheckConfig> = {}
  ) {
    this.oauth2Client = oauth2Client;
    this.config = {
      timeout: config.timeout || 5000,
      checkIntervalMs: config.checkIntervalMs || 30000,
      unhealthyThreshold: config.unhealthyThreshold || 5,
      degradedThreshold: config.degradedThreshold || 2,
      ...config
    };
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const [authHealth, apiHealth, dependencies] = await Promise.allSettled([
        this.checkAuthHealth(),
        this.checkApiHealth(),
        this.checkDependencies()
      ]);

      const healthStatus: HealthStatus = {
        status: this.calculateOverallStatus([
          this.extractResult(authHealth)?.status || 'unhealthy',
          this.extractResult(apiHealth)?.overall_status || 'unhealthy'
        ]),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '3.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        auth: this.extractResult(authHealth) || this.getUnhealthyAuthStatus(),
        apis: this.extractResult(apiHealth) || this.getUnhealthyApiStatus(),
        dependencies: this.extractResult(dependencies) || []
      };

      this.lastHealthCheck = healthStatus;
      return healthStatus;

    } catch (error) {
      return this.getEmergencyHealthStatus(error as Error);
    }
  }

  /**
   * Check OAuth authentication health
   */
  private async checkAuthHealth(): Promise<AuthHealthStatus> {
    try {
      if (!this.oauth2Client) {
        return {
          status: 'unhealthy',
          token_valid: false,
          error: 'OAuth2 client not initialized'
        };
      }

      // Try to get access token (this will refresh if needed)
      const tokenResponse = await Promise.race([
        this.oauth2Client.getAccessToken(),
        this.createTimeoutPromise(this.config.timeout, 'Token check timeout')
      ]);

      if (!tokenResponse.token) {
        return {
          status: 'unhealthy',
          token_valid: false,
          error: 'No access token available'
        };
      }

      // Calculate token expiry
      const credentials = this.oauth2Client.credentials;
      const expiresIn = credentials.expiry_date 
        ? Math.max(0, Math.floor((credentials.expiry_date - Date.now()) / 1000))
        : undefined;

      // Check if token is about to expire (less than 5 minutes)
      const status = expiresIn && expiresIn < 300 ? 'degraded' : 'healthy';

      return {
        status,
        token_valid: true,
        expires_in: expiresIn,
        scopes_granted: this.extractScopesFromCredentials(credentials)
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        token_valid: false,
        error: error instanceof Error ? error.message : 'Unknown auth error'
      };
    }
  }

  /**
   * Check Google APIs health
   */
  private async checkApiHealth(): Promise<ApiHealthStatus> {
    const [calendarResult, meetResult] = await Promise.allSettled([
      this.checkCalendarApi(),
      this.checkMeetApi()
    ]);

    const calendarHealth = this.extractResult(calendarResult) || this.getUnhealthyEndpointStatus();
    const meetHealth = this.extractResult(meetResult) || this.getUnhealthyEndpointStatus();

    const overallStatus = this.calculateOverallStatus([
      calendarHealth.status,
      meetHealth.status
    ]);

    return {
      calendar_api: calendarHealth,
      meet_api: meetHealth,
      overall_status: overallStatus
    };
  }

  /**
   * Check Calendar API health
   */
  private async checkCalendarApi(): Promise<ApiEndpointHealth> {
    const apiName = 'calendar_api';
    const startTime = Date.now();

    try {
      // Simple API call to check health
      const response = await Promise.race([
        fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`
          }
        }),
        this.createTimeoutPromise<Response>(this.config.timeout, 'Calendar API timeout')
      ]);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        this.resetErrorCount(apiName);
        this.lastSuccessTime.set(apiName, new Date());
        
        return {
          status: 'healthy',
          response_time_ms: responseTime,
          last_success: new Date().toISOString(),
          error_count: 0
        };
      } else {
        this.incrementErrorCount(apiName);
        const status = this.getStatusFromErrorCount(apiName);
        
        return {
          status,
          response_time_ms: responseTime,
          last_error: `HTTP ${response.status}: ${response.statusText}`,
          error_count: this.errorCounts.get(apiName) || 0
        };
      }

    } catch (error) {
      this.incrementErrorCount(apiName);
      const status = this.getStatusFromErrorCount(apiName);
      
      return {
        status,
        response_time_ms: Date.now() - startTime,
        last_error: error instanceof Error ? error.message : 'Unknown error',
        error_count: this.errorCounts.get(apiName) || 0
      };
    }
  }

  /**
   * Check Meet API health
   */
  private async checkMeetApi(): Promise<ApiEndpointHealth> {
    const apiName = 'meet_api';
    const startTime = Date.now();

    try {
      // Simple API call to check health - try to list conference records with limit 1
      const response = await Promise.race([
        fetch('https://meet.googleapis.com/v2/conferenceRecords?pageSize=1', {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`
          }
        }),
        this.createTimeoutPromise<Response>(this.config.timeout, 'Meet API timeout')
      ]);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        this.resetErrorCount(apiName);
        this.lastSuccessTime.set(apiName, new Date());
        
        return {
          status: 'healthy',
          response_time_ms: responseTime,
          last_success: new Date().toISOString(),
          error_count: 0
        };
      } else {
        this.incrementErrorCount(apiName);
        const status = this.getStatusFromErrorCount(apiName);
        
        return {
          status,
          response_time_ms: responseTime,
          last_error: `HTTP ${response.status}: ${response.statusText}`,
          error_count: this.errorCounts.get(apiName) || 0
        };
      }

    } catch (error) {
      this.incrementErrorCount(apiName);
      const status = this.getStatusFromErrorCount(apiName);
      
      return {
        status,
        response_time_ms: Date.now() - startTime,
        last_error: error instanceof Error ? error.message : 'Unknown error',
        error_count: this.errorCounts.get(apiName) || 0
      };
    }
  }

  /**
   * Check system dependencies
   */
  private async checkDependencies(): Promise<DependencyHealth[]> {
    const dependencies: DependencyHealth[] = [];

    // Check Node.js version
    dependencies.push({
      name: 'nodejs',
      status: 'healthy',
      type: 'service',
      details: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });

    // Check memory usage
    const memory = process.memoryUsage();
    const memoryStatus = memory.heapUsed / memory.heapTotal > 0.9 ? 'degraded' : 'healthy';
    
    dependencies.push({
      name: 'memory',
      status: memoryStatus,
      type: 'service',
      details: {
        heap_used_mb: Math.round(memory.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memory.heapTotal / 1024 / 1024),
        heap_usage_percent: Math.round((memory.heapUsed / memory.heapTotal) * 100)
      }
    });

    // Check file system access
    try {
      await import('fs/promises').then(fs => fs.access('.', fs.constants.R_OK));
      dependencies.push({
        name: 'filesystem',
        status: 'healthy',
        type: 'file'
      });
    } catch (error) {
      dependencies.push({
        name: 'filesystem',
        status: 'unhealthy',
        type: 'file',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    return dependencies;
  }

  /**
   * Get the last cached health status (useful for quick checks)
   */
  getLastHealthStatus(): HealthStatus | undefined {
    return this.lastHealthCheck;
  }

  /**
   * Simple health check that returns just the status
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  // Private helper methods

  private async getAccessToken(): Promise<string> {
    const tokenResponse = await this.oauth2Client.getAccessToken();
    return tokenResponse.token;
  }

  private createTimeoutPromise<T>(timeoutMs: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    });
  }

  private extractResult<T>(settledResult: PromiseSettledResult<T>): T | null {
    return settledResult.status === 'fulfilled' ? settledResult.value : null;
  }

  private calculateOverallStatus(statuses: string[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    if (statuses.some(s => s === 'degraded')) return 'degraded';
    return 'healthy';
  }

  private extractScopesFromCredentials(credentials: any): string[] {
    // Extract scopes from token if available
    if (credentials.scope) {
      return credentials.scope.split(' ');
    }
    // Return expected scopes as fallback
    return [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/meetings.space.created',
      'https://www.googleapis.com/auth/meetings.space.readonly'
    ];
  }

  private incrementErrorCount(apiName: string): void {
    const current = this.errorCounts.get(apiName) || 0;
    this.errorCounts.set(apiName, current + 1);
  }

  private resetErrorCount(apiName: string): void {
    this.errorCounts.set(apiName, 0);
  }

  private getStatusFromErrorCount(apiName: string): 'healthy' | 'degraded' | 'unhealthy' {
    const count = this.errorCounts.get(apiName) || 0;
    if (count >= this.config.unhealthyThreshold) return 'unhealthy';
    if (count >= this.config.degradedThreshold) return 'degraded';
    return 'healthy';
  }

  private getUnhealthyAuthStatus(): AuthHealthStatus {
    return {
      status: 'unhealthy',
      token_valid: false,
      error: 'Failed to check auth status'
    };
  }

  private getUnhealthyApiStatus(): ApiHealthStatus {
    return {
      calendar_api: this.getUnhealthyEndpointStatus(),
      meet_api: this.getUnhealthyEndpointStatus(),
      overall_status: 'unhealthy'
    };
  }

  private getUnhealthyEndpointStatus(): ApiEndpointHealth {
    return {
      status: 'unhealthy',
      error_count: 999,
      last_error: 'Failed to check API status'
    };
  }

  private getEmergencyHealthStatus(error: Error): HealthStatus {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '3.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      auth: {
        status: 'unhealthy',
        token_valid: false,
        error: 'System error during health check'
      },
      apis: {
        calendar_api: { status: 'unhealthy', error_count: 999 },
        meet_api: { status: 'unhealthy', error_count: 999 },
        overall_status: 'unhealthy'
      },
      dependencies: [{
        name: 'system',
        status: 'unhealthy',
        type: 'service',
        details: { error: error.message }
      }]
    };
  }
}