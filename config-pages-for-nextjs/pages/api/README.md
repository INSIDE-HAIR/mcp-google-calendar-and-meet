# 🔌 pages/api/ - API Routes

Todos los endpoints para la integración MCP.

## 📂 Estructura

### **api/mcp/**
- **[...mcp].js** - Endpoint principal para Claude Desktop
- **generate-api-key.js** - Genera API keys para empleados
- **health.js** - Health check del servicio
- **revoke-api-key.js** - Revoca API keys

### **api/google/**
- **setup-credentials.js** - Almacena credenciales OAuth de empleados

### **api/admin/**
- **mcp-stats.js** - Analytics y estadísticas para admin
- **list-users.js** - Lista usuarios con MCP habilitado
- **manage-api-keys.js** - Gestión de API keys (admin)

## 🎯 URLs Resultantes

Después de copiar a tu Next.js:

```
POST /api/mcp              <- Endpoint para Claude Desktop
POST /api/mcp/generate-api-key <- Generar API key
GET  /api/mcp/health       <- Health check
POST /api/mcp/revoke-api-key   <- Revocar API key

POST /api/google/setup-credentials <- Store credenciales Google

GET  /api/admin/mcp-stats     <- Analytics (admin)
GET  /api/admin/list-users    <- Lista usuarios (admin)  
POST /api/admin/manage-api-keys <- Gestión API keys (admin)
```

## 🔐 Autenticación

- **MCP endpoints:** API Key en header `X-API-Key`
- **Setup endpoints:** NextAuth session
- **Admin endpoints:** Admin role en session

## ⚠️ Adaptaciones necesarias

En cada archivo, ajustar:
```javascript
import { authOptions } from '../auth/[...nextauth]';
// Cambiar por tu ruta NextAuth específica
```