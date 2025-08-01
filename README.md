# 🚀 Google Meet MCP Server v3.0 - Production Ready

[![smithery badge](https://smithery.ai/badge/@inside-hair/google-meet-mcp-server)](https://smithery.ai/server/@inside-hair/google-meet-mcp-server)

A **production-ready enterprise** Model Context Protocol (MCP) server for comprehensive Google Meet management through Google Calendar API v3 and Google Meet API v2. Features **Docker containerization**, **Smithery deployment**, **team security**, and enterprise-grade TypeScript architecture with 21 fully validated tools.

## 🎯 **Quick Start Options**

### **🔨 Smithery (Recommended)**
- **Perfect for teams** and individual users
- **One-click deployment** with web interface
- **Automatic updates** and health monitoring
- **📖 [Complete Smithery User Guide](./docs/SMITHERY_USER_GUIDE.md)**

### **🐳 Docker**
- **Production deployments** with full containerization
- **Multi-stage builds** optimized for size and security
- **Development and production** configurations
- **📖 [Docker Deployment Guide](./docs/DOCKER_DEPLOYMENT.md)**

### **⚙️ Manual Setup**
- **Full control** over installation and configuration
- **Development environments** and custom deployments
- **Direct Node.js** execution with TypeScript
- **📖 [Manual Setup Guide](./docs/SETUP.md)**

## 🚀 What's New in v3.0 - Production Ready Edition

### 🎯 **NEW IN v3.0 - PRODUCTION FEATURES**

#### 🐳 **Docker Containerization**
- ✅ **Multi-stage production builds** - Optimized for size and security (<200MB)
- ✅ **Development and production** configurations with Docker Compose
- ✅ **Health checks and monitoring** - Container-native health endpoints
- ✅ **Security hardening** - Non-root user, read-only filesystem
- ✅ **Volume management** - Persistent data and credential handling

#### 🔨 **Smithery Integration**
- ✅ **One-click deployment** - Web interface for easy configuration
- ✅ **Team-friendly setup** - Individual credentials, shared project structure
- ✅ **Automatic health monitoring** - Real-time server status and metrics
- ✅ **Cross-platform support** - Windows, macOS, Linux compatibility
- ✅ **Configuration validation** - Smart path handling and error detection

#### 🛡️ **Enhanced Security**
- ✅ **Team security policies** - Enterprise-grade credential management
- ✅ **Individual credential isolation** - No shared secrets between users
- ✅ **Compliance monitoring** - Automated security and rotation tracking
- ✅ **Audit logging** - Google Cloud Console integration
- ✅ **Incident response** - Documented procedures for security events

#### 📚 **Complete Documentation**
- ✅ **User guides for all deployment methods** - Smithery, Docker, Manual
- ✅ **Team onboarding procedures** - Step-by-step for corporate environments
- ✅ **Troubleshooting and diagnostics** - Common issues and automated solutions
- ✅ **Security best practices** - Individual and team security policies

### 📊 **Production Quality Metrics**
- **Container Size**: <200MB production image
- **Security Score**: Non-root user, minimal attack surface
- **Documentation Coverage**: 7 comprehensive guides (2000+ lines)
- **Deployment Options**: 3 methods (Smithery, Docker, Manual)
- **Team Ready**: Multi-user, enterprise security, compliance monitoring

## 🎯 Core Capabilities - Enhanced

### Clear API Separation

- 📅 **Google Calendar API v3** - Full calendar event management with guest permissions
- 🎥 **Google Meet API v2 (GA)** - Space management, conference records, and participant tracking

### Enterprise Features

- 📝 **Auto-Transcription** - Enable automatic meeting transcription
- 🧠 **Smart Notes** - AI-generated meeting summaries with Gemini
- 📊 **Attendance Reports** - Generate detailed attendance tracking
- 🛡️ **Meeting Moderation** - Chat/presentation restrictions and controls
- 👀 **Viewer Mode** - Force participants to join as viewers by default
- 📹 **Auto-Recording** - Enable automatic recording (manual activation required)

### Advanced Space Management

- 🏗️ **Google Meet Spaces** - Direct space creation and configuration
- 👥 **Participant Tracking** - Access participant data and session information
- 🔒 **Access Controls** - OPEN, TRUSTED, or RESTRICTED access types
- ⚙️ **Artifact Configuration** - Recording, transcription, and smart notes settings

## 🚀 **Installation & Deployment**

### **🔨 Smithery (Recommended for Teams)**

1. **Visit [Smithery.ai](https://smithery.ai/server/@inside-hair/google-meet-mcp-server)**
2. **Click "Deploy Server"**
3. **Configure your Google credentials path**
4. **Start using in Claude Desktop**

**📖 [Complete Smithery User Guide](./docs/SMITHERY_USER_GUIDE.md)** - Step-by-step for teams

### **🐳 Docker (Recommended for Production)**

```bash
# Quick start development
./scripts/docker-deploy.sh dev

# Production deployment
./scripts/docker-deploy.sh prod --backup --fresh

# View status
./scripts/docker-deploy.sh status
```

**📖 [Docker Deployment Guide](./docs/DOCKER_DEPLOYMENT.md)** - Complete containerization

### **⚙️ Manual Installation**

```bash
# Clone the repository
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server

# Install dependencies
npm install

# Setup OAuth credentials
npm run setup
```

**📖 [Manual Setup Guide](./docs/SETUP.md)** - Full control installation

## 🛡️ **Security & Team Management**

### **🔐 Individual Security**
- **Each user creates their own Google OAuth credentials**
- **No shared credentials or tokens between team members**
- **Secure file storage with proper permissions (chmod 600)**
- **📖 [Security Guide](./docs/SECURITY.md)** - Individual security practices

### **👥 Team Security**
- **Comprehensive team onboarding procedures**
- **Corporate Google Cloud project management**
- **Credential rotation and compliance monitoring**
- **📖 [Team Security Guide](./docs/TEAM_SECURITY.md)** - Enterprise team deployment

### **🔧 Troubleshooting**
- **Complete diagnostics and problem resolution**
- **Common issues and solutions**
- **Health check scripts and monitoring**
- **📖 [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)** - Problem resolution

## Usage

### Development Mode (TypeScript with Hot Reload)

```bash
# Start server in development mode
npm run start

# Run setup in TypeScript mode
npm run setup
```

### Production Mode (Compiled JavaScript)

```bash
# Build TypeScript to JavaScript
npm run build

# Run compiled server
npm run start:js
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Type checking only
npm run type-check
```

## 🛠️ **Available Tools (21 Total) - All Type-Safe & Validated**

### 📅 Google Calendar API v3 Tools (6 tools)

#### 1. `calendar_v3_list_calendars` ✅ **Validated**
List all calendars available to the user.

**Validation**: No parameters required

#### 2. `calendar_v3_list_events` ✅ **Validated**
List upcoming calendar events with filtering options.

**Validation**: Date formats, max results (1-2500), calendar ID format

#### 3. `calendar_v3_get_event` ✅ **Validated**
Get detailed information about a specific calendar event.

**Validation**: Required event_id parameter

#### 4. `calendar_v3_create_event` ✅ **Validated**
Create a new calendar event with optional Google Meet conference.

**Validation**: Required fields, ISO date format, guest permissions, duration logic

**Parameters:**
- `summary` (required): Event title
- `start_time` (required): ISO format start time
- `end_time` (required): ISO format end time
- `create_meet_conference` (optional): Add Google Meet
- `guest_can_invite_others` (optional): Guest invitation permissions
- `guest_can_modify` (optional): Guest modification permissions
- `guest_can_see_other_guests` (optional): Guest visibility permissions

#### 5. `calendar_v3_update_event` ✅ **Validated**
Update an existing calendar event.

**Validation**: Required event_id, optional update fields, time validation

#### 6. `calendar_v3_delete_event` ✅ **Validated**
Delete a calendar event.

**Validation**: Required event_id parameter

### 🎥 Google Meet API v2 Tools (15 tools)

#### 7. `meet_v2_create_space` ✅ **Validated**
Create a Google Meet space with advanced configuration.

**Validation**: Access type enum, boolean flags, restriction combinations

**Parameters:**
- `access_type`: "OPEN" | "TRUSTED" | "RESTRICTED" (default: "TRUSTED")
- `enable_recording`: Enable automatic recording preparation
- `enable_transcription`: Enable automatic transcription
- `moderation_mode`: "ON" | "OFF" meeting moderation
- `chat_restriction`: Chat permissions control
- `present_restriction`: Presentation permissions control

#### 8. `meet_v2_get_space` ✅ **Validated**
Get details of a Google Meet space.

**Validation**: Space name format (`spaces/{space_id}`)

#### 9. `meet_v2_update_space` ✅ **Validated**
Update configuration of a Google Meet space.

#### 10. `meet_v2_end_active_conference` ✅ **Validated**
End the active conference in a Google Meet space.

**Validation**: Space name format validation

#### 11. `meet_v2_list_conference_records` ✅ **Validated**
List conference records for historical meetings.

**Validation**: Filter format, page size limits (1-50)

#### 12-21. **Additional Meet API Tools** ✅ **All Validated**
- `meet_v2_get_conference_record` - Get specific conference details
- `meet_v2_list_recordings` - List conference recordings  
- `meet_v2_get_recording` - Get recording details
- `meet_v2_list_transcripts` - List conference transcripts
- `meet_v2_get_transcript` - Get transcript details
- `meet_v2_list_transcript_entries` - List transcript speech segments
- `meet_v2_get_participant` - Get participant details
- `meet_v2_list_participants` - List conference participants
- `meet_v2_get_participant_session` - Get session details
- `meet_v2_list_participant_sessions` - List participant sessions

**Validation Features:**
- Resource name format validation (conferenceRecords/{id}/recordings/{id})
- Page size limits (1-1000 depending on endpoint)
- Regex validation for all Google API resource identifiers
- Smart defaults for pagination

## MCP Configuration for Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "google-meet": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/google-meet-mcp-server/src/index.ts"],
      "env": {
        "G_OAUTH_CREDENTIALS": "/absolute/path/to/credentials.json"
      },
      "disabled": false
    }
  }
}
```

**Production Configuration (with compiled JS):**

```json
{
  "mcpServers": {
    "google-meet": {
      "command": "node",
      "args": ["/absolute/path/to/google-meet-mcp-server/build/index.js"],
      "env": {
        "G_OAUTH_CREDENTIALS": "/absolute/path/to/credentials.json"
      },
      "disabled": false
    }
  }
}
```

## 🏗️ Enterprise Architecture

### TypeScript Structure

```
google-meet-mcp-server/
├── src/
│   ├── index.ts                 # Main MCP server (TypeScript)
│   ├── GoogleMeetAPI.ts         # API wrapper (fully typed)
│   ├── setup.ts                 # OAuth setup (typed)
│   ├── types/                   # Type system (921+ lines)
│   │   ├── google-apis.d.ts        # Google API types
│   │   ├── mcp-server.d.ts         # MCP-specific types
│   │   ├── utilities.d.ts          # Branded types & helpers
│   │   └── index.ts                # Centralized exports
│   ├── validation/              # Zod schemas
│   │   └── meetSchemas.ts          # 6 validated tools
│   └── errors/                  # Error handling
│       └── GoogleApiErrorHandler.ts
├── test/                        # Test suite (101 tests)
│   ├── setup.ts                    # Test utilities
│   ├── GoogleMeetAPI.test.ts       # Unit tests
│   ├── integration.test.ts         # Integration tests
│   ├── validation.test.ts          # Validation tests
│   └── simple.test.ts             # Basic functionality
├── build/                       # Compiled JavaScript
├── package.json                 # TypeScript + testing deps
├── tsconfig.json               # TypeScript configuration
└── vitest.config.ts            # Testing configuration
```

### Type Safety Features

```typescript
// Branded types for enhanced safety
type EventId = Brand<string, 'EventId'>;
type SpaceName = Brand<string, 'SpaceName'>;

// Complete API interfaces
interface GoogleMeetAPI {
  createMeetSpace(config: SpaceConfigInput): Promise<MeetSpace>;
  listCalendars(): Promise<ProcessedCalendar[]>;
  createCalendarEvent(data: CreateEventInput): Promise<ProcessedEvent>;
}

// Zod validation with business logic
const CreateSpaceSchema = z.object({
  access_type: z.enum(["OPEN", "TRUSTED", "RESTRICTED"]).default("TRUSTED"),
  enable_recording: z.boolean().default(false)
}).refine((data) => {
  // Custom business logic validation
  if (data.enable_recording && data.access_type === "OPEN") {
    throw new Error("Recording cannot be enabled for OPEN access meetings");
  }
  return true;
});
```

## Error Handling - Claude Desktop Optimized

The server provides context-aware error messages designed for AI assistance:

### Google API Errors
```
🔐 Access Denied
Problem: Your Google account doesn't have the required permissions.
Solution: 
1. Run `npm run setup` to re-authenticate
2. Make sure you granted all requested permissions  
3. For enterprise features, check you have Google Workspace Business+
```

### Enterprise Feature Errors
```
🏢 Enterprise Feature Required
Problem: This Meet feature requires Google Workspace Business Standard or higher.
Options:
- Use basic calendar events with Meet links instead
- Upgrade your Google Workspace plan
Alternative: Try `calendar_v3_create_event` with `create_meet_conference: true`
```

## Requirements

### Technical Requirements
- **Node.js**: 18+ (for TypeScript support)
- **TypeScript**: 5+ (included in dependencies)
- **Google Account**: Any Google account works for basic features

### Feature Requirements
- ✅ **Basic Features**: Works with any Google account
- ✅ **Calendar Integration**: Google Calendar API enabled
- 🏢 **Enterprise Features**: Google Workspace Business Standard or higher
- 🧠 **Smart Notes**: Gemini Business/Enterprise license
- 📹 **Recording**: Manual activation required during meetings

## Development

### TypeScript Development

```bash
# Development with hot reload
npm run start          # tsx src/index.ts with watch
npm run setup          # tsx src/setup.ts

# Type checking
npm run type-check     # tsc --noEmit

# Testing
npm test              # vitest run
npm run test:watch    # vitest with watch mode
npm run test:coverage # coverage report
```

### Production Build

```bash
# Build TypeScript
npm run build         # tsc to build/ directory
npm run clean         # clean build directory

# Run compiled JavaScript
npm run start:js      # node build/index.js
npm run setup:js      # node build/setup.js
```

## Testing Results

```
✅ Test Files: 5 passed (5)
✅ Tests: 101 passed (101)  
✅ Duration: 2.61s
✅ TypeScript: 0 compilation errors
✅ Type Coverage: ~90% specific types

Test Categories:
- 28 GoogleMeetAPI unit tests
- 12 Integration workflow tests  
- 35 Validation schema tests
- 16 Basic functionality tests
- 10 MCP server tests
```

## 🔧 **Common Issues & Quick Fixes**

### **🚨 Server Won't Start**
```bash
# Check credentials path and permissions
ls -la "/path/to/your/credentials.json"
chmod 600 "/path/to/your/credentials.json"

# Verify configuration
npx tsx scripts/health-check.js
```

### **🔐 Authentication Failed**
```bash
# Re-run OAuth setup
G_OAUTH_CREDENTIALS="/path/to/creds.json" npm run setup

# Check Google Cloud Console:
# 1. APIs enabled (Calendar + Meet)
# 2. OAuth consent screen configured
# 3. Scopes properly set
```

### **🤖 Claude Desktop Issues**
```bash
# Verify MCP configuration
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Restart Claude Desktop
# Check server status in Smithery (if using)
```

**📖 [Complete Troubleshooting Guide](./docs/TROUBLESHOOTING.md)** - Detailed problem resolution

## Enterprise Features Limitations

### Google Meet API v2
- Some advanced features require Google Workspace licenses
- Recording cannot be started programmatically (requires manual activation)
- Smart Notes require Gemini Business/Enterprise license
- Participant data is only available for completed conferences

### Implementation Notes
- All 21 tools are fully implemented using official Google APIs
- Advanced features use direct REST API calls to Google Meet API v2
- Authentication and token management handled automatically
- Complete TypeScript coverage with branded types for safety

## 🤝 **Contributing**

### **Development Requirements**
- ✅ **TypeScript code** with proper types (no 'any' types)
- ✅ **Tests pass** (`npm test`) - maintain 100% test success rate
- ✅ **Zod validation schemas** for new tools
- ✅ **Error handling** for new endpoints
- ✅ **Documentation updates** for new features
- ✅ **Security review** for credential handling

### **Contribution Process**
1. **Fork and clone** the repository
2. **Create feature branch** from `main`
3. **Implement changes** with tests and documentation
4. **Run full test suite** (`npm test`)
5. **Update relevant guides** in `docs/`
6. **Submit pull request** with detailed description

## 📄 **License**

**ISC License** - Free for commercial and personal use. See [LICENSE](./LICENSE) file for details.

---

**🎉 Ready to supercharge your Google Meet workflow? Choose your deployment method above and get started in minutes!**

> 💡 **Recommended**: Start with [Smithery deployment](./docs/SMITHERY_USER_GUIDE.md) for the easiest setup experience.

## 📞 **Support & Resources**

### **📚 Documentation**
- **[Smithery User Guide](./docs/SMITHERY_USER_GUIDE.md)** - Team deployment with Smithery
- **[Docker Deployment](./docs/DOCKER_DEPLOYMENT.md)** - Containerized production deployment
- **[Manual Setup](./docs/SETUP.md)** - Direct installation and configuration
- **[Security Guide](./docs/SECURITY.md)** - Individual security best practices
- **[Team Security](./docs/TEAM_SECURITY.md)** - Enterprise team management
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Problem diagnosis and resolution

### **🆘 Getting Help**
- **🐛 [GitHub Issues](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues)** - Bug reports and feature requests
- **🔨 [Smithery Support](https://smithery.ai/support)** - Platform-specific help
- **📖 [MCP Documentation](https://modelcontextprotocol.io)** - Model Context Protocol resources

### **🎯 Quick Links**
- **Repository**: [github.com/INSIDE-HAIR/google-meet-mcp-server](https://github.com/INSIDE-HAIR/google-meet-mcp-server)
- **Smithery Page**: [smithery.ai/server/@inside-hair/google-meet-mcp-server](https://smithery.ai/server/@inside-hair/google-meet-mcp-server)
- **Docker Hub**: [ghcr.io/inside-hair/google-meet-mcp-server](https://ghcr.io/inside-hair/google-meet-mcp-server)

## Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Powered by Google Calendar API and Google Meet API
- Compatible with Claude Desktop and other MCP clients
- Enterprise-grade TypeScript architecture
- Comprehensive Zod validation system