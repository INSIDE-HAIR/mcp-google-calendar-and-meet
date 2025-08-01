# 📋 **PRD: Flujos Correctos para Creación y Gestión de Eventos con Google Meet**

## 🎯 **Objetivo**
Documentar los flujos correctos paso a paso para crear y gestionar eventos de calendario con Google Meet, evitando incompatibilidades entre APIs.

---

## 🛠 **Herramientas Disponibles**

### **📅 Calendar V3 API (6 herramientas)**
- `calendar_v3_list_calendars` - Listar calendarios disponibles
- `calendar_v3_list_events` - Listar eventos de un calendario
- `calendar_v3_get_event` - Obtener detalles de evento específico
- `calendar_v3_create_event` - **Crear eventos con Meet** ⭐
- `calendar_v3_update_event` - **Actualizar eventos existentes** ⭐
- `calendar_v3_delete_event` - Eliminar eventos

### **🎥 Meet V2 API (15 herramientas)**
- `meet_v2_create_space` - Crear espacios Meet independientes
- `meet_v2_get_space` - Obtener detalles de espacio
- `meet_v2_update_space` - Actualizar configuración de espacio
- `meet_v2_end_active_conference` - Finalizar conferencias activas
- `meet_v2_list_conference_records` - Listar grabaciones históricas
- `meet_v2_get_conference_record` - Detalles de conferencia específica
- `meet_v2_list_recordings` - Listar grabaciones
- `meet_v2_get_recording` - Obtener grabación específica
- `meet_v2_list_transcripts` - Listar transcripciones
- `meet_v2_get_transcript` - Obtener transcripción específica
- `meet_v2_list_transcript_entries` - Segmentos individuales de transcripción
- `meet_v2_get_participant` - Detalles de participante
- `meet_v2_list_participants` - Listar participantes
- `meet_v2_get_participant_session` - Sesión de participante
- `meet_v2_list_participant_sessions` - Listar sesiones

---

## 🎭 **CASOS DE USO Y FLUJOS CORRECTOS**

### **📝 CASO 1: Reunión de Equipo Básica**
**Escenario**: Crear reunión semanal de equipo con Meet link

#### **✅ FLUJO CORRECTO:**

**1. Verificar calendario disponible**
```javascript
calendar_v3_list_calendars()
// Response: [{id: "primary", summary: "Mi Calendario"}]
```

**2. Crear evento completo desde el inicio**
```javascript
calendar_v3_create_event({
  summary: "Reunión Semanal de Equipo",
  description: "Revisión de progreso y planificación",
  start_time: "2024-02-05T10:00:00Z",
  end_time: "2024-02-05T11:00:00Z",
  attendees: ["juan@empresa.com", "maria@empresa.com"],
  create_meet_conference: true,
  guest_can_invite_others: true,
  guest_can_modify: false,
  guest_can_see_other_guests: true,
  calendar_id: "primary"
})
```

**3. Si necesitas actualizar descripción con enlace específico**
```javascript
calendar_v3_update_event({
  event_id: "evento_id_obtenido",
  description: "Revisión de progreso\n\nEnlace Meet: meet.google.com/abc-defg-hij"
})
```

---

### **📝 CASO 2: Presentación Ejecutiva con Restricciones**
**Escenario**: Reunión ejecutiva con controles avanzados

#### **✅ FLUJO CORRECTO:**

**1. Crear evento con permisos restrictivos**
```javascript
calendar_v3_create_event({
  summary: "Presentación Q4 - Solo Ejecutivos",
  description: "Resultados financieros confidenciales",
  start_time: "2024-02-10T15:00:00Z",
  end_time: "2024-02-10T16:30:00Z",
  attendees: ["ceo@empresa.com", "cfo@empresa.com"],
  create_meet_conference: true,
  guest_can_invite_others: false,  // ⚠️ CRÍTICO
  guest_can_modify: false,
  guest_can_see_other_guests: false,
  calendar_id: "primary"
})
```

**2. Para controles avanzados adicionales, crear espacio separado**
```javascript
meet_v2_create_space({
  access_type: "RESTRICTED",
  enable_recording: true,
  enable_transcription: false,  // Confidencial
  moderation_mode: "ON",
  chat_restriction: "HOSTS_ONLY"
})
```

---

### **📝 CASO 3: Webinar Público con Grabación**
**Escenario**: Evento público que requiere grabación y transcripción

#### **✅ FLUJO CORRECTO:**

**1. Crear evento público**
```javascript
calendar_v3_create_event({
  summary: "Webinar: Tendencias Tech 2024",
  description: "Presentación abierta al público",
  start_time: "2024-02-15T18:00:00Z",
  end_time: "2024-02-15T19:30:00Z",
  attendees: [], // Sin invitados específicos
  create_meet_conference: true,
  guest_can_invite_others: true,
  guest_can_modify: false,
  guest_can_see_other_guests: false,
  calendar_id: "primary"
})
```

**2. Crear espacio Meet con configuración de webinar**
```javascript
meet_v2_create_space({
  access_type: "OPEN",
  enable_recording: true,
  enable_transcription: true,
  moderation_mode: "OFF",
  chat_restriction: "EVERYONE",
  default_role: "VIEWER"  // Audiencia solo puede ver
})
```

**3. Después del evento, obtener grabaciones**
```javascript
meet_v2_list_conference_records()
meet_v2_list_recordings({conference_record_name: "conferenceRecords/abc123"})
```

---

### **📝 CASO 4: Actualización de Evento Existente**
**Escenario**: Modificar evento ya creado manteniendo Meet

#### **✅ FLUJO CORRECTO:**

**1. Obtener evento actual**
```javascript
calendar_v3_get_event({
  event_id: "evento_existente_id",
  calendar_id: "primary"
})
```

**2. Actualizar solo campos necesarios**
```javascript
calendar_v3_update_event({
  event_id: "evento_existente_id",
  summary: "NUEVO: Reunión Semanal de Equipo",
  description: "Agenda actualizada con nuevos temas",
  // ⚠️ NO tocar create_meet_conference si ya existe
  guest_can_invite_others: false,  // Cambiar permisos si necesario
  calendar_id: "primary"
})
```

---

### **📝 CASO 5: Análisis Post-Reunión**
**Escenario**: Revisar métricas y contenido después del evento

#### **✅ FLUJO CORRECTO:**

**1. Listar conferencias recientes**
```javascript
meet_v2_list_conference_records()
```

**2. Obtener detalles específicos**
```javascript
meet_v2_get_conference_record({
  conference_record_name: "conferenceRecords/abc123"
})
```

**3. Revisar participación**
```javascript
meet_v2_list_participants({
  conference_record_name: "conferenceRecords/abc123"
})
```

**4. Obtener grabaciones y transcripciones**
```javascript
meet_v2_list_recordings({
  conference_record_name: "conferenceRecords/abc123"
})

meet_v2_list_transcripts({
  conference_record_name: "conferenceRecords/abc123"
})
```

---

### **📝 CASO 6: Formación Online Empresarial (CASO PRINCIPAL)**
**Escenario**: Empresa de formación online con múltiples sesiones, acceso abierto para estudiantes y permisos completos para consultores/profesores

#### **✅ FLUJO CORRECTO:**

**1. Verificar calendarios disponibles (por código de asignatura)**
```javascript
calendar_v3_list_calendars()
// Buscar calendario específico: "PROG-ADV-2024" o crear si no existe
```

**2. Crear evento de formación con configuración empresarial**
```javascript
calendar_v3_create_event({
  summary: "PROG-ADV-2024 - Módulo 3 (15/02/2024)",
  description: `### Descripción
Título: PROG-ADV-2024 - Módulo 3 (15/02/2024)
Fecha: Jueves, 15 de Febrero · 10:00 AM – 12:00 PM
Zona horaria: Europe/Madrid
Google Meet: Activado
Asistentes: profesor@empresa.com, consultor1@empresa.com, estudiante1@gmail.com, estudiante2@gmail.com`,
  
  start_time: "2024-02-15T09:00:00Z",  // 10:00 AM Madrid = 09:00 UTC
  end_time: "2024-02-15T11:00:00Z",    // 12:00 PM Madrid = 11:00 UTC
  time_zone: "Europe/Madrid",
  
  attendees: [
    "profesor@empresa.com",      // Consultor/Profesor
    "consultor1@empresa.com",    // Consultor/Profesor
    "estudiante1@gmail.com",     // Estudiante
    "estudiante2@gmail.com"      // Estudiante
  ],
  
  // ⭐ CONFIGURACIÓN CRÍTICA PARA FORMACIÓN:
  create_meet_conference: true,        // SIEMPRE activado
  guest_can_invite_others: true,       // Estudiantes pueden invitar
  guest_can_modify: false,             // Solo organizador modifica
  guest_can_see_other_guests: true,    // Transparencia en asistentes
  
  calendar_id: "codigo_asignatura@empresa.com"  // Calendario específico
})
```

**3. Para múltiples sesiones - Crear lote de eventos**
```javascript
// Función helper para crear serie de formaciones
const crearSerieFormacion = async (configuracion) => {
  const {
    prefijo_evento,        // "PROG-ADV-2024"
    numero_modulos,        // 8
    fechas_sesiones,       // ["2024-02-15T09:00:00Z", "2024-02-22T09:00:00Z"]
    consultores,           // ["profesor@empresa.com"]
    estudiantes,           // ["estudiante1@gmail.com", "estudiante2@gmail.com"]
    calendar_id           // "prog-adv-2024"
  } = configuracion;
  
  for (let i = 0; i < numero_modulos; i++) {
    const fecha = new Date(fechas_sesiones[i]);
    const fechaFormateada = fecha.toLocaleDateString('es-ES');
    const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
    const horaInicio = fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const horaFin = new Date(fecha.getTime() + 2*60*60*1000).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    await calendar_v3_create_event({
      summary: `${prefijo_evento} - Módulo ${i+1} (${fechaFormateada})`,
      description: `### Descripción
Título: ${prefijo_evento} - Módulo ${i+1} (${fechaFormateada})
Fecha: ${diaSemana}, ${fechaFormateada} · ${horaInicio} – ${horaFin}
Zona horaria: Europe/Madrid
Google Meet: Activado
Asistentes: ${[...consultores, ...estudiantes].join(', ')}`,
      
      start_time: fechas_sesiones[i],
      end_time: new Date(new Date(fechas_sesiones[i]).getTime() + 2*60*60*1000).toISOString(),
      time_zone: "Europe/Madrid",
      
      attendees: [...consultores, ...estudiantes],
      
      create_meet_conference: true,
      guest_can_invite_others: true,    // Estudiantes pueden compartir enlace
      guest_can_modify: false,          // Solo consultores/admin modifican
      guest_can_see_other_guests: true, // Lista visible para networking
      
      calendar_id: calendar_id
    });
  }
};

// Ejemplo de uso:
await crearSerieFormacion({
  prefijo_evento: "PROG-ADV-2024",
  numero_modulos: 8,
  fechas_sesiones: [
    "2024-02-15T09:00:00Z",
    "2024-02-22T09:00:00Z",
    "2024-03-01T09:00:00Z",
    // ... más fechas
  ],
  consultores: ["profesor@empresa.com", "consultor1@empresa.com"],
  estudiantes: ["estudiante1@gmail.com", "estudiante2@gmail.com"],
  calendar_id: "prog-adv-2024"
});
```

**4. Configuración adicional para control de acceso (opcional)**
```javascript
// Si necesitas controles más estrictos para algunos módulos
meet_v2_create_space({
  access_type: "TRUSTED",              // Solo dominio de confianza
  enable_recording: true,              // Grabar para estudiantes ausentes
  enable_transcription: true,          // Transcripción automática
  moderation_mode: "OFF",              // Profesores gestionan directamente
  chat_restriction: "EVERYONE",        // Chat abierto para preguntas
  default_role: "MEMBER"               // Estudiantes como miembros activos
})
```

**5. Verificación post-creación**
```javascript
// Verificar que todos los eventos se crearon correctamente
calendar_v3_list_events({
  calendar_id: "prog-adv-2024",
  time_min: "2024-02-01T00:00:00Z",
  time_max: "2024-05-01T00:00:00Z"
})
```

#### **🎯 CARACTERÍSTICAS ESPECÍFICAS PARA FORMACIÓN:**

- **✅ Meet SIEMPRE activado** - Cada sesión debe tener enlace
- **✅ Acceso abierto para estudiantes** - Pueden compartir enlace
- **✅ Permisos diferenciados** - Consultores vs Estudiantes
- **✅ Descripción estructurada** - Formato consistente con todos los detalles
- **✅ Zona horaria Madrid** - Importante para coordinación
- **✅ Calendarios por asignatura** - Organización clara
- **✅ Creación en lote** - Eficiencia para series de formación

#### **⚠️ CONSIDERACIONES ESPECIALES:**

- **Grabación activado** - Configurar según política de empresa
- **Lista de asistentes visible** - Fomenta networking entre estudiantes
- **Horario fijo** - Generalmente mismo día/hora cada semana
- **Backup de consultores** - Múltiples profesores por seguridad
- **Acceso por enlace** - Los estudiantes pueden unirse sin invitación formal

---

## 🚫 **ANTI-PATRONES (Lo que NO hacer)**

### **❌ FLUJO INCORRECTO:**
```javascript
// ❌ MAL: Crear evento básico primero
calendar_v3_create_event({
  summary: "Reunión",
  create_meet_conference: false  // ❌ Error
})

// ❌ MAL: Intentar agregar Meet después
calendar_v3_update_event({
  create_meet_conference: true  // ❌ Fallará
})
```

### **❌ MEZCLAR HERRAMIENTAS:**
```javascript
// ❌ MAL: Usar diferentes tools para mismo evento
google-calendar.create_event()  // Herramienta diferente
calendar_v3_update_event()      // ❌ No funcionará
```

---

## 🔑 **REGLAS DE ORO**

### **✅ HACER SIEMPRE:**
1. **Una sola herramienta por evento**: Solo `calendar_v3_*` para eventos de calendario
2. **Configuración completa inicial**: Todos los parámetros en `create_event`
3. **Verificar calendario primero**: `calendar_v3_list_calendars()`
4. **Meet API solo para gestión avanzada**: Espacios independientes o análisis post-evento

### **❌ NUNCA HACER:**
1. **Crear evento sin Meet y agregarlo después**
2. **Mezclar diferentes herramientas de calendario**
3. **Asumir que 'primary' es el calendario correcto**
4. **Updates múltiples innecesarios**

### **⚠️ CONSIDERACIONES ESPECIALES:**
- **Google Workspace Business+** requerido para funciones avanzadas
- **Grabaciones requieren activación manual** durante la reunión
- **Transcripciones necesitan licencia Gemini**
- **Espacios Meet independientes** útiles para configuraciones muy específicas

---

## 📊 **MATRIZ DE DECISIÓN**

| **Escenario** | **Herramienta Principal** | **Configuración Crítica** | **Post-Evento** |
|---------------|-------------------------|---------------------------|-----------------|
| **Reunión básica** | `calendar_v3_create_event` | `create_meet_conference: true` | `calendar_v3_get_event` |
| **Evento restrictivo** | `calendar_v3_create_event` | `guest_can_*: false` | `meet_v2_list_participants` |
| **Webinar público** | `calendar_v3_create_event` + `meet_v2_create_space` | `access_type: "OPEN"` | `meet_v2_list_recordings` |
| **Actualización** | `calendar_v3_update_event` | Mantener Meet existente | N/A |
| **Análisis** | N/A | N/A | `meet_v2_list_conference_records` |

---

## 🎯 **CONCLUSIÓN**

Este PRD garantiza flujos consistentes y evita los problemas de incompatibilidad entre APIs. La clave es:

1. **Planificar desde el inicio** - Definir todos los requerimientos antes de crear
2. **Una herramienta, un flujo** - No mezclar diferentes APIs para el mismo evento
3. **Configuración completa** - Establecer todos los parámetros en la creación inicial
4. **Meet API para análisis** - Usar las herramientas v2 solo para gestión post-evento

Siguiendo estos patrones, evitarás los errores comunes y tendrás un sistema robusto para la gestión de eventos con Google Meet.