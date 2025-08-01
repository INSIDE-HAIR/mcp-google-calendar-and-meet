# 🚀 Smithery User Guide - Google Meet MCP Server v3.0
## Guía Completa para Equipos de Trabajo

Esta guía te ayudará a ti y tu equipo a implementar el Google Meet MCP Server usando Smithery de forma segura y eficiente.

---

## 📋 **Requisitos Previos**

### **1. Cuenta de Google Workspace**
- ✅ **Business Standard o superior** (requerido para funciones avanzadas)
- ✅ **Permisos de administrador** para crear proyectos en Google Cloud
- ✅ **Licencia Gemini** (opcional, para smart notes)

### **2. Herramientas Necesarias**
- ✅ **Claude Desktop** instalado
- ✅ **Navegador web** moderno
- ✅ **Acceso a Smithery.ai** (cuenta gratuita o de equipo)

---

## 🔧 **Paso 1: Configuración de Google Cloud**

### **A. Crear Proyecto de Google Cloud**

1. **Ir a Google Cloud Console**:
   - Abrir [console.cloud.google.com](https://console.cloud.google.com)
   - Hacer clic en "Seleccionar proyecto" → "Nuevo proyecto"

2. **Configurar el proyecto**:
   ```
   Nombre del proyecto: "MCP Google Meet - [TU NOMBRE/EQUIPO]"
   Organización: [Tu organización de Google Workspace]
   Ubicación: [Tu región preferida]
   ```

3. **Habilitar APIs necesarias**:
   - Ir a "APIs y servicios" → "Biblioteca"
   - Buscar y habilitar:
     - ✅ **Google Calendar API**
     - ✅ **Google Meet API** 
   - Hacer clic en "HABILITAR" para cada una

### **B. Crear Credenciales OAuth 2.0**

1. **Ir a Credenciales**:
   - En el menú lateral: "APIs y servicios" → "Credenciales"
   - Hacer clic en "+ CREAR CREDENCIALES"
   - Seleccionar "ID de cliente de OAuth 2.0"

2. **Configurar OAuth**:
   ```
   Tipo de aplicación: Aplicación de escritorio
   Nombre: "Google Meet MCP Server - [TU NOMBRE]"
   ```

3. **Descargar credenciales**:
   - Hacer clic en "CREAR"
   - **DESCARGAR JSON** (este será tu `credentials.json`)
   - ⚠️ **GUARDAR en ubicación segura** (ver siguiente sección)

### **C. Configurar Pantalla de Consentimiento OAuth**

1. **Ir a "Pantalla de consentimiento de OAuth"**
2. **Seleccionar tipo de usuario**:
   - **Interno** (si tu organización Google Workspace)
   - **Externo** (solo si es necesario)

3. **Completar información básica**:
   ```
   Nombre de la aplicación: "Google Meet MCP Server"
   Correo de asistencia al usuario: [tu-email@empresa.com]
   Dominios autorizados: [tu-dominio.com]
   ```

4. **Agregar scopes (ámbitos)**:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`

---

## 🔐 **Paso 2: Almacenamiento Seguro de Credenciales**

### **⚠️ CRÍTICO: Donde NUNCA guardar credenciales**
```bash
❌ Escritorio/
❌ Descargas/
❌ Carpetas compartidas (Google Drive, OneDrive, etc.)
❌ Repositorios de código
❌ Slack, email, o chat
❌ Documentos compartidos
```

### **✅ Ubicaciones Recomendadas por SO**

#### **macOS**:
```bash
# Crear carpeta segura
mkdir -p ~/Documents/MCP-Credentials
chmod 700 ~/Documents/MCP-Credentials

# Mover credenciales
mv ~/Downloads/client_secret_*.json ~/Documents/MCP-Credentials/google-meet-credentials.json
chmod 600 ~/Documents/MCP-Credentials/google-meet-credentials.json

# Path para usar en Smithery:
/Users/[tu-usuario]/Documents/MCP-Credentials/google-meet-credentials.json
```

#### **Windows**:
```powershell
# Crear carpeta segura
New-Item -ItemType Directory -Path "$env:USERPROFILE\Documents\MCP-Credentials"

# Mover credenciales (renombrar según descarga)
Move-Item "$env:USERPROFILE\Downloads\client_secret_*.json" "$env:USERPROFILE\Documents\MCP-Credentials\google-meet-credentials.json"

# Path para usar en Smithery:
C:\Users\[tu-usuario]\Documents\MCP-Credentials\google-meet-credentials.json
```

#### **Linux**:
```bash
# Crear carpeta segura
mkdir -p ~/.config/mcp
chmod 700 ~/.config/mcp

# Mover credenciales
mv ~/Downloads/client_secret_*.json ~/.config/mcp/google-meet-credentials.json
chmod 600 ~/.config/mcp/google-meet-credentials.json

# Path para usar en Smithery:
/home/[tu-usuario]/.config/mcp/google-meet-credentials.json
```

---

## 🌐 **Paso 3: Deployment con Smithery**

### **A. Acceder a Smithery**

1. **Ir a [smithery.ai](https://smithery.ai)**
2. **Iniciar sesión** con tu cuenta
3. **Buscar**: "Google Meet MCP Server"
4. **Seleccionar la versión v3.0** del servidor

### **B. Configuración en Smithery**

#### **Opción 1: Configuración Simple (Recomendada)**
```yaml
# En la interfaz de Smithery, completar:
Google OAuth Credentials: /ruta/completa/a/tus/credenciales.json

# Ejemplo macOS:
/Users/tuusuario/Documents/MCP-Credentials/google-meet-credentials.json

# Ejemplo Windows:
C:\Users\tuusuario\Documents\MCP-Credentials\google-meet-credentials.json

# Ejemplo Linux:
/home/tuusuario/.config/mcp/google-meet-credentials.json
```

#### **Opción 2: Configuración Avanzada (Para usuarios expertos)**
```yaml
Google Meet Credentials Path: /ruta/a/credentials.json
Google Meet Token Path: /ruta/a/token.json
```

### **C. Desplegar el Servidor**

1. **Hacer clic en "Deploy Server"**
2. **Esperar a que el estado sea "Running"** (puede tomar 1-2 minutos)
3. **Verificar en "Server Status"** que muestre "✅ Healthy"

---

## 🔗 **Paso 4: Integración con Claude Desktop**

### **A. Configuración Automática (Recomendada)**

Si usas Smithery, la integración debería ser automática. Verificar en Claude Desktop:

1. **Abrir Claude Desktop**
2. **Ir a Configuración** → **MCP Servers**
3. **Verificar que aparezca**: "Google Meet MCP Server"
4. **Estado debe ser**: "Connected ✅"

### **B. Configuración Manual (Si es necesario)**

Si la integración automática no funciona:

1. **Abrir archivo de configuración de Claude Desktop**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Agregar configuración**:
   ```json
   {
     "mcpServers": {
       "google-meet-mcp-server": {
         "command": "smithery",
         "args": ["run", "google-meet-mcp-server"],
         "env": {
           "SMITHERY_CONFIG_ID": "tu-config-id-de-smithery"
         }
       }
     }
   }
   ```

3. **Reiniciar Claude Desktop**

---

## ✅ **Paso 5: Verificación y Pruebas**

### **A. Verificar Conexión**

1. **En Claude Desktop, preguntar**:
   ```
   ¿Qué herramientas de Google Meet tienes disponibles?
   ```

2. **Deberías ver 17 herramientas**:
   - 5 herramientas de Calendar API v3
   - 12 herramientas de Meet API v2

### **B. Prueba Básica**

1. **Pedir a Claude**:
   ```
   Lista mis calendarios de Google
   ```

2. **Si es la primera vez**, aparecerá:
   - Una ventana del navegador para autorizar
   - Hacer clic en "Permitir" para cada permiso
   - La ventana se cerrará automáticamente

3. **Claude debería mostrar** tu lista de calendarios

### **C. Prueba Avanzada**

1. **Crear un evento de prueba**:
   ```
   Crea un evento llamado "Reunión de prueba MCP" para mañana a las 2pm con Google Meet incluido
   ```

2. **Verificar en Google Calendar** que el evento se creó correctamente

---

## 👥 **Paso 6: Configuración para Equipos**

### **A. Para Administradores de Equipo**

#### **1. Crear Proyecto Compartido (Opcional)**
```bash
# En Google Cloud Console:
Proyecto: "MCP Google Meet - [NOMBRE EQUIPO]"
Facturación: Cuenta de la empresa
Permisos: Agregar miembros del equipo como "Editor"
```

#### **2. Documentar Configuración del Equipo**
```markdown
# Configuración del Equipo - Google Meet MCP Server

## Proyecto Google Cloud
- Nombre: MCP Google Meet - [EQUIPO]
- ID: [project-id]
- Administradores: [lista de emails]

## Ubicación de Credenciales por Usuario
- Cada usuario debe crear sus propias credenciales
- Ubicación estándar: ~/Documents/MCP-Credentials/
- Naming: google-meet-credentials-[nombre-usuario].json

## Contacto de Soporte
- IT/Admin: [email-admin@empresa.com]
- Documentación: [link-interno]
```

### **B. Para Cada Miembro del Equipo**

#### **1. Credenciales Individuales**
- ✅ **Cada persona crea sus propias credenciales** (paso 1-2)
- ✅ **Naming convention**: `google-meet-credentials-[tu-nombre].json`
- ✅ **No compartir credenciales** entre miembros del equipo

#### **2. Configuración Individual en Smithery**
- ✅ **Cada persona configura su propia instancia** en Smithery
- ✅ **Usar la misma versión** del servidor (v3.0)
- ✅ **Seguir las mismas ubicaciones** de archivos

---

## 🔒 **Mejores Prácticas de Seguridad**

### **A. Para Usuarios Individuales**

```bash
# ✅ HACER
✅ Crear credenciales propias en Google Cloud Console
✅ Guardar en ubicación segura con permisos restrictivos
✅ Usar paths absolutos en configuración
✅ Cerrar sesión de navegador después de configurar OAuth
✅ Revisar periódicamente permisos en Google Account

# ❌ NUNCA HACER
❌ Compartir credenciales con compañeros
❌ Commit credenciales a repositorios
❌ Guardar en carpetas sincronizadas con cloud
❌ Enviar credenciales por email/slack
❌ Usar credenciales de prueba en producción
```

### **B. Para Administradores**

```yaml
# Monitoreo y Auditoría
Auditoría mensual:
  - Revisar proyectos activos en Google Cloud
  - Verificar usuarios con acceso
  - Revisar logs de API usage
  - Rotar credenciales según política empresa

Alertas recomendadas:
  - Uso excesivo de API quotas
  - Errores de autenticación repetidos
  - Intentos de acceso desde IPs inusuales
```

---

## 🐛 **Troubleshooting Común**

### **Problema 1: "Server Won't Start" en Smithery**
```
❌ Error: Authentication failed

✅ Solución:
1. Verificar que el path a credentials.json sea correcto
2. Verificar permisos del archivo (chmod 600)
3. Asegurar que las APIs estén habilitadas en Google Cloud
4. Reintentar deployment en Smithery
```

### **Problema 2: "Permission Denied" en Google APIs**
```
❌ Error: Insufficient permission

✅ Solución:
1. Ir a Google Cloud Console → APIs y servicios → Credenciales
2. Hacer clic en tu cliente OAuth
3. Verificar que los scopes incluyan:
   - https://www.googleapis.com/auth/calendar
   - https://www.googleapis.com/auth/meetings.space.created
   - https://www.googleapis.com/auth/meetings.space.readonly
4. Re-autorizar la aplicación
```

### **Problema 3: "Tools Not Available" en Claude Desktop**
```
❌ Error: MCP server not connected

✅ Solución:
1. Verificar estado en Smithery (debe estar "Running")
2. Reiniciar Claude Desktop
3. Verificar configuración MCP en Claude Desktop
4. Comprobar logs en Smithery dashboard
```

### **Problema 4: "OAuth Authorization Failed"**
```
❌ Error: Redirect URI mismatch

✅ Solución:
1. En Google Cloud Console → Credenciales
2. Editar cliente OAuth 2.0
3. En "URIs de redirección autorizados" agregar:
   - http://localhost:8080
   - http://localhost:3000
4. Guardar cambios y reintentar
```

---

## 📊 **Monitoreo y Mantenimiento**

### **A. Dashboard de Smithery**

**Métricas a revisar semanalmente**:
- ✅ **Server Uptime**: Debe estar >99%
- ✅ **Tool Success Rate**: Debe estar >95%
- ✅ **Response Time**: Debe estar <2 segundos
- ✅ **Error Count**: Debe estar <5 por día

### **B. Google Cloud Console**

**Revisar mensualmente**:
- ✅ **API Quotas**: Verificar que no esté cerca del límite
- ✅ **Billing**: Revisar costos (normalmente <$1 USD/mes por usuario)
- ✅ **Security**: Revisar logs de acceso inusual

### **C. Rotación de Credenciales**

**Cada 6 meses** (recomendado para empresas):
1. **Generar nuevas credenciales** en Google Cloud Console
2. **Actualizar configuración** en Smithery
3. **Revocar credenciales anteriores**
4. **Documentar cambio** en logs del equipo

---

## 🎯 **Checklist de Implementación**

### **Para Usuarios Individuales**
- [ ] ✅ Proyecto Google Cloud creado
- [ ] ✅ APIs Calendar y Meet habilitadas
- [ ] ✅ Credenciales OAuth 2.0 creadas y descargadas
- [ ] ✅ Credenciales guardadas en ubicación segura
- [ ] ✅ Permisos de archivo configurados (600)
- [ ] ✅ Servidor desplegado en Smithery
- [ ] ✅ Estado "Running" confirmado
- [ ] ✅ Claude Desktop conectado
- [ ] ✅ Prueba básica completada (listar calendarios)
- [ ] ✅ Prueba avanzada completada (crear evento)

### **Para Administradores de Equipo**
- [ ] ✅ Política de seguridad definida
- [ ] ✅ Documentación interna creada
- [ ] ✅ Equipo capacitado en uso
- [ ] ✅ Proceso de onboarding establecido
- [ ] ✅ Monitoreo configurado
- [ ] ✅ Plan de rotación de credenciales definido

---

## 🆘 **Soporte y Recursos**

### **Recursos Oficiales**
- 📖 **Documentación**: [Repositorio GitHub](https://github.com/INSIDE-HAIR/google-meet-mcp-server)
- 🐛 **Reportar Issues**: [GitHub Issues](https://github.com/INSIDE-HAIR/google-meet-mcp-server/issues)
- 🔒 **Guía de Seguridad**: [SECURITY.md](./SECURITY.md)
- 🐳 **Deployment Docker**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

### **Soporte de Plataformas**
- 🔨 **Smithery**: [smithery.ai/support](https://smithery.ai/support)
- 🤖 **Claude Desktop**: [Claude Help Center](https://support.anthropic.com)
- ☁️ **Google Cloud**: [Google Cloud Support](https://cloud.google.com/support)

### **Contacto Interno**
- 👨‍💻 **Admin del Proyecto**: [tu-admin@empresa.com]
- 🛠️ **IT Support**: [it-support@empresa.com]
- 📋 **Documentación Interna**: [link-interno]

---

**🎉 ¡Listo! Tu equipo puede ahora usar Google Meet MCP Server de forma segura y eficiente a través de Smithery.**

> 💡 **Tip**: Marca esta guía como favorita y compártela con nuevos miembros del equipo para un onboarding rápido.