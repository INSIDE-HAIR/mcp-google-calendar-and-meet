# 🔨 Smithery Platform Documentation - Google Meet MCP Server v2.0

## Overview

[Smithery.ai](https://smithery.ai) is the official registry and deployment platform for Model Context Protocol (MCP) servers. This document explains how our Google Meet MCP Server integrates with Smithery, how to deploy it, and how to understand the platform's capabilities.

## 📋 Table of Contents

- [What is Smithery?](#what-is-smithery)
- [Configuration File (smithery.yaml)](#configuration-file)
- [Deployment Process](#deployment-process)
- [Platform Features](#platform-features)
- [Integration with Claude Desktop](#integration-with-claude-desktop)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🤖 What is Smithery?

Smithery is a comprehensive platform for MCP (Model Context Protocol) servers that provides:

### **Core Functions:**

- **Registry:** Central repository for MCP servers
- **Discovery:** Find and explore available MCP servers
- **Deployment:** One-click deployment to various platforms
- **Configuration:** Visual configuration management
- **Monitoring:** Performance and health monitoring
- **Integration:** Seamless Claude Desktop integration

### **Why Use Smithery?**

1. **Simplified Deployment:** No manual setup required
2. **Version Management:** Automatic updates and rollbacks
3. **Configuration UI:** Visual configuration instead of JSON editing
4. **Community:** Discover servers built by others
5. **Enterprise Features:** Team management and analytics

## 📄 Configuration File (smithery.yaml)

Our `smithery.yaml` file defines how the Google Meet MCP Server integrates with the Smithery platform:

### **File Structure Overview:**

```yaml
# Basic metadata
name: google-meet-mcp-server
displayName: "Google Meet MCP Server v2.0"
version: 2.0.0
description: "Enterprise MCP server with 17 production-ready tools"

# Startup configuration
startCommand:
  type: stdio # Communication method
  configSchema: { ... } # Configuration options
  commandFunction: | # How to start the server
    (config) => { ... }
  exampleConfig: { ... } # Example configuration

# Tool inventory
tools: [...] # All 17 available tools

# Requirements and capabilities
requirements: { ... } # System requirements
features: [...] # Key features list
```

### **Key Sections Explained:**

#### 1. **startCommand Configuration**

```yaml
startCommand:
  type: stdio # MCP communication over stdin/stdout
  configSchema:
    type: object
    anyOf:
      - required: [googleOAuthCredentials] # Simple config
      - required: [googleMeetCredentialsPath, googleMeetTokenPath] # Advanced
```

**Purpose:** Defines how Smithery should start our MCP server and what configuration options are available to users.

#### 2. **commandFunction (JavaScript)**

```javascript
(config) => {
  const env = {};
  if (config.googleOAuthCredentials) {
    env.G_OAUTH_CREDENTIALS = config.googleOAuthCredentials;
  } else {
    env.GOOGLE_MEET_CREDENTIALS_PATH = config.googleMeetCredentialsPath;
    env.GOOGLE_MEET_TOKEN_PATH = config.googleMeetTokenPath;
  }
  return {
    command: "node",
    args: ["src/index.ts"],
    env: env,
  };
};
```

**Purpose:** Translates user configuration into actual command execution. This JavaScript function runs on Smithery's servers to determine how to start your MCP server.

#### 3. **Tool Definitions**

```yaml
tools:
  - name: calendar_v3_create_event
    description: "Create calendar events with Google Meet conferences"
    category: calendar
```

**Purpose:** Documents all available tools for discovery and helps users understand capabilities.

#### 4. **Requirements Matrix**

```yaml
requirements:
  runtime: node
  nodeVersion: ">=18.0.0"
  apis:
    - name: "Google Calendar API v3"
      scopes: ["https://www.googleapis.com/auth/calendar"]
```

**Purpose:** Helps Smithery validate compatibility and inform users of prerequisites.

## 🚀 Deployment Process

### **Step 1: Registry Submission**

```bash
# Submit to Smithery registry (if you're the maintainer)
smithery publish smithery.yaml

# Or via GitHub integration
git push origin main  # Auto-publishes if configured
```

### **Step 2: User Discovery**

Users can find your MCP server through:

- **Smithery Web Interface:** Browse by category (productivity)
- **Search:** Keywords like "google-meet", "calendar", "video-conferencing"
- **Claude Desktop:** Direct integration in MCP settings

### **Step 3: Configuration by Users**

Users configure the server through Smithery's UI:

#### **Simple Configuration (Recommended):**

```yaml
googleOAuthCredentials: "/path/to/credentials.json"
```

#### **Advanced Configuration:**

```yaml
googleMeetCredentialsPath: "credentials.json"
googleMeetTokenPath: "token.json"
```

### **Step 4: Automatic Deployment**

Smithery handles:

1. **Dependency Installation:** `npm ci` with proper Node.ts version
2. **Environment Setup:** Sets environment variables from config
3. **Process Management:** Starts and monitors the MCP server
4. **Integration:** Connects to Claude Desktop automatically

## 🎛️ Platform Features

### **1. Visual Configuration**

Instead of editing JSON files, users get a web interface:

```
┌─────────────────────────────────────┐
│ Google Meet MCP Server v2.0         │
├─────────────────────────────────────┤
│ ○ Simple Configuration              │
│   Google OAuth Credentials:         │
│   [/path/to/credentials.json]       │
│                                     │
│ ○ Advanced Configuration            │
│   Credentials Path: [credentials.json] │
│   Token Path: [token.json]          │
│                                     │
│ [Deploy Server] [Test Connection]   │
└─────────────────────────────────────┘
```

### **2. Health Monitoring**

Smithery provides real-time monitoring:

- **Server Status:** Running, Stopped, Error
- **Tool Availability:** Which of the 17 tools are working
- **Performance Metrics:** Response times, error rates
- **Google API Status:** OAuth token health, API quotas

### **3. Version Management**

```
Current: v2.0.0 ✓
Available: v2.0.1 (Update available)

Changelog:
- Fixed get_space validation issue
- Improved error handling
- Updated Docker security
```

### **4. Team Management (Enterprise)**

- **User Permissions:** Who can configure/deploy
- **Audit Logs:** Track all configuration changes
- **Resource Quotas:** Limit API usage per team member
- **Shared Configurations:** Team-wide credential management

## 🔗 Integration with Claude Desktop

### **Automatic Integration**

When deployed via Smithery, the MCP server automatically appears in Claude Desktop:

#### **Claude Desktop Configuration (Auto-generated):**

```json
{
  "mcpServers": {
    "google-meet-mcp-server": {
      "command": "smithery",
      "args": ["run", "google-meet-mcp-server"],
      "env": {
        "SMITHERY_CONFIG_ID": "your-config-id"
      }
    }
  }
}
```

### **Manual Integration**

For direct integration without Smithery:

```json
{
  "mcpServers": {
    "google-meet": {
      "command": "node",
      "args": ["src/index.ts"],
      "env": {
        "G_OAUTH_CREDENTIALS": "/path/to/credentials.json"
      }
    }
  }
}
```

## ⚙️ Advanced Configuration

### **Custom Environment Variables**

```yaml
# In smithery.yaml - extend configSchema
properties:
  customLogLevel:
    type: string
    enum: ["debug", "info", "warn", "error"]
    default: "info"
    description: "Set logging verbosity"

  rateLimitRequests:
    type: integer
    minimum: 1
    maximum: 1000
    default: 100
    description: "Max requests per minute"
```

### **Multi-Environment Support**

```yaml
environments:
  development:
    googleOAuthCredentials: "/dev/credentials.json"
    customLogLevel: "debug"

  production:
    googleOAuthCredentials: "/prod/credentials.json"
    customLogLevel: "warn"
    rateLimitRequests: 50
```

### **Conditional Features**

```yaml
# Enable/disable tools based on configuration
conditionalTools:
  - name: "meet_v2_list_recordings"
    condition: "config.enableRecording === true"
  - name: "meet_v2_list_transcripts"
    condition: "config.enableTranscription === true"
```

## 🔐 Security Considerations

### **Credential Management**

Smithery provides secure credential storage:

#### **Best Practices:**

1. **Never commit credentials** to your repository
2. **Use Smithery's secret management** for sensitive data
3. **Enable audit logging** for credential access
4. **Rotate credentials regularly** (Smithery can automate this)

#### **Secret Storage Example:**

```yaml
# Reference secrets instead of raw values
configSchema:
  properties:
    googleOAuthCredentials:
      type: string
      format: "smithery-secret" # Special format for secrets
      description: "Reference to stored Google OAuth credentials"
```

### **Network Security**

```yaml
# Network policies in smithery.yaml
networkPolicy:
  egress:
    - to: "*.googleapis.com" # Allow Google APIs
      ports: [443]
    - to: "accounts.google.com" # OAuth endpoints
      ports: [443]
  ingress: [] # No inbound connections needed
```

## 🐛 Troubleshooting

### **Common Issues:**

#### 1. **Configuration Validation Errors**

```
Error: Invalid configuration
- googleOAuthCredentials is required when using simple config
- Path must be absolute: /path/to/credentials.json
```

**Solution:**

```yaml
# Ensure proper path format in smithery.yaml
examples: ["/Users/username/credentials.json", "/opt/app/credentials.json"]
```

#### 2. **Server Won't Start**

```
Error: Module not found: @modelcontextprotocol/sdk
```

**Solution:** Check `requirements` section in smithery.yaml:

```yaml
requirements:
  dependencies:
    - "@modelcontextprotocol/sdk"
    - "googleapis"
    - "open"
```

#### 3. **OAuth Authentication Failures**

```
Error: Invalid client credentials
```

**Solution:** Verify credentials in Smithery dashboard and check:

- Credentials file format (JSON)
- OAuth 2.0 client type (Desktop Application)
- Required API scopes enabled

#### 4. **Tool Discovery Issues**

```
Error: Tool 'calendar_v3_create_event' not found
```

**Solution:** Ensure all tools are properly listed in smithery.yaml:

```yaml
tools:
  - name: calendar_v3_create_event # Must match actual tool name
    description: "..."
    category: calendar
```

### **Debugging Commands:**

#### **Check Deployment Status:**

```bash
smithery status google-meet-mcp-server
```

#### **View Server Logs:**

```bash
smithery logs google-meet-mcp-server --tail=100
```

#### **Test Configuration:**

```bash
smithery test-config smithery.yaml
```

#### **Validate YAML:**

```bash
smithery validate smithery.yaml
```

## 🎯 Best Practices

### **1. Semantic Versioning**

```yaml
version: 2.1.0 # MAJOR.MINOR.PATCH
```

- **MAJOR:** Breaking changes (removed tools, changed interfaces)
- **MINOR:** New features (additional tools, enhanced functionality)
- **PATCH:** Bug fixes (no interface changes)

### **2. Comprehensive Tool Documentation**

```yaml
tools:
  - name: calendar_v3_create_event
    description: "Create calendar events with Google Meet conferences and configurable guest permissions"
    category: calendar
    parameters:
      - name: summary
        required: true
        description: "Event title"
      - name: start_time
        required: true
        description: "ISO 8601 start time"
```

### **3. Clear Configuration Examples**

```yaml
exampleConfig:
  # Always provide working examples
  googleOAuthCredentials: "/Users/username/Downloads/credentials.json"

  # Document alternative approaches
  # Advanced users can use separate paths:
  # googleMeetCredentialsPath: "credentials.json"
  # googleMeetTokenPath: "token.json"
```

### **4. Feature Flags**

```yaml
features:
  - "17 production-ready tools (v2beta removed for stability)"
  - "Enterprise-grade security and authentication"
  - "Docker containerization support"
```

### **5. Support Information**

```yaml
support:
  documentation: "https://github.com/INSIDE-HAIR/google-meet-mcp-server/blob/main/README.md"
  issues: "https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues"
  setup: "https://github.com/INSIDE-HAIR/google-meet-mcp-server/blob/main/CLAUDE.md"
  community: "Discord link or forum"
```

## 📊 Analytics & Monitoring

### **Usage Metrics (Available in Smithery Dashboard):**

- **Deployment Count:** How many users have deployed your server
- **Tool Usage:** Which tools are used most frequently
- **Error Rates:** Identify problematic tools or configurations
- **Performance:** Average response times across tools

### **Health Checks:**

```yaml
# Add health check configuration
healthCheck:
  endpoint: "/health"
  interval: 30
  timeout: 10
  retries: 3
```

### **Custom Metrics:**

```javascript
// In your MCP server code
const metrics = require("@smithery/metrics");

metrics.increment("tool.calendar_v3_create_event.calls");
metrics.histogram("tool.response_time", responseTime);
```

## 🚀 Advanced Deployment Patterns

### **Blue-Green Deployment**

```yaml
# Deploy new version alongside old
deployment:
  strategy: "blue-green"
  healthCheck: true
  rollbackOnFailure: true
```

### **Canary Releases**

```yaml
# Gradual rollout to subset of users
deployment:
  strategy: "canary"
  canaryPercentage: 10
  promotionCriteria:
    errorRate: "<1%"
    responseTime: "<500ms"
```

### **Multi-Region Deployment**

```yaml
# Deploy to multiple regions for redundancy
regions:
  - "us-east-1"
  - "eu-west-1"
  - "ap-southeast-1"
```

## 📚 Resources & Learning

### **Official Documentation:**

- [Smithery Platform Docs](https://smithery.ai/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Smithery YAML Schema](https://smithery.ai/docs/config#smitheryyaml)

### **Community:**

- [Smithery Discord](https://discord.gg/smithery)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
- [Example MCP Servers](https://github.com/modelcontextprotocol/servers)

### **Tools & Utilities:**

- [Smithery CLI](https://www.npmjs.com/package/@smithery/cli)
- [YAML Validator](https://smithery.ai/validate)
- [Configuration Generator](https://smithery.ai/generate)

---

**Ready to Deploy?**

- 🚀 Visit [Smithery.ai](https://smithery.ai) to get started
- 📖 Check our [main documentation](./CLAUDE.md) for setup details
- 🐛 Report issues on [GitHub](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues)
