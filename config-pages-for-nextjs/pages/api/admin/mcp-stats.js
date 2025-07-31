// Admin MCP Statistics Endpoint
// GET /api/admin/mcp-stats

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]'; // ← Ajustar a tu ruta NextAuth
import { getApiKeyUsageStats } from '../../../lib/api-keys';
import { getMCPUsers } from '../../../lib/mcp-utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate admin user
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin (adjust based on your admin logic)
    if (!session.user.role === 'admin' && !session.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { timeRange = '30d' } = req.query;

    // Get API key usage statistics
    const apiKeyStats = await getApiKeyUsageStats(timeRange);
    
    // Get all MCP users
    const mcpUsers = await getMCPUsers();

    // Combine statistics
    const stats = {
      overview: {
        totalUsers: mcpUsers.length,
        totalApiKeys: apiKeyStats.totalKeys,
        activeApiKeys: apiKeyStats.activeKeys,
        recentlyActive: apiKeyStats.recentlyActive,
        timeRange: timeRange
      },
      apiKeyStats: apiKeyStats,
      users: mcpUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        mcpEnabled: user.mcpEnabled,
        credentialsConfigured: user.googleCredentialsUpdatedAt || null,
        lastActivity: user.lastActivity || null
      })),
      topUsers: apiKeyStats.usageByUser.slice(0, 10),
      generatedAt: new Date().toISOString()
    };

    console.log(`📊 Admin stats requested by: ${session.user.email}`);

    res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}