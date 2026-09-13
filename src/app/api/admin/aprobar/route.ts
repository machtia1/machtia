import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registrarRegaliasRedAlterna } from '@/lib/redAlterna';

export async function POST(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { usuarioId } = await request.json();
  if (!usuarioId) {
    return NextResponse.json({ error: 'Falta el usuarioId' }, { status: 400 });
  }

  const usuario = await prisma.user.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }
  if (usuario.status !== 'PENDIENTE_APROBACION') {
    return NextResponse.json({ error: 'Este usuario ya fue procesado antes' }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: usuarioId },
    data: { status: 'ACTIVA' },
  });

  // Momento exacto confirmado por el cliente: las regalías de la Red
  // Alterna se generan cuando se aprueba el comprobante de pago.
  // Esta función ya revisa sola si la campaña sigue activa (fechas)
  // y si el usuario tiene una suscripción elegible — es segura de
  // llamar siempre, sin condiciones extra aquí.
  await registrarRegaliasRedAlterna(usuarioId);

  return NextResponse.json({ ok: true });
}
