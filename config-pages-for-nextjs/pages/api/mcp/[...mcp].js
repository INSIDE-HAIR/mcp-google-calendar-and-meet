// Next.js API Route - MCP Handler
// This handles all MCP protocol requests from Claude Desktop
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { NextJSMCPAdapter } from '../../../lib/nextjs-mcp-adapter';
import { getUserGoogleCredentials, logMCPRequest } from '../../../lib/mcp-utils';
import { verifyApiKey } from '../../../lib/api-keys';

export default async function handler(req, res) {
  // CORS headers for Claude Desktop
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let userId = null;
    let userInfo = null;

    // Authentication Method 1: API Key (for Claude Desktop)
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      console.log(`🔑 API Key request: ${apiKey.slice(0, 8)}...`);
      
      const apiKeyInfo = await verifyApiKey(apiKey);
      if (!apiKeyInfo) {
        return res.status(403).json({ error: 'Invalid API key' });
      }
      
      userId = apiKeyInfo.userId;
      userInfo = apiKeyInfo;
    }
    
    // Authentication Method 2: Session (for web interface)
    else {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Either provide X-API-Key header or valid session'
        });
      }
      
      userId = session.user.id;
      userInfo = session.user;
    }

    // Log the request for analytics
    await logMCPRequest({
      userId,
      method: req.body?.method,
      toolName: req.body?.params?.name,
      timestamp: new Date(),
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    // Get user's Google credentials
    const userCredentials = await getUserGoogleCredentials(userId);
    
    if (!userCredentials) {
      return res.status(400).json({ 
        error: 'Google credentials not configured',
        setupUrl: '/dashboard/google-setup',
        message: 'Please configure your Google OAuth credentials first'
      });
    }

    // Initialize MCP adapter with user's credentials
    const mcpAdapter = new NextJSMCPAdapter(userCredentials);
    
    // Handle the MCP request
    const mcpRequest = req.body;
    console.log(`📋 MCP Request: ${mcpRequest.method} - ${mcpRequest.params?.name || 'N/A'}`);
    
    const mcpResponse = await mcpAdapter.handleMCPRequest(mcpRequest);
    
    // Add metadata to response
    mcpResponse._meta = {
      userId: userId,
      timestamp: new Date().toISOString(),
      version: '2.0',
      toolsCount: mcpResponse.tools?.length || 0
    };

    res.status(200).json(mcpResponse);
    
  } catch (error) {
    console.error('❌ MCP API Error:', error);
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
}

// Increase body size limit for MCP requests
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};