import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const correoOriginal = usuario.correo;

  // La posición en el árbol (padreRedId/ladoEnPadre) solo se asigna al
  // APROBAR (ver /api/admin/aprobar) — así que alguien todavía
  // PENDIENTE_APROBACION nunca tiene nada realmente conectado bajo él,
  // y es seguro liberar por completo su correo al rechazarlo.
  const slot = await prisma.slotRestringido.findUnique({
    where: { usuarioId },
    select: { id: true, nivel: true },
  });

  if (slot) {
    // Espacio restringido de la Red General: su posición en el árbol es
    // fija y la necesitan los espacios de abajo para seguir conectados
    // — no se borra la fila, se resetea de vuelta a "reservado sin
    // reclamar" (mismo mecanismo que "Liberar este espacio" en el
    // Panel de Administrador → Red General), liberando el correo real
    // que tenía para que esa persona pueda intentarlo de nuevo.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: usuarioId },
        data: {
          nombre: 'Espacio',
          apellido: `Reservado (Nivel ${slot.nivel})`,
          correo: `reservado-${randomUUID()}@interno.clubmachtia`,
          correoConfirmado: false,
          telefono: null,
          pais: null,
          suscripcion: null,
          rol: 'USUARIO',
          status: 'PENDIENTE_CONFIRMACION',
          passwordHash: null,
          comprobantePagoUrl: null,
          membresiaExpiraEn: null,
          reservado: true,
        },
      }),
      prisma.slotRestringido.update({
        where: { id: slot.id },
        data: { status: 'VACIO', inviteLink: null },
      }),
    ]);
  } else {
    // Invitación normal (link personal de alguien). Como todavía no
    // tiene ninguna posición asignada en el árbol, se puede borrar la
    // fila por completo — salvo el caso residual de que alguien ya
    // haya usado SU link para preregistrarse antes de ser rechazado;
    // en ese caso no se borra (perderían su referencia), solo se
    // libera el correo.
    const tieneInvitados = await prisma.user.count({ where: { invitadoPorId: usuarioId } });
    if (tieneInvitados > 0) {
      await prisma.user.update({
        where: { id: usuarioId },
        data: {
          correo: `rechazado-${randomUUID()}@interno.clubmachtia`,
          status: 'RECHAZADA',
        },
      });
    } else {
      await prisma.user.delete({ where: { id: usuarioId } });
    }
  }

  // Libera el link de confirmación original (Fase 1) para que la misma
  // persona pueda volver a usarlo — el formulario de Fase 2 revisa que
  // no exista ya una cuenta con ese correo antes de dejar pasar.
  await prisma.preregistro.updateMany({
    where: { correo: correoOriginal },
    data: { confirmado: false },
  });

  return NextResponse.json({ ok: true });
}
