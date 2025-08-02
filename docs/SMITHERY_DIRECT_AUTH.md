# Smithery Direct Token Authentication Guide

## Overview

This guide explains how to obtain and use direct tokens (`CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`) for Google Meet MCP Server authentication, similar to how the successful Smithery calendar server works.

## Why Direct Token Authentication?

✅ **More reliable**: No file path dependencies  
✅ **Easier deployment**: Works seamlessly with Smithery  
✅ **Better security**: Tokens are managed as environment variables  
✅ **Simpler setup**: Just 3 variables instead of file management  

## Step 1: Get Your OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable these APIs:
   - Google Calendar API
   - Google Meet API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Choose **Desktop Application**
6. Download the JSON file

From the downloaded JSON, extract:
```json
{
  "installed": {
    "client_id": "123456789-abcdefg.apps.googleusercontent.com",
    "client_secret": "GOCSPX-abcdefghijklmnopqrstuvwxyz",
    ...
  }
}
```

## Step 2: Generate a Refresh Token

Run this one-time setup to get your `REFRESH_TOKEN`:

```bash
# Clone and setup
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server
cd google-meet-mcp-server

# Install dependencies
npm install

# Set your credentials from step 1
export CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
export CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"

# Run the token generator
npm run generate-refresh-token
```

The script will:
1. Open your browser for Google OAuth
2. Ask you to authorize the app
3. Return a `REFRESH_TOKEN` that looks like: `1//0ABCD-EFGHIJKLMNOPQRSTUVWXYZabcdefg...`

## Step 3: Configure Smithery

In your Smithery configuration, use:

```yaml
CLIENT_ID: "123456789-abcdefg.apps.googleusercontent.com"
CLIENT_SECRET: "GOCSPX-abcdefghijklmnopqrstuvwxyz"  
REFRESH_TOKEN: "1//0ABCD-EFGHIJKLMNOPQRSTUVWXYZabcdefg..."
```

## Step 4: Test Your Setup

```bash
# Test locally first
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
export REFRESH_TOKEN="your-refresh-token"

npm run start
```

## Security Best Practices

🔒 **Keep tokens secure**: Never commit them to git  
🔒 **Use environment variables**: Store in Smithery config only  
🔒 **Rotate periodically**: Refresh tokens can expire (usually 6 months)  
🔒 **Limit scopes**: Only grant necessary permissions  

## Troubleshooting

### Invalid Client Error
- Check `CLIENT_ID` and `CLIENT_SECRET` match your Google Cloud project
- Ensure APIs are enabled in Google Cloud Console

### Invalid Grant Error  
- Your `REFRESH_TOKEN` may have expired
- Re-run the token generation process

### Scope Errors
- Ensure your OAuth app has the required scopes:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/meetings.space.created`
  - `https://www.googleapis.com/auth/meetings.space.readonly`
  - `https://www.googleapis.com/auth/meetings.space.settings`

## Legacy Support

The server still supports file-based authentication for backward compatibility:

```yaml
# Method 2: File-based (legacy)
googleOAuthCredentials: "/path/to/credentials.json"
```

But we recommend the direct token method for production deployments.

## Token Refresh

The server automatically refreshes access tokens using your refresh token. No manual intervention needed once properly configured.