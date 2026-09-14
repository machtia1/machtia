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
  if (!slot || slot.status !== 'INVITADO') {
    return NextResponse.json({ error: 'Este espacio no tiene una invitación pendiente' }, { status: 409 });
  }

  const actualizado = await prisma.slotRestringido.update({
    where: { id: slotId },
    data: { status: 'VACIO', inviteLink: null },
  });

  return NextResponse.json({ slot: actualizado });
}
