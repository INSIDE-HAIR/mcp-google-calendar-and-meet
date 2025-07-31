# 📚 lib/ - Core Libraries

Esta carpeta contiene todas las librerías y utilidades necesarias para la integración MCP.

## 📂 Archivos

### **google-meet-mcp/** 
- **Qué es:** Tu código MCP original (src/)
- **Dónde va:** `lib/google-meet-mcp/` en tu Next.js
- **Descripción:** El core de tu MCP Server (GoogleMeetAPI.js, index.js, setup.js)

### **nextjs-mcp-adapter.js**
- **Qué es:** Adapter que convierte tu MCP en API HTTP
- **Dónde va:** `lib/nextjs-mcp-adapter.js`
- **Descripción:** Toma tu MCP y lo hace compatible con Next.js API routes

### **mcp-utils.js**
- **Qué es:** Utilidades para MongoDB y gestión de credenciales
- **Dónde va:** `lib/mcp-utils.js`
- **Descripción:** CRUD de credenciales, logs, analytics

### **encryption.js**
- **Qué es:** Sistema de encriptación AES-256
- **Dónde va:** `lib/encryption.js`
- **Descripción:** Encripta/desencripta credenciales Google

### **api-keys.js**
- **Qué es:** Sistema de API keys para empleados
- **Dónde va:** `lib/api-keys.js`
- **Descripción:** CRUD de API keys, verificación, stats

### **mongodb.js**
- **Qué es:** Helper de conexión MongoDB
- **Dónde va:** `lib/mongodb.js`
- **Descripción:** Conexión reutilizable a MongoDB (crear si no tienes)

## 🔧 Imports en tu proyecto

```javascript
// En tus API routes:
import { NextJSMCPAdapter } from '../../../lib/nextjs-mcp-adapter';
import { getUserGoogleCredentials } from '../../../lib/mcp-utils';
import { verifyApiKey } from '../../../lib/api-keys';
import { encrypt, decrypt } from '../../../lib/encryption';
import { connectToDatabase } from '../../../lib/mongodb';
```

## ⚠️ Adaptaciones necesarias

Si tu proyecto tiene estructura diferente:
- `lib/mongodb.js` → `lib/database.js` (ajustar imports)
- Diferentes paths de utilidades existentes