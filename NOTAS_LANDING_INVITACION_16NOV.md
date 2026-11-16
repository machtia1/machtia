# Página de invitación, nombre "Machtia" e ícono — 16 nov 2026 (rediseño 2)

## Qué hay
1. **Nombre al compartir el enlace:** el sitio se llama "Machtia" (pestaña y vista previa en WhatsApp/Facebook), con imagen `public/brand/og-machtia.jpg`. Archivo: `src/app/layout.tsx`.
2. **Ícono del sitio:** `src/app/favicon.ico`, `icon.png`, `apple-icon.png`.
3. **Página de invitación** (`/invitacion/[invitador]` y `/invitacion-restringida/[token]`, mismo componente: `src/components/InvitacionLanding.tsx`), en estilo claro según la referencia del cliente:
   - Encabezado con logo y "Aprende, Ayuda y Gana". Franja azul con contadores encadenados ("Esta oferta termina en:"): 20 nov → 26 nov → 3 dic, todos a las 00:00 hora del centro de México; pasada la última desaparece toda la franja. Usan la hora del servidor (`/api/hora`).
   - Título "Descubre lo que puedes hacer con Machtia®", subtítulo sin duración, y la etiqueta "Te invita: <nombre>" (siempre visible como referencia).
   - **Video 1** (bienvenida): arranca solo y en silencio, con "Activar sonido"; barra de avance solo informativa (no se puede adelantar), pausa/reanudar, sonido y pantalla completa. Al terminar aparecen **"Sí, quiero saber más →"** y **"Repetir video"**.
   - Al tocar "Sí, quiero saber más", el **Video 2** (presentación) reemplaza al primero en el mismo recuadro (con sonido, y la barra sí se puede mover). Al terminar aparecen **"Preguntas frecuentes"** (despliega el asistente), **"Contactar a un asesor"** (WhatsApp) y **"Repetir video"**.
   - **"Quiero registrarme"**: botón fijo, siempre visible, con borde luminoso que late. Al tocarlo se despliega el formulario de preregistro (que permanece oculto hasta entonces) y baja a él. El botón se oculta mientras el formulario está a la vista. El proceso de preregistro no cambió.
   - Los botones de cada paso solo aparecen al terminar el video correspondiente; al repetir el video vuelven a ocultarse.
   - Si un video aún no está cargado, la página dice "próximamente" y deja continuar.

## Dónde se cambia cada cosa (`src/lib/landingConfig.ts`)
- **Fechas y texto de los contadores:** `ETAPAS_CONTADOR`.
- **Videos:** `VIDEO_BIENVENIDA` y `VIDEO_PRESENTACION` (archivo en `/public/videos` o dirección `https://...`). También con las variables de Vercel `NEXT_PUBLIC_VIDEO_BIENVENIDA` y `NEXT_PUBLIC_VIDEO_PRESENTACION` (requieren nuevo despliegue). Imagen previa opcional: `NEXT_PUBLIC_POSTER_BIENVENIDA` / `NEXT_PUBLIC_POSTER_PRESENTACION`.
- **WhatsApp del asesor:** `WHATSAPP_ASESOR` (hoy el número de pruebas) o variable `NEXT_PUBLIC_WHATSAPP_ASESOR`. Mensaje: `MENSAJE_WHATSAPP`; se agrega "Me invitó: ..." solo cuando la invitación viene de una persona.
- **Preguntas frecuentes:** `PREGUNTAS_FRECUENTES` (las 3 actuales son provisionales y solo describen lo que la plataforma ya hace).
- **Colores:** `navy`, `tinta` y `cian` en `tailwind.config.ts`.

## Pendiente del cliente
- Los dos videos finales (se recomienda alojarlos fuera del repositorio).
- Preguntas y respuestas definitivas, y el número definitivo del asesor.
- Página informativa en el dominio de regalo (requiere el desarrollo en IA y reclamar el dominio en Vercel).

## Notas técnicas
- La imagen de vista previa usa `NEXT_PUBLIC_SITE_URL` o, si no existe, `NEXT_PUBLIC_APP_URL` (la de los correos); si ambas faltan o están mal escritas, usa https://www.machtiaeducacion.com.
- Los navegadores no permiten arrancar un video con sonido sin que la persona toque algo; por eso el primer video inicia en silencio. En el Video 2 se intenta con sonido porque la persona ya tocó un botón; si el navegador lo impide, arranca en silencio y muestra "Activar sonido".
- El bloqueo de adelantar el Video 1 se aplica desde el navegador (funciona para casi todas las personas, no es infalible).
- WhatsApp y Facebook guardan en memoria la vista previa de un enlace ya compartido; los enlaces nuevos mostrarán "Machtia", los anteriores pueden tardar en actualizarse.
