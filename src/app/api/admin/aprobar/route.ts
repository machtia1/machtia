import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registrarRegaliasRedAlterna, insertarEnRedAlterna } from '@/lib/redAlterna';
import { insertarEnRedUsuarios } from '@/lib/redUsuarios';
import { crearNotificacionUsuario } from '@/lib/notificacionesUsuario';
import { proximoVencimientoMembresia } from '@/lib/membresia';

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

  // Todas las membresías se sincronizan al calendario del 30 de
  // octubre (confirmado por el cliente el 22 sept 2026) — ver
  // src/lib/membresia.ts.
  const expiraEn = proximoVencimientoMembresia();

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

    // Árbol de la Red Alterna (8 ramas por nivel, confirmado por el
    // cliente el 18 sept 2026): se inserta dentro de la red de quien
    // invitó realmente, ANTES de calcular regalías, porque estas
    // ahora se pagan según la posición en este árbol.
    await insertarEnRedAlterna(usuario.invitadoPorId, usuario.id);

    // Notificaciones personales pedidas por el cliente el 20 sept
    // 2026: (1) a quien lo invitó directamente con su link, y (2) a
    // quien le tocó como su posición exacta en la Red 2x15 — no
    // siempre es la misma persona, porque el árbol puede acomodar al
    // nuevo usuario más abajo en la rama si el nivel 1 ya está lleno.
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
    await crearNotificacionUsuario(
      usuario.invitadoPorId,
      `🎉 ${nombreCompleto} se unió como tu invitado directo con tu link de invitación.`
    );

    const conPosicion = await prisma.user.findUnique({
      where: { id: usuario.id },
      select: { padreRedId: true },
    });
    if (conPosicion?.padreRedId) {
      await crearNotificacionUsuario(
        conPosicion.padreRedId,
        `🌐 ${nombreCompleto} se unió a tu Red 2x15.`
      );
    }
  }

  // Momento exacto confirmado por el cliente: las regalías de la Red
  // Alterna se generan cuando se aprueba el comprobante de pago.
  // Esta función ya revisa sola si la campaña sigue activa (fechas)
  // y si el usuario tiene una suscripción elegible — es segura de
  // llamar siempre, sin condiciones extra aquí.
  await registrarRegaliasRedAlterna(usuarioId);

  return NextResponse.json({ ok: true });
}
