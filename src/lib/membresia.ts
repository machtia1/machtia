// Club Machtia — Regla de vencimiento de membresías.
//
// Pedido por el cliente el 22 sept 2026: "Aplica la fecha para
// todos, 30 de Octubre empiezan a correr los 365" — es decir, el
// año de membresía de TODOS (los que ya están activos y también
// las aprobaciones nuevas de aquí en adelante) se cuenta desde el
// 30 de octubre, en vez de que cada quien tenga su propia fecha
// individual según el día en que se aprobó.
//
// Se usa tanto en la aprobación normal (/api/admin/aprobar) como en
// el registro por invitación restringida de la Red General
// (/api/admin/red-general/registrar), para que las dos rutas sigan
// exactamente la misma regla.

/**
 * Da la fecha de vencimiento de una membresía que se aprueba HOY,
 * siguiendo el calendario fijo del 30 de octubre:
 *   - Si hoy es antes del 30 de octubre de este año, vence el 30 de
 *     octubre de ESTE año (para no darle menos de lo que le toca del
 *     ciclo que ya está corriendo).
 *   - Si hoy es el 30 de octubre o después, vence el 30 de octubre
 *     del año QUE SIGUE (un ciclo completo hacia adelante).
 *
 * Así, todas las membresías —sin importar el día exacto en que se
 * aprueban— quedan alineadas al mismo 30 de octubre de cada año.
 */
export function proximoVencimientoMembresia(desde: Date = new Date()): Date {
  const anioActual = desde.getFullYear();

  // Punto de comparación: inicio del día 30 de octubre de este año
  // (comparando solo la fecha, sin importar la hora exacta de hoy).
  const inicioDelTreinta = new Date(anioActual, 9, 30, 0, 0, 0, 0); // mes 9 = octubre (0-indexado)

  const yaPasoElTreinta = desde.getTime() >= inicioDelTreinta.getTime();
  const anioDeVencimiento = yaPasoElTreinta ? anioActual + 1 : anioActual;

  return new Date(anioDeVencimiento, 9, 30, 23, 59, 59, 999);
}
