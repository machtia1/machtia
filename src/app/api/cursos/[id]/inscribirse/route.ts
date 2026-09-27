import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const curso = await prisma.curso.findUnique({ where: { id: params.id }, select: { id: true, activo: true } });
  if (!curso || !curso.activo) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  const inscripcion = await prisma.inscripcionCurso.upsert({
    where: { usuarioId_cursoId: { usuarioId: session.userId, cursoId: curso.id } },
    create: { usuarioId: session.userId, cursoId: curso.id },
    update: {},
  });

  return NextResponse.json({ inscripcion });
}
