import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** El usuario abrió el panel de notificaciones — ya no cuentan como sin leer. */
export async function POST() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  await Promise.all([
    prisma.user.update({
      where: { id: session.userId },
      data: { ultimaNotificacionVistaEn: new Date() },
    }),
    prisma.notificacionUsuario.updateMany({
      where: { destinatarioId: session.userId, leida: false },
      data: { leida: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
