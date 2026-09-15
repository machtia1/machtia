import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TAMANO_MAX_FOTO = 4 * 1024 * 1024; // 4 MB
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const formData = await request.formData();
  const foto = formData.get('foto');

  if (!(foto instanceof File) || foto.size === 0) {
    return NextResponse.json({ error: 'Sube una imagen' }, { status: 400 });
  }
  if (foto.size > TAMANO_MAX_FOTO) {
    return NextResponse.json({ error: 'La imagen no debe pesar más de 4 MB' }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.includes(foto.type)) {
    return NextResponse.json({ error: 'Formato no soportado — usa JPG, PNG o WEBP' }, { status: 400 });
  }

  const extension = foto.name.split('.').pop() || 'jpg';
  const blob = await put(`perfiles/${session.userId}-${Date.now()}.${extension}`, foto, {
    access: 'public',
  });

  const actualizado = await prisma.user.update({
    where: { id: session.userId },
    data: { fotoPerfilUrl: blob.url },
    select: { fotoPerfilUrl: true },
  });

  return NextResponse.json({ usuario: actualizado });
}
