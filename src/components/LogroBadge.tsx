'use client';

import { Lock, Trophy } from 'lucide-react';
import type { LogroConEstado } from '@/lib/logros-types';

const COLOR_POR_CATEGORIA: Record<string, string> = {
  academico: 'from-amber-400 to-amber-600',
  red: 'from-cm-primary to-cm-accent',
  ganancias: 'from-emerald-400 to-emerald-600',
};

export default function LogroBadge({ logro }: { logro: LogroConEstado }) {
  const color = COLOR_POR_CATEGORIA[logro.categoria] ?? 'from-cm-primary to-cm-accent';
  const porcentaje = Math.min(100, Math.round((logro.progresoActual / logro.progresoMeta) * 100));

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col items-center text-center gap-2 ${
        logro.desbloqueado
          ? 'bg-white border-[#E4E7EE]'
          : 'bg-[#F4F6FB] border-[#E4E7EE] opacity-70'
      }`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br ${
          logro.desbloqueado ? color : 'from-gray-300 to-gray-400'
        }`}
      >
        {logro.desbloqueado ? (
          <Trophy size={26} className="text-white" />
        ) : (
          <Lock size={22} className="text-white" />
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
