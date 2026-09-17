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

  const anuncios = await prisma.anuncio.findMany({
    orderBy: { creadoEn: 'desc' },
  });

  return NextResponse.json({ anuncios });
}

export async function POST(request: Request) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { etiqueta, texto } = await request.json();
  if (!etiqueta?.trim() || !texto?.trim()) {
    return NextResponse.json({ error: 'Falta la etiqueta o el texto del anuncio' }, { status: 400 });
  }

  const anuncio = await prisma.anuncio.create({
    data: { etiqueta: etiqueta.trim(), texto: texto.trim() },
  });

  return NextResponse.json({ anuncio });
}
