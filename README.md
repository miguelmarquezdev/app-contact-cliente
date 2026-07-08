# Turismo Clientes App

MVP en Next.js + Tailwind + Supabase para agencia de turismo.

## Correr local

```bash
npm install
npm run dev
```

Abre:

```txt
http://localhost:3000/login
```

## Variables

Crea `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=TU_URL_DE_SUPABASE
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```

## Base de datos

Si es proyecto nuevo, ejecuta completo:

```txt
supabase/schema.sql
```

Si ya venías usando la versión anterior, ejecuta también:

```txt
supabase/migration-v4-itinerary-builder.sql
```

## Flujo de itinerarios V4

El módulo `/itineraries` ahora trabaja independiente, sin jalar tours.

Flujo correcto:

1. Nombre del itinerario, tour o paquete.
2. Día automático: Día 1, Día 2, Día 3.
3. Por cada día:
   - Título del día.
   - Ruta.
   - Comida.
   - Alojamiento.
   - Descripción del día.
4. Por cada día puedes agregar varios stops:
   - Lugar.
   - Duración.
   - Descripción.
   - Incluye ticket de ingreso.
5. Botón `+ Agregar otro día` crea el mismo bloque completo.
6. Botón final `Guardar itinerario completo` guarda todo junto.

## Usuario admin

Crea un usuario en Supabase Auth y luego actualiza su perfil:

```sql
update public.profiles set role = 'admin' where email = 'tu-correo@dominio.com';
```

## Actualización v5

Se agregó edición y eliminación de itinerarios independientes:

- Botón **Editar** en cada itinerario guardado.
- Pantalla `/itineraries/[id]/edit` para modificar el itinerario completo.
- Puedes cambiar nombre, descripción, días, comida, alojamiento y stops.
- Botón **Eliminar** para borrar el itinerario completo.
- No necesita SQL nuevo si ya ejecutaste la migración v4, porque se usan las mismas tablas y las relaciones `on delete cascade` eliminan días y stops automáticamente.

Después de reemplazar archivos:

```bash
npm install
npm run dev
```

Entra a:

```txt
http://localhost:3000/itineraries
```

## V6 - Panel de clientes y envío de itinerarios

Esta versión agrega:

- Portal del cliente con rutas `/client/dashboard`, `/client/profile` y `/client/itineraries`.
- El cliente entra con el correo y contraseña creados desde el panel de Clientes.
- Si el usuario tiene rol `client`, el sistema lo redirige automáticamente al portal cliente.
- El cliente solo ve sus itinerarios asignados desde la app.
- El cliente puede editar sus datos básicos: nombre, teléfono, país y pasaporte.
- El admin puede enviar/asignar itinerarios guardados a clientes desde `/itineraries`.

### Migración necesaria

Si ya tenías la base de datos de versiones anteriores, ejecuta en Supabase SQL Editor:

```sql
-- archivo: supabase/migration-v6-client-portal.sql
```

Pega todo el contenido de ese archivo y presiona Run.

### Flujo de uso

1. Admin crea cliente desde `/clients` con nombre, correo y contraseña.
2. Admin crea itinerario desde `/itineraries`.
3. En la tarjeta del itinerario, selecciona el cliente y presiona Enviar.
4. El cliente inicia sesión con sus credenciales.
5. El cliente entra automáticamente a `/client/dashboard`.
6. En `/client/itineraries` ve los itinerarios que recibió.
7. En `/client/profile` actualiza sus datos.


## Actualización v8: documentos y colaboradores por día

Esta versión agrega al constructor de itinerarios:

- Documentos por cada día del itinerario.
- Subida de PDF y fotos desde el formulario del día.
- Asignación de colaboradores o tour leaders por cada día.
- Visualización de documentos y equipo asignado en el panel admin y en el panel cliente.

Antes de usar esta versión, ejecuta en Supabase:

```txt
supabase/migration-v8-day-documents-collaborators.sql
```

Ruta:

```txt
Supabase → SQL Editor → New query → pegar SQL → Run
```

Luego reinicia el proyecto:

```bash
npm install
npm run dev
```

## Actualización v9 - Chat en vivo sin recargar

Ejecuta en Supabase:

```txt
supabase/migration-v9-realtime-direct-chat.sql
```

Luego reinicia el proyecto:

```bash
npm install
npm run dev
```

Rutas:

```txt
/chat
/client/chat
```

Flujo:

```txt
1. Entras al link de Chat.
2. Seleccionas el colaborador, tour leader, admin o cliente disponible.
3. Se abre una sala directa entre los dos usuarios.
4. Escribes y el mensaje aparece en vivo sin actualizar la página.
```

En Supabase debe estar activo Realtime. La migración agrega `chat_messages` a la publicación `supabase_realtime`.


## Migración v19 - Puesto del colaborador
Ejecuta en Supabase SQL Editor el archivo `supabase/migration-v19-collaborator-position.sql` para agregar el campo `position` a colaboradores y tour leaders.

## Instalación en celular como app (PWA)

Esta versión incluye soporte PWA para poder instalar Happy Manager en el celular.

### Android / Chrome
1. Abre la app en Chrome.
2. Inicia sesión una vez.
3. Toca el aviso “Instalar app” o el menú de Chrome ⋮.
4. Elige “Agregar a pantalla principal” o “Instalar app”.

### iPhone / Safari
1. Abre la app en Safari.
2. Toca el botón Compartir.
3. Elige “Agregar a pantalla de inicio”.
4. Confirma el nombre Happy Manager.

Nota: Para instalarla como app real, debe estar publicada en HTTPS, por ejemplo en Vercel. En local se puede probar con localhost, pero el uso normal en celular será desde la URL publicada.


## Nota v24 - Instalación real en celular y computadora

Se mejoró el instalador PWA para que no redirija como simple enlace.

- En Android/Chrome y computadora Chrome/Edge usa el prompt nativo de instalación cuando el navegador lo permite.
- En iPhone muestra instrucciones claras: debe abrirse en Safari y usar Compartir → Agregar a pantalla de inicio.
- Para que el botón diga “Instalar app” y no “Agregar acceso directo”, la app debe estar publicada en HTTPS y el Service Worker debe estar activo.
- En localhost puede probarse en computadora, pero en celular debe usarse una URL publicada con HTTPS, por ejemplo Vercel.

## Nota PWA Android

Esta versión usa `public/site.webmanifest` con iconos `any` y `maskable`, `display: standalone`, `start_url` y service worker actualizado para que Chrome Android muestre **Instalar app** en vez de solo **Crear acceso directo**.

Después de subir a Vercel:

1. Abre el link directamente en **Chrome Android**.
2. Borra datos/cache del sitio si antes probaste una versión anterior.
3. Espera que cargue completo.
4. Menú ⋮ → **Instalar app**.

Si todavía sale “Crear acceso directo”, abre DevTools en computadora → Application → Manifest y revisa que esté leyendo `/site.webmanifest` y que el service worker esté activo.


## Fix PWA Android / Chrome

En esta versión se corrigió el middleware para que `/site.webmanifest` y `/sw.js` no sean redirigidos al login. Esa era la causa principal de que Android mostrara solo “Crear acceso directo” en vez de “Instalar app”.

Después de subir a Vercel, borra datos del sitio en Chrome Android si ya probaste versiones anteriores:
Chrome > Configuración > Configuración de sitios > Datos almacenados > tu dominio > Borrar datos.
Luego abre nuevamente el link en Chrome y espera unos segundos.

## v40

- Se reemplazó el acceso rápido de chat en la cabecera móvil por menú de tres puntos.
- El menú de tres puntos abre un panel oscuro tipo WhatsApp con la opción “Cerrar sesión”.
- El mismo menú se agregó en la cabecera del chat, lista y conversación.
- El cierre de sesión limpia caché offline y regresa al login.
