# Google Meet MCP Server v3.0 - Simplified Dockerfile for Smithery
# Single-stage build optimized for faster deployment

FROM node:20-alpine

# Install basic requirements
RUN apk add --no-cache dumb-init

# Create app directory and non-root user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S mcp -u 1001

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy application source
COPY --chown=mcp:nodejs src/ ./src/
COPY --chown=mcp:nodejs scripts/ ./scripts/
COPY --chown=mcp:nodejs tsconfig.json ./
COPY --chown=mcp:nodejs *.md ./

# Environment variables for v3.0 authentication
ENV CLIENT_ID=""
ENV CLIENT_SECRET=""
ENV REFRESH_TOKEN=""
ENV G_OAUTH_CREDENTIALS=""
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Security: Switch to non-root user
USER mcp

# Use tsx to run TypeScript directly (no build step needed)
CMD ["npx", "tsx", "src/index.ts"]