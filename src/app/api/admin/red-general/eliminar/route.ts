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

  const { slotId } = await request.json();
  if (!slotId) {
    return NextResponse.json({ error: 'Falta el slotId' }, { status: 400 });
  }

  const slot = await prisma.slotRestringido.findUnique({ where: { id: slotId } });
  if (!slot || slot.status !== 'OCUPADO') {
    return NextResponse.json({ error: 'Este espacio no está ocupado' }, { status: 409 });
  }

  // La fila de este usuario NO se borra ni se desconecta del árbol —
  // su posición (padreRedId/ladoEnPadre) es fija y la necesitan los
  // espacios de abajo para seguir conectados. Solo se "resetea" esa
  // misma fila de vuelta a un espacio reservado sin reclamar, con un
  // correo interno nuevo para poder liberar el correo real que tenía.
  if (slot.usuarioId) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: slot.usuarioId },
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
        where: { id: slotId },
        data: { status: 'VACIO', inviteLink: null },
      }),
    ]);
  } else {
    await prisma.slotRestringido.update({
      where: { id: slotId },
      data: { status: 'VACIO', inviteLink: null },
    });
  }

  return NextResponse.json({ ok: true });
}
