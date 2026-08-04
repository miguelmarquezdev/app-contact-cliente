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

Esta versión incluye soporte PWA para poder instalar Sunbeam App en el celular.

### Android / Chrome
1. Abre la app en Chrome.
2. Inicia sesión una vez.
3. Toca el aviso “Instalar app” o el menú de Chrome ⋮.
4. Elige “Agregar a pantalla principal” o “Instalar app”.

### iPhone / Safari
1. Abre la app en Safari.
2. Toca el botón Compartir.
3. Elige “Agregar a pantalla de inicio”.
4. Confirma el nombre Sunbeam App.

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

## v45 - Offline mejorado

- Navegación offline más estable: si el usuario cambia de pestaña sin internet, la app usa la última pantalla guardada por el service worker.
- El service worker cachea páginas, assets, respuestas RSC/Next y lecturas GET de Supabase.
- En modo offline, los enlaces internos fuerzan navegación normal para evitar que Next.js se quede esperando datos remotos.
- El chat guarda sala, últimos mensajes, preview y orden de contactos en localStorage para lectura offline de conversaciones ya abiertas antes.
- El chat sigue sin poder enviar mensajes sin internet; al volver la conexión recupera el modo realtime.

## v47 - Tours base, hoteles y autollenado de itinerarios

Ejecuta en Supabase SQL Editor:

```txt
supabase/migration-v47-tour-hotel-itinerary-templates.sql
```

Nuevas funciones:

- En `/tours` ahora creas tours base con ruta, descripción, notas de comida y stops.
- En `/hotels` registras hoteles/alojamientos para usarlos en los itinerarios.
- En el constructor de itinerarios, en cada día el campo “Ruta o tour” permite seleccionar un tour base.
- Al seleccionar un tour se llenan automáticamente título, ruta, descripción y stops.
- La comida ahora tiene select: Desayuno, Almuerzo o Cena, más detalle de la comida.
- El alojamiento permite seleccionar un hotel registrado y luego editar el texto del día.
- Colaboradores y documentos por día siguen funcionando igual.


## V50 - Mensajes de cambios visibles en admin

- En `Prospectos > Ver` ahora se muestra una alerta cuando el prospecto solicita cambios.
- Se agregó la sección **Respuestas del prospecto** con mensajes de cambios, rechazos y aceptaciones por itinerario.
- En la lista de prospectos aparece un badge **Ver cambios** cuando hay una solicitud pendiente.
- No requiere SQL nuevo si ya ejecutaste la migración v49.
- TypeScript quedó fijado a `5.9.2` para evitar el error de TypeScript 7 con Next.js.


## V51 - Flujo completo de propuestas y versiones

Esta versión completa el flujo prospecto/cliente:

1. El admin registra un prospecto y sus necesidades.
2. El admin crea itinerario/cotización y lo envía como propuesta.
3. El prospecto puede aceptar, rechazar o solicitar cambios desde su panel.
4. Si solicita cambios, el admin ve el mensaje en el detalle del prospecto.
5. El admin puede crear una nueva versión desde esa solicitud. El sistema clona el itinerario anterior, mantiene días, stops, documentos y colaboradores, y envía la V2/V3 al prospecto con mensaje de la agencia.
6. La versión anterior queda marcada como reemplazada y el prospecto ve la nueva propuesta arriba.
7. Si acepta, pasa a cliente y queda listo para pago/compromiso y operación.

Ejecutar en Supabase si vienes de versiones anteriores:

```sql
-- SQL Editor → pegar supabase/migration-v51-proposal-version-flow.sql → Run
```

## v54 – Ajuste formal Sunbeam / ClickUp style

- Se integró el logo original de Sunbeam en `public/brand/`.
- Menos bordes exagerados: cards, botones e inputs quedan más formales.
- Iconos con colores más visibles y consistentes: navy, cobalt, sky, green y danger.
- Sidebar, header móvil y menú inferior se ven más tipo sistema SaaS/productividad.
- Tema claro mantiene la paleta principal: `#14264F`, `#FFFFFF`, `#1E40AF`, `#0EA5E9`, `#E2E8F0`.


## v56 - Imágenes de tours en Supabase Storage

Ejecuta en Supabase SQL Editor:

```sql
-- archivo: supabase/migration-v56-tour-image-storage.sql
```

Esto crea el bucket público:

```txt
tour-images
```

Desde `Tours` ya puedes subir imágenes directamente desde tu computadora o celular. Formatos: JPG, PNG, WEBP. Tamaño máximo: 8 MB.


## v61 - RLS de producción por rol y asignación

Ejecutar en Supabase SQL Editor:

```sql
-- archivo: supabase/migration-v61-production-rls.sql
```

Antes de ejecutarlo, asegúrate de que tu usuario principal tenga:

```sql
update public.profiles
set role = 'admin', position = 'Superadmin'
where email = 'TU-CORREO@DOMINIO.COM';
```

RLS ahora separa acceso para:
- Admin / Superadmin
- Ventas / Reservas / Counter
- Operaciones / Soporte
- Tour Leader / Colaborador / Guía / Conductor
- Prospecto / Cliente

Si alguna vista queda bloqueada mientras ajustamos permisos, existe un rollback temporal:

```sql
-- archivo: supabase/migration-v61-rollback-open-mvp.sql
```

## v65 - Next.js security update

Updated Next.js to `15.5.18` to satisfy Vercel security checks for vulnerable Next.js versions.
Deployment should use npm:

```txt
Install Command: npm install --no-audit --no-fund --legacy-peer-deps
Build Command: npm run build
```


## v66 - Prospecto a cliente + panel operativo

Ejecutar en Supabase SQL Editor:

```sql
-- archivo: supabase/migration-v66-client-operation-panel.sql
```

Cambios:
- Prospecto no ve ni puede abrir chat operativo.
- El chat se habilita solo cuando `lifecycle_status = client`.
- Se agregó aceptación de políticas de reserva.
- Conversión recomendada: propuesta aceptada + políticas aceptadas + pago confirmado.
- Al convertir a cliente se genera un checklist operativo en `operation_tasks`.
- En el detalle del cliente aparece el panel operativo para controlar preparación, reservas, documentos, colaboradores y chats.

## v67 - UI colaboradores, avatares, chat e imagen de itinerario

Ejecutar en Supabase SQL Editor:

```sql
-- archivo: supabase/migration-v67-avatars-itinerary-images.sql
```

Cambios:
- El admin ahora ve la foto/avatar actualizado de prospectos, clientes y colaboradores.
- Lista de colaboradores sin líneas oscuras; separadores suaves tipo lista profesional.
- Botones de acción: ver azul, editar ámbar, eliminar rojo.
- Estado activo/inactivo con colores definidos.
- Chat muestra solo hora si es hoy; si es de otro día, muestra fecha y hora.
- Itinerarios con imagen principal, preview antes de guardar y botón en estado "Guardando...".
- Lista de itinerarios minimalista con imagen, título y campanita animada si hay solicitud de cambios.

## v70 - Force itinerary UI refresh

This version keeps proposal sending only inside itinerary detail and makes the create form explicitly show "Crear itinerario base" when operational fields are hidden.
If Vercel still shows old UI, redeploy with "Clear build cache".

## v71 - Chat operativo y botones con carga

Cambios:
- Prospectos ya no aparecen en listas de chat.
- Solo clientes confirmados aparecen en chat operativo.
- Avatar actualizado de clientes/colaboradores se muestra en chat.
- Fechas de lista de chat: hora hoy, Ayer, día de semana o fecha completa.
- Enviar propuesta y Quitar muestran estado de carga.

## v72 - UX sin recarga en propuestas y avatar en chat

Cambios principales:
- Enviar/quitar propuesta de itinerario usa API client-side, actualiza el panel sin recargar toda la app.
- Botones muestran Enviando... / Quitando... con spinner real.
- El chat refresca avatar_url, nombre y rol de contactos desde profiles para mostrar fotos actualizadas.
- La API de chat bloquea abrir sala con prospectos; solo clientes confirmados pueden estar en chat operativo.
- Al actualizar avatar del cliente/colaborador se revalidan paneles y chats relacionados.
