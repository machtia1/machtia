import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Deja que CUALQUIER usuario borre una notificación de su propia
 * lista (campanita del Dashboard) — pedido por el cliente el 25
 * sept 2026.
 *
 * Como la lista combina dos cosas distintas (ver /api/notificaciones):
 *   - Personal (NotificacionUsuario, de un solo destinatario): se
 *     borra de verdad, es solo suya.
 *   - General (Notificacion, del Administrador, compartida por
 *     todos): NO se borra la fila real — se guarda que ESTE usuario
 *     ya la ocultó (NotificacionOculta), así a los demás les sigue
 *     apareciendo.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = params;

  const personal = await prisma.notificacionUsuario.findUnique({
    where: { id },
    select: { id: true, destinatarioId: true },
  });

  if (personal) {
    if (personal.destinatarioId !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    await prisma.notificacionUsuario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  const general = await prisma.notificacion.findUnique({ where: { id }, select: { id: true } });
  if (general) {
    await prisma.notificacionOculta.upsert({
      where: { usuarioId_notificacionId: { usuarioId: session.userId, notificacionId: id } },
      create: { usuarioId: session.userId, notificacionId: id },
      update: {},
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
}
