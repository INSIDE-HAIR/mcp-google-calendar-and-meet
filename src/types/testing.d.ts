/**
 * TypeScript definitions for testing environment
 * Vitest mocks and testing utilities
 */

import type { Mock } from 'vitest';
import type { OAuth2Client } from 'googleapis';
import type { PathLike, FileHandle } from 'fs';

// =============================================================================
// Vitest Mock Types
// =============================================================================

// Mock for fs.readFile - Use generic Mock type to avoid parameter conflicts
export type MockReadFile = Mock<any, any> & {
  mockImplementation(fn: (...args: any[]) => Promise<string | Buffer>): MockReadFile;
};

// Mock for fs.writeFile  
export type MockWriteFile = Mock<any, any> & {
  mockImplementation(fn: (...args: any[]) => Promise<void>): MockWriteFile;
};

// Mock for fetch
export type MockFetch = Mock<
  [input: string | URL | Request, init?: RequestInit],
  Promise<Response>
>;

// Mock OAuth2Client
export interface MockOAuth2Client {
  getAccessToken: Mock<[], Promise<{ token?: string }>>;
  generateAuthUrl: Mock<[options: any], string>;
  getToken: Mock<[code: string], Promise<{ tokens: any }>>;
  setCredentials: Mock<[tokens: any], void>;
  credentials: any;
}

// Mock Calendar Client
export interface MockCalendarClient {
  calendars: {
    list: Mock<[], Promise<{ data: { items?: any[] } }>>;
  };
  events: {
    list: Mock<[params: any], Promise<{ data: { items?: any[] } }>>;
    get: Mock<[params: any], Promise<{ data: any }>>;
    insert: Mock<[params: any], Promise<{ data: any }>>;
    patch: Mock<[params: any], Promise<{ data: any }>>;
    delete: Mock<[params: any], Promise<void>>;
  };
}

// Mock Response for fetch
export interface MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: {
    get: Mock<[name: string], string | null>;
  };
  json: Mock<[], Promise<any>>;
  text: Mock<[], Promise<string>>;
}

// =============================================================================
// Error Mock Types
// =============================================================================

export interface MockError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  path?: string;
}

// =============================================================================
// Global Test Utilities
// =============================================================================

declare global {
  var testUtils: {
    getMockCredentialsPath(): string;
    getMockTokenPath(): string;
    getMockCalendarEvent(): any;
    getMockMeetSpace(): any;
    getMockCredentials(): any;
    getMockToken(): any;
    suppressConsole(): void;
  };
  
  // Mock functions in global scope for tests
  var fetch: MockFetch;
}

// =============================================================================
// Vitest Global Types Extensions
// =============================================================================

declare module 'vitest' {
  interface Mock<TArgs extends any[] = any[], TReturns = any> {
    mockImplementation(fn: (...args: TArgs) => TReturns): this;
    mockResolvedValue(value: Awaited<TReturns>): this;
    mockRejectedValue(value: any): this;
    mockReturnValue(value: TReturns): this;
    mock: {
      calls: TArgs[];
      results: Array<{
        type: 'return' | 'throw';
        value: TReturns;
      }>;
    };
  }
}

export {};