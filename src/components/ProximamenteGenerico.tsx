'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function ProximamenteGenerico({ titulo }: { titulo: string }) {
  return (
    <div className="p-6 sm:p-8">
      <Link href="/home" className="text-[13px] text-cm-primary font-semibold mb-3 inline-block">
        ← Volver a inicio
      </Link>
      <h1 className="text-[22px] font-semibold mb-1">{titulo}</h1>

      <div className="bg-white border border-[#E4E7EE] rounded-2xl p-10 flex flex-col items-center text-center gap-3 mt-6">
        <div className="w-14 h-14 rounded-full bg-cm-primary/10 flex items-center justify-center">
          <Sparkles size={26} className="text-cm-primary" />
        </div>
        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
          Próximamente
        </span>
        <p className="text-[#6B7280] text-[14px] max-w-sm">
          Esta sección todavía no está disponible. En cuanto se defina su contenido, aparecerá
          aquí.
        </p>
      </div>
    </div>
  );
}
