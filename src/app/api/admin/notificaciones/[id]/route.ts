import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function requiereAdmin() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session || session.rol !== 'ADMINISTRADOR') return null;
  return session;
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const existente = await prisma.notificacion.findUnique({ where: { id: params.id } });
  if (!existente) {
    return NextResponse.json({ error: 'Esta notificación ya no existe' }, { status: 404 });
  }

  await prisma.notificacion.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
