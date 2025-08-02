# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run start` - Start development server with hot reload (tsx src/index.ts)
- `npm run start:compiled` - Run compiled JavaScript version (node dist/index.js)
- `npm run start:smithery` - Start Smithery-compatible server (tsx src/smithery.ts)
- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm run type-check` - Run TypeScript type checking without compilation

### Testing
- `npm test` - Run all tests using Vitest
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests
- `npm run test:validation` - Run validation schema tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- Test files are located in `test/` directory with .test.ts extension

### Authentication Setup
- `npm run setup` - Interactive OAuth setup for Google APIs
- `npm run auth` - Alias for setup command
- `npm run oauth-helper` - Opens browser OAuth helper page
- `npm run refresh-token` - Generate new refresh token using script
- `npm run generate-refresh-token` - Alternative refresh token generation

### Docker Development
- `npm run docker:local` - Start local development containers
- `npm run docker:local:logs` - View container logs
- `npm run docker:local:down` - Stop local containers
- `npm run docker:advanced` - Start production containers with monitoring
- `npm run docker:health` - Check container health
- `npm run docker:clean` - Clean Docker system and volumes

## Project Architecture

### Core Structure
This is a Model Context Protocol (MCP) server that provides Google Meet and Calendar integration through 23+ validated tools. The project supports multiple deployment methods: direct Node.js execution, Smithery platform deployment, and Docker containerization.

### Entry Points
- **Main MCP Server**: `src/index.ts` - Standard MCP server using stdio transport
- **Smithery Entry**: `src/smithery.ts` - Smithery-compatible server with stateless configuration
- **API Wrapper**: `src/GoogleMeetAPI.ts` - Core Google APIs integration layer

### Authentication Methods
The server supports three authentication patterns:
1. **Direct Token Auth** (production): CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN environment variables
2. **File-based Auth**: G_OAUTH_CREDENTIALS environment variable pointing to JSON file
3. **Legacy Development**: GOOGLE_MEET_CREDENTIALS_PATH and GOOGLE_MEET_TOKEN_PATH

### Core Components

#### API Integration (`src/GoogleMeetAPI.ts`)
- Wraps Google Calendar API v3 and Google Meet API v2
- Handles OAuth2 authentication and token management
- Provides 23+ tool methods with full TypeScript typing
- Supports both file-based and direct token authentication

#### Validation System (`src/validation/meetSchemas.ts`)
- Comprehensive Zod schemas for all 23 tools
- Business logic validation (e.g., recording restrictions for OPEN meetings)
- Clear error messages with troubleshooting hints
- Input sanitization and format validation

#### Tool Categories
- **Calendar API v3 (8 tools)**: Calendar management, event CRUD, free/busy queries
- **Meet API v2 (15 tools)**: Space management, conference records, recordings, transcripts, participants
- All tools support pagination, filtering, and proper error handling

#### Monitoring System (`src/monitoring/`)
- Health checks for Google API connectivity
- Metrics collection for tool usage and performance
- API monitoring with error tracking
- Optional monitoring endpoints on port 3001

#### Error Handling (`src/errors/GoogleApiErrorHandler.ts`)
- Context-aware error messages optimized for AI assistance
- Specific handling for Google API quota limits and permission issues
- Troubleshooting guidance for common authentication problems

### Development Patterns

#### TypeScript Configuration
- ES2022 target with ESNext modules
- Strict mode disabled for rapid development
- Output to `build/` directory
- Includes Vitest globals for testing

#### Testing Strategy
- Unit tests for individual API methods
- Integration tests for complete workflows
- Validation tests for all Zod schemas
- 70% coverage thresholds enforced
- Test setup in `test/setup.ts`

#### Build System
- Custom build script at `scripts/build.js`
- TypeScript compilation with declaration files
- esbuild for optimized production builds
- Docker multi-stage builds for container deployment

### Key Implementation Details

#### Tool Registration
Tools are registered in both entry points with identical schemas. Each tool has:
- Input validation using Zod schemas
- Comprehensive parameter documentation
- Error handling with actionable messages
- Support for optional parameters with sensible defaults

#### Environment Configuration
The server automatically detects authentication method based on available environment variables:
- Direct tokens take precedence over file-based auth
- Fallback to local development configuration
- Graceful degradation with clear error messages

#### Docker Support
- Multi-stage builds for development and production
- Health checks and monitoring integration
- Volume mounting for credential files
- Production optimizations with non-root user

### Common Development Tasks

#### Adding New Tools
1. Add tool definition to both `src/index.ts` and `src/smithery.ts`
2. Create Zod validation schema in `src/validation/meetSchemas.ts`
3. Implement method in `src/GoogleMeetAPI.ts`
4. Add unit tests in `test/` directory
5. Update tool count in documentation

#### Authentication Debugging
- Check `npm run setup` for interactive OAuth flow
- Verify credentials file permissions (should be 600)
- Use `npm run docker:health` to test container connectivity
- Monitor logs for specific Google API error codes

#### Testing New Features
- Use `npm run test:watch` during development
- Run `npm run test:validation` for schema changes
- Check `npm run test:coverage` to maintain thresholds
- Use `test/simple.test.ts` for basic functionality verification

### Smithery Deployment Specifics
- Configuration schema defined in `src/smithery.ts` with Zod validation
- Supports both direct token and file-based authentication
- Dynamic API initialization to handle Smithery's stateless nature
- Comprehensive error handling for deployment scenarios