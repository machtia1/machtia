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

function Unidad({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-baseline sm:gap-2">
      <span className="text-[30px] sm:text-[52px] font-extrabold leading-none tabular-nums">{dos(valor)}</span>
      <span className="mt-1 sm:mt-0 text-[11px] sm:text-[19px] font-medium text-white/85">{etiqueta}</span>
    </div>
  );
}

function Separador() {
  return (
    <span aria-hidden="true" className="self-start sm:self-center mt-2 sm:mt-0 flex flex-col gap-1.5 sm:gap-2">
      <span className="block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-cm-cian" />
      <span className="block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-cm-cian" />
    </span>
  );
}

/**
 * Franja con las cuentas regresivas encadenadas (ver ETAPAS_CONTADOR). Cuando
 * termina una pasa sola a la siguiente; después de la última no se muestra nada.
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
    return <div aria-hidden="true" className="h-[104px] sm:h-[136px]" />;
  }
  if (!restante) return null;

  const { etapa, dias, horas, minutos, segundos } = restante;

  return (
    <section aria-label="Cuenta regresiva" className="bg-cm-navy text-white">
      <div className="mx-auto max-w-4xl px-4 py-3.5 sm:py-5 text-center">
        <p className="text-[14px] sm:text-[22px] font-bold mb-2 sm:mb-3">{etapa.titulo}</p>
        <div
          role="timer"
          aria-live="off"
          aria-label={`Faltan ${dias} días, ${horas} horas y ${minutos} minutos`}
          className="flex items-center justify-center gap-3 sm:gap-6"
        >
          <Unidad valor={dias} etiqueta={dias === 1 ? 'día' : 'días'} />
          <Separador />
          <Unidad valor={horas} etiqueta={horas === 1 ? 'hora' : 'horas'} />
          <Separador />
          <Unidad valor={minutos} etiqueta="min" />
          <Separador />
          <Unidad valor={segundos} etiqueta={segundos === 1 ? 'segundo' : 'segundos'} />
        </div>
      </div>
    </section>
  );
}
