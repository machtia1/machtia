import { prisma } from './prisma';
import { contarTotalDb } from './redUsuarios';
import {
  LOGROS_ACADEMICOS,
  LOGROS_RED,
  LOGROS_GANANCIAS,
  type LogroDefinicion,
  type LogroConEstado,
  type LogrosUsuario,
} from './logros-types';

export * from './logros-types';

// Misma fecha de inicio de la Red Alterna que usa src/lib/redAlterna.ts
// (se repite aquí como literal para no crear una dependencia circular;
// si esa fecha cambia, actualizar también aquí).
const RED_ALTERNA_INICIO_ISO = process.env.RED_ALTERNA_INICIO_ISO ?? '2026-09-16T12:00:00-06:00';

/** Calcula, con datos reales de la base de datos, qué logros ya desbloqueó un usuario. */
export async function calcularLogrosUsuario(usuarioId: string): Promise<LogrosUsuario> {
  const [usuario, invitadosDirectos, redTotal, regalias] = await Promise.all([
    prisma.user.findUnique({ where: { id: usuarioId }, select: { creadoEn: true } }),
    prisma.user.count({ where: { invitadoPorId: usuarioId } }),
    contarTotalDb(usuarioId),
    prisma.regaliaRedAlterna.findMany({ where: { beneficiarioId: usuarioId }, select: { nivel: true, monto: true } }),
  ]);

  const totalGanancias = regalias.reduce((suma, r) => suma + Number(r.monto), 0);
  const tieneComisionDirecta = regalias.some((r) => r.nivel === 1);
  const tieneComisionRed = regalias.some((r) => r.nivel > 1);

  const seUnioAntesDelLanzamiento = usuario
    ? usuario.creadoEn.getTime() < new Date(RED_ALTERNA_INICIO_ISO).getTime()
    : false;
  const tamanoRed = redTotal.total;

  function conEstado(def: LogroDefinicion, actual: number, meta: number): LogroConEstado {
    return { ...def, progresoActual: Math.min(actual, meta), progresoMeta: meta, desbloqueado: actual >= meta };
  }

  const academicos: LogroConEstado[] = LOGROS_ACADEMICOS.map((d) => ({
    ...d,
    desbloqueado: false,
    progresoActual: 0,
    progresoMeta: 1,
  }));

  const red: LogroConEstado[] = [
    {
      ...LOGROS_RED[0],
      desbloqueado: seUnioAntesDelLanzamiento,
      progresoActual: seUnioAntesDelLanzamiento ? 1 : 0,
      progresoMeta: 1,
    },
    conEstado(LOGROS_RED[1], invitadosDirectos, 2),
    conEstado(LOGROS_RED[2], invitadosDirectos, 8),
    conEstado(LOGROS_RED[3], invitadosDirectos, 20),
    conEstado(LOGROS_RED[4], invitadosDirectos, 30),
    conEstado(LOGROS_RED[5], tamanoRed, 20),
    conEstado(LOGROS_RED[6], tamanoRed, 60),
    conEstado(LOGROS_RED[7], tamanoRed, 200),
  ];

  const ganancias: LogroConEstado[] = [
    {
      ...LOGROS_GANANCIAS[0],
      desbloqueado: tieneComisionDirecta,
      progresoActual: tieneComisionDirecta ? 1 : 0,
      progresoMeta: 1,
    },
    {
      ...LOGROS_GANANCIAS[1],
      desbloqueado: tieneComisionRed,
      progresoActual: tieneComisionRed ? 1 : 0,
      progresoMeta: 1,
    },
    conEstado(LOGROS_GANANCIAS[2], totalGanancias, 50),
    conEstado(LOGROS_GANANCIAS[3], totalGanancias, 100),
    conEstado(LOGROS_GANANCIAS[4], totalGanancias, 1000),
  ];

  return { academicos, red, ganancias };
}
