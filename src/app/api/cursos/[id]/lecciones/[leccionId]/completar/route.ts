import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalcularProgreso } from '@/lib/cursos';

/** Marca una lección como vista/completada y recalcula el % de avance del curso. */
export async function POST(
  _request: Request,
  { params }: { params: { id: string; leccionId: string } }
) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const leccion = await prisma.leccion.findUnique({
    where: { id: params.leccionId },
    select: { id: true, cursoId: true },
  });
  if (!leccion || leccion.cursoId !== params.id) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 });
  }

  const inscripcion = await prisma.inscripcionCurso.upsert({
    where: { usuarioId_cursoId: { usuarioId: session.userId, cursoId: params.id } },
    create: { usuarioId: session.userId, cursoId: params.id },
    update: {},
  });

  await prisma.leccionCompletada.upsert({
    where: { inscripcionId_leccionId: { inscripcionId: inscripcion.id, leccionId: leccion.id } },
    create: { inscripcionId: inscripcion.id, leccionId: leccion.id },
    update: {},
  });

  const actualizada = await recalcularProgreso(inscripcion.id);

  return NextResponse.json({ inscripcion: actualizada });
}
