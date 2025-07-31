// Revoke API Key Endpoint
// POST /api/mcp/revoke-api-key

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // ← Ajustar a tu ruta NextAuth  
import { deactivateApiKey } from '../../../lib/api-keys';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { apiKeyId } = req.body;

    if (!apiKeyId) {
      return res.status(400).json({ error: 'API key ID is required' });
    }

    // Deactivate the API key (only user's own keys)
    const success = await deactivateApiKey(apiKeyId, session.user.id);

    if (!success) {
      return res.status(404).json({ 
        error: 'API key not found or not authorized' 
      });
    }

    console.log(`✅ API key revoked: ${apiKeyId} by user: ${session.user.email}`);

    res.status(200).json({
      success: true,
      message: 'API key revoked successfully',
      apiKeyId: apiKeyId
    });

  } catch (error) {
    console.error('❌ Revoke API key error:', error);
    res.status(500).json({ 
      error: 'Failed to revoke API key',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}