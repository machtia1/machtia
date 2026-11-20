import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Oculta o vuelve a mostrar un curso de profesor. Body: { oculto: boolean } */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { oculto } = await request.json().catch(() => ({}));
  if (typeof oculto !== 'boolean') {
    return NextResponse.json({ error: 'Falta indicar si se oculta o se muestra' }, { status: 400 });
  }

  const curso = await prisma.curso.findUnique({
    where: { id: params.id },
    select: { id: true, autorId: true, borrador: true },
  });
  if (!curso || !curso.autorId) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  const actualizado = await prisma.curso.update({
    where: { id: curso.id },
    data: { ocultoPorAdmin: oculto, activo: !oculto && !curso.borrador },
    select: { id: true, activo: true, ocultoPorAdmin: true },
  });
  return NextResponse.json({ ok: true, curso: actualizado });
}
