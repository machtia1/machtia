# Página de invitación, nombre "Machtia" e ícono — 16 nov 2026

## Qué cambió
1. **Nombre al compartir el enlace:** el sitio se llama "Machtia" (título de la pestaña y vista previa en WhatsApp/Facebook), con imagen de vista previa (`public/brand/og-machtia.jpg`). Archivo: `src/app/layout.tsx`.
2. **Ícono del sitio:** `src/app/favicon.ico`, `icon.png` y `apple-icon.png`, hechos con el símbolo de Machtia.
3. **Página de invitación** (`/invitacion/[invitador]` y `/invitacion-restringida/[token]`, comparten el mismo componente):
   - Cuentas regresivas encadenadas: 20 nov → 26 nov → 3 dic, todas a las 00:00 hora del centro de México. Pasada la última desaparecen. Usan la hora del servidor (`/api/hora`), no el reloj del teléfono.
   - Primer video: arranca solo y en silencio, botón "Activar sonido", solo se puede pausar/reanudar (no adelantar). Al terminar: "Sí, quiero conocer más" / "Repetir video".
   - "Sí, quiero conocer más" muestra el video de presentación (controles normales). Al terminar sale el asistente de preguntas frecuentes con el botón de WhatsApp.
   - Botón fijo "Iniciar registro" que lleva al formulario (se oculta cuando el formulario ya está a la vista). El formulario de preregistro y la atribución del invitador no cambiaron.
   - Se quitó el botón "Conoce más en nuestro sitio".
   - Si un video aún no está cargado, la página muestra "próximamente" y deja continuar.

## Dónde se cambia cada cosa (`src/lib/landingConfig.ts`)
- **Fechas y textos de los contadores:** `ETAPAS_CONTADOR`.
- **Videos:** `VIDEO_BIENVENIDA` y `VIDEO_PRESENTACION`. Pueden ser `/videos/archivo.mp4` o una dirección `https://...`. También se pueden fijar en Vercel con las variables `NEXT_PUBLIC_VIDEO_BIENVENIDA` y `NEXT_PUBLIC_VIDEO_PRESENTACION` (requieren nuevo despliegue).
- **WhatsApp del asesor:** `WHATSAPP_ASESOR` (hoy el número de pruebas) o variable `NEXT_PUBLIC_WHATSAPP_ASESOR`. Mensaje: `MENSAJE_WHATSAPP`. Se agrega la línea "Me invitó: ..." solo cuando la invitación viene de una persona.
- **Preguntas frecuentes:** `PREGUNTAS_FRECUENTES`. Las 3 actuales son provisionales y solo describen lo que la plataforma ya hace.

## Pendiente del cliente
- Los dos videos finales (se recomienda alojarlos fuera del repositorio).
- Preguntas y respuestas definitivas, y el número definitivo del asesor.
- Texto exacto que acompaña a cada contador (hoy: "Falta para el 20 de noviembre", etc.).
- Página informativa en el dominio de regalo (requiere el desarrollo en IA y reclamar el dominio en Vercel).

## Notas técnicas
- La dirección de la imagen de vista previa usa `NEXT_PUBLIC_SITE_URL` o, si no existe, `NEXT_PUBLIC_APP_URL` (la misma de los correos); si ambas faltan o están mal escritas, usa https://www.machtiaeducacion.com.
- Los navegadores no permiten arrancar un video con sonido sin que la persona toque algo; por eso el primer video inicia en silencio. El bloqueo de adelantar solo se aplica desde el navegador.
- WhatsApp y Facebook guardan en memoria la vista previa de un enlace ya compartido; los enlaces nuevos mostrarán "Machtia", los anteriores pueden tardar en actualizarse.
