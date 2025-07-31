// TypeScript definitions for MCP integration

export interface MCPUser {
  id: string;
  name: string;
  email: string;
  mcpEnabled: boolean;
  googleCredentials?: string; // Encrypted
  googleCredentialsUpdatedAt?: Date;
  googleTokens?: {
    access_token: string;
    refresh_token: string;
    expires_at: Date;
  };
}

export interface ApiKey {
  id: string;
  userId: string;
  apiKey: string;
  apiKeyPreview: string;
  fullApiKey?: string; // Only included for user's own keys
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  usageCount: number;
  userName?: string;
  userEmail?: string;
}

export interface MCPRequest {
  method: 'tools/list' | 'tools/call';
  params?: {
    name?: string;
    arguments?: Record<string, any>;
  };
}

export interface MCPResponse {
  tools?: MCPTool[];
  content?: MCPContent[];
  isError?: boolean;
  _meta?: {
    userId: string;
    timestamp: string;
    version: string;
    toolsCount?: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPContent {
  type: 'text';
  text: string;
}

export interface MCPAnalytics {
  totalRequests: number;
  timeRange: string;
  toolsUsage: Array<{
    _id: string;
    count: number;
    lastUsed: Date;
  }>;
  generatedAt: Date;
}

export interface MCPStatus {
  enabled: boolean;
  hasCredentials: boolean;
  needsSetup: boolean;
}

export interface GoogleCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface MCPLogEntry {
  userId: string;
  method: string;
  toolName?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
}

export interface MCPStats {
  overview: {
    totalUsers: number;
    totalApiKeys: number;
    activeApiKeys: number;
    recentlyActive: number;
    timeRange: string;
  };
  apiKeyStats: {
    totalKeys: number;
    activeKeys: number;
    recentlyActive: number;
    usageByUser: Array<{
      _id: string;
      totalUsage: number;
      lastUsed: Date;
    }>;
  };
  users: MCPUser[];
  topUsers: Array<{
    _id: string;
    totalUsage: number;
    lastUsed: Date;
  }>;
  generatedAt: string;
}