// Health Check Endpoint for MCP Service
// GET /api/mcp/health

import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test MongoDB connection
    const { db } = await connectToDatabase();
    await db.admin().ping();

    // Test encryption system
    const encryptionTest = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0',
      services: {
        mongodb: 'connected',
        encryption: encryptionTest ? 'available' : 'missing_key',
        mcp_adapter: 'ready'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version
    };

    res.status(200).json(healthStatus);

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        mongodb: 'disconnected',
        encryption: 'unknown',
        mcp_adapter: 'unknown'
      }
    });
  }
}