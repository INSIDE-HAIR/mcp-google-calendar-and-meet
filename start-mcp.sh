#!/bin/bash
# Wrapper script for Google Meet MCP Server to handle paths with spaces

export G_OAUTH_CREDENTIALS="/Users/luiseurdanetamartucci/Library/Application Support/Claude/client_secret_714590299658-vsd850n04068bqttqbqp8h7gqq4bq3eh.apps.googleusercontent.com.json"
exec node "/Users/luiseurdanetamartucci/Desktop/INSIDE/google-meet-mcp-server/build/src/index.js"