# 🚀 Setup Guide - Google Meet MCP Server v3.0
## Manual Installation and Configuration

This guide covers manual installation and setup of the Google Meet MCP Server without Smithery, for users who prefer direct deployment or development environments.

---

## 📋 **Prerequisites**

### **System Requirements**
- ✅ **Node.js 18+** (LTS recommended)
- ✅ **npm** or **yarn** package manager
- ✅ **Git** for cloning the repository
- ✅ **Google Workspace** account (Business Standard+ for advanced features)

### **Google Cloud Setup**
- ✅ **Google Cloud Project** with billing enabled
- ✅ **Calendar API v3** enabled
- ✅ **Meet API v2** enabled
- ✅ **OAuth 2.0 credentials** (Desktop Application)

---

## 🛠️ **Installation**

### **Step 1: Clone Repository**
```bash
# Clone the repository
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server

# Verify you're on the main branch
git checkout main
git pull origin main
```

### **Step 2: Install Dependencies**
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### **Step 3: Create Google Cloud Project**

1. **Go to Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Create New Project**: Click "Select Project" → "New Project"
3. **Project Configuration**:
   ```
   Project name: "Google Meet MCP Server - [YOUR NAME]"
   Organization: [Your Google Workspace Org]
   Location: [Default or your preferred location]
   ```

### **Step 4: Enable Required APIs**
```bash
# Using gcloud CLI (if available)
gcloud services enable calendar-json.googleapis.com
gcloud services enable meet.googleapis.com

# OR via Console:
# 1. Go to "APIs & Services" → "Library"
# 2. Search for "Google Calendar API" → ENABLE
# 3. Search for "Google Meet API" → ENABLE
```

### **Step 5: Create OAuth 2.0 Credentials**

1. **Navigate to Credentials**: "APIs & Services" → "Credentials"
2. **Create OAuth Consent Screen**:
   ```yaml
   User Type: Internal (if Google Workspace) or External
   App name: "Google Meet MCP Server"
   User support email: [your-email]
   Developer contact: [your-email]
   
   Scopes to add:
   - https://www.googleapis.com/auth/calendar
   - https://www.googleapis.com/auth/meetings.space.created
   - https://www.googleapis.com/auth/meetings.space.readonly
   - https://www.googleapis.com/auth/meetings.space.settings
   ```

3. **Create OAuth 2.0 Client**:
   ```yaml
   Credential Type: OAuth 2.0 Client ID
   Application Type: Desktop application
   Name: "Google Meet MCP Desktop Client"
   ```

4. **Download Credentials**: Click "Download JSON" and save as `credentials.json`

---

## ⚙️ **Configuration**

### **Method 1: Environment Variables (Recommended)**
```bash
# Create .env file
cat > .env << 'EOF'
# Google Meet MCP Server Configuration
G_OAUTH_CREDENTIALS="/absolute/path/to/your/credentials.json"

# Optional settings
NODE_ENV=development
LOG_LEVEL=info
EOF

# Secure the .env file
chmod 600 .env
```

### **Method 2: Direct File Paths**
```bash
# Create .env file with separate paths
cat > .env << 'EOF'
# Advanced configuration
GOOGLE_MEET_CREDENTIALS_PATH="./credentials.json"
GOOGLE_MEET_TOKEN_PATH="./token.json"

# Optional settings
NODE_ENV=development
LOG_LEVEL=info
EOF
```

### **Secure Credential Storage**
```bash
# Create secure directory
mkdir -p ~/Documents/MCP-Credentials
chmod 700 ~/Documents/MCP-Credentials

# Move credentials to secure location
mv ./credentials.json ~/Documents/MCP-Credentials/google-meet-credentials.json
chmod 600 ~/Documents/MCP-Credentials/google-meet-credentials.json

# Update .env file
sed -i 's|/absolute/path/to/your/credentials.json|/home/username/Documents/MCP-Credentials/google-meet-credentials.json|' .env
```

---

## ▶️ **Running the Server**

### **Development Mode**
```bash
# Start with development settings
npm run start:dev

# With debug logging
LOG_LEVEL=debug npm run start:dev

# With specific credentials path
G_OAUTH_CREDENTIALS="/path/to/creds.json" npm run start:dev
```

### **Production Mode**
```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start:js

# Or start directly with tsx
npm start
```

### **First-Time OAuth Setup**
```bash
# Run OAuth setup (one-time)
npm run setup

# Manual setup with specific credentials
G_OAUTH_CREDENTIALS="/path/to/creds.json" npm run setup

# This will:
# 1. Open browser for Google OAuth
# 2. Ask for permissions
# 3. Save refresh token automatically
# 4. Close browser when complete
```

---

## 🔗 **Claude Desktop Integration**

### **Automatic Configuration**
```bash
# Run the configuration helper
node scripts/configure-claude-desktop.js

# This will automatically add the MCP server to Claude Desktop
```

### **Manual Configuration**

**1. Find Claude Desktop Config File**:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**2. Add MCP Server Configuration**:
```json
{
  "mcpServers": {
    "google-meet-mcp-server": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/google-meet-mcp-server/src/index.ts"],
      "env": {
        "G_OAUTH_CREDENTIALS": "/absolute/path/to/your/credentials.json"
      }
    }
  }
}
```

**3. For Development Setup**:
```json
{
  "mcpServers": {
    "google-meet-dev": {
      "command": "npm",
      "args": ["run", "start"],
      "cwd": "/absolute/path/to/google-meet-mcp-server",
      "env": {
        "G_OAUTH_CREDENTIALS": "/absolute/path/to/your/credentials.json",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

**4. Restart Claude Desktop** for changes to take effect.

---

## ✅ **Verification and Testing**

### **Step 1: Test Server Startup**
```bash
# Test that server starts without errors
npm start

# Should see output like:
# ✅ Google Meet MCP Server v3.0 starting...
# ✅ Authentication successful
# ✅ Server ready and listening for MCP requests
```

### **Step 2: Test OAuth Flow**
```bash
# Test OAuth authentication
npm run setup

# Should open browser and complete OAuth flow
# Check that token.json (or .token.json) is created
ls -la *.token.json
```

### **Step 3: Test Claude Desktop Connection**
1. **Open Claude Desktop**
2. **Ask Claude**: "What Google Meet tools do you have available?"
3. **Expected Response**: List of 17 tools (5 Calendar + 12 Meet API tools)

### **Step 4: Test Basic Functionality**
```bash
# In Claude Desktop, try:
"List my Google calendars"

# Should show your calendars
# If first time, may trigger OAuth consent in browser
```

### **Step 5: Test Advanced Features**
```bash
# Create a test event with Meet
"Create a test meeting for tomorrow at 2pm with Google Meet included"

# Check in Google Calendar that event was created
```

---

## 🐳 **Docker Setup (Alternative)**

### **Using Pre-built Docker Image**
```bash
# Pull latest image
docker pull ghcr.io/inside-hair/google-meet-mcp-server:v3.0

# Run with your credentials
docker run -d \
  --name google-meet-mcp \
  -v "/path/to/your/credentials.json:/app/credentials.json:ro" \
  -v "/path/to/store/tokens:/app/tokens" \
  ghcr.io/inside-hair/google-meet-mcp-server:v3.0
```

### **Building Docker Image Locally**
```bash
# Build the image
docker build -t google-meet-mcp-server:local .

# Run development container
docker run -it --rm \
  -v "$(pwd)/credentials.json:/app/credentials.json:ro" \
  -v "$(pwd):/app/src:ro" \
  google-meet-mcp-server:local

# Run production container
docker run -d \
  --name google-meet-mcp-prod \
  -v "/secure/path/credentials.json:/app/credentials.json:ro" \
  -v "google-meet-data:/app/data" \
  google-meet-mcp-server:local
```

### **Docker Compose Development**
```bash
# Start development stack
docker-compose up -d

# View logs
docker-compose logs -f google-meet-mcp

# Stop stack
docker-compose down
```

---

## 🔧 **Advanced Configuration**

### **Environment Variables Reference**
```bash
# Primary configuration
G_OAUTH_CREDENTIALS="/path/to/credentials.json"          # Recommended method

# Alternative configuration
GOOGLE_MEET_CREDENTIALS_PATH="/path/to/credentials.json" # Credentials file
GOOGLE_MEET_TOKEN_PATH="/path/to/token.json"             # Token storage

# Runtime configuration
NODE_ENV="production"                                     # Environment mode
LOG_LEVEL="info"                                         # Logging verbosity
NODE_OPTIONS="--max-old-space-size=512"                 # Node.js memory

# Optional features
ENABLE_HEALTH_CHECK="true"                               # Health check endpoint
HEALTH_CHECK_PORT="9090"                                 # Health check port
```

### **Custom Configuration File**
```javascript
// config/local.js
module.exports = {
  google: {
    credentialsPath: process.env.G_OAUTH_CREDENTIALS,
    tokenPath: process.env.G_OAUTH_TOKEN_PATH,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/meetings.space.created',
      'https://www.googleapis.com/auth/meetings.space.readonly',
      'https://www.googleapis.com/auth/meetings.space.settings'
    ]
  },
  server: {
    transport: 'stdio',
    logLevel: process.env.LOG_LEVEL || 'info',
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === 'true'
  }
};
```

### **Development vs Production Settings**
```yaml
# Development
NODE_ENV: development
LOG_LEVEL: debug
ENABLE_HEALTH_CHECK: true
MCP_TRANSPORT: stdio

# Production  
NODE_ENV: production
LOG_LEVEL: warn
ENABLE_HEALTH_CHECK: false
NODE_OPTIONS: --max-old-space-size=256
```

---

## 🧪 **Testing**

### **Run Test Suite**
```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:validation   # Validation tests only

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### **Test Categories**
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API interactions and workflows
- **Validation Tests**: Test Zod schema validation
- **End-to-End Tests**: Test complete user workflows

### **Manual Testing**
```bash
# Test OAuth flow
npm run setup

# Test basic API connectivity
node test/test-basic-connectivity.js

# Test specific tools
node test/test-calendar-operations.js
node test/test-meet-operations.js
```

---

## 📊 **Monitoring and Maintenance**

### **Health Checks**
```bash
# Check server health
curl http://localhost:9090/health

# Check Google API connectivity
node scripts/health-check.js

# Monitor logs
tail -f logs/mcp-server.log
```

### **Performance Monitoring**
```bash
# Monitor memory usage
node --inspect src/index.ts

# Profile performance
node --prof src/index.ts

# Analyze heap usage
node --heap-prof src/index.ts
```

### **Credential Rotation**
```bash
# Quarterly credential rotation (recommended)
# 1. Create new OAuth client in Google Cloud Console
# 2. Download new credentials.json
# 3. Update configuration
# 4. Test authentication
# 5. Revoke old credentials
```

---

## 🔐 **Security Best Practices**

### **File Permissions**
```bash
# Secure credentials
chmod 600 credentials.json
chmod 600 .env
chmod 600 *.token.json

# Secure directories
chmod 700 ~/Documents/MCP-Credentials
```

### **Network Security**
```bash
# If running in production, consider firewall rules
# Allow outbound HTTPS to:
# - *.googleapis.com (Google APIs)
# - accounts.google.com (OAuth)

# Block all other outbound traffic
```

### **Audit and Compliance**
```bash
# Enable audit logging in Google Cloud Console
# Monitor API usage patterns
# Set up alerts for unusual activity
# Regular credential rotation
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Server Won't Start**:
```bash
# Check Node.js version
node --version  # Should be 18+

# Check dependencies
npm install

# Check credentials path
ls -la /path/to/credentials.json
```

**Authentication Errors**:
```bash
# Regenerate OAuth credentials
# Check OAuth consent screen configuration
# Verify required scopes are enabled
# Check Google Workspace permissions
```

**Claude Desktop Not Connecting**:
```bash
# Verify MCP configuration
# Restart Claude Desktop
# Check server logs
# Test server manually
```

For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 📚 **Additional Resources**

- **[Smithery User Guide](./SMITHERY_USER_GUIDE.md)**: Simplified deployment with Smithery
- **[Docker Deployment](./DOCKER_DEPLOYMENT.md)**: Containerized deployment
- **[Security Guide](./SECURITY.md)**: Security best practices
- **[Team Security](./TEAM_SECURITY.md)**: Enterprise team deployment
- **[Troubleshooting](./TROUBLESHOOTING.md)**: Problem resolution guide

---

**🎉 Your Google Meet MCP Server is now running! Start by asking Claude about available Google Meet tools.**