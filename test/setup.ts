/**
 * Vitest setup file
 * Configures global test environment and utilities
 */

import dotenv from 'dotenv';
import { beforeEach, vi } from 'vitest';

// Load environment variables for testing
dotenv.config({ path: '.env.local' });

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  vi.restoreAllMocks();
  
  // Restore console
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

// Global test utilities
global.testUtils = {
  // Mock credentials path for tests
  getMockCredentialsPath: () => '/mock/path/to/credentials.json',
  getMockTokenPath: () => '/mock/path/to/token.json',
  
  // Mock event data
  getMockCalendarEvent: () => ({
    id: 'test-event-id',
    summary: 'Test Event',
    description: 'Test Description',
    start: { dateTime: '2025-08-01T10:00:00Z' },
    end: { dateTime: '2025-08-01T11:00:00Z' },
    attendees: [{ email: 'test@example.com' }]
  }),
  
  // Mock space data
  getMockMeetSpace: () => ({
    name: 'spaces/test-space-id',
    meetingUri: 'https://meet.google.com/test-meeting',
    meetingCode: 'test-code',
    config: {
      accessType: 'TRUSTED',
      entryPointAccess: 'ALL'
    }
  }),
  
  // Mock credentials data
  getMockCredentials: () => ({
    installed: {
      client_id: 'mock-client-id',
      client_secret: 'mock-client-secret',
      redirect_uris: ['http://localhost:3000']
    }
  }),
  
  // Mock token data
  getMockToken: () => ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expiry_date: Date.now() + 3600000
  }),
  
  // Helper to suppress console during specific tests
  suppressConsole: () => {
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  }
};