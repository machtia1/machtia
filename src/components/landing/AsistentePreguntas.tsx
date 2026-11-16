'use client';

import { useEffect, useRef, useState } from 'react';
import { PREGUNTAS_FRECUENTES, enlaceWhatsApp } from '@/lib/landingConfig';

interface Mensaje {
  id: string;
  de: 'asistente' | 'persona';
  texto: string;
}

interface Props {
  /** Nombre de quien invitó (se incluye en el mensaje de WhatsApp). Vacío si no aplica. */
  invitador?: string;
}

function IconoWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.52 3.45A11.8 11.8 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41z" />
    </svg>
  );
}

/**
 * Asistente gratuito de preguntas y respuestas: la persona toca una pregunta
 * y recibe su respuesta. No usa inteligencia artificial ni tiene costo.
 * Siempre ofrece hablar con un asesor por WhatsApp.
 */
export default function AsistentePreguntas({ invitador }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: 'saludo', de: 'asistente', texto: 'Hola, soy el asistente de Machtia. ¿Qué te gustaría saber?' },
  ]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [hechas, setHechas] = useState<string[]>([]);
  const finRef = useRef<HTMLDivElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primeraVez = useRef(true);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    []
  );

  // Mantiene visible la última respuesta (sin mover la pantalla al abrir el asistente).
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [mensajes, escribiendo]);

  function preguntar(id: string) {
    if (escribiendo) return;
    const item = PREGUNTAS_FRECUENTES.find((p) => p.id === id);
    if (!item) return;
    setHechas((previas) => (previas.includes(id) ? previas : [...previas, id]));
    setMensajes((previos) => [...previos, { id: `p-${id}-${previos.length}`, de: 'persona', texto: item.pregunta }]);
    setEscribiendo(true);
    temporizador.current = setTimeout(() => {
      setMensajes((previos) => [...previos, { id: `r-${id}-${previos.length}`, de: 'asistente', texto: item.respuesta }]);
      setEscribiendo(false);
    }, 450);
  }

  return (
    <section
      aria-label="Asistente de preguntas frecuentes"
      className="rounded-3xl border border-white/10 bg-gradient-to-b from-[rgba(15,23,55,0.92)] to-[rgba(8,12,30,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-5 sm:p-6"
    >
      <p className="text-[11px] font-bold text-[#7dd3fc] uppercase tracking-wide mb-1">¿Tienes dudas?</p>
      <h2 className="text-[18px] font-bold mb-4">Preguntas frecuentes</h2>

      <div
        role="log"
        aria-live="polite"
        className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1 mb-4"
      >
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={
              m.de === 'asistente'
                ? 'self-start max-w-[88%] rounded-2xl rounded-bl-md bg-white/[0.07] border border-white/10 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white/90'
                : 'self-end max-w-[88%] rounded-2xl rounded-br-md bg-gradient-to-br from-[#38bdf8] to-[#6366f1] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white'
            }
          >
            {m.texto}
          </div>
        ))}
        {escribiendo && (
          <div className="self-start rounded-2xl rounded-bl-md bg-white/[0.07] border border-white/10 px-3.5 py-3 flex gap-1" aria-label="Escribiendo">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" />
          </div>
        )}
        <div ref={finRef} />
      </div>

      {PREGUNTAS_FRECUENTES.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {PREGUNTAS_FRECUENTES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => preguntar(p.id)}
              disabled={escribiendo}
              className={`rounded-full border px-3.5 py-2 text-[12.5px] font-medium text-left transition-colors disabled:opacity-60 ${
                hechas.includes(p.id)
                  ? 'border-white/10 bg-white/[0.03] text-white/55'
                  : 'border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#bae6fd] hover:bg-[#38bdf8]/20'
              }`}
            >
              {p.pregunta}
            </button>
          ))}
        </div>
      )}

      <a
        href={enlaceWhatsApp(invitador)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2.5 h-12 rounded-2xl bg-[#25D366] text-[#06210f] text-[14.5px] font-bold shadow-[0_8px_22px_rgba(37,211,102,0.25)] hover:brightness-105 transition"
      >
        <IconoWhatsApp />
        Hablar con un asesor por WhatsApp
      </a>
    </section>
  );
}
