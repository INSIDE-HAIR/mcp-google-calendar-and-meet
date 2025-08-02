# 💻 Installation Guide - Google Meet MCP Server

## 📋 Overview

This guide covers the complete installation process for developers who need to set up, configure, and deploy the Google Meet MCP Server. Choose the installation method that best fits your needs.

## 🎯 Installation Methods

### **🚀 Quick Start (Recommended for Development)**
- Fastest way to get running locally
- Best for trying out features
- Includes development tools

### **🏢 Smithery Deployment (Recommended for Teams)**
- Managed deployment platform
- Best for production team use
- Handles scaling and monitoring

### **🐳 Docker Deployment (Recommended for Production)**
- Containerized deployment
- Best for enterprise environments
- Full control over infrastructure

### **⚙️ Manual Installation (Advanced Users)**
- Complete control over setup
- Best for custom configurations
- Requires more technical knowledge

---

## 🚀 Quick Start Installation

### **Prerequisites**
- **Node.js 18+** (LTS recommended)
- **npm 9+** or **yarn 1.22+**
- **Git** for version control
- **Google Cloud Account** with billing enabled

### **One-Command Setup**
```bash
# Clone and setup in one go
curl -fsSL https://raw.githubusercontent.com/INSIDE-HAIR/google-meet-mcp-server/main/scripts/quick-setup.sh | bash
```

### **Manual Quick Setup**
```bash
# 1. Clone repository
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local

# 4. Run OAuth setup (opens browser)
npm run setup

# 5. Start development server
npm run start:dev
```

### **Verify Installation**
```bash
# Check server health
curl http://localhost:9090/health

# Should return:
# {"status":"healthy","timestamp":"...","oauth":"connected","apis":"available"}
```

---

## 🏢 Smithery Deployment

### **Why Smithery?**
- **Zero Infrastructure Management** - No servers to maintain
- **Team-Friendly** - Easy sharing and collaboration
- **Automatic Updates** - Always running latest version
- **Built-in Monitoring** - Health checks and metrics included

### **Step 1: Prepare Credentials**

#### **Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Google Meet MCP - [YOUR TEAM]"
3. Enable APIs:
   ```bash
   # Via gcloud CLI (if available)
   gcloud services enable calendar-json.googleapis.com
   gcloud services enable meet.googleapis.com
   ```
   Or via Console: APIs & Services → Library → Enable both APIs

#### **Create OAuth Credentials**
1. Go to "APIs & Services" → "Credentials"
2. Create OAuth 2.0 Client ID:
   - Application type: **Desktop Application**
   - Name: "Google Meet MCP - [YOUR NAME]"
3. Download credentials JSON file

### **Step 2: Deploy to Smithery**

1. **Go to [smithery.ai](https://smithery.ai)**
2. **Search for "Google Meet MCP Server"**
3. **Configure with your credentials:**

   ```yaml
   CLIENT_ID: "your-client-id.apps.googleusercontent.com"
   CLIENT_SECRET: "GOCSPX-your-client-secret"
   REFRESH_TOKEN: "1//your-refresh-token"
   ```

4. **Deploy and verify status shows "Running"**

### **Step 3: Integrate with Claude Desktop**

Smithery should automatically configure Claude Desktop, but if needed:

```json
{
  "mcpServers": {
    "google-meet-mcp-server": {
      "command": "smithery",
      "args": ["run", "google-meet-mcp-server"],
      "env": {
        "SMITHERY_CONFIG_ID": "your-config-id-from-smithery"
      }
    }
  }
}
```

### **Verification**
1. Open Claude Desktop
2. Ask: "What Google Meet tools do you have available?"
3. Should see 23 tools listed

---

## 🐳 Docker Deployment

### **Why Docker?**
- **Consistent Environment** - Same behavior across all deployments
- **Easy Scaling** - Horizontal scaling with load balancers
- **Production Ready** - Includes monitoring and health checks
- **Isolated** - No conflicts with other applications

### **Quick Docker Setup**

#### **Using Pre-built Image**
```bash
# Pull latest image
docker pull ghcr.io/inside-hair/google-meet-mcp-server:v3.0

# Run with your credentials
docker run -d \
  --name google-meet-mcp \
  -v "/path/to/your/credentials.json:/app/credentials.json:ro" \
  -e "LOG_LEVEL=info" \
  -e "ENABLE_HEALTH_CHECK=true" \
  -p "9090:9090" \
  ghcr.io/inside-hair/google-meet-mcp-server:v3.0
```

#### **Building Locally**
```bash
# Clone repository
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server

# Build image
docker build -t google-meet-mcp:local .

# Run development container
docker run -it --rm \
  -v "$(pwd)/credentials.json:/app/credentials.json:ro" \
  -v "$(pwd):/app/src:ro" \
  -e "NODE_ENV=development" \
  google-meet-mcp:local
```

### **Production Docker Deployment**

#### **Docker Compose Setup**
```yaml
# docker-compose.yml
version: '3.8'
services:
  google-meet-mcp:
    image: ghcr.io/inside-hair/google-meet-mcp-server:v3.0
    container_name: google-meet-mcp-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - ENABLE_HEALTH_CHECK=true
      - HEALTH_CHECK_PORT=9090
    volumes:
      - ./credentials.json:/app/credentials.json:ro
      - ./token.json:/app/token.json:rw
      - logs:/app/logs
    ports:
      - "9090:9090"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9090/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  logs:
```

#### **Deploy with Monitoring**
```bash
# Start production stack
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost:9090/health

# View metrics
curl http://localhost:9090/metrics
```

---

## ⚙️ Manual Installation

### **System Requirements**
- **Operating System**: Linux, macOS, or Windows
- **Node.js**: 18.19.0 or higher
- **Memory**: 512MB minimum, 1GB recommended
- **Storage**: 1GB free space
- **Network**: Outbound HTTPS access to Google APIs

### **Detailed Setup Steps**

#### **Step 1: Environment Preparation**
```bash
# Verify Node.js version
node --version  # Should be 18+

# Install dependencies globally
npm install -g tsx typescript

# Verify git installation
git --version
```

#### **Step 2: Project Setup**
```bash
# Clone repository
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server

# Checkout specific version (recommended for production)
git checkout v3.0.0

# Install project dependencies
npm ci --production
```

#### **Step 3: Google Cloud Configuration**

**Create and Configure Project:**
```bash
# Using gcloud CLI
gcloud projects create google-meet-mcp-[your-suffix]
gcloud config set project google-meet-mcp-[your-suffix]
gcloud services enable calendar-json.googleapis.com meet.googleapis.com
```

**Create OAuth Credentials:**
```bash
# Via gcloud (creates web application - need to change to desktop)
gcloud auth application-default login

# Or manually via Cloud Console:
# 1. Go to APIs & Services → Credentials
# 2. Create OAuth 2.0 Client ID
# 3. Choose "Desktop Application"
# 4. Download JSON file
```

#### **Step 4: Environment Configuration**

**Create Environment File:**
```bash
# Create from template
cp .env.example .env.production

# Edit with your values
nano .env.production
```

**Environment Variables:**
```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info

# Authentication Method 1: Direct Tokens (Recommended)
CLIENT_ID="your-client-id.apps.googleusercontent.com"
CLIENT_SECRET="GOCSPX-your-client-secret"
REFRESH_TOKEN="1//your-refresh-token"

# Authentication Method 2: File-based
# G_OAUTH_CREDENTIALS="/absolute/path/to/credentials.json"

# Optional Features
ENABLE_HEALTH_CHECK=true
HEALTH_CHECK_PORT=9090
```

#### **Step 5: OAuth Setup**
```bash
# Run OAuth setup to generate refresh token
npm run setup

# This will:
# 1. Open browser for Google OAuth
# 2. Request permissions
# 3. Generate and save refresh token
# 4. Verify API connectivity
```

#### **Step 6: Build and Start**
```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start:compiled

# Or for development
npm run start:dev
```

#### **Step 7: Verification**
```bash
# Test health endpoint
curl http://localhost:9090/health

# Test basic functionality
curl http://localhost:9090/ready

# Check metrics
curl http://localhost:9090/metrics
```

### **Claude Desktop Integration**

**Configuration File Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "google-meet-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/google-meet-mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/google-meet-mcp-server",
      "env": {
        "CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "CLIENT_SECRET": "GOCSPX-your-client-secret",
        "REFRESH_TOKEN": "1//your-refresh-token",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## 🔧 Advanced Installation Options

### **Custom Build Configuration**

#### **TypeScript Configuration**
```json
// tsconfig.prod.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "declaration": false,
    "removeComments": true,
    "outDir": "./dist"
  },
  "exclude": ["test", "**/*.test.ts", "**/*.spec.ts"]
}
```

#### **Build with Optimizations**
```bash
# Build for production with optimizations
npm run build:prod

# Build with specific target
npx tsc -p tsconfig.prod.json
```

### **Process Management**

#### **Using PM2**
```bash
# Install PM2
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'google-meet-mcp',
    script: './dist/index.js',
    cwd: '/path/to/google-meet-mcp-server',
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      CLIENT_ID: 'your-client-id',
      CLIENT_SECRET: 'your-secret',
      REFRESH_TOKEN: 'your-token'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### **Using systemd (Linux)**
```bash
# Create systemd service
sudo tee /etc/systemd/system/google-meet-mcp.service << 'EOF'
[Unit]
Description=Google Meet MCP Server
After=network.target

[Service]
Type=simple
User=mcp-user
WorkingDirectory=/opt/google-meet-mcp-server
Environment=NODE_ENV=production
Environment=LOG_LEVEL=info
Environment=CLIENT_ID=your-client-id
Environment=CLIENT_SECRET=your-secret
Environment=REFRESH_TOKEN=your-token
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable google-meet-mcp
sudo systemctl start google-meet-mcp
```

---

## 🚨 Troubleshooting Installation

### **Common Issues**

#### **Node.js Version Issues**
```bash
# Check Node.js version
node --version

# If wrong version, install correct version
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### **Permission Issues**
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use npm's recommended approach
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

#### **Google API Access Issues**
```bash
# Verify APIs are enabled
gcloud services list --enabled --filter="calendar OR meet"

# Check OAuth configuration
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://www.googleapis.com/calendar/v3/users/me/calendarList"
```

### **Verification Steps**

#### **Complete Installation Check**
```bash
#!/bin/bash
echo "🔍 Google Meet MCP Installation Verification"

# Check Node.js
node --version || echo "❌ Node.js not found"

# Check project
[ -f "package.json" ] && echo "✅ Project files found" || echo "❌ Not in project directory"

# Check dependencies
npm list --depth=0 > /dev/null 2>&1 && echo "✅ Dependencies installed" || echo "❌ Dependencies missing"

# Check build
[ -d "dist" ] && echo "✅ Build completed" || echo "❌ Build not found"

# Check credentials
[ -f ".env.production" ] && echo "✅ Environment configured" || echo "❌ Environment missing"

# Check server startup
timeout 10s npm run start:compiled > /dev/null 2>&1 && echo "✅ Server starts" || echo "❌ Server won't start"

echo "🎯 Installation check complete"
```

---

## 📋 Post-Installation Steps

### **Security Hardening**
```bash
# Set proper file permissions
chmod 600 .env.production
chmod 600 credentials.json
chmod 700 ~/.config/claude/

# Create dedicated user (production)
sudo useradd -r -s /bin/false mcp-user
sudo chown -R mcp-user:mcp-user /opt/google-meet-mcp-server
```

### **Monitoring Setup**
```bash
# Enable health checks
export ENABLE_HEALTH_CHECK=true

# Set up log rotation
sudo tee /etc/logrotate.d/google-meet-mcp << 'EOF'
/var/log/google-meet-mcp/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 mcp-user mcp-user
}
EOF
```

### **Backup Configuration**
```bash
# Create backup script
cat > backup-config.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
tar czf "google-meet-mcp-backup-$DATE.tar.gz" \
  .env.production \
  credentials.json \
  token.json \
  package.json \
  package-lock.json
EOF

chmod +x backup-config.sh
```

---

**🎯 Your Google Meet MCP Server is now installed and ready to use! Next step: configure it for your specific needs using the [Environment Setup Guide](./environment-setup.md).**