# Docker Deployment Scenarios

Google Meet MCP Server v3.0 provides multiple Docker configurations optimized for different use cases.

## 🏠 Local Development

### Simple Local Development
```bash
# Ultra-simple setup for quick local testing
docker-compose -f docker-compose.local.yml up -d

# Features:
# ✅ Hot reload source code mounting
# ✅ Debug logging enabled
# ✅ Health check on port 9090
# ✅ Uses .env.local for credentials
# ✅ Interactive terminal support
```

### Full Local Development Stack
```bash
# Complete development environment with MongoDB and monitoring
docker-compose up -d

# Features:
# ✅ MongoDB for Next.js integration
# ✅ MongoDB Express web UI (port 8081)
# ✅ Volume persistence for development
# ✅ Resource limits optimized for development
# ✅ Source code hot reload
```

## 🚀 Smithery Deployment

### Basic Smithery Configuration
```bash
# Optimized for Smithery platform deployment
docker-compose -f docker-compose.smithery.yml up -d

# Features:
# ✅ Stateless deployment (no volumes)
# ✅ Direct token authentication via environment variables
# ✅ Minimal resource requirements (512MB memory, 1 CPU)
# ✅ Optimized logging for Smithery
# ✅ Fast startup and deployment
```

### Using Smithery-specific Dockerfile
```bash
# Use the exact Dockerfile that works with Smithery
docker build -f Dockerfile.smithery -t google-meet-mcp:smithery .
docker run -e CLIENT_ID="your-id" -e CLIENT_SECRET="your-secret" -e REFRESH_TOKEN="your-token" google-meet-mcp:smithery
```

## 🏭 Production Deployment

### Standard Production
```bash
# Production-ready deployment with optimizations
docker-compose -f docker-compose.prod.yml up -d

# Features:
# ✅ Multi-stage production build
# ✅ MongoDB with Docker secrets
# ✅ Nginx reverse proxy (optional)
# ✅ Prometheus + Grafana monitoring (optional)
# ✅ Security hardening
# ✅ Resource limits and health checks
```

### Advanced Production with Full Monitoring
```bash
# Complete production stack with comprehensive monitoring
docker-compose -f docker-compose.advanced.yml up -d

# Enable full monitoring stack
docker-compose -f docker-compose.advanced.yml --profile monitoring up -d

# Features:
# ✅ Advanced multi-stage Dockerfile
# ✅ Prometheus metrics collection (port 9092)
# ✅ Grafana dashboards (port 3001)
# ✅ AlertManager for notifications (port 9093)
# ✅ Node Exporter for system metrics (port 9100)
# ✅ Health check endpoint (port 9090)
# ✅ Metrics endpoint (port 9091)
```

## 📋 Configuration Comparison

| Scenario | File | RAM | CPU | Monitoring | Database | Best For |
|----------|------|-----|-----|------------|----------|----------|
| **Local Simple** | `docker-compose.local.yml` | 256MB | 0.5 | Basic | None | Quick testing |
| **Local Full** | `docker-compose.yml` | 512MB | 1.0 | Health check | MongoDB | Full development |
| **Smithery** | `docker-compose.smithery.yml` | 512MB | 1.0 | Basic | None | Platform deployment |
| **Production** | `docker-compose.prod.yml` | 1GB | 2.0 | Prometheus | MongoDB | Production |
| **Advanced** | `docker-compose.advanced.yml` | 1GB+ | 2.0+ | Full stack | Optional | Enterprise |

## 🛠 Environment Variables

### Direct Token Authentication (Recommended)
```bash
CLIENT_ID=your-client-id.apps.googleusercontent.com
CLIENT_SECRET=GOCSPX-your-client-secret
REFRESH_TOKEN=1//your-refresh-token
```

### File-based Authentication (Legacy)
```bash
G_OAUTH_CREDENTIALS=/path/to/credentials.json
GOOGLE_MEET_CREDENTIALS_PATH=/app/credentials.json
GOOGLE_MEET_TOKEN_PATH=/app/token.json
```

### Monitoring Configuration
```bash
ENABLE_HEALTH_CHECK=true
HEALTH_CHECK_PORT=9090
ENABLE_METRICS=true
METRICS_PORT=9091
LOG_LEVEL=info
```

## 🔧 Quick Commands

### Local Development
```bash
# Start simple local development
make dev-local
# or
docker-compose -f docker-compose.local.yml up -d

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Health check
curl http://localhost:9090/health
```

### Smithery Deployment
```bash
# Build and test Smithery configuration
docker build -f Dockerfile.smithery -t mcp-smithery .
docker run --env-file .env.local mcp-smithery

# Test with direct credentials
docker run -e CLIENT_ID="..." -e CLIENT_SECRET="..." -e REFRESH_TOKEN="..." mcp-smithery
```

### Production Deployment
```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Start with full monitoring
docker-compose -f docker-compose.advanced.yml --profile monitoring up -d

# Check all services
docker-compose -f docker-compose.advanced.yml ps

# Access monitoring
open http://localhost:3001  # Grafana
open http://localhost:9092  # Prometheus
open http://localhost:9093  # AlertManager
```

## 📦 Volume Management

### Local Development Volumes
```bash
# List volumes
docker volume ls | grep google_meet

# Backup development data
docker run --rm -v google_meet_mcp_logs_dev:/data -v $(pwd):/backup alpine tar czf /backup/logs.tar.gz -C /data .

# Clean up development volumes
docker-compose -f docker-compose.local.yml down -v
```

### Production Volumes
```bash
# Backup production data
docker run --rm -v google_meet_mcp_data_prod:/data -v $(pwd):/backup alpine tar czf /backup/production.tar.gz -C /data .

# Restore production data
docker run --rm -v google_meet_mcp_data_prod:/data -v $(pwd):/backup alpine tar xzf /backup/production.tar.gz -C /data
```

## 🔍 Troubleshooting

### Check Container Status
```bash
# View all containers
docker-compose -f docker-compose.advanced.yml ps

# Check logs for specific service
docker-compose -f docker-compose.advanced.yml logs google-meet-mcp

# Execute into container for debugging
docker-compose -f docker-compose.advanced.yml exec google-meet-mcp sh
```

### Health Checks
```bash
# Check health status
curl -f http://localhost:9090/health

# Check metrics (if enabled)
curl http://localhost:9091/metrics

# Check Prometheus targets
curl http://localhost:9092/api/v1/targets
```

### Performance Monitoring
```bash
# Container resource usage
docker stats

# Detailed container info
docker inspect google-meet-mcp-advanced

# Network info
docker network ls | grep google_meet
```

## 🚀 Makefile Commands (Optional)

Create a `Makefile` for easier management:

```makefile
.PHONY: dev-local dev-full prod advanced clean

dev-local:
	docker-compose -f docker-compose.local.yml up -d

dev-full:
	docker-compose up -d

smithery:
	docker-compose -f docker-compose.smithery.yml up -d

prod:
	docker-compose -f docker-compose.prod.yml up -d

advanced:
	docker-compose -f docker-compose.advanced.yml --profile monitoring up -d

clean:
	docker-compose down -v
	docker system prune -f

logs:
	docker-compose logs -f google-meet-mcp

health:
	curl -f http://localhost:9090/health
```

This gives you complete flexibility for all deployment scenarios from local development to enterprise production with full monitoring.