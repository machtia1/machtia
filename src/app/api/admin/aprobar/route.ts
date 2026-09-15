import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registrarRegaliasRedAlterna } from '@/lib/redAlterna';
import { insertarEnRedUsuarios } from '@/lib/redUsuarios';

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

  const ahora = new Date();
  const expiraEn = new Date(ahora);
  expiraEn.setDate(expiraEn.getDate() + 365); // Cada membresía/suscripción dura 365 días, confirmado por el cliente

  await prisma.user.update({
    where: { id: usuarioId },
    data: { status: 'ACTIVA', membresiaExpiraEn: expiraEn },
  });

  // Coloca al usuario en la Red de Usuarios (árbol binario), dentro
  // de la red de quien lo invitó — solo si vino de una invitación
  // normal (no de un espacio restringido, esos son root de su
  // propia red y no se insertan bajo nadie).
  if (usuario.invitadoPorId) {
    await insertarEnRedUsuarios(usuario.invitadoPorId, usuario.id);
  }

  // Momento exacto confirmado por el cliente: las regalías de la Red
  // Alterna se generan cuando se aprueba el comprobante de pago.
  // Esta función ya revisa sola si la campaña sigue activa (fechas)
  // y si el usuario tiene una suscripción elegible — es segura de
  // llamar siempre, sin condiciones extra aquí.
  await registrarRegaliasRedAlterna(usuarioId);

  return NextResponse.json({ ok: true });
}
