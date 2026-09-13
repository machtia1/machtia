import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const pendientes = await prisma.user.findMany({
    where: { status: 'PENDIENTE_APROBACION' },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
      ladaPais: true,
      pais: true,
      estadoProvincia: true,
      ciudad: true,
      suscripcion: true,
      comprobantePagoUrl: true,
      creadoEn: true,
      invitadoPor: { select: { nombre: true, apellido: true } },
    },
    orderBy: { creadoEn: 'asc' },
  });

  return NextResponse.json({ pendientes });
}
