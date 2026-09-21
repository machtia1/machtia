import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function requiereAdmin() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session || session.rol !== 'ADMINISTRADOR') return null;
  return session;
}

export async function GET() {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const notificaciones = await prisma.notificacion.findMany({
    orderBy: { creadoEn: 'desc' },
    take: 30,
  });

  return NextResponse.json({ notificaciones });
}

export async function POST(request: Request) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { mensaje } = await request.json();
  if (!mensaje?.trim()) {
    return NextResponse.json({ error: 'Falta el mensaje de la notificación' }, { status: 400 });
  }
  if (mensaje.trim().length > 300) {
    return NextResponse.json({ error: 'El mensaje no debe pasar de 300 caracteres' }, { status: 400 });
  }

  const notificacion = await prisma.notificacion.create({
    data: { mensaje: mensaje.trim() },
  });

  return NextResponse.json({ notificacion });
}
