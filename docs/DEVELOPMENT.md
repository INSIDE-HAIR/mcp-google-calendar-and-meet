# 🛠️ Development Guide

Complete guide for developing, testing, and contributing to the Google Meet MCP Server.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18+ (for TypeScript support)
- **npm**: 8+ (included with Node.js)
- **Git**: For version control
- **VS Code**: Recommended IDE with TypeScript support

### Environment Setup

```bash
# Clone the repository
git clone https://github.com/INSIDE-HAIR/mcp-google-meet.git
cd mcp-google-meet

# Install dependencies
npm install

# Set up environment variables
export G_OAUTH_CREDENTIALS="/path/to/your/credentials.json"

# Run initial authentication
npm run setup

# Start development server
npm run start
```

## 📁 Project Structure

```
google-meet-mcp-server/
├── src/                        # TypeScript source code
│   ├── index.ts                   # Main MCP server entry point
│   ├── GoogleMeetAPI.ts           # Google APIs wrapper class
│   ├── setup.ts                   # OAuth authentication setup
│   │
│   ├── types/                     # TypeScript type definitions (921+ lines)
│   │   ├── google-apis.d.ts          # Google Calendar & Meet API types
│   │   ├── mcp-server.d.ts           # MCP protocol types
│   │   ├── utilities.d.ts            # Branded types & utility types
│   │   └── index.ts                  # Centralized type exports
│   │
│   ├── validation/                # Zod validation schemas
│   │   └── meetSchemas.ts            # Tool parameter validation
│   │
│   ├── errors/                    # Error handling system
│   │   └── GoogleApiErrorHandler.ts # Google API error processor
│   │
│   └── monitoring/                # Monitoring & health checks (Phase 4)
│       ├── healthCheck.ts            # System health monitoring
│       ├── metrics.ts                # Performance metrics collection
│       ├── apiMonitor.ts             # Google API monitoring
│       └── endpoints/
│           └── monitoring.ts         # HTTP monitoring endpoints
│
├── test/                       # Test suite (101 tests)
│   ├── setup.ts                   # Test configuration & utilities
│   ├── GoogleMeetAPI.test.ts      # API wrapper unit tests
│   ├── integration.test.ts        # End-to-end workflow tests
│   ├── validation.test.ts         # Zod schema validation tests
│   ├── index.test.ts             # MCP server integration tests
│   └── monitoring.test.ts        # Monitoring system tests
│
├── build/                      # Compiled JavaScript output
├── docs/                       # Documentation
│   ├── API_REFERENCE.md          # Complete API documentation
│   ├── MONITORING.md             # Monitoring system guide
│   ├── DEVELOPMENT.md            # This file
│   └── DOCKER_DEPLOYMENT.md      # Container deployment guide
│
├── package.json                # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── vitest.config.ts           # Test configuration
└── CLAUDE.md                  # Project overview & instructions
```

## 🎯 Development Workflow

### TypeScript Development

The project uses TypeScript with strict typing and ES modules:

```bash
# Development mode (hot reload)
npm run start              # tsx src/index.ts with watch mode
npm run setup              # tsx src/setup.ts for OAuth setup

# Type checking only
npm run type-check         # tsc --noEmit (no output, just validation)

# Production build
npm run build             # Compile TypeScript to build/ directory
npm run clean             # Clean build directory

# Run compiled JavaScript
npm run start:js          # node build/index.js
npm run setup:js          # node build/setup.js
```

### Testing

Comprehensive testing with Vitest framework:

```bash
# Run all tests
npm test                  # vitest run (101 tests)

# Development testing
npm run test:watch        # vitest watch mode for development
npm run test:ui           # vitest UI for interactive testing

# Coverage analysis
npm run test:coverage     # Generate coverage report
```

### Code Quality

```bash
# Type checking
npm run type-check        # TypeScript compilation check

# Linting (if configured)
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues

# Format code (if configured)
npm run format           # Prettier formatting
```

## 🧪 Testing Strategy

### Test Categories

1. **Unit Tests** (`GoogleMeetAPI.test.ts`)
   - Individual method testing
   - Mock Google API responses
   - Error handling validation
   - 28 focused unit tests

2. **Integration Tests** (`integration.test.ts`)
   - End-to-end workflow testing
   - Full authentication flow
   - Error recovery scenarios
   - 12 comprehensive integration tests

3. **Validation Tests** (`validation.test.ts`)
   - Zod schema validation
   - Parameter validation rules
   - Business logic validation
   - 35 validation-specific tests

4. **Server Tests** (`index.test.ts`)
   - MCP protocol compliance
   - Tool registration and handling
   - Environment configuration
   - 16 server integration tests

5. **Monitoring Tests** (`monitoring.test.ts`)
   - Health check system
   - Metrics collection
   - API monitoring functionality
   - 10 monitoring system tests

### Writing Tests

#### Unit Test Example
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import GoogleMeetAPI from "../src/GoogleMeetAPI.js";

describe("GoogleMeetAPI", () => {
  let api: GoogleMeetAPI;
  
  beforeEach(() => {
    api = new GoogleMeetAPI("test-credentials.json", "test-token.json");
  });

  it("should create calendar event with validation", async () => {
    // Mock the Google Calendar API response
    const mockResponse = { id: "event123", summary: "Test Event" };
    vi.spyOn(api, 'createCalendarEvent').mockResolvedValue(mockResponse);

    const result = await api.createCalendarEvent({
      summary: "Test Event",
      startTime: "2025-08-01T10:00:00Z",
      endTime: "2025-08-01T11:00:00Z"
    });

    expect(result.id).toBe("event123");
    expect(result.summary).toBe("Test Event");
  });
});
```

#### Integration Test Example
```typescript
describe("Full Workflow", () => {
  it("should complete calendar event lifecycle", async () => {
    await api.initialize();
    
    // Create event
    const event = await api.createCalendarEvent(testEventData);
    expect(event.id).toBeDefined();
    
    // Update event
    const updated = await api.updateCalendarEvent(event.id, {
      summary: "Updated Title"
    });
    expect(updated.summary).toBe("Updated Title");
    
    // Delete event
    await api.deleteCalendarEvent(event.id);
  });
});
```

### Testing Best Practices

1. **Mock External Dependencies**
```typescript
// Mock Google APIs
vi.mock("googleapis");
vi.mock("fs/promises");

// Mock environment variables
process.env.G_OAUTH_CREDENTIALS = "/test/credentials.json";
```

2. **Use Type-Safe Mocks**
```typescript
import type { MockReadFile } from "../src/types/index.js";

(fs.readFile as MockReadFile).mockResolvedValue("mock data");
```

3. **Test Error Scenarios**
```typescript
it("should handle API errors gracefully", async () => {
  mockCalendar.events.get.mockRejectedValue(new Error("Not found"));
  
  await expect(api.getCalendarEvent("invalid-id"))
    .rejects.toThrow("Error getting meeting: Not found");
});
```

4. **Validate Business Logic**
```typescript
it("should reject invalid date ranges", () => {
  const schema = CreateEventSchema;
  
  expect(() => schema.parse({
    summary: "Test",
    start_time: "2025-08-01T11:00:00Z",
    end_time: "2025-08-01T10:00:00Z" // End before start
  })).toThrow("End time must be after start time");
});
```

## 🏗️ Architecture & Design Patterns

### Type System Architecture

The project uses a comprehensive type system with branded types:

```typescript
// Branded types for type safety
export type EventId = Brand<string, 'EventId'>;
export type SpaceName = Brand<string, 'SpaceName'>;
export type ConferenceRecordName = Brand<string, 'ConferenceRecordName'>;

// Utility type for branding
export type Brand<T, B> = T & { __brand: B };

// Usage in API methods
interface GoogleMeetAPI {
  getCalendarEvent(eventId: EventId): Promise<ProcessedEvent>;
  getMeetSpace(spaceName: SpaceName): Promise<MeetSpace>;
}
```

### Validation Architecture

Zod schemas with business logic validation:

```typescript
// Schema with business rules
export const CreateEventSchema = z.object({
  summary: z.string().min(1, "Event title is required"),
  start_time: z.string().datetime("Invalid start time format"),
  end_time: z.string().datetime("Invalid end time format"),
  create_meet_conference: z.boolean().default(false)
}).refine((data) => {
  const start = new Date(data.start_time);
  const end = new Date(data.end_time);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["end_time"]
});

// Integration with validation function
export function validateToolArgs(toolName: string, args: any) {
  const schema = ValidationSchemas[toolName];
  if (!schema) {
    throw new Error(`No validation schema found for tool: ${toolName}`);
  }
  return schema.parse(args);
}
```

### Error Handling Architecture

Centralized error handling with context-aware messages:

```typescript
export class GoogleApiErrorHandler {
  static handleError(error: any, context: string): never {
    if (error.status === 403) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `🔐 Access Denied\n` +
        `Problem: Insufficient permissions for ${context}.\n` +
        `Solution: Run \`npm run setup\` to re-authenticate`
      );
    }
    
    if (error.status === 404) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `❌ Resource Not Found\n` +
        `Problem: The requested resource doesn't exist.\n` +
        `Check: Verify the ID/name is correct`
      );
    }
    
    // Handle other error types...
  }
}
```

### Monitoring Architecture (Phase 4)

Comprehensive monitoring system:

```typescript
// Health checking
export class HealthChecker {
  async getHealthStatus(): Promise<HealthStatus> {
    return {
      status: this.calculateOverallStatus(),
      auth: await this.checkAuthHealth(),
      apis: await this.checkApiHealth(),
      dependencies: await this.checkDependencies()
    };
  }
}

// Metrics collection
export class MetricsCollector {
  recordToolCall(toolName: string, duration: number, success: boolean): void {
    // Update tool metrics, error rates, performance data
  }
  
  getPrometheusMetrics(): string {
    // Export metrics in Prometheus format
  }
}
```

## 🔧 Configuration & Environment

### TypeScript Configuration

`tsconfig.json` optimized for MCP development:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./build",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "test"]
}
```

### Vitest Configuration

`vitest.config.ts` for testing:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/types/**']
    }
  }
});
```

### Environment Variables

Development environment setup:

```bash
# Required
export G_OAUTH_CREDENTIALS="/absolute/path/to/credentials.json"

# Optional (legacy)
export GOOGLE_MEET_CREDENTIALS_PATH="/path/to/credentials.json"
export GOOGLE_MEET_TOKEN_PATH="/path/to/token.json"

# Monitoring (Phase 4)
export ENABLE_MONITORING=true
export MONITORING_PORT=3001
export MONITORING_USERNAME="admin"
export MONITORING_PASSWORD="secure-password"

# Development
export NODE_ENV=development
export DEBUG=*
```

## 🔄 Development Lifecycle

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-tool

# Install dependencies
npm install

# Start development server
npm run start

# Run tests in watch mode
npm run test:watch
```

### 2. Code Implementation

1. **Add Type Definitions** (`src/types/`)
```typescript
// Add new interfaces to appropriate type files
export interface NewToolInput {
  parameter1: string;
  parameter2?: number;
}
```

2. **Create Validation Schema** (`src/validation/meetSchemas.ts`)
```typescript
export const NewToolSchema = z.object({
  parameter1: z.string().min(1, "Parameter 1 is required"),
  parameter2: z.number().positive().optional()
});
```

3. **Implement API Method** (`src/GoogleMeetAPI.ts`)
```typescript
async newTool(input: NewToolInput): Promise<NewToolResult> {
  try {
    // Implementation logic
    return result;
  } catch (error) {
    GoogleApiErrorHandler.handleError(error, "new tool operation");
  }
}
```

4. **Add Tool Handler** (`src/index.ts`)
```typescript
else if (toolName === "new_tool") {
  const validatedArgs = validateToolArgs(toolName, args);
  const result = await this.googleMeet.newTool(validatedArgs);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
  };
}
```

### 3. Testing

```bash
# Write unit tests
# test/GoogleMeetAPI.test.ts

# Write validation tests  
# test/validation.test.ts

# Run tests
npm test

# Check coverage
npm run test:coverage
```

### 4. Documentation

Update documentation:
- Add tool to `docs/API_REFERENCE.md`
- Update `README.md` if needed
- Add examples and usage patterns

### 5. Quality Assurance

```bash
# Type checking
npm run type-check

# Full test suite
npm test

# Build verification
npm run build
npm run start:js
```

## 🏢 Enterprise Development

### Type Safety Guidelines

1. **No 'any' Types**
```typescript
// ❌ Avoid
function processData(data: any): any {
  return data;
}

// ✅ Prefer
function processData<T extends ProcessableData>(data: T): ProcessedResult<T> {
  return processResult(data);
}
```

2. **Use Branded Types**
```typescript
// ❌ Generic strings
function getEvent(eventId: string): Promise<Event> {}

// ✅ Branded types
function getEvent(eventId: EventId): Promise<Event> {}
```

3. **Comprehensive Interfaces**
```typescript
// ✅ Complete interface definitions
export interface ProcessedEvent {
  id: EventId;
  summary: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: ProcessedAttendee[];
  conferenceData?: ConferenceData;
  guestsCanInviteOthers: boolean;
  guestsCanModify: boolean;
  guestsCanSeeOtherGuests: boolean;
}
```

### Validation Best Practices

1. **Business Logic in Schemas**
```typescript
export const CreateEventSchema = z.object({
  // ... other fields
}).refine((data) => {
  // Custom business validation
  if (data.enable_recording && data.access_type === "OPEN") {
    throw new Error("Recording cannot be enabled for open meetings");
  }
  return true;
});
```

2. **Descriptive Error Messages**
```typescript
z.string()
  .min(1, "Event title is required")
  .max(1024, "Event title must be less than 1024 characters")
  .describe("The title/summary of the calendar event")
```

3. **Smart Defaults**
```typescript
z.object({
  access_type: z.enum(["OPEN", "TRUSTED", "RESTRICTED"]).default("TRUSTED"),
  enable_recording: z.boolean().default(false)
})
```

### Error Handling Standards

1. **Context-Aware Messages**
```typescript
GoogleApiErrorHandler.handleError(error, "calendar event creation");
// Results in: "Error creating calendar event: [specific error]"
```

2. **Solution-Oriented Errors**
```typescript
throw new McpError(
  ErrorCode.InvalidRequest,
  `🏢 Enterprise Feature Required\n` +
  `Problem: Recording requires Google Workspace Business+\n` +
  `Solution: Upgrade workspace plan or use basic calendar events`
);
```

## 🚀 Deployment & CI/CD

### Build Process

```bash
# Clean build
npm run clean
npm run build

# Verify build
node build/index.js --version

# Test production build
G_OAUTH_CREDENTIALS="/path/to/creds.json" node build/index.js
```

### Docker Development

```bash
# Build development image
docker build -t google-meet-mcp:dev .

# Run with volume mounting
docker run -v $(pwd):/app -p 3001:3001 google-meet-mcp:dev
```

### Testing in Claude Desktop

```json
{
  "mcpServers": {
    "google-meet-dev": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/src/index.ts"],
      "env": {
        "G_OAUTH_CREDENTIALS": "/absolute/path/to/credentials.json",
        "NODE_ENV": "development"
      }
    }
  }
}
```

## 📋 Code Review Checklist

### Before Submitting PR

- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] No 'any' types introduced
- [ ] Validation schemas added for new tools
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Type definitions added
- [ ] Integration tests written

### Code Quality Standards

- [ ] Proper TypeScript interfaces
- [ ] Comprehensive error handling
- [ ] Business logic validation
- [ ] Descriptive variable names
- [ ] Function documentation
- [ ] Test coverage >90%

### Security Considerations

- [ ] No credentials in code
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive data
- [ ] Proper permission checks
- [ ] Token handling secure

## 🎯 Contributing Guidelines

### Getting Started

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow development workflow above
4. Submit pull request with comprehensive description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature  
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows TypeScript standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
```

### Development Best Practices

1. **Write Tests First**: TDD approach when possible
2. **Small, Focused Commits**: One logical change per commit
3. **Comprehensive Documentation**: Update docs with code changes
4. **Type Safety**: Maintain strict TypeScript compliance
5. **Error Handling**: Always handle edge cases and errors

---

This development guide provides comprehensive instructions for contributing to and developing the Google Meet MCP Server with enterprise-grade standards and practices.