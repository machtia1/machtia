import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Público (cualquier usuario logueado ve esto en Publicidad). */
export async function GET() {
  const imagenes = await prisma.publicidadImagen.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    take: 8,
    select: { id: true, imagenUrl: true },
  });

  return NextResponse.json({ imagenes });
}
