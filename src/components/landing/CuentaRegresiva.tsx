'use client';

import { useEffect, useState } from 'react';
import { ETAPAS_CONTADOR, type EtapaContador } from '@/lib/landingConfig';
import { useHoraServidor } from '@/lib/useHoraServidor';

interface Restante {
  etapa: EtapaContador;
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

/** Etapa vigente y tiempo que falta; null cuando ya pasaron todas las fechas. */
function calcular(ahora: number): Restante | null {
  for (const etapa of ETAPAS_CONTADOR) {
    const falta = new Date(etapa.objetivo).getTime() - ahora;
    if (falta > 0) {
      const total = Math.floor(falta / 1000);
      return {
        etapa,
        dias: Math.floor(total / 86400),
        horas: Math.floor((total % 86400) / 3600),
        minutos: Math.floor((total % 3600) / 60),
        segundos: total % 60,
      };
    }
  }
  return null;
}

const dos = (n: number) => String(n).padStart(2, '0');

function Caja({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 sm:py-3 text-center">
      <div className="text-[26px] sm:text-[32px] font-bold leading-none tabular-nums text-white">{valor}</div>
      <div className="mt-1.5 text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wide text-[#7dd3fc]">
        {etiqueta}
      </div>
    </div>
  );
}

/**
 * Cuentas regresivas encadenadas (ver ETAPAS_CONTADOR). Cuando termina una,
 * pasa sola a la siguiente; después de la última no se muestra nada.
 */
export default function CuentaRegresiva() {
  const { listo, ahora } = useHoraServidor();
  // undefined = todavía no se calcula; null = ya pasaron todas las fechas.
  const [restante, setRestante] = useState<Restante | null | undefined>(undefined);

  useEffect(() => {
    if (!listo) return;
    const actualizar = () => setRestante(calcular(ahora()));
    actualizar();
    const id = setInterval(actualizar, 1000);
    return () => clearInterval(id);
  }, [listo, ahora]);

  // Antes de saber la hora del servidor se reserva el espacio (sin saltos de pantalla).
  if (!listo || restante === undefined) {
    return <div aria-hidden="true" className="h-[118px] sm:h-[128px] mb-6" />;
  }
  if (!restante) return null;

  const { etapa, dias, horas, minutos, segundos } = restante;

  return (
    <section
      aria-label={etapa.titulo}
      className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[rgba(15,23,55,0.7)] to-[rgba(8,12,30,0.7)] p-4"
    >
      <p className="mb-3 text-center text-[12px] font-bold uppercase tracking-wide text-white/70">{etapa.titulo}</p>
      <div
        role="timer"
        aria-live="off"
        aria-label={`Faltan ${dias} días, ${horas} horas y ${minutos} minutos`}
        className="flex gap-2 sm:gap-3"
      >
        <Caja valor={String(dias)} etiqueta={dias === 1 ? 'Día' : 'Días'} />
        <Caja valor={dos(horas)} etiqueta="Horas" />
        <Caja valor={dos(minutos)} etiqueta="Min" />
        <Caja valor={dos(segundos)} etiqueta="Seg" />
      </div>
    </section>
  );
}
