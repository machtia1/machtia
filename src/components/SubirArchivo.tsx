'use client';

import { useId, useRef, useState } from 'react';
import { revisarArchivo, subirDirecto, type TipoSubida } from '@/lib/subidaDirecta';

interface Props {
  tipo: TipoSubida;
  userId: string;
  etiqueta: string;
  /** Texto del botón cuando todavía no hay archivo. */
  textoBoton?: string;
  accept: string;
  /** Texto con el nombre/estado del archivo ya subido (si lo hay). */
  actual?: string;
  alSubir: (url: string, archivo: File) => void;
}

/** Botón de subida directa con barra de avance y mensajes claros de error. */
export default function SubirArchivo({ tipo, userId, etiqueta, textoBoton, accept, actual, alSubir }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError('');
    const problema = revisarArchivo(archivo, tipo);
    if (problema) {
      setError(problema);
      e.target.value = '';
      return;
    }
    setProgreso(0);
    try {
      const url = await subirDirecto(archivo, tipo, userId, setProgreso);
      alSubir(url, archivo);
    } catch (err) {
      setError(
        err instanceof Error && /No autorizado/i.test(err.message)
          ? 'Tu sesión terminó. Vuelve a iniciar sesión.'
          : 'No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.'
      );
    } finally {
      setProgreso(null);
      if (input.current) input.current.value = '';
    }
  }

  const subiendo = progreso !== null;

  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-[#374151] mb-1.5">
        {etiqueta}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={subiendo}
          onClick={() => input.current?.click()}
          className="text-[13px] font-semibold border border-cm-primary/40 text-cm-primary rounded-lg px-3.5 py-2 disabled:opacity-50"
        >
          {subiendo ? `Subiendo… ${progreso}%` : actual ? 'Cambiar' : textoBoton ?? 'Subir archivo'}
        </button>
        <input id={id} ref={input} type="file" accept={accept} onChange={elegir} className="sr-only" />
        {actual && !subiendo && <span className="text-[12.5px] text-emerald-700 break-all">✓ {actual}</span>}
      </div>
      {subiendo && (
        <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-[#E4E7EE] overflow-hidden" aria-hidden="true">
          <div className="h-full bg-cm-primary transition-all" style={{ width: `${progreso}%` }} />
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-600 text-[12.5px] mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
