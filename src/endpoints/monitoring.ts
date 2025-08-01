/**
 * Monitoring HTTP Endpoints for Google Meet MCP Server
 * Provides health check and metrics endpoints for monitoring systems
 */

import http from 'http';
import { URL } from 'url';
import { HealthChecker, HealthStatus } from '../monitoring/healthCheck.js';
import { MetricsCollector, MetricsData } from '../monitoring/metrics.js';
import { ApiMonitor } from '../monitoring/apiMonitor.js';

export interface MonitoringEndpointConfig {
  port: number;
  host?: string;
  enableCors?: boolean;
  basicAuth?: {
    username: string;
    password: string;
  };
}

export class MonitoringEndpoints {
  private server?: http.Server;
  private healthChecker: HealthChecker;
  private metricsCollector: MetricsCollector;
  private apiMonitor: ApiMonitor;
  private config: MonitoringEndpointConfig;

  constructor(
    healthChecker: HealthChecker,
    metricsCollector: MetricsCollector,
    apiMonitor: ApiMonitor,
    config: MonitoringEndpointConfig
  ) {
    this.healthChecker = healthChecker;
    this.metricsCollector = metricsCollector;
    this.apiMonitor = apiMonitor;
    this.config = {
      host: '0.0.0.0',
      enableCors: true,
      ...config
    };
  }

  /**
   * Start the monitoring HTTP server
   */
  async start(): Promise<void> {
    if (this.server) {
      throw new Error('Monitoring server is already running');
    }

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch(error => {
        console.error('Error handling monitoring request:', error);
        this.sendErrorResponse(res, 500, 'Internal Server Error');
      });
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(this.config.port, this.config.host, () => {
        console.log(`Monitoring endpoints available at http://${this.config.host}:${this.config.port}`);
        resolve();
      });

      this.server!.on('error', reject);
    });
  }

  /**
   * Stop the monitoring HTTP server
   */
  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.server = undefined;
        resolve();
      });
    });
  }

  /**
   * Check if the server is running
   */
  isRunning(): boolean {
    return !!this.server?.listening;
  }

  // Private methods

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Set CORS headers if enabled
    if (this.config.enableCors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      this.sendErrorResponse(res, 405, 'Method Not Allowed');
      return;
    }

    // Check basic auth if configured
    if (this.config.basicAuth && !this.checkBasicAuth(req)) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Monitoring"');
      this.sendErrorResponse(res, 401, 'Unauthorized');
      return;
    }

    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathname = url.pathname;

    try {
      switch (pathname) {
        case '/health':
          await this.handleHealthCheck(res);
          break;
        case '/health/live':
          await this.handleLivenessCheck(res);
          break;
        case '/health/ready':
          await this.handleReadinessCheck(res);
          break;
        case '/metrics':
          await this.handleMetrics(res);
          break;
        case '/metrics/prometheus':
          await this.handlePrometheusMetrics(res);
          break;
        case '/api/status':
          await this.handleApiStatus(res);
          break;
        case '/api/performance':
          await this.handleApiPerformance(res);
          break;
        case '/':
          await this.handleRootEndpoint(res);
          break;
        default:
          this.sendErrorResponse(res, 404, 'Not Found');
      }
    } catch (error) {
      console.error(`Error handling ${pathname}:`, error);
      this.sendErrorResponse(res, 500, 'Internal Server Error');
    }
  }

  private async handleHealthCheck(res: http.ServerResponse): Promise<void> {
    const health = await this.healthChecker.getHealthStatus();
    const statusCode = this.getStatusCodeFromHealth(health.status);
    
    this.sendJsonResponse(res, statusCode, health);
  }

  private async handleLivenessCheck(res: http.ServerResponse): Promise<void> {
    // Simple liveness check - just check if the process is running
    const response = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
    
    this.sendJsonResponse(res, 200, response);
  }

  private async handleReadinessCheck(res: http.ServerResponse): Promise<void> {
    const health = await this.healthChecker.getHealthStatus();
    const isReady = health.status === 'healthy' || health.status === 'degraded';
    
    const response = {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      health_status: health.status,
      auth_valid: health.auth.token_valid,
      apis_available: health.apis.overall_status !== 'unhealthy'
    };
    
    const statusCode = isReady ? 200 : 503;
    this.sendJsonResponse(res, statusCode, response);
  }

  private async handleMetrics(res: http.ServerResponse): Promise<void> {
    const metrics = this.metricsCollector.getMetrics();
    this.sendJsonResponse(res, 200, metrics);
  }

  private async handlePrometheusMetrics(res: http.ServerResponse): Promise<void> {
    const prometheusMetrics = this.metricsCollector.getPrometheusMetrics();
    
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.writeHead(200);
    res.end(prometheusMetrics);
  }

  private async handleApiStatus(res: http.ServerResponse): Promise<void> {
    const health = await this.healthChecker.getHealthStatus();
    const performance = this.apiMonitor.getApiPerformanceSummary();
    
    const response = {
      timestamp: new Date().toISOString(),
      overall_status: health.apis.overall_status,
      apis: {
        calendar: {
          status: health.apis.calendar_api.status,
          last_success: health.apis.calendar_api.last_success,
          error_count: health.apis.calendar_api.error_count,
          performance: performance.calendar
        },
        meet: {
          status: health.apis.meet_api.status,
          last_success: health.apis.meet_api.last_success,
          error_count: health.apis.meet_api.error_count,
          performance: performance.meet
        }
      },
      active_calls: this.apiMonitor.getActiveCalls().length
    };
    
    this.sendJsonResponse(res, 200, response);
  }

  private async handleApiPerformance(res: http.ServerResponse): Promise<void> {
    const performanceSummary = this.apiMonitor.getApiPerformanceSummary();
    const metrics = this.metricsCollector.getMetrics();
    
    const response = {
      timestamp: new Date().toISOString(),
      overall_performance: {
        avg_response_time: metrics.avg_response_time,
        requests_per_minute: metrics.requests_per_minute,
        error_rate: metrics.error_rate,
        total_api_calls: metrics.google_api_calls
      },
      api_details: performanceSummary,
      active_calls: this.apiMonitor.getActiveCalls(),
      recent_events: this.metricsCollector.getRecentEvents(20)
    };
    
    this.sendJsonResponse(res, 200, response);
  }

  private async handleRootEndpoint(res: http.ServerResponse): Promise<void> {
    const health = await this.healthChecker.getHealthStatus();
    
    const response = {
      service: 'Google Meet MCP Server',
      version: health.version,
      status: health.status,
      uptime: health.uptime,
      endpoints: {
        health: '/health - Comprehensive health check',
        liveness: '/health/live - Liveness probe',
        readiness: '/health/ready - Readiness probe',
        metrics: '/metrics - JSON metrics',
        prometheus: '/metrics/prometheus - Prometheus format',
        api_status: '/api/status - API status overview',
        api_performance: '/api/performance - Detailed API performance'
      }
    };
    
    this.sendJsonResponse(res, 200, response);
  }

  private checkBasicAuth(req: http.IncomingMessage): boolean {
    if (!this.config.basicAuth) {
      return true;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    return username === this.config.basicAuth.username && 
           password === this.config.basicAuth.password;
  }

  private getStatusCodeFromHealth(status: string): number {
    switch (status) {
      case 'healthy':
        return 200;
      case 'degraded':
        return 200; // Still operational
      case 'unhealthy':
        return 503; // Service unavailable
      default:
        return 500;
    }
  }

  private sendJsonResponse(res: http.ServerResponse, statusCode: number, data: any): void {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(JSON.stringify(data, null, 2));
  }

  private sendErrorResponse(res: http.ServerResponse, statusCode: number, message: string): void {
    const errorResponse = {
      error: message,
      status: statusCode,
      timestamp: new Date().toISOString()
    };
    
    this.sendJsonResponse(res, statusCode, errorResponse);
  }
}

/**
 * Utility function to create monitoring endpoints with default configuration
 */
export function createMonitoringEndpoints(
  healthChecker: HealthChecker,
  metricsCollector: MetricsCollector,
  apiMonitor: ApiMonitor,
  port = 3001
): MonitoringEndpoints {
  const config: MonitoringEndpointConfig = {
    port,
    host: '0.0.0.0',
    enableCors: true
  };

  // Add basic auth if credentials are provided via environment
  if (process.env.MONITORING_USERNAME && process.env.MONITORING_PASSWORD) {
    config.basicAuth = {
      username: process.env.MONITORING_USERNAME,
      password: process.env.MONITORING_PASSWORD
    };
  }

  return new MonitoringEndpoints(
    healthChecker,
    metricsCollector,
    apiMonitor,
    config
  );
}