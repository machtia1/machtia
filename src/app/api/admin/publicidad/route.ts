import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAXIMO_IMAGENES = 8;

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

  const imagenes = await prisma.publicidadImagen.findMany({
    orderBy: { orden: 'asc' },
  });

  return NextResponse.json({ imagenes, maximo: MAXIMO_IMAGENES });
}

export async function POST(request: Request) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { imagenUrl } = await request.json();
  if (!imagenUrl?.trim()) {
    return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
  }

  const total = await prisma.publicidadImagen.count();
  if (total >= MAXIMO_IMAGENES) {
    return NextResponse.json(
      { error: `El carrusel de Publicidad admite máximo ${MAXIMO_IMAGENES} imágenes. Borra o desactiva alguna antes de agregar otra.` },
      { status: 400 }
    );
  }

  const ultima = await prisma.publicidadImagen.findFirst({ orderBy: { orden: 'desc' } });
  const siguienteOrden = ultima ? ultima.orden + 1 : 0;

  const imagen = await prisma.publicidadImagen.create({
    data: { imagenUrl: imagenUrl.trim(), orden: siguienteOrden },
  });

  return NextResponse.json({ imagen });
}
