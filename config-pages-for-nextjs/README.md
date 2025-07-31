# 🚀 Google Meet MCP - Next.js Integration Files

Esta carpeta contiene TODOS los archivos necesarios para integrar Google Meet MCP Server en tu proyecto Next.js existente.

## 📂 Estructura de Archivos

```
config-pages-for-nextjs/
├── lib/                          # Librerías core
│   ├── google-meet-mcp/         # Tu código MCP original
│   ├── nextjs-mcp-adapter.js    # Adapter principal
│   ├── mcp-utils.js             # Utilidades MongoDB
│   ├── encryption.js            # Sistema encriptación
│   ├── api-keys.js              # Gestión API keys
│   └── mongodb.js               # Conexión MongoDB
├── pages/
│   ├── api/
│   │   ├── mcp/                 # Endpoints MCP
│   │   ├── google/              # Setup Google OAuth
│   │   └── admin/               # Admin endpoints
│   └── dashboard/               # UI Components
├── components/mcp/              # Componentes React
├── types/                       # TypeScript definitions
└── README.md                    # Esta guía
```

## 🔧 Instalación en tu Next.js

### Paso 1: Copiar archivos
```bash
# Desde la raíz de tu proyecto Next.js:
cp -r config-pages-for-nextjs/* ./
```

### Paso 2: Instalar dependencias
```bash
npm install @modelcontextprotocol/sdk googleapis
```

### Paso 3: Variables de entorno
```bash
# Agregar a .env.local:
ENCRYPTION_KEY="tu_clave_super_secreta_de_32_caracteres_minimo"
# O usará NEXTAUTH_SECRET si no está definida
```

### Paso 4: Adaptar imports
- Revisar imports de NextAuth en archivos API
- Ajustar schema MongoDB si es necesario

## 🎯 URLs Resultantes

Después de la instalación tendrás:

- **Setup empleados:** `/dashboard/google-meet-setup`
- **Admin dashboard:** `/dashboard/mcp-admin`
- **Test MCP:** `/dashboard/mcp-test`
- **API endpoint:** `/api/mcp` (para Claude Desktop)
- **Health check:** `/api/mcp/health`

## 📋 Checklist Post-Instalación

- [ ] Copiar todos los archivos
- [ ] Instalar dependencias
- [ ] Configurar variables de entorno
- [ ] Adaptar imports NextAuth
- [ ] Probar con usuario test
- [ ] Verificar endpoint `/api/mcp/health`
- [ ] Configurar primer empleado
- [ ] Probar con Claude Desktop

## 🆘 Soporte

Cada carpeta contiene su propio README.md con instrucciones específicas.

---

**¡Todo listo para migrar a tu Next.js! 🎉**