# 🤖 Using with Claude - Google Meet MCP Guide

## 📋 Overview

This guide shows you exactly how to interact with Claude to manage your Google Calendar and Google Meet. You'll learn the natural language patterns that work best and see real examples of conversations.

## 🎯 How It Works

### **Natural Conversation**
Instead of clicking through calendar interfaces, you simply tell Claude what you want in natural language. Claude understands context and can handle complex requests intelligently.

### **AI-Powered Understanding**
Claude can:
- **Interpret ambiguous requests** ("next Tuesday" vs "Tuesday the 15th")
- **Fill in missing details** (default to 1 hour if duration not specified)
- **Suggest improvements** (better meeting times, conflict resolution)
- **Learn from context** (remember your preferences and patterns)

## 🗣️ Basic Conversation Patterns

### **Viewing Your Schedule**

```
You: "What's on my calendar today?"

Claude: 📅 Your schedule for today (February 12, 2024):

9:00 AM - 9:30 AM: Daily Standup
🎥 Google Meet: https://meet.google.com/abc-defg-hij

2:00 PM - 3:00 PM: Client Review Meeting
📍 Conference Room A
👥 Attendees: alice@client.com, bob@company.com

4:30 PM - 5:00 PM: One-on-one with Manager
🎥 Google Meet: https://meet.google.com/xyz-mnop-qrs

You have 3 meetings today with 2.5 hours of total meeting time.
```

### **Creating Simple Events**

```
You: "Schedule a team planning meeting for tomorrow at 2pm"

Claude: ✅ Meeting created successfully!

📅 **Team Planning Meeting**
📅 Date: February 13, 2024
🕐 Time: 2:00 PM - 3:00 PM (EST)
📧 Calendar: john.doe@company.com
🆔 Event ID: evt_abc123

The meeting has been added to your calendar. Would you like me to:
- Add specific attendees?
- Include a Google Meet link?
- Set up a recurring schedule?
```

### **Adding Google Meet**

```
You: "Add Google Meet to that planning meeting"

Claude: ✅ Google Meet added to Team Planning Meeting!

🎥 **Meeting Link**: https://meet.google.com/team-plan-xyz
📋 **Meeting Code**: team-plan-xyz
🔒 **Access**: TRUSTED (Google account required)

The meeting invitation will be updated automatically. Attendees will receive the new invitation with the Meet link.
```

## 🎯 Advanced Conversation Examples

### **Smart Scheduling with Multiple People**

```
You: "I need to schedule a 2-hour project review with Alice, Bob, and Carol sometime this week. Find a time that works for everyone."

Claude: 🔍 **Checking availability for 4 participants...**

Found optimal time slots for your 2-hour project review:

**Option 1: Wednesday, Feb 14 - 10:00 AM to 12:00 PM** ⭐ **RECOMMENDED**
• ✅ You: Available
• ✅ Alice: Available  
• ✅ Bob: Available
• ✅ Carol: Available
• 🎯 Best option - everyone free, morning focus time

**Option 2: Friday, Feb 16 - 1:00 PM to 3:00 PM**
• ✅ You: Available
• ✅ Alice: Available
• ✅ Bob: Available  
• ⚠️ Carol: Has conflict 2:30-3:00 PM

Would you like me to:
1. Create the meeting for Wednesday 10 AM (recommended)
2. Check additional time slots
3. Create for Friday with Carol joining late?
```

```
You: "Go with Wednesday at 10am"

Claude: ✅ **Project Review Meeting Created!**

📅 **Project Review - Team Alpha**
📅 Wednesday, February 14, 2024
🕐 10:00 AM - 12:00 PM (EST)
🎥 Google Meet: https://meet.google.com/project-review-abc
👥 Attendees: alice@company.com, bob@company.com, carol@company.com

**Meeting Features:**
• Recording enabled (2-hour session)
• Agenda template added
• Calendar holds sent to all participants

All attendees have been invited and will receive the meeting details.
```

### **Managing Recurring Meetings**

```
You: "Set up weekly team standups every Monday at 9am for the next 3 months"

Claude: ✅ **Weekly Team Standup Series Created!**

📅 **Weekly Team Standup**
📅 **Schedule**: Every Monday at 9:00 AM - 9:30 AM
📅 **Duration**: February 19 - May 13, 2024 (13 meetings)
🎥 **Consistent Meet Link**: https://meet.google.com/weekly-standup-team
👥 **Team Members**: [Auto-detected from your team]

**Standup Features:**
• Same Google Meet link for all sessions
• 30-minute duration (efficient standups)
• Recurring calendar series created
• Optional: Can enable recording for specific sessions

The series has been created and all team members have been invited to the recurring meeting.
```

### **Meeting Conflict Resolution**

```
You: "I have a conflict - there's a client call at 2pm but I just got invited to an urgent executive meeting at the same time. Help me resolve this."

Claude: ⚠️ **Scheduling Conflict Detected & Resolution Options**

**Conflict Analysis:**
• **Client Call**: "Q1 Budget Review" (2:00-3:00 PM)
  - High priority (revenue discussion)
  - 3 external stakeholders
  - Moderate rescheduling impact

• **Executive Meeting**: "Strategic Planning" (2:00-3:30 PM)
  - Critical priority (urgent strategic decision)  
  - C-suite attendance
  - High rescheduling difficulty

**🎯 Recommended Resolution: Prioritize Executive Meeting**

**Alternative Times for Client Call:**
1. **Tuesday 10:00 AM** ⭐ **BEST** - All attendees confirmed free
2. **Wednesday 2:00 PM** - Same time slot, 1 day later
3. **Thursday 9:00 AM** - Earlier but guaranteed availability

**Next Steps:**
1. Accept the executive meeting (mark as high priority)
2. Send professional rescheduling request to client
3. Propose Tuesday 10 AM as preferred alternative

Would you like me to:
- Send the rescheduling email to the client?
- Update your calendar with the executive meeting?
- Create the rescheduled client meeting?
```

## 💡 Conversation Tips & Best Practices

### **Be Conversational and Natural**

✅ **Good Examples:**
```
"Schedule lunch with Sarah next Tuesday at 12:30"
"Can you find a time when the whole marketing team is free for 2 hours?"
"Move my 3pm meeting to 4pm"
"What meetings do I have this week with external people?"
```

❌ **Avoid Being Too Formal:**
```
"Execute calendar_v3_create_event with summary='Meeting' and start_time='2024-02-13T14:00:00Z'"
"List all events between timestamps X and Y"
```

### **Provide Context and Preferences**

✅ **Include Helpful Details:**
```
"Schedule a client demo for next week, preferably Tuesday or Wednesday afternoon"
"Create a team meeting with Google Meet - make sure to include the whole engineering team"
"Find a 90-minute block for sprint planning when everyone is free"
```

### **Ask Follow-up Questions**

```
You: "Create a client meeting for Friday"

Claude: I'd be happy to create a client meeting for Friday! To set this up properly, could you tell me:

1. What time works best for you?
2. How long should the meeting be?
3. Which client/attendees should I invite?
4. Should I include Google Meet?
5. Any specific agenda or preparation needed?

This helps me create the most useful meeting for your needs.
```

### **Use Claude's Suggestions**

```
You: "I need to schedule weekly one-on-ones with my team"

Claude: Great idea! I can help set up weekly one-on-ones. Here are some questions to optimize the schedule:

**Timing Recommendations:**
• **Best Practice**: 30-45 minutes per person
• **Optimal Times**: Tuesday-Thursday, avoiding Monday/Friday
• **Spacing**: Leave 15-minute buffers between meetings

**For Your Team of 6 People:**
• **Option 1**: Tuesday & Wednesday afternoons (3 each day)
• **Option 2**: One day per week (Thursday) with back-to-back slots
• **Option 3**: Spread across Tuesday/Wednesday/Thursday

**Google Meet Recommendations:**
• Create individual recurring Meet links for each person
• Ensures privacy and consistency

Which approach sounds best for your management style and team preferences?
```

## 🔍 Understanding Claude's Responses

### **Status Indicators**
- ✅ **Success**: Action completed successfully
- ⚠️ **Warning**: Action completed but with notes
- ❌ **Error**: Action failed, with explanation
- 🔍 **Processing**: Claude is working on complex request
- 💡 **Suggestion**: Claude has recommendations

### **Information Structure**
Claude organizes responses with:
- **Clear headings** for different sections
- **Icons and emojis** for visual scanning
- **Structured data** (times, attendees, links)
- **Next steps** and follow-up options

### **Interaction Patterns**
Claude will:
- **Ask clarifying questions** when details are missing
- **Offer multiple options** for complex decisions
- **Explain limitations** and suggest alternatives
- **Provide context** for why certain approaches are recommended

## 🚨 Common Interaction Scenarios

### **When Claude Needs More Information**

```
You: "Schedule a meeting"

Claude: I'd be happy to help schedule a meeting! To create the perfect meeting for you, I'll need a few details:

**Essential Information:**
• **When**: What day and time work for you?
• **Duration**: How long should the meeting be?
• **Topic**: What's the meeting about? (helps with naming and setup)

**Optional But Helpful:**
• **Attendees**: Who should be invited?
• **Meeting Type**: Internal team, client call, presentation, etc.?
• **Special Requirements**: Recording, specific security, etc.?

For example, you could say: "Schedule a team planning meeting for Tuesday at 2pm with the engineering team"

What would you like to schedule?
```

### **When Claude Suggests Alternatives**

```
You: "Create a meeting for Saturday at 10pm"

Claude: I can create a meeting for Saturday at 10 PM, but I wanted to check a few things first:

⚠️ **Timing Considerations:**
• Saturday 10 PM is outside typical business hours
• This might affect attendee availability
• Time zone considerations for any remote participants

**Alternative Suggestions:**
• **Monday 10 AM** - Start of week, high availability
• **Friday 2 PM** - End of week wrap-up time
• **Saturday 10 AM** - Weekend but more reasonable hour

**Questions:**
• Is this for a specific time zone?
• Are there international participants to consider?
• Is this a special circumstance requiring weekend/evening timing?

Should I proceed with Saturday 10 PM, or would you like to consider an alternative time?
```

### **When Claude Provides Learning Opportunities**

```
You: "Why can't I record this meeting?"

Claude: Great question! Let me explain the recording requirements and help you set this up properly.

**Recording Requirements:**
📋 **Google Workspace License**: Recording requires Business Standard or higher
🎥 **Manual Activation**: API prepares recording - you must start it manually during the meeting
🔐 **Permissions**: Host must have recording rights in Google Workspace settings

**Your Current Situation:**
• ✅ Meeting created with recording capability enabled
• ⚠️ **Action Required**: You'll need to manually click "Record" when the meeting starts
• 💡 **Tip**: Recording button appears in the Meet interface once the meeting begins

**For Future Reference:**
• MCP prepares meetings for recording
• Actual recording must be activated by the host during the meeting
• Recordings are saved to Google Drive automatically
• Participants are notified when recording starts

Would you like me to:
1. Show you where to find the recording button in Google Meet?
2. Set up recording-ready meetings by default for certain meeting types?
3. Help you check your Google Workspace recording permissions?
```

---

**🎯 The key to success with Claude is natural conversation. Don't overthink it - just tell Claude what you want to accomplish with your calendar and meetings, and let the AI help you find the best approach!**