/**
 * Configuración de las cuentas de Profesor/Facilitador (Etapa 1, pedido del
 * cliente el 19 nov 2026). Estas cuentas NO forman parte de la Red ni
 * generan regalías.
 */

/** Máximo de espacios de Profesor/Facilitador que se pueden crear. */
export const MAX_ESPACIOS_PROFESOR = 400;

/** Desde esta fecha empieza a acumular "Mis Ganancias" del profesor. */
export const INICIO_GANANCIAS_PROFESOR = '2026-12-15T00:00:00-06:00';

/**
 * Porcentaje de ganancia del profesor sobre el total de usuarios de la
 * plataforma. TODAVÍA NO está definido por el cliente: se queda en 0 y se
 * puede cambiar sin tocar código con la variable PROFESOR_PORCENTAJE_GANANCIAS
 * (ej. "5" = 5 %).
 */
export function porcentajeGananciaProfesor(): number {
  const n = Number(process.env.PROFESOR_PORCENTAJE_GANANCIAS ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Ruta pública de la invitación de un espacio de profesor. */
export const RUTA_INVITACION_PROFESOR = 'invitacion-profesor';
