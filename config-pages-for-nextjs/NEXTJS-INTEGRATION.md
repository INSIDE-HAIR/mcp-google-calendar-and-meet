# 🚀 Next.ts 15 Integration Guide - Google Meet MCP Server v2.0

## Overview

This guide shows how to integrate the Google Meet MCP Server into your existing Next.ts 15 application with modern App Router, shadcn/ui components, Tailwind CSS v4, and MongoDB storage.

## 🎯 Architecture: Next.ts + MCP Server

```
┌─────────────────────────────────────────┐
│           Your Next.ts App              │
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

### Step 1: Install Dependencies

```bash
# In your Next.ts 15 project
npm install @modelcontextprotocol/sdk googleapis
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install tailwindcss-animate lucide-react
npm install -D tailwindcss@next @tailwindcss/typography
```

### Step 2: Configure Tailwind CSS v4 and shadcn/ui

#### `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other colors
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

#### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... other CSS variables */
  }
}
```

### Step 3: Add MCP Server API Routes (App Router)

#### `/app/api/mcp/[...mcp]/route.ts`

```javascript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NextJSMCPAdapter } from "@/lib/nextjs-mcp-adapter";
import { getUserGoogleCredentials, verifyApiKey } from "@/lib/mcp-utils";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  "Access-Control-Allow-Headers": "X-API-Key, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    let userId = null;

    // Check API key first (for Claude Desktop)
    const apiKey = request.headers.get("x-api-key");
    if (apiKey) {
      const apiKeyInfo = await verifyApiKey(apiKey);
      if (!apiKeyInfo) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 403, headers: corsHeaders }
        );
      }
      userId = apiKeyInfo.userId;
    } else {
      // Fallback to session auth
      const session = await auth();
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = session.user.id;
    }

    const body = await request.json();
    const userCredentials = await getUserGoogleCredentials(userId);

    if (!userCredentials) {
      return NextResponse.json(
        { error: "Google credentials not configured" },
        { status: 400, headers: corsHeaders }
      );
    }

    const mcpAdapter = new NextJSMCPAdapter(userCredentials);
    const mcpResponse = await mcpAdapter.handleMCPRequest(body);

    return NextResponse.json(mcpResponse, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
```

### Step 3: Google Credentials Setup UI

#### `/pages/dashboard/google-setup.jsx`

```jsx
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function GoogleSetup() {
  const { data: session } = useSession();
  const [credentials, setCredentials] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/google/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: JSON.parse(credentials) }),
      });

      if (response.ok) {
        alert("Google credentials configured successfully!");
        window.location.href = "/dashboard";
      } else {
        const error = await response.json();
        alert("Error: " + error.message);
      }
    } catch (error) {
      alert("Error parsing credentials JSON");
    }

    setLoading(false);
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Configure Google Meet Access</h1>

      <div className='bg-blue-50 p-4 rounded-lg mb-6'>
        <h3 className='font-semibold mb-2'>Steps to get credentials:</h3>
        <ol className='list-decimal list-inside space-y-1 text-sm'>
          <li>
            Go to{" "}
            <a
              href='https://console.cloud.google.com'
              className='text-blue-600'
            >
              Google Cloud Console
            </a>
          </li>
          <li>Create OAuth 2.0 Credentials (Desktop Application)</li>
          <li>Download the JSON file</li>
          <li>Paste the JSON content below</li>
        </ol>
      </div>

      <textarea
        value={credentials}
        onChange={(e) => setCredentials(e.target.value)}
        placeholder='Paste your Google OAuth credentials JSON here...'
        className='w-full h-40 p-3 border rounded-lg'
      />

      <button
        onClick={handleSetup}
        disabled={loading || !credentials}
        className='mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50'
      >
        {loading ? "Setting up..." : "Configure Google Access"}
      </button>
    </div>
  );
}
```

#### `/pages/api/google/setup.ts`

```javascript
import { getServerSession } from "next-auth";
import { encrypt } from "../../../lib/encryption";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { credentials } = req.body;

    // Validate credentials format
    if (!credentials.client_id || !credentials.client_secret) {
      return res.status(400).json({ error: "Invalid credentials format" });
    }

    // Encrypt credentials before storing
    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    // Store in MongoDB
    await db.collection("users").updateOne(
      { _id: session.user.id },
      {
        $set: {
          googleCredentials: encryptedCredentials,
          googleSetupAt: new Date(),
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Google setup error:", error);
    res.status(500).json({ error: "Setup failed" });
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
// /pages/api/generate-mcp-link.ts
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).end();

  // Generate unique API key for this user
  const apiKey = generateSecureToken();

  // Store API key in database
  await db
    .collection("users")
    .updateOne({ _id: session.user.id }, { $set: { mcpApiKey: apiKey } });

  // Return configuration for Claude Desktop
  const claudeConfig = {
    mcpServers: {
      "google-meet-enterprise": {
        command: "curl",
        args: [
          "-X",
          "POST",
          "-H",
          "Content-Type: application/json",
          "-H",
          `X-API-Key: ${apiKey}`,
          `${process.env.NEXTJS_URL}/api/mcp/`,
          "--data-binary",
          "@-",
        ],
      },
    },
  };

  res.json({
    config: claudeConfig,
    instructions: "Add this configuration to your Claude Desktop settings",
  });
}
```

## 🔐 Security Implementation

### 1. Encryption for Credentials

```javascript
// lib/encryption.ts
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key
const IV_LENGTH = 16;

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher("aes-256-cbc", ENCRYPTION_KEY);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedData) {
  const [ivHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipher("aes-256-cbc", ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

### 2. API Rate Limiting

```javascript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export async function checkRateLimit(identifier) {
  const { success, limit, reset, remaining } = await ratelimit.limit(
    identifier
  );
  return { success, limit, reset, remaining };
}
```

## 🚀 Deployment Options

### Option 1: Vercel (Easy)

```bash
# Deploy your Next.ts app with MCP integration
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
    const response = await fetch("/api/admin/generate-mcp-access", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });

    const { accessLink } = await response.json();

    // Copy link to clipboard or send via email
    navigator.clipboard.writeText(accessLink);
    alert("Access link copied! Share with employee.");
  };

  return (
    <div>
      <h1>MCP Access Management</h1>
      {employees.map((emp) => (
        <div key={emp._id} className='flex justify-between p-4 border'>
          <span>
            {emp.name} - {emp.email}
          </span>
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
- **Familiar**: Builds on your Next.ts knowledge
- **Scalable**: Can handle many employees

### 📊 Cost Estimate:

- **Infrastructure**: Same as current Next.ts app
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
