# 🐳 Docker Documentation - Google Meet MCP Server v2.0

## Overview

This document provides comprehensive guidance for containerizing and deploying the Google Meet MCP Server using Docker. Our Dockerfile is optimized for production use with security best practices and performance optimizations.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Dockerfile Architecture](#dockerfile-architecture)
- [Build Process](#build-process)
- [Configuration](#configuration)
- [Security Features](#security-features)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+ installed
- Google OAuth 2.0 credentials JSON file
- Basic understanding of Docker concepts

### 1. Build the Image
```bash
# Build the Docker image
docker build -t google-meet-mcp-server:2.0 .

# Build with build args (optional)
docker build \
  --build-arg NODE_VERSION=20-alpine \
  --tag google-meet-mcp-server:2.0 \
  .
```

### 2. Run the Container
```bash
# Simple run with volume mount for credentials
docker run -d \
  --name meet-mcp-server \
  -v "/path/to/your/credentials.json:/app/credentials.json:ro" \
  -e G_OAUTH_CREDENTIALS="/app/credentials.json" \
  google-meet-mcp-server:2.0
```

## 🏗️ Dockerfile Architecture

Our Dockerfile follows industry best practices for security and efficiency:

### Multi-Stage Build Structure
```dockerfile
FROM node:20-alpine AS base
# Single-stage optimized for production
```

### Key Components

#### 1. **Base Image Selection**
```dockerfile
FROM node:20-alpine AS base
```
- **Why Alpine?** Minimal attack surface (~5MB base)
- **Node 20:** Current LTS with latest security patches
- **Security updates:** Automatic via `apk update && apk upgrade`

#### 2. **Security Hardening**
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001
USER mcp
```
- **Non-root execution:** Prevents privilege escalation
- **Dedicated user:** Isolated process execution
- **Specific UID/GID:** Consistent across environments

#### 3. **Dependency Management**
```dockerfile
# Copy dependency files first for better caching
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts
```
- **Layer caching:** Dependencies cached separately from source
- **Production-only:** No dev dependencies in final image
- **Security:** `--ignore-scripts` prevents malicious script execution

#### 4. **Process Management**
```dockerfile
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
```
- **Signal handling:** Proper SIGTERM/SIGINT handling
- **Zombie reaping:** Prevents zombie processes
- **Graceful shutdown:** Clean container termination

#### 5. **Health Monitoring**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Google Meet MCP Server v2.0 - Health OK')" || exit 1
```
- **Container health:** Docker knows when service is ready
- **Monitoring integration:** Works with orchestrators
- **Configurable:** Adjust intervals for your needs

## ⚙️ Configuration

### Environment Variables

#### Primary Configuration (Recommended)
```bash
# Single variable - token auto-saved alongside credentials
G_OAUTH_CREDENTIALS="/path/to/credentials.json"
```

#### Advanced Configuration
```bash
# Separate credentials and token paths
GOOGLE_MEET_CREDENTIALS_PATH="credentials.json"
GOOGLE_MEET_TOKEN_PATH="token.json"
```

#### Node.js Optimizations
```bash
NODE_ENV=production                           # Production mode
NODE_OPTIONS="--enable-source-maps --max-old-space-size=512"  # Memory limit
```

### Volume Mounts

#### Credentials (Required)
```bash
# Read-only mount for security
-v "/host/path/credentials.json:/app/credentials.json:ro"
```

#### Token Persistence (Optional)
```bash
# Writable mount for token storage
-v "/host/path/token-data:/app/tokens"
```

#### Logs (Recommended)
```bash
# Log persistence
-v "/host/path/logs:/app/logs"
```

## 🔒 Security Features

### 1. **Non-Root Execution**
```dockerfile
USER mcp  # UID 1001, GID 1001
```
- Prevents container breakout
- Limits file system access
- Reduces attack surface

### 2. **Minimal Base Image**
- Alpine Linux (~5MB)
- Only essential packages
- Regular security updates

### 3. **File Permissions**
```dockerfile
COPY --chown=mcp:nodejs src/ ./src/
```
- Proper ownership
- No root-owned files in workdir
- Read-only source code

### 4. **Secret Management**
```bash
# Use Docker secrets in production
docker service create \
  --secret google-credentials \
  --env G_OAUTH_CREDENTIALS="/run/secrets/google-credentials" \
  google-meet-mcp-server:2.0
```

### 5. **Network Security**
```bash
# Custom network isolation
docker network create meet-mcp-net
docker run --network=meet-mcp-net ...
```

## 🚀 Production Deployment

### Docker Compose Example
```yaml
version: '3.8'

services:
  google-meet-mcp:
    build: .
    image: google-meet-mcp-server:2.0
    container_name: meet-mcp-prod
    restart: unless-stopped
    
    environment:
      - NODE_ENV=production
      - G_OAUTH_CREDENTIALS=/run/secrets/google-creds
    
    secrets:
      - google-creds
    
    volumes:
      - token-data:/app/tokens
      - logs:/app/logs
    
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('Health OK')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

secrets:
  google-creds:
    file: ./credentials.json

volumes:
  token-data:
  logs:
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: google-meet-mcp-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: google-meet-mcp
  template:
    metadata:
      labels:
        app: google-meet-mcp
    spec:
      securityContext:
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      
      containers:
      - name: mcp-server
        image: google-meet-mcp-server:2.0
        ports:
        - containerPort: 3000
        
        env:
        - name: G_OAUTH_CREDENTIALS
          value: "/etc/credentials/google-creds"
        
        volumeMounts:
        - name: credentials
          mountPath: /etc/credentials
          readOnly: true
        - name: token-storage
          mountPath: /app/tokens
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          exec:
            command:
            - node
            - -e
            - "console.log('Live')"
          initialDelaySeconds: 30
          periodSeconds: 30
        
        readinessProbe:
          exec:
            command:
            - node
            - -e
            - "console.log('Ready')"
          initialDelaySeconds: 5
          periodSeconds: 10
      
      volumes:
      - name: credentials
        secret:
          secretName: google-oauth-credentials
      - name: token-storage
        persistentVolumeClaim:
          claimName: mcp-token-storage
```

## 🔧 Build Optimization

### Multi-Architecture Builds
```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag google-meet-mcp-server:2.0 \
  --push .
```

### Build Arguments
```dockerfile
ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS base
```

```bash
# Custom Node version
docker build --build-arg NODE_VERSION=18-alpine .
```

### Layer Optimization
```bash
# Check layer sizes
docker history google-meet-mcp-server:2.0

# Use .dockerignore to reduce context
echo "node_modules" >> .dockerignore
echo "*.log" >> .dockerignore
echo ".git" >> .dockerignore
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **Permission Denied**
```bash
# Error: Permission denied accessing credentials
# Solution: Check file ownership and mount permissions
docker run --user 1001:1001 ...
```

#### 2. **Container Won't Start**
```bash
# Check logs
docker logs meet-mcp-server

# Debug with interactive shell
docker run -it --entrypoint /bin/sh google-meet-mcp-server:2.0
```

#### 3. **Authentication Failures**
```bash
# Verify credentials file
docker exec meet-mcp-server cat /app/credentials.json

# Check environment variables
docker exec meet-mcp-server env | grep GOOGLE
```

#### 4. **Health Check Failures**
```bash
# Manual health check
docker exec meet-mcp-server node -e "console.log('Health OK')"

# Adjust health check intervals
HEALTHCHECK --interval=60s --timeout=30s ...
```

### Debugging Commands

```bash
# Container inspection
docker inspect meet-mcp-server

# Resource usage
docker stats meet-mcp-server

# Process list
docker exec meet-mcp-server ps aux

# Network connectivity
docker exec meet-mcp-server ping google.com

# File system check
docker exec meet-mcp-server ls -la /app
```

## 📊 Monitoring & Logging

### Log Management
```bash
# Follow logs
docker logs -f meet-mcp-server

# Log rotation
docker run --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  google-meet-mcp-server:2.0
```

### Metrics Collection
```bash
# Prometheus metrics (if enabled)
curl http://localhost:9090/metrics

# Resource monitoring
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 🎯 Best Practices

### 1. **Image Tagging Strategy**
```bash
# Semantic versioning
docker tag google-meet-mcp-server:latest google-meet-mcp-server:2.0.0
docker tag google-meet-mcp-server:latest google-meet-mcp-server:2.0
docker tag google-meet-mcp-server:latest google-meet-mcp-server:latest
```

### 2. **Security Scanning**
```bash
# Vulnerability scanning
docker scout cves google-meet-mcp-server:2.0

# Alternative: Trivy
trivy image google-meet-mcp-server:2.0
```

### 3. **Resource Management**
```bash
# Set memory limits
docker run --memory=512m --cpus=0.5 google-meet-mcp-server:2.0

# Use cgroups v2 for better control
docker run --cgroupns=private google-meet-mcp-server:2.0
```

### 4. **Backup Strategy**
```bash
# Backup token data
docker run --rm -v token-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/tokens-backup.tar.gz -C /data .
```

### 5. **CI/CD Integration**
```bash
# Automated testing
docker build -t test-image .
docker run --rm test-image npm test

# Multi-stage with testing
FROM base AS test
RUN npm install && npm test

FROM base AS production
# Production layers only
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Alpine Linux Security](https://alpinelinux.org/posts/Alpine-Linux-has-switched-to-OpenSSL.html)
- [Container Security](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

**Need Help?** 
- 📖 Check our [main documentation](./CLAUDE.md)
- 🐛 Report issues on [GitHub](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues)
- 💬 Join our community discussions