# AGENT.md - Google Meet MCP Server v2.0

## 🎯 Visión General del Proyecto

Google Meet MCP Server v2.0 es un servidor avanzado del Protocolo de Contexto de Modelo (MCP) que integra Google Meet y Google Calendar para proporcionar capacidades empresariales completas de gestión de reuniones. Este proyecto representa una arquitectura híbrida sofisticada que combina dos enfoques diferentes:

1. **Proyecto Principal** (Carpeta raíz) - Implementación JavaScript/ES6 con arquitectura moderna y TypeScript
2. **Subproyecto** (google-calendar-mcp/) - Implementación TypeScript enfocada específicamente en Google Calendar

## 🏗️ Arquitectura del Sistema

### Proyecto Principal (`/`)

**Características principales:**

- **Versión**: 2.0.0
- **Tecnología**: JavaScript ES6 con módulos nativos
- **Protocolo MCP**: v1.8.0
- **APIs**: Google Calendar API v3 + Google Meet API v2 (GA)
- **17 herramientas** distribuidas en dos categorías:
  - 5 herramientas Calendar API v3 (`calendar_v3_*`)
  - 12 herramientas Meet API v2 (`meet_v2_*`)

**Componentes Core:**

1. **`src/index.ts`** - Servidor MCP principal

   - Clase `GoogleMeetMcpServer`
   - Manejo de transporte stdio
   - Registro de 17 herramientas
   - Gestión de errores MCP

2. **`src/GoogleMeetAPI.ts`** - Cliente API dual

   - Sección Google Calendar API v3
   - Sección Google Meet API v2 con cliente REST personalizado
   - Autenticación OAuth2 unificada
   - Gestión de tokens persistente

3. **`src/setup.ts`** - Script de configuración OAuth
   - Flujo de autenticación inicial
   - Generación y persistencia de tokens

### Subproyecto TypeScript (`/google-calendar-mcp/`)

**Características principales:**

- **Versión**: 1.4.8
- **Tecnología**: TypeScript completo con esbuild
- **Enfoque**: Google Calendar específicamente
- **Arquitectura modular** avanzada

**Componentes Core:**

1. **`src/index.ts`** - Punto de entrada CLI

   - Parsing de comandos (auth, start, version, help)
   - Gestión de transporte dual (stdio/HTTP)

2. **`src/server.ts`** - Implementación del servidor MCP

   - Clase `GoogleCalendarMcpServer`
   - Autenticación startup inteligente
   - Registro de herramientas via `ToolRegistry`

3. **`src/auth/`** - Sistema de autenticación modular

   - `client.ts` - Inicialización OAuth2Client
   - `server.ts` - Servidor de autenticación
   - `tokenManager.ts` - Gestión avanzada de tokens

4. **`src/tools/registry.ts`** - Registro centralizado de herramientas

5. **`src/transports/`** - Manejadores de transporte
   - `stdio.ts` - Transporte stdio estándar
   - `http.ts` - Servidor HTTP configurable

## 🔧 Comandos de Desarrollo

### Proyecto Principal

```bash
# Dependencias
npm install

# Servidor
npm start                    # Iniciar servidor MCP
npm run setup               # Configuración OAuth inicial

# Testing
npm test                    # Suite completa de tests
npm run test:unit          # Tests unitarios con cobertura
npm run test:integration   # Tests de integración
npm run test:coverage      # Reporte de cobertura
npm run test:watch         # Tests en modo watch

# Utilidades
npm run oauth-helper       # Abrir helper HTML para OAuth
npm run refresh-token      # Renovar tokens
```

### Subproyecto TypeScript

```bash
cd google-calendar-mcp/

# Build y desarrollo
npm install
npm run build              # Compilar TypeScript con esbuild
npm run dev               # Modo desarrollo

# Servidor
npm start                 # Modo stdio
npm run start:http        # Modo HTTP puerto 3000
npm run auth             # Configuración OAuth

# Testing
npm test                 # Tests unitarios (Vitest)
npm run test:integration # Tests de integración
npm run test:coverage    # Cobertura de código
npm run test:watch       # Tests en modo watch
```

## 🔐 Configuración de Autenticación

### Método Primario (Recomendado)

```bash
export G_OAUTH_CREDENTIALS="/path/to/credentials.json"
```

- Token se guarda automáticamente en `{credentials_file}.token.json`

### Método Alternativo (Legacy)

```bash
export GOOGLE_MEET_CREDENTIALS_PATH="/path/to/credentials.json"
export GOOGLE_MEET_TOKEN_PATH="./token.json"
```

### Scopes Requeridos

- `https://www.googleapis.com/auth/calendar` - Gestión de calendario
- `https://www.googleapis.com/auth/meetings.space.created` - Crear espacios Meet
- `https://www.googleapis.com/auth/meetings.space.readonly` - Leer información de espacios
- `https://www.googleapis.com/auth/meetings.space.settings` - Configurar características avanzadas

## 🛠️ Herramientas Disponibles

### Google Calendar API v3 (5 herramientas)

- `calendar_v3_list_events` - Listar eventos con enlaces Meet opcionales
- `calendar_v3_get_event` - Obtener detalles de eventos incluyendo permisos de invitados
- `calendar_v3_create_event` - Crear eventos con conferencias Meet y permisos de invitados
- `calendar_v3_update_event` - Actualizar eventos incluyendo todas las configuraciones de invitados
- `calendar_v3_delete_event` - Eliminar eventos de calendario

### Google Meet API v2 (12 herramientas)

- `meet_v2_create_space` - Crear espacios Meet con configuración avanzada
- `meet_v2_get_space` - Obtener detalles del espacio
- `meet_v2_update_space` - Actualizar configuración del espacio
- `meet_v2_end_active_conference` - Finalizar conferencias activas
- `meet_v2_list_conference_records` - Listar registros históricos de conferencias
- `meet_v2_get_conference_record` - Obtener detalles específicos de conferencia
- `meet_v2_list_recordings` - Listar grabaciones de conferencias
- `meet_v2_get_recording` - Obtener detalles de grabación
- `meet_v2_list_transcripts` - Listar transcripciones de conferencias
- `meet_v2_get_transcript` - Obtener detalles de transcripción
- `meet_v2_list_transcript_entries` - Listar segmentos individuales de habla

## 🚀 Características Empresariales

### Configuración de Eventos de Calendario

- `guest_can_invite_others` - Controlar si los invitados pueden invitar a otros
- `guest_can_modify` - Controlar si los invitados pueden modificar el evento
- `guest_can_see_other_guests` - Controlar visibilidad de lista de invitados

### Opciones de Configuración de Espacios

- **Tipos de Acceso**: OPEN, TRUSTED, RESTRICTED
- **Moderación**: Habilitar/deshabilitar modo moderación
- **Restricciones**: Restricciones de chat y presentación
- **Artefactos**: Configuración de grabación, transcripción, notas inteligentes
- **Roles por Defecto**: Modo solo visualización para participantes

### Funcionalidades Avanzadas v2.0

- 📝 **Auto-Transcripción** - Transcripción automática de reuniones
- 🧠 **Notas Inteligentes** - Resúmenes generados por IA con Gemini
- 📊 **Reportes de Asistencia** - Seguimiento detallado de asistencia
- 🛡️ **Moderación de Reuniones** - Restricciones y controles de chat/presentación
- 👀 **Modo Visualizador** - Forzar participantes a unirse como visualizadores por defecto
- 📹 **Auto-Grabación** - Habilitar grabación automática (activación manual requerida)

## 🔄 Comparación de Arquitecturas

| Aspecto       | Proyecto Principal   | Subproyecto TypeScript |
| ------------- | -------------------- | ---------------------- |
| Lenguaje      | JavaScript ES6       | TypeScript completo    |
| Build         | Nativo               | esbuild                |
| Testing       | Jest + c8            | Vitest                 |
| Transporte    | Solo stdio           | stdio + HTTP           |
| CLI           | Básico               | Avanzado con comandos  |
| Autenticación | Integrada            | Modular separada       |
| Herramientas  | 17 (Calendar + Meet) | Enfoque Calendar       |
| Registro      | Manual               | Registry pattern       |

## 📁 Estructura de Archivos Clave

```
google-meet-mcp-server/
├── src/                          # Implementación principal JS
│   ├── index.ts                  # Servidor MCP principal
│   ├── GoogleMeetAPI.ts          # Cliente API dual
│   └── setup.ts                  # Configuración OAuth
├── google-calendar-mcp/          # Subproyecto TypeScript
│   ├── src/
│   │   ├── index.ts             # CLI principal
│   │   ├── server.ts            # Servidor MCP
│   │   ├── auth/                # Sistema autenticación
│   │   ├── tools/               # Registro herramientas
│   │   ├── transports/          # Manejadores transporte
│   │   └── handlers/            # Lógica herramientas
│   ├── build/                   # Compilados TypeScript
│   └── scripts/                 # Scripts build/dev
├── test/                        # Tests proyecto principal
├── docs/                        # Documentación detallada
├── config-pages-for-nextjs/     # Integración Next.ts
└── package.json                 # Dependencias principales
```

## 🧪 Testing y Calidad

### Proyecto Principal

- **Jest** para testing unitario e integración
- **c8** para cobertura de código
- Tests específicos: calendarios, MCP, API estable
- Cobertura HTML/LCOV

### Subproyecto TypeScript

- **Vitest** para testing moderno
- Tests unitarios y de integración separados
- Cobertura de código integrada
- Tests de esquemas y compatibilidad

## 🐳 Despliegue

### Docker

```bash
# Docker Compose
docker compose up

# Build manual
docker build -t google-meet-mcp .
```

### Smithery (Instalación automática)

```bash
npx -y @smithery/cli install @cool-man-vk/google-meet-mcp-server --client claude
```

## 💡 Recomendaciones para Mejoras

1. **Unificación de Arquitecturas**: Considerar migrar el proyecto principal a TypeScript para consistencia
2. **Testing Unificado**: Estandarizar en Vitest para ambos proyectos
3. **Build System**: Adoptar esbuild en todo el proyecto
4. **Documentación**: Consolidar documentación fragmentada
5. **CI/CD**: Implementar pipelines automáticos
6. **Monorepo**: Considerar estructura monorepo con workspaces

## 🔗 Dependencias Clave

### Proyecto Principal

- `@modelcontextprotocol/sdk`: ^1.8.0
- `googleapis`: ^126.0.0
- `dotenv`: ^17.2.1
- `open`: ^9.1.0

### Subproyecto TypeScript

- `@modelcontextprotocol/sdk`: ^1.12.1
- `googleapis`: ^144.0.0
- `google-auth-library`: ^9.15.0
- `esbuild`: ^0.25.0
- `zod`: ^3.22.4

## 📋 Requerimientos del Sistema

- **Google Workspace Business Standard** o superior para características avanzadas
- **Licencia Gemini** para funcionalidad de notas inteligentes
- **Activación manual** requerida para grabación durante reuniones
- **Node.ts** versión compatible con ES modules
- **Credenciales OAuth2** de Google Cloud Console

Este documento proporciona una visión completa del ecosistema Google Meet MCP Server v2.0, destacando tanto las capacidades actuales como las oportunidades de mejora arquitectural.
