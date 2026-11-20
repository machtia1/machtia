import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { sesionProfesor } from '@/lib/cursosProfesorServidor';
import { MAX_VIDEO_BYTES } from '@/lib/cursosProfesor';

/**
 * Subida directa de archivos del profesor (videos, fotos y archivos del curso)
 * a Vercel Blob. El navegador envía el archivo directo al almacenamiento, así
 * que no tiene el límite de 4.5 MB de las rutas del servidor. Aquí solo se
 * autoriza quién puede subir y qué tipo/tamaño se permite.
 */
const TIPOS: Record<string, { tipos: string[]; max: number }> = {
  video: { tipos: ['video/mp4'], max: MAX_VIDEO_BYTES },
  imagen: { tipos: ['image/jpeg', 'image/png', 'image/webp'], max: 8 * 1024 * 1024 },
  archivo: {
    tipos: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'text/plain',
    ],
    max: 50 * 1024 * 1024,
  },
};

export async function POST(request: Request) {
  const cuerpo = (await request.json()) as HandleUploadBody;

  try {
    const respuesta = await handleUpload({
      body: cuerpo,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Solo un Profesor/Facilitador con sesión puede pedir permiso de subida.
        const sesion = sesionProfesor();
        if (!sesion) throw new Error('No autorizado');

        let tipo = 'archivo';
        try {
          tipo = JSON.parse(clientPayload ?? '{}').tipo ?? 'archivo';
        } catch {
          /* se usa el tipo por defecto */
        }
        const regla = TIPOS[tipo];
        if (!regla) throw new Error('Tipo de archivo no permitido');
        if (!pathname.startsWith(`profesores/${sesion.userId}/`)) throw new Error('Ruta no permitida');

        return {
          allowedContentTypes: regla.tipos,
          maximumSizeInBytes: regla.max,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        /* nada que registrar: la URL la guarda el editor al guardar el curso */
      },
    });
    return NextResponse.json(respuesta);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
