// API Route: Store Google OAuth Credentials
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { storeUserGoogleCredentials } from '../../../lib/mcp-utils';

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

    const { credentials } = req.body;

    // Validate credentials format
    if (!credentials || typeof credentials !== 'object') {
      return res.status(400).json({ error: 'Invalid credentials format' });
    }

    // Check required fields
    const requiredFields = ['client_id', 'client_secret'];
    for (const field of requiredFields) {
      if (!credentials[field]) {
        return res.status(400).json({ 
          error: `Missing required field: ${field}` 
        });
      }
    }

    // Validate client_id format (should be Google OAuth client ID)
    if (!credentials.client_id.includes('.apps.googleusercontent.com')) {
      return res.status(400).json({ 
        error: 'Invalid Google OAuth client_id format' 
      });
    }

    // Store encrypted credentials in database
    await storeUserGoogleCredentials(
      session.user.id,
      credentials
    );

    console.log(`✅ Google credentials stored for user: ${session.user.name} (${session.user.email})`);

    res.status(200).json({ 
      success: true,
      message: 'Google credentials stored successfully'
    });

  } catch (error) {
    console.error('❌ Setup credentials error:', error);
    res.status(500).json({ 
      error: 'Failed to store credentials',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}