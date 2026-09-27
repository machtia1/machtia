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

  const cargar = () => {
    fetch(`/api/cursos/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar');
        setCurso(data.curso);
        setInscripcion(data.inscripcion);
        setCalificacionFinal(data.inscripcion?.calificacionEvaluacion ?? null);
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
    } finally {
      setCompletandoId(null);
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

          {/* Evaluación final */}
          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5">
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
                  onClick={() => setLeccionActivaId(l.id)}
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
