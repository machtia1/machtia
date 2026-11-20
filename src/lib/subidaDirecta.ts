import { upload } from '@vercel/blob/client';
import { MAX_VIDEO_BYTES } from '@/lib/cursosProfesor';

export type TipoSubida = 'video' | 'imagen' | 'archivo';

const LIMITES: Record<TipoSubida, number> = {
  video: MAX_VIDEO_BYTES,
  imagen: 8 * 1024 * 1024,
  archivo: 50 * 1024 * 1024,
};

export function formatearMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

/** Revisa el archivo antes de subirlo; devuelve un mensaje de error o null si está bien. */
export function revisarArchivo(file: File, tipo: TipoSubida): string | null {
  if (tipo === 'video' && file.type !== 'video/mp4') return 'El video debe ser un archivo MP4.';
  if (tipo === 'imagen' && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'La imagen debe ser JPG, PNG o WEBP.';
  }
  if (file.size > LIMITES[tipo]) {
    return `El archivo pesa ${formatearMB(file.size)} y el máximo es ${formatearMB(LIMITES[tipo])}.`;
  }
  return null;
}

/**
 * Sube un archivo directo a Vercel Blob desde el navegador (sin pasar por el
 * servidor, así que no hay límite de 4.5 MB). Si algún día se cambia de
 * proveedor de videos, solo hay que cambiar esta función y /api/profesor/subida.
 */
export async function subirDirecto(
  file: File,
  tipo: TipoSubida,
  userId: string,
  alProgreso?: (porcentaje: number) => void
): Promise<string> {
  const nombreSeguro = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80) || 'archivo';
  const resultado = await upload(`profesores/${userId}/${tipo}/${nombreSeguro}`, file, {
    access: 'public',
    handleUploadUrl: '/api/profesor/subida',
    clientPayload: JSON.stringify({ tipo }),
    multipart: file.size > 20 * 1024 * 1024,
    onUploadProgress: (e) => alProgreso?.(Math.round(e.percentage)),
  });
  return resultado.url;
}

/** Duración del video en minutos (redondeada hacia arriba), leída del propio archivo. */
export function duracionVideoMinutos(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    let terminado = false;
    const fin = (min: number) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(espera);
      URL.revokeObjectURL(url);
      resolve(min);
    };
    // Si el navegador no puede leer el video (códec raro), no se queda esperando.
    const espera = setTimeout(() => fin(5), 4000);
    v.preload = 'metadata';
    v.onloadedmetadata = () => fin(Number.isFinite(v.duration) && v.duration > 0 ? Math.max(1, Math.ceil(v.duration / 60)) : 5);
    v.onerror = () => fin(5);
    v.src = url;
  });
}
