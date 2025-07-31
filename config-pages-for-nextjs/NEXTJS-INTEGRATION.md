# 🚀 Next.js Integration Guide - Google Meet MCP Server v2.0

## Overview

This guide shows how to integrate the Google Meet MCP Server into your existing Next.js application with OAuth authentication and MongoDB storage.

## 🎯 Architecture: Next.js + MCP Server

```
┌─────────────────────────────────────────┐
│           Your Next.js App              │
│  ✅ Existing OAuth (Google/Auth0/etc)   │
│  ✅ Existing MongoDB connection         │
│  ✅ User authentication & sessions      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         MCP Server Integration          │
│  🔗 API Routes: /api/mcp/*             │
│  🔐 Session-based authentication        │
│  📊 MongoDB credential storage          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Google Meet API                 │
│  📅 Calendar API v3                    │
│  🎥 Meet API v2                        │
└─────────────────────────────────────────┘
```

## 🔧 Implementation Steps

### Step 1: Install MCP Dependencies
```bash
# In your Next.js project
npm install @modelcontextprotocol/sdk googleapis
```

### Step 2: Add MCP Server to Next.js API Routes

#### `/pages/api/mcp/[...mcp].js` (Pages Router)
```javascript
import { GoogleMeetAPI } from '../../../lib/google-meet-api';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  try {
    // Authenticate user with your existing OAuth
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's Google credentials from MongoDB
    const userCredentials = await getUserGoogleCredentials(session.user.id);
    
    if (!userCredentials) {
      return res.status(400).json({ 
        error: 'Google credentials not configured',
        setupUrl: '/dashboard/google-setup'
      });
    }

    // Initialize MCP Server with user's credentials
    const meetAPI = new GoogleMeetAPI(userCredentials);
    
    // Handle MCP protocol request
    const mcpRequest = req.body;
    const mcpResponse = await meetAPI.handleMCPRequest(mcpRequest);
    
    res.json(mcpResponse);
    
  } catch (error) {
    console.error('MCP API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get user's Google credentials from MongoDB
async function getUserGoogleCredentials(userId) {
  const user = await db.collection('users').findOne({ _id: userId });
  
  if (!user?.googleCredentials) return null;
  
  return {
    client_id: user.googleCredentials.client_id,
    client_secret: user.googleCredentials.client_secret,
    refresh_token: user.googleCredentials.refresh_token,
    access_token: user.googleCredentials.access_token,
    expires_at: user.googleCredentials.expires_at
  };
}
```

#### `/app/api/mcp/[...mcp]/route.js` (App Router)
```javascript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GoogleMeetAPI } from '@/lib/google-meet-api';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mcpRequest = await request.json();
    const userCredentials = await getUserGoogleCredentials(session.user.id);
    
    const meetAPI = new GoogleMeetAPI(userCredentials);
    const mcpResponse = await meetAPI.handleMCPRequest(mcpRequest);
    
    return NextResponse.json(mcpResponse);
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 3: Google Credentials Setup UI

#### `/pages/dashboard/google-setup.jsx`
```jsx
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function GoogleSetup() {
  const { data: session } = useSession();
  const [credentials, setCredentials] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/google/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: JSON.parse(credentials) })
      });
      
      if (response.ok) {
        alert('Google credentials configured successfully!');
        window.location.href = '/dashboard';
      } else {
        const error = await response.json();
        alert('Error: ' + error.message);
      }
    } catch (error) {
      alert('Error parsing credentials JSON');
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configure Google Meet Access</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Steps to get credentials:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Go to <a href="https://console.cloud.google.com" className="text-blue-600">Google Cloud Console</a></li>
          <li>Create OAuth 2.0 Credentials (Desktop Application)</li>
          <li>Download the JSON file</li>
          <li>Paste the JSON content below</li>
        </ol>
      </div>

      <textarea
        value={credentials}
        onChange={(e) => setCredentials(e.target.value)}
        placeholder="Paste your Google OAuth credentials JSON here..."
        className="w-full h-40 p-3 border rounded-lg"
      />
      
      <button
        onClick={handleSetup}
        disabled={loading || !credentials}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Setting up...' : 'Configure Google Access'}
      </button>
    </div>
  );
}
```

#### `/pages/api/google/setup.js`
```javascript
import { getServerSession } from 'next-auth';
import { encrypt } from '../../../lib/encryption';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const { credentials } = req.body;
    
    // Validate credentials format
    if (!credentials.client_id || !credentials.client_secret) {
      return res.status(400).json({ error: 'Invalid credentials format' });
    }

    // Encrypt credentials before storing
    const encryptedCredentials = encrypt(JSON.stringify(credentials));
    
    // Store in MongoDB
    await db.collection('users').updateOne(
      { _id: session.user.id },
      { 
        $set: { 
          googleCredentials: encryptedCredentials,
          googleSetupAt: new Date()
        }
      }
    );

    res.json({ success: true });
    
  } catch (error) {
    console.error('Google setup error:', error);
    res.status(500).json({ error: 'Setup failed' });
  }
}
```

### Step 4: MongoDB Schema

```javascript
// User collection schema
{
  _id: ObjectId,
  email: String,
  name: String,
  // ... your existing fields
  
  // Google Meet integration
  googleCredentials: {
    type: String, // Encrypted JSON
    required: false
  },
  googleTokens: {
    access_token: String,
    refresh_token: String,
    expires_at: Date
  },
  googleSetupAt: Date,
  mcpEnabled: {
    type: Boolean,
    default: false
  }
}
```

### Step 5: Client Configuration for Claude Desktop

#### Generate unique access link for each employee:
```javascript
// /pages/api/generate-mcp-link.js
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).end();

  // Generate unique API key for this user
  const apiKey = generateSecureToken();
  
  // Store API key in database
  await db.collection('users').updateOne(
    { _id: session.user.id },
    { $set: { mcpApiKey: apiKey } }
  );

  // Return configuration for Claude Desktop
  const claudeConfig = {
    mcpServers: {
      "google-meet-enterprise": {
        command: "curl",
        args: [
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-H", `X-API-Key: ${apiKey}`,
          `${process.env.NEXTJS_URL}/api/mcp/`,
          "--data-binary", "@-"
        ]
      }
    }
  };

  res.json({
    config: claudeConfig,
    instructions: "Add this configuration to your Claude Desktop settings"
  });
}
```

## 🔐 Security Implementation

### 1. Encryption for Credentials
```javascript
// lib/encryption.js
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key
const IV_LENGTH = 16;

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedData) {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 2. API Rate Limiting
```javascript
// lib/rate-limit.js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function checkRateLimit(identifier) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  return { success, limit, reset, remaining };
}
```

## 🚀 Deployment Options

### Option 1: Vercel (Easy)
```bash
# Deploy your Next.js app with MCP integration
vercel --prod

# Environment variables in Vercel dashboard:
NEXTAUTH_SECRET=your-secret
MONGODB_URI=your-mongodb-connection
ENCRYPTION_KEY=your-32-byte-key
```

### Option 2: Docker + Your VPS
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Option 3: Railway/Render/DigitalOcean App Platform
```yaml
# render.yaml
services:
  - type: web
    name: google-meet-mcp
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: NEXTAUTH_SECRET
        generateValue: true
```

## 📋 Employee Access Setup

### Step 1: Admin Dashboard
```jsx
// /pages/admin/mcp-access.jsx
export default function MCPAccess() {
  const [employees, setEmployees] = useState([]);

  const generateAccessLink = async (userId) => {
    const response = await fetch('/api/admin/generate-mcp-access', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    
    const { accessLink } = await response.json();
    
    // Copy link to clipboard or send via email
    navigator.clipboard.writeText(accessLink);
    alert('Access link copied! Share with employee.');
  };

  return (
    <div>
      <h1>MCP Access Management</h1>
      {employees.map(emp => (
        <div key={emp._id} className="flex justify-between p-4 border">
          <span>{emp.name} - {emp.email}</span>
          <button onClick={() => generateAccessLink(emp._id)}>
            Generate MCP Access
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Step 2: Employee receives:
```json
{
  "message": "Google Meet MCP Access Configured",
  "setupUrl": "https://your-app.com/mcp-setup?token=abc123",
  "claudeConfig": {
    "mcpServers": {
      "google-meet-company": {
        "command": "curl",
        "args": ["...", "your-api-endpoint", "..."]
      }
    }
  }
}
```

## 💡 Benefits of This Approach

### ✅ Advantages:
- **Integrated**: Uses your existing auth system
- **Secure**: Credentials encrypted in your MongoDB
- **Controlled**: You manage all access
- **Familiar**: Builds on your Next.js knowledge
- **Scalable**: Can handle many employees

### 📊 Cost Estimate:
- **Infrastructure**: Same as current Next.js app
- **Additional**: ~$0 (just more API routes)
- **MongoDB**: Minimal extra storage
- **Bandwidth**: ~100KB per MCP request

## 🔧 Implementation Timeline:
1. **Day 1**: Add API routes and basic MCP handling
2. **Day 2**: Create Google credentials setup UI
3. **Day 3**: Add encryption and security
4. **Day 4**: Test with Claude Desktop
5. **Day 5**: Deploy and test with first employee

Would you like me to help you implement any specific part of this integration?