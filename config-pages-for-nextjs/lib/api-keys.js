// API Key management for MCP access
import { connectToDatabase } from './mongodb';
import { generateApiKey, hash } from './encryption';

/**
 * Generate new API key for user
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @param {string} userName - User name
 * @returns {object} - API key info
 */
export async function createApiKey(userId, userEmail, userName) {
  try {
    const { db } = await connectToDatabase();
    
    // Generate new API key
    const apiKey = 'mcp_' + generateApiKey(24);
    const apiKeyHash = hash(apiKey);
    
    // Store in database
    const apiKeyData = {
      _id: apiKeyHash,
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      apiKey: apiKey, // Store unhashed for now (you might want to hash this too)
      createdAt: new Date(),
      lastUsed: null,
      isActive: true,
      usageCount: 0
    };
    
    await db.collection('api_keys').insertOne(apiKeyData);
    
    console.log(`✅ API key created for user: ${userName} (${userEmail})`);
    
    return {
      apiKey: apiKey,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      createdAt: apiKeyData.createdAt
    };
    
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
}

/**
 * Verify API key and get user info
 * @param {string} apiKey - API key to verify
 * @returns {object|null} - User info or null if invalid
 */
export async function verifyApiKey(apiKey) {
  try {
    const { db } = await connectToDatabase();
    
    const apiKeyData = await db.collection('api_keys').findOne({
      apiKey: apiKey,
      isActive: true
    });
    
    if (!apiKeyData) {
      console.log(`❌ Invalid API key: ${apiKey.slice(0, 8)}...`);
      return null;
    }
    
    // Update last used timestamp and usage count
    await db.collection('api_keys').updateOne(
      { _id: apiKeyData._id },
      { 
        $set: { lastUsed: new Date() },
        $inc: { usageCount: 1 }
      }
    );
    
    console.log(`✅ Valid API key for user: ${apiKeyData.userName}`);
    
    return {
      userId: apiKeyData.userId,
      userName: apiKeyData.userName,
      userEmail: apiKeyData.userEmail,
      lastUsed: new Date(),
      usageCount: apiKeyData.usageCount + 1
    };
    
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}

/**
 * Get all API keys for admin
 * @returns {array} - List of API keys
 */
export async function getAllApiKeys() {
  try {
    const { db } = await connectToDatabase();
    
    const apiKeys = await db.collection('api_keys').find({}).sort({ 
      createdAt: -1 
    }).toArray();
    
    // Remove sensitive data for admin view
    return apiKeys.map(key => ({
      id: key._id,
      userId: key.userId,
      userName: key.userName,
      userEmail: key.userEmail,
      apiKeyPreview: key.apiKey.slice(0, 8) + '...',
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      isActive: key.isActive,
      usageCount: key.usageCount
    }));
    
  } catch (error) {
    console.error('Error getting all API keys:', error);
    return [];
  }
}

/**
 * Get API keys for specific user
 * @param {string} userId - User ID
 * @returns {array} - User's API keys
 */
export async function getUserApiKeys(userId) {
  try {
    const { db } = await connectToDatabase();
    
    const apiKeys = await db.collection('api_keys').find({
      userId: userId
    }).sort({ createdAt: -1 }).toArray();
    
    return apiKeys.map(key => ({
      id: key._id,
      apiKeyPreview: key.apiKey.slice(0, 8) + '...',
      fullApiKey: key.apiKey, // Include full key for user's own keys
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      isActive: key.isActive,
      usageCount: key.usageCount
    }));
    
  } catch (error) {
    console.error('Error getting user API keys:', error);
    return [];
  }
}

/**
 * Deactivate API key
 * @param {string} apiKeyId - API key ID to deactivate
 * @param {string} userId - User ID (for authorization)
 * @returns {boolean} - Success status
 */
export async function deactivateApiKey(apiKeyId, userId = null) {
  try {
    const { db } = await connectToDatabase();
    
    const filter = { _id: apiKeyId };
    if (userId) {
      filter.userId = userId; // Only allow users to deactivate their own keys
    }
    
    const result = await db.collection('api_keys').updateOne(
      filter,
      { 
        $set: { 
          isActive: false,
          deactivatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ API key deactivated: ${apiKeyId}`);
    return result.modifiedCount > 0;
    
  } catch (error) {
    console.error('Error deactivating API key:', error);
    return false;
  }
}

/**
 * Get API key usage statistics
 * @param {string} timeRange - Time range ('7d', '30d', '90d')
 * @returns {object} - Usage statistics
 */
export async function getApiKeyUsageStats(timeRange = '30d') {
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
    
    const stats = await db.collection('api_keys').aggregate([
      {
        $facet: {
          totalKeys: [
            { $count: "count" }
          ],
          activeKeys: [
            { $match: { isActive: true } },
            { $count: "count" }
          ],
          recentlyUsed: [
            { $match: { lastUsed: { $gte: startDate } } },
            { $count: "count" }
          ],
          usageByUser: [
            { $match: { isActive: true } },
            { $group: { 
              _id: "$userName", 
              totalUsage: { $sum: "$usageCount" },
              lastUsed: { $max: "$lastUsed" }
            }},
            { $sort: { totalUsage: -1 } }
          ]
        }
      }
    ]).toArray();
    
    const result = stats[0];
    
    return {
      totalKeys: result.totalKeys[0]?.count || 0,
      activeKeys: result.activeKeys[0]?.count || 0,
      recentlyActive: result.recentlyUsed[0]?.count || 0,
      usageByUser: result.usageByUser,
      timeRange: timeRange,
      generatedAt: new Date()
    };
    
  } catch (error) {
    console.error('Error getting API key usage stats:', error);
    return { totalKeys: 0, activeKeys: 0, recentlyActive: 0, usageByUser: [] };
  }
}