import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const yaExiste = await prisma.user.findUnique({ where: { correo: correo.trim().toLowerCase() } });
  if (yaExiste) {
    return NextResponse.json({ error: 'Ya existe una cuenta con este correo' }, { status: 409 });
  }

  // Esta persona ocupa uno de los primeros 8 niveles: es "raíz" de su
  // propia red (sin padreRedId), fuera de la restricción, tal como
  // describe la regla del cliente. No se le asigna contraseña aquí —
  // queda pendiente un flujo de "crear tu contraseña" para que pueda
  // iniciar sesión (ver NOTAS_RED_USUARIOS.md).
  const expiraEnRestringido = new Date();
  expiraEnRestringido.setDate(expiraEnRestringido.getDate() + 365); // 365 días, misma regla que el resto de las membresías

  const nuevoUsuario = await prisma.user.create({
    data: {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      pais: pais?.trim() || null,
      status: 'ACTIVA',
      correoConfirmado: true,
      membresiaExpiraEn: expiraEnRestringido,
    },
  });

  await prisma.slotRestringido.update({
    where: { id: slotId },
    data: { status: 'OCUPADO', inviteLink: null, usuarioId: nuevoUsuario.id },
  });

  return NextResponse.json({ ok: true, usuario: nuevoUsuario });
}
