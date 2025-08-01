/**
 * Utility Types for Google Meet MCP Server
 * Common utility types and helpers
 */

// =============================================================================
// Generic Utility Types
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredOnly<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// =============================================================================
// Promise & Async Utility Types
// =============================================================================

export type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
export type PromiseReject = (reason?: any) => void;

export type AsyncFunction<T extends any[] = any[], R = any> = (
  ...args: T
) => Promise<R>;

// =============================================================================
// Date & Time Utility Types
// =============================================================================

export type ISODateString = string; // Format: YYYY-MM-DDTHH:mm:ss.sssZ
export type TimeZone = string; // Format: 'America/New_York', 'UTC', etc.

// =============================================================================
// Validation Helpers
// =============================================================================

export type ValidatedInput<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// =============================================================================
// HTTP & API Utility Types
// =============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpStatusCode = 
  | 200 | 201 | 204 // Success
  | 400 | 401 | 403 | 404 | 409 | 429 // Client Error
  | 500 | 502 | 503 | 504; // Server Error

// =============================================================================
// Error Handling Types
// =============================================================================

export interface ErrorWithCode extends Error {
  code?: string | number;
  statusCode?: number;
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string | number;
    details?: unknown;
  };
}

// =============================================================================
// Environment & Configuration Types
// =============================================================================

export type NodeEnv = 'development' | 'production' | 'test';

export interface ProcessEnv {
  NODE_ENV?: NodeEnv;
  G_OAUTH_CREDENTIALS?: string;
  GOOGLE_MEET_CREDENTIALS_PATH?: string;
  GOOGLE_MEET_TOKEN_PATH?: string;
  DEBUG?: string;
  LOG_LEVEL?: string;
  MEET_ENABLE_BETA?: string;
  MEET_MAX_RETRIES?: string;
  MEET_TIMEOUT_MS?: string;
}

// =============================================================================
// JSON & Serialization Types
// =============================================================================

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// =============================================================================
// File System Types
// =============================================================================

export type FilePath = string;
export type FileContent = string | Buffer;

export interface FileReadOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

export interface FileWriteOptions {
  encoding?: BufferEncoding;
  mode?: number;
  flag?: string;
}

// =============================================================================
// Branded Types for Type Safety
// =============================================================================

declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };

export type EventId = Brand<string, 'EventId'>;
export type CalendarId = Brand<string, 'CalendarId'>;
export type SpaceName = Brand<string, 'SpaceName'>;
export type ConferenceRecordName = Brand<string, 'ConferenceRecordName'>;
export type RecordingName = Brand<string, 'RecordingName'>;
export type TranscriptName = Brand<string, 'TranscriptName'>;
export type ParticipantName = Brand<string, 'ParticipantName'>;

// =============================================================================
// Array & Object Helpers
// =============================================================================

export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never;

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

// =============================================================================
// Function Utility Types
// =============================================================================

export type Handler<TInput = unknown, TOutput = unknown> = (
  input: TInput
) => Promise<TOutput>;

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

export type ErrorHandler = (error: Error) => void | Promise<void>;

// =============================================================================
// MCP Protocol Specific Types
// =============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  validation?: any; // Zod schema
  category?: 'calendar' | 'meet';
}

export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface ToolRequest {
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}