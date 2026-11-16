// Configuración de la página de invitación (/invitacion/... y /invitacion-restringida/...).
// Todo lo que el cliente puede querer cambiar (fechas, videos, WhatsApp, preguntas)
// está aquí, en un solo lugar.

// ───────── Cuentas regresivas ─────────
// Van una tras otra: al llegar a cero la primera aparece la segunda, y así
// sucesivamente. Pasada la última, el contador desaparece. Todas terminan a
// las 00:00 (medianoche) hora del centro de México (UTC-06:00, México ya no
// usa horario de verano).
export interface EtapaContador {
  id: string;
  /** Momento exacto en que termina (ISO 8601 con zona horaria). */
  objetivo: string;
  /** Texto que acompaña al contador. */
  titulo: string;
}

export const ETAPAS_CONTADOR: EtapaContador[] = [
  { id: '20-nov', objetivo: '2026-11-20T00:00:00-06:00', titulo: 'Falta para el 20 de noviembre' },
  { id: '26-nov', objetivo: '2026-11-26T00:00:00-06:00', titulo: 'Falta para el 26 de noviembre' },
  { id: '03-dic', objetivo: '2026-12-03T00:00:00-06:00', titulo: 'Falta para el 3 de diciembre' },
];

// ───────── Videos ─────────
// Pueden ser un archivo dentro de /public/videos o una dirección completa
// (https://...) de donde estén alojados. En Vercel también se pueden cambiar
// con las variables NEXT_PUBLIC_VIDEO_BIENVENIDA y NEXT_PUBLIC_VIDEO_PRESENTACION.
// Mientras el archivo no exista, la página muestra "próximamente" y deja
// continuar sin trabarse.
export const VIDEO_BIENVENIDA = process.env.NEXT_PUBLIC_VIDEO_BIENVENIDA || '/videos/bienvenida.mp4';
export const VIDEO_PRESENTACION = process.env.NEXT_PUBLIC_VIDEO_PRESENTACION || '/videos/presentacion.mp4';
export const POSTER_BIENVENIDA = process.env.NEXT_PUBLIC_POSTER_BIENVENIDA || '';
export const POSTER_PRESENTACION = process.env.NEXT_PUBLIC_POSTER_PRESENTACION || '';

// ───────── WhatsApp del asesor ─────────
// Número con código de país y sin signos: México = 52 + 10 dígitos.
// (Por ahora es el número de pruebas; el definitivo se cambia aquí o con la
// variable NEXT_PUBLIC_WHATSAPP_ASESOR.)
export const WHATSAPP_ASESOR = (process.env.NEXT_PUBLIC_WHATSAPP_ASESOR || '529661132688').replace(/\D/g, '');

export const MENSAJE_WHATSAPP = 'Estoy interesado en Machtia® y quisiera asistencia para resolver dudas.';

/** Enlace de WhatsApp con el mensaje ya escrito. `invitador` es opcional. */
export function enlaceWhatsApp(invitador?: string): string {
  const lineas = [MENSAJE_WHATSAPP, '', 'Mi nombre es: '];
  if (invitador) lineas.push(`Me invitó: ${invitador}`);
  return `https://wa.me/${WHATSAPP_ASESOR}?text=${encodeURIComponent(lineas.join('\n'))}`;
}

// ───────── Preguntas frecuentes del asistente ─────────
// PROVISIONAL: estas respuestas describen únicamente lo que la plataforma ya
// hace hoy. Se sustituyen por las preguntas y respuestas que envíe el cliente.
export interface PreguntaFrecuente {
  id: string;
  pregunta: string;
  respuesta: string;
}

export const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    id: 'como-registro',
    pregunta: '¿Cómo me registro?',
    respuesta:
      'Escribes tu nombre y tu correo en el preregistro. Te llega un correo para confirmarlo y, desde ahí, completas tus datos, eliges tu suscripción y subes tu comprobante de pago.',
  },
  {
    id: 'despues-registro',
    pregunta: '¿Qué pasa después de registrarme?',
    respuesta:
      'Un administrador revisa tu comprobante de pago y activa tu cuenta. Cuando esté lista, entras a la plataforma con tu correo y tu contraseña.',
  },
  {
    id: 'hablar-asesor',
    pregunta: '¿Puedo hablar con una persona?',
    respuesta:
      'Claro. Con el botón de WhatsApp de abajo puedes escribirle a un asesor para resolver tus dudas.',
  },
];
