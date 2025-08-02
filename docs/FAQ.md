# ❓ Frequently Asked Questions (FAQ)

## 📋 General Questions

### Q: What is the Google Meet MCP Server?
**A:** The Google Meet MCP Server is a Model Context Protocol (MCP) server that integrates Google Calendar API v3 and Google Meet API v2 with Claude AI. It provides 23+ validated tools for managing calendar events, creating Meet spaces, accessing meeting recordings and transcripts, and tracking participant data.

### Q: What's new in version 3.0?
**A:** Version 3.0 introduces:
- **Direct token authentication** (recommended for production)
- **Enhanced monitoring** with health checks and metrics
- **Smithery platform compatibility** for team deployment
- **Comprehensive validation** with business logic
- **23+ fully validated tools** (up from previous versions)
- **Production-ready monitoring** and error handling

### Q: How many tools are available?
**A:** The server provides **23 validated tools**:
- **8 Google Calendar API v3 tools**: calendar management, event CRUD operations, free/busy queries
- **15 Google Meet API v2 tools**: space management, conference records, recordings, transcripts, participant tracking

---

## 🚀 Setup and Installation

### Q: What are the system requirements?
**A:** 
- **Node.js**: 18+ (LTS recommended)
- **npm**: 9+ or yarn 1.22+
- **Google Workspace**: Business Standard+ for advanced features
- **Google Cloud Project**: With billing enabled
- **Claude Desktop**: Latest version for MCP integration

### Q: What Google Workspace license do I need?
**A:**
- **Basic Features**: Any Google account (personal or workspace)
- **Advanced Meet Features**: Google Workspace Business Standard+
- **Recording**: Manual activation required during meetings
- **Smart Notes**: Requires Gemini Business/Enterprise license
- **Enterprise Security**: Google Workspace Enterprise editions

### Q: How do I get Google Cloud credentials?
**A:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Calendar API and Google Meet API
4. Create OAuth 2.0 credentials (Desktop Application type)
5. Download the credentials JSON file
6. Follow our [Setup Guide](./deployment/SETUP.md) for detailed steps

### Q: What's the difference between authentication methods?
**A:**
- **Direct Token (Recommended)**: Environment variables with CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
- **File-based**: Point to credentials.json file using G_OAUTH_CREDENTIALS
- **Legacy**: Separate GOOGLE_MEET_CREDENTIALS_PATH and GOOGLE_MEET_TOKEN_PATH

---

## 🔧 Technical Questions

### Q: Why are my tools not showing up in Claude Desktop?
**A:** Check these common issues:
1. **MCP Server Status**: Ensure the server is running without errors
2. **Claude Desktop Configuration**: Verify claude_desktop_config.json is correct
3. **Authentication**: Confirm OAuth setup completed successfully
4. **Restart Required**: Restart Claude Desktop after configuration changes
5. **Path Issues**: Use absolute paths in configuration files

### Q: How do I troubleshoot authentication errors?
**A:**
1. **Check Credentials**: Verify credentials.json exists and has correct permissions (600)
2. **API Enablement**: Ensure Calendar API and Meet API are enabled in Google Cloud Console
3. **OAuth Consent**: Verify OAuth consent screen is properly configured
4. **Token Refresh**: Delete existing token files and re-run `npm run setup`
5. **Scopes**: Confirm all required OAuth scopes are included

### Q: What's the difference between the two entry points?
**A:**
- **`src/index.ts`**: Standard MCP server for direct deployment, includes full monitoring
- **`src/smithery.ts`**: Smithery-compatible stateless server for platform deployment
- Both provide identical functionality, just different initialization methods

### Q: How do I enable monitoring and health checks?
**A:**
```bash
# Enable health check endpoint
export ENABLE_HEALTH_CHECK=true
export HEALTH_CHECK_PORT=9090

# Start server
npm run start

# Test endpoints
curl http://localhost:9090/health
curl http://localhost:9090/metrics
```

### Q: Can I use this with other AI platforms besides Claude?
**A:** The server implements the Model Context Protocol (MCP) standard, so it should work with any MCP-compatible AI platform. However, it's specifically optimized for Claude Desktop integration.

---

## 🎥 Google Meet Specific Questions

### Q: Why can't I create recordings?
**A:** Common issues:
- **Workspace License**: Recording requires Google Workspace Business Standard+
- **Manual Activation**: API only prepares recording - you must manually start during meeting
- **Permissions**: Ensure user has recording permissions in Workspace admin
- **Meeting Type**: Some meeting types may restrict recording

### Q: What's the difference between access types?
**A:**
- **OPEN**: Anyone with link can join (no Google account required)
- **TRUSTED**: Requires Google account to join (default, recommended)
- **RESTRICTED**: Only invited participants can join

### Q: How do transcripts work?
**A:**
- Transcripts generate automatically for meetings with transcription enabled
- Available 24-48 hours after meeting ends
- Includes timestamps and participant identification
- Smart notes (AI summaries) require Gemini license

### Q: Can I get participant data from meetings?
**A:** Yes, using conference records you can access:
- Participant names and join/leave times
- Session information (multiple sessions if participant rejoined)
- Overall attendance duration
- Meeting engagement metrics

---

## 📅 Calendar Integration Questions

### Q: Can I create recurring meetings?
**A:** Yes, use the `calendar_v3_create_event` tool with appropriate recurrence rules. The API supports complex recurrence patterns including daily, weekly, monthly, and custom patterns.

### Q: How do I check if someone is available?
**A:** Use the `calendar_v3_freebusy_query` tool to check availability across multiple calendars for a specific time range.

### Q: Can I create events in other people's calendars?
**A:** Only if you have write access to their calendar. The tool respects Google Calendar permissions - you can only create events in calendars where you have appropriate access.

### Q: What timezone handling is supported?
**A:** Full timezone support using IANA timezone identifiers (e.g., "America/New_York"). Times are converted appropriately for all participants based on their timezone settings.

---

## 🔐 Security and Privacy

### Q: How is my data protected?
**A:**
- **OAuth 2.0**: Industry-standard authentication
- **Individual Credentials**: Each user has separate credentials
- **No Data Storage**: Server doesn't store your calendar or meeting data
- **Token Encryption**: Refresh tokens handled securely
- **HTTPS Only**: All Google API communication encrypted

### Q: Can other team members see my credentials?
**A:** No. Each user must create and use their own individual Google OAuth credentials. The architecture prevents credential sharing for security.

### Q: What data does the server access?
**A:** Only what you explicitly grant through OAuth scopes:
- Calendar events and metadata
- Meet spaces you create or have access to
- Conference records for meetings you attended
- No personal files, emails, or other Google services

### Q: How do I revoke access?
**A:**
1. Go to [Google Account permissions](https://myaccount.google.com/permissions)
2. Find your MCP Server application
3. Click "Remove Access"
4. Delete local credentials and token files

---

## 🚨 Troubleshooting

### Q: Server won't start - what should I check?
**A:**
1. **Node.js Version**: Ensure Node.js 18+ is installed
2. **Dependencies**: Run `npm install` to ensure all packages are installed
3. **Credentials Path**: Verify credential file paths are correct and absolute
4. **File Permissions**: Check credentials have 600 permissions
5. **Port Conflicts**: Ensure no other process is using required ports

### Q: Getting "Module not found" errors?
**A:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Verify TypeScript compilation
npm run build

# Check Node.js version
node --version  # Should be 18+
```

### Q: "Permission denied" errors when accessing Google APIs?
**A:**
1. **Check OAuth Scopes**: Ensure all required scopes are included in OAuth consent screen
2. **API Enablement**: Verify Calendar API and Meet API are enabled
3. **Account Type**: Some features require Google Workspace (not personal Gmail)
4. **Admin Permissions**: Some Meet features require Workspace admin approval

### Q: High memory usage or performance issues?
**A:**
- **Check Resource Limits**: Monitor using `curl http://localhost:9090/system`
- **Review Logs**: Look for memory leaks or excessive API calls
- **Optimize Configuration**: Disable debug logging in production
- **Update Dependencies**: Ensure latest versions for performance fixes

---

## 🏢 Enterprise and Team Usage

### Q: How do I deploy this for my team?
**A:** We recommend using [Smithery](./deployment/SMITHERY_USER_GUIDE.md) for team deployment:
- **Individual Credentials**: Each team member creates their own OAuth credentials
- **Centralized Management**: Smithery handles deployment and monitoring
- **Team Security**: Follow our [Team Security Guide](./security/TEAM_SECURITY.md)

### Q: Can I use Docker for deployment?
**A:** Yes! See our [Docker Deployment Guide](./deployment/DOCKER_DEPLOYMENT.md) for:
- Production-ready containerization
- Multi-stage builds for optimization
- Health checks and monitoring integration
- Volume management for credentials

### Q: How do I monitor the server in production?
**A:** Version 3.0 includes comprehensive monitoring:
- **Health Checks**: `/health`, `/health/detailed`, `/ready` endpoints
- **Metrics**: Prometheus-compatible metrics at `/metrics`
- **API Monitoring**: Real-time Google API status tracking
- **Error Tracking**: Detailed error logging and classification

### Q: What about compliance and audit requirements?
**A:**
- **Meeting Records**: Automatic recording and transcript generation
- **Access Logs**: Detailed logging of all API calls and access
- **Data Retention**: Configurable retention policies
- **Audit Trail**: Complete audit trail for compliance reporting

---

## 📊 Performance and Limits

### Q: What are the API rate limits?
**A:**
- **Google Calendar API**: 1,000,000 queries per day (default)
- **Google Meet API**: 10,000 read requests, 1,000 write requests per day
- **Per User**: 1,000 queries per 100 seconds per user
- Limits can be increased by contacting Google Cloud Support

### Q: How many concurrent users can the server handle?
**A:** The server is designed for individual use (one user per server instance). For team deployment:
- **Smithery**: Handles multiple individual server instances
- **Docker**: Can be scaled horizontally with load balancers
- **Performance**: Each instance can handle hundreds of API calls per minute

### Q: How do I optimize performance?
**A:**
- **Use Direct Token Auth**: Faster than file-based authentication
- **Enable Health Checks**: Monitor performance metrics
- **Optimize Queries**: Use appropriate page sizes and filters
- **Cache Results**: When appropriate for your use case

---

## 🔄 Migration and Updates

### Q: How do I update to version 3.0?
**A:**
1. **Backup Configuration**: Save your current credentials and settings
2. **Update Code**: `git pull origin main && npm install`
3. **Review Breaking Changes**: Check [CHANGELOG.md](../CHANGELOG.md) for any breaking changes
4. **Update Configuration**: Migrate to new environment variable format if needed
5. **Test**: Verify functionality before deploying to production

### Q: Can I migrate from file-based to direct token authentication?
**A:** Yes:
1. Extract CLIENT_ID and CLIENT_SECRET from your credentials.json
2. Run `npm run setup` to generate REFRESH_TOKEN
3. Set environment variables instead of G_OAUTH_CREDENTIALS
4. Test the new configuration
5. Remove old credential files once confirmed working

---

## 🆘 Getting Help

### Q: Where can I get support?
**A:**
- **Documentation**: Start with our comprehensive [Documentation Hub](./README.md)
- **GitHub Issues**: [Report issues](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues) for bugs or feature requests
- **Troubleshooting Guide**: See [TROUBLESHOOTING.md](./deployment/TROUBLESHOOTING.md) for common issues
- **Community**: Check existing GitHub issues for similar problems

### Q: How do I report a bug?
**A:**
1. **Check Existing Issues**: Search [GitHub Issues](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues) first
2. **Gather Information**: Include error messages, logs, configuration (sanitized)
3. **Follow Template**: Use our issue template for consistent reporting
4. **Provide Context**: Include steps to reproduce and environment details

### Q: Can I contribute to the project?
**A:** Absolutely! See our [Development Guide](./development/DEVELOPMENT_GUIDE.md) for:
- Setting up development environment
- Adding new features or tools
- Testing and quality assurance
- Submitting pull requests

---

**💡 Tip: For quick answers, use Ctrl+F (Cmd+F on Mac) to search this FAQ for specific terms or error messages.**