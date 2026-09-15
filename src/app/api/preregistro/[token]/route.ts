import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const preregistro = await prisma.preregistro.findUnique({
    where: { tokenConfirmacion: params.token },
  });

  if (!preregistro) {
    return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 404 });
  }

  // Si ya se completó el registro con este token, no se debe poder
  // volver a usar para crear otra cuenta.
  const yaExisteUsuario = await prisma.user.findUnique({
    where: { correo: preregistro.correo },
    select: { id: true },
  });

  if (preregistro.confirmado && yaExisteUsuario) {
    return NextResponse.json({ error: 'Este registro ya fue completado' }, { status: 409 });
  }

  return NextResponse.json({
    nombre: preregistro.nombre,
    correo: preregistro.correo,
    invitadorLinkId: preregistro.invitadorSlug,
    esRestringido: !!preregistro.slotRestringidoId,
  });
}
