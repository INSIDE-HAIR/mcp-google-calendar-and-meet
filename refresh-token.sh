#!/bin/bash

# Google Meet MCP Server - Token Refresh Script
# This script automates the token renewal process

echo "🔄 Google Meet MCP Server - Token Refresh"
echo "=========================================="

# Check if credentials file exists
if [ ! -f "credentials.json" ]; then
    echo "❌ Error: credentials.json not found in current directory"
    echo "💡 Make sure you're running this script from the project root directory"
    exit 1
fi

# Set credentials path
CREDENTIALS_PATH="$(pwd)/credentials.json"
echo "📁 Using credentials: $CREDENTIALS_PATH"

# Run setup (now automatically removes old tokens)
echo ""
echo "🔐 Starting OAuth authentication..."
echo "📝 Setup will automatically remove expired tokens and create a new one"
echo "📝 Follow the instructions to complete authentication in your browser"
echo ""

G_OAUTH_CREDENTIALS="$CREDENTIALS_PATH" npm run setup

# Check if token was created successfully
if [ -f "credentials.token.json" ]; then
    echo ""
    echo "✅ Token refresh completed successfully!"
    echo "🔄 Please restart Claude Desktop (Cmd+Q and reopen) to use the new token"
    echo ""
    echo "📊 Next steps:"
    echo "   1. Close Claude Desktop completely (Cmd+Q)"
    echo "   2. Open Claude Desktop again"
    echo "   3. Test Google Meet MCP Server functionality"
else
    echo ""
    echo "❌ Token refresh failed!"
    echo "💡 Please check the authentication process and try again"
    exit 1
fi