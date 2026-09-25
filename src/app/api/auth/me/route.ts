import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET() {
  const token = cookies().get('session')?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = verifySession(token);
  if (!payload) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      correo: true,
      rol: true,
      status: true,
      linkInvitacion: true,
      fotoPerfilUrl: true,
    },
  });

  if (!user || user.status !== 'ACTIVA') {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
