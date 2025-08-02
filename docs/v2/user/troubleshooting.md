# 🔧 Troubleshooting Guide - Google Meet MCP Server v3.0
## Guía Completa de Resolución de Problemas

Esta guía te ayudará a diagnosticar y resolver los problemas más comunes al usar el Google Meet MCP Server con Smithery y Claude Desktop.

---

## 🚨 **Problemas Críticos**

### **1. Server Won't Start en Smithery**

#### **Síntomas**:
```
❌ Estado en Smithery: "Failed to Start"
❌ Error: "Authentication failed"
❌ Error: "Module not found"
❌ Error: "Invalid configuration"
```

#### **Diagnóstico Paso a Paso**:

**A. Verificar Configuración de Path**:
```bash
# Verificar que el archivo existe
ls -la "/ruta/completa/a/tus/credenciales.json"

# Debe mostrar algo como:
# -rw------- 1 usuario grupo 2.3K fecha google-meet-credentials.json
```

**B. Verificar Contenido del Archivo**:
```bash
# Verificar que es JSON válido
python3 -m json.tool "/ruta/a/credenciales.json" > /dev/null

# Si es válido, no habrá output
# Si es inválido, mostrará error de JSON
```

**C. Verificar Permisos**:
```bash
# Permisos correctos (solo usuario puede leer/escribir)
chmod 600 "/ruta/a/credenciales.json"

# Verificar permisos
stat -c "%a %n" "/ruta/a/credenciales.json"
# Debe mostrar: 600 /ruta/a/credenciales.json
```

#### **Soluciones Comunes**:

1. **Path Incorrecto**:
   ```yaml
   # ❌ INCORRECTO - path relativo
   googleOAuthCredentials: "credentials.json"
   
   # ✅ CORRECTO - path absoluto
   googleOAuthCredentials: "/Users/username/Documents/MCP-Credentials/google-meet-credentials.json"
   ```

2. **Archivo JSON Corrupto**:
   ```bash
   # Re-descargar desde Google Cloud Console
   # Google Cloud Console → APIs y servicios → Credenciales
   # → [Tu cliente OAuth] → Descargar JSON
   ```

3. **Permisos Incorrectos**:
   ```bash
   # Establecer permisos correctos
   chmod 600 "/ruta/a/credenciales.json"
   ```

### **2. Authentication Failed / OAuth Issues**

#### **Síntomas**:
```
❌ "The OAuth client was not found"
❌ "Access blocked: This app's request is invalid"
❌ "Invalid client: no registered origin"
❌ "Token has been expired or revoked"
```

#### **Soluciones**:

**A. Verificar Cliente OAuth**:
```bash
# En Google Cloud Console:
# 1. APIs y servicios → Credenciales
# 2. Verificar que el cliente OAuth existe
# 3. Tipo debe ser "Aplicación de escritorio"
```

**B. Configurar OAuth Consent Screen**:
```yaml
# En Google Cloud Console → OAuth consent screen
Estado: "In production" (no "Testing")
Tipo de usuario: "Interno" (si Google Workspace)
Scopes necesarios:
  - https://www.googleapis.com/auth/calendar
  - https://www.googleapis.com/auth/meetings.space.created
  - https://www.googleapis.com/auth/meetings.space.readonly
  - https://www.googleapis.com/auth/meetings.space.settings
```

**C. Regenerar Credenciales**:
```bash
# Si las credenciales están corruptas:
# 1. Google Cloud Console → Credenciales
# 2. Eliminar cliente OAuth actual
# 3. Crear nuevo cliente OAuth (Aplicación de escritorio)
# 4. Descargar nuevas credenciales
# 5. Actualizar configuración en Smithery
```

### **3. APIs Not Enabled**

#### **Síntomas**:
```
❌ "Calendar API has not been used in project"
❌ "Meet API is not enabled"
❌ "Access Not Configured"
```

#### **Solución**:
```bash
# En Google Cloud Console:
# 1. APIs y servicios → Biblioteca
# 2. Buscar "Google Calendar API" → HABILITAR
# 3. Buscar "Google Meet API" → HABILITAR
# 4. Esperar 5-10 minutos para propagación
# 5. Reintentar en Smithery
```

---

## ⚠️ **Problemas de Configuración**

### **4. Claude Desktop Not Connecting**

#### **Síntomas**:
```
❌ MCP Server no aparece en Claude Desktop
❌ "Connection failed" en Claude Desktop
❌ Tools no están disponibles en Claude
```

#### **Diagnóstico**:

**A. Verificar Estado en Smithery**:
```yaml
# Estado debe ser "Running" y "Healthy"
Smithery Dashboard → [Tu servidor] → Verificar status
```

**B. Verificar Configuración Claude Desktop**:

**macOS**:
```bash
# Abrir archivo de configuración
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**:
```bash
# Navegar a:
%APPDATA%\Claude\claude_desktop_config.json
```

**Configuración esperada**:
```json
{
  "mcpServers": {
    "google-meet-mcp-server": {
      "command": "smithery",
      "args": ["run", "google-meet-mcp-server"],
      "env": {
        "SMITHERY_CONFIG_ID": "tu-config-id-aqui"
      }
    }
  }
}
```

#### **Soluciones**:

1. **Configuración Manual - Direct Token Authentication (Recomendado)**:
   ```json
   {
     "mcpServers": {
       "google-meet": {
         "command": "npx",
         "args": ["tsx", "ruta/al/proyecto/src/index.ts"],
         "env": {
           "CLIENT_ID": "your-client-id.apps.googleusercontent.com",
           "CLIENT_SECRET": "GOCSPX-your-client-secret",
           "REFRESH_TOKEN": "1//your-refresh-token"
         }
       }
     }
   }
   ```

2. **Configuración Manual - File-based Authentication (Legacy)**:
   ```json
   {
     "mcpServers": {
       "google-meet": {
         "command": "npx",
         "args": ["tsx", "ruta/al/proyecto/src/index.ts"],
         "env": {
           "G_OAUTH_CREDENTIALS": "/ruta/absoluta/a/credenciales.json"
         }
       }
     }
   }
   ```

3. **Debugging con Monitoreo v3.0**:
   ```bash
   # Habilitar modo debug con monitoreo
   export LOG_LEVEL=debug
   export ENABLE_HEALTH_CHECK=true
   export HEALTH_CHECK_PORT=9090
   
   # Iniciar con debugging
   npx tsx src/index.ts
   
   # En otra terminal, verificar health check
   curl http://localhost:9090/health
   curl http://localhost:9090/metrics
   ```

4. **Reiniciar Claude Desktop**:
   ```bash
   # Cerrar completamente Claude Desktop
   # Esperar 10 segundos
   # Abrir Claude Desktop nuevamente
   ```

### **5. Tools Not Available / Limited Functionality**

#### **Síntomas**:
```
❌ Solo algunas herramientas disponibles (menos de 23)
❌ "Permission denied" para ciertas operaciones
❌ "Quota exceeded" errors
❌ Monitoreo no muestra estadísticas correctas
```

#### **Soluciones**:

**A. Verificar Scopes OAuth**:
```yaml
# Scopes requeridos en OAuth consent screen:
Required Scopes:
  ✅ https://www.googleapis.com/auth/calendar
  ✅ https://www.googleapis.com/auth/meetings.space.created
  ✅ https://www.googleapis.com/auth/meetings.space.readonly
  ✅ https://www.googleapis.com/auth/meetings.space.settings

# Si faltan scopes:
# 1. Agregar en OAuth consent screen
# 2. Re-autorizar la aplicación
# 3. Borrar token.json si existe
# 4. Reiniciar servidor en Smithery
```

**B. Verificar Quotas de API**:
```bash
# En Google Cloud Console:
# APIs y servicios → Quotas
# Verificar que no estés cerca de los límites de:
# - Calendar API requests per day
# - Meet API requests per day
```

**C. Verificar Permisos Google Workspace**:
```yaml
# Para funciones avanzadas necesitas:
Google Workspace: Business Standard+ (no Personal/Basic)
Meet License: Requerido para recording/transcription
Admin Permissions: Para algunas funciones de espacio
```

---

## 🐛 **Problemas de Funcionamiento**

### **6. Slow Response Times**

#### **Síntomas**:
```
⚠️ Claude tarda >10 segundos en responder
⚠️ "Timeout" errors ocasionales
⚠️ Operaciones que se cuelgan
```

#### **Soluciones**:

**A. Verificar Conectividad**:
```bash
# Test conectividad a APIs de Google
curl -I https://www.googleapis.com/calendar/v3/users/me/calendarList
curl -I https://meet.googleapis.com/v2/spaces

# Debe retornar status 401 (no autorizado) - significa que la API responde
# Si retorna timeout o error de conexión, hay problema de red
```

**B. Optimizar Configuración**:
```yaml
# En Smithery, configurar:
customLogLevel: "warn"  # Reducir logging
enableDebugLogging: false

# Verificar que no hay procesos compitiendo por recursos
```

**C. Verificar Recursos del Sistema**:
```bash
# Verificar memoria y CPU disponible
htop  # Linux/macOS
# Task Manager en Windows

# El servidor MCP debería usar <100MB RAM
```

### **7. Intermittent Failures**

#### **Síntomas**:
```
⚠️ A veces funciona, a veces no
⚠️ Errores random de "Authentication failed"
⚠️ Herramientas aparecen y desaparecen
```

#### **Soluciones**:

**A. Verificar Token Refresh**:
```bash
# El token se refresca automáticamente
# Si hay problemas, borrar token y re-autorizar:

# Encontrar ubicación del token
# Si usas G_OAUTH_CREDENTIALS="/path/credentials.json"
# El token se guarda en "/path/credentials.json.token.json"

# Borrar token
rm "/path/credentials.json.token.json"

# Reiniciar servidor en Smithery
# Re-autorizar cuando se solicite
```

**B. Verificar Logs en Smithery**:
```yaml
# En Smithery Dashboard:
# 1. Ir a tu servidor
# 2. Ver "Logs" tab
# 3. Buscar patrones de error
# 4. Verificar si hay errores de rate limiting
```

### **8. Calendar/Meet Function Specific Issues**

#### **Crear Eventos con Meet Conference**:
```yaml
Problema: "Meet conference not added to event"
Solución:
  1. Verificar que tienes Google Workspace (no Gmail personal)
  2. Verificar scopes de Meet API en OAuth
  3. Intentar crear evento sin Meet primero, luego agregar Meet
```

#### **Recording/Transcription Not Working**:
```yaml
Problema: "Recording not available" o "Transcript not found"
Solución:
  1. Verificar Google Workspace Business+
  2. Verificar licencia Gemini para smart notes
  3. Recording debe activarse MANUALMENTE durante reunión
  4. Esperar 24-48h después de reunión para transcripts
```

#### **Permission Denied on Meet Spaces**:
```yaml
Problema: "Insufficient permissions for Meet spaces"
Solución:
  1. Verificar scopes: meetings.space.created, .readonly, .settings
  2. Verificar que el usuario es organizador de la reunión
  3. Algunos espacios requieren permisos de admin workspace
```

---

## 🔍 **Herramientas de Diagnóstico**

### **A. Scripts de Verificación**

#### **1. Test de Conectividad Completo**:
```bash
#!/bin/bash
# mcp-connectivity-test.sh

echo "🔍 MCP Server Connectivity Test"
echo "================================"

# Test 1: Verificar archivo de credenciales
CREDS_PATH="$1"
if [[ -z "$CREDS_PATH" ]]; then
    echo "Usage: $0 /path/to/credentials.json"
    exit 1
fi

echo "1. Testing credentials file..."
if [[ -f "$CREDS_PATH" ]]; then
    echo "  ✅ Credentials file exists"
    
    # Verificar permisos
    perms=$(stat -c "%a" "$CREDS_PATH" 2>/dev/null || stat -f "%A" "$CREDS_PATH")
    if [[ "$perms" == "600" ]]; then
        echo "  ✅ Correct permissions (600)"
    else
        echo "  ❌ Incorrect permissions ($perms) - should be 600"
    fi
    
    # Verificar JSON válido
    if python3 -m json.tool "$CREDS_PATH" > /dev/null 2>&1; then
        echo "  ✅ Valid JSON format"
    else
        echo "  ❌ Invalid JSON format"
    fi
else
    echo "  ❌ Credentials file not found"
    exit 1
fi

# Test 2: Conectividad a Google APIs
echo "2. Testing Google API connectivity..."
if curl -s -I https://www.googleapis.com/calendar/v3/users/me/calendarList | grep -q "HTTP.*401"; then
    echo "  ✅ Calendar API reachable"
else
    echo "  ❌ Calendar API not reachable"
fi

if curl -s -I https://meet.googleapis.com/v2/spaces | grep -q "HTTP.*401"; then
    echo "  ✅ Meet API reachable"
else
    echo "  ❌ Meet API not reachable"
fi

# Test 3: Verificar dependencias Node.js
echo "3. Testing Node.js dependencies..."
if command -v node &> /dev/null; then
    echo "  ✅ Node.js available: $(node --version)"
else
    echo "  ❌ Node.js not found"
fi

if command -v npx &> /dev/null; then
    echo "  ✅ npx available"
else
    echo "  ❌ npx not found"
fi

echo "4. Testing MCP server startup..."
# Test básico de startup (timeout después de 10 segundos)
timeout 10s bash -c "cd $(dirname $0)/.. && G_OAUTH_CREDENTIALS='$CREDS_PATH' npx tsx src/index.ts" &
sleep 5
if ps aux | grep -q "[t]sx src/index.ts"; then
    echo "  ✅ MCP server starts successfully"
    killall tsx 2>/dev/null
else
    echo "  ❌ MCP server failed to start"
fi

echo ""
echo "🎯 Diagnosis complete. Check any ❌ items above."
```

#### **2. Verificación de Configuración Claude Desktop**:
```bash
#!/bin/bash
# claude-config-check.sh

echo "🔍 Claude Desktop Configuration Check"
echo "===================================="

# Detectar OS y ubicación del config
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
else
    CONFIG_PATH="$HOME/.config/claude/claude_desktop_config.json"
fi

echo "Config file location: $CONFIG_PATH"

if [[ -f "$CONFIG_PATH" ]]; then
    echo "  ✅ Config file exists"
    
    # Verificar JSON válido
    if python3 -m json.tool "$CONFIG_PATH" > /dev/null 2>&1; then
        echo "  ✅ Valid JSON format"
        
        # Verificar estructura MCP
        if grep -q "mcpServers" "$CONFIG_PATH"; then
            echo "  ✅ MCP servers section found"
            
            # Mostrar configuración actual
            echo ""
            echo "Current MCP configuration:"
            python3 -m json.tool "$CONFIG_PATH" | grep -A 20 "mcpServers"
        else
            echo "  ❌ No mcpServers section found"
        fi
    else
        echo "  ❌ Invalid JSON format"
    fi
else
    echo "  ❌ Config file not found"
    echo ""
    echo "Create file with:"
    echo "{"
    echo '  "mcpServers": {'
    echo '    "google-meet": {'
    echo '      "command": "npx",'
    echo '      "args": ["tsx", "/path/to/google-meet-mcp-server/src/index.ts"],'
    echo '      "env": {'
    echo '        "G_OAUTH_CREDENTIALS": "/path/to/credentials.json"'
    echo '      }'
    echo '    }'
    echo '  }'
    echo "}"
fi
```

### **B. Logs y Debugging**

#### **1. Habilitar Debug Logging**:
```yaml
# En Smithery configuración:
enableDebugLogging: true
customLogLevel: "debug"

# Esto generará logs detallados en el dashboard de Smithery
```

#### **2. Logs de Google Cloud**:
```bash
# Usar gcloud CLI para ver audit logs
gcloud logging read "resource.type=project AND protoPayload.authenticationInfo.principalEmail=tu-email@domain.com" --limit=50 --format="table(timestamp,protoPayload.methodName,protoPayload.status.code)"
```

#### **3. Debugging Manual con v3.0 Monitoring**:
```bash
# Test manual del servidor MCP con monitoreo habilitado
cd /path/to/google-meet-mcp-server

# Método 1: Direct Token Authentication (Recomendado)
export CLIENT_ID="your-client-id.apps.googleusercontent.com"
export CLIENT_SECRET="GOCSPX-your-client-secret"
export REFRESH_TOKEN="1//your-refresh-token"
export LOG_LEVEL=debug
export ENABLE_HEALTH_CHECK=true
export HEALTH_CHECK_PORT=9090

npx tsx src/index.ts

# Método 2: File-based Authentication (Legacy)
G_OAUTH_CREDENTIALS="/path/to/credentials.json" LOG_LEVEL=debug ENABLE_HEALTH_CHECK=true npx tsx src/index.ts

# Debería iniciar sin errores y mostrar:
# "Google Meet MCP Server v3.0 starting..."
# "✅ Direct token authentication successful" (o file-based)
# "✅ 23 tools registered successfully"
# "🔍 Health check endpoint available at http://localhost:9090/health"
# "📊 Metrics endpoint available at http://localhost:9090/metrics"
# "Server initialized successfully"
```

#### **4. Endpoints de Monitoreo v3.0**:
```bash
# Health Check - Verifica estado general del servidor
curl http://localhost:9090/health
# Respuesta esperada: {"status":"healthy","timestamp":"...","oauth":"connected","apis":"available"}

# Metrics - Estadísticas de uso en formato Prometheus
curl http://localhost:9090/metrics
# Muestra métricas como: tool_calls_total, api_calls_total, response_time_seconds

# API Monitor - Estado en tiempo real de las APIs
curl http://localhost:9090/api-status
# Muestra conectividad con Calendar API v3 y Meet API v2

# System Info - Información del sistema
curl http://localhost:9090/system
# Muestra memoria, CPU, uptime del servidor

# Detailed Health - Check completo con diagnósticos
curl http://localhost:9090/health/detailed
# Incluye validación de tokens, conectividad APIs, recursos sistema

# Version Info - Información de versión y características
curl http://localhost:9090/version
# Muestra versión del servidor, herramientas disponibles, características

# Ready Check - Estado de preparación para requests
curl http://localhost:9090/ready
# Verifica si el servidor está listo para procesar requests MCP
```

#### **5. Modos de Debugging**:
```bash
# Modo DEBUG - Logging detallado de todas las operaciones
export LOG_LEVEL=debug

# Modo INFO - Logging normal de operaciones importantes (default)
export LOG_LEVEL=info

# Modo WARN - Solo warnings y errores
export LOG_LEVEL=warn

# Modo ERROR - Solo errores críticos
export LOG_LEVEL=error

# Habilitar Health Check Endpoint
export ENABLE_HEALTH_CHECK=true
export HEALTH_CHECK_PORT=9090  # Puerto personalizable

# Debugging de APIs específicas
export DEBUG_CALENDAR_API=true  # Debug solo Calendar API
export DEBUG_MEET_API=true      # Debug solo Meet API
```

---

## 📞 **Escalación y Soporte**

### **Nivel 1: Auto-resolución** (5-15 minutos)
```yaml
Antes de pedir ayuda, intentar:
  ✅ Verificar configuración con scripts de diagnóstico
  ✅ Reiniciar servidor en Smithery
  ✅ Reiniciar Claude Desktop
  ✅ Verificar conectividad de red
  ✅ Revisar logs en Smithery dashboard
```

### **Nivel 2: Documentación y FAQ** (15-30 minutos)
```yaml
Recursos a consultar:
  📖 Esta guía de troubleshooting
  📖 docs/SMITHERY_USER_GUIDE.md
  📖 docs/SECURITY.md
  📖 GitHub Issues: buscar problemas similares
  📖 Smithery support documentation
```

### **Nivel 3: Contactar Soporte** (Si no se resuelve)
```yaml
Preparar la siguiente información:
  📋 Descripción detallada del problema
  📋 Pasos que ya intentaste
  📋 Output de scripts de diagnóstico
  📋 Screenshots de errores
  📋 Configuración sanitizada (sin credenciales)
  📋 OS y versión de Claude Desktop
  📋 Logs relevantes de Smithery

Contactos:
  🐛 GitHub Issues: https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues
  🔨 Smithery Support: https://smithery.ai/support
  👥 Team Lead: [tu-team-lead@company.com]
  🛠️ IT Support: [it-support@company.com]
```

---

## 📝 **Template de Reporte de Issue**

```markdown
# Issue Report - Google Meet MCP Server

## Environment
- OS: [macOS/Windows/Linux + version]
- Claude Desktop Version: [version]
- MCP Server Version: v3.0
- Deployment Method: Smithery
- Google Workspace Type: [Business/Enterprise/etc]

## Problem Description
[Descripción clara del problema]

## Steps to Reproduce
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

## Expected Behavior
[Qué esperabas que pasara]

## Actual Behavior
[Qué realmente pasó]

## Error Messages
```
[Pegar errores completos aquí]
```

## Configuration (sanitized)
```yaml
# Configuración en Smithery (remover paths reales)
googleOAuthCredentials: "/path/to/credentials.json"
customLogLevel: "info"
```

## Diagnostic Information
```bash
# Output de mcp-connectivity-test.sh
[Pegar output aquí]
```

## Additional Context
[Cualquier información adicional relevante]

## Attempted Solutions
- [ ] Reinicié servidor en Smithery
- [ ] Reinicié Claude Desktop
- [ ] Verifiqué permisos de archivos
- [ ] Regeneré credenciales OAuth
- [ ] [Otras soluciones intentadas]
```

---

**🎯 Recuerda: La mayoría de problemas se resuelven con configuración correcta de paths y permisos. When in doubt, check the basics first!**

> 💡 **Pro Tip**: Mantén un backup de tu configuración funcionando. Cuando algo funcione correctamente, documenta exactamente cómo lo configuraste.