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

// Medidas/duración aplicadas (pedido del cliente el 20 sept 2026:
// "Anuncios deben poder integrar imágenes o videos cortos, señalar
// las características y medidas aplicadas"):
//   - Imagen: hasta 5 MB, JPG/PNG/WEBP. Se recomienda 1200x630px
//     (proporción 1.9:1) para que se vea nítida sin recortarse feo
//     en la tarjeta de "Anuncios y avisos" del Dashboard.
//   - Video: hasta 25 MB, MP4/WEBM. Sin límite de duración validado
//     en el servidor, pero se recomienda 15-30 segundos como máximo
//     para que cargue rápido dentro de la tarjeta.
const TAMANO_MAX_IMAGEN = 5 * 1024 * 1024;
const TAMANO_MAX_VIDEO = 25 * 1024 * 1024;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const TIPOS_VIDEO = ['video/mp4', 'video/webm'];

export async function POST(request: Request) {
  if (!requiereAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const formData = await request.formData();
  const archivo = formData.get('archivo');

  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: 'Sube una imagen o un video' }, { status: 400 });
  }

  let mediaTipo: 'IMAGEN' | 'VIDEO';
  if (TIPOS_IMAGEN.includes(archivo.type)) {
    mediaTipo = 'IMAGEN';
    if (archivo.size > TAMANO_MAX_IMAGEN) {
      return NextResponse.json({ error: 'La imagen no debe pesar más de 5 MB' }, { status: 400 });
    }
  } else if (TIPOS_VIDEO.includes(archivo.type)) {
    mediaTipo = 'VIDEO';
    if (archivo.size > TAMANO_MAX_VIDEO) {
      return NextResponse.json({ error: 'El video no debe pesar más de 25 MB' }, { status: 400 });
    }
  } else {
    return NextResponse.json(
      { error: 'Formato no soportado — usa JPG, PNG, WEBP (imagen) o MP4, WEBM (video)' },
      { status: 400 }
    );
  }

  const extension = archivo.name.split('.').pop() || (mediaTipo === 'IMAGEN' ? 'jpg' : 'mp4');
  const blob = await put(`anuncios/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`, archivo, {
    access: 'public',
  });

  return NextResponse.json({ mediaUrl: blob.url, mediaTipo });
}
