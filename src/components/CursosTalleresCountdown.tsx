'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useCountdown } from '@/lib/useCountdown';

const FECHA_MATERIAL = process.env.NEXT_PUBLIC_FECHA_CURSOS_TALLERES ?? '2026-10-23T00:00:00-06:00';

export default function CursosTalleresCountdown({ titulo }: { titulo: string }) {
  const countdown = useCountdown(FECHA_MATERIAL, '¡El material ya está disponible!');

  return (
    <div className="p-6 sm:p-8">
      <Link href="/home" className="text-[13px] text-cm-primary font-semibold mb-3 inline-block">
        ← Volver a inicio
      </Link>
      <h1 className="text-[22px] font-semibold mb-1">{titulo}</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Estamos preparando el material. Aquí verás la cuenta regresiva hasta la fecha en la que se
        podría adelantar la visualización en video.
      </p>

      <div className="bg-white border border-[#E4E7EE] rounded-2xl p-8 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-cm-primary/10 flex items-center justify-center">
          <Clock size={26} className="text-cm-primary" />
        </div>
        <div className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wide">
          Disponible en
        </div>
        <div className="text-[32px] font-bold text-cm-primaryDark">{countdown}</div>
        <div className="text-[12px] text-[#6B7280]">Fecha estimada: 23 de octubre de 2026</div>
      </div>
    </div>
  );
}
