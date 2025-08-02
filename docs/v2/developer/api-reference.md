# 🔧 API Reference - Google Meet MCP Server v3.0

## 📋 Overview

The Google Meet MCP Server provides **23 validated tools** that integrate Google Calendar API v3 and Google Meet API v2 with Claude AI through the Model Context Protocol.

## 🎯 Tool Categories

### 📅 Google Calendar API v3 Tools (8 tools)
- **Core Operations**: List, create, update, delete calendar events
- **Advanced Features**: Free/busy queries, natural language event creation
- **Google Meet Integration**: Automatic Meet conference creation

### 🎥 Google Meet API v2 Tools (15 tools)  
- **Space Management**: Create, configure, and manage Meet spaces
- **Conference Records**: Access historical meeting data
- **Recordings & Transcripts**: Retrieve meeting recordings and transcriptions
- **Participant Tracking**: Monitor meeting attendance and participation

---

## 📅 Google Calendar API v3 Tools

### 1. `calendar_v3_list_calendars`

**Description**: List all calendars available to the authenticated user.

**Parameters**: None required

**Example Usage**:
```json
{
  "name": "calendar_v3_list_calendars",
  "arguments": {}
}
```

**Response**:
```json
{
  "calendars": [
    {
      "id": "primary",
      "summary": "john.doe@company.com",
      "description": "Primary calendar",
      "timeZone": "America/New_York",
      "accessRole": "owner"
    },
    {
      "id": "calendar-id-2",
      "summary": "Team Calendar",
      "description": "Shared team events",
      "timeZone": "America/New_York",
      "accessRole": "reader"
    }
  ]
}
```

---

### 2. `calendar_v3_list_events`

**Description**: List upcoming calendar events with Google Meet conferences.

**Parameters**:
- `max_results` (number, optional): Maximum number of results (default: 10, max: 2500)
- `time_min` (string, optional): Start time in ISO format (default: now)
- `time_max` (string, optional): End time in ISO format
- `calendar_id` (string, optional): Calendar ID (default: 'primary')

**Example Usage**:
```json
{
  "name": "calendar_v3_list_events",
  "arguments": {
    "max_results": 5,
    "time_min": "2024-02-01T00:00:00Z",
    "time_max": "2024-02-07T23:59:59Z"
  }
}
```

**Response**:
```json
{
  "events": [
    {
      "id": "event123",
      "summary": "Team Standup",
      "description": "Daily team sync",
      "startTime": "2024-02-01T09:00:00Z",
      "endTime": "2024-02-01T09:30:00Z",
      "attendees": ["alice@company.com", "bob@company.com"],
      "conferenceData": {
        "meetingUrl": "https://meet.google.com/abc-defg-hij",
        "conferenceId": "abc-defg-hij"
      }
    }
  ]
}
```

---

### 3. `calendar_v3_get_event`

**Description**: Get detailed information about a specific calendar event.

**Parameters**:
- `event_id` (string, required): ID of the calendar event to retrieve

**Example Usage**:
```json
{
  "name": "calendar_v3_get_event",
  "arguments": {
    "event_id": "event123abc"
  }
}
```

---

### 4. `calendar_v3_create_event`

**Description**: Create a new calendar event with optional Google Meet conference and guest permissions.

**Parameters**:
- `summary` (string, required): Title of the event
- `start_time` (string, required): Start time in ISO format
- `end_time` (string, required): End time in ISO format
- `description` (string, optional): Event description
- `location` (string, optional): Event location
- `time_zone` (string, optional): Time zone (default: UTC)
- `attendees` (array, optional): List of email addresses
- `create_meet_conference` (boolean, optional): Add Google Meet (default: false)
- `guest_can_invite_others` (boolean, optional): Guest invite permissions (default: true)
- `guest_can_modify` (boolean, optional): Guest modify permissions (default: false)
- `guest_can_see_other_guests` (boolean, optional): Guest visibility (default: true)
- `calendar_id` (string, optional): Target calendar (default: 'primary')

**Example Usage**:
```json
{
  "name": "calendar_v3_create_event",
  "arguments": {
    "summary": "Project Planning Meeting",
    "description": "Quarterly project planning and review",
    "start_time": "2024-02-05T14:00:00-05:00",
    "end_time": "2024-02-05T15:30:00-05:00",
    "attendees": ["alice@company.com", "bob@company.com"],
    "create_meet_conference": true,
    "guest_can_invite_others": false,
    "guest_can_modify": false
  }
}
```

**Response**:
```json
{
  "event": {
    "id": "newEvent123",
    "summary": "Project Planning Meeting",
    "startTime": "2024-02-05T19:00:00Z",
    "endTime": "2024-02-05T20:30:00Z",
    "conferenceData": {
      "meetingUrl": "https://meet.google.com/new-meeting-code",
      "conferenceId": "new-meeting-code"
    },
    "attendees": [
      {"email": "alice@company.com", "responseStatus": "needsAction"},
      {"email": "bob@company.com", "responseStatus": "needsAction"}
    ]
  }
}
```

---

### 5. `calendar_v3_update_event`

**Description**: Update an existing calendar event.

**Parameters**:
- `event_id` (string, required): ID of the event to update
- All other parameters from `create_event` are optional for updates

**Example Usage**:
```json
{
  "name": "calendar_v3_update_event",
  "arguments": {
    "event_id": "event123abc",
    "summary": "Updated Meeting Title",
    "end_time": "2024-02-05T16:00:00-05:00"
  }
}
```

---

### 6. `calendar_v3_delete_event`

**Description**: Delete a calendar event.

**Parameters**:
- `event_id` (string, required): ID of the event to delete

**Example Usage**:
```json
{
  "name": "calendar_v3_delete_event",
  "arguments": {
    "event_id": "event123abc"
  }
}
```

---

### 7. `calendar_v3_freebusy_query`

**Description**: Query free/busy information for calendars to find available time slots.

**Parameters**:
- `calendar_ids` (array, required): Array of calendar IDs to query
- `time_min` (string, required): Start time in ISO format
- `time_max` (string, required): End time in ISO format

**Example Usage**:
```json
{
  "name": "calendar_v3_freebusy_query",
  "arguments": {
    "calendar_ids": ["primary", "team-calendar@company.com"],
    "time_min": "2024-02-05T09:00:00Z",
    "time_max": "2024-02-05T17:00:00Z"
  }
}
```

**Response**:
```json
{
  "timeMin": "2024-02-05T09:00:00Z",
  "timeMax": "2024-02-05T17:00:00Z",
  "calendars": {
    "primary": {
      "busy": [
        {
          "start": "2024-02-05T10:00:00Z",
          "end": "2024-02-05T11:00:00Z"
        }
      ]
    }
  }
}
```

---

### 8. `calendar_v3_quick_add`

**Description**: Create calendar event using natural language description.

**Parameters**:
- `text` (string, required): Natural language description
- `calendar_id` (string, optional): Target calendar (default: 'primary')

**Example Usage**:
```json
{
  "name": "calendar_v3_quick_add",
  "arguments": {
    "text": "Lunch with John tomorrow at 12:30pm"
  }
}
```

---

## 🎥 Google Meet API v2 Tools

### 9. `meet_v2_create_space`

**Description**: Create a Google Meet space with advanced configuration options.

**Parameters**:
- `access_type` (string, optional): Access control - "OPEN", "TRUSTED", "RESTRICTED" (default: "TRUSTED")
- `enable_recording` (boolean, optional): Enable recording preparation (default: false)
- `enable_transcription` (boolean, optional): Enable transcription (default: false)
- `enable_smart_notes` (boolean, optional): Enable AI summaries (default: false)
- `attendance_report` (boolean, optional): Generate attendance reports (default: false)
- `moderation_mode` (string, optional): Host moderation - "ON", "OFF" (default: "OFF")
- `chat_restriction` (string, optional): Chat permissions - "HOSTS_ONLY", "NO_RESTRICTION"
- `present_restriction` (string, optional): Presentation permissions - "HOSTS_ONLY", "NO_RESTRICTION"
- `default_join_as_viewer` (boolean, optional): Join as viewer by default (default: false)

**Example Usage**:
```json
{
  "name": "meet_v2_create_space",
  "arguments": {
    "access_type": "TRUSTED",
    "enable_recording": true,
    "enable_transcription": true,
    "moderation_mode": "ON",
    "chat_restriction": "HOSTS_ONLY"
  }
}
```

**Response**:
```json
{
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "config": {
      "accessType": "TRUSTED",
      "entryPointAccess": {
        "accessCode": "abc-defg-hij"
      }
    }
  }
}
```

---

### 10. `meet_v2_get_space`

**Description**: Get details of a Google Meet space.

**Parameters**:
- `space_name` (string, required): Name of the space (spaces/{space_id})

**Example Usage**:
```json
{
  "name": "meet_v2_get_space",
  "arguments": {
    "space_name": "spaces/abc-defg-hij"
  }
}
```

---

### 11. `meet_v2_update_space`

**Description**: Update configuration of a Google Meet space.

**Parameters**:
- `space_name` (string, required): Name of the space
- `access_type` (string, optional): Updated access type
- `moderation_mode` (string, optional): Updated moderation mode
- `chat_restriction` (string, optional): Updated chat restrictions
- `present_restriction` (string, optional): Updated presentation restrictions

**Example Usage**:
```json
{
  "name": "meet_v2_update_space",
  "arguments": {
    "space_name": "spaces/abc-defg-hij",
    "moderation_mode": "OFF",
    "chat_restriction": "NO_RESTRICTION"
  }
}
```

---

### 12. `meet_v2_end_active_conference`

**Description**: End the active conference in a Google Meet space.

**Parameters**:
- `space_name` (string, required): Name of the space

**Example Usage**:
```json
{
  "name": "meet_v2_end_active_conference",
  "arguments": {
    "space_name": "spaces/abc-defg-hij"
  }
}
```

---

### 13. `meet_v2_list_conference_records`

**Description**: List conference records for historical meetings.

**Parameters**:
- `filter` (string, optional): Filter expression (e.g., space.name="spaces/{space_id}")
- `page_size` (number, optional): Max results (default: 10, max: 50)

**Example Usage**:
```json
{
  "name": "meet_v2_list_conference_records",
  "arguments": {
    "filter": "space.name=\"spaces/abc-defg-hij\"",
    "page_size": 20
  }
}
```

**Response**:
```json
{
  "conferenceRecords": [
    {
      "name": "conferenceRecords/record123",
      "startTime": "2024-01-15T10:00:00Z",
      "endTime": "2024-01-15T11:00:00Z",
      "space": {
        "name": "spaces/abc-defg-hij",
        "meetingCode": "abc-defg-hij"
      }
    }
  ]
}
```

---

### 14. `meet_v2_get_conference_record`

**Description**: Get details of a specific conference record.

**Parameters**:
- `conference_record_name` (string, required): Name of the conference record

**Example Usage**:
```json
{
  "name": "meet_v2_get_conference_record",
  "arguments": {
    "conference_record_name": "conferenceRecords/record123"
  }
}
```

---

### 15-17. Recording Tools

#### `meet_v2_list_recordings`
List all recordings for a conference record.

#### `meet_v2_get_recording`
Get details of a specific recording file.

**Note**: Recording must be manually activated during the meeting. The API only prepares recording capability.

---

### 18-20. Transcript Tools

#### `meet_v2_list_transcripts`
List transcripts for a conference record.

#### `meet_v2_get_transcript`
Get details of a specific transcript.

#### `meet_v2_list_transcript_entries`
Get individual speech segments from a transcript.

**Example Transcript Entry**:
```json
{
  "entries": [
    {
      "participant": "conferenceRecords/abc/participants/participant1",
      "text": "Good morning everyone, let's start the meeting",
      "startTime": "2024-01-15T10:01:30Z",
      "endTime": "2024-01-15T10:01:35Z"
    }
  ]
}
```

---

### 21-23. Participant Tools

#### `meet_v2_get_participant`
Get details of a specific participant.

#### `meet_v2_list_participants`
List all participants for a conference record.

#### `meet_v2_get_participant_session`
Get details of a participant's session.

#### `meet_v2_list_participant_sessions`
List all sessions for a participant.

**Example Participant Data**:
```json
{
  "participant": {
    "name": "conferenceRecords/abc/participants/participant1",
    "signedinUser": {
      "user": "users/user123",
      "displayName": "John Doe"
    },
    "earliestStartTime": "2024-01-15T10:00:00Z",
    "latestEndTime": "2024-01-15T11:00:00Z"
  }
}
```

---

## 🛡️ Authentication & Authorization

### Required OAuth Scopes
```yaml
Required Scopes:
  - https://www.googleapis.com/auth/calendar
  - https://www.googleapis.com/auth/meetings.space.created
  - https://www.googleapis.com/auth/meetings.space.readonly
  - https://www.googleapis.com/auth/meetings.space.settings
```

### Google Workspace Requirements
- **Basic Features**: Any Google account
- **Advanced Meet Features**: Google Workspace Business Standard+
- **Recording**: Requires manual activation during meeting
- **Smart Notes**: Requires Gemini Business/Enterprise license

---

## ⚠️ Rate Limits & Quotas

### Google Calendar API v3
- **Queries per day**: 1,000,000 (default)
- **Queries per 100 seconds per user**: 1,000
- **Queries per 100 seconds**: 1,000,000

### Google Meet API v2  
- **Read requests per day**: 10,000 (default)
- **Write requests per day**: 1,000 (default)
- **Requests per minute per user**: 100

---

## 🔍 Error Handling

### Common Error Patterns

#### Authentication Errors
```json
{
  "error": {
    "code": 401,
    "message": "Request had invalid authentication credentials",
    "status": "UNAUTHENTICATED"
  }
}
```

#### Permission Errors
```json
{
  "error": {
    "code": 403,
    "message": "The caller does not have permission",
    "status": "PERMISSION_DENIED"
  }
}
```

#### Validation Errors
```json
{
  "error": {
    "message": "❌ Validation failed for calendar_v3_create_event:\n• start_time: Start time must be in ISO 8601 format\n• summary: Meeting title is required\n\n💡 Tip: Check parameter format and required fields"
  }
}
```

### Error Recovery
- **Automatic retry** for transient errors
- **Token refresh** for expired credentials  
- **Detailed error messages** with troubleshooting guidance
- **Graceful degradation** when possible

---

## 🎯 Best Practices

### Calendar Events
- Always specify timezone when creating events
- Use ISO 8601 format for all timestamps
- Set appropriate guest permissions for security
- Include meaningful descriptions for better organization

### Meet Spaces
- Choose appropriate access type for your security requirements
- Enable transcription for better meeting records
- Use moderation for large or public meetings
- Test recording activation workflow before important meetings

### Performance
- Use appropriate page sizes for list operations
- Cache calendar lists when possible
- Batch operations when dealing with multiple events
- Monitor quota usage to avoid rate limiting

---

**🎯 This API reference provides comprehensive coverage of all 23 tools available in the Google Meet MCP Server. Each tool is fully validated and includes contextual error handling for optimal AI assistance.**