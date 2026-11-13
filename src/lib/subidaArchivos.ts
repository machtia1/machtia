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

/** Texto corto con el error técnico, para mostrarlo en letra chica y poder diagnosticar. */
export function detalleTecnico(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 160);
  return String(error).slice(0, 160);
}

// ------------------------------------------------------------
// Copia del archivo a la memoria
// ------------------------------------------------------------
// Cuando la persona elige una foto desde su galería, la nube o una
// app de mensajes, el celular entrega una "referencia" al archivo, no
// el archivo mismo. Si esa referencia cambia o se vuelve ilegible
// entre que se elige y que se envía (pasa con archivos de la nube o
// sin extensión, por ejemplo "Foto de Felipe"), Chrome corta el envío
// antes de que salga, y aparece un error de conexión aunque el
// internet esté bien. Por eso, al elegir el archivo lo leemos de una
// vez y trabajamos con una copia en memoria.
// ------------------------------------------------------------

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

/** Reconoce el tipo real del archivo por sus primeros bytes (no confía en el nombre). */
export function detectarTipo(inicio: Uint8Array): string | null {
  const b = inicio;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    return 'image/heic'; // HEIC/HEIF/AVIF comparten esta marca "ftyp"
  }
  return null;
}

/** Asegura que el nombre termine con la extensión que corresponde al tipo. */
function nombreConExtension(nombre: string, tipo: string): string {
  const ext = EXTENSION_POR_TIPO[tipo];
  const limpio = nombre.trim() || 'comprobante';
  if (!ext) return limpio;
  if (new RegExp(`\\.${ext}$`, 'i').test(limpio)) return limpio;
  if (ext === 'jpg' && /\.jpe?g$/i.test(limpio)) return limpio;
  return /\.[A-Za-z0-9]{2,5}$/.test(limpio) ? limpio : `${limpio}.${ext}`;
}

function leerBytes(archivo: Blob): Promise<ArrayBuffer> {
  if (typeof archivo.arrayBuffer === 'function') return archivo.arrayBuffer();
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as ArrayBuffer);
    lector.onerror = () => reject(lector.error ?? new Error('No se pudo leer el archivo'));
    lector.readAsArrayBuffer(archivo);
  });
}

/**
 * Lee el archivo completo y devuelve una copia en memoria, con el tipo
 * detectado por su contenido y el nombre con su extensión correcta.
 * Lanza un Error con mensaje listo para mostrar si no se puede leer.
 */
export async function copiarEnMemoria(archivo: File): Promise<File> {
  let bytes: ArrayBuffer;
  try {
    bytes = await leerBytes(archivo);
  } catch {
    throw new Error(
      'No pudimos leer este archivo. Elígelo de nuevo, o toma una captura de pantalla de la foto y sube esa captura.'
    );
  }
  if (bytes.byteLength === 0) {
    throw new Error('El archivo está vacío. Elige otro o toma una captura de pantalla de la foto.');
  }

  const tipo =
    detectarTipo(new Uint8Array(bytes.slice(0, 16))) || archivo.type || 'application/octet-stream';
  return new File([bytes], nombreConExtension(archivo.name, tipo), {
    type: tipo,
    lastModified: Date.now(),
  });
}

/** Contenido del archivo en base64 (sin el encabezado "data:..."). */
export function archivoABase64(archivo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const texto = String(lector.result ?? '');
      resolve(texto.slice(texto.indexOf(',') + 1));
    };
    lector.onerror = () => reject(lector.error ?? new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}

// ------------------------------------------------------------
// Envío del registro con reintentos y camino de respaldo
// ------------------------------------------------------------

/** Tope para el envío de respaldo (base64 pesa ~33 % más y Vercel limita a 4.5 MB). */
const LIMITE_RESPALDO_BYTES = 2.5 * 1024 * 1024;

export interface ResultadoEnvio {
  ok: boolean;
  error?: string;
  /** Detalle técnico del último fallo de red, para mostrarlo en letra chica. */
  detalle?: string;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Envía el registro a /api/registro. Si el envío se corta antes de
 * llegar al servidor (error de red), reintenta una vez igual y, de
 * último, lo manda por un camino distinto (JSON con el archivo en
 * base64, sin formulario multipart), que sortea los fallos propios
 * del envío de archivos en algunos celulares y redes.
 *
 * Solo se reintenta cuando el envío NO obtuvo respuesta. Si la primera
 * vez sí llegó pero la respuesta se perdió, el reintento recibirá
 * "ya existe una cuenta con este correo": en ese caso (y solo en ese)
 * se toma como registro exitoso.
 */
export async function enviarRegistroComprobante(
  campos: Record<string, string>,
  archivo: File,
  enviar: typeof fetch = (...args) => fetch(...args),
  pausaMs = 700
): Promise<ResultadoEnvio> {
  const modos: Array<'multipart' | 'multipart' | 'json'> = ['multipart', 'multipart', 'json'];
  let huboFalloDeRed = false;
  let detalle = '';

  for (let i = 0; i < modos.length; i++) {
    const modo = modos[i];
    if (modo === 'json' && archivo.size > LIMITE_RESPALDO_BYTES) break;

    try {
      if (i > 0) await esperar(pausaMs * i);

      let res: Response;
      if (modo === 'multipart') {
        const formData = new FormData();
        for (const [clave, valor] of Object.entries(campos)) formData.append(clave, valor);
        formData.append('comprobante', archivo);
        res = await enviar('/api/registro', { method: 'POST', body: formData });
      } else {
        const comprobanteBase64 = await archivoABase64(archivo);
        res = await enviar('/api/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...campos,
            comprobanteNombre: archivo.name,
            comprobanteTipo: archivo.type,
            comprobanteBase64,
          }),
        });
      }

      const { ok, error } = await leerRespuestaApi(res);
      if (ok) return { ok: true };
      if (huboFalloDeRed && res.status === 409 && error?.includes('Ya existe una cuenta con este correo')) {
        return { ok: true }; // El primer envío sí había llegado; solo se perdió la respuesta.
      }
      return { ok: false, error };
    } catch (err) {
      huboFalloDeRed = true;
      detalle = detalleTecnico(err);
    }
  }

  return { ok: false, error: mensajeErrorRed(), detalle };
}
