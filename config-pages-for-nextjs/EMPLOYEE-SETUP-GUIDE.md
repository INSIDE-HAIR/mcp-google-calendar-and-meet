# 👥 Employee Setup Guide - Google Meet MCP Server

## Overview
This guide helps employees set up Google Meet integration with Claude Desktop.

## 🚀 Quick Setup (5 minutes)

### Step 1: Receive Setup Link
Your admin will send you a personalized setup link:
```
📧 Setup Link: https://company-app.com/mcp-setup?token=your-unique-token
```

### Step 2: Configure Google Access
1. **Click your setup link**
2. **Follow the Google credentials setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project: `YourName-GoogleMeet-MCP`
   - Enable APIs: Calendar API v3 + Meet API v2
   - Create OAuth 2.0 Credentials (Desktop Application)
   - Download JSON file
3. **Paste the JSON content** in the setup form
4. **Click "Configure Access"**

### Step 3: Get Your Claude Configuration
After setup, you'll receive your personalized configuration:

```json
{
  "mcpServers": {
    "google-meet-company": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json", 
        "-H", "X-API-Key: your-unique-api-key-here",
        "-s",
        "https://company-app.com/api/mcp",
        "--data-binary", "@-"
      ]
    }
  }
}
```

### Step 4: Configure Claude Desktop

#### **On macOS:**
```bash
# Open configuration file
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

#### **On Windows:**
```bash
# Open configuration file
notepad %APPDATA%\Claude\claude_desktop_config.json
```

#### **On Linux:**
```bash
# Open configuration file
nano ~/.config/Claude/claude_desktop_config.json
```

**Replace the entire file content** with your personalized configuration from Step 3.

### Step 5: Restart Claude Desktop
1. **Close Claude Desktop completely**
2. **Reopen Claude Desktop**
3. **Verify setup**: You should see "google-meet-company" in available tools

## ✅ Testing Your Setup

### Test 1: List Calendar Events
```
Ask Claude: "List my calendar events for today"
```
**Expected result**: Your Google Calendar events displayed

### Test 2: Create a Meeting  
```
Ask Claude: "Create a Google Meet for tomorrow at 2 PM called 'Team Sync'"
```
**Expected result**: Meeting created with Google Meet link

### Test 3: Check Available Tools
```
Ask Claude: "What Google Meet tools do you have available?"
```
**Expected result**: List of 17 available tools

## 🛠️ Available Google Meet Tools

Once configured, you can ask Claude to:

### **Calendar Management (5 tools):**
- `calendar_v3_list_events` - List your calendar events
- `calendar_v3_get_event` - Get specific event details  
- `calendar_v3_create_event` - Create events with Meet links
- `calendar_v3_update_event` - Update existing events
- `calendar_v3_delete_event` - Delete events

### **Meet Space Management (12 tools):**
- `meet_v2_create_space` - Create Meet spaces with advanced settings
- `meet_v2_get_space` - Get space information
- `meet_v2_update_space` - Update space configuration
- `meet_v2_end_active_conference` - End active meetings
- `meet_v2_list_conference_records` - List past meeting records
- `meet_v2_get_conference_record` - Get specific meeting details
- `meet_v2_list_recordings` - List meeting recordings
- `meet_v2_get_recording` - Get recording details
- `meet_v2_list_transcripts` - List meeting transcripts
- `meet_v2_get_transcript` - Get transcript content
- `meet_v2_list_transcript_entries` - Get individual speech segments

## 💬 Example Commands

### **Create Meetings:**
```
"Create a Google Meet for the marketing team tomorrow at 10 AM"
"Schedule a client presentation for Friday 3 PM with recording enabled"
"Set up a recurring weekly standup meeting starting Monday"
```

### **Manage Existing Meetings:**
```
"Show me my meetings for this week"
"Cancel the 2 PM meeting tomorrow"
"Add John and Sarah to the client meeting on Friday"
```

### **Advanced Features:**
```
"Create a restricted Meet space with recording and transcription"
"List all recordings from last month's meetings"
"Get the transcript from yesterday's all-hands meeting"
```

## 🔒 Security & Privacy

### **Your Data:**
- ✅ Your Google credentials are encrypted and stored securely
- ✅ Only you can access your meetings and calendar
- ✅ Your API key is unique and personal to you

### **What's Shared:**
- ❌ Your credentials never leave the company infrastructure
- ❌ Other employees cannot access your data
- ❌ No meeting content is stored on company servers

### **Best Practices:**
- 🔐 Keep your API key confidential
- 🔄 Report any issues to IT immediately
- 📱 Only use on trusted devices
- 🚫 Don't share your Claude configuration with others

## 🆘 Troubleshooting

### **Common Issues:**

#### **"Unauthorized" Error:**
```
❌ Problem: API key not working
✅ Solution: Contact admin for new API key
```

#### **"Google credentials not found":**
```
❌ Problem: Credentials not properly configured
✅ Solution: Redo Step 2 (Google credentials setup)
```

#### **"Tool not found" Error:**
```
❌ Problem: Claude Desktop not restarted
✅ Solution: Restart Claude Desktop completely
```

#### **"Rate limit exceeded":**
```
❌ Problem: Too many requests
✅ Solution: Wait 5 minutes and try again
```

### **Configuration File Issues:**

#### **JSON Syntax Error:**
```bash
# Validate your JSON configuration
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
```

#### **Missing Configuration:**
```json
// Make sure your file looks exactly like this:
{
  "mcpServers": {
    "google-meet-company": {
      "command": "curl",
      "args": [
        // ... your specific args here
      ]
    }
  }
}
```

### **Still Having Issues?**
1. **Contact IT Support**: [internal-support-email]
2. **Check Company Wiki**: [internal-wiki-link]
3. **Slack Channel**: #google-meet-support

## 📊 Usage Guidelines

### **Recommended Usage:**
- ✅ Creating business meetings
- ✅ Managing your calendar
- ✅ Accessing meeting recordings
- ✅ Scheduling team events

### **Company Policies:**
- 📋 Follow standard meeting policies
- 🔒 Use appropriate access restrictions
- 📝 Maintain professional meeting names
- 🎥 Enable recording for important meetings

### **Performance Tips:**
- ⚡ Combine multiple requests when possible
- 📅 Use date ranges for event searches
- 🎯 Be specific in your requests to Claude
- 💾 Claude remembers context within conversations

## 🔄 Updates & Maintenance

### **Automatic Updates:**
- ✅ Server-side updates happen automatically
- ✅ No action required from employees
- ✅ New features appear automatically

### **Manual Updates (if needed):**
- 📧 You'll receive email notification
- 🔄 May require Claude Desktop restart
- 📋 Follow provided instructions

## 📞 Support Contacts

### **Technical Issues:**
- 🛠️ **IT Help Desk**: [support-email]
- 💬 **Slack**: #tech-support
- 📱 **Phone**: [support-phone]

### **Google Meet Questions:**
- 📚 **Google Workspace Admin**: [admin-email]
- 📖 **Documentation**: [internal-docs-link]

### **Claude Desktop Issues:**
- 🤖 **Claude Support**: https://support.anthropic.com
- 📖 **Claude Docs**: https://docs.anthropic.com

---

**Need immediate help?** Contact your IT administrator with:
- Your name and email
- Screenshot of any error messages
- Steps you tried before the issue occurred

**Happy meeting! 🎉**