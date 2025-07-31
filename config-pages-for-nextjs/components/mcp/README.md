# 🧩 components/mcp/ - Reusable Components

Componentes React reutilizables para la interfaz MCP.

## 📂 Archivos

### **MCPSetupWizard.jsx**
- **Qué es:** Wizard de setup reutilizable
- **Dónde va:** `components/mcp/MCPSetupWizard.jsx`
- **Uso:** Componente para configurar credenciales Google paso a paso

### **ApiKeyManager.jsx**
- **Qué es:** Gestión de API keys
- **Dónde va:** `components/mcp/ApiKeyManager.jsx`
- **Uso:** Lista, copia, revoca API keys

### **MCPAnalytics.jsx**
- **Qué es:** Gráficos de uso y analytics
- **Dónde va:** `components/mcp/MCPAnalytics.jsx`
- **Uso:** Mostrar estadísticas de uso MCP

### **CredentialsForm.jsx**
- **Qué es:** Formulario de credenciales Google
- **Dónde va:** `components/mcp/CredentialsForm.jsx`
- **Uso:** Input y validación de JSON credentials

## 🎨 Uso en páginas

```jsx
// En tus páginas dashboard
import { MCPSetupWizard } from '../../components/mcp/MCPSetupWizard';
import { ApiKeyManager } from '../../components/mcp/ApiKeyManager';
import { MCPAnalytics } from '../../components/mcp/MCPAnalytics';

export default function Dashboard() {
  return (
    <div>
      <MCPSetupWizard onComplete={handleSetupComplete} />
      <ApiKeyManager userId={session.user.id} />
      <MCPAnalytics timeRange="30d" />
    </div>
  );
}
```

## 🔧 Props y Configuration

Los componentes están diseñados para ser flexibles y reutilizables entre diferentes páginas del dashboard.