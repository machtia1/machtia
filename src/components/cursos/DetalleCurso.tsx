'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Star,
  PlayCircle,
  FileText,
  Award,
  Lock,
  Download,
  ClipboardCheck,
} from 'lucide-react';
import LoadingLogo from '@/components/LoadingLogo';
import { CATEGORIA_LABEL, NIVEL_LABEL } from './TarjetaCurso';

interface Leccion {
  id: string;
  titulo: string;
  orden: number;
  tipoContenido: 'VIDEO' | 'LECTURA';
  contenidoUrl: string | null;
  contenidoTexto: string | null;
  duracionMinutos: number;
  numPreguntas?: number;
}

interface CursoDetalle {
  id: string;
  tipo: 'CURSO' | 'TALLER';
  titulo: string;
  descripcionBreve: string;
  descripcionLarga: string | null;
  portadaUrl: string | null;
  categoria: string;
  nivel: string;
  duracionMinutos: number;
  calificacionPromedio: number;
  numCalificaciones: number;
  instructor: { nombre: string; especialidad: string; fotoUrl: string | null } | null;
  rutaAprendizaje: { id: string; titulo: string } | null;
  lecciones: Leccion[];
}

interface Inscripcion {
  progreso: number;
  completado: boolean;
  calificacionEvaluacion: number | null;
  leccionesCompletadasIds: string[];
}

interface ExamenesInfo {
  calificacionMinima: number;
  calificacionMaxima: number;
  resultados: Record<string, { mejorNota: number; intentos: number }>;
  certificadoFolio: string | null;
}

interface ArchivoAdicional {
  id: string;
  nombre: string;
  url: string;
  tamano: number;
}

interface PreguntaModulo {
  id: string;
  texto: string;
  opciones: string[];
  multiple: boolean;
}

interface ResultadoExamen {
  nota: number;
  aciertos: number;
  total: number;
  detalle: Record<string, boolean>;
  aprobadoModulo: boolean;
}

interface Pregunta {
  id: string;
  pregunta: string;
  opciones: { id: string; texto: string }[];
}

const esVideoDirecto = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
const esYoutube = (url: string) => /youtube\.com|youtu\.be/i.test(url);

function convertirEmbedYoutube(url: string) {
  const idMatch = url.match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
  return idMatch ? `https://www.youtube.com/embed/${idMatch[1]}` : url;
}

/**
 * Detalle + reproductor de curso/taller — Parte 2 de "Elemento 4"
 * pedida por el cliente el 26 sept 2026: lista de lecciones,
 * contenido (video o lectura), marcar como completada, % de
 * avance, y evaluación simple al terminar.
 */
export default function DetalleCurso({ id, tipoRuta }: { id: string; tipoRuta: 'cursos' | 'talleres' }) {
  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [error, setError] = useState('');
  const [leccionActivaId, setLeccionActivaId] = useState<string | null>(null);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [completandoId, setCompletandoId] = useState<string | null>(null);

  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [calificacionFinal, setCalificacionFinal] = useState<number | null>(null);
  const [enviandoEvaluacion, setEnviandoEvaluacion] = useState(false);

  // Examen por módulo (cursos de profesores)
  const [examenes, setExamenes] = useState<ExamenesInfo | null>(null);
  const [archivos, setArchivos] = useState<ArchivoAdicional[]>([]);
  const [examenAbierto, setExamenAbierto] = useState(false);
  const [preguntasModulo, setPreguntasModulo] = useState<PreguntaModulo[] | null>(null);
  const [respuestasModulo, setRespuestasModulo] = useState<Record<string, number[]>>({});
  const [resultadoExamen, setResultadoExamen] = useState<ResultadoExamen | null>(null);
  const [enviandoExamen, setEnviandoExamen] = useState(false);
  const [errorExamen, setErrorExamen] = useState('');

  const cargar = () => {
    fetch(`/api/cursos/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar');
        setCurso(data.curso);
        setInscripcion(data.inscripcion);
        setCalificacionFinal(data.inscripcion?.calificacionEvaluacion ?? null);
        setExamenes(data.examenes ?? null);
        setArchivos(data.archivos ?? []);
        if (data.curso.lecciones.length > 0) {
          const primeraSinCompletar = data.curso.lecciones.find(
            (l: Leccion) => !data.inscripcion?.leccionesCompletadasIds?.includes(l.id)
          );
          setLeccionActivaId((primeraSinCompletar ?? data.curso.lecciones[0]).id);
        }
      })
      .catch(() => setError('No se pudo cargar este contenido. Intenta de nuevo más tarde.'));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const inscribirse = async () => {
    setInscribiendo(true);
    try {
      const res = await fetch(`/api/cursos/${id}/inscribirse`, { method: 'POST' });
      if (res.ok) {
        setInscripcion({ progreso: 0, completado: false, calificacionEvaluacion: null, leccionesCompletadasIds: [] });
        cargar(); // trae los archivos adicionales, que solo ven los inscritos
      }
    } finally {
      setInscribiendo(false);
    }
  };

  const marcarCompletada = async (leccionId: string) => {
    if (!inscripcion) {
      await inscribirse();
    }
    setCompletandoId(leccionId);
    try {
      const res = await fetch(`/api/cursos/${id}/lecciones/${leccionId}/completar`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.inscripcion) {
        setInscripcion({
          progreso: data.inscripcion.progreso,
          completado: data.inscripcion.completado,
          calificacionEvaluacion: data.inscripcion.calificacionEvaluacion,
          leccionesCompletadasIds: [...(inscripcion?.leccionesCompletadasIds ?? []), leccionId].filter(
            (v, i, a) => a.indexOf(v) === i
          ),
        });
      }
      if (res.ok && data.curso?.folio) {
        setExamenes((e) => (e ? { ...e, certificadoFolio: data.curso.folio } : e));
      }
    } finally {
      setCompletandoId(null);
    }
  };

  const abrirExamen = async (leccionId: string) => {
    setExamenAbierto(true);
    setResultadoExamen(null);
    setRespuestasModulo({});
    setErrorExamen('');
    setPreguntasModulo(null);
    const res = await fetch(`/api/cursos/${id}/modulos/${leccionId}/evaluacion`);
    const data = await res.json();
    if (res.ok) setPreguntasModulo(data.preguntas);
    else setErrorExamen(data.error || 'No se pudo cargar el examen');
  };

  const alternarRespuesta = (p: PreguntaModulo, indice: number) => {
    setRespuestasModulo((prev) => {
      const actual = prev[p.id] ?? [];
      if (!p.multiple) return { ...prev, [p.id]: [indice] };
      return {
        ...prev,
        [p.id]: actual.includes(indice) ? actual.filter((i) => i !== indice) : [...actual, indice],
      };
    });
  };

  const enviarExamen = async (leccionId: string) => {
    setEnviandoExamen(true);
    setErrorExamen('');
    try {
      const res = await fetch(`/api/cursos/${id}/modulos/${leccionId}/evaluacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas: respuestasModulo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorExamen(data.error || 'No se pudo enviar el examen');
        return;
      }
      setResultadoExamen(data);
      setExamenes((e) =>
        e
          ? {
              ...e,
              resultados: { ...e.resultados, [leccionId]: { mejorNota: data.resultado.mejorNota, intentos: data.resultado.intentos } },
              certificadoFolio: data.curso?.folio ?? e.certificadoFolio,
            }
          : e
      );
      if (data.curso?.promedio !== null && data.curso?.promedio !== undefined) setCalificacionFinal(data.curso.promedio);
    } finally {
      setEnviandoExamen(false);
    }
  };

  const cargarEvaluacion = () => {
    if (preguntas) return;
    fetch(`/api/cursos/${id}/evaluacion`)
      .then((res) => res.json())
      .then((data) => setPreguntas(data.preguntas));
  };

  const enviarEvaluacion = async () => {
    setEnviandoEvaluacion(true);
    try {
      const res = await fetch(`/api/cursos/${id}/evaluacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas }),
      });
      const data = await res.json();
      if (res.ok) setCalificacionFinal(data.calificacion);
    } finally {
      setEnviandoEvaluacion(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-red-600 text-[13px]">{error}</p>
      </div>
    );
  }

  if (!curso) {
    return <LoadingLogo fullScreen label="Cargando..." />;
  }

  const leccionActiva = curso.lecciones.find((l) => l.id === leccionActivaId) ?? curso.lecciones[0] ?? null;
  const completadasIds = inscripcion?.leccionesCompletadasIds ?? [];
  const horas = Math.round((curso.duracionMinutos / 60) * 10) / 10;
  const etiqueta = curso.tipo === 'TALLER' ? 'Taller' : 'Curso';

  return (
    <div className="p-6 sm:p-8 max-w-[1100px] mx-auto">
      <Link
        href={`/home/${tipoRuta}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-cm-primary mb-4"
      >
        <ArrowLeft size={14} /> Volver a {tipoRuta === 'cursos' ? 'Cursos' : 'Talleres'}
      </Link>

      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cm-primaryDark via-cm-primary to-cm-accent p-6 sm:p-8 mb-6">
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row gap-6 items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white px-2 py-0.5 rounded-full">
                {etiqueta} · {CATEGORIA_LABEL[curso.categoria] ?? curso.categoria}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white px-2 py-0.5 rounded-full">
                {NIVEL_LABEL[curso.nivel] ?? curso.nivel}
              </span>
            </div>
            <h1 className="text-white text-[21px] sm:text-[25px] font-bold mb-2">{curso.titulo}</h1>
            <p className="text-white/80 text-[13px] max-w-[560px] leading-relaxed mb-3">
              {curso.descripcionLarga || curso.descripcionBreve}
            </p>
            <div className="flex items-center gap-4 text-[12.5px] text-white/85 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {horas > 0 ? `${horas} h` : `${curso.lecciones.length} lecciones`}
              </span>
              {curso.calificacionPromedio > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={13} className="fill-current text-[#FDE68A]" /> {curso.calificacionPromedio.toFixed(1)} (
                  {curso.numCalificaciones})
                </span>
              )}
              {curso.instructor && <span>{curso.instructor.nombre}</span>}
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-[220px] bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            {inscripcion ? (
              <>
                <div className="flex items-center justify-between text-[11.5px] text-white/85 mb-1.5">
                  <span>Tu avance</span>
                  <span className="font-semibold">{Math.round(inscripcion.progreso)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${Math.min(100, inscripcion.progreso)}%` }}
                  />
                </div>
                {inscripcion.completado && (
                  <p className="text-[11.5px] text-white font-semibold mt-2 flex items-center gap-1.5">
                    <Award size={13} /> ¡Curso completado!
                  </p>
                )}
              </>
            ) : (
              <button
                onClick={inscribirse}
                disabled={inscribiendo}
                className="w-full h-10 rounded-xl bg-white text-cm-primary text-[13px] font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {inscribiendo ? 'Inscribiendo...' : 'Inscribirme'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* Reproductor de contenido */}
        <div>
          {leccionActiva ? (
            <div className="bg-white border border-[#E4E7EE] rounded-2xl overflow-hidden mb-4">
              {leccionActiva.tipoContenido === 'VIDEO' && leccionActiva.contenidoUrl ? (
                <div className="aspect-video bg-black">
                  {esVideoDirecto(leccionActiva.contenidoUrl) ? (
                    <video controls className="w-full h-full" src={leccionActiva.contenidoUrl} />
                  ) : (
                    <iframe
                      src={esYoutube(leccionActiva.contenidoUrl) ? convertirEmbedYoutube(leccionActiva.contenidoUrl) : leccionActiva.contenidoUrl}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : (
                <div className="p-6 max-h-[420px] overflow-y-auto">
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-line">
                    {leccionActiva.contenidoTexto || 'Esta lección todavía no tiene contenido de lectura.'}
                  </p>
                </div>
              )}
              <div className="p-4 flex items-center justify-between gap-3 border-t border-[#E4E7EE]">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold truncate">{leccionActiva.titulo}</p>
                  <p className="text-[11.5px] text-[#6B7280]">{leccionActiva.duracionMinutos} min</p>
                </div>
                <button
                  onClick={() => marcarCompletada(leccionActiva.id)}
                  disabled={completandoId === leccionActiva.id || completadasIds.includes(leccionActiva.id)}
                  className={`shrink-0 flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-xl transition-colors ${
                    completadasIds.includes(leccionActiva.id)
                      ? 'bg-[#E7F8EF] text-[#16A34A]'
                      : 'bg-cm-primary text-white hover:opacity-90'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {completadasIds.includes(leccionActiva.id)
                    ? 'Completada'
                    : completandoId === leccionActiva.id
                      ? 'Guardando...'
                      : 'Marcar como completada'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6 mb-4">
              <p className="text-[13px] text-[#6B7280]">Este contenido todavía no tiene lecciones.</p>
            </div>
          )}

          {/* Examen del módulo (cursos de profesores) */}
          {examenes && leccionActiva && (leccionActiva.numPreguntas ?? 0) > 0 && (
            <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5 mb-4" data-testid="examen-modulo">
              <h2 className="text-[14.5px] font-semibold mb-1 flex items-center gap-2">
                <ClipboardCheck size={16} className="text-cm-accent" /> Examen del módulo
              </h2>
              <p className="text-[12px] text-[#6B7280] mb-3">
                Para aprobar el curso necesita un promedio de {examenes.calificacionMinima} de {examenes.calificacionMaxima}. Puede
                repetir el examen; se conserva su mejor calificación.
              </p>
              {examenes.resultados[leccionActiva.id] && (
                <p className="text-[12.5px] mb-3">
                  Su mejor calificación en este módulo: <strong>{examenes.resultados[leccionActiva.id].mejorNota}</strong> (
                  {examenes.resultados[leccionActiva.id].intentos} {examenes.resultados[leccionActiva.id].intentos === 1 ? 'intento' : 'intentos'})
                </p>
              )}
              {!completadasIds.includes(leccionActiva.id) ? (
                <p className="text-[12.5px] text-[#6B7280] flex items-center gap-2">
                  <Lock size={13} /> Marque el módulo como completado para presentar su examen.
                </p>
              ) : !examenAbierto ? (
                <button
                  onClick={() => abrirExamen(leccionActiva.id)}
                  className="h-10 px-4 rounded-xl bg-cm-primary text-white text-[13px] font-semibold"
                >
                  {examenes.resultados[leccionActiva.id] ? 'Repetir examen' : 'Presentar examen'}
                </button>
              ) : resultadoExamen ? (
                <div className="flex flex-col gap-3">
                  <div className="text-center py-2">
                    <p className="text-[28px] font-bold text-cm-primary">
                      {resultadoExamen.nota} / {examenes.calificacionMaxima}
                    </p>
                    <p className="text-[12.5px] text-[#6B7280]">
                      {resultadoExamen.aciertos} de {resultadoExamen.total} preguntas correctas
                    </p>
                  </div>
                  <button
                    onClick={() => abrirExamen(leccionActiva.id)}
                    className="h-9 px-4 rounded-xl border border-[#E4E7EE] text-[12.5px] font-semibold self-center"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              ) : preguntasModulo === null ? (
                <p className="text-[12.5px] text-[#6B7280]">{errorExamen || 'Cargando examen...'}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {preguntasModulo.map((p, n) => (
                    <div key={p.id}>
                      <p className="text-[13px] font-medium mb-1">
                        {n + 1}. {p.texto}
                      </p>
                      {p.multiple && <p className="text-[11px] text-[#6B7280] mb-2">Hay más de una respuesta correcta: marque todas.</p>}
                      <div className="flex flex-col gap-1.5">
                        {p.opciones.map((op, i) => {
                          const marcada = (respuestasModulo[p.id] ?? []).includes(i);
                          return (
                            <label
                              key={i}
                              className={`text-[12.5px] px-3 py-2 rounded-lg border cursor-pointer ${
                                marcada ? 'border-cm-primary bg-cm-primary/5' : 'border-[#E4E7EE]'
                              }`}
                            >
                              <input
                                type={p.multiple ? 'checkbox' : 'radio'}
                                name={`pm-${p.id}`}
                                className="mr-2"
                                checked={marcada}
                                onChange={() => alternarRespuesta(p, i)}
                              />
                              {op}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {errorExamen && <p role="alert" className="text-[12.5px] text-red-600">{errorExamen}</p>}
                  <button
                    onClick={() => enviarExamen(leccionActiva.id)}
                    disabled={
                      enviandoExamen || preguntasModulo.some((p) => (respuestasModulo[p.id] ?? []).length === 0)
                    }
                    className="h-10 px-4 rounded-xl bg-cm-primary text-white text-[13px] font-semibold self-start disabled:opacity-50"
                  >
                    {enviandoExamen ? 'Enviando...' : 'Enviar examen'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Evaluación final: con exámenes por módulo se muestra el resumen/certificado */}
          {examenes ? (
            <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5 mb-4" data-testid="resumen-curso">
              <h2 className="text-[14.5px] font-semibold mb-2 flex items-center gap-2">
                <Award size={16} className="text-cm-accent" /> Calificación y certificado
              </h2>
              {examenes.certificadoFolio ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px]">
                    ¡Felicidades! Aprobó el curso con <strong>{calificacionFinal}</strong> de {examenes.calificacionMaxima}.
                  </p>
                  <p className="text-[12px] text-[#6B7280]">Folio: {examenes.certificadoFolio}</p>
                  <a
                    href={`/certificado/${examenes.certificadoFolio}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-4 rounded-xl bg-cm-primary text-white text-[13px] font-semibold self-start inline-flex items-center gap-2"
                  >
                    <Award size={14} /> Ver / descargar certificado
                  </a>
                </div>
              ) : calificacionFinal !== null && calificacionFinal < examenes.calificacionMinima ? (
                <p className="text-[12.5px] text-[#B45309]">
                  Su promedio actual es {calificacionFinal}; se requieren {examenes.calificacionMinima}. Puede repetir los exámenes de
                  los módulos para mejorar su calificación.
                </p>
              ) : (
                <p className="text-[12.5px] text-[#6B7280] flex items-center gap-2">
                  <Lock size={13} /> Complete todos los módulos y presente sus exámenes (promedio mínimo {examenes.calificacionMinima}) para
                  obtener su certificado.
                </p>
              )}
            </div>
          ) : (
          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5 mb-4">
            <h2 className="text-[14.5px] font-semibold mb-2 flex items-center gap-2">
              <Award size={16} className="text-cm-accent" /> Evaluación final
            </h2>
            {!inscripcion?.completado ? (
              <p className="text-[12.5px] text-[#6B7280] flex items-center gap-2">
                <Lock size={13} /> Completa todas las lecciones para acceder a la evaluación.
              </p>
            ) : calificacionFinal !== null ? (
              <div className="text-center py-2">
                <p className="text-[28px] font-bold text-cm-primary">{calificacionFinal}%</p>
                <p className="text-[12.5px] text-[#6B7280]">¡Gracias por completar la evaluación!</p>
              </div>
            ) : preguntas === null ? (
              <button
                onClick={cargarEvaluacion}
                className="h-10 px-4 rounded-xl bg-cm-primary text-white text-[13px] font-semibold"
              >
                Comenzar evaluación
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                {preguntas.map((p) => (
                  <div key={p.id}>
                    <p className="text-[13px] font-medium mb-2">{p.pregunta}</p>
                    <div className="flex flex-col gap-1.5">
                      {p.opciones.map((op) => (
                        <label
                          key={op.id}
                          className={`text-[12.5px] px-3 py-2 rounded-lg border cursor-pointer ${
                            respuestas[p.id] === op.id
                              ? 'border-cm-primary bg-cm-primary/5'
                              : 'border-[#E4E7EE]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={p.id}
                            className="mr-2"
                            checked={respuestas[p.id] === op.id}
                            onChange={() => setRespuestas({ ...respuestas, [p.id]: op.id })}
                          />
                          {op.texto}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={enviarEvaluacion}
                  disabled={enviandoEvaluacion || Object.keys(respuestas).length < preguntas.length}
                  className="h-10 px-4 rounded-xl bg-cm-primary text-white text-[13px] font-semibold self-start disabled:opacity-50"
                >
                  {enviandoEvaluacion ? 'Enviando...' : 'Enviar evaluación'}
                </button>
              </div>
            )}
          </div>
          )}

          {archivos.length > 0 && (
            <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5" data-testid="archivos-curso">
              <h2 className="text-[14.5px] font-semibold mb-3 flex items-center gap-2">
                <Download size={16} className="text-cm-accent" /> Material adicional
              </h2>
              <div className="flex flex-col gap-2">
                {archivos.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center justify-between gap-3 text-[12.5px] px-3 py-2.5 rounded-xl border border-[#E4E7EE] hover:bg-[#F4F6FB]"
                  >
                    <span className="truncate font-medium">{a.nombre}</span>
                    <span className="shrink-0 text-[#6B7280]">
                      {a.tamano > 0 ? `${(a.tamano / 1024 / 1024).toFixed(1)} MB` : ''} ⬇
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lista de lecciones */}
        <div className="bg-white border border-[#E4E7EE] rounded-2xl p-4 h-fit">
          <h2 className="text-[13.5px] font-semibold mb-3 px-1">
            Contenido ({curso.lecciones.length} lecciones)
          </h2>
          <div className="flex flex-col gap-1">
            {curso.lecciones.map((l) => {
              const completada = completadasIds.includes(l.id);
              const activa = leccionActiva?.id === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setLeccionActivaId(l.id);
                    setExamenAbierto(false);
                    setResultadoExamen(null);
                  }}
                  className={`flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl transition-colors ${
                    activa ? 'bg-cm-primary/8 text-cm-primary' : 'hover:bg-[#F4F6FB]'
                  }`}
                >
                  {completada ? (
                    <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                  ) : (
                    <Circle size={16} className="text-[#C7CBD6] shrink-0" />
                  )}
                  {l.tipoContenido === 'VIDEO' ? (
                    <PlayCircle size={13} className="shrink-0 text-[#9297A6]" />
                  ) : (
                    <FileText size={13} className="shrink-0 text-[#9297A6]" />
                  )}
                  <span className="text-[12.5px] font-medium min-w-0 flex-1 truncate">{l.titulo}</span>
                  {examenes && (l.numPreguntas ?? 0) > 0 && (
                    <span className="text-[10px] font-semibold text-cm-primary shrink-0">
                      {examenes.resultados[l.id] ? `${examenes.resultados[l.id].mejorNota}` : 'Examen'}
                    </span>
                  )}
                  <span className="text-[10.5px] text-[#9297A6] shrink-0">{l.duracionMinutos}m</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
