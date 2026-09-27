'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  CalendarDays,
  GraduationCap,
  Flame,
  Star,
  Zap,
  Video,
  ExternalLink,
  X,
} from 'lucide-react';
import LoadingLogo from '@/components/LoadingLogo';
import Carrusel from './Carrusel';
import TarjetaCurso, { CATEGORIA_LABEL, NIVEL_LABEL, TarjetaCursoData } from './TarjetaCurso';
import CuestionarioRuta, { RutaData } from './CuestionarioRuta';

type RutaConCursos = RutaData & { cursos: TarjetaCursoData[] };

interface DatosInicio {
  enProgreso: (TarjetaCursoData & { progreso: number })[];
  destacados: TarjetaCursoData[];
  nuevos: TarjetaCursoData[];
  cortos: TarjetaCursoData[];
  especiales: TarjetaCursoData[];
  rutas: RutaConCursos[];
  instructores: { id: string; nombre: string; especialidad: string; fotoUrl: string | null; numCursos: number }[];
  eventos: {
    id: string;
    titulo: string;
    instructorNombre: string;
    fechaHora: string;
    linkAcceso: string | null;
  }[];
}

const FILTROS = [
  { valor: '', etiqueta: 'Todos', icono: GraduationCap },
  { valor: 'nuevos', etiqueta: 'Nuevos', icono: Sparkles },
  { valor: 'mejor-valorados', etiqueta: 'Mejor valorados', icono: Star },
  { valor: 'especiales', etiqueta: 'Especiales', icono: Zap },
] as const;

const PRESENTACION: Record<'CURSO' | 'TALLER', { titulo: string; texto: string }> = {
  CURSO: {
    titulo: 'Cursos Club Machtia',
    texto:
      'Aprende a tu ritmo con cursos grabados por especialistas: emprendimiento, finanzas, marketing y más, pensados para impulsar tu negocio y tu desarrollo personal.',
  },
  TALLER: {
    titulo: 'Talleres Club Machtia',
    texto:
      'Sesiones prácticas y en vivo con nuestros instructores — resuelve dudas en tiempo real y aplica lo aprendido desde el primer día.',
  },
};

/**
 * Pantalla principal de Cursos/Talleres — reconstrucción completa
 * pedida por el cliente el 26 sept 2026 ("Elemento 4"), reemplaza el
 * contador regresivo anterior (CursosTalleresCountdown). Incluye:
 * búsqueda, banner de presentación, "sigue aprendiendo", barra de
 * filtros, carruseles (destacados, rutas, nuevos, cortos,
 * especiales, instructores), calendario de próximos eventos y CTA
 * del cuestionario de ruta de aprendizaje.
 */
export default function CursosHub({ tipo }: { tipo: 'CURSO' | 'TALLER' }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rutaIdFiltro = searchParams.get('ruta');

  const [datos, setDatos] = useState<DatosInicio | null>(null);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<string>('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<TarjetaCursoData[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [mostrarCuestionario, setMostrarCuestionario] = useState(false);

  const rutaPrefix = tipo === 'CURSO' ? 'cursos' : 'talleres';

  useEffect(() => {
    let activo = true;
    fetch(`/api/cursos/inicio?tipo=${tipo}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar');
        if (activo) setDatos(data);
      })
      .catch(() => activo && setError('No se pudo cargar el contenido. Intenta de nuevo más tarde.'));
    return () => {
      activo = false;
    };
  }, [tipo]);

  const buscarActivo = q.trim().length > 0 || filtro.length > 0;

  useEffect(() => {
    if (!buscarActivo) {
      setResultadosBusqueda(null);
      return;
    }
    setBuscando(true);
    const t = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ tipo });
        if (q.trim()) params.set('q', q.trim());
        if (filtro) params.set('filtro', filtro);
        const res = await fetch(`/api/cursos/buscar?${params.toString()}`);
        const data = await res.json();
        setResultadosBusqueda(res.ok ? data.cursos : []);
      } catch {
        setResultadosBusqueda([]);
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, filtro, tipo, buscarActivo]);

  const presentacion = PRESENTACION[tipo];

  const rutaSeleccionada = rutaIdFiltro
    ? datos?.rutas.find((r) => r.id === rutaIdFiltro) ?? null
    : null;

  const proximosEventos = useMemo(() => {
    if (!datos) return [];
    return datos.eventos.map((e) => ({
      ...e,
      fecha: new Date(e.fechaHora),
    }));
  }, [datos]);

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-red-600 text-[13px]">{error}</p>
      </div>
    );
  }

  if (!datos) {
    return <LoadingLogo fullScreen label={`Cargando ${tipo === 'CURSO' ? 'cursos' : 'talleres'}...`} />;
  }

  return (
    <div className="p-6 sm:p-8 max-w-[1200px] mx-auto">
      {/* Banner de presentación */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cm-primaryDark via-cm-primary to-cm-accent p-6 sm:p-8 mb-6">
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-4 bottom-0 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative">
          <h1 className="text-white text-[22px] sm:text-[26px] font-bold mb-2">{presentacion.titulo}</h1>
          <p className="text-white/80 text-[13.5px] max-w-[560px] leading-relaxed">{presentacion.texto}</p>

          <div className="relative mt-5 max-w-[440px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9297A6]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Busca ${tipo === 'CURSO' ? 'un curso' : 'un taller'} por nombre o tema...`}
              className="w-full h-12 pl-10 pr-4 rounded-xl border-0 text-[13.5px] outline-none shadow-lg focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {FILTROS.map((f) => {
          const Icono = f.icono;
          const activo = filtro === f.valor;
          return (
            <button
              key={f.valor || 'todos'}
              onClick={() => setFiltro(f.valor)}
              className={`shrink-0 flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                activo
                  ? 'bg-cm-primary text-white border-cm-primary'
                  : 'bg-white text-[#6B7280] border-[#E4E7EE] hover:border-cm-primary/30'
              }`}
            >
              <Icono size={13} /> {f.etiqueta}
            </button>
          );
        })}
        {Object.entries(CATEGORIA_LABEL).map(([valor, etiqueta]) => (
          <button
            key={valor}
            onClick={() => setFiltro(filtro === valor ? '' : valor)}
            className={`shrink-0 text-[12.5px] font-semibold px-3.5 py-2 rounded-full border transition-colors ${
              filtro === valor
                ? 'bg-cm-primary text-white border-cm-primary'
                : 'bg-white text-[#6B7280] border-[#E4E7EE] hover:border-cm-primary/30'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {/* Vista de una ruta de aprendizaje elegida desde el cuestionario */}
      {rutaSeleccionada && !buscarActivo && (
        <section className="mb-8">
          <div
            className="rounded-2xl p-4 sm:p-5 text-white flex items-center justify-between gap-4 mb-4"
            style={{ background: `linear-gradient(135deg, ${rutaSeleccionada.color}, ${rutaSeleccionada.color}CC)` }}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full">
                Ruta de aprendizaje
              </span>
              <h2 className="text-[17px] font-bold mt-1.5">{rutaSeleccionada.titulo}</h2>
              <p className="text-[12.5px] text-white/85 mt-1 max-w-[480px]">{rutaSeleccionada.descripcion}</p>
            </div>
            <button
              onClick={() => router.push(`/home/${rutaPrefix}`)}
              className="shrink-0 flex items-center gap-1.5 text-[12px] font-semibold bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg transition-colors"
            >
              <X size={13} /> Quitar filtro
            </button>
          </div>
          {rutaSeleccionada.cursos.length === 0 ? (
            <p className="text-[13px] text-[#6B7280]">Esta ruta todavía no tiene cursos publicados.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {rutaSeleccionada.cursos.map((c) => (
                <TarjetaCurso key={c.id} curso={c} tipo={rutaPrefix as 'cursos' | 'talleres'} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Resultados de búsqueda / filtro */}
      {!rutaSeleccionada && buscarActivo ? (
        <section className="mb-8">
          <h2 className="text-[15px] font-semibold mb-3">Resultados</h2>
          {buscando && <LoadingLogo size={26} label="Buscando..." />}
          {!buscando && resultadosBusqueda !== null && resultadosBusqueda.length === 0 && (
            <p className="text-[13px] text-[#6B7280] py-4">
              No encontramos nada con esos criterios. Prueba con otra palabra o filtro.
            </p>
          )}
          {!buscando && resultadosBusqueda && resultadosBusqueda.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {resultadosBusqueda.map((c) => (
                <TarjetaCurso key={c.id} curso={c} tipo={rutaPrefix as 'cursos' | 'talleres'} />
              ))}
            </div>
          )}
        </section>
      ) : !rutaSeleccionada ? (
        <>
          {/* Sigue aprendiendo */}
          {datos.enProgreso.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
                <Flame size={15} className="text-cm-accent" /> Sigue aprendiendo
              </h2>
              <Carrusel>
                {datos.enProgreso.map((c) => (
                  <TarjetaCurso key={c.id} curso={c} progreso={c.progreso} tipo={rutaPrefix as 'cursos' | 'talleres'} />
                ))}
              </Carrusel>
            </section>
          )}

          {/* Destacados */}
          <section className="mb-8">
            <h2 className="text-[15px] font-semibold mb-3">
              {tipo === 'CURSO' ? 'Cursos destacados' : 'Talleres destacados'}
            </h2>
            {datos.destacados.length === 0 ? (
              <p className="text-[13px] text-[#6B7280]">Muy pronto habrá contenido disponible aquí.</p>
            ) : (
              <Carrusel>
                {datos.destacados.map((c) => (
                  <TarjetaCurso key={c.id} curso={c} tipo={rutaPrefix as 'cursos' | 'talleres'} />
                ))}
              </Carrusel>
            )}
          </section>

          {/* CTA cuestionario de ruta */}
          {datos.rutas.length > 0 && (
            <section className="mb-8">
              <div className="relative overflow-hidden rounded-2xl border border-[#E4E7EE] bg-gradient-to-r from-[#ECECFF] to-[#E7F6FE] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles size={20} className="text-cm-accent" />
                  </div>
                  <div>
                    <h3 className="text-[14.5px] font-semibold">¿No sabes por dónde empezar?</h3>
                    <p className="text-[12.5px] text-[#6B7280]">
                      Responde 2 preguntas rápidas y te armamos una ruta de aprendizaje a tu medida.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarCuestionario(true)}
                  className="shrink-0 bg-cm-primary text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Crear mi ruta
                </button>
              </div>
            </section>
          )}

          {/* Rutas de aprendizaje */}
          {datos.rutas.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3">Rutas de aprendizaje</h2>
              <Carrusel>
                {datos.rutas.map((r) => (
                  <div
                    key={r.id}
                    className="shrink-0 w-[260px] rounded-2xl p-4 text-white flex flex-col justify-between min-h-[140px]"
                    style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}CC)` }}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full">
                        {NIVEL_LABEL[r.nivel] ?? r.nivel}
                      </span>
                      <h3 className="text-[14.5px] font-bold mt-2 leading-snug">{r.titulo}</h3>
                      <p className="text-[11.5px] text-white/80 mt-1 line-clamp-2">{r.descripcion}</p>
                    </div>
                    <p className="text-[11px] text-white/75 mt-3">
                      {r.numCursos} cursos · {r.horasTotales} h
                    </p>
                  </div>
                ))}
              </Carrusel>
            </section>
          )}

          {/* Nuevos */}
          {datos.nuevos.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
                <Sparkles size={15} className="text-cm-accent" /> Nuevos en Machtia
              </h2>
              <Carrusel>
                {datos.nuevos.map((c) => (
                  <TarjetaCurso key={c.id} curso={c} tipo={rutaPrefix as 'cursos' | 'talleres'} />
                ))}
              </Carrusel>
            </section>
          )}

          {/* Cortos */}
          {datos.cortos.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3">Clases cortas para hoy</h2>
              <Carrusel>
                {datos.cortos.map((c) => (
                  <TarjetaCurso key={c.id} curso={c} tipo={rutaPrefix as 'cursos' | 'talleres'} />
                ))}
              </Carrusel>
            </section>
          )}

          {/* Especiales */}
          {datos.especiales.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
                <Zap size={15} className="text-cm-accent" /> Especiales
              </h2>
              <Carrusel>
                {datos.especiales.map((c) => (
                  <TarjetaCurso key={c.id} curso={c} tipo={rutaPrefix as 'cursos' | 'talleres'} />
                ))}
              </Carrusel>
            </section>
          )}

          {/* Instructores */}
          {datos.instructores.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3">Conoce a nuestros instructores</h2>
              <Carrusel>
                {datos.instructores.map((i) => (
                  <div
                    key={i.id}
                    className="shrink-0 w-[150px] bg-white border border-[#E4E7EE] rounded-2xl p-4 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cm-primary to-cm-accent overflow-hidden flex items-center justify-center mb-2.5">
                      {i.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.fotoUrl} alt={i.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[18px] font-bold">
                          {i.nombre.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] font-semibold leading-tight">{i.nombre}</p>
                    <p className="text-[10.5px] text-[#6B7280] mt-0.5 leading-tight">{i.especialidad}</p>
                    <p className="text-[10px] text-[#9297A6] mt-1">{i.numCursos} cursos</p>
                  </div>
                ))}
              </Carrusel>
            </section>
          )}

          {/* Calendario de próximos eventos */}
          {proximosEventos.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
                <CalendarDays size={15} className="text-cm-accent" /> Próximos eventos
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {proximosEventos.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white border border-[#E4E7EE] rounded-2xl p-4 flex items-center gap-3.5"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-[#ECECFF] flex flex-col items-center justify-center text-cm-primary">
                      <span className="text-[9px] font-bold uppercase leading-none">
                        {e.fecha.toLocaleDateString('es-MX', { month: 'short' })}
                      </span>
                      <span className="text-[15px] font-bold leading-tight">{e.fecha.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate">{e.titulo}</p>
                      <p className="text-[11.5px] text-[#6B7280]">
                        {e.instructorNombre} ·{' '}
                        {e.fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {e.linkAcceso && (
                      <a
                        href={e.linkAcceso}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 flex items-center gap-1 text-[11.5px] font-semibold text-cm-primary hover:underline"
                      >
                        <Video size={12} /> Unirme <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}

      {mostrarCuestionario && (
        <CuestionarioRuta rutas={datos.rutas} onClose={() => setMostrarCuestionario(false)} />
      )}
    </div>
  );
}
