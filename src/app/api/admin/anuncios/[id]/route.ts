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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const data: { etiqueta?: string; texto?: string; activo?: boolean } = {};

  if (typeof body.etiqueta === 'string') {
    if (!body.etiqueta.trim()) {
      return NextResponse.json({ error: 'La etiqueta no puede quedar vacía' }, { status: 400 });
    }
    data.etiqueta = body.etiqueta.trim();
  }
  if (typeof body.texto === 'string') {
    if (!body.texto.trim()) {
      return NextResponse.json({ error: 'El texto no puede quedar vacío' }, { status: 400 });
    }
    data.texto = body.texto.trim();
  }
  if (typeof body.activo === 'boolean') {
    data.activo = body.activo;
  }

  const existente = await prisma.anuncio.findUnique({ where: { id: params.id } });
  if (!existente) {
    return NextResponse.json({ error: 'Este anuncio ya no existe' }, { status: 404 });
  }

  const anuncio = await prisma.anuncio.update({ where: { id: params.id }, data });
  return NextResponse.json({ anuncio });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const existente = await prisma.anuncio.findUnique({ where: { id: params.id } });
  if (!existente) {
    return NextResponse.json({ error: 'Este anuncio ya no existe' }, { status: 404 });
  }

  await prisma.anuncio.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
