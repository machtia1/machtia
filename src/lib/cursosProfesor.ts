/**
 * Datos y validación de los cursos que crea un Profesor/Facilitador.
 * Se usa tanto en el navegador (editor) como en el servidor (API), para que
 * las reglas sean exactamente las mismas en los dos lados.
 *
 * Valores iniciales acordados (se pueden cambiar si el cliente lo pide):
 *  - hasta 12 módulos por curso, un video por módulo (MP4, máximo 200 MB)
 *  - hasta 4 preguntas por módulo, de 2 a 4 opciones, una o varias correctas
 *  - calificación: de 0 a 100, mínima para aprobar 70
 */
export const MAX_MODULOS = 12;
export const MAX_PREGUNTAS = 4;
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 4;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const CALIFICACION_MINIMA_DEFECTO = 70;
export const CALIFICACION_MAXIMA_DEFECTO = 100;

export const CATEGORIAS = [
  { valor: 'NEGOCIOS', etiqueta: 'Negocios' },
  { valor: 'FINANZAS', etiqueta: 'Finanzas' },
  { valor: 'MARKETING', etiqueta: 'Marketing' },
  { valor: 'SALUD', etiqueta: 'Salud' },
  { valor: 'IDIOMAS', etiqueta: 'Idiomas' },
  { valor: 'HABILIDADES_DIGITALES', etiqueta: 'Habilidades digitales' },
] as const;

export interface PreguntaPayload {
  texto: string;
  opciones: string[];
  correctas: number[];
}

export interface ModuloPayload {
  id?: string;
  titulo: string;
  videoUrl: string;
  duracionMinutos: number;
  preguntas: PreguntaPayload[];
}

export interface ArchivoPayload {
  nombre: string;
  url: string;
  tamano: number;
}

export interface CursoPayload {
  titulo: string;
  categoria: string;
  tema: string;
  temario: string;
  horas: number;
  portadaUrl: string;
  calificacionMinima: number;
  calificacionMaxima: number;
  permiteArchivos: boolean;
  modulos: ModuloPayload[];
  archivos: ArchivoPayload[];
}

export interface PerfilPayload {
  nombrePublico: string;
  especialidad: string;
  estudios: string;
  fotoUrl: string;
}

export function cursoVacio(): CursoPayload {
  return {
    titulo: '',
    categoria: 'NEGOCIOS',
    tema: '',
    temario: '',
    horas: 1,
    portadaUrl: '',
    calificacionMinima: CALIFICACION_MINIMA_DEFECTO,
    calificacionMaxima: CALIFICACION_MAXIMA_DEFECTO,
    permiteArchivos: false,
    modulos: [moduloVacio()],
    archivos: [],
  };
}

export function moduloVacio(): ModuloPayload {
  return { titulo: '', videoUrl: '', duracionMinutos: 5, preguntas: [] };
}

export function preguntaVacia(): PreguntaPayload {
  return { texto: '', opciones: ['', ''], correctas: [] };
}

const esUrlHttps = (u: unknown): u is string => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u);
const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const entero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : NaN);

export interface ResultadoValidacion {
  errores: string[];
  /** true si el curso ya se puede mostrar al público (tiene portada y todos sus módulos tienen video). */
  publicable: boolean;
  /** Datos ya limpios, solo válidos si no hay errores. */
  limpio: CursoPayload | null;
}

/** Revisa y limpia un curso. Los errores impiden guardar; "publicable" decide si ya se muestra. */
export function validarCurso(entrada: unknown): ResultadoValidacion {
  const errores: string[] = [];
  const p = (entrada && typeof entrada === 'object' ? entrada : {}) as Record<string, unknown>;

  const titulo = texto(p.titulo, 120);
  const tema = texto(p.tema, 200);
  const temario = texto(p.temario, 4000);
  const categoria = typeof p.categoria === 'string' ? p.categoria : '';
  const horas = typeof p.horas === 'number' ? p.horas : Number(p.horas);
  const portadaUrl = esUrlHttps(p.portadaUrl) ? p.portadaUrl : '';
  const calMin = entero(p.calificacionMinima);
  const calMax = entero(p.calificacionMaxima);

  if (!titulo) errores.push('Escribe el título del curso.');
  if (!CATEGORIAS.some((c) => c.valor === categoria)) errores.push('Elige la categoría del curso.');
  if (!tema) errores.push('Escribe el tema del curso.');
  if (!Number.isFinite(horas) || horas <= 0 || horas > 500) errores.push('Las horas del curso deben ser un número mayor a 0 (máximo 500).');
  if (!Number.isFinite(calMin) || !Number.isFinite(calMax) || calMin < 0 || calMax > 1000 || calMin > calMax || calMax < 1) {
    errores.push('La calificación mínima debe ser menor o igual a la máxima (por ejemplo, mínima 70 y máxima 100).');
  }

  const modulosEntrada = Array.isArray(p.modulos) ? p.modulos : [];
  if (modulosEntrada.length < 1) errores.push('El curso necesita al menos 1 módulo.');
  if (modulosEntrada.length > MAX_MODULOS) errores.push(`El curso puede tener máximo ${MAX_MODULOS} módulos.`);

  const modulos: ModuloPayload[] = [];
  modulosEntrada.slice(0, MAX_MODULOS).forEach((mRaw, i) => {
    const m = (mRaw && typeof mRaw === 'object' ? mRaw : {}) as Record<string, unknown>;
    const n = i + 1;
    const tituloM = texto(m.titulo, 120);
    if (!tituloM) errores.push(`Módulo ${n}: escribe el título.`);
    const preguntasEntrada = Array.isArray(m.preguntas) ? m.preguntas : [];
    if (preguntasEntrada.length > MAX_PREGUNTAS) errores.push(`Módulo ${n}: máximo ${MAX_PREGUNTAS} preguntas.`);
    const preguntas: PreguntaPayload[] = [];
    preguntasEntrada.slice(0, MAX_PREGUNTAS).forEach((qRaw, j) => {
      const q = (qRaw && typeof qRaw === 'object' ? qRaw : {}) as Record<string, unknown>;
      const nq = `Módulo ${n}, pregunta ${j + 1}`;
      const textoQ = texto(q.texto, 500);
      const opciones = Array.isArray(q.opciones) ? q.opciones.map((o) => texto(o, 300)) : [];
      const correctas = Array.isArray(q.correctas)
        ? Array.from(new Set(q.correctas.map(entero))).filter((x) => Number.isInteger(x)).sort((a, b) => a - b)
        : [];
      if (!textoQ) errores.push(`${nq}: escribe la pregunta.`);
      if (opciones.length < MIN_OPCIONES || opciones.length > MAX_OPCIONES) {
        errores.push(`${nq}: debe tener de ${MIN_OPCIONES} a ${MAX_OPCIONES} opciones.`);
      } else if (opciones.some((o) => !o)) {
        errores.push(`${nq}: completa todas las opciones.`);
      }
      if (correctas.length < 1 || correctas.some((c) => c < 0 || c >= opciones.length)) {
        errores.push(`${nq}: marca al menos una respuesta correcta.`);
      }
      preguntas.push({ texto: textoQ, opciones, correctas });
    });
    const dur = entero(m.duracionMinutos);
    modulos.push({
      id: typeof m.id === 'string' && m.id ? m.id : undefined,
      titulo: tituloM,
      videoUrl: esUrlHttps(m.videoUrl) ? m.videoUrl : '',
      duracionMinutos: Number.isFinite(dur) && dur > 0 ? Math.min(dur, 600) : 5,
      preguntas,
    });
  });

  const permiteArchivos = p.permiteArchivos === true;
  const archivos: ArchivoPayload[] = [];
  if (permiteArchivos && Array.isArray(p.archivos)) {
    p.archivos.slice(0, 30).forEach((aRaw) => {
      const a = (aRaw && typeof aRaw === 'object' ? aRaw : {}) as Record<string, unknown>;
      if (esUrlHttps(a.url)) {
        const tam = entero(a.tamano);
        archivos.push({ nombre: texto(a.nombre, 200) || 'Archivo', url: a.url, tamano: Number.isFinite(tam) && tam > 0 ? tam : 0 });
      }
    });
  }

  const publicable = errores.length === 0 && !!portadaUrl && modulos.length > 0 && modulos.every((m) => !!m.videoUrl);

  return {
    errores,
    publicable,
    limpio:
      errores.length === 0
        ? { titulo, categoria, tema, temario, horas, portadaUrl, calificacionMinima: calMin, calificacionMaxima: calMax, permiteArchivos, modulos, archivos }
        : null,
  };
}

/** Lo que le falta a un curso para publicarse (se muestra al profesor). */
export function faltantesParaPublicar(c: CursoPayload): string[] {
  const f: string[] = [];
  if (!c.portadaUrl) f.push('la foto de portada');
  c.modulos.forEach((m, i) => {
    if (!m.videoUrl) f.push(`el video del módulo ${i + 1}`);
  });
  return f;
}

export function validarPerfil(entrada: unknown): { errores: string[]; limpio: PerfilPayload | null } {
  const p = (entrada && typeof entrada === 'object' ? entrada : {}) as Record<string, unknown>;
  const nombrePublico = texto(p.nombrePublico, 80);
  const especialidad = texto(p.especialidad, 100);
  const estudios = texto(p.estudios, 3000);
  const fotoUrl = esUrlHttps(p.fotoUrl) ? p.fotoUrl : '';
  const errores: string[] = [];
  if (!nombrePublico) errores.push('Escribe tu nombre público.');
  if (!especialidad) errores.push('Escribe tu especialidad o título principal.');
  return { errores, limpio: errores.length ? null : { nombrePublico, especialidad, estudios, fotoUrl } };
}
