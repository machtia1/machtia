import { randomInt } from 'crypto';
import { prisma } from './prisma';

/**
 * Evaluación por módulo de los cursos de profesores.
 *
 * - Cada módulo (Leccion) puede tener hasta 4 preguntas de opción múltiple.
 * - Una pregunta cuenta como correcta solo si el alumno marca EXACTAMENTE
 *   las respuestas correctas (ni una de más ni una de menos).
 * - La nota del módulo va de 0 a calificacionMaxima del curso.
 * - La calificación del curso es el promedio de los módulos con examen.
 * - Se aprueba con calificacionMinima o más. Los reintentos están permitidos
 *   y se conserva la mejor nota de cada módulo.
 * - Al terminar todo y aprobar, se emite el certificado automáticamente.
 *
 * Las respuestas correctas NUNCA salen del servidor.
 */

export interface PreguntaBD {
  id: string;
  correctas: number[];
}

export type Respuestas = Record<string, number[]>;

export function calificarModulo(
  preguntas: PreguntaBD[],
  respuestas: Respuestas,
  calificacionMaxima: number
): { nota: number; aciertos: number; total: number; detalle: Record<string, boolean> } {
  const detalle: Record<string, boolean> = {};
  let aciertos = 0;
  for (const p of preguntas) {
    const dadas = Array.from(new Set(respuestas[p.id] ?? [])).sort((a, b) => a - b);
    const buenas = Array.from(new Set(p.correctas)).sort((a, b) => a - b);
    const ok = dadas.length === buenas.length && dadas.every((v, i) => v === buenas[i]);
    detalle[p.id] = ok;
    if (ok) aciertos += 1;
  }
  const total = preguntas.length;
  const nota = total > 0 ? Math.round((aciertos / total) * calificacionMaxima) : 0;
  return { nota, aciertos, total, detalle };
}

export function promedioNotas(notas: number[]): number {
  if (notas.length === 0) return 0;
  return Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);
}

// Sin 0/O/1/I para que el folio se pueda dictar o copiar sin errores.
const ALFABETO_FOLIO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generarFolio(fecha: Date = new Date()): string {
  let aleatorio = '';
  for (let i = 0; i < 8; i++) aleatorio += ALFABETO_FOLIO[randomInt(ALFABETO_FOLIO.length)];
  return `MACH-${fecha.getFullYear()}-${aleatorio.slice(0, 4)}-${aleatorio.slice(4)}`;
}

export function folioValido(folio: string): boolean {
  return /^MACH-\d{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(folio);
}

/**
 * Revisa si el alumno ya terminó el curso: todas las lecciones vistas y,
 * si el curso tiene exámenes por módulo, todos presentados. Con eso
 * calcula el promedio, actualiza la inscripción y, si aprobó, emite el
 * certificado (una sola vez). Es idempotente: se puede llamar tras
 * cualquier acción del alumno.
 */
export async function evaluarCierreCurso(inscripcionId: string) {
  const insc = await prisma.inscripcionCurso.findUnique({
    where: { id: inscripcionId },
    include: {
      usuario: { select: { id: true, nombre: true, apellido: true } },
      curso: {
        select: {
          id: true,
          titulo: true,
          horas: true,
          duracionMinutos: true,
          calificacionMinima: true,
          calificacionMaxima: true,
          instructor: { select: { nombre: true } },
          autor: { select: { nombre: true, apellido: true } },
          lecciones: { select: { id: true, _count: { select: { preguntas: true } } } },
        },
      },
      leccionesCompletadas: { select: { leccionId: true } },
      resultadosModulo: { select: { leccionId: true, mejorNota: true } },
      certificado: { select: { folio: true } },
    },
  });
  if (!insc) return null;

  const curso = insc.curso;
  const conExamen = curso.lecciones.filter((l) => l._count.preguntas > 0);
  const resultado = {
    usaExamenes: conExamen.length > 0,
    terminado: false,
    promedio: null as number | null,
    aprobado: false,
    folio: insc.certificado?.folio ?? null,
  };
  if (!resultado.usaExamenes) return resultado; // cursos anteriores: flujo original

  const vistas = new Set(insc.leccionesCompletadas.map((l) => l.leccionId));
  const todasVistas = curso.lecciones.length > 0 && curso.lecciones.every((l) => vistas.has(l.id));
  const notas = new Map(insc.resultadosModulo.map((r) => [r.leccionId, r.mejorNota]));
  const todosPresentados = conExamen.every((l) => notas.has(l.id));
  resultado.terminado = todasVistas && todosPresentados;
  if (!resultado.terminado) return resultado;

  const promedio = promedioNotas(conExamen.map((l) => notas.get(l.id) as number));
  resultado.promedio = promedio;
  resultado.aprobado = promedio >= curso.calificacionMinima;

  await prisma.inscripcionCurso.update({
    where: { id: insc.id },
    data: { calificacionEvaluacion: promedio },
  });

  if (resultado.aprobado && !insc.certificado) {
    const instructor =
      curso.instructor?.nombre ?? (curso.autor ? `${curso.autor.nombre} ${curso.autor.apellido}`.trim() : null);
    const horas = curso.horas ?? (curso.duracionMinutos > 0 ? Math.round((curso.duracionMinutos / 60) * 10) / 10 : null);
    for (let intento = 0; intento < 5; intento++) {
      try {
        const cert = await prisma.certificado.create({
          data: {
            folio: generarFolio(),
            inscripcionId: insc.id,
            usuarioId: insc.usuario.id,
            cursoId: curso.id,
            nombreAlumno: `${insc.usuario.nombre} ${insc.usuario.apellido}`.trim(),
            tituloCurso: curso.titulo,
            instructor,
            horas,
            calificacion: promedio,
            calificacionMaxima: curso.calificacionMaxima,
          },
        });
        resultado.folio = cert.folio;
        break;
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code !== 'P2002') throw e;
        // P2002: choque de folio (muy improbable) o el certificado ya existe por una petición simultánea.
        const ya = await prisma.certificado.findUnique({ where: { inscripcionId: insc.id }, select: { folio: true } });
        if (ya) {
          resultado.folio = ya.folio;
          break;
        }
      }
    }
  }
  return resultado;
}
