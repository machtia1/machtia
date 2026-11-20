import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Detalle de un curso/taller: lecciones + tu inscripción/avance si ya iniciaste sesión. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  const curso = await prisma.curso.findUnique({
    where: { id: params.id },
    include: {
      instructor: true,
      rutaAprendizaje: { select: { id: true, titulo: true } },
      lecciones: {
        orderBy: { orden: 'asc' },
        include: { _count: { select: { preguntas: true } } },
      },
      archivos: { orderBy: { creadoEn: 'asc' } },
    },
  });

  if (!curso || !curso.activo) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  let inscripcion = null;
  let resultadosModulo: Record<string, { mejorNota: number; intentos: number }> = {};
  let certificadoFolio: string | null = null;
  if (session) {
    const insc = await prisma.inscripcionCurso.findUnique({
      where: { usuarioId_cursoId: { usuarioId: session.userId, cursoId: curso.id } },
      include: {
        leccionesCompletadas: { select: { leccionId: true } },
        resultadosModulo: { select: { leccionId: true, mejorNota: true, intentos: true } },
        certificado: { select: { folio: true } },
      },
    });
    if (insc) {
      inscripcion = {
        progreso: insc.progreso,
        completado: insc.completado,
        calificacionEvaluacion: insc.calificacionEvaluacion,
        leccionesCompletadasIds: insc.leccionesCompletadas.map((l) => l.leccionId),
      };
      resultadosModulo = Object.fromEntries(
        insc.resultadosModulo.map((r) => [r.leccionId, { mejorNota: r.mejorNota, intentos: r.intentos }])
      );
      certificadoFolio = insc.certificado?.folio ?? null;
    }
  }

  // Examen por módulo: solo si algún módulo tiene preguntas (cursos de
  // profesores). Los cursos anteriores siguen con la evaluación general.
  const usaExamenes = curso.lecciones.some((l) => l._count.preguntas > 0);
  const { archivos, ...resto } = curso;

  return NextResponse.json({
    curso: {
      ...resto,
      lecciones: curso.lecciones.map(({ _count, ...l }) => ({ ...l, numPreguntas: _count.preguntas })),
    },
    inscripcion,
    examenes: usaExamenes
      ? {
          calificacionMinima: curso.calificacionMinima,
          calificacionMaxima: curso.calificacionMaxima,
          resultados: resultadosModulo,
          certificadoFolio,
        }
      : null,
    // Archivos adicionales: solo para alumnos inscritos.
    archivos: inscripcion && curso.permiteArchivos ? archivos.map((a) => ({ id: a.id, nombre: a.nombre, url: a.url, tamano: a.tamano })) : [],
  });
}
