'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface ControlReproductor {
  /** Vuelve al inicio y reproduce (con sonido, si el navegador lo permite). */
  repetir: () => void;
}

interface Props {
  src: string;
  poster?: string;
  /** Nombre del video para lectores de pantalla. */
  titulo: string;
  /**
   * 'estricto': la barra de avance solo se ve; no se puede adelantar.
   * 'libre': la persona puede mover la barra de avance.
   */
  modo: 'estricto' | 'libre';
  /** Arranca solo cuando el video queda a la vista. */
  inicioAutomatico?: boolean;
  /** true = con sonido. Se comparte entre los dos videos de la página. */
  sonido: boolean;
  onSonidoChange: (activo: boolean) => void;
  onTerminar?: () => void;
  /** La persona volvió a empezar el video (por ejemplo, con el botón de repetir del recuadro). */
  onReiniciar?: () => void;
  /** El archivo no existe o no se pudo cargar. */
  onNoDisponible?: () => void;
}

type ConPrefijo = HTMLElement & {
  webkitRequestFullscreen?: () => void;
  webkitEnterFullscreen?: () => void;
};
type DocumentoConPrefijo = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};

const MARCO_VACIO = 'relative aspect-video rounded-2xl overflow-hidden bg-black';

function formatoTiempo(segundos: number): string {
  if (!isFinite(segundos) || segundos < 0) segundos = 0;
  const total = Math.floor(segundos);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
}

function IconoPlay({ tam = 20 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M5 3l12 7-12 7V3z" />
    </svg>
  );
}

function IconoPausa() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="4" y="3" width="4.2" height="14" rx="1" />
      <rect x="11.8" y="3" width="4.2" height="14" rx="1" />
    </svg>
  );
}

function IconoSonido({ activo }: { activo: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
      {activo ? (
        <>
          <path d="M15.5 8.5a5 5 0 010 7" />
          <path d="M18.5 5.5a9 9 0 010 13" />
        </>
      ) : (
        <>
          <path d="M16 9l5 6" />
          <path d="M21 9l-5 6" />
        </>
      )}
    </svg>
  );
}

function IconoPantalla({ completa }: { completa: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {completa ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
    </svg>
  );
}

function IconoRepetir() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 10-2.5 5.8" />
      <path d="M20 5v5h-5" />
    </svg>
  );
}

const ReproductorVideo = forwardRef<ControlReproductor, Props>(function ReproductorVideo(
  {
    src,
    poster,
    titulo,
    modo,
    inicioAutomatico = false,
    sonido,
    onSonidoChange,
    onTerminar,
    onReiniciar,
    onNoDisponible,
  },
  ref
) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxVisto = useRef(0); // segundo más lejano que la persona ya vio
  const yaArranco = useRef(false);
  const pausadoPorScroll = useRef(false);

  // El <video> se crea ya en el navegador (no en el servidor) para que sus
  // eventos —sobre todo el de error— se atiendan desde el primer momento.
  const [montado, setMontado] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [noDisponible, setNoDisponible] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [puedePantallaCompleta, setPuedePantallaCompleta] = useState(false);

  useEffect(() => setMontado(true), []);

  // El video nace con el sonido que la persona ya eligió (silenciado en el
  // primer video, porque los navegadores no permiten otra cosa al arrancar solo).
  // La propiedad muted del <video> sigue a 'sonido' y no al revés; si el navegador
  // se niega a reproducir con sonido, reproducir() lo deja en silencio.
  useEffect(() => {
    if (videoRef.current && videoRef.current.muted !== !sonido) videoRef.current.muted = !sonido;
  }, [sonido, montado]);

  // ¿Este navegador sabe poner el video en pantalla completa?
  useEffect(() => {
    const c = contenedorRef.current as ConPrefijo | null;
    const v = videoRef.current as ConPrefijo | null;
    setPuedePantallaCompleta(
      Boolean(c?.requestFullscreen || c?.webkitRequestFullscreen || v?.webkitEnterFullscreen)
    );
  }, [montado]);

  useEffect(() => {
    const revisar = () => {
      const doc = document as DocumentoConPrefijo;
      const elemento = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setPantallaCompleta(elemento !== null && elemento === contenedorRef.current);
    };
    document.addEventListener('fullscreenchange', revisar);
    document.addEventListener('webkitfullscreenchange', revisar);
    return () => {
      document.removeEventListener('fullscreenchange', revisar);
      document.removeEventListener('webkitfullscreenchange', revisar);
    };
  }, []);

  const reproducir = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.play();
    } catch (error) {
      // Si el navegador no permite arrancar con sonido, se arranca sin él.
      if ((error as DOMException)?.name === 'NotAllowedError' && !v.muted) {
        v.muted = true;
        onSonidoChange(false);
        try {
          await v.play();
        } catch {
          /* queda en pausa; la persona puede tocar play */
        }
      }
    }
  }, [onSonidoChange]);

  const repetir = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    maxVisto.current = 0;
    v.currentTime = 0;
    setTerminado(false);
    setTiempo(0);
    // La persona acaba de tocar un botón, así que se intenta con sonido
    // (si el navegador no lo permite, reproducir() lo deja en silencio).
    v.muted = false;
    if (v.volume === 0) v.volume = 1;
    reproducir();
    onReiniciar?.();
  }, [reproducir, onReiniciar]);

  useImperativeHandle(ref, () => ({ repetir }), [repetir]);

  // Arranque automático al verse, y pausa al salirse de pantalla.
  useEffect(() => {
    const v = videoRef.current;
    if (!montado || !v) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.intersectionRatio >= 0.5) {
          if (inicioAutomatico && !yaArranco.current) {
            yaArranco.current = true;
            reproducir();
          } else if (pausadoPorScroll.current) {
            pausadoPorScroll.current = false;
            reproducir();
          }
        } else if (entrada.intersectionRatio < 0.2 && !v.paused && !v.ended) {
          pausadoPorScroll.current = true;
          v.pause();
        }
      },
      { threshold: [0, 0.2, 0.5] }
    );
    observador.observe(v);
    return () => observador.disconnect();
  }, [montado, inicioAutomatico, reproducir]);

  function fallo() {
    setNoDisponible(true);
    setCargando(false);
    onNoDisponible?.();
  }

  function alternarPausa() {
    const v = videoRef.current;
    if (!v) return;
    if (terminado) return repetir();
    if (v.paused) reproducir();
    else v.pause();
  }

  function alternarSonido() {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      if (v.volume === 0) v.volume = 1;
    } else {
      v.muted = true;
    }
    // onVolumeChange avisa a la página del cambio.
  }

  function alternarPantallaCompleta() {
    const c = contenedorRef.current as ConPrefijo | null;
    const v = videoRef.current as ConPrefijo | null;
    const doc = document as DocumentoConPrefijo;
    if (doc.fullscreenElement ?? doc.webkitFullscreenElement) {
      (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
      return;
    }
    if (c?.requestFullscreen) {
      c.requestFullscreen().catch(() => {});
    } else if (c?.webkitRequestFullscreen) {
      c.webkitRequestFullscreen();
    } else if (v?.webkitEnterFullscreen) {
      // iPhone: solo permite pantalla completa del video; igual se bloquea el adelantar.
      v.webkitEnterFullscreen();
    }
  }

  // Modo estricto: si alguien intenta saltar hacia adelante, regresa al punto visto.
  function alBuscar() {
    const v = videoRef.current;
    if (modo !== 'estricto' || !v) return;
    if (v.currentTime > maxVisto.current + 1) v.currentTime = maxVisto.current;
  }

  function alAvanzar() {
    const v = videoRef.current;
    if (!v || v.seeking) return;
    if (v.currentTime > maxVisto.current) maxVisto.current = v.currentTime;
    setTiempo(v.currentTime);
  }

  function alFinalizar() {
    const v = videoRef.current;
    if (v && v.duration > 0) {
      maxVisto.current = v.duration;
      setTiempo(v.duration);
    }
    setTerminado(true);
    setReproduciendo(false);
    onTerminar?.();
  }

  function moverBarra(valor: number) {
    const v = videoRef.current;
    if (!v || modo !== 'libre') return;
    v.currentTime = valor;
    setTiempo(valor);
    if (terminado && valor < duracion) setTerminado(false);
  }

  if (!montado) {
    return <div aria-hidden="true" className={MARCO_VACIO} />;
  }

  if (noDisponible) {
    return (
      <div className={`${MARCO_VACIO} flex items-center justify-center text-white/55 text-[14px] px-6 text-center`}>
        {titulo}: próximamente
      </div>
    );
  }

  const estricto = modo === 'estricto';
  const silenciado = !sonido;
  const porcentaje = duracion > 0 ? Math.min(100, (tiempo / duracion) * 100) : 0;

  return (
    <div
      ref={contenedorRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex flex-col bg-black ${
        pantallaCompleta ? '' : 'rounded-2xl overflow-hidden shadow-[0_18px_44px_rgba(8,42,92,0.22)]'
      }`}
    >
      <div className={`relative bg-black ${pantallaCompleta ? 'flex-1 min-h-0' : 'aspect-video'}`}>
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          aria-label={titulo}
          className="absolute inset-0 w-full h-full object-contain"
          playsInline
          muted={!sonido}
          preload="auto"
          controlsList="nodownload noremoteplayback noplaybackrate"
          disablePictureInPicture
          disableRemotePlayback
          onClick={alternarPausa}
          onError={fallo}
          onLoadedMetadata={(e) => setDuracion(e.currentTarget.duration || 0)}
          onDurationChange={(e) => setDuracion(e.currentTarget.duration || 0)}
          onLoadedData={() => setCargando(false)}
          onCanPlay={() => setCargando(false)}
          onWaiting={() => setCargando(true)}
          onPlaying={() => setCargando(false)}
          onPlay={() => {
            pausadoPorScroll.current = false;
            setReproduciendo(true);
            setTerminado(false);
          }}
          onPause={() => setReproduciendo(false)}
          onSeeking={alBuscar}
          onTimeUpdate={alAvanzar}
          onEnded={alFinalizar}
          onVolumeChange={() => {
            if (videoRef.current) onSonidoChange(!videoRef.current.muted);
          }}
        />

        {cargando && !terminado && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-9 w-9 rounded-full border-2 border-white/25 border-t-white animate-spin" aria-label="Cargando video" />
          </div>
        )}

        {/* Aviso para activar el sonido mientras el video corre en silencio. */}
        {silenciado && reproduciendo && !terminado && (
          <button
            type="button"
            onClick={alternarSonido}
            className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full bg-black/65 backdrop-blur px-3.5 h-9 text-[12.5px] font-semibold text-white border border-white/25 hover:bg-black/80 transition-colors"
          >
            <IconoSonido activo={false} />
            Activar sonido
          </button>
        )}

        {/* Play grande cuando el video está en pausa. */}
        {!reproduciendo && !terminado && !cargando && (
          <button
            type="button"
            onClick={alternarPausa}
            aria-label="Reproducir video"
            className="absolute inset-0 flex items-center justify-center bg-black/25"
          >
            <span className="w-16 h-16 rounded-full bg-white/90 text-cm-navy flex items-center justify-center shadow-lg">
              <IconoPlay tam={26} />
            </span>
          </button>
        )}

        {/* Al terminar: icono para volver a verlo. */}
        {terminado && (
          <button
            type="button"
            onClick={repetir}
            aria-label="Volver a ver el video"
            className="absolute inset-0 flex items-center justify-center bg-black/45"
          >
            <span className="w-16 h-16 rounded-full bg-white/90 text-cm-navy flex items-center justify-center shadow-lg">
              <IconoRepetir />
            </span>
          </button>
        )}
      </div>

      {/* Barra de controles: pausa, avance, tiempo, sonido y pantalla completa. */}
      <div className="flex items-center gap-2.5 sm:gap-4 bg-[#0b1730] px-3 sm:px-4 h-12 sm:h-14 text-white">
        <button
          type="button"
          onClick={alternarPausa}
          aria-label={terminado ? 'Volver a ver el video' : reproduciendo ? 'Pausar video' : 'Reproducir video'}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
        >
          {terminado ? <IconoRepetir /> : reproduciendo ? <IconoPausa /> : <IconoPlay />}
        </button>

        {estricto ? (
          <div
            role="progressbar"
            aria-label="Avance del video"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(porcentaje)}
            className="pointer-events-none relative h-1 flex-1 rounded-full bg-white/30"
          >
            <div className="h-full rounded-full bg-cm-cian" style={{ width: `${porcentaje}%` }} />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white ring-2 ring-cm-cian"
              style={{ left: `calc(${porcentaje}% - 7px)` }}
            />
          </div>
        ) : (
          <input
            type="range"
            aria-label="Avance del video"
            className="rango-video flex-1"
            min={0}
            max={duracion || 1}
            step={0.1}
            value={Math.min(tiempo, duracion || 1)}
            style={{ ['--avance' as string]: `${porcentaje}%` }}
            onChange={(e) => moverBarra(Number(e.target.value))}
          />
        )}

        <span className="shrink-0 text-[12px] sm:text-[14px] tabular-nums text-white/90">
          {formatoTiempo(tiempo)} / {formatoTiempo(duracion)}
        </span>

        <button
          type="button"
          onClick={alternarSonido}
          aria-label={silenciado ? 'Activar sonido' : 'Silenciar video'}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
        >
          <IconoSonido activo={!silenciado} />
        </button>

        {puedePantallaCompleta && (
          <button
            type="button"
            onClick={alternarPantallaCompleta}
            aria-label={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
          >
            <IconoPantalla completa={pantallaCompleta} />
          </button>
        )}
      </div>
    </div>
  );
});

export default ReproductorVideo;
