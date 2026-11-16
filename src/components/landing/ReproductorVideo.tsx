'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  src: string;
  poster?: string;
  /** Nombre del video para lectores de pantalla. */
  titulo: string;
  /**
   * 'estricto': sin barra para adelantar; solo se puede pausar y reanudar.
   * 'libre': controles normales del navegador.
   */
  modo: 'estricto' | 'libre';
  /** Arranca solo cuando el video queda a la vista. */
  inicioAutomatico?: boolean;
  /** true = con sonido. Se comparte entre los dos videos de la página. */
  sonido: boolean;
  onSonidoChange: (activo: boolean) => void;
  onTerminar?: () => void;
  /** El archivo no existe o no se pudo cargar. */
  onNoDisponible?: () => void;
  /** Lo que se muestra encima del video cuando termina. Recibe la acción de repetir. */
  alTerminar?: (repetir: () => void) => ReactNode;
}

const MARCO = 'relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10';

function IconoPlay() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M5 3l12 7-12 7V3z" />
    </svg>
  );
}

function IconoPausa() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="4" y="3" width="4.2" height="14" rx="1" />
      <rect x="11.8" y="3" width="4.2" height="14" rx="1" />
    </svg>
  );
}

function IconoSonido({ activo }: { activo: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export default function ReproductorVideo({
  src,
  poster,
  titulo,
  modo,
  inicioAutomatico = false,
  sonido,
  onSonidoChange,
  onTerminar,
  onNoDisponible,
  alTerminar,
}: Props) {
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
  const [progreso, setProgreso] = useState(0);

  useEffect(() => setMontado(true), []);

  // El video siempre arranca silenciado (los navegadores no dejan otra cosa);
  // si la persona ya activó el sonido antes, se respeta.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !sonido;
  }, [sonido, montado]);

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
    if (!v || terminado) return;
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

  function repetir() {
    const v = videoRef.current;
    if (!v) return;
    maxVisto.current = 0;
    v.currentTime = 0;
    setTerminado(false);
    setProgreso(0);
    // La persona acaba de tocar un botón, así que se intenta con sonido
    // (si el navegador no lo permite, reproducir() lo deja en silencio).
    v.muted = false;
    if (v.volume === 0) v.volume = 1;
    reproducir();
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
    if (v.duration > 0) setProgreso(Math.min(1, v.currentTime / v.duration));
  }

  function alFinalizar() {
    const v = videoRef.current;
    if (v && v.duration > 0) maxVisto.current = v.duration;
    setProgreso(1);
    setTerminado(true);
    setReproduciendo(false);
    onTerminar?.();
  }

  if (!montado) {
    return <div aria-hidden="true" className={MARCO} />;
  }

  if (noDisponible) {
    return (
      <div className={`${MARCO} flex items-center justify-center text-white/45 text-[13px] px-6 text-center`}>
        {titulo}: próximamente
      </div>
    );
  }

  const estricto = modo === 'estricto';
  const silenciado = !sonido;

  return (
    <div className={MARCO} onContextMenu={(e) => e.preventDefault()}>
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        aria-label={titulo}
        className="w-full h-full object-contain"
        playsInline
        muted
        preload="auto"
        controls={!estricto}
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        onClick={estricto ? alternarPausa : undefined}
        onError={fallo}
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
          className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full bg-black/65 backdrop-blur px-3.5 h-9 text-[12.5px] font-semibold text-white border border-white/20 hover:bg-black/80 transition-colors"
        >
          <IconoSonido activo={false} />
          Activar sonido
        </button>
      )}

      {estricto && (
        <>
          {/* Botón grande de play cuando está en pausa. */}
          {!reproduciendo && !terminado && !cargando && (
            <button
              type="button"
              onClick={alternarPausa}
              aria-label="Reproducir video"
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <span className="w-14 h-14 rounded-full bg-white/25 backdrop-blur flex items-center justify-center text-white">
                <IconoPlay />
              </span>
            </button>
          )}

          {/* Barra inferior: pausa, avance (solo se ve, no se toca) y sonido. */}
          {!terminado && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-3 pb-2.5 pt-8 bg-gradient-to-t from-black/70 to-transparent">
              <button
                type="button"
                onClick={alternarPausa}
                aria-label={reproduciendo ? 'Pausar video' : 'Reproducir video'}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-white hover:bg-white/15 transition-colors"
              >
                {reproduciendo ? <IconoPausa /> : <IconoPlay />}
              </button>
              <div aria-hidden="true" className="pointer-events-none h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
                <div className="h-full rounded-full bg-[#38bdf8]" style={{ width: `${progreso * 100}%` }} />
              </div>
              <button
                type="button"
                onClick={alternarSonido}
                aria-label={silenciado ? 'Activar sonido' : 'Silenciar video'}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-white hover:bg-white/15 transition-colors"
              >
                <IconoSonido activo={!silenciado} />
              </button>
            </div>
          )}
        </>
      )}

      {terminado && alTerminar && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#060915]/85 backdrop-blur-sm px-6">
          {alTerminar(repetir)}
        </div>
      )}
    </div>
  );
}
