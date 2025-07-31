// MCP Utilities - Database operations and helper functions
import { connectToDatabase } from './mongodb';
import { encrypt, decrypt } from './encryption';

// Get user's Google credentials from database
export async function getUserGoogleCredentials(userId) {
  try {
    const { db } = await connectToDatabase();
    
    const user = await db.collection('users').findOne({ 
      _id: userId 
    });
    
    if (!user?.googleCredentials) {
      console.log(`❌ No Google credentials found for user: ${userId}`);
      return null;
    }

    // Decrypt stored credentials
    const decryptedCredentials = decrypt(user.googleCredentials);
    const credentials = JSON.parse(decryptedCredentials);
    
    console.log(`✅ Google credentials loaded for user: ${userId}`);
    return credentials;
    
  } catch (error) {
    console.error('Error getting user Google credentials:', error);
    return null;
  }
}

// Store user's Google credentials in database (encrypted)
export async function storeUserGoogleCredentials(userId, credentials) {
  try {
    const { db } = await connectToDatabase();
    
    // Encrypt credentials before storing
    const encryptedCredentials = encrypt(JSON.stringify(credentials));
    
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          googleCredentials: encryptedCredentials,
          googleCredentialsUpdatedAt: new Date(),
          mcpEnabled: true
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Google credentials stored for user: ${userId}`);
    return result;
    
  } catch (error) {
    console.error('Error storing user Google credentials:', error);
    throw error;
  }
}

// Update user's Google tokens (when refreshed)
export async function updateUserGoogleTokens(userId, tokens) {
  try {
    const { db } = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          'googleTokens.access_token': tokens.access_token,
          'googleTokens.refresh_token': tokens.refresh_token,
          'googleTokens.expires_at': tokens.expiry_date,
          googleTokensUpdatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Google tokens updated for user: ${userId}`);
    
  } catch (error) {
    console.error('Error updating user Google tokens:', error);
    throw error;
  }
}

// Log MCP requests for analytics
export async function logMCPRequest(requestData) {
  try {
    const { db } = await connectToDatabase();
    
    await db.collection('mcp_requests').insertOne({
      userId: requestData.userId,
      method: requestData.method,
      toolName: requestData.toolName,
      timestamp: requestData.timestamp,
      ipAddress: requestData.ipAddress,
      userAgent: requestData.userAgent
    });
    
  } catch (error) {
    // Don't throw error for logging failures
    console.error('Error logging MCP request:', error);
  }
}

// Get MCP usage analytics for user
export async function getMCPUsageAnalytics(userId, timeRange = '30d') {
  try {
    const { db } = await connectToDatabase();
    
    const startDate = new Date();
    if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }
    
    const analytics = await db.collection('mcp_requests').aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$toolName',
          count: { $sum: 1 },
          lastUsed: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    const totalRequests = analytics.reduce((sum, item) => sum + item.count, 0);
    
    return {
      totalRequests,
      timeRange,
      toolsUsage: analytics,
      generatedAt: new Date()
    };
    
  } catch (error) {
    console.error('Error getting MCP analytics:', error);
    return { totalRequests: 0, toolsUsage: [], error: error.message };
  }
}

// Check if user has MCP access enabled
export async function checkMCPAccess(userId) {
  try {
    const { db } = await connectToDatabase();
    
    const user = await db.collection('users').findOne({ 
      _id: userId 
    }, {
      projection: { mcpEnabled: 1, googleCredentials: 1 }
    });
    
    return {
      enabled: user?.mcpEnabled || false,
      hasCredentials: !!user?.googleCredentials,
      needsSetup: !user?.googleCredentials
    };
    
  } catch (error) {
    console.error('Error checking MCP access:', error);
    return { enabled: false, hasCredentials: false, needsSetup: true };
  }
}

// Enable/disable MCP access for user
export async function setMCPAccess(userId, enabled) {
  try {
    const { db } = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          mcpEnabled: enabled,
          mcpAccessUpdatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ MCP access ${enabled ? 'enabled' : 'disabled'} for user: ${userId}`);
    return true;
    
  } catch (error) {
    console.error('Error setting MCP access:', error);
    return false;
  }
}

// Get all users with MCP enabled (admin function)
export async function getMCPUsers() {
  try {
    const { db } = await connectToDatabase();
    
    const users = await db.collection('users').find({ 
      mcpEnabled: true 
    }, {
      projection: { 
        name: 1, 
        email: 1, 
        mcpEnabled: 1, 
        googleCredentialsUpdatedAt: 1,
        _id: 1
      }
    }).toArray();
    
    return users;
    
  } catch (error) {
    console.error('Error getting MCP users:', error);
    return [];
  }
}