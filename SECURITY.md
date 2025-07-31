# 🔐 Security Guide - Google Meet MCP Server v2.0

## Overview

This document outlines security best practices for deploying and using the Google Meet MCP Server. Security is paramount when dealing with OAuth credentials and API access.

## 🚨 Critical Security Rules

### **NEVER COMMIT THESE FILES:**
```
❌ credentials.json           # Your OAuth credentials
❌ credentials.token.json     # Your access tokens  
❌ token.json                 # Legacy token file
❌ .env                       # Environment variables with real paths
❌ client_secret*.json        # Any Google client secret files
❌ Any file with real credentials or tokens
```

### **SAFE TO COMMIT:**
```
✅ .env.example              # Template without real values
✅ src/                      # Source code  
✅ Dockerfile                # Container instructions
✅ smithery.yaml             # Platform configuration
✅ *.md files                # Documentation
✅ package.json              # Dependencies
```

## 🛡️ Security Architecture

### **How Credentials Work:**

```
┌──────────────────────────────────────────┐
│             YOUR REPOSITORY              │
│  ✅ Source code (public)                 │
│  ✅ Configuration templates              │
│  ❌ NO real credentials                  │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│            USER'S MACHINE                │
│  🔑 User creates their own credentials   │
│  🔑 Stores them locally & securely       │
│  🔑 Configures their own paths           │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│         SECURE DEPLOYMENT                │
│  🔒 Credentials never leave user's       │
│      control or local environment        │
└──────────────────────────────────────────┘
```

## 📋 Security Checklist

### **Before Publishing Your MCP Server:**

- [ ] **Check `.gitignore`**: Ensure all sensitive files are excluded
- [ ] **Scan for secrets**: Run `git log --all --grep="password\|secret\|key\|token"` 
- [ ] **Review `.env` files**: Should contain only template/example values
- [ ] **Verify no hardcoded credentials** in source code
- [ ] **Test with fresh clone**: Clone repo fresh and verify no secrets included

### **For Users Deploying:**

- [ ] **Create your own credentials**: Never use someone else's
- [ ] **Store credentials securely**: Use proper file permissions (600)
- [ ] **Use environment variables**: Avoid hardcoding paths in source
- [ ] **Keep tokens private**: Never share access tokens
- [ ] **Regular rotation**: Rotate credentials periodically

## 🔒 Credential Management

### **1. Creating Secure Credentials:**

#### **Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (don't reuse existing production projects)
3. Enable required APIs:
   - Google Calendar API v3
   - Google Meet API v2
4. Create OAuth 2.0 Credentials:
   - **Type:** Desktop Application (not Web)
   - **Name:** "Google Meet MCP Server - [YOUR NAME]"
   - Download as `credentials.json`

#### **File Permissions:**
```bash
# Set restrictive permissions
chmod 600 credentials.json
chmod 600 credentials.token.json

# Verify permissions  
ls -la credentials.json
# Should show: -rw------- (user read/write only)
```

### **2. Secure Storage Locations:**

#### **Recommended Paths:**
```bash
# macOS
~/Documents/MCP-Credentials/google-meet-credentials.json

# Linux  
~/.config/mcp/google-meet-credentials.json

# Windows
%USERPROFILE%\Documents\MCP-Credentials\google-meet-credentials.json
```

#### **Avoid These Locations:**
```bash
❌ Desktop/                    # Too visible
❌ Downloads/                  # Temporary location
❌ Project directory/          # Risk of accidental commit
❌ Shared folders/            # Others might access
❌ Cloud sync folders/        # Could sync to cloud
```

## 🐳 Docker Security

### **Secure Volume Mounts:**
```bash
# Read-only mount for credentials
docker run \
  -v "/secure/path/credentials.json:/app/credentials.json:ro" \
  -v "/secure/path/tokens:/app/tokens" \
  google-meet-mcp-server:2.0
```

### **Docker Secrets (Production):**
```bash
# Create secret
echo "/path/to/credentials.json" | docker secret create google-creds -

# Use in service
docker service create \
  --secret google-creds \
  --env G_OAUTH_CREDENTIALS="/run/secrets/google-creds" \
  google-meet-mcp-server:2.0
```

### **Container Security:**
```yaml
# docker-compose.yml security configuration
services:
  google-meet-mcp:
    image: google-meet-mcp-server:2.0
    user: "1001:1001"              # Non-root user
    read_only: true                # Read-only filesystem
    security_opt:
      - no-new-privileges:true     # Prevent privilege escalation
    cap_drop:
      - ALL                        # Drop all capabilities
    networks:
      - isolated-network           # Isolated network
```

## 🔨 Smithery Security

### **Credential Configuration:**
```yaml
# Smithery handles credentials securely:
# 1. You provide LOCAL path to YOUR credentials
# 2. Smithery never stores or transmits your credentials
# 3. Server runs with YOUR credentials in YOUR environment

# Example secure configuration:
googleOAuthCredentials: "/Users/yourname/.config/mcp/credentials.json"
```

### **What Smithery Sees vs. Doesn't See:**

**Smithery CAN see:**
- ✅ Your server configuration preferences
- ✅ Performance metrics and logs
- ✅ Error messages (but not credential content)

**Smithery CANNOT see:**
- ❌ Your OAuth credentials  
- ❌ Your access tokens
- ❌ Your Google account data
- ❌ Your meeting content

## ⚠️ Common Security Mistakes

### **1. Committing Credentials:**
```bash
# WRONG - committing real credentials
git add credentials.json
git commit -m "Add my credentials"  # ❌ NEVER DO THIS

# RIGHT - using templates
git add .env.example
git commit -m "Add configuration template"  # ✅ Safe
```

### **2. Sharing Tokens:**
```bash
# WRONG - sharing access tokens
curl -H "Authorization: Bearer ya29.a0AV..." ...  # ❌ Token exposed

# RIGHT - using environment variables  
curl -H "Authorization: Bearer $GOOGLE_TOKEN" ...  # ✅ Hidden
```

### **3. Hardcoded Paths:**
```javascript
// WRONG - hardcoded personal path
const credentialsPath = "/Users/john/Desktop/credentials.json";  // ❌

// RIGHT - environment variable
const credentialsPath = process.env.G_OAUTH_CREDENTIALS;  // ✅
```

### **4. Logging Sensitive Data:**
```javascript
// WRONG - logging tokens
console.log("Token:", accessToken);  // ❌ Token in logs

// RIGHT - logging safely
console.log("Authentication successful");  // ✅ No sensitive data
```

## 🔍 Security Scanning

### **Automated Tools:**
```bash
# Scan for secrets in git history
git-secrets --scan

# Scan with TruffleHog
trufflehog git https://github.com/yourusername/your-repo

# GitHub secret scanning (automatic)
# Enable in repository settings > Security & analysis
```

### **Manual Review:**
```bash
# Search for potential secrets
grep -r "client_secret\|access_token\|refresh_token" src/
grep -r "ya29\|1//\|AIza" .
find . -name "*.json" -exec grep -l "client_id" {} \;
```

## 🚨 Incident Response

### **If Credentials Are Compromised:**

#### **Immediate Actions:**
1. **Revoke credentials** in Google Cloud Console
2. **Remove from git history** if committed:
   ```bash
   git filter-branch --index-filter \
     'git rm --cached --ignore-unmatch credentials.json' HEAD
   git push --force-with-lease origin main
   ```
3. **Generate new credentials**
4. **Update all deployments** with new credentials
5. **Audit access logs** in Google Cloud Console

#### **Prevention:**
```bash
# Add pre-commit hook to prevent credential commits
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -E "(credentials|token|\.env)$"; then
    echo "❌ Prevented commit of sensitive files"
    exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
```

## 📊 Security Monitoring

### **Google Cloud Monitoring:**
- Monitor OAuth consent screen usage
- Review API quotas and unusual usage patterns  
- Enable audit logs for credential access
- Set up alerts for failed authentication attempts

### **Container Monitoring:**
```yaml
# Security monitoring in Docker
version: '3.8'
services:
  google-meet-mcp:
    # ... other config
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "security.audit=true"
```

## 🎯 Security Best Practices Summary

1. **🔐 Credential Hygiene:**
   - Generate unique credentials per deployment
   - Use minimal required scopes
   - Rotate credentials regularly
   - Never share or reuse credentials

2. **📁 File Management:**
   - Store credentials outside project directory
   - Use restrictive file permissions (600)
   - Keep backups in secure locations
   - Never commit to version control

3. **🚀 Deployment Security:**
   - Use read-only container filesystems
   - Run as non-root user
   - Implement network segmentation
   - Monitor access patterns

4. **🔍 Monitoring:**
   - Enable audit logging
   - Monitor for unusual activity
   - Set up automated alerts
   - Regular security reviews

---

**Remember:** The security of your Google Meet MCP Server depends on keeping your OAuth credentials and access tokens completely private. When in doubt, err on the side of caution and treat all credential-related files as highly sensitive.

**Need Help?** 
- 🐛 Report security issues privately to the maintainers
- 📖 Check our [main documentation](./CLAUDE.md)
- 🔒 Review Google's [OAuth security best practices](https://developers.google.com/identity/protocols/oauth2/security-best-practices)