# 🛠️ Development Guide - Google Meet MCP Server v3.0

## 📋 Overview

This guide covers everything you need to know to develop, modify, and extend the Google Meet MCP Server. Whether you're adding new features, fixing bugs, or integrating with other systems, this guide provides the foundation you need.

## 🚀 Quick Development Setup

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm 9+** or **yarn 1.22+**
- **Git** for version control
- **VS Code** (recommended) with TypeScript extensions
- **Google Cloud Account** with billing enabled

### One-Command Setup
```bash
# Clone and setup in one go
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server
npm install && npm run setup:dev
```

### Manual Setup
```bash
# 1. Clone repository
git clone https://github.com/INSIDE-HAIR/google-meet-mcp-server.git
cd google-meet-mcp-server

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Setup Google OAuth credentials
npm run setup

# 5. Start development server
npm run start:dev
```

---

## 🏗️ Project Structure Deep Dive

### Core Source Structure
```
src/
├── index.ts                     # Main MCP server entry point
├── smithery.ts                  # Smithery-compatible entry point
├── GoogleMeetAPI.ts            # Core API integration wrapper
├── setup.ts                    # OAuth setup utility
│
├── validation/                 # Input validation layer
│   └── meetSchemas.ts          # Zod validation schemas
│
├── errors/                     # Error handling
│   └── GoogleApiErrorHandler.ts # Specialized Google API errors
│
├── monitoring/                 # Monitoring and observability
│   ├── healthCheck.ts          # Health verification system
│   ├── metrics.ts              # Metrics collection (Prometheus)
│   └── apiMonitor.ts           # API status monitoring
│
├── endpoints/                  # HTTP endpoints
│   └── monitoring.ts           # Monitoring HTTP endpoints
│
├── types/                      # TypeScript definitions
│   ├── google-apis.d.ts        # Google API type definitions
│   ├── mcp-server.d.ts         # MCP server types
│   ├── utilities.d.ts          # Utility types and branded types
│   └── index.ts                # Centralized type exports
│
└── shared/                     # Shared utilities (future expansion)
```

### Development Configuration Files
```
├── tsconfig.json               # TypeScript configuration
├── vitest.config.js           # Test configuration
├── .eslintrc.js               # Linting rules (if present)
├── .prettierrc                # Code formatting (if present)
├── package.json               # Dependencies and scripts
└── CLAUDE.md                  # Claude Code development guidance
```

---

## 🎯 Development Workflow

### 1. **Feature Development Cycle**

#### Step 1: Setup Development Environment
```bash
# Start with clean slate
git checkout main
git pull origin main
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Start development server with monitoring
npm run start:dev
```

#### Step 2: Development with Hot Reload
```bash
# Terminal 1: Development server with hot reload
npm run start:dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: Type checking
npm run type-check --watch
```

#### Step 3: Testing Your Changes
```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
npm run test:validation     # Validation tests

# Generate coverage report
npm run test:coverage
```

#### Step 4: Quality Assurance
```bash
# Type checking
npm run type-check

# Build verification
npm run build

# Production test
npm run start:compiled
```

---

### 2. **Adding New Google API Tools**

#### Example: Adding a New Calendar Tool

**Step 1: Define the Tool Schema**
```typescript
// src/validation/meetSchemas.ts

export const NewCalendarToolSchema = z.object({
  parameter1: z.string()
    .min(1, 'Parameter is required')
    .describe('Description of parameter'),
  parameter2: z.boolean()
    .default(false)
    .describe('Boolean parameter description'),
  optional_param: z.string()
    .optional()
    .describe('Optional parameter')
}).describe('New calendar tool for specific functionality');

// Add to ValidationSchemas export
export const ValidationSchemas = {
  // ... existing schemas
  'calendar_v3_new_tool': NewCalendarToolSchema,
};
```

**Step 2: Implement API Method**
```typescript
// src/GoogleMeetAPI.ts

/**
 * New calendar tool functionality
 * @param parameter1 - Required parameter
 * @param parameter2 - Boolean flag
 * @param optionalParam - Optional parameter
 * @returns Promise<ToolResult>
 */
async newCalendarTool(
  parameter1: string, 
  parameter2: boolean = false, 
  optionalParam?: string
): Promise<ToolResult> {
  try {
    // Input validation
    if (!parameter1) {
      throw new Error('Parameter1 is required');
    }

    // API call to Google Calendar
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      // ... API parameters
    });

    // Process response
    const processedResult = this.processCalendarResponse(response.data);
    
    // Record metrics
    this.recordAPICall('calendar_new_tool', true);
    
    return processedResult;
    
  } catch (error) {
    this.recordAPICall('calendar_new_tool', false);
    GoogleApiErrorHandler.handleError(error, 'newCalendarTool');
  }
}

/**
 * Helper method to process API response
 */
private processCalendarResponse(data: any): ToolResult {
  return {
    // Transform Google API response to standardized format
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
}
```

**Step 3: Register Tool in MCP Servers**
```typescript
// src/index.ts - Add to tool registration

{
  name: "calendar_v3_new_tool",
  description: "[Calendar API v3] Description of new tool functionality",
  inputSchema: {
    type: "object",
    properties: {
      parameter1: {
        type: "string",
        description: "Description of parameter1"
      },
      parameter2: {
        type: "boolean", 
        description: "Description of parameter2"
      },
      optional_param: {
        type: "string",
        description: "Optional parameter description"
      }
    },
    required: ["parameter1"]
  }
}

// Add to tool handler
else if (toolName === "calendar_v3_new_tool") {
  const validatedArgs = validateToolArgs(toolName, args);
  
  const result = await this.googleMeet.newCalendarTool(
    validatedArgs.parameter1,
    validatedArgs.parameter2,
    validatedArgs.optional_param
  );
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}
```

**Step 4: Add to Smithery Entry Point**
```typescript
// src/smithery.ts - Mirror the tool registration and handler
```

**Step 5: Write Tests**
```typescript
// test/GoogleMeetAPI.test.ts

describe('newCalendarTool', () => {
  it('should handle valid parameters', async () => {
    const result = await api.newCalendarTool('test-param', true);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should validate required parameters', async () => {
    await expect(api.newCalendarTool('', false))
      .rejects.toThrow('Parameter1 is required');
  });

  it('should handle optional parameters', async () => {
    const result = await api.newCalendarTool('test', false, 'optional');
    
    expect(result).toBeDefined();
  });
});
```

**Step 6: Update Documentation**
```typescript
// Update API_REFERENCE.md with new tool documentation
// Update BASIC_EXAMPLES.md with usage examples
// Update tool count in README.md (24 tools instead of 23)
```

---

### 3. **TypeScript Development Patterns**

#### Branded Types for Type Safety
```typescript
// src/types/utilities.d.ts

// Branded types prevent string mixing
type Brand<T, U> = T & { __brand: U };

export type EventId = Brand<string, 'EventId'>;
export type SpaceName = Brand<string, 'SpaceName'>;
export type CalendarId = Brand<string, 'CalendarId'>;

// Usage in API methods
async getCalendarEvent(eventId: EventId): Promise<ProcessedEvent> {
  // TypeScript ensures only EventId strings are passed
}
```

#### Interface Design Patterns
```typescript
// src/types/google-apis.d.ts

// Base interfaces
export interface BaseAPIResponse {
  success: boolean;
  timestamp: string;
  requestId?: string;
}

// Specific interfaces extending base
export interface CalendarEventResponse extends BaseAPIResponse {
  event: ProcessedEvent;
  calendarId: CalendarId;
}

// Configuration interfaces
export interface CreateEventConfig {
  summary: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  guestPermissions?: GuestPermissions;
}
```

#### Error Type Definitions
```typescript
// src/types/mcp-server.d.ts

export interface MCPError {
  code: ErrorCode;
  message: string;
  context?: string;
  troubleshooting?: string[];
}

export interface ValidationError extends MCPError {
  field: string;
  expectedFormat: string;
  receivedValue: any;
}
```

---

### 4. **Testing Strategies**

#### Unit Testing with Vitest
```typescript
// test/GoogleMeetAPI.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import GoogleMeetAPI from '../src/GoogleMeetAPI';

describe('GoogleMeetAPI', () => {
  let api: GoogleMeetAPI;
  
  beforeEach(() => {
    // Setup API instance with mocked credentials
    api = new GoogleMeetAPI('mock-creds', 'mock-token');
  });

  describe('createCalendarEvent', () => {
    it('should create event with minimal parameters', async () => {
      // Mock the Google API response
      const mockResponse = {
        data: {
          id: 'event123',
          summary: 'Test Event',
          start: { dateTime: '2024-02-01T10:00:00Z' }
        }
      };

      // Setup mock
      vi.spyOn(api.calendar.events, 'insert')
        .mockResolvedValue(mockResponse);

      const result = await api.createCalendarEvent({
        summary: 'Test Event',
        startTime: '2024-02-01T10:00:00Z',
        endTime: '2024-02-01T11:00:00Z'
      });

      expect(result.event.id).toBe('event123');
      expect(result.event.summary).toBe('Test Event');
    });
  });
});
```

#### Integration Testing
```typescript
// test/integration.test.ts

describe('Integration Tests', () => {
  it('should complete full calendar workflow', async () => {
    // This test requires real credentials in test environment
    if (!process.env.TEST_CREDENTIALS) {
      return; // Skip integration tests without credentials
    }

    const api = new GoogleMeetAPI(
      process.env.TEST_CREDENTIALS,
      process.env.TEST_TOKEN
    );

    // 1. List calendars
    const calendars = await api.listCalendars();
    expect(calendars.length).toBeGreaterThan(0);

    // 2. Create event
    const event = await api.createCalendarEvent({
      summary: 'Integration Test Event',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString()
    });

    expect(event.event.id).toBeDefined();

    // 3. Clean up
    await api.deleteCalendarEvent(event.event.id);
  });
});
```

#### Validation Testing
```typescript
// test/validation.test.ts

describe('Validation Schemas', () => {
  describe('CreateEventSchema', () => {
    it('should validate required fields', () => {
      const validData = {
        summary: 'Test Event',
        start_time: '2024-02-01T10:00:00Z',
        end_time: '2024-02-01T11:00:00Z'
      };

      const result = CreateEventSchema.parse(validData);
      expect(result.summary).toBe('Test Event');
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        summary: 'Test Event',
        start_time: 'invalid-time',
        end_time: '2024-02-01T11:00:00Z'
      };

      expect(() => CreateEventSchema.parse(invalidData))
        .toThrow('Start time must be in ISO 8601 format');
    });

    it('should validate time logic', () => {
      const invalidData = {
        summary: 'Test Event',
        start_time: '2024-02-01T11:00:00Z',
        end_time: '2024-02-01T10:00:00Z' // End before start
      };

      expect(() => CreateEventSchema.parse(invalidData))
        .toThrow('End time must be after start time');
    });
  });
});
```

---

### 5. **Debugging and Monitoring**

#### Development Debugging
```bash
# Enable debug logging
export LOG_LEVEL=debug
export NODE_ENV=development
npm run start:dev

# Enable health check monitoring
export ENABLE_HEALTH_CHECK=true
export HEALTH_CHECK_PORT=9090

# Monitor health endpoints
curl http://localhost:9090/health
curl http://localhost:9090/metrics
curl http://localhost:9090/api-status
```

#### VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug MCP Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug",
        "G_OAUTH_CREDENTIALS": "${workspaceFolder}/credentials.json"
      },
      "runtimeArgs": ["-r", "tsx/cjs"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

#### Performance Profiling
```typescript
// src/monitoring/profiling.ts (custom file)

export class PerformanceProfiler {
  private static timers: Map<string, number> = new Map();

  static start(label: string): void {
    this.timers.set(label, performance.now());
  }

  static end(label: string): number {
    const start = this.timers.get(label);
    if (!start) {
      throw new Error(`Timer '${label}' not found`);
    }
    
    const duration = performance.now() - start;
    this.timers.delete(label);
    
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
}

// Usage in API methods
async createCalendarEvent(data: CreateEventInput): Promise<ProcessedEvent> {
  PerformanceProfiler.start('createCalendarEvent');
  
  try {
    // ... API logic
    return result;
  } finally {
    PerformanceProfiler.end('createCalendarEvent');
  }
}
```

---

### 6. **Code Quality and Standards**

#### TypeScript Configuration
```json
// tsconfig.json key settings
{
  "compilerOptions": {
    "strict": false,              // Gradual adoption of strict mode
    "noImplicitAny": false,       // Allow any types during development
    "noImplicitReturns": false,   // Flexible return handling
    "skipLibCheck": true,         // Faster compilation
    "declaration": true,          // Generate .d.ts files
    "incremental": true,          // Faster rebuilds
    "tsBuildInfoFile": "./build/.tsbuildinfo"
  }
}
```

#### Error Handling Standards
```typescript
// Consistent error handling pattern
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Usage in API methods
async apiMethod(): Promise<Result> {
  try {
    // API call
    return result;
  } catch (error) {
    // Log error with context
    console.error(`API Error in ${methodName}:`, error);
    
    // Throw standardized error
    throw new APIError(
      'Failed to execute API call',
      'API_CALL_FAILED',
      { originalError: error, method: methodName }
    );
  }
}
```

#### Logging Standards
```typescript
// src/shared/logger.ts (custom)

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  static debug(message: string, context?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  static info(message: string, context?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, context || '');
    }
  }

  static warn(message: string, context?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  static error(message: string, context?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, context || '');
    }
  }
}
```

---

### 7. **Building and Deployment**

#### Development Build
```bash
# TypeScript compilation with watch
npm run build:watch

# Manual TypeScript compilation
npx tsc

# Custom build script (optimized)
npm run build
```

#### Production Build
```bash
# Clean build
npm run clean && npm run build

# Test production build
npm run start:compiled

# Docker build
docker build -t google-meet-mcp:local .
```

#### Environment-Specific Configuration
```typescript
// src/config/environment.ts

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: LogLevel;
  enableHealthCheck: boolean;
  healthCheckPort: number;
  enableMetrics: boolean;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
    logLevel: LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] || LogLevel.INFO,
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === 'true',
    healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT || '9090', 10),
    enableMetrics: process.env.ENABLE_METRICS !== 'false'
  };
}
```

---

## 🚀 Advanced Development Topics

### 1. **Custom Authentication Strategies**

If you need to implement alternative authentication methods:

```typescript
// src/auth/AuthProvider.ts

export interface AuthProvider {
  initialize(): Promise<void>;
  getAccessToken(): Promise<string>;
  refreshToken(): Promise<string>;
  isTokenValid(): boolean;
}

export class CustomAuthProvider implements AuthProvider {
  // Implement custom authentication logic
  async initialize(): Promise<void> {
    // Custom initialization
  }

  async getAccessToken(): Promise<string> {
    // Custom token retrieval
    return 'custom-access-token';
  }

  // ... other methods
}
```

### 2. **Plugin Architecture**

For extending functionality:

```typescript
// src/plugins/PluginSystem.ts

export interface MCPPlugin {
  name: string;
  version: string;
  initialize(api: GoogleMeetAPI): Promise<void>;
  getTools(): ToolDefinition[];
  handleTool(toolName: string, args: any): Promise<any>;
}

export class PluginManager {
  private plugins: MCPPlugin[] = [];

  registerPlugin(plugin: MCPPlugin): void {
    this.plugins.push(plugin);
  }

  async initializePlugins(api: GoogleMeetAPI): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.initialize(api);
    }
  }

  getAllTools(): ToolDefinition[] {
    return this.plugins.flatMap(plugin => plugin.getTools());
  }
}
```

### 3. **Custom Middleware**

For request/response processing:

```typescript
// src/middleware/RequestMiddleware.ts

export interface Middleware {
  before?(request: MCPRequest): Promise<MCPRequest>;
  after?(response: MCPResponse): Promise<MCPResponse>;
  onError?(error: Error): Promise<void>;
}

export class RequestLogger implements Middleware {
  async before(request: MCPRequest): Promise<MCPRequest> {
    console.log(`[REQUEST] ${request.method}:`, request.params);
    return request;
  }

  async after(response: MCPResponse): Promise<MCPResponse> {
    console.log(`[RESPONSE]`, response);
    return response;
  }
}
```

---

## 📚 Resources and References

### Development Resources
- **TypeScript Documentation**: [typescriptlang.org](https://www.typescriptlang.org/docs/)
- **Vitest Testing**: [vitest.dev](https://vitest.dev/)
- **Zod Validation**: [zod.dev](https://zod.dev/)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)

### Google API Resources
- **Google Calendar API**: [developers.google.com/calendar](https://developers.google.com/calendar)
- **Google Meet API**: [developers.google.com/meet](https://developers.google.com/meet)
- **OAuth 2.0**: [developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)

### Project-Specific Resources
- **Architecture Documentation**: [./architecture/SYSTEM_ARCHITECTURE.md](../architecture/SYSTEM_ARCHITECTURE.md)
- **API Reference**: [./api/API_REFERENCE.md](../api/API_REFERENCE.md)
- **Testing Guide**: [./TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

**🎯 This development guide provides everything you need to contribute effectively to the Google Meet MCP Server. Start with the quick setup, then dive into the specific areas that match your development goals.**