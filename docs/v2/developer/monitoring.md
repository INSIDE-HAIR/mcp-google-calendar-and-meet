# 📊 Monitoring Guide - Google Meet MCP Server v3.0

## 📋 Overview

The Google Meet MCP Server v3.0 includes comprehensive monitoring capabilities designed for production environments. This guide covers health checks, metrics collection, performance monitoring, and alerting strategies.

## 🎯 Monitoring Architecture

### Monitoring Components
- **Health Checks**: Multi-level system health verification
- **Metrics Collection**: Prometheus-compatible performance metrics
- **API Monitoring**: Real-time Google API status tracking
- **Error Tracking**: Comprehensive error logging and analysis
- **Resource Monitoring**: System resource usage tracking

### Monitoring Endpoints
- **Health Check**: `GET /health` - Basic health status
- **Detailed Health**: `GET /health/detailed` - Comprehensive diagnostics
- **Readiness Check**: `GET /ready` - Load balancer compatibility
- **Metrics**: `GET /metrics` - Prometheus metrics export
- **API Status**: `GET /api-status` - Google API connectivity
- **System Info**: `GET /system` - System resource information

---

## 🔍 Health Monitoring

### Basic Health Check

**Endpoint**: `GET /health`

**Response Example**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-01T10:30:00.000Z",
  "uptime": 3600,
  "version": "3.0.0",
  "oauth": "connected",
  "apis": "available"
}
```

**Health Status Values**:
- **`healthy`**: All systems operational
- **`degraded`**: Some non-critical issues detected
- **`unhealthy`**: Critical issues require attention

### Detailed Health Check

**Endpoint**: `GET /health/detailed`

**Response Example**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-01T10:30:00.000Z",
  "checks": {
    "oauth": {
      "status": "healthy",
      "lastCheck": "2024-02-01T10:29:55.000Z",
      "tokenValid": true,
      "tokenExpiry": "2024-02-01T11:29:55.000Z"
    },
    "googleApis": {
      "status": "healthy",
      "calendarApi": {
        "status": "healthy",
        "latency": 245,
        "lastSuccessfulCall": "2024-02-01T10:29:30.000Z"
      },
      "meetApi": {
        "status": "healthy", 
        "latency": 189,
        "lastSuccessfulCall": "2024-02-01T10:28:45.000Z"
      }
    },
    "system": {
      "status": "healthy",
      "memory": {
        "used": "156MB",
        "total": "512MB",
        "percentage": 30.5
      },
      "cpu": {
        "usage": 15.2,
        "load": [0.8, 0.9, 1.1]
      },
      "disk": {
        "available": "2.3GB",
        "percentage": 85
      }
    }
  }
}
```

### Readiness Check

**Endpoint**: `GET /ready`

**Purpose**: Determines if the server is ready to handle requests (used by load balancers)

**Response Example**:
```json
{
  "ready": true,
  "timestamp": "2024-02-01T10:30:00.000Z",
  "checks": {
    "oauth_initialized": true,
    "apis_accessible": true,
    "tools_registered": 23
  }
}
```

---

## 📈 Metrics Collection

### Prometheus Metrics

**Endpoint**: `GET /metrics`

**Available Metrics**:

#### Tool Usage Metrics
```prometheus
# Total tool calls
mcp_tool_calls_total{tool="calendar_v3_create_event",status="success"} 142
mcp_tool_calls_total{tool="calendar_v3_create_event",status="error"} 3

# Tool response times (histogram)
mcp_tool_duration_seconds_bucket{tool="calendar_v3_list_events",le="0.5"} 45
mcp_tool_duration_seconds_bucket{tool="calendar_v3_list_events",le="1.0"} 67
mcp_tool_duration_seconds_sum{tool="calendar_v3_list_events"} 23.4
mcp_tool_duration_seconds_count{tool="calendar_v3_list_events"} 78
```

#### API Performance Metrics
```prometheus
# Google API calls
google_api_calls_total{api="calendar",method="events.list",status="200"} 89
google_api_calls_total{api="meet",method="spaces.create",status="200"} 23

# API response times
google_api_duration_seconds{api="calendar",method="events.list"} 0.234
google_api_duration_seconds{api="meet",method="spaces.get"} 0.189

# API error rates
google_api_errors_total{api="calendar",error_code="403"} 2
google_api_errors_total{api="meet",error_code="429"} 1
```

#### System Metrics
```prometheus
# Memory usage
nodejs_heap_size_used_bytes 163840000
nodejs_heap_size_total_bytes 209715200

# Event loop lag
nodejs_eventloop_lag_seconds 0.002

# Active handles and requests
nodejs_active_handles_total 12
nodejs_active_requests_total 3

# Process uptime
process_uptime_seconds 3600
```

#### MCP Server Metrics
```prometheus
# Server status
mcp_server_status{status="healthy"} 1

# Connected clients
mcp_connected_clients_total 2

# Request processing
mcp_requests_total{method="tools/call",status="success"} 234
mcp_requests_total{method="tools/list",status="success"} 12

# Error tracking
mcp_errors_total{type="validation",severity="warning"} 5
mcp_errors_total{type="api",severity="error"} 2
```

### Custom Metrics Dashboard

**Example Grafana Query**:
```promql
# Tool success rate over time
rate(mcp_tool_calls_total{status="success"}[5m]) / 
rate(mcp_tool_calls_total[5m]) * 100

# Average API response time
avg(google_api_duration_seconds) by (api)

# Memory usage percentage
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100

# Error rate per minute
rate(mcp_errors_total[1m]) * 60
```

---

## 🔍 API Status Monitoring

### API Connectivity Check

**Endpoint**: `GET /api-status`

**Response Example**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-01T10:30:00.000Z",
  "apis": {
    "calendar": {
      "status": "healthy",
      "endpoint": "https://www.googleapis.com/calendar/v3",
      "latency": 234,
      "lastCheck": "2024-02-01T10:29:55.000Z",
      "quota": {
        "remaining": 9847,
        "limit": 10000,
        "resetTime": "2024-02-01T11:00:00.000Z"
      }
    },
    "meet": {
      "status": "healthy",
      "endpoint": "https://meet.googleapis.com/v2",
      "latency": 189,
      "lastCheck": "2024-02-01T10:29:50.000Z",
      "quota": {
        "remaining": 8923,
        "limit": 10000,
        "resetTime": "2024-02-01T11:00:00.000Z"
      }
    }
  }
}
```

### API Performance Tracking

#### Response Time Monitoring
```typescript
// Automatic API response time tracking
class APIMonitor {
  async trackAPICall<T>(
    api: string,
    method: string,
    call: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await call();
      const duration = performance.now() - start;
      
      // Record success metrics
      this.metricsCollector.recordAPICall(api, method, duration, true);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      // Record error metrics
      this.metricsCollector.recordAPICall(api, method, duration, false);
      
      throw error;
    }
  }
}
```

---

## 🚨 Error Monitoring

### Error Classification

#### Error Types
- **Validation Errors**: Input validation failures
- **Authentication Errors**: OAuth token issues
- **API Errors**: Google API call failures
- **System Errors**: Node.js runtime issues
- **Configuration Errors**: Setup or configuration problems

#### Error Severity Levels
- **Critical**: System completely non-functional
- **Error**: Major functionality broken
- **Warning**: Degraded performance or minor issues
- **Info**: Informational messages

### Error Tracking Example

**Error Log Structure**:
```json
{
  "timestamp": "2024-02-01T10:30:00.000Z",
  "level": "error",
  "type": "api_error",
  "context": "calendar_v3_create_event",
  "error": {
    "code": "403",
    "message": "Insufficient Permission",
    "googleError": {
      "domain": "calendar",
      "reason": "forbidden"
    }
  },
  "user": "user123",
  "tool": "calendar_v3_create_event",
  "requestId": "req_abc123",
  "troubleshooting": [
    "Check OAuth scopes include calendar access",
    "Verify user has write access to target calendar",
    "Confirm Google Workspace permissions"
  ]
}
```

### Error Rate Monitoring

**Grafana Alert Query**:
```promql
# Error rate > 5% over 5 minutes
(
  rate(mcp_errors_total{severity="error"}[5m]) /
  rate(mcp_requests_total[5m])
) * 100 > 5
```

---

## 📊 Performance Monitoring

### System Resource Monitoring

**Endpoint**: `GET /system`

**Response Example**:
```json
{
  "timestamp": "2024-02-01T10:30:00.000Z",
  "node": {
    "version": "v18.19.0",
    "uptime": 3600,
    "platform": "linux"
  },
  "memory": {
    "rss": 45678592,
    "heapTotal": 29491200,
    "heapUsed": 23456789,
    "external": 1234567,
    "arrayBuffers": 12345
  },
  "cpu": {
    "usage": 15.2,
    "loadAverage": [0.8, 0.9, 1.1]
  },
  "eventLoop": {
    "lag": 2.3,
    "utilization": 0.85
  },
  "gc": {
    "majorCollections": 12,
    "minorCollections": 234,
    "totalTime": 123.45
  }
}
```

### Performance Benchmarks

#### Target Performance Metrics
- **Tool Response Time**: < 2 seconds (95th percentile)
- **Memory Usage**: < 256MB (sustained)
- **CPU Usage**: < 20% (average)
- **API Latency**: < 500ms (Google APIs)
- **Error Rate**: < 1% (overall)

#### Performance Alerts
```yaml
Critical Alerts:
  - Memory usage > 400MB for 5 minutes
  - CPU usage > 80% for 2 minutes
  - Error rate > 10% for 1 minute
  - API latency > 5 seconds

Warning Alerts:
  - Memory usage > 256MB for 10 minutes
  - CPU usage > 50% for 5 minutes
  - Error rate > 5% for 5 minutes
  - API latency > 2 seconds
```

---

## 🔧 Monitoring Setup

### Development Monitoring

**Local Setup**:
```bash
# Enable health checks and metrics
export ENABLE_HEALTH_CHECK=true
export HEALTH_CHECK_PORT=9090
export LOG_LEVEL=debug

# Start server with monitoring
npm run start:dev

# Check health in separate terminal
curl http://localhost:9090/health
curl http://localhost:9090/metrics
```

**Local Monitoring Dashboard**:
```bash
# Quick health check script
#!/bin/bash
echo "🔍 MCP Server Health Check"
echo "=========================="

# Basic health
echo "📊 Basic Health:"
curl -s http://localhost:9090/health | jq .

echo -e "\n📈 System Resources:"
curl -s http://localhost:9090/system | jq '.memory, .cpu'

echo -e "\n🌐 API Status:"
curl -s http://localhost:9090/api-status | jq '.apis'
```

### Production Monitoring

#### Docker Compose with Monitoring
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  google-meet-mcp:
    image: google-meet-mcp:latest
    environment:
      - ENABLE_HEALTH_CHECK=true
      - HEALTH_CHECK_PORT=9090
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9090/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'google-meet-mcp'
    static_configs:
      - targets: ['google-meet-mcp:9090']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
```

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "Google Meet MCP Server",
    "panels": [
      {
        "title": "Tool Success Rate",
        "type": "stat",
        "targets": [{
          "expr": "rate(mcp_tool_calls_total{status=\"success\"}[5m]) / rate(mcp_tool_calls_total[5m]) * 100"
        }]
      },
      {
        "title": "API Response Times",
        "type": "graph",
        "targets": [{
          "expr": "avg(google_api_duration_seconds) by (api)"
        }]
      },
      {
        "title": "Memory Usage",
        "type": "graph", 
        "targets": [{
          "expr": "nodejs_heap_size_used_bytes / 1024 / 1024"
        }]
      }
    ]
  }
}
```

---

## 🚨 Alerting and Notifications

### Alert Rules

#### Prometheus Alert Rules
```yaml
# alert-rules.yml
groups:
  - name: google-meet-mcp
    rules:
      - alert: MCPServerDown
        expr: up{job="google-meet-mcp"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MCP Server is down"
          description: "Google Meet MCP Server has been down for more than 1 minute"

      - alert: HighErrorRate
        expr: (rate(mcp_errors_total[5m]) / rate(mcp_requests_total[5m])) * 100 > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes"

      - alert: HighMemoryUsage
        expr: nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}%"

      - alert: APILatencyHigh
        expr: avg(google_api_duration_seconds) > 2
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "Google API average latency is {{ $value }}s"
```

### Notification Channels

#### Slack Integration
```yaml
# alertmanager.yml
route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#mcp-alerts'
        title: 'MCP Server Alert'
        text: >-
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Severity:* {{ .Labels.severity }}
          {{ end }}
```

#### Email Notifications
```yaml
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'team@company.com'
        from: 'alerts@company.com'
        subject: 'MCP Server Alert: {{ .GroupLabels.alertname }}'
        body: |
          Alert Details:
          {{ range .Alerts }}
          - Summary: {{ .Annotations.summary }}
          - Description: {{ .Annotations.description }}
          - Severity: {{ .Labels.severity }}
          - Time: {{ .StartsAt }}
          {{ end }}
```

---

## 📋 Monitoring Checklist

### Daily Monitoring Tasks
- [ ] Check server health status
- [ ] Review error logs for patterns
- [ ] Monitor memory and CPU usage trends
- [ ] Verify API connectivity and latency
- [ ] Check tool success rates

### Weekly Monitoring Tasks
- [ ] Review performance trends
- [ ] Analyze error patterns and root causes
- [ ] Update alert thresholds if needed
- [ ] Check quota usage and limits
- [ ] Review system resource capacity

### Monthly Monitoring Tasks
- [ ] Generate performance reports
- [ ] Review and optimize monitoring setup
- [ ] Update monitoring documentation
- [ ] Capacity planning review
- [ ] Security audit of monitoring data

---

## 🔧 Troubleshooting Monitoring Issues

### Common Issues

#### Health Check Endpoint Not Responding
```bash
# Check if server is running
ps aux | grep tsx

# Check port availability
netstat -tlnp | grep 9090

# Test manual startup
ENABLE_HEALTH_CHECK=true HEALTH_CHECK_PORT=9090 npm run start:dev
```

#### Metrics Not Being Collected
```bash
# Verify metrics endpoint
curl http://localhost:9090/metrics

# Check Prometheus configuration
docker logs prometheus-container

# Verify scrape targets
curl http://localhost:9091/api/v1/targets
```

#### High Memory Usage Alerts
```bash
# Check Node.js heap usage
node --inspect src/index.ts

# Generate heap snapshot
kill -USR2 <pid>

# Analyze memory leaks
npm install -g clinic
clinic doctor -- node src/index.ts
```

---

**🎯 This monitoring guide provides comprehensive coverage for maintaining a healthy Google Meet MCP Server in production. Use the health checks for immediate status, metrics for trend analysis, and alerts for proactive issue resolution.**