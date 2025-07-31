# 📱 pages/dashboard/ - UI Components

Interfaces de usuario para la gestión MCP.

## 📂 Archivos

### **google-meet-setup.jsx**
- **Qué es:** Interfaz de setup para empleados
- **Dónde va:** `pages/dashboard/google-meet-setup.jsx`
- **URL:** `/dashboard/google-meet-setup`
- **Descripción:** Wizard de 3 pasos para configurar credenciales Google + generar API key

### **mcp-admin.jsx**
- **Qué es:** Dashboard de administración
- **Dónde va:** `pages/dashboard/mcp-admin.jsx`
- **URL:** `/dashboard/mcp-admin`
- **Descripción:** Analytics, gestión de usuarios, API keys

### **mcp-test.jsx**
- **Qué es:** Página de testing MCP
- **Dónde va:** `pages/dashboard/mcp-test.jsx`
- **URL:** `/dashboard/mcp-test`
- **Descripción:** Probar MCP desde web, debugging

### **mcp-profile.jsx**
- **Qué es:** Perfil de empleado MCP
- **Dónde va:** `pages/dashboard/mcp-profile.jsx`
- **URL:** `/dashboard/mcp-profile`
- **Descripción:** Ver sus API keys, analytics personales, reconfigurar

## 🎨 Componentes Reutilizables

En `components/mcp/`:
- **MCPSetupWizard.jsx** - Wizard de setup reutilizable
- **ApiKeyManager.jsx** - Gestión de API keys
- **MCPAnalytics.jsx** - Gráficos de uso
- **CredentialsForm.jsx** - Formulario de credenciales

## 🔗 Navigation

Agregar a tu navigation principal:
```jsx
// En tu componente de navigation
{session?.user && (
  <>
    <Link href="/dashboard/google-meet-setup">
      Configure Google Meet MCP
    </Link>
    {session.user.role === 'admin' && (
      <Link href="/dashboard/mcp-admin">
        MCP Administration
      </Link>
    )}
    <Link href="/dashboard/mcp-profile">
      My MCP Settings
    </Link>
  </>
)}
```

## 🎯 User Experience Flow

1. **Empleado nuevo:** `/dashboard/google-meet-setup`
2. **Empleado configurado:** `/dashboard/mcp-profile`
3. **Admin:** `/dashboard/mcp-admin`
4. **Debugging:** `/dashboard/mcp-test`