# 🚀 Installation Guide - Google Meet MCP Integration (Next.ts 15)

## 📋 Quick Start

### 1. Copy Files to Your Next.ts 15 Project

```bash
# From your Next.ts 15 project root:
cp -r config-pages-for-nextjs/app ./
cp -r config-pages-for-nextjs/components ./
cp -r config-pages-for-nextjs/lib ./
cp -r config-pages-for-nextjs/types ./
cp config-pages-for-nextjs/tailwind.config.ts ./
```

### 2. Install Dependencies

```bash
# Core MCP and Google APIs
npm install @modelcontextprotocol/sdk googleapis

# shadcn/ui and Tailwind CSS v4 dependencies
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install tailwindcss-animate lucide-react
npm install -D tailwindcss@next @tailwindcss/typography

# Authentication (if not already installed)
npm install next-auth@beta
```

### 3. Environment Variables

```bash
# Copy example and customize
cp .env.example .env.local

# Edit .env.local with your values:
MONGODB_URI="your-mongodb-connection-string"
NEXTAUTH_SECRET="your-existing-nextauth-secret"
ENCRYPTION_KEY="your-32-character-encryption-key" # Optional
```

### 4. Adapt NextAuth Imports

Find and replace in API files:

```javascript
// Change this:
import { authOptions } from "../auth/[...nextauth]";

// To your actual NextAuth path:
import { authOptions } from "../auth/[...nextauth]"; // or wherever yours is
```

### 5. Update MongoDB Schema

Add these fields to your users collection:

```javascript
{
  // ... your existing user fields
  googleCredentials: String,           // Encrypted JSON
  googleCredentialsUpdatedAt: Date,
  mcpEnabled: Boolean,
  googleTokens: {
    access_token: String,
    refresh_token: String,
    expires_at: Date
  }
}
```

Create new collections:

- `api_keys` - For API key management
- `mcp_requests` - For usage analytics (optional)

### 6. Test Installation

```bash
npm run dev

# Visit these URLs to test:
# http://localhost:3000/api/mcp/health
# http://localhost:3000/dashboard/google-meet-setup
```

## 🔧 Configuration Options

### Admin Access

To enable admin features, modify session check in admin routes:

```javascript
// In pages/api/admin/*.ts
if (!session.user.role === "admin" && !session.user.isAdmin) {
  return res.status(403).json({ error: "Admin access required" });
}
```

### Custom Styling

The components use Tailwind CSS classes. Adapt to your design system:

```javascript
// Example: Change button styles
className = "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700";
// To your button classes:
className = "btn btn-primary";
```

## 📁 File Structure After Installation

```
your-nextjs-project/
├── lib/
│   ├── google-meet-mcp/         # Your original MCP code
│   ├── nextjs-mcp-adapter.ts    # Core adapter
│   ├── mcp-utils.ts             # Database utilities
│   ├── encryption.ts            # Security
│   ├── api-keys.ts              # API key management
│   └── mongodb.ts               # Database connection
├── pages/
│   ├── api/
│   │   ├── mcp/
│   │   │   ├── [...mcp].ts      # Main MCP endpoint
│   │   │   ├── generate-api-key.ts
│   │   │   ├── health.ts
│   │   │   └── revoke-api-key.ts
│   │   ├── google/
│   │   │   └── setup-credentials.ts
│   │   └── admin/
│   │       └── mcp-stats.ts
│   └── dashboard/
│       ├── google-meet-setup.jsx    # Main setup UI
│       ├── mcp-admin.jsx            # Admin dashboard
│       ├── mcp-test.jsx             # Testing interface
│       └── mcp-profile.jsx          # User profile
├── components/
│   └── mcp/
│       └── ApiKeyManager.jsx        # Reusable components
└── types/
    └── mcp.d.ts                     # TypeScript definitions
```

## 🎯 URLs After Installation

- **Employee setup:** `/dashboard/google-meet-setup`
- **Admin dashboard:** `/dashboard/mcp-admin`
- **User profile:** `/dashboard/mcp-profile`
- **Testing:** `/dashboard/mcp-test`
- **MCP endpoint:** `/api/mcp` (for Claude Desktop)
- **Health check:** `/api/mcp/health`

## 🔐 Security Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled in production
- [ ] MongoDB connection secured
- [ ] Admin access properly restricted
- [ ] API rate limiting in place (built-in)
- [ ] Error messages don't expose secrets

## 🆘 Troubleshooting

### Common Issues:

**"MongoDB connection failed"**

- Check MONGODB_URI in .env.local
- Verify MongoDB is running
- Check firewall/network access

**"NextAuth import error"**

- Update import paths in API files
- Verify your NextAuth setup works

**"Encryption key missing"**

- Set ENCRYPTION_KEY in .env.local
- Or ensure NEXTAUTH_SECRET is set

**"API key not working"**

- Check API key generation worked
- Verify user has Google credentials configured
- Test with /api/mcp/health first

## 📞 Support

After installation:

1. Test health endpoint: `/api/mcp/health`
2. Configure first user via setup UI
3. Test with Claude Desktop
4. Check admin dashboard for analytics

---

**✅ Installation complete! Your Next.ts now has Google Meet MCP integration.**
