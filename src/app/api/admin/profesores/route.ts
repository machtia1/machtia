import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MAX_ESPACIOS_PROFESOR } from '@/lib/profesores';

function soloAdmin() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  return !!session && session.rol === 'ADMINISTRADOR';
}

/** Lista los espacios de Profesor/Facilitador ya creados. */
export async function GET() {
  if (!soloAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const espacios = await prisma.espacioProfesor.findMany({
    orderBy: { numero: 'asc' },
    include: {
      usuario: {
        select: { id: true, nombre: true, apellido: true, correo: true, status: true },
      },
    },
  });

  return NextResponse.json({ espacios, maximo: MAX_ESPACIOS_PROFESOR });
}

/** Crea el siguiente espacio disponible (con su link de invitación). */
export async function POST() {
  if (!soloAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const existentes = await prisma.espacioProfesor.findMany({ select: { numero: true } });
  if (existentes.length >= MAX_ESPACIOS_PROFESOR) {
    return NextResponse.json(
      { error: `Ya se crearon los ${MAX_ESPACIOS_PROFESOR} espacios permitidos.` },
      { status: 409 }
    );
  }

  // Usa el número libre más bajo (así, si se elimina uno sin usar, se reutiliza).
  const usados = new Set(existentes.map((e) => e.numero));
  let numero = 1;
  while (usados.has(numero)) numero++;

  try {
    const espacio = await prisma.espacioProfesor.create({
      data: { numero, inviteLink: randomUUID(), status: 'INVITADO' },
    });
    return NextResponse.json({ espacio });
  } catch (error) {
    console.error('Error creando espacio de profesor:', error);
    return NextResponse.json(
      { error: 'No se pudo crear el espacio. Intenta de nuevo.' },
      { status: 409 }
    );
  }
}
