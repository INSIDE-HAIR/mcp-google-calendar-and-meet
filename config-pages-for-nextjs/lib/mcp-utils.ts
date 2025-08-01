// MCP Utilities for Google Meet MCP Server
import { connectToDatabase } from './mongodb';
import { decrypt } from './encryption';
import type { GoogleTokens, MCPLogEntry } from '@/types/mcp';

export async function getUserGoogleCredentials(userId: string): Promise<GoogleTokens | null> {
  const { db } = await connectToDatabase();
  
  const user = await db.collection('users').findOne({ _id: userId });
  
  if (!user?.googleCredentials) {
    return null;
  }
  
  try {
    const decryptedCredentials = decrypt(user.googleCredentials);
    const credentials = JSON.parse(decryptedCredentials);
    
    // Return user's stored tokens if available, otherwise use the credentials
    if (user.googleTokens) {
      return {
        access_token: user.googleTokens.access_token,
        refresh_token: user.googleTokens.refresh_token,
        scope: user.googleTokens.scope || 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/meetings.space.created',
        token_type: user.googleTokens.token_type || 'Bearer',
        expiry_date: user.googleTokens.expires_at?.getTime() || Date.now() + 3600000
      };
    }
    
    // Fallback to credentials structure (for backwards compatibility)
    return {
      access_token: credentials.access_token || '',
      refresh_token: credentials.refresh_token || '',
      scope: credentials.scope || 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/meetings.space.created',
      token_type: credentials.token_type || 'Bearer',
      expiry_date: credentials.expiry_date || Date.now() + 3600000
    };
  } catch (error) {
    console.error('Error decrypting Google credentials:', error);
    return null;
  }
}

export async function updateUserGoogleTokens(userId: string, tokens: GoogleTokens): Promise<void> {
  const { db } = await connectToDatabase();
  
  await db.collection('users').updateOne(
    { _id: userId },
    {
      $set: {
        googleTokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expires_at: new Date(tokens.expiry_date)
        },
        googleTokensUpdatedAt: new Date()
      }
    }
  );
}

export async function logMCPRequest(logEntry: MCPLogEntry): Promise<void> {
  const { db } = await connectToDatabase();
  
  try {
    await db.collection('mcp_requests').insertOne({
      ...logEntry,
      timestamp: new Date(logEntry.timestamp)
    });
  } catch (error) {
    console.error('Error logging MCP request:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

export async function getMCPStats(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<{
  totalRequests: number;
  uniqueUsers: number;
  topTools: Array<{ tool: string; count: number }>;
  requestsByDay: Array<{ date: string; count: number }>;
}> {
  const { db } = await connectToDatabase();
  
  const now = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }
  
  const matchStage = { timestamp: { $gte: startDate } };
  
  // Get total requests
  const totalRequests = await db.collection('mcp_requests').countDocuments(matchStage);
  
  // Get unique users
  const uniqueUsers = await db.collection('mcp_requests').distinct('userId', matchStage).then(users => users.length);
  
  // Get top tools
  const topToolsPipeline = [
    { $match: { ...matchStage, toolName: { $exists: true, $ne: null } } },
    { $group: { _id: '$toolName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { tool: '$_id', count: 1, _id: 0 } }
  ];
  
  const topTools = await db.collection('mcp_requests').aggregate(topToolsPipeline).toArray();
  
  // Get requests by day
  const requestsByDayPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } }
  ];
  
  const requestsByDay = await db.collection('mcp_requests').aggregate(requestsByDayPipeline).toArray();
  
  return {
    totalRequests,
    uniqueUsers,
    topTools,
    requestsByDay
  };
}

export async function cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
  const { db } = await connectToDatabase();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await db.collection('mcp_requests').deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result.deletedCount || 0;
}