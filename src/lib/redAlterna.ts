import { Suscripcion } from '@prisma/client';
import { prisma } from './prisma';

// ============================================================
// Red Alterna — Campaña de Lanzamiento
// ------------------------------------------------------------
// Reglas de negocio confirmadas con el cliente (13 sept 2026):
//
// 1. Las dos redes (General y Alterna) se llenan desde el mismo
//    momento, siguiendo la MISMA cadena real de invitaciones
//    (User.invitadoPorId) — NO es un árbol de 8 ramas forzado,
//    el cliente aclaró "participan todos sin ninguna restricción".
//    La tabla de 8→64→512→4,096→32,768 es solo el ejemplo
//    ilustrativo de ganancia máxima teórica, no una regla del
//    sistema.
//
// 2. Cada persona gana regalías de hasta 5 niveles hacia arriba
//    en su cadena de invitación, mientras la campaña esté activa.
//
// 3. La tabla que se aplica es la del NIVEL MÁS BAJO entre quien
//    gana y quien se suscribió — nadie gana más de lo que su
//    propio nivel de suscripción permite, aunque el invitado haya
//    pagado una suscripción más cara:
//
//      Ganador    Invitado    Tabla aplicada
//      ─────────────────────────────────────
//      Básica     cualquiera  Básica
//      Plus       Básica      Básica
//      Plus       Plus        Plus
//      Plus       Negocios    Plus   (tope, no sube a Negocios)
//      Negocios   Básica      Básica
//      Negocios   Plus        Plus
//      Negocios   Negocios    Negocios
//
// 4. La Red General NO contabiliza ganancias mientras la Red
//    Alterna esté activa. Vuelve a contar a partir del corte.
//
// 5. Fechas de la campaña — actualizadas el 14 sept 2026: el cliente
//    movió el inicio original (lunes 14, 10pm) al martes 15 de
//    septiembre 2026, 6:00 PM hora Centro de México (UTC-6), para
//    dar una ventana de ~20 horas y que la gente ya registrada
//    alcance a entrar antes de que empiece a contar. Corte: 30 de
//    octubre 2026, 10:00 PM misma zona (sin cambios).
// ============================================================

/** Fecha y hora de INICIO de la Red Alterna (zona horaria de México, UTC-6). */
const RED_ALTERNA_INICIO_ISO = process.env.RED_ALTERNA_INICIO_ISO ?? '2026-09-15T18:00:00-06:00';

/** Fecha y hora de CORTE de la Red Alterna (zona horaria de México, UTC-6). */
const RED_ALTERNA_FIN_ISO = process.env.RED_ALTERNA_FIN_ISO ?? '2026-10-30T22:00:00-06:00';

/** Solo estas 3 suscripciones participan en la Red Alterna. */
type SuscripcionElegible = 'BASICA' | 'PLUS' | 'NEGOCIOS';

const RANGO: Record<SuscripcionElegible, number> = {
  BASICA: 0,
  PLUS: 1,
  NEGOCIOS: 2,
};

/** Monto en MXN por nivel (1 a 5), según la tabla que envió el cliente. */
const TABLAS: Record<SuscripcionElegible, Record<number, number>> = {
  BASICA: { 1: 10.0, 2: 5.0, 3: 5.0, 4: 5.0, 5: 2.5 },
  PLUS: { 1: 20.0, 2: 10.0, 3: 10.0, 4: 10.0, 5: 5.0 },
  NEGOCIOS: { 1: 40.0, 2: 20.0, 3: 20.0, 4: 20.0, 5: 10.0 },
};

function esElegible(s: Suscripcion | null | undefined): s is SuscripcionElegible {
  return s === 'BASICA' || s === 'PLUS' || s === 'NEGOCIOS';
}

/** ¿La campaña de la Red Alterna sigue activa en este momento? */
export function redAlternaActiva(fecha: Date = new Date()): boolean {
  const inicio = new Date(RED_ALTERNA_INICIO_ISO).getTime();
  const fin = new Date(RED_ALTERNA_FIN_ISO).getTime();
  return fecha.getTime() >= inicio && fecha.getTime() < fin;
}

/**
 * Calcula y GUARDA las regalías de la Red Alterna generadas por la
 * activación de una suscripción de pago. Camina hasta 5 niveles
 * hacia arriba en la cadena real de invitaciones.
 *
 * Se debe llamar exactamente una vez, en el momento en que se
 * aprueba el comprobante de pago de `nuevoUsuarioId` (ese punto
 * todavía no existe en el proyecto — es el pendiente "Panel para
 * aprobar comprobantes de pago y activar cuentas").
 *
 * Es seguro llamarla más de una vez por error de red: no vuelve a
 * pagar si ya existen regalías registradas con este origenId.
 */
export async function registrarRegaliasRedAlterna(nuevoUsuarioId: string): Promise<void> {
  if (!redAlternaActiva()) {
    return; // La campaña ya cerró, la Red General retoma el conteo.
  }

  const yaRegistrado = await prisma.regaliaRedAlterna.findFirst({
    where: { origenId: nuevoUsuarioId },
  });
  if (yaRegistrado) {
    return; // Ya se pagaron las regalías por esta suscripción, no duplicar.
  }

  const nuevoUsuario = await prisma.user.findUnique({
    where: { id: nuevoUsuarioId },
    select: { id: true, suscripcion: true, invitadoPorId: true },
  });

  if (!nuevoUsuario || !esElegible(nuevoUsuario.suscripcion)) {
    return; // Sin suscripción elegible, no genera regalías.
  }

  const susOrigen = nuevoUsuario.suscripcion;

  let ancestroId = nuevoUsuario.invitadoPorId;
  let nivel = 1;

  while (ancestroId && nivel <= 5) {
    const ancestro = await prisma.user.findUnique({
      where: { id: ancestroId },
      select: { id: true, suscripcion: true, invitadoPorId: true },
    });

    if (!ancestro) break;

    if (esElegible(ancestro.suscripcion)) {
      const tablaAplicada =
        RANGO[ancestro.suscripcion] <= RANGO[susOrigen] ? ancestro.suscripcion : susOrigen;

      const monto = TABLAS[tablaAplicada][nivel];

      await prisma.regaliaRedAlterna.create({
        data: {
          beneficiarioId: ancestro.id,
          origenId: nuevoUsuario.id,
          nivel,
          monto,
          tablaAplicada,
        },
      });
    }

    ancestroId = ancestro.invitadoPorId;
    nivel += 1;
  }
}

/** Resumen de regalías ganadas por un usuario en la Red Alterna. */
export async function resumenRegaliasUsuario(usuarioId: string) {
  const regalias = await prisma.regaliaRedAlterna.findMany({
    where: { beneficiarioId: usuarioId },
    orderBy: { creadoEn: 'desc' },
    include: {
      origen: { select: { nombre: true, apellido: true, suscripcion: true } },
    },
  });

  const total = regalias.reduce((suma: number, r: { monto: unknown }) => suma + Number(r.monto), 0);

  const porNivel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of regalias as Array<{ nivel: number; monto: unknown }>) {
    porNivel[r.nivel] = (porNivel[r.nivel] ?? 0) + Number(r.monto);
  }

  return { total, porNivel, movimientos: regalias, activa: redAlternaActiva() };
}
