# 🚀 Deployment & Usage Guide - Google Meet MCP Server v2.0

## Overview

This comprehensive guide covers all deployment methods for the Google Meet MCP Server v2.0, from local development to enterprise production environments. Choose the deployment method that best fits your use case.

## 📋 Table of Contents

- [Quick Start Matrix](#quick-start-matrix)
- [Local Development](#local-development)
- [Claude Desktop Integration](#claude-desktop-integration)
- [Docker Deployment](#docker-deployment)
- [Smithery Platform](#smithery-platform)
- [Cloud Deployments](#cloud-deployments)
- [Enterprise Setup](#enterprise-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🎯 Quick Start Matrix

Choose your deployment path:

| Use Case | Method | Complexity | Time | Best For |
|----------|--------|------------|------|----------|
| **Try it out** | Local Dev | ⭐ | 5 min | Testing, development |
| **Personal use** | Claude Desktop | ⭐⭐ | 10 min | Individual productivity |
| **Team sharing** | Docker | ⭐⭐⭐ | 15 min | Small teams, self-hosted |
| **Easy deployment** | Smithery | ⭐⭐ | 5 min | Hassle-free deployment |
| **Production** | Cloud (K8s) | ⭐⭐⭐⭐⭐ | 30 min | Enterprise, high availability |

## 🔧 Prerequisites

### **Required for All Deployments:**
1. **Google Cloud Project** with APIs enabled:
   - Google Calendar API v3
   - Google Meet API v2
2. **OAuth 2.0 Credentials** (Desktop Application type)
3. **Google Workspace Account** (Business Standard+ for advanced features)

### **System Requirements:**
- **Node.js:** 18.0+ (20.x recommended)
- **Memory:** 256MB minimum, 512MB recommended
- **Storage:** 100MB for application, additional for logs/tokens
- **Network:** HTTPS access to googleapis.com

## 🏠 Local Development

Perfect for testing and development work.

### **Step 1: Clone and Setup**
```bash
# Clone the repository
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server

# Install dependencies
npm install

# Copy your credentials file
cp /path/to/your/credentials.json ./credentials.json
```

### **Step 2: Initial Authentication**
```bash
# Set environment variable
export G_OAUTH_CREDENTIALS="./credentials.json"

# Run initial setup (opens browser for OAuth)
npm run setup
```

### **Step 3: Start Development Server**
```bash
# Start the server
npm start

# Server will output:
# Google Meet MCP server starting on stdio...
# Google Meet MCP server connected
```

### **Step 4: Test the Server**
```bash
# In another terminal, test a tool
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node src/index.js
```

### **Development Tips:**
```bash
# Enable debug logging
export DEBUG=google-meet-mcp:*
npm start

# Use nodemon for auto-restart
npm install -g nodemon
nodemon src/index.js

# Test specific tools
node test-mcp.js  # If you have test scripts
```

## 🖥️ Claude Desktop Integration

Integrate directly with Claude Desktop for personal productivity.

### **Step 1: Prepare MCP Server**
```bash
# Ensure server works locally first
G_OAUTH_CREDENTIALS="/path/to/credentials.json" npm start
# Press Ctrl+C after confirming it starts correctly
```

### **Step 2: Configure Claude Desktop**

#### **Method A: Simple Configuration (Recommended)**
Edit your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-meet": {
      "command": "node",
      "args": ["/full/path/to/google-meet-mcp-server/src/index.js"],
      "env": {
        "G_OAUTH_CREDENTIALS": "/full/path/to/credentials.json"
      }
    }
  }
}
```

#### **Method B: Advanced Configuration**
```json
{
  "mcpServers": {
    "google-meet": {
      "command": "node", 
      "args": ["/full/path/to/google-meet-mcp-server/src/index.js"],
      "env": {
        "GOOGLE_MEET_CREDENTIALS_PATH": "/path/to/credentials.json",
        "GOOGLE_MEET_TOKEN_PATH": "/path/to/token.json",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### **Step 3: Restart Claude Desktop**
```bash
# macOS
killall Claude && open -a Claude

# Windows  
# Close Claude completely and reopen from Start menu
```

### **Step 4: Verify Integration**
In Claude Desktop, you should see the MCP server connection indicator. Try asking:
> "Can you list my upcoming calendar events?"

### **Troubleshooting Claude Desktop:**
```bash
# Check Claude Desktop logs (macOS)
tail -f ~/Library/Logs/Claude/claude_desktop.log

# Common issues:
# 1. Path must be absolute (not relative)
# 2. Credentials file must be readable 
# 3. Node.js must be in PATH or use full path: /usr/local/bin/node
```

## 🐳 Docker Deployment

Containerized deployment for teams and self-hosted environments.

### **Step 1: Build Docker Image**
```bash
# Build the optimized production image
docker build -t google-meet-mcp-server:2.0 .

# Verify image was built
docker images | grep google-meet-mcp
```

### **Step 2: Prepare Volume Mounts**
```bash
# Create directories for persistent data
mkdir -p ./docker-data/{credentials,tokens,logs}

# Copy credentials file
cp /path/to/credentials.json ./docker-data/credentials/credentials.json
```

### **Step 3: Run Container**
```bash
# Simple run
docker run -d \
  --name meet-mcp-server \
  --restart unless-stopped \
  -v "$(pwd)/docker-data/credentials:/app/credentials:ro" \
  -v "$(pwd)/docker-data/tokens:/app/tokens" \
  -v "$(pwd)/docker-data/logs:/app/logs" \
  -e G_OAUTH_CREDENTIALS="/app/credentials/credentials.json" \
  google-meet-mcp-server:2.0
```

### **Step 4: Initial OAuth Setup (Docker)**
```bash
# Run setup in container
docker exec -it meet-mcp-server npm run setup

# Or run setup locally first, then copy token
# This approach is recommended for headless servers
```

### **Docker Compose (Recommended)**
Create `docker-compose.yml`:
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
      - G_OAUTH_CREDENTIALS=/app/credentials/credentials.json
    
    volumes:
      - ./docker-data/credentials:/app/credentials:ro
      - ./docker-data/tokens:/app/tokens
      - ./docker-data/logs:/app/logs
    
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

volumes:
  credentials:
  tokens:
  logs:
```

Deploy with:
```bash
docker-compose up -d
```

### **Docker Management Commands:**
```bash
# View logs
docker logs -f meet-mcp-server

# Check health
docker ps
docker inspect meet-mcp-server --format='{{.State.Health.Status}}'

# Update container
docker-compose pull && docker-compose up -d

# Backup tokens
docker cp meet-mcp-server:/app/tokens ./backup-tokens
```

## 🔨 Smithery Platform

Zero-configuration deployment via Smithery.ai platform.

### **Step 1: Access Smithery**
1. Visit [smithery.ai](https://smithery.ai)
2. Sign up/login with your preferred method
3. Navigate to "Discover Servers"

### **Step 2: Find Google Meet MCP Server**
```
Search: "google-meet-mcp-server"
or browse: Productivity > Meeting Management
```

### **Step 3: Configure Server**
**Simple Configuration (Recommended):**
```
Google OAuth Credentials: /path/to/your/credentials.json
```

**Advanced Configuration:**
```
Credentials Path: credentials.json
Token Path: token.json
```

### **Step 4: Deploy**
1. Click "Deploy Server"
2. Smithery handles all setup automatically
3. Server appears in your Claude Desktop within minutes

### **Smithery Benefits:**
- ✅ **Zero Setup:** No Docker, Node.js, or manual configuration
- ✅ **Auto Updates:** Always latest version
- ✅ **Monitoring:** Built-in health checks and metrics
- ✅ **Team Sharing:** Share configurations with team members
- ✅ **Rollback:** Easy version rollbacks if issues occur

### **Smithery Management:**
```bash
# Install Smithery CLI (optional)
npm install -g @smithery/cli

# Manage deployments
smithery list
smithery logs google-meet-mcp-server
smithery restart google-meet-mcp-server
```

## ☁️ Cloud Deployments

Enterprise-grade deployments for high availability and scale.

### **AWS ECS Deployment**

#### **1. Create Task Definition:**
```json
{
  "family": "google-meet-mcp-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "mcp-server",
      "image": "your-account.dkr.ecr.region.amazonaws.com/google-meet-mcp-server:2.0",
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/google-meet-mcp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "G_OAUTH_CREDENTIALS",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:google-oauth-creds"
        }
      ]
    }
  ]
}
```

#### **2. Deploy with Terraform:**
```hcl
resource "aws_ecs_service" "google_meet_mcp" {
  name            = "google-meet-mcp-server"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.google_meet_mcp.arn
  desired_count   = 2

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.mcp_server.id]
  }

  service_registries {
    registry_arn = aws_service_discovery_service.mcp_server.arn
  }
}
```

### **Google Cloud Run**
```bash
# Build and push to Google Container Registry
docker build -t gcr.io/your-project/google-meet-mcp-server:2.0 .
docker push gcr.io/your-project/google-meet-mcp-server:2.0

# Deploy to Cloud Run
gcloud run deploy google-meet-mcp-server \
  --image gcr.io/your-project/google-meet-mcp-server:2.0 \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --port 3000 \
  --set-env-vars NODE_ENV=production \
  --set-secrets G_OAUTH_CREDENTIALS=google-oauth-creds:latest
```

### **Kubernetes Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: google-meet-mcp-server
  labels:
    app: google-meet-mcp
spec:
  replicas: 3
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
        - name: NODE_ENV
          value: "production"
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

---
apiVersion: v1
kind: Service
metadata:
  name: google-meet-mcp-service
spec:
  selector:
    app: google-meet-mcp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

## 🏢 Enterprise Setup

Advanced configuration for enterprise environments.

### **High Availability Configuration**
```yaml
# docker-compose.ha.yml
version: '3.8'

services:
  google-meet-mcp-1:
    image: google-meet-mcp-server:2.0
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=mcp-1
    deploy:
      replicas: 2
    
  google-meet-mcp-2:
    image: google-meet-mcp-server:2.0
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=mcp-2
    deploy:
      replicas: 2

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - google-meet-mcp-1
      - google-meet-mcp-2
```

### **Load Balancer Configuration (nginx.conf)**
```nginx
upstream mcp_backend {
    least_conn;
    server google-meet-mcp-1:3000 max_fails=3 fail_timeout=30s;
    server google-meet-mcp-2:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://mcp_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
```

### **Security Hardening**
```bash
# Create security policies
cat > security-policy.yaml << EOF
apiVersion: v1
kind: SecurityContext
spec:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  fsGroup: 1001
  seccompProfile:
    type: RuntimeDefault
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
EOF
```

### **Monitoring Integration**
```yaml
# Prometheus monitoring
version: '3.8'

services:
  google-meet-mcp:
    image: google-meet-mcp-server:2.0
    environment:
      - PROMETHEUS_METRICS_ENABLED=true
      - METRICS_PORT=9090
    ports:
      - "9090:9090"  # Metrics endpoint
  
  prometheus:
    image: prom/prometheus
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
```

## 📊 Monitoring & Maintenance

### **Health Monitoring**
```bash
# Basic health check
curl -f http://localhost:3000/health || exit 1

# Advanced monitoring with custom metrics
node -e "
  const { exec } = require('child_process');
  exec('echo \'{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\"}\' | node src/index.js', 
    (error, stdout) => {
      if (error) process.exit(1);
      const tools = JSON.parse(stdout);
      console.log(\`Health: \${tools.result.tools.length} tools available\`);
    });
"
```

### **Log Management**
```bash
# Structured logging with Winston (add to your project)
npm install winston

# Log rotation
cat > /etc/logrotate.d/google-meet-mcp << EOF
/app/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 mcp mcp
    postrotate
        docker kill -s USR1 meet-mcp-server
    endscript
}
EOF
```

### **Performance Monitoring**
```javascript
// Add to your MCP server for performance tracking
const performanceMetrics = {
  toolCalls: new Map(),
  responseTime: new Map(),
  errorCount: 0
};

// Track tool usage
function trackToolCall(toolName, responseTime, success) {
  const calls = performanceMetrics.toolCalls.get(toolName) || 0;
  performanceMetrics.toolCalls.set(toolName, calls + 1);
  
  const times = performanceMetrics.responseTime.get(toolName) || [];
  times.push(responseTime);
  performanceMetrics.responseTime.set(toolName, times);
  
  if (!success) performanceMetrics.errorCount++;
}
```

### **Backup Strategy**
```bash
#!/bin/bash
# backup-mcp-data.sh

BACKUP_DIR="/backups/google-meet-mcp/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup tokens
cp -r ./docker-data/tokens "$BACKUP_DIR/"

# Backup configuration
cp docker-compose.yml "$BACKUP_DIR/"
cp .env "$BACKUP_DIR/"

# Create archive
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# Retention (keep 30 days)
find /backups/google-meet-mcp/ -name "*.tar.gz" -mtime +30 -delete
```

## 🚨 Troubleshooting

### **Common Deployment Issues**

#### **1. Authentication Failures**
```
Error: Invalid client credentials
```
**Diagnosis:**
```bash
# Check credentials file format
cat credentials.json | jq .
# Should have "installed" or "web" key with client_id, client_secret, redirect_uris

# Verify environment variable
echo $G_OAUTH_CREDENTIALS
```

**Solutions:**
- Ensure credentials file is valid JSON
- Check OAuth 2.0 client type (should be "Desktop Application")
- Verify file permissions (readable by process)

#### **2. Port Conflicts**
```
Error: EADDRINUSE: address already in use :::3000
```
**Diagnosis:**
```bash
# Check what's using the port
lsof -i :3000
netstat -tulpn | grep :3000
```

**Solutions:**
```bash
# Change port in Docker
docker run -p 3001:3000 google-meet-mcp-server:2.0

# Or stop conflicting service
sudo systemctl stop service-using-port-3000
```

#### **3. Docker Permission Issues**
```
Error: permission denied while trying to connect to Docker daemon
```
**Solutions:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo
sudo docker run ...
```

#### **4. Google API Quota Exceeded**
```
Error: Quota exceeded for quota metric 'Requests' and limit 'Requests per day'
```
**Solutions:**
- Check [Google Cloud Console](https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas)
- Request quota increase if needed
- Implement rate limiting in your application

### **Debugging Commands**

```bash
# Check container logs
docker logs meet-mcp-server --tail=100 -f

# Execute commands in container
docker exec -it meet-mcp-server /bin/sh

# Test MCP protocol directly
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | docker exec -i meet-mcp-server node src/index.js

# Monitor resource usage
docker stats meet-mcp-server

# Check network connectivity
docker exec meet-mcp-server ping googleapis.com
```

### **Performance Optimization**

```bash
# Node.js memory tuning
export NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size"

# Docker resource limits
docker run --memory=512m --cpus=0.5 google-meet-mcp-server:2.0

# Enable compression for large responses
export COMPRESSION_ENABLED=true
```

## 📚 Next Steps

### **After Successful Deployment:**

1. **Test All Tools:**
   ```bash
   # Use Claude Desktop or direct MCP calls to test:
   # - calendar_v3_* tools (5 tools)
   # - meet_v2_* tools (12 tools)
   ```

2. **Set Up Monitoring:**
   - Configure health checks
   - Set up log aggregation
   - Monitor Google API quotas

3. **Documentation:**
   - Document your specific configuration
   - Create runbooks for common issues
   - Train team members on usage

4. **Security Review:**
   - Audit credential access
   - Review network policies
   - Set up backup procedures

### **Production Checklist:**
- [ ] SSL/TLS certificates configured
- [ ] Secrets properly secured (not in environment variables)
- [ ] Log rotation configured
- [ ] Monitoring and alerting set up
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Team access controls configured
- [ ] Performance baselines established

---

**Need Help?**
- 📖 Check our [main documentation](./CLAUDE.md)
- 🐳 See [Docker guide](./DOCKER.md) for containerization details
- 🔨 Check [Smithery guide](./SMITHERY.md) for platform deployment
- 🐛 Report issues on [GitHub](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues)