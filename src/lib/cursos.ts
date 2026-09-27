import { prisma } from './prisma';

/**
 * Recalcula el % de avance de una inscripción a partir de cuántas
 * lecciones del curso ya completó, y marca completado=true cuando
 * llega al 100%. Se llama cada vez que se marca una lección como
 * vista (ver /api/cursos/[id]/lecciones/[leccionId]/completar).
 */
export async function recalcularProgreso(inscripcionId: string) {
  const inscripcion = await prisma.inscripcionCurso.findUnique({
    where: { id: inscripcionId },
    include: {
      curso: { select: { id: true, _count: { select: { lecciones: true } } } },
      leccionesCompletadas: true,
    },
  });
  if (!inscripcion) return null;

  const totalLecciones = inscripcion.curso._count.lecciones;
  const completadas = inscripcion.leccionesCompletadas.length;
  const progreso = totalLecciones > 0 ? Math.round((completadas / totalLecciones) * 100) : 0;

  return prisma.inscripcionCurso.update({
    where: { id: inscripcionId },
    data: { progreso, completado: progreso >= 100 },
  });
}

/**
 * Evaluación simple al terminar el curso (Parte 2 — "evaluación"):
 * 3 preguntas de opción múltiple, iguales para cualquier curso por
 * ahora (evaluación general de "¿le diste seguimiento al curso?"),
 * ya que todavía no hay banco de preguntas por curso — se puede
 * ampliar más adelante para preguntas específicas de cada curso.
 */
export const PREGUNTAS_EVALUACION = [
  {
    id: 'p1',
    pregunta: '¿Completaste todas las lecciones de este curso?',
    opciones: [
      { id: 'a', texto: 'Sí, todas' },
      { id: 'b', texto: 'La mayoría' },
      { id: 'c', texto: 'Solo algunas' },
    ],
    correcta: 'a',
  },
  {
    id: 'p2',
    pregunta: '¿Podrías explicarle a otra persona lo más importante que aprendiste?',
    opciones: [
      { id: 'a', texto: 'Sí, sin problema' },
      { id: 'b', texto: 'Más o menos' },
      { id: 'c', texto: 'Todavía no' },
    ],
    correcta: 'a',
  },
  {
    id: 'p3',
    pregunta: '¿Vas a aplicar lo aprendido en este curso?',
    opciones: [
      { id: 'a', texto: 'Sí, ya tengo pensado cómo' },
      { id: 'b', texto: 'Probablemente' },
      { id: 'c', texto: 'No estoy seguro' },
    ],
    correcta: 'a',
  },
] as const;

export function calificarEvaluacion(respuestas: Record<string, string>): number {
  let correctas = 0;
  for (const p of PREGUNTAS_EVALUACION) {
    if (respuestas[p.id] === p.correcta) correctas += 1;
  }
  return Math.round((correctas / PREGUNTAS_EVALUACION.length) * 100);
}
