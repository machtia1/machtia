import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const usuario = await prisma.user.findUnique({
    where: { tokenConfirmacion: params.token },
    select: { nombre: true },
  });

  if (!usuario) {
    return NextResponse.json({ error: 'Este link ya no es válido o expiró' }, { status: 404 });
  }

  return NextResponse.json({ nombre: usuario.nombre });
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { password } = await request.json();
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  const usuario = await prisma.user.findUnique({ where: { tokenConfirmacion: params.token } });
  if (!usuario) {
    return NextResponse.json({ error: 'Este link ya no es válido o expiró' }, { status: 404 });
  }

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: usuario.id },
    data: {
      passwordHash,
      tokenConfirmacion: null, // de un solo uso
      correoConfirmado: true,
    },
  });

  return NextResponse.json({ ok: true });
}
