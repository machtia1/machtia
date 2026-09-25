import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';
import { verifySession } from '@/lib/auth';

function requiereAdmin() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session || session.rol !== 'ADMINISTRADOR') return null;
  return session;
}

// Formato publicación de Facebook (recomendado 1200x630px, 1.9:1),
// pedido por el cliente el 25 sept 2026: "carrusel de 8 imágenes
// descargable en formato Facebook" para la nueva sección Publicidad.
const TAMANO_MAX_IMAGEN = 5 * 1024 * 1024;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const formData = await request.formData();
  const archivo = formData.get('archivo');

  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: 'Sube una imagen' }, { status: 400 });
  }

  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    return NextResponse.json({ error: 'Formato no soportado — usa JPG, PNG o WEBP' }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAX_IMAGEN) {
    return NextResponse.json({ error: 'La imagen no debe pesar más de 5 MB' }, { status: 400 });
  }

  // Nota (25 sept 2026): igual que en Anuncios, la carpeta se llama
  // "uploads" y no "publicidad" a propósito — esa palabra es de las
  // que más bloquean los ad-blockers, y justo es la misma falla que
  // el cliente reportó con los anuncios.
  const extension = archivo.name.split('.').pop() || 'jpg';
  const blob = await put(`uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`, archivo, {
    access: 'public',
  });

  return NextResponse.json({ imagenUrl: blob.url });
}
