/**
 * Specialized error handler for Google API errors
 * Provides Claude Desktop-friendly error messages with actionable solutions
 */

import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

interface GoogleApiError extends Error {
  response?: {
    status: number;
    statusText?: string;
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

export class GoogleApiErrorHandler {
  /**
   * Handle and transform Google API errors into user-friendly MCP errors
   * @param error - The original error from Google API
   * @param context - Additional context about what operation failed
   * @throws McpError - Structured MCP error with helpful message
   */
  static handleError(error: unknown, context = ""): never {
    const contextStr = context ? ` during ${context}` : "";

    const apiError = error as GoogleApiError;

    // Handle HTTP status code errors
    if (apiError?.response?.status) {
      const status = apiError.response.status;
      const errorData = apiError?.response?.data?.error;

      switch (status) {
        case 400:
          throw new McpError(
            ErrorCode.InvalidParams,
            `🔧 **Invalid Request**${contextStr}
            
**Problem**: The request parameters are incorrect or malformed.

**Common causes**:
• Invalid date/time format (use ISO 8601: "2024-02-01T10:00:00Z")
• Wrong resource ID format (e.g., spaces/{space_id})
• Missing required parameters

**Details**: ${errorData?.message || (error as Error).message}

**Help**: Check parameter format in CLAUDE.md or README.md`
          );

        case 401:
          throw new McpError(
            ErrorCode.InvalidRequest,
            `🔐 **Authentication Failed**${contextStr}
            
**Problem**: Your authentication token is invalid or expired.

**Solution**:
1. Run \`npm run refresh-token\` to refresh authentication
2. If that fails, run \`npm run setup\` to re-authenticate
3. Make sure you granted all requested permissions

**Note**: Tokens expire approximately every hour.

**Details**: ${errorData?.message || (error as Error).message}`
          );

        case 403:
          // Check for specific permission types
          if (
            errorData?.message?.includes("PERMISSION_DENIED") ||
            (error as Error).message?.includes("PERMISSION_DENIED")
          ) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `🏢 **Enterprise Feature Required**${contextStr}
              
**Problem**: This Google Meet feature requires Google Workspace Business Standard or higher.

**Your Options**:
• **Upgrade**: Contact your organization admin to upgrade your Google Workspace plan
• **Alternative**: Use \`calendar_v3_create_event\` with \`create_meet_conference: true\` for basic Meet links
• **Workaround**: Create meetings manually in Google Calendar and use list/get tools

**Feature Requirements**:
- Recording/Transcription: Business Standard+
- Smart Notes: Gemini Business/Enterprise license
- Advanced moderation: Business Standard+

**Details**: ${errorData?.message || (error as Error).message}`
            );
          }

          throw new McpError(
            ErrorCode.InvalidRequest,
            `🚫 **Access Denied**${contextStr}
            
**Problem**: Your Google account doesn't have the required permissions.

**Solutions**:
1. **Re-authenticate**: Run \`npm run setup\` to grant additional permissions
2. **Check scopes**: Ensure you granted Calendar and Meet API access
3. **Organization policy**: Contact your Google Workspace admin if in enterprise

**Required permissions**:
• Google Calendar API access
• Google Meet Spaces creation/management
• Conference recording access (for enterprise features)

**Details**: ${errorData?.message || (error as Error).message}`
          );

        case 404:
          throw new McpError(
            ErrorCode.InvalidRequest,
            `🔍 **Resource Not Found**${contextStr}
            
**Problem**: The requested resource (space, event, recording, etc.) doesn't exist.

**Common causes**:
• Incorrect space ID or meeting code
• Event was deleted or moved
• Conference record not yet available (processing delay)
• Using wrong calendar ID

**Tips**:
• For spaces: Use format \`spaces/{meeting-code}\` or \`spaces/{space-id}\`
• For events: Get event ID from \`calendar_v3_list_events\` first
• For conference records: Allow 1-2 hours after meeting ends

**Details**: ${errorData?.message || (error as Error).message}`
          );

        case 429:
          throw new McpError(
            ErrorCode.InvalidRequest,
            `⏱️ **Rate Limit Exceeded**${contextStr}
            
**Problem**: Too many requests sent to Google API in a short time.

**Solution**: Wait 1-2 minutes and try again.

**Prevention tips**:
• Add delays between batch operations
• Use \`max_results\` parameter to limit large queries
• Consider using \`list\` operations instead of multiple \`get\` calls

**Details**: ${errorData?.message || (error as Error).message}`
          );

        case 500:
        case 502:
        case 503:
          throw new McpError(
            ErrorCode.InternalError,
            `🛠️ **Google API Service Error**${contextStr}
            
**Problem**: Google's servers are experiencing issues.

**Solution**: Wait a few minutes and try again. This is usually temporary.

**If persists**:
• Check Google Workspace Status: https://www.google.com/appsstatus
• Try simpler operations first (e.g., list calendars)
• Contact support if critical

**Details**: ${errorData?.message || (error as Error).message}`
          );

        default:
          throw new McpError(
            ErrorCode.InternalError,
            `⚠️ **Unexpected Google API Error**${contextStr}
            
**HTTP Status**: ${status}
**Details**: ${errorData?.message || (error as Error).message}

**Try**:
1. Wait a moment and retry
2. Check your internet connection
3. Verify your Google account access

**Support**: If this persists, please report this error with the status code.`
          );
      }
    }

    // Handle specific Google API error types
    if ((error as Error).message) {
      // Meet API v2 specific errors
      if (
        (error as Error).message.includes("Space not found") ||
        (error as Error).message.includes("Invalid space name")
      ) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `🎯 **Meet Space Error**${contextStr}
          
**Problem**: Invalid or non-existent Google Meet space.

**Space name format**:
• From Meet URL: \`meet.google.com/abc-defg-hij\` → use \`spaces/abc-defg-hij\`
• From API: Use the full \`name\` field from create_space response

**Troubleshooting**:
• Check if the meeting is still active
• Verify the space wasn't deleted
• Try using \`meet_v2_list_conference_records\` to find valid spaces

**Details**: ${(error as Error).message}`
        );
      }

      if ((error as Error).message.includes("Conference record not found")) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `📊 **Conference Record Not Available**${contextStr}
          
**Problem**: Conference recording/transcript data isn't ready yet.

**Timeline**:
• Records appear 15-30 minutes after meeting ends
• Recordings may take 1-2 hours to process
• Transcripts available 2-4 hours post-meeting

**What to do**:
1. Wait longer if meeting just ended
2. Use \`meet_v2_list_conference_records\` to see available records
3. Check if recording was actually started during the meeting

**Details**: ${(error as Error).message}`
        );
      }

      // Network/connection errors
      if (
        (error as Error).message.includes("ENOTFOUND") ||
        (error as Error).message.includes("ECONNREFUSED")
      ) {
        throw new McpError(
          ErrorCode.InternalError,
          `🌐 **Network Connection Error**${contextStr}
          
**Problem**: Cannot connect to Google's servers.

**Check**:
• Internet connection is working
• No firewall blocking googleapis.com
• VPN isn't interfering with Google services

**Details**: ${(error as Error).message}`
        );
      }

      if ((error as Error).message.includes("timeout")) {
        throw new McpError(
          ErrorCode.InternalError,
          `⏱️ **Request Timeout**${contextStr}
          
**Problem**: Google API took too long to respond.

**Solutions**:
• Try again - may be temporary Google server load
• Use smaller page_size for list operations
• Check your internet connection speed

**Details**: ${(error as Error).message}`
        );
      }
    }

    // Generic fallback for unknown errors
    throw new McpError(
      ErrorCode.InternalError,
      `🚨 **Unexpected Error**${contextStr}
      
**Details**: ${(error as Error).message || "Unknown error occurred"}

**Troubleshooting**:
1. Try the operation again
2. Check if other operations work (test with \`calendar_v3_list_calendars\`)
3. Run \`npm run setup\` if authentication-related

**Support**: If this error persists, please report it with the full error message.`
    );
  }

  /**
   * Handle validation errors from Zod schemas
   * @param validationError - Zod validation error
   * @param toolName - Name of the tool being validated
   * @throws McpError - Formatted validation error
   */
  static handleValidationError(
    validationError: Error,
    toolName: string
  ): never {
    throw new McpError(
      ErrorCode.InvalidParams,
      `📝 **Parameter Validation Failed**: ${toolName}

${validationError.message}

**Next steps**:
1. Check the parameter format and types
2. Review required vs optional parameters
3. See README.md for examples of this tool

**Common fixes**:
• Use ISO date format: "2024-02-01T10:00:00Z"
• Check enum values (e.g., access_type: "TRUSTED", "OPEN", "RESTRICTED")
• Verify email addresses are valid
• Ensure required fields are provided`
    );
  }

  /**
   * Log error for debugging (when debug mode enabled)
   * @param error - Original error
   * @param context - Context information
   */
  static logError(error: unknown, context = ""): void {
    const apiError = error as GoogleApiError;

    if (process.env.DEBUG === "true") {
      console.error(
        `[DEBUG] Google API Error${context ? ` (${context})` : ""}:`,
        {
          message: apiError.message,
          status: apiError?.response?.status,
          statusText: apiError?.response?.statusText,
          data: apiError?.response?.data,
          stack: apiError.stack,
        }
      );
    }
  }
}
