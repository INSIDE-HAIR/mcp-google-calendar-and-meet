# Google Meet API v2 Beta - Documentación Completa

## 📋 Información General

**URL Base:** `https://meet.googleapis.com`

**Versión Actual:** v2 (GA desde febrero 2024) + v2beta (Developer Preview)

**Discovery Document:** `https://meet.googleapis.com/$discovery/rest?version=v2`

**Autenticación:** OAuth 2.0 (Requerida para todas las requests)

**Formato de Datos:** JSON

**Estado:** La API v2 es Generally Available, mientras que v2beta incluye características en Developer Preview

---

## 🎯 Arquitectura de la API

La Google Meet API está organizada en **dos servicios principales**:

1. **Spaces Service** - Gestión de espacios de reunión
2. **Conference Records Service** - Acceso a registros históricos de conferencias

---

## 1. 🏢 Spaces Service (v2 + v2beta)

Gestiona los espacios de reunión, sus configuraciones y miembros.

### **Endpoints v2 (GA):**

| Método                  | HTTP Request                                   | Descripción                         |
| ----------------------- | ---------------------------------------------- | ----------------------------------- |
| **create**              | `POST /v2/spaces`                              | Crea un nuevo espacio de reunión    |
| **get**                 | `GET /v2/{name=spaces/*}`                      | Obtiene detalles de un espacio      |
| **update**              | `PATCH /v2/{space.name=spaces/*}`              | Actualiza configuración del espacio |
| **endActiveConference** | `POST /v2/{name=spaces/*}:endActiveConference` | Termina conferencia activa          |

### **Endpoints v2beta (Developer Preview):**

| Método                      | HTTP Request                                           | Descripción                       |
| --------------------------- | ------------------------------------------------------ | --------------------------------- |
| **connectActiveConference** | `POST /v2beta/{name=spaces/*}:connectActiveConference` | Establece conexión WebRTC         |
| **createMember**            | `POST /v2beta/{parent=spaces/*}/members`               | Crea un miembro del espacio       |
| **getMember**               | `GET /v2beta/{name=spaces/*/members/*}`                | Obtiene información de un miembro |
| **listMembers**             | `GET /v2beta/{parent=spaces/*}/members`                | Lista miembros del espacio        |
| **deleteMember**            | `DELETE /v2beta/{name=spaces/*/members/*}`             | Elimina un miembro del espacio    |

### **Estructura Space (Completa):**

```json
{
  "name": "spaces/{space_id}",
  "meetingUri": "https://meet.google.com/{meeting_code}",
  "meetingCode": "abc-defg-hij",
  "config": {
    "accessType": "OPEN|TRUSTED|RESTRICTED",
    "moderation": {
      "mode": "ON|OFF"
    },
    "moderationRestrictions": {
      "chatRestriction": "HOSTS_ONLY|NO_RESTRICTION",
      "presentRestriction": "HOSTS_ONLY|NO_RESTRICTION",
      "defaultRoleAssignmentRestriction": "VIEWER_ONLY|CONTRIBUTOR_ONLY"
    },
    "entryPointAccess": "ALL|PHONE_ONLY",
    "artifactConfig": {
      "recordingConfig": {
        "autoGenerationType": "ON|OFF"
      },
      "transcriptionConfig": {
        "autoGenerationType": "ON|OFF"
      },
      "smartNotesConfig": {
        "autoGenerationType": "ON|OFF"
      }
    },
    "attendanceReportGenerationType": "ON|OFF"
  },
  "activeConference": {
    "conferenceRecord": "conferenceRecords/{conference_record}"
  }
}
```

### **Estructura Member (v2beta):**

```json
{
  "name": "spaces/{space}/members/{member}",
  "email": "user@example.com",
  "role": "HOST|COHOST|MEMBER|VIEWER",
  "user": {
    "displayName": "John Doe",
    "avatar": "https://...",
    "type": "HUMAN|SERVICE_ACCOUNT"
  }
}
```

### **Tipos de Acceso (AccessType):**

- **OPEN**: Cualquiera puede unirse sin autorización
- **TRUSTED**: Solo usuarios de dominios confiables
- **RESTRICTED**: Solo usuarios específicamente invitados

### **Roles de Miembros:**

- **HOST**: Anfitrión principal con todos los permisos
- **COHOST**: Co-anfitrión con permisos de gestión (excepto remover HOST)
- **MEMBER**: Participante estándar con permisos básicos
- **VIEWER**: Solo puede ver, sin interactuar

### **Configuraciones de Moderación:**

**Chat Restrictions:**

- `HOSTS_ONLY`: Solo anfitriones pueden enviar mensajes
- `NO_RESTRICTION`: Todos pueden enviar mensajes

**Present Restrictions:**

- `HOSTS_ONLY`: Solo anfitriones pueden compartir pantalla
- `NO_RESTRICTION`: Todos pueden compartir pantalla

**Default Role Assignment:**

- `VIEWER_ONLY`: Usuarios se unen como espectadores por defecto
- `CONTRIBUTOR_ONLY`: Usuarios se unen como contribuidores por defecto

### **Ejemplos de Uso:**

**Crear espacio básico:**

```bash
POST /v2/spaces
{
  "config": {
    "accessType": "TRUSTED"
  }
}
```

**Crear espacio con configuración completa:**

```bash
POST /v2/spaces
{
  "config": {
    "accessType": "RESTRICTED",
    "moderation": {
      "mode": "ON"
    },
    "moderationRestrictions": {
      "chatRestriction": "HOSTS_ONLY",
      "presentRestriction": "HOSTS_ONLY",
      "defaultRoleAssignmentRestriction": "VIEWER_ONLY"
    },
    "artifactConfig": {
      "recordingConfig": {
        "autoGenerationType": "ON"
      },
      "transcriptionConfig": {
        "autoGenerationType": "ON"
      },
      "smartNotesConfig": {
        "autoGenerationType": "ON"
      }
    },
    "attendanceReportGenerationType": "ON"
  }
}
```

**Agregar co-anfitrión (v2beta):**

```bash
POST /v2beta/spaces/{space_id}/members
{
  "email": "cohost@example.com",
  "role": "COHOST"
}
```

**Listar miembros (v2beta):**

```bash
GET /v2beta/spaces/{space_id}/members
```

**Actualizar configuración del espacio:**

```bash
PATCH /v2/spaces/{space_id}
{
  "config": {
    "moderation": {
      "mode": "OFF"
    }
  }
}
```

**Terminar conferencia activa:**

```bash
POST /v2/spaces/{space_id}:endActiveConference
```

---

## 2. 📊 Conference Records Service (v2)

Acceso de solo lectura a registros históricos de conferencias y sus artefactos.

### **Jerarquía de Recursos:**

```
conferenceRecords/
├── {conference_record}
│   ├── participants/
│   │   └── {participant}
│   │       └── participantSessions/
│   │           └── {session}
│   ├── recordings/
│   │   └── {recording}
│   └── transcripts/
│       └── {transcript}
│           └── entries/
│               └── {entry}
```

### **Conference Records:**

**Endpoints:**

- `GET /v2/conferenceRecords` - Lista conferencias
- `GET /v2/{name=conferenceRecords/*}` - Obtiene conferencia específica

**Estructura ConferenceRecord:**

```json
{
  "name": "conferenceRecords/{conference_record}",
  "startTime": "2025-07-30T10:00:00Z",
  "endTime": "2025-07-30T11:30:00Z",
  "expireTime": "2025-10-28T11:30:00Z",
  "space": "spaces/{space_id}"
}
```

### **Participants:**

**Endpoints:**

- `GET /v2/{parent=conferenceRecords/*}/participants` - Lista participantes
- `GET /v2/{name=conferenceRecords/*/participants/*}` - Obtiene participante

**Estructura Participant:**

```json
{
  "name": "conferenceRecords/{conference_record}/participants/{participant}",
  "user": {
    "displayName": "John Doe",
    "email": "john@example.com"
  },
  "anonymousUser": {
    "displayName": "Anonymous User"
  },
  "earliestStartTime": "2025-07-30T10:05:00Z",
  "latestEndTime": "2025-07-30T11:25:00Z"
}
```

### **Participant Sessions:**

**Endpoints:**

- `GET /v2/{parent=conferenceRecords/*/participants/*}/participantSessions` - Lista sesiones
- `GET /v2/{name=conferenceRecords/*/participants/*/participantSessions/*}` - Obtiene sesión

**Estructura ParticipantSession:**

```json
{
  "name": "conferenceRecords/{conference_record}/participants/{participant}/participantSessions/{session}",
  "startTime": "2025-07-30T10:05:00Z",
  "endTime": "2025-07-30T10:45:00Z"
}
```

### **Recordings:**

**Endpoints:**

- `GET /v2/{parent=conferenceRecords/*}/recordings` - Lista grabaciones
- `GET /v2/{name=conferenceRecords/*/recordings/*}` - Obtiene grabación

**Estructura Recording:**

```json
{
  "name": "conferenceRecords/{conference_record}/recordings/{recording}",
  "driveDestination": {
    "file": "1ABC2DefGHI3jKL",
    "exportUri": "https://drive.google.com/file/d/1ABC2DefGHI3jKL/view"
  },
  "state": "STARTED|ENDED|FILE_GENERATED",
  "startTime": "2025-07-30T10:00:00Z",
  "endTime": "2025-07-30T11:30:00Z"
}
```

### **Transcripts:**

**Endpoints:**

- `GET /v2/{parent=conferenceRecords/*}/transcripts` - Lista transcripciones
- `GET /v2/{name=conferenceRecords/*/transcripts/*}` - Obtiene transcripción

**Estructura Transcript:**

```json
{
  "name": "conferenceRecords/{conference_record}/transcripts/{transcript}",
  "docsDestination": {
    "document": "1XYZ2DefGHI3jKL",
    "exportUri": "https://docs.google.com/document/d/1XYZ2DefGHI3jKL/edit"
  },
  "state": "STARTED|ENDED|FILE_GENERATED",
  "startTime": "2025-07-30T10:00:00Z",
  "endTime": "2025-07-30T11:30:00Z"
}
```

### **Transcript Entries:**

**Endpoints:**

- `GET /v2/{parent=conferenceRecords/*/transcripts/*}/entries` - Lista entradas
- `GET /v2/{name=conferenceRecords/*/transcripts/*/entries/*}` - Obtiene entrada

**Estructura TranscriptEntry:**

```json
{
  "name": "conferenceRecords/{conference_record}/transcripts/{transcript}/entries/{entry}",
  "participant": "conferenceRecords/{conference_record}/participants/{participant}",
  "text": "Buenos días, comenzamos la reunión.",
  "languageCode": "es-ES",
  "startTime": "2025-07-30T10:01:30Z",
  "endTime": "2025-07-30T10:01:35Z"
}
```

### **Ejemplos de Consulta:**

**Listar conferencias recientes:**

```bash
GET /v2/conferenceRecords?filter=space.name="spaces/{space_id}"&pageSize=50
```

**Obtener participantes de una conferencia:**

```bash
GET /v2/conferenceRecords/{conference_record}/participants
```

**Descargar grabación:**

```bash
GET /v2/conferenceRecords/{conference_record}/recordings/{recording}
# Response incluye driveDestination.exportUri para descarga
```

**Obtener transcripción completa:**

```bash
GET /v2/conferenceRecords/{conference_record}/transcripts/{transcript}/entries?pageSize=1000
```

---

## 🔑 OAuth 2.0 Scopes

### **Scopes para Spaces:**

- `https://www.googleapis.com/auth/meetings.space.created` - Crear y gestionar espacios
- `https://www.googleapis.com/auth/meetings.space.readonly` - Solo lectura de espacios

### **Scopes para Conference Records:**

- `https://www.googleapis.com/auth/meetings.space.readonly` - Acceso a registros de conferencias

### **Scopes Adicionales:**

- `https://www.googleapis.com/auth/drive.readonly` - Acceso a archivos de grabación/transcripción

---

## 📊 Límites y Cuotas

### **Límites por Defecto:**

- **Consultas por día:** 100,000
- **Consultas por usuario por 100 segundos:** 1,000
- **Consultas por 100 segundos:** 10,000

### **Límites de Recursos:**

- **Participantes por conferencia:** Sin límite específico
- **Miembros por espacio:** 500 (aproximado)
- **Grabaciones por conferencia:** Múltiples (una por inicio de grabación)

### **Limitaciones Importantes:**

1. **Grabación y Transcripción:**

   - Requiere Google Workspace Business Standard o superior
   - No se puede iniciar/detener grabación programáticamente
   - Archivos almacenados en Google Drive del organizador

2. **Smart Notes:**

   - Requiere licencia Gemini Business/Enterprise
   - Funciona óptimamente en inglés

3. **Miembros (v2beta):**
   - Solo disponible en Developer Preview
   - Roles deben reasignarse para reuniones recurrentes

---

## 🚀 Casos de Uso Avanzados

### **1. Gestión Completa de Espacios con Co-anfitriones:**

```python
# Crear espacio con configuración avanzada
space = await create_space({
    "config": {
        "accessType": "RESTRICTED",
        "moderation": {"mode": "ON"},
        "moderationRestrictions": {
            "chatRestriction": "HOSTS_ONLY",
            "presentRestriction": "HOSTS_ONLY"
        },
        "artifactConfig": {
            "recordingConfig": {"autoGenerationType": "ON"},
            "transcriptionConfig": {"autoGenerationType": "ON"}
        }
    }
})

# Agregar co-anfitriones
await create_member(space.name, {
    "email": "cohost1@company.com",
    "role": "COHOST"
})

await create_member(space.name, {
    "email": "cohost2@company.com",
    "role": "COHOST"
})
```

### **2. Análisis Post-Conferencia:**

```python
# Obtener datos completos de la conferencia
conference = await get_conference_record(conference_id)
participants = await list_participants(conference.name)
recordings = await list_recordings(conference.name)
transcripts = await list_transcripts(conference.name)

# Análisis de participación
for participant in participants:
    sessions = await list_participant_sessions(participant.name)
    total_time = calculate_participation_time(sessions)
    print(f"{participant.user.displayName}: {total_time} minutos")
```

### **3. Integración con Google Workspace Events API:**

```python
# Suscribirse a eventos de Meet
subscription = await create_subscription({
    "targetResource": "spaces/{space_id}",
    "eventTypes": ["google.workspace.meet.conference.v2.started",
                   "google.workspace.meet.conference.v2.ended"],
    "notificationEndpoint": "https://myapp.com/webhooks/meet"
})
```

---

## 🔧 Configuraciones Avanzadas

### **Artifact Configuration:**

La configuración de artefactos permite habilitar funciones automáticas:

```json
{
  "artifactConfig": {
    "recordingConfig": {
      "autoGenerationType": "ON" // Grabación automática
    },
    "transcriptionConfig": {
      "autoGenerationType": "ON" // Transcripción automática
    },
    "smartNotesConfig": {
      "autoGenerationType": "ON" // Notas inteligentes con Gemini
    }
  }
}
```

### **Moderation Settings:**

Control completo sobre permisos y restricciones:

```json
{
  "moderation": { "mode": "ON" },
  "moderationRestrictions": {
    "chatRestriction": "HOSTS_ONLY", // Solo anfitriones pueden chatear
    "presentRestriction": "HOSTS_ONLY", // Solo anfitriones pueden presentar
    "defaultRoleAssignmentRestriction": "VIEWER_ONLY" // Usuarios entran como espectadores
  }
}
```

### **Entry Point Access:**

Control sobre métodos de acceso:

```json
{
  "entryPointAccess": "ALL" // Todas las formas de acceso
  // "entryPointAccess": "PHONE_ONLY"  // Solo acceso telefónico
}
```

---

## 🎯 Best Practices

1. **Usar v2beta para funciones avanzadas** como gestión de miembros
2. **Implementar polling** para artefactos (grabaciones/transcripciones pueden tardar)
3. **Gestionar roles apropiadamente** - COHOST para delegar control
4. **Habilitar moderación** para reuniones grandes o sensibles
5. **Configurar artefactos** según necesidades de compliance
6. **Usar filtros** en consultas de Conference Records para eficiencia
7. **Implementar webhooks** con Google Workspace Events API para actualizaciones en tiempo real

---

## 🔗 Recursos Adicionales

- **Documentación oficial:** https://developers.google.com/meet/api
- **Guías de configuración:** https://developers.google.com/meet/api/guides
- **Workspace Events API:** Para notificaciones en tiempo real
- **Add-ons SDK:** Para integraciones dentro de Meet
- **Live Sharing SDK:** Para colaboración en tiempo real

Esta documentación cubre todas las funcionalidades disponibles en Google Meet API v2 y v2beta, incluyendo la gestión avanzada de espacios, miembros, configuraciones de moderación, y acceso a artefactos históricos de conferencias.
