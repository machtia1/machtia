// Club Machtia — Regla de vencimiento de membresías.
//
// Pedido por el cliente el 22 sept 2026: "Aplica la fecha para
// todos, 30 de Octubre empiezan a correr los 365" — el año de
// membresía de TODOS (los que ya están activos y también las
// aprobaciones nuevas de aquí en adelante) se cuenta desde una fecha
// fija, en vez de que cada quien tenga su propia fecha individual
// según el día en que se aprobó.
//
// ⚠️ ACTUALIZACIÓN 27 oct 2026 — el cliente amplió la Campaña de
// Lanzamiento al 30 de NOVIEMBRE y confirmó: "empieza el año el 30 de
// Noviembre a la hora que termine la campaña" (10:00 p.m., hora Centro
// de México). Por eso el ciclo de 365 días arranca el 30 de noviembre
// de 2026 a las 10:00 p.m. y vence el 30 de noviembre de 2027 a esa
// misma hora; de ahí en adelante, cada 30 de noviembre a las 10:00 p.m.
//
// Se usa tanto en la aprobación normal (/api/admin/aprobar) como en
// el registro por invitación restringida de la Red General
// (/api/admin/red-general/registrar), para que las dos rutas sigan
// exactamente la misma regla.

/** Mes (1-12) y día en que cae el aniversario del ciclo de membresías. */
const MES_CICLO = 11; // noviembre
const DIA_CICLO = 30;

/** Hora de cierre de la campaña = hora en que empieza/termina cada ciclo (hora Centro de México, UTC-6). */
const HORA_CICLO_ISO = '22:00:00-06:00';

/** Primer ciclo: arranca cuando termina la campaña, 30 de noviembre de 2026, 10:00 p.m. */
const INICIO_PRIMER_CICLO_ISO = `2026-${MES_CICLO}-${DIA_CICLO}T${HORA_CICLO_ISO}`;

/**
 * Fecha del aniversario del ciclo (30 de noviembre, 10:00 p.m. hora
 * Centro de México) para un año dado.
 */
function aniversarioDelCiclo(anio: number): Date {
  return new Date(`${anio}-${MES_CICLO}-${DIA_CICLO}T${HORA_CICLO_ISO}`);
}

/**
 * Da la fecha de vencimiento de una membresía que se aprueba HOY,
 * siguiendo el calendario fijo del 30 de noviembre a las 10:00 p.m.:
 *   - Si hoy es antes de que arranque el primer ciclo (30 nov 2026,
 *     10:00 p.m.), vence al terminar ese primer ciclo completo: el
 *     30 de noviembre de 2027, 10:00 p.m. (todos reciben el año
 *     completo contado desde que cierra la campaña).
 *   - Si hoy ya está dentro de un ciclo, vence en el siguiente
 *     aniversario (30 de noviembre, 10:00 p.m.) que todavía no ha
 *     pasado.
 *
 * Así, todas las membresías —sin importar el día exacto en que se
 * aprueban— quedan alineadas al mismo 30 de noviembre de cada año.
 */
export function proximoVencimientoMembresia(desde: Date = new Date()): Date {
  const inicioPrimerCiclo = new Date(INICIO_PRIMER_CICLO_ISO).getTime();
  const referencia = Math.max(desde.getTime(), inicioPrimerCiclo);

  // El primer aniversario posible es el de 2027 (un año después del arranque).
  let anio = new Date(INICIO_PRIMER_CICLO_ISO).getUTCFullYear() + 1;
  let vencimiento = aniversarioDelCiclo(anio);
  while (vencimiento.getTime() <= referencia) {
    anio += 1;
    vencimiento = aniversarioDelCiclo(anio);
  }
  return vencimiento;
}
