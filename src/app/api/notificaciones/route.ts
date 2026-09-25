import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Público (cualquier usuario logueado): combina las notificaciones
 * generales del Administrador (Notificacion) con las personales de
 * este usuario (NotificacionUsuario — invitado directo nuevo,
 * alguien se unió a su Red 2x15), ordenadas por fecha.
 */
export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const [generales, personales, usuario] = await Promise.all([
    prisma.notificacion.findMany({
      where: { ocultaPara: { none: { usuarioId: session.userId } } },
      orderBy: { creadoEn: 'desc' },
      take: 15,
      select: { id: true, mensaje: true, creadoEn: true },
    }),
    prisma.notificacionUsuario.findMany({
      where: { destinatarioId: session.userId },
      orderBy: { creadoEn: 'desc' },
      take: 15,
      select: { id: true, mensaje: true, creadoEn: true, leida: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { ultimaNotificacionVistaEn: true },
    }),
  ]);

  const ultimaVista = usuario?.ultimaNotificacionVistaEn ?? null;
  const hayGeneralesSinLeer = generales.some(
    (n) => !ultimaVista || new Date(n.creadoEn) > new Date(ultimaVista)
  );
  const hayPersonalesSinLeer = personales.some((n) => !n.leida);

  const notificaciones = [
    ...generales.map((n) => ({ id: n.id, mensaje: n.mensaje, creadoEn: n.creadoEn })),
    ...personales.map((n) => ({ id: n.id, mensaje: n.mensaje, creadoEn: n.creadoEn })),
  ].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());

  return NextResponse.json({
    notificaciones,
    hayNoLeidas: hayGeneralesSinLeer || hayPersonalesSinLeer,
  });
}
