'use client';

import { useEffect, useRef, useState } from 'react';
import { PREGUNTAS_FRECUENTES } from '@/lib/landingConfig';

interface Mensaje {
  id: string;
  de: 'asistente' | 'persona';
  texto: string;
}

/**
 * Asistente gratuito de preguntas y respuestas: la persona toca una pregunta
 * y recibe su respuesta. No usa inteligencia artificial ni tiene costo.
 */
export default function AsistentePreguntas() {
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
      aria-label="Preguntas frecuentes"
      className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(8,42,92,0.12)] p-5 sm:p-7"
    >
      <h2 className="text-[20px] sm:text-[24px] font-extrabold text-cm-tinta mb-4">Preguntas frecuentes</h2>

      <div role="log" aria-live="polite" className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1 mb-4">
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={
              m.de === 'asistente'
                ? 'self-start max-w-[90%] rounded-2xl rounded-bl-md bg-[#eef3f9] px-4 py-2.5 text-[14.5px] leading-relaxed text-cm-tinta'
                : 'self-end max-w-[90%] rounded-2xl rounded-br-md bg-cm-navy px-4 py-2.5 text-[14.5px] leading-relaxed text-white'
            }
          >
            {m.texto}
          </div>
        ))}
        {escribiendo && (
          <div className="self-start rounded-2xl rounded-bl-md bg-[#eef3f9] px-4 py-3.5 flex gap-1" aria-label="Escribiendo">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" />
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {PREGUNTAS_FRECUENTES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => preguntar(p.id)}
            disabled={escribiendo}
            className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold text-left transition-colors disabled:opacity-60 ${
              hechas.includes(p.id)
                ? 'border-slate-200 bg-slate-50 text-slate-500'
                : 'border-cm-cian bg-cm-cian/10 text-cm-navy hover:bg-cm-cian/25'
            }`}
          >
            {p.pregunta}
          </button>
        ))}
      </div>
    </section>
  );
}
