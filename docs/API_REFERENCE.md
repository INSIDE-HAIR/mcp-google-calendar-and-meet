# 📚 API Reference Guide

Complete reference for all Google Meet MCP Server tools, parameters, and responses.

## 🎯 Overview

The Google Meet MCP Server provides 21 fully validated tools across two main APIs:
- **6 Calendar API v3 tools** - Full calendar event management
- **15 Meet API v2 tools** - Advanced meeting space management and analytics

All tools include comprehensive Zod validation, TypeScript type safety, and enterprise-grade error handling.

---

## 📅 Google Calendar API v3 Tools

### 1. `calendar_v3_list_calendars`

List all calendars available to the authenticated user.

**Parameters:** None

**Response:**
```json
[
  {
    "id": "primary",
    "summary": "Primary Calendar",
    "primary": true,
    "accessRole": "owner",
    "colorId": "1",
    "backgroundColor": "#7986CB",
    "foregroundColor": "#FFFFFF"
  }
]
```

**Example Usage:**
```json
{
  "name": "calendar_v3_list_calendars",
  "arguments": {}
}
```

### 2. `calendar_v3_list_events`

List upcoming calendar events with optional filtering.

**Parameters:**
- `max_results` (optional): Number of events to return (1-2500, default: 10)
- `time_min` (optional): Start time filter in ISO format (default: now)
- `time_max` (optional): End time filter in ISO format
- `calendar_id` (optional): Specific calendar ID (default: "primary")

**Validation:**
- `max_results`: Must be between 1 and 2500
- Date formats: Must be valid ISO 8601 strings
- `calendar_id`: Must be valid calendar identifier

**Response:**
```json
[
  {
    "id": "event123",
    "summary": "Team Meeting",
    "start": {
      "dateTime": "2025-08-01T10:00:00Z",
      "timeZone": "UTC"
    },
    "end": {
      "dateTime": "2025-08-01T11:00:00Z",
      "timeZone": "UTC"
    },
    "hangoutLink": "https://meet.google.com/abc-defg-hij",
    "attendees": [
      {
        "email": "attendee@example.com",
        "responseStatus": "accepted"
      }
    ]
  }
]
```

**Example Usage:**
```json
{
  "name": "calendar_v3_list_events",
  "arguments": {
    "max_results": 5,
    "time_min": "2025-08-01T00:00:00Z",
    "time_max": "2025-08-02T00:00:00Z"
  }
}
```

### 3. `calendar_v3_get_event`

Get detailed information about a specific calendar event.

**Parameters:**
- `event_id` (required): Calendar event ID

**Validation:**
- `event_id`: Must be non-empty string

**Response:**
```json
{
  "id": "event123",
  "summary": "Team Meeting",
  "description": "Weekly team sync meeting",
  "start": {
    "dateTime": "2025-08-01T10:00:00Z",
    "timeZone": "UTC"
  },
  "end": {
    "dateTime": "2025-08-01T11:00:00Z", 
    "timeZone": "UTC"
  },
  "attendees": [
    {
      "email": "attendee@example.com",
      "responseStatus": "accepted",
      "displayName": "John Doe"
    }
  ],
  "conferenceData": {
    "entryPoints": [
      {
        "entryPointType": "video",
        "uri": "https://meet.google.com/abc-defg-hij"
      }
    ]
  },
  "guestsCanInviteOthers": true,
  "guestsCanModify": false,
  "guestsCanSeeOtherGuests": true
}
```

**Example Usage:**
```json
{
  "name": "calendar_v3_get_event",
  "arguments": {
    "event_id": "event123"
  }
}
```

### 4. `calendar_v3_create_event`

Create a new calendar event with optional Google Meet conference.

**Parameters:**
- `summary` (required): Event title
- `start_time` (required): Start time in ISO format
- `end_time` (required): End time in ISO format
- `description` (optional): Event description
- `location` (optional): Event location
- `time_zone` (optional): Time zone (default: "UTC")
- `attendees` (optional): Array of email addresses
- `create_meet_conference` (optional): Add Google Meet link (default: false)
- `guest_can_invite_others` (optional): Guest invitation permissions (default: true)
- `guest_can_modify` (optional): Guest modification permissions (default: false)
- `guest_can_see_other_guests` (optional): Guest visibility permissions (default: true)
- `calendar_id` (optional): Target calendar (default: "primary")

**Validation:**
- `summary`: Must be non-empty string
- `start_time`, `end_time`: Must be valid ISO 8601 format
- `end_time`: Must be after `start_time`
- `attendees`: Must be array of valid email addresses
- Boolean parameters: Must be true/false
- `time_zone`: Must be valid IANA timezone identifier

**Response:**
```json
{
  "id": "new_event_123",
  "summary": "New Team Meeting",
  "start": {
    "dateTime": "2025-08-01T10:00:00Z",
    "timeZone": "UTC"
  },
  "end": {
    "dateTime": "2025-08-01T11:00:00Z",
    "timeZone": "UTC"
  },
  "hangoutLink": "https://meet.google.com/new-meeting-link",
  "attendees": [
    {
      "email": "attendee@example.com"
    }
  ],
  "guestsCanInviteOthers": false,
  "guestsCanModify": false,
  "guestsCanSeeOtherGuests": true
}
```

**Example Usage:**
```json
{
  "name": "calendar_v3_create_event",
  "arguments": {
    "summary": "Project Kickoff Meeting",
    "description": "Initial project planning session",
    "start_time": "2025-08-01T14:00:00Z",
    "end_time": "2025-08-01T15:30:00Z",
    "attendees": ["team@company.com", "pm@company.com"],
    "create_meet_conference": true,
    "guest_can_invite_others": false,
    "guest_can_modify": false,
    "guest_can_see_other_guests": true
  }
}
```

### 5. `calendar_v3_update_event`

Update an existing calendar event.

**Parameters:**
- `event_id` (required): Event ID to update
- `summary` (optional): Updated event title
- `description` (optional): Updated description
- `location` (optional): Updated location
- `start_time` (optional): Updated start time in ISO format
- `end_time` (optional): Updated end time in ISO format
- `time_zone` (optional): Updated time zone
- `attendees` (optional): Updated attendee list
- `guest_can_invite_others` (optional): Updated guest permissions
- `guest_can_modify` (optional): Updated guest permissions
- `guest_can_see_other_guests` (optional): Updated guest permissions

**Validation:**
- `event_id`: Must be non-empty string
- At least one optional field must be provided
- Same validation rules as create_event for provided fields

**Response:** Same structure as `calendar_v3_get_event`

**Example Usage:**
```json
{
  "name": "calendar_v3_update_event",
  "arguments": {
    "event_id": "event123",
    "summary": "Updated Meeting Title",
    "start_time": "2025-08-01T15:00:00Z",
    "end_time": "2025-08-01T16:00:00Z"
  }
}
```

### 6. `calendar_v3_delete_event`

Delete a calendar event.

**Parameters:**
- `event_id` (required): Event ID to delete

**Validation:**
- `event_id`: Must be non-empty string

**Response:**
```json
"Calendar event successfully deleted"
```

**Example Usage:**
```json
{
  "name": "calendar_v3_delete_event",
  "arguments": {
    "event_id": "event123"
  }
}
```

---

## 🎥 Google Meet API v2 Tools

### 7. `meet_v2_create_space`

Create a Google Meet space with advanced configuration.

**Parameters:**
- `access_type` (optional): "OPEN" | "TRUSTED" | "RESTRICTED" (default: "TRUSTED")
- `enable_recording` (optional): Enable recording preparation (default: false)
- `enable_transcription` (optional): Enable transcription (default: false)
- `enable_smart_notes` (optional): Enable AI notes with Gemini (default: false)
- `attendance_report` (optional): Enable attendance tracking (default: false)
- `moderation_mode` (optional): "ON" | "OFF" (default: "OFF")
- `chat_restriction` (optional): "HOSTS_ONLY" | "NO_RESTRICTION" (default: "NO_RESTRICTION")
- `present_restriction` (optional): "HOSTS_ONLY" | "NO_RESTRICTION" (default: "NO_RESTRICTION")
- `default_join_as_viewer` (optional): Join as viewer by default (default: false)

**Validation:**
- Enum values: Must match exactly (case-sensitive)
- Boolean values: Must be true/false
- Business logic: Recording cannot be enabled for OPEN access meetings

**Response:**
```json
{
  "name": "spaces/abc-defg-hij-klm",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "meetingCode": "abc-defg-hij",
  "config": {
    "accessType": "TRUSTED",
    "entryPointAccess": "ALL",
    "moderationMode": "OFF"
  },
  "activeConference": null
}
```

**Example Usage:**
```json
{
  "name": "meet_v2_create_space",
  "arguments": {
    "access_type": "RESTRICTED",
    "enable_recording": true,
    "enable_transcription": true,
    "moderation_mode": "ON",
    "chat_restriction": "HOSTS_ONLY"
  }
}
```

### 8. `meet_v2_get_space`

Get details of a Google Meet space.

**Parameters:**
- `space_name` (required): Space name in format "spaces/{space_id}"

**Validation:**
- `space_name`: Must match regex `/^spaces\/[a-zA-Z0-9_-]{1,128}$/`

**Response:** Same structure as `meet_v2_create_space`

**Example Usage:**
```json
{
  "name": "meet_v2_get_space",
  "arguments": {
    "space_name": "spaces/abc-defg-hij-klm"
  }
}
```

### 9. `meet_v2_update_space`

Update configuration of a Google Meet space.

**Parameters:**
- `space_name` (required): Space name in format "spaces/{space_id}"
- `access_type` (optional): Updated access type
- `moderation_mode` (optional): Updated moderation mode
- `chat_restriction` (optional): Updated chat restrictions
- `present_restriction` (optional): Updated presentation restrictions

**Validation:**
- `space_name`: Must match space name format
- Optional parameters: Same validation as create_space

**Response:** Updated space configuration

**Example Usage:**
```json
{
  "name": "meet_v2_update_space",
  "arguments": {
    "space_name": "spaces/abc-defg-hij-klm",
    "access_type": "RESTRICTED",
    "moderation_mode": "ON"
  }
}
```

### 10. `meet_v2_end_active_conference`

End the active conference in a Google Meet space.

**Parameters:**
- `space_name` (required): Space name in format "spaces/{space_id}"

**Validation:**
- `space_name`: Must match space name format

**Response:**
```json
"Active conference ended successfully"
```

**Example Usage:**
```json
{
  "name": "meet_v2_end_active_conference",
  "arguments": {
    "space_name": "spaces/abc-defg-hij-klm"
  }
}
```

### 11. `meet_v2_list_conference_records`

List conference records for historical meetings.

**Parameters:**
- `filter` (optional): Filter expression (e.g., 'space.name="spaces/{space_id}"')
- `page_size` (optional): Number of records to return (1-50, default: 10)

**Validation:**
- `page_size`: Must be between 1 and 50
- `filter`: Must be valid filter expression format

**Response:**
```json
{
  "conferenceRecords": [
    {
      "name": "conferenceRecords/record123",
      "startTime": "2025-08-01T10:00:00Z",
      "endTime": "2025-08-01T11:00:00Z",
      "space": "spaces/abc-defg-hij-klm"
    }
  ],
  "nextPageToken": "token123"
}
```

**Example Usage:**
```json
{
  "name": "meet_v2_list_conference_records",
  "arguments": {
    "filter": "space.name=\"spaces/abc-defg-hij-klm\"",
    "page_size": 20
  }
}
```

### 12. `meet_v2_get_conference_record`

Get details of a specific conference record.

**Parameters:**
- `conference_record_name` (required): Conference record name "conferenceRecords/{record_id}"

**Validation:**
- `conference_record_name`: Must match regex `/^conferenceRecords\/[a-zA-Z0-9_-]+$/`

**Response:**
```json
{
  "name": "conferenceRecords/record123",
  "startTime": "2025-08-01T10:00:00Z",
  "endTime": "2025-08-01T11:00:00Z",
  "space": "spaces/abc-defg-hij-klm",
  "expireTime": "2025-08-31T10:00:00Z"
}
```

### 13-21. Additional Meet API Tools

The following tools follow similar patterns with specific validation for resource names:

#### Recording Management
- **`meet_v2_list_recordings`**: List recordings for a conference
- **`meet_v2_get_recording`**: Get specific recording details

#### Transcript Management  
- **`meet_v2_list_transcripts`**: List transcripts for a conference
- **`meet_v2_get_transcript`**: Get specific transcript details
- **`meet_v2_list_transcript_entries`**: List individual speech segments

#### Participant Management
- **`meet_v2_get_participant`**: Get participant details
- **`meet_v2_list_participants`**: List conference participants
- **`meet_v2_get_participant_session`**: Get session details
- **`meet_v2_list_participant_sessions`**: List participant sessions

**Common Validation Patterns:**
- Resource names: Regex validation for Google API format
- Page sizes: Appropriate limits per endpoint (1-1000)
- Required parameters: Non-empty string validation

---

## 🔧 Common Parameters & Validation

### Date/Time Format
All date/time parameters use ISO 8601 format:
```
2025-08-01T10:00:00Z          # UTC
2025-08-01T10:00:00-05:00     # With timezone offset
```

### Email Validation
Email addresses are validated with:
```regex
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

### Resource Name Patterns
```regex
# Space names
/^spaces\/[a-zA-Z0-9_-]{1,128}$/

# Conference records
/^conferenceRecords\/[a-zA-Z0-9_-]+$/

# Recordings
/^conferenceRecords\/[^/]+\/recordings\/[^/]+$/

# Transcripts
/^conferenceRecords\/[^/]+\/transcripts\/[^/]+$/
```

### Page Size Limits
- Conference records: 1-50
- Recordings: 1-100
- Transcripts: 1-100
- Transcript entries: 1-1000
- Participants: 1-100
- Participant sessions: 1-100

---

## 🚨 Error Responses

### Validation Errors
```json
{
  "error": "Validation failed",
  "details": {
    "field": "start_time",
    "message": "Start time must be a valid ISO 8601 date string",
    "received": "invalid-date"
  }
}
```

### Google API Errors
```json
{
  "error": "Google API Error",
  "code": 403,
  "message": "Insufficient permissions for this operation",
  "suggestion": "Run `npm run setup` to re-authenticate with required permissions"
}
```

### Enterprise Feature Errors
```json
{
  "error": "Enterprise Feature Required",
  "message": "Recording requires Google Workspace Business Standard or higher",
  "alternatives": [
    "Use basic calendar events with Meet links",
    "Upgrade your Google Workspace plan"
  ]
}
```

---

## 📊 Response Format Standards

### Success Responses
All successful responses return either:
1. **Data object/array**: The requested data
2. **Confirmation string**: Success message for operations

### Error Responses
All errors include:
- `error`: Error type/category
- `message`: Human-readable description
- `details`: Additional context (when available)
- `suggestion`: Recommended action (when available)

### Pagination
Paginated responses include:
- `items`: Array of results
- `nextPageToken`: Token for next page (when available)
- `totalItems`: Total count (when available)

---

## 🎯 Usage Best Practices

### 1. Parameter Validation
Always validate parameters locally before sending:
```typescript
// Good: Validate dates
const startTime = new Date(params.start_time);
if (isNaN(startTime.getTime())) {
  throw new Error("Invalid start time format");
}

// Good: Check required parameters
if (!params.event_id?.trim()) {
  throw new Error("Event ID is required");
}
```

### 2. Error Handling
Handle specific error types:
```typescript
try {
  const result = await mcpClient.call("calendar_v3_create_event", params);
} catch (error) {
  if (error.code === 403) {
    // Handle permissions error
  } else if (error.type === "validation") {
    // Handle validation error
  }
}
```

### 3. Resource Management
Use proper resource name formats:
```typescript
// Correct format
const spaceName = "spaces/abc-defg-hij-klm";
const conferenceRecord = "conferenceRecords/record123";

// Incorrect format
const spaceName = "abc-defg-hij-klm"; // Missing "spaces/" prefix
```

### 4. Pagination
Handle paginated results properly:
```typescript
let allRecords = [];
let pageToken = null;

do {
  const response = await mcpClient.call("meet_v2_list_conference_records", {
    page_size: 50,
    page_token: pageToken
  });
  
  allRecords.push(...response.conferenceRecords);
  pageToken = response.nextPageToken;
} while (pageToken);
```

---

This API reference provides complete documentation for all 21 tools with validation rules, examples, and best practices for integration with the Google Meet MCP Server.