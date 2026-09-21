import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Público (cualquier usuario logueado ve esto en su Dashboard). */
export async function GET() {
  const anuncios = await prisma.anuncio.findMany({
    where: { activo: true },
    orderBy: { creadoEn: 'desc' },
    take: 10,
    select: { id: true, etiqueta: true, texto: true, creadoEn: true, mediaUrl: true, mediaTipo: true },
  });

  return NextResponse.json({ anuncios });
}
