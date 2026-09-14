import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { slotId } = await request.json();
  if (!slotId) {
    return NextResponse.json({ error: 'Falta el slotId' }, { status: 400 });
  }

  const slot = await prisma.slotRestringido.findUnique({ where: { id: slotId } });
  if (!slot || slot.status !== 'OCUPADO') {
    return NextResponse.json({ error: 'Este espacio no está ocupado' }, { status: 409 });
  }

  // No se borra la cuenta (podría tener su propia red hacia abajo,
  // eso se conserva intacto) — solo se desvincula del espacio y se
  // deja el espacio libre de nuevo.
  await prisma.$transaction([
    prisma.slotRestringido.update({
      where: { id: slotId },
      data: { status: 'VACIO', inviteLink: null, usuarioId: null },
    }),
    ...(slot.usuarioId
      ? [prisma.user.update({ where: { id: slot.usuarioId }, data: { status: 'RECHAZADA' } })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
