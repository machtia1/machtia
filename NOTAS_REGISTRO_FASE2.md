# Cambios aplicados — Registro Fase 2 completo

## Qué se agregó

**Corregido (importante):**
- El link de invitación que se ve en el Dashboard ya no dice
  `clubmachtia.com/r/...` (esa ruta nunca existió) — ahora dice
  `machtiaeducacion.com/invitacion/...`, que sí coincide con la ruta
  real de tu app
- `src/app/invitacion/[invitador]/page.tsx` ya no solo "adivina" el
  nombre del invitador a partir del texto del link — ahora busca al
  usuario real en la base de datos por su `linkInvitacion`. Si el
  link no corresponde a nadie o el invitador no está activo, muestra
  un mensaje amable en vez de dejar pasar a cualquiera

**Nuevo:**
- `src/lib/brevo.ts` — envía correos reales vía la API de Brevo (ver
  sección de configuración abajo)
- `src/lib/ubicaciones.ts` — catálogo de países con su lada
  telefónica + los 32 estados de México
- `src/app/api/preregistro/route.ts` — Fase 1 real: guarda el
  preregistro en la base de datos y manda el correo de confirmación
- `src/app/api/preregistro/[token]/route.ts` — valida el token del
  correo y trae los datos para precargar el formulario
- `src/app/api/registro/route.ts` — Fase 2 real: crea el usuario de
  verdad, sube el comprobante de pago a Vercel Blob, y lo deja en
  estado `PENDIENTE_APROBACION`
- `src/app/registro/[token]/page.tsx` + `RegistroCompleto.tsx` — el
  formulario completo: apellido, país/estado/ciudad, teléfono con
  lada automática, elegir suscripción, contraseña y subir comprobante

**Modificado:**
- `src/components/InvitacionLanding.tsx` — ya no simula el envío,
  llama al API real. Si Brevo todavía no está conectado, muestra el
  link de confirmación directo en pantalla (con una etiqueta de
  "modo desarrollo" bien visible) para que puedas seguir probando
  sin bloquearte
- `package.json` — se agregó `@vercel/blob`

## Configuración que TÚ tienes que hacer (no es código)

### 1. Vercel Blob (para guardar los comprobantes de pago)

1. Ve a tu proyecto en Vercel → pestaña **Storage** → **Create Database**
   → elige **Blob**
2. Al crearlo, Vercel agrega automáticamente la variable
   `BLOB_READ_WRITE_TOKEN` a tu proyecto — no tienes que copiarla a
   mano
3. Agrega esa misma variable a tu `.env` local (cópiala del panel de
   Vercel) para poder probar en tu máquina también

### 2. Brevo — la API Key real (NO es el correo/contraseña que te dio Daniel)

1. Entra a https://app.brevo.com con `tumbdanielbg@gmail.com` y la
   contraseña que te compartió
2. Ve a tu perfil (arriba a la derecha) → **SMTP & API**
3. En la pestaña **API Keys**, dale a **Generate a new API key**
4. Copia esa clave y agrégala a tu `.env`:
   ```
   BREVO_API_KEY="la-clave-que-copiaste"
   ```
5. Agrega la misma variable en Vercel (Environment Variables, los 3
   entornos, igual que hiciste con `DATABASE_URL` y `JWT_SECRET`)

Mientras `BREVO_API_KEY` no esté puesta, el sistema sigue funcionando
en "modo desarrollo": no manda el correo real, pero te muestra el
link de confirmación directo en pantalla para que puedas seguir
probando todo el flujo sin quedarte trabado.

## Qué correr

```
npm install
npx tsc --noEmit
git add .
git commit -m "Registro Fase 2 completo: ubicacion, telefono, suscripcion y comprobante"
git push machtia main
```

No hace falta correr migración esta vez — el schema no cambió, todos
los campos que se usan ya existían.

## Cómo probar todo el flujo de punta a punta

1. Entra a tu propio link de invitación:
   `https://machtia-4tz4-git-main-machtia-9927.vercel.app/invitacion/<tu-linkInvitacion>`
   (tu `linkInvitacion` lo puedes ver en el Dashboard, dentro del
   link de invitación que ahí se muestra)
2. Llena el preregistro (nombre + correo) — dale "Continuar"
3. Si Brevo no está conectado todavía, vas a ver el link de
   confirmación directo en pantalla — dale clic
4. Llena el formulario completo (apellido, ubicación, teléfono,
   elige una suscripción, pon una contraseña, sube cualquier imagen
   como comprobante de prueba)
5. Al enviarlo, deberías ver "¡Registro recibido!"
6. Entra a Prisma Studio (`npx prisma studio`) y revisa la tabla
   `User` — ahí debería aparecer el nuevo usuario con
   `status: PENDIENTE_APROBACION` y su `comprobantePagoUrl` apuntando
   a un archivo real en Vercel Blob

## Qué sigue pendiente después de esto

- El usuario nuevo queda en `PENDIENTE_APROBACION` — todavía no
  puede iniciar sesión hasta que un Administrador lo apruebe (eso es
  el siguiente pendiente: "Panel para aprobar comprobantes de pago y
  activar cuentas")
- Ese es también el momento exacto donde hay que llamar a
  `registrarRegaliasRedAlterna(usuarioId)` (ya construido, ver
  `NOTAS_RED_ALTERNA.md`) para que se generen las regalías de la Red
  Alterna si la campaña sigue activa
