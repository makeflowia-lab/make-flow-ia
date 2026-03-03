# Guía de Solicitudes — Make Flow IA (Videollamadas con LiveKit)

> Registro de solicitudes realizadas para construir y ajustar la plataforma.
> Úsalo como guía para replicar el proceso con Claude Code.

---

## 1. Error de contexto LiveKit

```
Tried to access LayoutContext context outside a LayoutContextProvider provider.
at MeetingControlBar (src/features/meetings/components/MeetingRoom.tsx:457:11)
```

---

## 2. Chat no funciona

```
ok el chat no funciona
```

---

## 3. Nombres no visibles en reunión

```
observacion los nombre no se ven, eso es problema porque no podriamos identificar
al participante, en el registro de formulario del host debe tener un apartado para
el nombre igualmente el participante cuando se registre e inicie sesion debe tener
la opcion de colocar su nombre
```

---

## 4. Hacer funcionar opciones del menú

```
puede hacer que funcione estas opciones
```

> (Pantalla del menú con: Copiar enlace, Iniciar pizarra, Bloquear meeting,
> Habilitar sesión de grupos, Informar problema, Opciones de Meeting, Salir)

---

## 5. Ajustar tamaño del chat

```
ajusta un poco el chat que se pierde esta muy grande verticalmente
```

---

## 6. Chat mal distribuido

```
esta mal distribuido puede ajustalo
```

---

## 7. Input del chat tapado por el menú

```
ok esta bien solo una observacion la caja del input y el boton quedan tapado
por el menu principal, diria ajustalo un poco para que se vea, dejando ese diseño
```

---

## 8. Chat debe llegar al borde del menú

```
deberia quedar la parte inferior del chat al borde del menu principal ese estaria bien
```

---

## 9. Subir el chat un poco más

```
no al contrario se bajo, era como estaba antes solo quitarle un poco de altura
para que suba verticalmente, ojo dejando ese diseño
```

---

## 10. Ajuste fino + salto de línea en input

```
un poquito mas y queda perfecto, ademas debe tener un salto de linea cuando topa
con el final del input
```

---

## 11. Backup del proyecto

```
quedo perfecto, realiza un backup martes_01_11
```

---

## 12. Consulta sobre deploy a producción (VPS Hostinger)

```
ok si recuerdas te pedi el paso a paso para pasarlo a produccion, tengo vps de
hostinger, habiendo solucionado casi todo los detalles falta algo referente a algo
que se puede romper el linx, algo twin algo no recuerdo el nombre
```

---

## 13. Suprimir errores visuales de LiveKit en consola

```
ok arreglalos o ignoralos, porque visualmente molestan y quien abe de codigo
pensara que no funciona
```

> Errores: "Abort handler called" / "Received leave request while trying to reconnect"

---

## 14. Deploy en Vercel + backup

```
observando que ya funciona puedes hacer el deploy en vercel y crear un backup
con el nombre videollamada
```

---

## 15. Deploy vía GitHub (opción 2)

```
opcion 2 ya tienes todo asi que procede
```

---

## 16. Crear MD de solicitudes para la comunidad

```
AHORA QUIERO QUE CRES UN MD PERO DE TODAS LAS SOLICITUDES QUE HE REALIZADO
PARA CREA ESTAS MODIFICACIONES, SOLO MIS SOLICITUDES OMITE TUS RESPUESTAS,
ESTO PARA QUE MIS COMPAÑEROS DE LA COMUNIDAD TENGA UNA GUIA DE COMO HACERLO,
EN ORDEN SEGUN MIS SOLICITUDES
```

---

## 17. Error de permisos LiveKit + funcionalidades rotas

```
## Error Type
Runtime SignalRequestError

## Error Message
does not have permission to update own metadata

la opcion de ocultar los nombres automaticamente no funciona,
el emoji de levantar la mano no funciona
```

---

## 18. Panel de invitación no funciona

```
una observacion en esta seccion de invitar no funciona porque deberia envia
invitacion con toda la informacion de la misma, y mostrar un mensaje de mensaje enviado
```

---

## 19. Preguntas y respuestas en español latino

```
quedo listo o no, dime que tanto haces, que falta preguntas y respuestas en español latino
```

---

## 20. Finalizar despliegue y solucionar problemas

```
terminada de hacer el deploy y solucionar cualquier problema
```

---

## 21. Corrección de errores finales (Build & Types)

1. **Error de tipos en MeetingRoom**: Se detectó que `meetingTitle` no se pasaba correctamente al componente hijo `MeetingControlBar`, rompiendo el build de producción.
2. **Dependencias multiplataforma**: Eliminación de binarios nativos de Windows del `package.json` para asegurar compatibilidad con servidores Linux (Vercel).

---

## 22. Actualización de documentación final

```
ok actualiza el md donde te pido colocar todas la implementaciones o modificaciones finales, para que lo comparta
```

---

## Notas para la comunidad

- El proyecto usa **Next.js 16 + LiveKit Cloud + Neon PostgreSQL + Tailwind CSS v4**
- `reactStrictMode: false` en `next.config.ts` es **crítico** para LiveKit
- El token de LiveKit debe incluir `canUpdateOwnMetadata: true` para levantar la mano
- Para deploy en Vercel desde Windows: el `package-lock.json` tiene binarios de Windows que fallan en Linux — eliminarlo del repo y dejar que Vercel genere uno nuevo
- Las variables de entorno en producción: `DATABASE_URL`, `JWT_SECRET`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`

---

## Preguntas Frecuentes (FAQ)

### ¿Por qué la videollamada se conecta y se desconecta en un bucle?

Probablemente `reactStrictMode` está en `true`. En Next.js con LiveKit, el doble montaje de React causa errores de "trickle/offer before connected". Solución: en `next.config.ts` colocar `reactStrictMode: false`.

---

### ¿Por qué aparece el error "Tried to access LayoutContext outside a LayoutContextProvider"?

El `ControlBar` de LiveKit necesita estar envuelto en un `<LayoutContextProvider>`. Asegurate de importarlo desde `@livekit/components-react` y envolver todos los hijos de `<LiveKitRoom>` con ese provider.

---

### ¿Por qué el chat no funciona o da error?

Si usás el hook `useLayoutContext` directamente, puede fallar antes de que el provider esté listo. La solución es usar el hook `useChat` de `@livekit/components-react` y manejar el estado del chat en el componente padre (`MeetingRoom`), sin depender de `useLayoutContext`.

---

### ¿Por qué los nombres de los participantes no se ven?

El nombre se toma del token de LiveKit. Si el usuario no tiene nombre registrado en la base de datos, el token lo manda vacío. Solución: en la ruta de token agregar un fallback:

```ts
const participantName = user.name?.trim() || user.email.split("@")[0];
```

---

### ¿Por qué "levantar la mano" da error de permisos?

LiveKit requiere el permiso `canUpdateOwnMetadata: true` en el token para que el participante pueda modificar sus propios atributos. Agregá ese campo en el `addGrant()` al generar el token.

---

### ¿Por qué "ocultar nombres" no funciona?

La solución correcta es pasar un CSS custom property via `style` inline al contenedor del tile, y en `globals.css` usar el selector:

```css
[style*="--lk-participant-name-display: none"] .lk-participant-name {
  display: none !important;
}
```

Luego, pasar la prop `hideNames` desde `MeetingRoom` hasta `VideoGrid` y aplicar ese estilo condicionalmente.

---

### ¿Por qué el build falla en Vercel con error EBADPLATFORM o @tailwindcss/oxide?

Tailwind CSS v4 instala binarios nativos específicos para cada sistema operativo. Si generaste el `package-lock.json` en Windows, los binarios de Windows no sirven en Linux.

**Solución definitiva:**

1. Eliminar `@tailwindcss/oxide-win32-x64-msvc` y `lightningcss-win32-x64-msvc` de las dependencias en `package.json`.
2. Eliminar `package-lock.json` y ejecutar `npm install` localmente.
3. Asegurarse de que `package-lock.json` esté en `.gitignore` para que Vercel genere su propio árbol de dependencias optimizado para Linux.

---

### ¿Cómo hago que el panel de invitación envíe el correo con la información de la reunión?

Usá el protocolo `mailto:` con el asunto y cuerpo pre-completados. Esto abre el cliente de correo del usuario con toda la información lista. Ejemplo:

```ts
const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
window.open(mailtoLink, "_blank");
```

Mostrá un mensaje de "Invitación enviada" con un `setTimeout` luego de abrir el link.

---

### ¿Cómo suprimir los errores de LiveKit en la consola del navegador?

Sobreescribí `console.error` al montar el componente principal y restauralo al desmontar:

```ts
useEffect(() => {
  const SUPPRESSED = [
    "Abort handler called",
    "Received leave request while trying to",
  ];
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = args[0]?.toString() ?? "";
    if (SUPPRESSED.some((s) => msg.includes(s))) return;
    original(...args);
  };
  return () => {
    console.error = original;
  };
}, []);
```

---

### ¿Cómo evitar que el input del chat quede tapado por la barra de controles?

Añadí `padding-bottom` al contenedor principal que tiene el video y el chat lateral. El valor depende de la altura de tu barra de controles — entre `pb-[72px]` y `pb-[80px]` suele funcionar con Tailwind CSS.

---

### ¿Cómo hacer que el textarea del chat crezca automáticamente con el contenido?

En el evento `onChange` del textarea, reasigná la altura:

```tsx
onChange={(e) => {
  setMessage(e.target.value);
  e.target.style.height = "auto";
  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
}}
```

Y para enviar con Enter pero insertar salto de línea con Shift+Enter:

```tsx
onKeyDown={(e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
}}
```

---

### ¿Cuáles son las variables de entorno necesarias para producción?

```
DATABASE_URL=         # URL de conexión a Neon PostgreSQL
JWT_SECRET=           # Clave secreta para firmar los tokens JWT
LIVEKIT_API_KEY=      # API Key de LiveKit Cloud
LIVEKIT_API_SECRET=   # API Secret de LiveKit Cloud
NEXT_PUBLIC_LIVEKIT_URL=  # wss://tu-proyecto.livekit.cloud
```
