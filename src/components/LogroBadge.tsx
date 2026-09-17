'use client';

import { useState } from 'react';
import { Lock, Trophy } from 'lucide-react';
import type { LogroConEstado } from '@/lib/logros-types';

export default function LogroBadge({ logro }: { logro: LogroConEstado }) {
  const [imagenFallo, setImagenFallo] = useState(false);
  const porcentaje = Math.min(100, Math.round((logro.progresoActual / logro.progresoMeta) * 100));

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col items-center text-center gap-2 ${
        logro.desbloqueado
          ? 'bg-white border-[#E4E7EE]'
          : 'bg-[#F4F6FB] border-[#E4E7EE] opacity-70'
      }`}
    >
      <div className="relative w-16 h-16 shrink-0">
        {!imagenFallo ? (
          <img
            src={`/logros/${logro.id}.jpg`}
            alt={logro.nombre}
            onError={() => setImagenFallo(true)}
            className={`w-16 h-16 rounded-full object-cover border border-[#E4E7EE] ${
              logro.desbloqueado ? '' : 'grayscale opacity-60'
            }`}
          />
        ) : (
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br ${
              logro.desbloqueado ? 'from-cm-primary to-cm-accent' : 'from-gray-300 to-gray-400'
            }`}
          >
            <Trophy size={26} className="text-white" />
          </div>
        )}

        {!logro.desbloqueado && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 rounded-full">
            <Lock size={18} className="text-white drop-shadow" />
          </div>
        )}
      </div>

      <div className="text-[13px] font-semibold leading-tight">{logro.nombre}</div>
      <div className="text-[11px] text-[#6B7280] leading-tight">{logro.descripcion}</div>

      {!logro.disponible ? (
        <span className="mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          Próximamente
        </span>
      ) : !logro.desbloqueado && logro.progresoMeta > 1 ? (
        <div className="w-full mt-1">
          <div className="h-1.5 w-full bg-[#E4E7EE] rounded-full overflow-hidden">
            <div
              className="h-full bg-cm-primary rounded-full"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <div className="text-[10px] text-[#6B7280] mt-1">
            {logro.progresoActual} / {logro.progresoMeta}
          </div>
        </div>
      ) : logro.desbloqueado ? (
        <span className="mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          Desbloqueado
        </span>
      ) : null}
    </div>
  );
}
