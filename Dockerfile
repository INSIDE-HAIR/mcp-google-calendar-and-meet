# Google Meet MCP Server v3.0 - Multi-stage Production Docker
# Optimized for deployment scalability with security best practices

# ============================================================================
# Stage 1: Dependencies (Builder)
# ============================================================================
FROM node:20-alpine AS dependencies

# Install security updates and build tools
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy dependency files for caching optimization
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev for tsx/TypeScript) with npm ci for reproducible builds
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# ============================================================================
# Stage 2: Development (Optional target)
# ============================================================================
FROM dependencies AS development

# Copy source code for development
COPY src/ ./src/
COPY tsconfig.json ./
COPY *.md ./

# Development environment variables
ENV NODE_ENV=development
ENV LOG_LEVEL=debug

# Expose port for development server (if using HTTP transport)
EXPOSE 3000

# Development command with hot reload
CMD ["npx", "tsx", "--watch", "src/index.ts"]

# ============================================================================
# Stage 3: Production Build
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Copy source code, scripts, and TypeScript configuration
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY tsconfig.json ./

# Build TypeScript to JavaScript (optional, tsx can run TS directly)
RUN npm run build

# ============================================================================
# Stage 4: Production Runtime
# ============================================================================
FROM node:20-alpine AS production

# Install security updates and runtime dependencies only
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

WORKDIR /app

# Copy only production dependencies and built code
COPY --from=dependencies --chown=mcp:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=mcp:nodejs /app/package*.json ./
COPY --from=builder --chown=mcp:nodejs /app/src ./src/
COPY --from=builder --chown=mcp:nodejs /app/scripts ./scripts/
COPY --from=builder --chown=mcp:nodejs /app/dist ./dist/
COPY --chown=mcp:nodejs *.md ./

# Production environment variables for Google Meet MCP Server v3.0
# Method 1: Direct token authentication (recommended for production)
ENV CLIENT_ID=""
ENV CLIENT_SECRET=""
ENV REFRESH_TOKEN=""

# Method 2: File-based OAuth credentials (legacy support)
ENV G_OAUTH_CREDENTIALS=""
ENV GOOGLE_MEET_CREDENTIALS_PATH="/app/credentials.json"
ENV GOOGLE_MEET_TOKEN_PATH="/app/token.json"

# Production optimizations
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps --max-old-space-size=256"
ENV LOG_LEVEL=info

# Create directories for persistent data
RUN mkdir -p /app/logs /app/data && \
    chown -R mcp:nodejs /app/logs /app/data

# Security: Switch to non-root user
USER mcp

# Health check for container monitoring and load balancers
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node scripts/health-check.js || exit 1

# Expose port for HTTP transport (if configured)
EXPOSE 3000

# Define volumes for persistent data
VOLUME ["/app/logs", "/app/data"]

# Use dumb-init for proper signal handling in containers
ENTRYPOINT ["dumb-init", "--"]

# Start the MCP server using compiled JavaScript for optimal performance
CMD ["node", "dist/index.js"]

# Metadata labels for container registry
LABEL org.opencontainers.image.title="Google Meet MCP Server" \
      org.opencontainers.image.description="Production-ready multi-stage Docker container for Google Meet MCP Server with TypeScript, Zod validation, and enterprise features" \
      org.opencontainers.image.version="3.0.0" \
      org.opencontainers.image.authors="INSIDE-HAIR" \
      org.opencontainers.image.licenses="ISC" \
      org.opencontainers.image.source="https://github.com/INSIDE-HAIR/google-meet-mcp-server" \
      org.opencontainers.image.documentation="https://github.com/INSIDE-HAIR/google-meet-mcp-server/blob/main/docs/DOCKER_DEPLOYMENT.md"