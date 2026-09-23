import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { proximoVencimientoMembresia } from '@/lib/membresia';

export async function POST(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { slotId, nombre, apellido, correo, telefono, pais } = await request.json();
  if (!slotId || !nombre?.trim() || !apellido?.trim() || !correo?.trim()) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const slot = await prisma.slotRestringido.findUnique({ where: { id: slotId } });
  if (!slot || slot.status !== 'INVITADO') {
    return NextResponse.json({ error: 'Este espacio no tiene una invitación pendiente' }, { status: 409 });
  }
  if (!slot.usuarioId) {
    return NextResponse.json(
      { error: 'Este espacio todavía no está inicializado. Corre el backfill de Red General.' },
      { status: 409 }
    );
  }

  const correoNormalizado = correo.trim().toLowerCase();
  const yaExiste = await prisma.user.findFirst({
    where: { correo: correoNormalizado, NOT: { id: slot.usuarioId } },
  });
  if (yaExiste) {
    return NextResponse.json({ error: 'Ya existe una cuenta con este correo' }, { status: 409 });
  }

  // Esta persona reclama la fila "reservada" que ya está conectada en
  // su posición exacta dentro del árbol de la Red General (ver
  // prisma/backfill-red-general.mjs) — se ACTUALIZA esa misma fila,
  // nunca se crea una nueva. No se le asigna contraseña aquí — queda
  // pendiente un flujo de "crear tu contraseña" (ver NOTAS_RED_USUARIOS.md).
  // Misma regla del 30 de octubre que el resto de las membresías —
  // confirmado por el cliente el 22 sept 2026 (ver src/lib/membresia.ts).
  const expiraEnRestringido = proximoVencimientoMembresia();

  const nuevoUsuario = await prisma.user.update({
    where: { id: slot.usuarioId },
    data: {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correoNormalizado,
      telefono: telefono?.trim() || null,
      pais: pais?.trim() || null,
      status: 'ACTIVA',
      correoConfirmado: true,
      membresiaExpiraEn: expiraEnRestringido,
      reservado: false,
    },
  });

  await prisma.slotRestringido.update({
    where: { id: slotId },
    data: { status: 'OCUPADO', inviteLink: null },
  });

  return NextResponse.json({ ok: true, usuario: nuevoUsuario });
}
