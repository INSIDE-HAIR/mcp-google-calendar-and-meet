# APIs de Google Calendar y Meet: Documentación técnica actualizada

Este reporte proporciona la documentación técnica completa y actualizada para Google Calendar API v3 (permisos de invitados) y Google Meet API v2 beta (funcionalidades avanzadas) basada en la investigación exhaustiva realizada.

## Google Calendar API v3 - Permisos de invitados

La API de Calendar permite configurar tres permisos específicos para invitados mediante propiedades booleanas en el objeto Event.

### Endpoints principales para gestión de eventos

**Events.insert - Crear eventos**
```
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
```

**Events.update - Actualizar eventos**
```
PUT https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/{eventId}
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

### Documentación oficial y recursos

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

- **Meet API v2 Reference**: https://developers.google.com/workspace/meet/api/reference/rest/v2
- **Guía general**: https://developers.google.com/workspace/meet/api/guides/overview
- **Autenticación**: https://developers.google.com/workspace/meet/api/guides/authenticate-authorize
- **Anuncio GA**: https://workspaceupdates.googleblog.com/2024/02/google-meet-api-now-generally-available.html