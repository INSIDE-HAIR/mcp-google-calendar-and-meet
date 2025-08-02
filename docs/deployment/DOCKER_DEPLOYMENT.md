# 🐳 Docker Deployment Guide
## Google Meet MCP Server v3.0

Complete guide for containerized deployment with production-ready configurations.

---

## 📋 **Quick Start**

### **Development Deployment**
```bash
# Start development environment with hot reload
./scripts/docker-deploy.sh dev

# View logs
./scripts/docker-deploy.sh logs

# Stop services
./scripts/docker-deploy.sh stop
```

### **Production Deployment**  
```bash
# Deploy production with backup
./scripts/docker-deploy.sh prod --backup --fresh

# Monitor status
./scripts/docker-deploy.sh status

# View production logs
./scripts/docker-deploy.sh logs google-meet-mcp
```

---

## 🏗️ **Architecture Overview**

### **Multi-Stage Docker Build**
```
Stage 1: dependencies    # Install all dependencies
Stage 2: development     # Development with hot reload  
Stage 3: builder         # TypeScript compilation
Stage 4: production      # Optimized runtime (< 200MB)
```

### **Service Stack**
- **MCP Server**: Main application container
- **MongoDB**: Database for Next.js integration (optional)
- **Nginx**: Reverse proxy for HTTPS (optional)
- **Monitoring**: Prometheus + Grafana (optional)

---

## 📁 **File Structure**

```
├── Dockerfile                    # Multi-stage production container
├── docker-compose.yml            # Development configuration
├── docker-compose.prod.yml       # Production configuration  
├── .dockerignore                 # Build context optimization
├── scripts/
│   ├── docker-deploy.sh          # Deployment automation
│   ├── docker-build.sh           # Build script
│   └── health-check.js           # Container health check
└── docs/
    └── DOCKER_DEPLOYMENT.md      # This guide
```

---

## 🚀 **Deployment Options**

### **1. Development Mode**

Perfect for local development with hot reload and debugging.

```bash
# Start development stack
./scripts/docker-deploy.sh dev --verbose

# Available services:
# - MCP Server: stdio transport (main)
# - HTTP API: http://localhost:3000 (if enabled)
# - MongoDB: localhost:27017  
# - Mongo Express: http://localhost:8081 (debug profile)
```

**Features:**
- ✅ Hot reload on code changes
- ✅ Debug logging enabled
- ✅ Database UI (Mongo Express)
- ✅ Reduced resource limits
- ✅ Health checks disabled for faster startup

### **2. Production Mode**

Optimized for production deployment with monitoring and security.

```bash
# Production deployment with all optimizations
./scripts/docker-deploy.sh prod --fresh --backup

# With monitoring stack
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# With reverse proxy
docker-compose -f docker-compose.prod.yml --profile proxy up -d
```

**Features:**
- ✅ Multi-stage optimized build (< 200MB)
- ✅ Health checks and monitoring
- ✅ Resource limits and security
- ✅ Automatic restart policies
- ✅ Log rotation and management
- ✅ Volume persistence

---

## 🔧 **Configuration**

### **Environment Variables**

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | development | production | Runtime environment |
| `LOG_LEVEL` | debug | info | Logging verbosity |
| `G_OAUTH_CREDENTIALS` | /app/credentials.json | /app/credentials.json | OAuth credentials path |
| `NODE_OPTIONS` | default | --max-old-space-size=256 | Node.js optimizations |

### **Volume Mounts**

#### **Development Volumes**
```yaml
volumes:
  - ./src:/app/src:ro                    # Hot reload source code
  - ./credentials.json:/app/credentials.json:ro  # OAuth credentials
  - ./token.json:/app/token.json:rw      # Token persistence
  - logs_dev:/app/logs                   # Log persistence
  - data_dev:/app/data                   # Data persistence
```

#### **Production Volumes**
```yaml
volumes:
  - ./credentials.json:/app/credentials.json:ro  # OAuth credentials (read-only)
  - ./token.json:/app/token.json:rw      # Token persistence
  - logs_prod:/app/logs                  # Log persistence
  - data_prod:/app/data                  # Data persistence
```

---

## 🛠️ **Advanced Deployment**

### **Custom Build**

```bash
# Build specific version
./scripts/docker-build.sh --tag v3.0.0

# Multi-platform build
./scripts/docker-build.sh --platform linux/amd64,linux/arm64

# Build and push to registry
./scripts/docker-build.sh --tag v3.0.0 --registry ghcr.io/yourorg --push
```

### **Production with Monitoring**

```bash
# Deploy with full monitoring stack
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Services available:
# - Prometheus: http://localhost:9092
# - Grafana: http://localhost:3001
# - MCP Metrics: http://localhost:9090/metrics
```

### **SSL/HTTPS Setup**

```bash
# 1. Place SSL certificates in ./ssl/ directory
mkdir -p ssl/
cp your-cert.pem ssl/
cp your-key.pem ssl/

# 2. Configure nginx.prod.conf (create from template)
# 3. Deploy with proxy profile
docker-compose -f docker-compose.prod.yml --profile proxy up -d
```

---

## 🔍 **Monitoring & Health Checks**

### **Health Check Endpoints**

```bash
# Container health check (internal)
docker exec google-meet-mcp-prod node scripts/health-check.js

# HTTP health endpoint (if enabled)
curl http://localhost:3000/health

# Detailed health status
curl http://localhost:3000/health | jq .
```

### **Log Management**

```bash
# View live logs
./scripts/docker-deploy.sh logs

# View specific service logs  
./scripts/docker-deploy.sh logs google-meet-mcp

# Production log files (inside container)
docker exec google-meet-mcp-prod ls -la /app/logs/
```

### **Resource Monitoring**

```bash
# Container resource usage
docker stats google-meet-mcp-prod

# Memory and CPU limits (production)
# - Memory: 1GB limit, 512MB reserved
# - CPU: 2.0 cores limit, 1.0 core reserved
```

---

## 🔐 **Security Best Practices**

### **Container Security**
- ✅ Non-root user (uid: 1001)
- ✅ Read-only filesystem (where possible)
- ✅ No new privileges
- ✅ Minimal base image (Alpine)
- ✅ Security-first volume mounts

### **Credential Management**

```bash
# Recommended: Use Docker secrets (production)
echo "your-mongo-user" | docker secret create mongodb_username -
echo "your-mongo-pass" | docker secret create mongodb_password -

# Environment variable (development only)
export G_OAUTH_CREDENTIALS="/path/to/credentials.json"
```

### **Network Security**
- ✅ Internal network isolation
- ✅ Minimal port exposure
- ✅ No external database ports in production
- ✅ HTTPS through reverse proxy

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Container Won't Start**
```bash
# Check logs
./scripts/docker-deploy.sh logs google-meet-mcp

# Check health status  
docker exec google-meet-mcp-prod node scripts/health-check.js

# Validate configuration
docker-compose -f docker-compose.prod.yml config
```

#### **Authentication Errors**
```bash
# Verify credentials file
docker exec google-meet-mcp-prod ls -la /app/credentials.json

# Check token file permissions
docker exec google-meet-mcp-prod ls -la /app/token.json

# Re-run OAuth setup
docker exec -it google-meet-mcp-prod npx tsx src/setup.ts
```

#### **Performance Issues**
```bash
# Check resource usage
docker stats

# View memory usage
docker exec google-meet-mcp-prod node -e "console.log(process.memoryUsage())"

# Check for memory leaks
docker exec google-meet-mcp-prod npx clinic doctor -- npx tsx src/index.ts
```

### **Debug Mode**

```bash
# Start with debug logging
LOG_LEVEL=debug ./scripts/docker-deploy.sh dev

# Attach to running container
docker exec -it google-meet-mcp-dev /bin/sh

# Run health check manually
docker exec google-meet-mcp-dev node scripts/health-check.js
```

---

## 📊 **Performance Optimization**

### **Build Optimization**
- ✅ Multi-stage builds reduce final image size
- ✅ Layer caching for faster rebuilds
- ✅ .dockerignore excludes unnecessary files
- ✅ npm ci for reproducible builds

### **Runtime Optimization**
- ✅ Node.js memory limits (256MB in production)
- ✅ Source maps enabled for debugging
- ✅ Log rotation prevents disk fill
- ✅ Health checks for load balancer integration

### **Resource Limits**

| Environment | Memory Limit | CPU Limit | Memory Reserved | CPU Reserved |
|-------------|--------------|-----------|-----------------|--------------|
| Development | 512M | 1.0 | 256M | 0.5 |
| Production | 1G | 2.0 | 512M | 1.0 |

---

## 🔄 **Backup & Recovery**

### **Data Backup**

```bash
# Automatic backup before deployment
./scripts/docker-deploy.sh prod --backup

# Manual backup
./scripts/docker-deploy.sh backup

# Backup location
ls -la backups/$(date +%Y%m%d)_*/
```

### **Volume Management**

```bash
# List all volumes
docker volume ls | grep google_meet

# Backup specific volume
docker run --rm -v google_meet_mcp_logs_prod:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/logs.tar.gz -C /data .

# Restore volume
docker run --rm -v google_meet_mcp_logs_prod:/data -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/logs.tar.gz -C /data
```

---

## 🎯 **Production Checklist**

### **Pre-Deployment**
- [ ] **Credentials**: Google OAuth credentials configured
- [ ] **SSL Certificates**: HTTPS certificates in place (if using proxy)
- [ ] **Environment**: Production environment variables set
- [ ] **Resources**: Adequate CPU/memory allocated
- [ ] **Monitoring**: Monitoring stack configured

### **Post-Deployment**
- [ ] **Health Check**: All services healthy
- [ ] **Authentication**: OAuth flow working
- [ ] **APIs**: Google Calendar and Meet APIs accessible
- [ ] **Logs**: Log rotation working
- [ ] **Monitoring**: Metrics being collected
- [ ] **Backup**: Backup strategy validated

---

## 📚 **Additional Resources**

- **[Main README](../README.md)**: Project overview and setup
- **[CLAUDE.md](../CLAUDE.md)**: Development guidelines
- **[SECURITY.md](../SECURITY.md)**: Security best practices
- **[Docker Hub](https://hub.docker.com)**: Container registry
- **[Docker Docs](https://docs.docker.com)**: Official Docker documentation

---

## 🤝 **Support**

For deployment issues:
1. Check the troubleshooting section above
2. Review container logs: `./scripts/docker-deploy.sh logs`
3. Validate health status: `./scripts/docker-deploy.sh status`
4. Open an issue with deployment logs and configuration

---

**🎉 Google Meet MCP Server v3.0 is now ready for production deployment!**