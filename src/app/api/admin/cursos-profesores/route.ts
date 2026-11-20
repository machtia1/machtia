import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Todos los cursos creados por profesores (para que el administrador los pueda ocultar). */
export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const cursos = await prisma.curso.findMany({
    where: { autorId: { not: null } },
    orderBy: { creadoEn: 'desc' },
    select: {
      id: true,
      titulo: true,
      activo: true,
      borrador: true,
      ocultoPorAdmin: true,
      autor: { select: { nombre: true, apellido: true } },
      _count: { select: { inscripciones: true } },
    },
  });
  return NextResponse.json({ cursos });
}
