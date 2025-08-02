# 🔐 Security Guide - Individual Security Practices

## Overview

This guide covers security best practices for individual users deploying the Google Meet MCP Server v3.0. For team and enterprise security, see the [Team Security Guide](./TEAM_SECURITY.md).

## 🚨 Critical Security Principles

### 1. **Individual Credentials Only**
- ✅ Each user must create their own Google OAuth credentials
- ✅ Never share CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN
- ✅ Use separate credentials for development vs production
- ❌ Never use shared team credentials

### 2. **Secure Credential Storage**

#### **Environment Variables (Recommended)**
```bash
# Direct token authentication - most secure
export CLIENT_ID="your-client-id.apps.googleusercontent.com"
export CLIENT_SECRET="GOCSPX-your-client-secret"
export REFRESH_TOKEN="1//your-refresh-token"
```

#### **File-based Storage (Alternative)**
```bash
# Secure file permissions
chmod 600 /path/to/credentials.json
chmod 600 /path/to/token.json

# Verify permissions
ls -la /path/to/credentials.json
# Should show: -rw-------
```

### 3. **Safe Storage Locations**

#### **✅ SAFE Locations:**
- `~/.config/google-meet-mcp/` (Linux/macOS)
- `%APPDATA%\google-meet-mcp\` (Windows)
- Private directories with 700 permissions
- Environment variables in secure shells

#### **❌ UNSAFE Locations:**
- Desktop, Downloads, or public folders
- Cloud storage (Google Drive, OneDrive, Dropbox)
- Version control repositories
- Shared network drives
- Email or messaging platforms

## 🔒 Authentication Setup

### Method 1: Direct Token Authentication (Recommended)

1. **Get OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Calendar API and Google Meet API
   - Create OAuth 2.0 credentials (Desktop Application)

2. **Extract Credentials:**
   ```json
   {
     "client_id": "123456789-abc.apps.googleusercontent.com",
     "client_secret": "GOCSPX-abcdefghijklmnop"
   }
   ```

3. **Generate Refresh Token:**
   ```bash
   # Use the built-in helper
   CLIENT_ID="your-id" CLIENT_SECRET="your-secret" npm run setup
   ```

4. **Set Environment Variables:**
   ```bash
   export CLIENT_ID="your-client-id"
   export CLIENT_SECRET="your-client-secret" 
   export REFRESH_TOKEN="your-refresh-token"
   ```

### Method 2: File-based Authentication

1. **Create Secure Directory:**
   ```bash
   mkdir -p ~/.config/google-meet-mcp
   chmod 700 ~/.config/google-meet-mcp
   ```

2. **Store Credentials Securely:**
   ```bash
   # Move downloaded credentials
   mv ~/Downloads/credentials.json ~/.config/google-meet-mcp/
   chmod 600 ~/.config/google-meet-mcp/credentials.json
   ```

3. **Run Setup:**
   ```bash
   G_OAUTH_CREDENTIALS="~/.config/google-meet-mcp/credentials.json" npm run setup
   ```

## 🛡️ Operational Security

### 1. **Regular Security Maintenance**

#### **Monthly Tasks:**
- Review Google Cloud Console audit logs
- Check for unauthorized API usage
- Verify credential file permissions
- Update dependencies: `npm audit`

#### **Quarterly Tasks:**
- Rotate OAuth credentials
- Review granted permissions in Google Account settings
- Update the MCP server to latest version

### 2. **Monitoring and Alerts**

#### **Google Cloud Console Monitoring:**
- Monitor API quota usage for unusual spikes
- Set up billing alerts for unexpected costs
- Review audit logs for unauthorized access

#### **Local Monitoring:**
```bash
# Check file permissions regularly
ls -la ~/.config/google-meet-mcp/

# Monitor server logs for errors
npm run start 2>&1 | grep -E "(error|warning|unauthorized)"
```

### 3. **Incident Response**

#### **If Credentials are Compromised:**
1. **Immediately revoke credentials** in Google Cloud Console
2. **Generate new OAuth credentials** with different IDs
3. **Update environment variables** or credential files
4. **Review recent API activity** in Google Cloud Console
5. **Check for unauthorized calendar events** or meeting spaces

#### **If Unusual Activity Detected:**
1. **Stop the MCP server** immediately
2. **Review Google Cloud audit logs**
3. **Check Claude Desktop configuration** for modifications
4. **Verify credential file integrity**
5. **Contact team security if in corporate environment**

## ⚙️ Configuration Security

### 1. **Claude Desktop Configuration**

#### **Secure Configuration:**
```json
{
  "mcpServers": {
    "google-meet": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/google-meet-mcp-server/src/index.ts"],
      "env": {
        "CLIENT_ID": "your-client-id",
        "CLIENT_SECRET": "your-client-secret",
        "REFRESH_TOKEN": "your-refresh-token"
      },
      "disabled": false
    }
  }
}
```

#### **Configuration File Security:**
```bash
# Secure Claude Desktop config
chmod 600 ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 2. **Environment Variable Security**

#### **Shell Configuration:**
```bash
# Add to ~/.bashrc or ~/.zshrc (but be careful with shared systems)
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
export REFRESH_TOKEN="your-refresh-token"

# Make shell config private
chmod 600 ~/.bashrc ~/.zshrc
```

## 📋 Security Checklist

### **Initial Setup:**
- [ ] Created individual Google Cloud project
- [ ] Generated personal OAuth credentials
- [ ] Stored credentials in secure location with proper permissions
- [ ] Set up environment variables or secure file paths
- [ ] Tested authentication with `npm run setup`
- [ ] Verified Claude Desktop integration works

### **Ongoing Security:**
- [ ] Credentials stored securely (not in public locations)
- [ ] File permissions set correctly (600 for files, 700 for directories)
- [ ] Regular monitoring of Google Cloud Console activity
- [ ] Dependencies updated monthly (`npm audit && npm update`)
- [ ] No credentials shared via email/chat/documents
- [ ] Environment variables not committed to version control

### **Emergency Preparedness:**
- [ ] Know how to revoke credentials in Google Cloud Console
- [ ] Have backup authentication method available
- [ ] Understand how to check audit logs
- [ ] Team security contact information (if applicable)

## 🆘 Common Security Issues

### **Issue: Permission Denied Errors**
```bash
# Fix file permissions
chmod 600 /path/to/credentials.json
chmod 600 /path/to/token.json
chmod 700 /path/to/config/directory
```

### **Issue: Credentials in Version Control**
```bash
# Remove from git history
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch credentials.json' \
--prune-empty --tag-name-filter cat -- --all

# Add to .gitignore
echo "credentials.json" >> .gitignore
echo "token.json" >> .gitignore
echo ".env*" >> .gitignore
```

### **Issue: Unauthorized API Usage**
1. Check Google Cloud Console → APIs & Services → Credentials
2. Review OAuth consent screen authorized domains
3. Verify no unexpected applications have access
4. Rotate credentials if necessary

## 📞 Getting Help

### **Security Questions:**
- **Google Cloud Console**: [support.google.com](https://support.google.com)
- **MCP Security**: [GitHub Issues](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues)
- **Claude Desktop**: Official Claude support channels

### **Emergency Contact:**
- **Team Security**: See [Team Security Guide](./TEAM_SECURITY.md)
- **Google Security**: [security.google.com](https://security.google.com)

---

**Remember: Security is a continuous process, not a one-time setup. Regular monitoring and maintenance are essential for keeping your Google Meet MCP Server secure.**