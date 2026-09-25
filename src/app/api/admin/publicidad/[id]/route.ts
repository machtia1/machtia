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

/** Permite activar/desactivar una imagen o cambiar su posición (orden) en el carrusel. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { activo, orden } = await request.json();
  const data: { activo?: boolean; orden?: number } = {};
  if (typeof activo === 'boolean') data.activo = activo;
  if (typeof orden === 'number') data.orden = orden;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No hay nada que actualizar' }, { status: 400 });
  }

  const imagen = await prisma.publicidadImagen.update({ where: { id: params.id }, data });
  return NextResponse.json({ imagen });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await prisma.publicidadImagen.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
