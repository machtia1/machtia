'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LogrosUsuario, CategoriaLogro } from '@/lib/logros-types';
import LogroBadge from './LogroBadge';
import LoadingLogo from './LoadingLogo';

const PESTANAS: { id: CategoriaLogro; label: string }[] = [
  { id: 'academico', label: 'Logros Académicos' },
  { id: 'red', label: 'Logros de Red' },
  { id: 'ganancias', label: 'Logros de Ganancias' },
];

export default function MisLogros() {
  const [datos, setDatos] = useState<LogrosUsuario | null>(null);
  const [error, setError] = useState('');
  const [pestanaActiva, setPestanaActiva] = useState<CategoriaLogro>('academico');

  useEffect(() => {
    fetch('/api/logros')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setDatos(data);
      })
      .catch(() => setError('Error de conexión'));
  }, []);

  const mapaListas: Record<CategoriaLogro, keyof LogrosUsuario> = {
    academico: 'academicos',
    red: 'red',
    ganancias: 'ganancias',
  };

  const listaActiva = datos ? datos[mapaListas[pestanaActiva]] : [];

  return (
    <div className="p-6 sm:p-8">
      <Link href="/home" className="text-[13px] text-cm-primary font-semibold mb-3 inline-block">
        ← Volver a inicio
      </Link>
      <h1 className="text-[22px] font-semibold mb-1">Mis Logros</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Insignias que vas desbloqueando dentro de Club Machtia, calculadas con tu actividad real.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestanaActiva(p.id)}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition ${
              pestanaActiva === p.id
                ? 'bg-cm-primary text-white border-cm-primary'
                : 'bg-white text-[#6B7280] border-[#E4E7EE]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-[13px] mb-4">{error}</p>}

      {!datos && !error && <LoadingLogo label="Cargando tus logros..." />}

      {pestanaActiva === 'academico' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[13px] rounded-xl px-4 py-3 mb-5">
          Esta categoría se activa cuando lancemos el módulo de Cursos y Talleres. La estructura ya
          está lista — en cuanto exista el registro de cursos completados, estas insignias empiezan
          a desbloquearse solas.
        </div>
      )}

      {datos && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {listaActiva.map((logro) => (
            <LogroBadge key={logro.id} logro={logro} />
          ))}
        </div>
      )}
    </div>
  );
}
