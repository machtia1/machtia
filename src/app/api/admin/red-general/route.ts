import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_NIVEL = 8;

async function asegurarSlotsCreados() {
  const existentes = await prisma.slotRestringido.count();
  if (existentes > 0) return;

  const datos: { nivel: number; posicion: number }[] = [];
  for (let nivel = 1; nivel <= MAX_NIVEL; nivel++) {
    const totalEnNivel = 2 ** nivel;
    for (let pos = 1; pos <= totalEnNivel; pos++) {
      datos.push({ nivel, posicion: pos });
    }
  }
  await prisma.slotRestringido.createMany({ data: datos, skipDuplicates: true });
}

export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await asegurarSlotsCreados();

  const slots = await prisma.slotRestringido.findMany({
    orderBy: [{ nivel: 'asc' }, { posicion: 'asc' }],
    include: {
      usuario: {
        select: { id: true, nombre: true, apellido: true, correo: true, telefono: true, pais: true, linkInvitacion: true },
      },
    },
  });

  return NextResponse.json({ slots });
}
