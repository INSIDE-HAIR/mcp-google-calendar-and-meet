// API Route: Generate API Key for MCP Access
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createApiKey } from '../../../lib/api-keys';
import { checkMCPAccess } from '../../../lib/mcp-utils';

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

    // Check if user has Google credentials configured
    const mcpAccess = await checkMCPAccess(session.user.id);
    
    if (!mcpAccess.hasCredentials) {
      return res.status(400).json({ 
        error: 'Google credentials not configured',
        message: 'Please configure your Google OAuth credentials first',
        setupUrl: '/dashboard/google-meet-setup'
      });
    }

    // Generate new API key
    const apiKeyInfo = await createApiKey(
      session.user.id,
      session.user.email,
      session.user.name
    );

    console.log(`✅ API key generated for user: ${session.user.name} (${session.user.email})`);

    res.status(200).json({
      success: true,
      apiKey: apiKeyInfo.apiKey,
      userName: apiKeyInfo.userName,
      userEmail: apiKeyInfo.userEmail,
      createdAt: apiKeyInfo.createdAt,
      message: 'API key generated successfully'
    });

  } catch (error) {
    console.error('❌ Generate API key error:', error);
    res.status(500).json({ 
      error: 'Failed to generate API key',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}