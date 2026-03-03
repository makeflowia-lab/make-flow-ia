# Make Flow IA — Plataforma de Videoconferencias

> Clon funcional de Webex construido con Next.js 16, LiveKit Cloud y Neon PostgreSQL.
> Proyecto completo: autenticación, dashboard, sala de reuniones con video/audio en tiempo real.

---

## Índice

1. [Visión general](#1-visión-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura del proyecto](#3-arquitectura-del-proyecto)
4. [Base de datos](#4-base-de-datos)
5. [Autenticación](#5-autenticación)
6. [Dashboard](#6-dashboard)
7. [Flujo de reunión](#7-flujo-de-reunión)
8. [Sala de video (LiveKit)](#8-sala-de-video-livekit)
9. [Variables de entorno](#9-variables-de-entorno)
10. [Instalación y arranque](#10-instalación-y-arranque)
11. [Problemas encontrados y soluciones](#11-problemas-encontrados-y-soluciones)

---

## 1. Visión general

**Make Flow IA** es una plataforma SaaS de videoconferencias empresarial que replica la experiencia de Webex. Permite crear reuniones, invitar participantes, y realizar videollamadas con hasta 200 usuarios simultáneos usando infraestructura de WebRTC gestionada por LiveKit Cloud.

**Funcionalidades principales:**
- Registro e inicio de sesión con JWT
- Dashboard con estadísticas de reuniones
- Crear, buscar y eliminar reuniones
- Sala de pre-unión con previsualización de cámara y selección de dispositivos
- Sala de reunión con video, audio y compartir pantalla en tiempo real
- Panel de diseño (layout) y panel de invitación
- Reacciones en vivo, menú de opciones, pantalla completa

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Estilos | Tailwind CSS | 4.x |
| Video en tiempo real | LiveKit Cloud | SDK v2 |
| Base de datos | Neon PostgreSQL (serverless) | — |
| Autenticación | JWT con `jose` + `bcryptjs` | — |
| Estado global | Zustand | 5.x |
| Validación | Zod | 3.x |
| Iconos | Lucide React | 0.469 |
| Build | Turbopack | — |

---

## 3. Arquitectura del proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas públicas
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                   # Rutas protegidas
│   │   ├── dashboard/page.tsx
│   │   └── meetings/[id]/page.tsx
│   ├── api/
│   │   ├── auth/                 # login, logout, register, me
│   │   └── meetings/             # CRUD + generación de token LiveKit
│   ├── globals.css
│   └── layout.tsx
│
├── features/
│   ├── auth/components/          # LoginForm, RegisterForm, AuthProvider
│   └── meetings/components/      # MeetingCard, MeetingRoom, PreJoinLobby,
│                                 # CreateMeetingModal
│
└── shared/
    ├── components/ui/            # Button, Input, Modal, Badge
    ├── lib/                      # db.ts, jwt.ts, livekit.ts, validations.ts
    ├── store/                    # authStore (Zustand)
    └── types/                    # User, Meeting, JwtPayload, etc.
```

**Patrón de rutas:**
- `/login` y `/register` → acceso libre
- `/dashboard` → requiere cookie `auth_token` válida
- `/meetings/[id]` → requiere autenticación + reunión existente

---

## 4. Base de datos

**Proveedor:** Neon PostgreSQL (serverless HTTP, sin WebSockets)

### Tablas

#### `users`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
email         VARCHAR(255) UNIQUE NOT NULL
name          VARCHAR(255) NOT NULL
password_hash VARCHAR(255) NOT NULL
avatar        TEXT
role          VARCHAR(50) DEFAULT 'user'  -- 'admin' | 'user'
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
```

#### `meetings`
```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
title            VARCHAR(255) NOT NULL
description      TEXT
host_id          UUID REFERENCES users(id) ON DELETE CASCADE
room_name        VARCHAR(255) UNIQUE NOT NULL   -- nombre de sala en LiveKit
status           VARCHAR(50) DEFAULT 'scheduled' -- 'scheduled' | 'active' | 'ended'
starts_at        TIMESTAMPTZ
ended_at         TIMESTAMPTZ
max_participants INTEGER DEFAULT 200
created_at       TIMESTAMPTZ DEFAULT NOW()
updated_at       TIMESTAMPTZ DEFAULT NOW()
```

#### `meeting_participants`
```sql
id          UUID PRIMARY KEY
meeting_id  UUID REFERENCES meetings(id) ON DELETE CASCADE
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
role        VARCHAR(50) DEFAULT 'participant'  -- 'host' | 'co-host' | 'participant'
joined_at   TIMESTAMPTZ DEFAULT NOW()
left_at     TIMESTAMPTZ
UNIQUE(meeting_id, user_id)
```

#### `audit_logs`
```sql
id         UUID PRIMARY KEY
user_id    UUID REFERENCES users(id) ON DELETE SET NULL
action     VARCHAR(255) NOT NULL
resource   VARCHAR(255)
metadata   JSONB
ip_address INET
created_at TIMESTAMPTZ DEFAULT NOW()
```

### Migración
```bash
node db/migrate.mjs
```
El script aplica `db/schema.sql` a Neon usando el cliente serverless HTTP.

---

## 5. Autenticación

**Sistema:** JWT en cookie `HttpOnly` con duración de 8 horas.

### Flujo de registro
1. Usuario envía `name`, `email`, `password`
2. Validación con Zod (`registerSchema`)
3. Verificar que el email no exista
4. Hash de contraseña con `bcryptjs` (12 rounds)
5. Insertar usuario en DB
6. Generar JWT con `jose` → `signToken({ sub, email, name, role })`
7. Setear cookie `auth_token` (HttpOnly, SameSite=lax)
8. Retornar datos del usuario

### Flujo de login
1. Usuario envía `email`, `password`
2. Buscar usuario por email
3. Comparar contraseña con `bcrypt.compare`
4. Generar JWT y setear cookie
5. Retornar datos del usuario

### Protección de rutas
`AuthProvider` (cliente) llama a `/api/auth/me` al montar:
- Si retorna 200 → guarda usuario en Zustand store
- Si retorna 401 → redirige a `/login`

```typescript
// shared/store/authStore.ts
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  },
}));
```

### Endpoints de autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión (borra cookie) |
| GET | `/api/auth/me` | Obtener usuario autenticado |

---

## 6. Dashboard

Pantalla principal después del login. Muestra:

- **Header sticky:** logo, botón "Nueva reunión", avatar con menú de usuario
- **Bienvenida:** saludo con nombre del usuario
- **Tarjetas de estadísticas:** reuniones activas / programadas / finalizadas
- **Buscador** de reuniones por título
- **Grid de tarjetas** con cada reunión (estado, participantes, fecha, acciones)

### Endpoints de reuniones
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/meetings` | Listar reuniones del usuario |
| POST | `/api/meetings` | Crear reunión |
| GET | `/api/meetings/[id]` | Obtener detalle de reunión |
| DELETE | `/api/meetings/[id]` | Eliminar reunión |
| POST | `/api/meetings/[id]/token` | Generar token LiveKit para unirse |

### Crear reunión
El modal solicita:
- **Título** (requerido)
- **Descripción** (opcional)
- **Máximo de participantes** (slider 2–200)

Al crear, se genera un `room_name` único (UUID) que se usa como identificador de sala en LiveKit.

---

## 7. Flujo de reunión

El flujo de unirse a una reunión tiene tres etapas manejadas por `MeetingPage`:

```
loading → lobby → room
```

### Etapa 1: Loading
Carga los datos de la reunión desde la API.

### Etapa 2: PreJoinLobby
Pantalla previa a la reunión donde el usuario puede:

- **Previsualizar su cámara** antes de entrar
- **Silenciar/activar** micrófono
- **Activar/desactivar** cámara
- **Seleccionar dispositivo** mediante el menú `▼` (selector de cámara y micrófono)
- Ver errores claros si la cámara no está disponible

```
Motivos de error detectados:
- NotAllowedError   → "Permiso de cámara denegado"
- NotFoundError     → "No se encontró ninguna cámara"
- NotReadableError  → "La cámara está en uso por otra aplicación"
```

El estado de audio/video elegido aquí se pasa a la sala de reunión.

### Etapa 3: MeetingRoom
Al hacer clic en "Iniciar reunión":
1. Se detienen los tracks de la cámara/micrófono del lobby
2. Se hace POST a `/api/meetings/[id]/token` para obtener el token JWT de LiveKit
3. Se monta `MeetingRoom` con el token y el estado de media del lobby

---

## 8. Sala de video (LiveKit)

### Generación de token
```typescript
// shared/lib/livekit.ts
const at = new AccessToken(apiKey, apiSecret, {
  identity: participantIdentity,  // user.id
  name: participantName,
  ttl: "8h",
});

at.addGrant({
  room: roomName,
  roomJoin: true,
  canPublish: true,
  canSubscribe: true,
  canPublishData: true,
  roomAdmin: isHost,
  roomRecord: isHost,
});
```

Cuando el anfitrión entra, la reunión se actualiza a `status: 'active'` en la base de datos.

### Componentes de la sala

```
MeetingRoom
├── LiveKitRoom (contexto de conexión)
│   ├── Top bar (Atrás | Título | Diseño | Información | Copiar | Cerrar)
│   ├── VideoGrid (GridLayout + ParticipantTile de LiveKit)
│   ├── RoomAudioRenderer
│   └── MeetingControlBar
│       ├── DesignPanel (panel lateral derecho — layouts y opciones)
│       ├── InvitePanel (panel lateral derecho — invitar personas)
│       ├── MoreOptionsMenu (menú flotante central)
│       ├── ReactionsBar (barra de emojis)
│       └── Barra de controles inferior
│           ├── Izquierda: Subtítulos 💬
│           ├── Centro: ControlBar LiveKit + 😊 + ··· + Salir
│           └── Derecha: Diseño | Participantes | Invitar
```

### VideoGrid — implementación correcta
Se reemplazó `<VideoConference />` (que incluye su propia barra de controles) por un grid propio usando los hooks de LiveKit:

```typescript
function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout tracks={tracks} style={{ height: "100%", width: "100%" }}>
      <ParticipantTile />
    </GridLayout>
  );
}
```

> **Por qué no `withPlaceholder: true`:** Causa un error de reconciliación en React cuando el track placeholder transiciona al track real, ya que los IDs no coinciden y `GridLayout` no puede resolverlo.

### Opciones de LiveKit
```typescript
<LiveKitRoom
  video={videoEnabled}   // estado real del lobby
  audio={audioEnabled}
  options={{ adaptiveStream: true, dynacast: true }}
>
```

- `adaptiveStream`: ajusta la resolución del video según el ancho de banda
- `dynacast`: publica múltiples capas de calidad para optimizar el consumo

### DesignPanel — funcionalidades
- **Cuadrícula / Agrupado / Uno junto a otro**: cambia el estado `layout` en el componente padre
- **Pantalla completa**: llama a `document.documentElement.requestFullscreen()` / `exitFullscreen()`
- **Ocultar nombres**: toggle visual (estado local)

### ReactionsBar
Muestra un picker con 6 reacciones: 👍 ❤️ 😂 😮 👏 🎉
Al seleccionar una, hace un efecto de escala y se cierra automáticamente.

---

## 9. Variables de entorno

Archivo: `.env.local` en la raíz del proyecto.

```env
# Base de datos Neon PostgreSQL
DATABASE_URL="postgresql://usuario:password@host/neondb?sslmode=require&channel_binding=require"

# Firma de tokens JWT
JWT_SECRET="tu-secreto-seguro-aqui"

# LiveKit Cloud
LIVEKIT_API_KEY="tu-api-key"
LIVEKIT_API_SECRET="tu-api-secret"
NEXT_PUBLIC_LIVEKIT_URL="wss://tu-proyecto.livekit.cloud"

# URL de la app
NEXT_PUBLIC_APP_URL="http://localhost:3005"
```

> `NEXT_PUBLIC_*` se expone al cliente. El resto solo existe en el servidor.

---

## 10. Instalación y arranque

### Requisitos
- Node.js 20+
- Cuenta en [Neon](https://neon.tech) (PostgreSQL serverless gratuito)
- Cuenta en [LiveKit Cloud](https://livekit.io) (free tier disponible)

### Pasos

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# → editar .env.local con tus credenciales

# 3. Aplicar esquema de base de datos
node db/migrate.mjs

# 4. Arrancar en desarrollo
npm run dev -- --port 3005
```

La app estará disponible en `http://localhost:3005`.

### Primer uso
No hay usuarios predefinidos. Ve a `/register`, crea tu cuenta y accede con esas credenciales.

### Comandos disponibles
```bash
npm run dev       # desarrollo con Turbopack
npm run build     # compilar para producción
npm run start     # iniciar en producción
npm run typecheck # verificar tipos TypeScript
npm run lint      # linting con ESLint
```

---

## 11. Problemas encontrados y soluciones

Esta sección documenta los bugs reales que surgieron durante el desarrollo y cómo se resolvieron. Útil como referencia para proyectos similares con Next.js + LiveKit.

---

### P1 — Doble barra de controles en la sala de reunión

**Síntoma:** Al entrar a la reunión aparecían DOS filas de botones de control (micrófono, cámara, etc.) superpuestas.

**Causa:** Se estaba usando `<VideoConference />` de LiveKit, que es un componente todo-en-uno que incluye su propio `<ControlBar>` integrado. Al mismo tiempo, el componente `MeetingControlBar` también renderizaba un `<ControlBar>` de LiveKit encima, resultando en dos barras visibles.

**Intento fallido:** Intentar ocultar la barra interna de `VideoConference` mediante CSS:
```css
/* Esto NO funcionó */
.lk-video-conference .lk-control-bar { display: none !important; }
```
El CSS no tuvo efecto porque la barra se monta fuera del nodo esperado en algunas versiones del SDK.

**Solución correcta:** Reemplazar `<VideoConference />` por un componente propio que usa solo las partes necesarias de LiveKit:
```typescript
function VideoGrid() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ], { onlySubscribed: false });

  return (
    <GridLayout tracks={tracks} style={{ height: "100%", width: "100%" }}>
      <ParticipantTile />
    </GridLayout>
  );
}
```
Esto elimina la barra duplicada y permite control total sobre los controles.

---

### P2 — Error de React: "Element not part of the array" en GridLayout

**Síntoma:**
```
Element not part of the array: xxx_camera_placeholder not in xxx_camera_TR_VCV3i2aGKo5kff
```

**Causa:** Se usaba `withPlaceholder: true` en `useTracks`. LiveKit crea un track temporal con ID `_camera_placeholder` mientras espera el track real. Cuando el track real llega con un ID diferente (`_camera_TR_xxx`), React no puede reconciliar el cambio en `GridLayout` y lanza el error.

**Solución:**
```typescript
// ❌ Causa el error
{ source: Track.Source.Camera, withPlaceholder: true }

// ✅ Correcto
{ source: Track.Source.Camera, withPlaceholder: false }
```

---

### P3 — La cámara no se mostraba al reactivarla en el lobby

**Síntoma:** En la pantalla de pre-unión, si el usuario desactivaba la cámara y luego la volvía a activar, el preview permanecía negro/vacío.

**Causa:** El preview de cámara usaba renderizado condicional:
```typescript
// ❌ Al toggle, el elemento <video> se desmonta y remonta
{!isVideoOff ? <video ref={videoRef} ... /> : <AvatarPlaceholder />}
```
Cuando `isVideoOff` volvía a `false`, React creaba un nuevo elemento `<video>`, pero `srcObject` nunca se le reasignaba porque `initMedia()` solo corre una vez al montar.

**Solución:** Mantener `<video>` siempre en el DOM y usar `visibility` para ocultarlo:
```typescript
// ✅ El elemento siempre existe, srcObject nunca se pierde
<video
  ref={videoRef}
  className={`... ${isVideoOff ? "invisible" : ""}`}
/>
{isVideoOff && <AvatarPlaceholder />}
```

---

### P4 — `stream` stale en el cleanup del useEffect

**Síntoma:** Los tracks de la cámara del lobby no se detenían al salir, dejando el indicador de cámara activa en el sistema operativo.

**Causa:** El cleanup del `useEffect` capturaba `stream` del closure en el momento del montaje, cuando aún era `null`:
```typescript
// ❌ stream siempre es null en este closure
useEffect(() => {
  initMedia(); // setea stream de forma asíncrona
  return () => {
    stream?.getTracks().forEach(t => t.stop()); // stream = null aquí
  };
}, []);
```

**Solución:** Usar un `ref` para mantener siempre la referencia actual:
```typescript
const streamRef = useRef<MediaStream | null>(null);

useEffect(() => {
  async function initMedia() {
    const s = await navigator.mediaDevices.getUserMedia(...);
    streamRef.current = s; // ref actualizado
    setStream(s);
  }
  initMedia();
  return () => {
    streamRef.current?.getTracks().forEach(t => t.stop()); // ✅ siempre actual
    streamRef.current = null;
  };
}, []);
```

---

### P5 — Estado de cámara/micrófono del lobby ignorado en la sala

**Síntoma:** Aunque el usuario desactivaba la cámara en el lobby antes de entrar, LiveKit siempre intentaba publicar video al conectar, causando errores de negociación WebRTC.

**Causa:** `MeetingPage.handleJoin()` no aceptaba los parámetros que le enviaba `PreJoinLobby`:
```typescript
// ❌ Los parámetros se pierden
async function handleJoin() { // sin parámetros
  // siempre usa video={true} en LiveKitRoom
}

// PreJoinLobby llama:
onJoin(!isMuted, !isVideoOff) // estos valores se ignoran
```

**Solución:** Propagar el estado de media a través de toda la cadena:
```typescript
// MeetingPage
async function handleJoin(audioEnabled: boolean, videoEnabled: boolean) {
  setMediaState({ video: videoEnabled, audio: audioEnabled });
  // ...obtener token...
}

// MeetingRoom
<LiveKitRoom
  video={videoEnabled}  // ✅ estado real del usuario
  audio={audioEnabled}
>
```

---

### P6 — Errores de consola de LiveKit: "cannot send signal request before connected"

**Síntoma:**
```
cannot send signal request before connected, type: trickle
cannot send signal request before connected, type: offer
failed to negotiate after removing track due to failed add track request
```

**Causa:** En React (especialmente con Turbopack en desarrollo), los componentes pueden montarse y ejecutar efectos antes de que el WebSocket de LiveKit esté completamente conectado. El SDK intenta enviar mensajes de señalización WebRTC antes de que el canal esté listo.

**Soluciones aplicadas:**

1. Deshabilitar React StrictMode para evitar el doble-montaje en desarrollo:
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: false,
};
```

2. Activar opciones que mejoran la gestión de conexión en LiveKit:
```typescript
<LiveKitRoom
  options={{ adaptiveStream: true, dynacast: true }}
>
```

3. Pasar `video={false}` cuando el usuario desactivó la cámara en el lobby, evitando que LiveKit intente negociar un track que no existe.

> **Nota:** Algunos de estos errores son warnings internos del SDK de LiveKit y no siempre representan un fallo visible para el usuario. LiveKit los maneja internamente con reintentos.

---

### P7 — Botones de la interfaz sin funcionalidad

**Síntoma:** Varios botones visibles en la sala de reunión no hacían nada al pulsarlos.

**Causa:** El estado de los paneles (`showDesign`, `showInvite`) estaba aislado dentro de `MeetingControlBar`, pero los botones del top bar (fuera de ese componente) tenían su propio estado local desconectado. Además, `TopBarBtn` era un componente genérico que solo alternaba un estado visual interno.

**Botones afectados:**
- "Diseño" en el top bar → no abría el panel lateral
- "Información" en el top bar → no hacía nada
- Botón `Copy` → sin handler
- Botón `😊` reacciones → sin handler
- Botón `MessageSquareWarning` → sin handler

**Solución:** Subir el estado compartido (`showDesign`, `showInvite`) al componente padre `MeetingRoom` y pasarlo como props a todos los componentes que lo necesitan:

```typescript
// MeetingRoom — estado compartido
const [showDesign, setShowDesign] = useState(false);
const [showInvite, setShowInvite] = useState(false);

// Top bar — conectado al mismo estado
<button onClick={() => setShowDesign(!showDesign)}>Diseño</button>

// MeetingControlBar — recibe el mismo estado como prop
<MeetingControlBar
  showDesign={showDesign}
  setShowDesign={setShowDesign}
  showInvite={showInvite}
  setShowInvite={setShowInvite}
/>
```

Adicionalmente:
- `😊` → abre una barra de reacciones con emojis reales
- Botón Copy → llama a `navigator.clipboard.writeText(meetingUrl)`
- Fullscreen en DesignPanel → llama a `document.documentElement.requestFullscreen()`

---

### P8 — La cámara no se detectaba en el lobby

**Síntoma:** El preview mostraba solo el avatar sin ningún mensaje de error, haciendo imposible saber si era un problema de permisos, hardware, o si la cámara estaba en uso.

**Causa original:** El bloque `catch` de `getUserMedia` solo hacía `setIsVideoOff(true)` silenciosamente, sin distinguir el tipo de error.

**Solución:** Solicitar cámara y micrófono por separado para mayor resiliencia, y mostrar mensajes de error específicos:

```typescript
try {
  videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
} catch (err) {
  setIsVideoOff(true);
  const name = err instanceof Error ? err.name : "";
  if (name === "NotAllowedError") {
    setMediaError("Permiso de cámara denegado. Habilítalo en el navegador.");
  } else if (name === "NotFoundError") {
    setMediaError("No se encontró ninguna cámara en este dispositivo.");
  } else if (name === "NotReadableError") {
    setMediaError("La cámara está en uso por otra aplicación.");
  }
}
```

Si la cámara falla pero el micrófono funciona (o viceversa), la sesión continúa con lo que esté disponible.

---

## Lecciones aprendidas

1. **LiveKit `VideoConference` es todo-en-uno** — Si necesitas personalizar los controles, usa los componentes individuales (`GridLayout`, `ParticipantTile`, `ControlBar`) en lugar de `VideoConference`.

2. **`withPlaceholder: true` causa problemas de reconciliación** — Evítalo en `useTracks` para `GridLayout`. Solo úsalo si manejas la transición de placeholder manualmente.

3. **Los refs son esenciales en cleanups asíncronos** — Cuando un `useEffect` con deps `[]` hace operaciones async que actualizan estado, el cleanup no puede acceder a ese estado actualizado. Usa `useRef` como solución.

4. **El estado debe vivir donde se necesita** — Si múltiples componentes necesitan el mismo estado, súbelo al ancestro común. Los estados locales desconectados crean ilusión de funcionalidad.

5. **React StrictMode + LiveKit = problemas en dev** — El doble-montaje de StrictMode genera conexiones duplicadas a LiveKit, causando errores de señalización. Deshabilitar `reactStrictMode` en desarrollo resuelve esto.

6. **Pedir permisos de media por separado** — `getUserMedia({ video: true, audio: true })` falla completamente si cualquiera de los dos no está disponible. Pedirlos por separado da mejor experiencia al usuario.

---

### P9 — Error de compilación: 'meetingTitle' no encontrado en MeetingControlBar

**Síntoma:** El build de producción fallaba con error de tipos en `MeetingRoom.tsx` indicando que no se encontraba `meetingTitle` dentro del componente hijo.

**Causa:** Se agregó el componente `InvitePanel` dentro de `MeetingControlBar` el cual requiere `meetingTitle`, pero este no se estaba pasando como prop desde el componente padre.

**Solución:** Se actualizó la interfaz de props de `MeetingControlBar` para incluir `meetingTitle` y se propagó el valor desde `MeetingRoom`.

---

### P10 — Error de plataforma en Vercel (EBADPLATFORM)

**Síntoma:** El despliegue en Vercel fallaba durante la instalación de dependencias con errores relacionados con `@tailwindcss/oxide-win32-x64-msvc`.

**Causa:** El archivo `package.json` incluía dependencias nativas de Windows que son incompatibles con el entorno Linux de Vercel. Además, el `package-lock.json` generado en Windows forzaba versiones incompatibles.

**Solución:** 
1. Se eliminaron manualmente las referencias a binarios `-win32-` del `package.json`.
2. Se añadió `package-lock.json` al `.gitignore` para permitir que Vercel genere su propio árbol de dependencias.
3. Se forzó una limpia de caché local ejecutando `del package-lock.json && npm install`.

---

*Documentación actualizada tras el despliegue final — v0.1.1*
