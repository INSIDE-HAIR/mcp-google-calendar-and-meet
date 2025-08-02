# 📊 Monitoring and Health Checks

Google Meet MCP Server v3.0 includes a comprehensive monitoring system for production deployments, providing health checks, performance metrics, and operational visibility with enhanced enterprise features. Monitors all 23 validated tools across Calendar API v3 and Meet API v2.

## 🚀 Quick Start

### Enable Monitoring

Monitoring is enabled by default. To configure:

```bash
# Enable/disable health check endpoints (default: disabled in production)
export ENABLE_HEALTH_CHECK=true

# Set health check port (default: 9090)
export HEALTH_CHECK_PORT=9090

# Enable monitoring and debugging (comprehensive logging)
export LOG_LEVEL=debug

# Optional: Basic authentication for monitoring endpoints
export MONITORING_USERNAME="admin"
export MONITORING_PASSWORD="secure-password"
```

### Start Server with Monitoring

```bash
# Standard startup with direct token authentication (v3.0)
export CLIENT_ID="your-client-id.apps.googleusercontent.com"
export CLIENT_SECRET="GOCSPX-your-client-secret"
export REFRESH_TOKEN="1//your-refresh-token"
export ENABLE_HEALTH_CHECK=true
export LOG_LEVEL=debug
npm start

# Legacy file-based authentication
G_OAUTH_CREDENTIALS="/path/to/credentials.json" ENABLE_HEALTH_CHECK=true LOG_LEVEL=debug npm start

# With custom monitoring configuration
ENABLE_HEALTH_CHECK=true HEALTH_CHECK_PORT=9090 npm start
```

The server will display:
```
Google Meet MCP Server v3.0 starting...
✅ Direct token authentication successful
✅ 23 tools registered successfully
🔍 Health check endpoint available at http://localhost:9090/health
📊 Metrics endpoint available at http://localhost:9090/metrics
Google Meet MCP server connected
```

## 🚀 New in v3.0

### Enhanced Production Features
- **23 Tool Validation**: Complete Zod validation for all Calendar v3 and Meet v2 tools
- **Direct Token Authentication**: Simplified authentication using CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
- **TypeScript Production Build**: Compiled JavaScript for optimal performance
- **Advanced Error Tracking**: Categorized error handling with business logic validation
- **Rate Limit Intelligence**: Smart detection and retry recommendations
- **Memory Monitoring**: Enhanced system resource tracking
- **API Performance Analytics**: Detailed Google API call monitoring

### Enterprise Monitoring
- **Container-Ready Health Checks**: Kubernetes/Docker liveness and readiness probes
- **Prometheus Metrics**: Production-grade metrics in Prometheus format
- **CORS Support**: Web dashboard integration capability
- **Basic Authentication**: Secure monitoring endpoint access
- **Comprehensive Alerting**: Ready-to-use alert configurations

### Debug Modes and Monitoring Integration
Google Meet MCP Server v3.0 integrates comprehensive debugging capabilities with the monitoring system:

#### **LOG_LEVEL Modes**
```bash
# DEBUG Mode - Complete operation logging
export LOG_LEVEL=debug
# - Logs all API calls with request/response details
# - Shows authentication flow steps
# - Displays tool validation details
# - Tracks performance metrics in real-time

# INFO Mode - Standard operational logging (default)
export LOG_LEVEL=info
# - Key operation confirmations
# - Authentication status updates
# - Tool registration confirmations
# - Error notifications

# WARN Mode - Warnings and errors only
export LOG_LEVEL=warn
# - Authentication warnings
# - API rate limit notifications
# - Performance degradation alerts
# - Non-critical errors

# ERROR Mode - Critical errors only
export LOG_LEVEL=error
# - Authentication failures
# - API connection errors
# - Tool execution failures
# - System-level errors
```

#### **Health Check Integration with Debugging**
When `ENABLE_HEALTH_CHECK=true` and `LOG_LEVEL=debug` are combined:
- Real-time monitoring data is exposed via HTTP endpoints
- Detailed health status includes authentication state
- API call performance is tracked and exposed
- Debug logs correlate with monitoring metrics

#### **Monitoring Endpoints for Claude Desktop Debugging**
```bash
# Monitor live status while using Claude Desktop
curl http://localhost:9090/health
# Shows: OAuth status, API connectivity, tool availability

# Track real-time metrics during Claude interactions
curl http://localhost:9090/metrics  
# Shows: Request counts, response times, error rates per tool

# Debug API performance issues
curl http://localhost:9090/api-status
# Shows: Individual API health, rate limits, quota usage

# Monitor system resources during heavy usage
curl http://localhost:9090/system
# Shows: Memory usage, CPU utilization, uptime
```

## 📈 Available Endpoints

### Health Check Endpoints

#### `/health` - Comprehensive Health Check
```bash
curl http://localhost:9090/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-01T12:00:00.000Z",
  "version": "3.0.0",
  "uptime": 3600,
  "memory": {
    "rss": 45678592,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1234567
  },
  "auth": {
    "status": "healthy",
    "token_valid": true,
    "expires_in": 3240,
    "scopes_granted": [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/meetings.space.created"
    ]
  },
  "apis": {
    "calendar_api": {
      "status": "healthy",
      "response_time_ms": 150,
      "last_success": "2025-08-01T12:00:00.000Z",
      "error_count": 0
    },
    "meet_api": {
      "status": "healthy",
      "response_time_ms": 200,
      "last_success": "2025-08-01T12:00:00.000Z",
      "error_count": 0
    },
    "overall_status": "healthy"
  },
  "dependencies": [
    {
      "name": "nodejs",
      "status": "healthy",
      "type": "service",
      "details": {
        "version": "v18.17.0",
        "platform": "darwin",
        "arch": "x64"
      }
    }
  ]
}
```

**Status Values:**
- `healthy` - All systems operational
- `degraded` - Some issues but still functional
- `unhealthy` - Critical issues, service may not work properly

#### `/health/live` - Liveness Probe
```bash
curl http://localhost:9090/health/live
```

Simple check for Kubernetes liveness probes:
```json
{
  "status": "alive",
  "timestamp": "2025-08-01T12:00:00.000Z",
  "uptime": 3600
}
```

#### `/health/ready` - Readiness Probe
```bash
curl http://localhost:9090/health/ready
```

Check if service is ready to accept requests:
```json
{
  "status": "ready",
  "timestamp": "2025-08-01T12:00:00.000Z",
  "health_status": "healthy",
  "auth_valid": true,
  "apis_available": true
}
```

### Metrics Endpoints

#### `/metrics` - JSON Metrics
```bash
curl http://localhost:9090/metrics
```

**Response:**
```json
{
  "requests_total": 1250,
  "requests_per_minute": 15,
  "errors_total": 23,
  "error_rate": 1.84,
  "avg_response_time": 275.5,
  "google_api_calls": 890,
  "active_tokens": 1,
  "tool_usage": {
    "calendar_v3_list_events": {
      "name": "calendar_v3_list_events",
      "total_calls": 450,
      "successful_calls": 445,
      "failed_calls": 5,
      "avg_duration_ms": 180.2,
      "min_duration_ms": 85,
      "max_duration_ms": 1200,
      "last_called": "2025-08-01T12:00:00.000Z",
      "error_rate": 1.11
    },
    "meet_v2_create_space": {
      "name": "meet_v2_create_space",
      "total_calls": 125,
      "successful_calls": 123,
      "failed_calls": 2,
      "avg_duration_ms": 340.5,
      "min_duration_ms": 180,
      "max_duration_ms": 850,
      "last_called": "2025-08-01T11:58:00.000Z",
      "error_rate": 1.6
    }
    // ... metrics for all 23 tools available
  },
  "api_performance": {
    "calendar": {
      "api_name": "calendar",
      "total_calls": 890,
      "successful_calls": 875,
      "failed_calls": 15,
      "avg_response_time": 145.7,
      "last_call": "2025-08-01T12:00:00.000Z",
      "rate_limit_hits": 2,
      "quota_usage": 0
    }
  },
  "system_metrics": {
    "uptime_seconds": 7200,
    "memory_usage_mb": 45,
    "memory_usage_percent": 75,
    "cpu_usage_percent": 0,
    "active_connections": 1,
    "health_status": "healthy"
  }
}
```

#### `/metrics/prometheus` - Prometheus Format
```bash
curl http://localhost:9090/metrics/prometheus
```

**Response:**
```
# HELP gmcp_requests_total Total number of MCP requests
# TYPE gmcp_requests_total counter
gmcp_requests_total 1250

# HELP gmcp_requests_per_minute Requests per minute
# TYPE gmcp_requests_per_minute gauge
gmcp_requests_per_minute 15

# HELP gmcp_tool_calls_total Total tool calls
# TYPE gmcp_tool_calls_total counter
gmcp_tool_calls_total{tool="calendar_v3_list_events"} 450

# HELP gmcp_tool_duration_avg_ms Average tool duration
# TYPE gmcp_tool_duration_avg_ms gauge
gmcp_tool_duration_avg_ms{tool="calendar_v3_list_events"} 180.2
```

### API Status Endpoints

#### `/api/status` - API Health Overview
```bash
curl http://localhost:9090/api/status
```

**Response:**
```json
{
  "timestamp": "2025-08-01T12:00:00.000Z",
  "overall_status": "healthy",
  "apis": {
    "calendar": {
      "status": "healthy",
      "last_success": "2025-08-01T12:00:00.000Z",
      "error_count": 0,
      "performance": {
        "rate_limit": {
          "is_limited": false,
          "requests_remaining": 950
        },
        "quota": {
          "used": 50,
          "limit": 1000,
          "remaining": 950,
          "usage_percent": 5
        }
      }
    }
  },
  "active_calls": 3
}
```

#### `/api/performance` - Detailed Performance
```bash
curl http://localhost:9090/api/performance
```

Includes recent events, active calls, and detailed performance metrics.

## 🔧 Configuration

### Environment Variables

```bash
# Health check configuration (v3.0)
ENABLE_HEALTH_CHECK=true        # Enable/disable health check endpoints
HEALTH_CHECK_PORT=9090          # Port for health check endpoints
LOG_LEVEL=debug                 # Logging level (debug, info, warn, error)

# Authentication configuration (v3.0 - two methods)
# Method 1: Direct Token Authentication (Recommended)
CLIENT_ID="client-id.apps.googleusercontent.com"
CLIENT_SECRET="GOCSPX-client-secret"
REFRESH_TOKEN="1//refresh-token"

# Method 2: File-based Authentication (Legacy)
G_OAUTH_CREDENTIALS="/path/to/credentials.json"

# Optional monitoring features
MONITORING_USERNAME=admin       # Basic auth username (optional)
MONITORING_PASSWORD=secret      # Basic auth password (optional)
HEALTH_CHECK_TIMEOUT=5000       # Health check timeout in ms
HEALTH_CHECK_INTERVAL=30000     # Health check interval in ms

# Debug modes
DEBUG_CALENDAR_API=true         # Debug Calendar API calls only
DEBUG_MEET_API=true             # Debug Meet API calls only
```

### Programmatic Configuration

```typescript
import { HealthChecker, MetricsCollector, ApiMonitor } from './monitoring';

// Custom health check configuration
const healthChecker = new HealthChecker(oauthClient, {
  timeout: 10000,
  checkIntervalMs: 60000,
  unhealthyThreshold: 10,
  degradedThreshold: 5
});

// Custom monitoring endpoints
const monitoringEndpoints = new MonitoringEndpoints(
  healthChecker,
  metricsCollector,
  apiMonitor,
  {
    port: 9090,
    host: '0.0.0.0',
    enableCors: true,
    basicAuth: {
      username: 'monitor',
      password: 'secure123'
    }
  }
);
```

## 📊 Monitoring Integration

### Prometheus Setup

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'google-meet-mcp'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics/prometheus'
    scrape_interval: 15s
    basic_auth:
      username: 'admin'
      password: 'secure-password'
```

### Grafana Dashboard

Import the provided Grafana dashboard (coming soon) or create custom panels:

**Key Metrics to Monitor:**
- Request rate: `gmcp_requests_per_minute`
- Error rate: `gmcp_error_rate`
- Response times: `gmcp_avg_response_time_ms`
- API health: `gmcp_api_calls_total`
- Tool usage: `gmcp_tool_calls_total`

### Kubernetes Health Checks

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: google-meet-mcp
    image: google-meet-mcp:latest
    ports:
    - containerPort: 3001
      name: monitoring
    livenessProbe:
      httpGet:
        path: /health/live
        port: 3001
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3001
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health/live || exit 1
```

## 🚨 Alerting

### Recommended Alerts

#### Critical Alerts
```yaml
# Service is down
- alert: GoogleMeetMCPDown
  expr: up{job="google-meet-mcp"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Google Meet MCP Server is down"

# High error rate
- alert: GoogleMeetMCPHighErrorRate
  expr: gmcp_error_rate > 10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate in Google Meet MCP Server"
```

#### Warning Alerts
```yaml
# Token expiring soon
- alert: GoogleMeetMCPTokenExpiring
  expr: gmcp_auth_token_expires_seconds < 300
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "OAuth token expiring in less than 5 minutes"

# API rate limiting
- alert: GoogleMeetMCPRateLimited
  expr: gmcp_api_rate_limit_hits > 0
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "Google APIs are being rate limited"
```

### Slack/Teams Integration

Use Prometheus Alertmanager or custom webhooks:

```bash
# Webhook for critical alerts
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
  -H 'Content-type: application/json' \
  --data '{
    "text": "🚨 Google Meet MCP Server is unhealthy",
    "attachments": [{
      "color": "danger",
      "fields": [{
        "title": "Status",
        "value": "unhealthy",
        "short": true
      }]
    }]
  }'
```

## 📋 Troubleshooting

### Common Issues

#### 1. Monitoring Port Already in Use
```bash
# Check what's using the port
lsof -i :3001

# Use a different port
MONITORING_PORT=3002 npm start
```

#### 2. Health Check Timeouts
```bash
# Increase timeout
export HEALTH_CHECK_TIMEOUT=10000
```

#### 3. Authentication Failures
```bash
# Check OAuth token status
curl http://localhost:3001/health | jq '.auth'

# Refresh tokens manually
npm run setup
```

#### 4. High Memory Usage
```bash
# Check memory metrics
curl http://localhost:3001/metrics | jq '.system_metrics'

# Monitor memory trends
watch -n 5 'curl -s http://localhost:3001/metrics | jq ".system_metrics.memory_usage_mb"'
```

### Debug Mode

Enable detailed logging:

```bash
# Enable debug logs
DEBUG=monitoring:* npm start

# Check recent events
curl http://localhost:3001/api/performance | jq '.recent_events'
```

### Monitoring the Monitor

Set up monitoring for your monitoring endpoints:

```bash
# External health check
curl -f http://your-server:3001/health/live || echo "Monitoring is down!"

# Automated monitoring check
*/5 * * * * curl -f http://localhost:3001/health/live > /dev/null 2>&1 || echo "Alert: Monitoring down" | mail admin@company.com
```

## 🎯 Best Practices

### 1. Monitoring Strategy
- Use liveness probes for container orchestration
- Use readiness probes for load balancer health checks
- Set up comprehensive alerting for critical metrics
- Monitor both service health and business metrics

### 2. Security
- Always use HTTPS in production
- Enable basic authentication for monitoring endpoints
- Restrict monitoring endpoint access to internal networks
- Rotate monitoring credentials regularly

### 3. Performance
- Set appropriate check intervals (not too frequent)
- Use efficient health check endpoints (`/health/live` vs `/health`)
- Monitor resource usage of monitoring itself
- Implement proper timeout values

### 4. Operational Excellence
- Document your alerting runbooks
- Test monitoring and alerting regularly
- Keep monitoring configuration in version control
- Monitor the monitoring system itself

## 📚 API Reference

### Health Status Values
- `healthy`: All systems operational
- `degraded`: Minor issues, service still functional
- `unhealthy`: Critical issues, service may not work

### Metric Types
- `counter`: Monotonically increasing values (requests, errors)
- `gauge`: Current value that can go up or down (memory, connections)
- `histogram`: Distribution of values (response times)

### Error Codes
- `200`: Healthy/Ready
- `503`: Unhealthy/Not Ready
- `401`: Authentication required
- `404`: Endpoint not found
- `500`: Internal monitoring error

---

## 🔗 Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Main project documentation
- [API Documentation](../README.md) - API usage guide
- [Development Guide](./DEVELOPMENT.md) - Development setup
- [Production Deployment](./DEPLOYMENT.md) - Production setup guide