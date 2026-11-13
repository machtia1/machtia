// ============================================================
// Subida de archivos desde el navegador (comprobantes y fotos)
// ------------------------------------------------------------
// Por qué existe: Vercel rechaza cualquier envío de más de ~4.5 MB
// ANTES de que llegue a la plataforma, con una respuesta que no es
// JSON. Las fotos de celular suelen pesar de 4 a 10 MB, así que la
// persona veía un genérico "Error de conexión" sin saber qué pasó
// (13 nov 2026). Este archivo resuelve dos cosas:
//
//   1. Reduce sola la foto en el celular (tamaño y calidad) antes de
//      enviarla, para que nadie tenga que preocuparse del peso.
//   2. Interpreta las respuestas del servidor aunque no sean JSON y
//      devuelve un mensaje claro de qué pasó.
//
// Solo se usa en el navegador (componentes 'use client').
// ============================================================

/** Mismo tope que validan los servidores (/api/registro y /api/perfil/foto). */
export const LIMITE_SUBIDA_BYTES = 4 * 1024 * 1024;

/** A partir de este peso se reduce la imagen; por debajo se envía tal cual. */
const OBJETIVO_BYTES = 1.5 * 1024 * 1024;

const LADOS_MAXIMOS = [1600, 1280, 1024, 800];
const CALIDADES = [0.85, 0.75, 0.65, 0.55];

export function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Detecta imágenes también cuando el celular no informa el tipo (type vacío). */
export function esImagen(archivo: File): boolean {
  if (archivo.type) return archivo.type.startsWith('image/');
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(archivo.name);
}

interface ImagenCargada {
  fuente: CanvasImageSource;
  ancho: number;
  alto: number;
  liberar: () => void;
}

async function cargarImagen(archivo: File): Promise<ImagenCargada> {
  if (typeof createImageBitmap === 'function') {
    try {
      const mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
      return { fuente: mapa, ancho: mapa.width, alto: mapa.height, liberar: () => mapa.close() };
    } catch {
      // Navegadores viejos o formatos no soportados: se prueba con <img>.
    }
  }

  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen'));
      el.src = url;
    });
    return {
      fuente: img,
      ancho: img.naturalWidth,
      alto: img.naturalHeight,
      liberar: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function canvasABlob(canvas: HTMLCanvasElement, calidad: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', calidad));
}

function nombreJpg(nombreOriginal: string): string {
  const base = nombreOriginal.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'imagen';
  return `${base}.jpg`;
}

export interface ResultadoCompresion {
  archivo: File;
  /** true si la imagen se redujo; false si se envía tal cual. */
  comprimido: boolean;
  pesoOriginal: number;
}

/**
 * Reduce una imagen a un peso seguro para enviarla. Los PDF y otros
 * archivos no se tocan. Si la imagen ya es ligera, tampoco.
 *
 * Lanza un Error con un mensaje listo para mostrar a la persona
 * cuando no se logra dejar el archivo dentro del límite.
 */
export async function comprimirImagen(
  archivo: File,
  opciones: { ladoMaximo?: number; objetivoBytes?: number } = {}
): Promise<ResultadoCompresion> {
  const pesoOriginal = archivo.size;
  const objetivo = opciones.objetivoBytes ?? OBJETIVO_BYTES;
  const sinCambios: ResultadoCompresion = { archivo, comprimido: false, pesoOriginal };

  if (!esImagen(archivo)) return sinCambios;
  if (archivo.size <= objetivo) return sinCambios;

  let imagen: ImagenCargada;
  try {
    imagen = await cargarImagen(archivo);
  } catch {
    // Formato que este navegador no puede abrir (por ejemplo HEIC).
    if (archivo.size <= LIMITE_SUBIDA_BYTES) return sinCambios;
    throw new Error(
      'No pudimos reducir esta imagen. Toma una captura de pantalla de la foto y sube esa captura.'
    );
  }

  try {
    const lados = opciones.ladoMaximo
      ? [opciones.ladoMaximo, ...LADOS_MAXIMOS.filter((l) => l < opciones.ladoMaximo!)]
      : LADOS_MAXIMOS;
    let mejor: Blob | null = null;

    for (const lado of lados) {
      const escala = Math.min(1, lado / Math.max(imagen.ancho, imagen.alto));
      const ancho = Math.max(1, Math.round(imagen.ancho * escala));
      const alto = Math.max(1, Math.round(imagen.alto * escala));

      const canvas = document.createElement('canvas');
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext('2d');
      if (!ctx) break;
      // Fondo blanco: los PNG con transparencia no deben quedar negros al pasar a JPG.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ancho, alto);
      ctx.drawImage(imagen.fuente, 0, 0, ancho, alto);

      for (const calidad of CALIDADES) {
        const blob = await canvasABlob(canvas, calidad);
        if (!blob) continue;
        if (!mejor || blob.size < mejor.size) mejor = blob;
        if (blob.size <= objetivo) {
          mejor = blob;
          break;
        }
      }
      if (mejor && mejor.size <= objetivo) break;
    }

    if (mejor && mejor.size < archivo.size) {
      if (mejor.size > LIMITE_SUBIDA_BYTES) {
        throw new Error(
          'La imagen sigue pesando demasiado. Elige una más pequeña o toma una captura de pantalla.'
        );
      }
      return {
        archivo: new File([mejor], nombreJpg(archivo.name), {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }),
        comprimido: true,
        pesoOriginal,
      };
    }

    // No se logró mejorar: solo sirve si el original ya cabe.
    if (archivo.size <= LIMITE_SUBIDA_BYTES) return sinCambios;
    throw new Error(
      'La imagen pesa demasiado y no pudimos reducirla. Elige una más pequeña o toma una captura de pantalla.'
    );
  } finally {
    imagen.liberar();
  }
}

function mensajePorStatus(status: number): string {
  if (status === 413) return 'La imagen pesa demasiado, elige una más pequeña.';
  if (status === 408 || status === 504) {
    return 'El servidor tardó demasiado en responder. Intenta de nuevo en un momento.';
  }
  if (status === 429) return 'Hay demasiados intentos seguidos. Espera un minuto e intenta de nuevo.';
  if (status >= 500) {
    return `El servidor tuvo un problema (código ${status}). Intenta de nuevo en unos minutos.`;
  }
  return `El servidor respondió de forma inesperada (código ${status}). Intenta de nuevo.`;
}

/**
 * Lee la respuesta del servidor sin romperse si no es JSON (como la
 * que manda Vercel cuando el archivo es demasiado grande) y entrega
 * un mensaje de error claro cuando algo falla.
 */
export async function leerRespuestaApi(
  res: Response
): Promise<{ ok: boolean; data: any | null; error?: string }> {
  const texto = await res.text().catch(() => '');
  let data: any = null;
  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (res.ok) return { ok: true, data };
  if (data && typeof data.error === 'string' && data.error) {
    return { ok: false, data, error: data.error };
  }
  return { ok: false, data: null, error: mensajePorStatus(res.status) };
}

/** Mensaje cuando el envío ni siquiera llegó al servidor (se cortó el internet, etc.). */
export function mensajeErrorRed(): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'No hay conexión a internet. Revisa tu señal e intenta de nuevo.';
  }
  return 'No se pudo enviar la información. Revisa tu conexión e intenta de nuevo.';
}
