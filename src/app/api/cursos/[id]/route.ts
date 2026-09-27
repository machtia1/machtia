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
      lecciones: { orderBy: { orden: 'asc' } },
    },
  });

  if (!curso || !curso.activo) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  let inscripcion = null;
  if (session) {
    const insc = await prisma.inscripcionCurso.findUnique({
      where: { usuarioId_cursoId: { usuarioId: session.userId, cursoId: curso.id } },
      include: { leccionesCompletadas: { select: { leccionId: true } } },
    });
    if (insc) {
      inscripcion = {
        progreso: insc.progreso,
        completado: insc.completado,
        calificacionEvaluacion: insc.calificacionEvaluacion,
        leccionesCompletadasIds: insc.leccionesCompletadas.map((l) => l.leccionId),
      };
    }
  }

  return NextResponse.json({ curso, inscripcion });
}
