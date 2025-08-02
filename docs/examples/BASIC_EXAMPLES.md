# 🎨 Basic Examples - Google Meet MCP Server

## 📋 Overview

This guide provides practical examples of using the Google Meet MCP Server tools with Claude Desktop. All examples use real-world scenarios with step-by-step instructions.

## 🚀 Getting Started Examples

### Example 1: Check Available Tools

**Ask Claude**:
```
What Google Meet tools do you have available?
```

**Expected Response**:
Claude will list all 23 available tools categorized by:
- 📅 **Calendar API v3 Tools** (8 tools): calendar_v3_list_calendars, calendar_v3_create_event, etc.
- 🎥 **Meet API v2 Tools** (15 tools): meet_v2_create_space, meet_v2_list_conference_records, etc.

---

## 📅 Calendar Management Examples

### Example 2: List Your Calendars

**Ask Claude**:
```
Show me all my Google calendars
```

**What happens**:
1. Claude calls `calendar_v3_list_calendars`
2. Returns your calendars with details like name, timezone, and access level

**Sample Response**:
```
📅 Your Google Calendars:

1. **Primary Calendar** (john.doe@company.com)
   - Timezone: America/New_York
   - Access: Owner

2. **Team Calendar** (team@company.com)  
   - Timezone: America/New_York
   - Access: Writer

3. **Company Events** (events@company.com)
   - Timezone: America/New_York
   - Access: Reader
```

---

### Example 3: View Upcoming Events

**Ask Claude**:
```
What meetings do I have this week?
```

**What happens**:
1. Claude calls `calendar_v3_list_events` with current week timeframe
2. Returns events with details including any Google Meet links

**Sample Response**:
```
📅 Your upcoming meetings this week:

**Today (Feb 5, 2024)**
• 9:00 AM - 9:30 AM: Daily Standup
  🎥 Google Meet: https://meet.google.com/abc-defg-hij

• 2:00 PM - 3:00 PM: Project Review
  📍 Conference Room A

**Tomorrow (Feb 6, 2024)**  
• 10:00 AM - 11:00 AM: Client Presentation
  🎥 Google Meet: https://meet.google.com/xyz-mnop-qrs
  👥 Attendees: alice@client.com, bob@company.com
```

---

### Example 4: Create a Simple Meeting

**Ask Claude**:
```
Create a meeting called "Team Planning" for tomorrow at 2pm for 1 hour
```

**What happens**:
1. Claude calls `calendar_v3_create_event` with:
   - Summary: "Team Planning"
   - Start time: Tomorrow at 2pm (calculated automatically)
   - Duration: 1 hour
   - Default calendar: Primary

**Sample Response**:
```
✅ Meeting created successfully!

📅 **Team Planning**
📅 Date: February 6, 2024
🕐 Time: 2:00 PM - 3:00 PM (EST)
📧 Calendar: john.doe@company.com
🆔 Event ID: abc123def456

The meeting has been added to your calendar.
```

---

### Example 5: Create Meeting with Google Meet

**Ask Claude**:
```
Schedule a "Quarterly Review" meeting for Friday at 10am with Google Meet included. Invite alice@company.com and bob@company.com
```

**What happens**:
1. Claude calls `calendar_v3_create_event` with:
   - Summary: "Quarterly Review"
   - Google Meet: enabled
   - Attendees: alice@company.com, bob@company.com
   - Time: Friday at 10am

**Sample Response**:
```
✅ Meeting with Google Meet created!

📅 **Quarterly Review**
📅 Date: February 9, 2024
🕐 Time: 10:00 AM - 11:00 AM (EST)
🎥 Google Meet: https://meet.google.com/new-meeting-xyz
👥 Attendees: alice@company.com, bob@company.com

Meeting invitations have been sent to all attendees.
```

---

### Example 6: Check Someone's Availability

**Ask Claude**:
```
Can you check if I'm free tomorrow between 1pm and 5pm?
```

**What happens**:
1. Claude calls `calendar_v3_freebusy_query` for tomorrow 1-5pm
2. Analyzes your calendar for conflicts

**Sample Response**:
```
📅 Your availability tomorrow (Feb 6) from 1:00 PM - 5:00 PM:

✅ **Available Time Slots:**
• 1:00 PM - 2:30 PM (1.5 hours)
• 4:00 PM - 5:00 PM (1 hour)

❌ **Busy Time Slots:**  
• 2:30 PM - 4:00 PM: "Client Call" meeting

🎯 **Recommendation:** You have 2.5 hours available with a 1.5-hour block in the early afternoon.
```

---

### Example 7: Natural Language Event Creation

**Ask Claude**:
```
Add "Lunch with Sarah" to my calendar for next Tuesday at 12:30pm
```

**What happens**:
1. Claude calls `calendar_v3_quick_add` with natural language
2. Google Calendar interprets and creates the event

**Sample Response**:
```
✅ Event added using quick add!

📅 **Lunch with Sarah**
📅 Date: February 13, 2024
🕐 Time: 12:30 PM - 1:30 PM (EST)

The event has been automatically added to your calendar.
```

---

## 🎥 Google Meet Space Examples

### Example 8: Create a Basic Meet Space

**Ask Claude**:
```
Create a Google Meet space for a team meeting
```

**What happens**:
1. Claude calls `meet_v2_create_space` with default settings
2. Creates a Meet space with TRUSTED access

**Sample Response**:
```
✅ Google Meet space created!

🎥 **Meet Space Details:**
• Meeting Link: https://meet.google.com/abc-defg-hij
• Meeting Code: abc-defg-hij  
• Access Type: TRUSTED (Google account required)
• Space ID: spaces/abc-defg-hij

Share the meeting link with participants to join.
```

---

### Example 9: Create Secure Meeting with Recording

**Ask Claude**:
```
Create a Google Meet space with recording enabled and restricted access for our board meeting
```

**What happens**:
1. Claude calls `meet_v2_create_space` with:
   - Access type: RESTRICTED
   - Recording: enabled
   - Enhanced security settings

**Sample Response**:
```
✅ Secure Google Meet space created!

🎥 **Board Meeting Space:**
• Meeting Link: https://meet.google.com/secure-board-xyz
• Access Type: RESTRICTED (invitation only)
• Recording: ⚠️ Enabled (must be manually started during meeting)
• Moderation: Enabled

🔒 **Security Features:**
• Only invited participants can join
• Host controls enabled
• Recording prepared (activate manually in meeting)

📋 **Next Steps:**
1. Share meeting link only with board members
2. Start recording manually when meeting begins
3. Monitor participants as they join
```

---

### Example 10: Get Meeting Space Information

**Ask Claude**:
```
Get details about the Meet space abc-defg-hij
```

**What happens**:
1. Claude calls `meet_v2_get_space` with the space name
2. Returns current configuration and status

**Sample Response**:
```
🎥 **Meet Space Information:**

📋 **Basic Details:**
• Space ID: spaces/abc-defg-hij
• Meeting Link: https://meet.google.com/abc-defg-hij
• Meeting Code: abc-defg-hij

⚙️ **Configuration:**
• Access Type: TRUSTED
• Moderation Mode: OFF
• Chat Restrictions: No restrictions
• Presentation Restrictions: No restrictions

📊 **Status:**
• Space Status: Active
• Current Conference: None active
```

---

## 📊 Meeting History Examples

### Example 11: View Recent Meeting Records

**Ask Claude**:
```
Show me the conference records from last week
```

**What happens**:
1. Claude calls `meet_v2_list_conference_records` with date filter
2. Returns completed meetings with basic information

**Sample Response**:
```
📊 **Conference Records (Last Week):**

1. **Team Standup** - Feb 1, 2024
   • Duration: 9:00 AM - 9:30 AM
   • Participants: 5 attendees
   • Recording: Available
   • Transcript: Available

2. **Client Presentation** - Feb 3, 2024  
   • Duration: 2:00 PM - 3:15 PM
   • Participants: 8 attendees
   • Recording: Not recorded
   • Transcript: Available

3. **Project Planning** - Feb 4, 2024
   • Duration: 10:00 AM - 11:30 AM
   • Participants: 6 attendees
   • Recording: Available
   • Transcript: Available
```

---

### Example 12: Get Meeting Attendees

**Ask Claude**:
```
Who attended the meeting on February 3rd at 2pm?
```

**What happens**:
1. Claude finds the conference record for that date/time
2. Calls `meet_v2_list_participants` for that meeting
3. Returns participant information

**Sample Response**:
```
👥 **Meeting Attendees - Client Presentation (Feb 3, 2:00 PM):**

**Internal Team:**
• John Doe (Host) - Joined: 2:00 PM, Left: 3:15 PM
• Alice Smith - Joined: 1:58 PM, Left: 3:15 PM  
• Bob Johnson - Joined: 2:02 PM, Left: 3:10 PM

**Client Attendees:**
• Sarah Wilson (Client) - Joined: 2:01 PM, Left: 3:15 PM
• Mike Davis (Client) - Joined: 2:00 PM, Left: 3:15 PM

📊 **Attendance Summary:**
• Total Participants: 5
• Average Join Time: 2:00 PM
• Meeting Duration: 1 hour 15 minutes
• Full Attendance: 100%
```

---

## 🔧 Practical Workflow Examples

### Example 13: Complete Meeting Setup Workflow

**Ask Claude**:
```
I need to set up a weekly team standup meeting for Mondays at 9am with Google Meet. Include the whole engineering team.
```

**What happens**:
1. Claude creates calendar event with recurrence
2. Adds Google Meet conference
3. Invites team members
4. Provides setup confirmation

**Sample Response**:
```
✅ **Weekly Team Standup Setup Complete!**

📅 **Meeting Details:**
• Title: Weekly Team Standup
• Schedule: Every Monday at 9:00 AM - 9:30 AM
• Start Date: February 12, 2024
• Google Meet: https://meet.google.com/team-standup-abc

👥 **Team Members Invited:**
• alice@company.com (Engineering Lead)
• bob@company.com (Senior Developer)  
• carol@company.com (Frontend Developer)
• dave@company.com (Backend Developer)

📋 **Next Steps:**
1. Meeting invitations sent to all team members
2. Calendar series created for every Monday
3. Same Google Meet link will be used each week
4. Team members can join directly from calendar

🎯 **Meeting Best Practices:**
• Join 2-3 minutes early to test audio/video
• Use mute when not speaking
• Keep updates brief and focused
• Use chat for links or follow-up items
```

---

### Example 14: Meeting Conflict Resolution

**Ask Claude**:
```
I need to schedule a 2-hour meeting with Alice and Bob sometime this week. Find a time that works for everyone.
```

**What happens**:
1. Claude checks your availability using `calendar_v3_freebusy_query`
2. Analyzes potential time slots
3. Suggests optimal meeting times

**Sample Response**:
```
🕐 **Meeting Availability Analysis (This Week):**

🔍 **Checking schedules for:**
• Your calendar
• Alice's availability (if accessible)
• Bob's availability (if accessible)

✅ **Recommended Time Slots (2 hours):**

**Option 1: Wednesday, Feb 7**
• 2:00 PM - 4:00 PM
• ✅ You: Available
• ✅ Alice: Available (tentative)
• ✅ Bob: Available (tentative)

**Option 2: Friday, Feb 9**  
• 10:00 AM - 12:00 PM
• ✅ You: Available
• ✅ Alice: Available (tentative)
• ✅ Bob: Available (tentative)

**Option 3: Thursday, Feb 8**
• 1:00 PM - 3:00 PM  
• ✅ You: Available
• ❓ Alice: Cannot verify availability
• ❓ Bob: Cannot verify availability

🎯 **Recommendation:** Wednesday 2-4 PM looks best. Would you like me to create the meeting and send invitations?
```

---

### Example 15: Post-Meeting Analysis

**Ask Claude**:
```
Can you give me a summary of our team meetings from last month, including attendance and any recordings?
```

**What happens**:
1. Claude calls `meet_v2_list_conference_records` for last month
2. Gets participant data for each meeting
3. Checks for recordings and transcripts
4. Compiles comprehensive summary

**Sample Response**:
```
📊 **Team Meeting Summary - January 2024**

📈 **Overall Statistics:**
• Total Meetings: 12
• Average Duration: 45 minutes
• Total Meeting Time: 9 hours
• Average Attendance: 87%

📅 **Meeting Breakdown:**

**Weekly Standups (4 meetings):**
• Attendance Rate: 95%
• Average Duration: 25 minutes
• Recordings: 4/4 available
• Transcripts: 4/4 available

**Sprint Planning (2 meetings):**  
• Attendance Rate: 100%
• Average Duration: 90 minutes
• Recordings: 2/2 available
• Transcripts: 2/2 available

**Team Retrospectives (2 meetings):**
• Attendance Rate: 78%
• Average Duration: 60 minutes  
• Recordings: 1/2 available
• Transcripts: 2/2 available

**Ad-hoc Meetings (4 meetings):**
• Attendance Rate: 65%
• Average Duration: 30 minutes
• Recordings: 2/4 available
• Transcripts: 3/4 available

🎯 **Key Insights:**
• Best attendance: Sprint Planning (100%)
• Improvement needed: Ad-hoc meeting attendance
• Recording compliance: 75% (9/12 meetings)
• All meetings have transcripts available

📋 **Recommendations:**
1. Improve ad-hoc meeting scheduling
2. Remind team about recording best practices
3. Consider shorter retrospective format
```

---

## 🚨 Error Handling Examples

### Example 16: Authentication Issue

**Ask Claude**:
```
List my calendars
```

**If authentication fails**:
```
❌ **Authentication Error**

I'm having trouble accessing your Google account. Here's how to fix it:

🔧 **Troubleshooting Steps:**
1. **Check MCP Server Status:**
   - Ensure the Google Meet MCP server is running
   - Restart Claude Desktop if needed

2. **Re-authenticate:**
   - Run the OAuth setup process again
   - Go to the project directory and run: `npm run setup`

3. **Verify Credentials:**
   - Check that your credentials.json file exists
   - Ensure file permissions are correct (600)

4. **Check Google Cloud Console:**
   - Verify Calendar API and Meet API are enabled
   - Check OAuth consent screen is properly configured

Would you like me to guide you through any of these steps?
```

---

### Example 17: Permission Issue

**Ask Claude**:
```
Create a meeting space with recording enabled
```

**If workspace license is insufficient**:
```
⚠️ **Feature Limitation**

Recording features require Google Workspace Business Standard or higher.

🏢 **Your Current Situation:**
• Account Type: Google Workspace Basic (or Personal Gmail)
• Recording: Not available
• Transcription: Not available

✅ **Available Alternatives:**
1. **Create basic meeting space** (no recording)
2. **Use calendar events with Meet links** 
3. **Upgrade Google Workspace** for full features

🎯 **Recommendation:**
I can create a regular Meet space for you now, and you can manually record using other tools if needed.

Would you like me to:
- Create a basic Meet space?
- Create a calendar event with Meet link instead?
- Show upgrade options for Google Workspace?
```

---

## 💡 Pro Tips & Best Practices

### Time Zone Handling
```
# Always specify timezone for clarity
"Create a meeting tomorrow at 2pm Eastern Time"

# Better than:
"Create a meeting tomorrow at 2pm"
```

### Meeting Security
```
# For sensitive meetings:
"Create a restricted access Meet space with moderation enabled"

# For team meetings:
"Create a trusted Meet space for our team standup"
```

### Batch Operations
```
# Efficient scheduling:
"Check my availability this week and create three 1-hour blocks for project work"

# Better than multiple individual requests
```

### Meeting Follow-up
```
# After meetings:
"Show me the transcript from yesterday's client meeting and summarize the key decisions"
```

---

**🎯 These examples cover the most common use cases for the Google Meet MCP Server. Start with basic calendar operations, then gradually explore advanced Meet features as you become comfortable with the tools.**