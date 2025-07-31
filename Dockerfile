# Google Meet MCP Server v2.0 Dockerfile
# Optimized for production deployment with security best practices
FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

WORKDIR /app

# Copy dependency files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies with security optimizations
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY --chown=mcp:nodejs src/ ./src/
COPY --chown=mcp:nodejs types.d.ts ./

# Set environment variables for Google Meet MCP Server v2.0
# Primary configuration (recommended)
ENV G_OAUTH_CREDENTIALS=""
# Alternative configuration
ENV GOOGLE_MEET_CREDENTIALS_PATH="credentials.json"
ENV GOOGLE_MEET_TOKEN_PATH="token.json"

# Node.js optimizations
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps --max-old-space-size=512"

# Security: Switch to non-root user
USER mcp

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Google Meet MCP Server v2.0 - Health OK')" || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the MCP server
CMD ["node", "src/index.js"]

# Metadata labels
LABEL org.opencontainers.image.title="Google Meet MCP Server" \
      org.opencontainers.image.description="Advanced MCP server for Google Meet and Calendar API v3/v2 with 17 production-ready tools" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.authors="INSIDE-HAIR" \
      org.opencontainers.image.licenses="ISC" \
      org.opencontainers.image.documentation="https://github.com/INSIDE-HAIR/google-meet-mcp-server"
