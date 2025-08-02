# Google Meet MCP Server v3.0 - Ultra-fast Dockerfile for Smithery
FROM node:20-alpine

WORKDIR /app

# Copy only essential files
COPY package.json ./
COPY src/ ./src/

# Install only production dependencies, no scripts
RUN npm install --production --no-optional --ignore-scripts

# Environment for v3.0
ENV NODE_ENV=production

# Direct TypeScript execution
CMD ["npx", "tsx", "src/index.ts"]