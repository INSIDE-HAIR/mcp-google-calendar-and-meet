# APIs de Google Calendar y Meet: Documentación técnica actualizada

Este reporte proporciona la documentación técnica completa y actualizada para Google Calendar API v3 (permisos de invitados) y Google Meet API v2 beta (funcionalidades avanzadas) basada en la investigación exhaustiva realizada.

## Google Calendar API v3 - Permisos de invitados

La API de Calendar permite configurar tres permisos específicos para invitados mediante propiedades booleanas en el objeto Event.

### Endpoints principales para gestión de calendarios y eventos

**CalendarList.list - Listar calendarios del usuario**
```
GET https://www.googleapis.com/calendar/v3/users/me/calendarList
```

**Events.list - Listar eventos de un calendario**
```
GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
```

**Events.insert - Crear eventos**
```
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
```

**Events.update - Actualizar eventos**
```
PUT https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}
```

**Events.get - Obtener evento específico**
```
GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}
```

**Events.delete - Eliminar evento**
```
DELETE https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}
```

**Freebusy.query - Consultar disponibilidad**
```
POST https://www.googleapis.com/calendar/v3/freeBusy
```

**Events.quickAdd - Crear evento con lenguaje natural**
```
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/quickAdd
```

### Parámetros de permisos de invitados

Los tres parámetros booleanos principales para controlar permisos de invitados son:

**guestCanInviteOthers**
- Tipo: `boolean`
- Valor por defecto: `true`
- Permite que invitados agreguen otros participantes al evento

**guestCanModify**
- Tipo: `boolean`  
- Valor por defecto: `false`
- Permite que invitados editen título, descripción, ubicación y horarios del evento

**guestCanSeeOtherGuests**
- Tipo: `boolean`
- Valor por defecto: `true`
- Permite que invitados vean la lista completa de participantes

### Ejemplo completo de implementación

```json
{
  "summary": "Reunión de Proyecto",
  "description": "Revisión trimestral con permisos restringidos",
  "location": "Sala Virtual Meet",
  "start": {
    "dateTime": "2025-08-15T10:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "end": {
    "dateTime": "2025-08-15T11:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "attendees": [
    {"email": "colaborador1@empresa.com"},
    {"email": "colaborador2@empresa.com"}
  ],
  "guestsCanInviteOthers": false,
  "guestsCanModify": true,
  "guestsCanSeeOtherGuests": true,
  "conferenceData": {
    "createRequest": {
      "requestId": "unique-request-id",
      "conferenceSolutionKey": {"type": "hangoutsMeet"}
    }
  }
}
```

### Código Python para configurar permisos

```python
from googleapiclient.discovery import build

def create_restricted_event(service):
    event = {
        'summary': 'Reunión Confidencial',
        'start': {'dateTime': '2025-08-20T14:00:00-05:00'},
        'end': {'dateTime': '2025-08-20T15:00:00-05:00'},
        'attendees': [{'email': 'invitado@empresa.com'}],
        'guestsCanInviteOthers': False,
        'guestsCanModify': False,
        'guestsCanSeeOtherGuests': False
    }
    
    result = service.events().insert(
        calendarId='primary',
        body=event,
        conferenceDataVersion=1
    ).execute()
    
    return result
```

### Endpoint CalendarList.list - Documentación detallada

**Descripción**: Retorna los calendarios en la lista de calendarios del usuario.

**URL**: `GET https://www.googleapis.com/calendar/v3/users/me/calendarList`

**Autenticación requerida**:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.readonly`

**Parámetros opcionales**:
- `maxResults` (integer): Máximo 250 entradas por página (default: 100)
- `minAccessRole` (string): Rol mínimo de acceso (`freeBusyReader`, `owner`, `reader`, `writer`)
- `pageToken` (string): Token para paginación
- `showDeleted` (boolean): Incluir calendarios eliminados (default: false)
- `showHidden` (boolean): Incluir calendarios ocultos (default: false)
- `syncToken` (string): Token para sincronización incremental

**Estructura de respuesta**:
```json
{
  "kind": "calendar#calendarList",
  "etag": "etag_value",
  "nextPageToken": "token_for_next_page",
  "items": [
    {
      "kind": "calendar#calendarListEntry",
      "etag": "entry_etag",
      "id": "calendar_id@gmail.com",
      "summary": "Mi Calendario",
      "description": "Descripción del calendario",
      "timeZone": "America/New_York",
      "colorId": "1",
      "backgroundColor": "#a4bdfc",
      "foregroundColor": "#1d1d1d",
      "accessRole": "owner",
      "primary": true,
      "selected": true,
      "defaultReminders": [
        {
          "method": "popup",
          "minutes": 10
        }
      ]
    }
  ]
}
```

### Endpoint Freebusy.query - Documentación detallada

**Descripción**: Consulta información de disponibilidad (libre/ocupado) para múltiples calendarios.

**URL**: `POST https://www.googleapis.com/calendar/v3/freeBusy`

**Parámetros del cuerpo**:
- `timeMin` (string): Fecha/hora de inicio en formato ISO 8601
- `timeMax` (string): Fecha/hora de fin en formato ISO 8601  
- `items` (array): Lista de calendarios a consultar

**Ejemplo de uso**:
```json
{
  "timeMin": "2024-02-01T10:00:00Z",
  "timeMax": "2024-02-01T18:00:00Z",
  "items": [
    {"id": "primary"},
    {"id": "usuario@empresa.com"}
  ]
}
```

**Estructura de respuesta**:
```json
{
  "kind": "calendar#freeBusy",
  "timeMin": "2024-02-01T10:00:00Z",
  "timeMax": "2024-02-01T18:00:00Z",
  "calendars": {
    "primary": {
      "busy": [
        {
          "start": "2024-02-01T14:00:00Z",
          "end": "2024-02-01T15:00:00Z"
        }
      ]
    }
  }
}
```

### Endpoint Events.quickAdd - Documentación detallada

**Descripción**: Crea eventos usando texto en lenguaje natural.

**URL**: `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/quickAdd`

**Parámetros**:
- `text` (string): Descripción en lenguaje natural del evento

**Ejemplos de texto natural**:
- "Almuerzo con Juan mañana a las 2pm"
- "Reunión de equipo viernes 10am-11am"
- "Cita médica 15 enero 3:30pm"
- "Conferencia zoom lunes 9am duración 2 horas"

**Estructura de respuesta**: Similar a Events.insert, retorna el evento creado.

### Documentación oficial y recursos

- **CalendarList Reference**: https://developers.google.com/calendar/api/v3/reference/calendarList
- **CalendarList.list Method**: https://developers.google.com/calendar/api/v3/reference/calendarList/list
- **Freebusy Reference**: https://developers.google.com/calendar/api/v3/reference/freebusy
- **Events.quickAdd Method**: https://developers.google.com/calendar/api/v3/reference/events/quickAdd
- **Events Resource Reference**: https://developers.google.com/calendar/api/v3/reference/events
- **Events.insert Method**: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
- **Events.update Method**: https://developers.google.com/workspace/calendar/api/v3/reference/events/update

## Google Meet API v2 beta - Configuraciones avanzadas

Google Meet API v2 se lanzó como **Generally Available en febrero 2024**. No existe una versión v1 pública - la API comenzó directamente en v2.

### Arquitectura y endpoints principales

**URL Base**: `https://meet.googleapis.com`

**Discovery Document**: `https://meet.googleapis.com/$discovery/rest?version=v2`

### Estructura de recursos y endpoints

**Spaces (Espacios de reunión)**
- `POST /v2/spaces` - Crear espacio con configuración
- `GET /v2/{name=spaces/*}` - Obtener detalles
- `PATCH /v2/{space.name=spaces/*}` - Actualizar configuración
- `POST /v2/{name=spaces/*}:endActiveConference` - Finalizar conferencia

**Conference Records (Registros de conferencia)**
- `GET /v2/conferenceRecords` - Listar conferencias
- `GET /v2/{name=conferenceRecords/*}` - Obtener registro específico

### Grabación automática (Recording)

Para habilitar grabación automática al crear un espacio:

```json
POST https://meet.googleapis.com/v2/spaces

{
  "config": {
    "artifactConfig": {
      "recordingConfig": {
        "autoGenerationType": "ON"
      }
    }
  }
}
```

**Endpoints para acceder a grabaciones**:
```
GET /v2/{parent=conferenceRecords/*}/recordings
GET /v2/{name=conferenceRecords/*/recordings/*}
```

**Estructura de respuesta de grabación**:
```json
{
  "name": "conferenceRecords/abc123/recordings/rec456",
  "driveDestination": {
    "file": "1ABC2DefGHI3jKL",
    "exportUri": "https://drive.google.com/file/d/1ABC2DefGHI3jKL/view"
  },
  "state": "ENDED",
  "startTime": "2025-07-30T10:00:00Z",
  "endTime": "2025-07-30T11:30:00Z"
}
```

### Transcripción automática

Configuración para habilitar transcripción automática:

```json
{
  "config": {
    "artifactConfig": {
      "transcriptionConfig": {
        "autoGenerationType": "ON"
      }
    }
  }
}
```

**Endpoints de transcripciones**:
```
GET /v2/{parent=conferenceRecords/*}/transcripts
GET /v2/{name=conferenceRecords/*/transcripts/*}
GET /v2/{parent=conferenceRecords/*/transcripts/*}/entries
```

**Ejemplo de entrada de transcripción**:
```json
{
  "name": "conferenceRecords/abc123/transcripts/trans789/entries/entry001",
  "participant": "conferenceRecords/abc123/participants/part456",
  "text": "Buenos días, comenzamos la reunión técnica.",
  "languageCode": "es-ES",
  "startTime": "2025-07-30T10:01:30Z",
  "endTime": "2025-07-30T10:01:35Z"
}
```

### Smart Notes / Gemini integration

Para habilitar Smart Notes (requiere licencia Gemini):

```json
{
  "config": {
    "artifactConfig": {
      "smartNotesConfig": {
        "autoGenerationType": "ON"
      }
    }
  }
}
```

Las notas se generan automáticamente y se guardan en Google Docs con:
- Puntos clave de la reunión
- Elementos de acción sugeridos
- Enlaces con timestamp a la transcripción
- Resúmenes ejecutivos generados por IA

### Co-anfitriones con permisos completos

Los endpoints para gestión de co-hosts usan la versión **v2beta**:

```
POST https://meet.googleapis.com/v2beta/{parent=spaces/*}/members
GET https://meet.googleapis.com/v2beta/{parent=spaces/*}/members
DELETE https://meet.googleapis.com/v2beta/{name=spaces/*/members/*}
```

**Asignar co-anfitrión**:
```json
POST /v2beta/spaces/{spaceId}/members

{
  "user": {
    "email": "cohost@empresa.com"
  },
  "role": "COHOST"
}
```

**Permisos de co-anfitriones**:
- ✅ Silenciar/reactivar participantes
- ✅ Gestionar pantalla compartida
- ✅ Controlar chat y reacciones
- ✅ Iniciar/detener grabación y transcripción
- ✅ Gestionar salas para grupos pequeños
- ✅ Asignar nuevos co-anfitriones
- ❌ Remover al anfitrión original

### Autenticación OAuth 2.0 requerida

**Scopes principales para Meet API v2**:

```
https://www.googleapis.com/auth/meetings.space.created
https://www.googleapis.com/auth/meetings.space.readonly
https://www.googleapis.com/auth/meetings.space.settings
https://www.googleapis.com/auth/drive.readonly
```

**Ejemplo de configuración OAuth**:
```python
from google_auth_oauthlib.flow import Flow

SCOPES = [
    'https://www.googleapis.com/auth/meetings.space.created',
    'https://www.googleapis.com/auth/drive.readonly'
]

flow = Flow.from_client_secrets_file(
    'credentials.json',
    scopes=SCOPES,
    redirect_uri='http://localhost:8080/callback'
)
```

### Ejemplo completo: Crear reunión con todas las funcionalidades

```python
from google.apps import meet_v2

async def create_advanced_meeting():
    client = meet_v2.SpacesServiceAsyncClient()
    
    space_config = {
        "access_type": "TRUSTED",
        "moderation": "ON",
        "artifact_config": {
            "recording_config": {"auto_generation_type": "ON"},
            "transcription_config": {"auto_generation_type": "ON"},
            "smart_notes_config": {"auto_generation_type": "ON"}
        },
        "moderation_restrictions": {
            "chat_restriction": "HOSTS_ONLY",
            "present_restriction": "HOSTS_ONLY"
        }
    }
    
    space = meet_v2.Space(config=space_config)
    response = await client.create_space(space=space)
    
    # Asignar co-hosts
    member_client = meet_v2beta.MembersServiceAsyncClient()
    
    for cohost_email in ["cohost1@empresa.com", "cohost2@empresa.com"]:
        member = {
            "user": {"email": cohost_email},
            "role": "COHOST"
        }
        await member_client.create_member(
            parent=response.name,
            member=member
        )
    
    return response
```

### Limitaciones importantes

**Grabación y transcripción**:
- No se puede iniciar grabación programáticamente (requiere acción manual)
- Transcripción solo disponible post-reunión (no en tiempo real vía API)
- Archivos almacenados en Google Drive del organizador

**Smart Notes / Gemini**:
- Funciona óptimamente solo en inglés
- Requiere licencia adicional (Gemini Business/Enterprise)
- Solo organizador e internos pueden activar/desactivar

**Co-anfitriones**:
- Deben reasignarse para cada instancia de reuniones recurrentes
- No pueden asignarse desde salas para grupos pequeños

### Documentación de referencia

## Google Meet API v2beta - Gestión avanzada de miembros

Google Meet API v2beta incluye funcionalidades avanzadas para gestión de miembros y co-anfitriones en espacios de reunión.

### Endpoints v2beta principales

**URL Base v2beta**: `https://meet.googleapis.com/v2beta`

### Gestión de miembros de espacios

**Crear miembro (co-anfitrión)**
```
POST /v2beta/{parent=spaces/*}/members
```

**Listar miembros de un espacio**
```
GET /v2beta/{parent=spaces/*}/members
```

**Obtener detalles de miembro específico**
```
GET /v2beta/{name=spaces/*/members/*}
```

**Eliminar miembro de un espacio**
```
DELETE /v2beta/{name=spaces/*/members/*}
```

### Ejemplo: Agregar co-anfitrión a un espacio

```json
POST /v2beta/spaces/abc-defg-hij/members

{
  "user": {
    "email": "cohost@empresa.com"
  },
  "role": "COHOST"
}
```

**Respuesta**:
```json
{
  "name": "spaces/abc-defg-hij/members/member-123",
  "user": {
    "email": "cohost@empresa.com",
    "displayName": "Juan Pérez"
  },
  "role": "COHOST"
}
```

### Roles disponibles

- **COHOST**: Co-anfitrión con permisos completos
- **PARTICIPANT**: Participante estándar

### Permisos de co-anfitriones

Los co-anfitriones pueden:
- ✅ Silenciar/reactivar participantes
- ✅ Gestionar pantalla compartida
- ✅ Controlar chat y reacciones
- ✅ Iniciar/detener grabación y transcripción
- ✅ Gestionar salas para grupos pequeños
- ✅ Asignar nuevos co-anfitriones
- ❌ Remover al anfitrión original

### Requisitos para v2beta

- **Google Workspace**: Business Standard o superior
- **Permisos OAuth**: `https://www.googleapis.com/auth/meetings.space.settings`
- **Acceso beta**: Disponible para cuentas Workspace verificadas

### Limitaciones importantes

- Co-anfitriones deben reasignarse para reuniones recurrentes
- Solo el anfitrión original puede terminar permanentemente el espacio
- Máximo 25 co-anfitriones por espacio

### Documentación de referencia

- **Meet API v2 Reference**: https://developers.google.com/workspace/meet/api/reference/rest/v2
- **Meet API v2beta Reference**: https://developers.google.com/workspace/meet/api/reference/rest/v2beta
- **Guía general**: https://developers.google.com/workspace/meet/api/guides/overview
- **Autenticación**: https://developers.google.com/workspace/meet/api/guides/authenticate-authorize
- **Anuncio GA**: https://workspaceupdates.googleblog.com/2024/02/google-meet-api-now-generally-available.html