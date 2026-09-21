import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Público (cualquier usuario logueado): últimas notificaciones + si hay sin leer. */
export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const [notificaciones, usuario] = await Promise.all([
    prisma.notificacion.findMany({
      orderBy: { creadoEn: 'desc' },
      take: 15,
      select: { id: true, mensaje: true, creadoEn: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { ultimaNotificacionVistaEn: true },
    }),
  ]);

  const ultimaVista = usuario?.ultimaNotificacionVistaEn ?? null;
  const hayNoLeidas = notificaciones.some(
    (n) => !ultimaVista || new Date(n.creadoEn) > new Date(ultimaVista)
  );

  return NextResponse.json({ notificaciones, hayNoLeidas });
}
