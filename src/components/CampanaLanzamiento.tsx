'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Network, Rocket } from 'lucide-react';
import { useCountdown } from '@/lib/useCountdown';

const CAMPANA_FIN_ISO = '2026-10-30T22:00:00-06:00';

interface NivelArbol {
  nivel: number;
  personas: number;
}

interface DatosArbol {
  niveles: NivelArbol[];
  estado: 'pendiente' | 'activa' | 'cerrada';
  tablas: Record<'BASICA' | 'PLUS' | 'NEGOCIOS', Record<number, number>>;
}

const ESTADO_TEXTO: Record<DatosArbol['estado'], string> = {
  pendiente: 'La campaña todavía no arranca',
  activa: 'Campaña activa',
  cerrada: 'La campaña ya cerró — ahora contabiliza la Red General',
};

export default function CampanaLanzamiento() {
  const [datos, setDatos] = useState<DatosArbol | null>(null);
  const [error, setError] = useState('');
  const countdown = useCountdown(CAMPANA_FIN_ISO, '¡Campaña finalizada!');

  useEffect(() => {
    fetch('/api/campana/arbol')
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

  return (
    <div className="p-6 sm:p-8">
      <Link href="/home" className="text-[13px] text-cm-primary font-semibold mb-3 inline-block">
        ← Volver a inicio
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <Rocket size={22} className="text-cm-primary" />
        <h1 className="text-[22px] font-semibold">Campaña de Lanzamiento</h1>
      </div>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Tu red de invitación real, hasta 5 niveles hacia abajo, y cuánto genera cada nivel según el
        tipo de suscripción.
      </p>

      {error && <p className="text-red-600 text-[13px] mb-4">{error}</p>}

      {datos && (
        <>
          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
                {ESTADO_TEXTO[datos.estado]}
              </div>
              <div className="text-[24px] font-bold text-cm-primaryDark">{countdown}</div>
            </div>
            <div className="text-[12px] text-[#6B7280]">Cierra: 30 de octubre de 2026</div>
          </div>

          {datos.estado === 'pendiente' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[13px] rounded-xl px-4 py-3 mb-6">
              La campaña arranca el 16 de septiembre a las 12:00 del mediodía (hora Centro de
              México).
            </div>
          )}

          {datos.estado === 'activa' && (datos.niveles[0]?.personas ?? 0) === 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[13px] rounded-xl px-4 py-3 mb-6">
              Todavía no tienes comisiones porque no has invitado a nadie directamente. Invita al
              menos a 1 persona con tu link personal para empezar a generar comisiones.
            </div>
          )}

          {/* Árbol de 5 niveles */}
          <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
            <Network size={16} className="text-cm-primary" />
            Tu red por nivel
          </h2>
          <div className="flex flex-col gap-2 mb-8">
            {datos.niveles.map((n) => {
              const anchoMax = Math.max(...datos.niveles.map((x) => x.personas), 1);
              const porcentaje = Math.max(6, Math.round((n.personas / anchoMax) * 100));
              return (
                <div key={n.nivel} className="flex items-center gap-3">
                  <div className="w-16 shrink-0 text-[12px] font-bold text-[#6B7280]">
                    Nivel {n.nivel}
                  </div>
                  <div className="flex-1 bg-[#F4F6FB] rounded-lg h-8 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cm-primary to-cm-accent rounded-lg flex items-center justify-end pr-2"
                      style={{ width: `${porcentaje}%` }}
                    >
                      <span className="text-white text-[11px] font-bold">{n.personas}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla de comisiones */}
          <h2 className="text-[15px] font-semibold mb-3">Comisión por nivel y tipo de membresía</h2>
          <div className="bg-white border border-[#E4E7EE] rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#F4F6FB] text-[#6B7280] text-[11px] uppercase">
                  <th className="text-left px-4 py-2 font-bold">Nivel</th>
                  <th className="text-right px-4 py-2 font-bold">Básica</th>
                  <th className="text-right px-4 py-2 font-bold">Plus</th>
                  <th className="text-right px-4 py-2 font-bold">Negocios</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((nivel) => (
                  <tr key={nivel} className="border-t border-[#E4E7EE]">
                    <td className="px-4 py-2 font-semibold">Nivel {nivel}</td>
                    <td className="px-4 py-2 text-right">${datos.tablas.BASICA[nivel].toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">${datos.tablas.PLUS[nivel].toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">${datos.tablas.NEGOCIOS[nivel].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-2">
            Ganas la comisión del nivel más bajo entre tu propia suscripción y la de la persona que
            se registra — nadie gana más de lo que su propio nivel permite.
          </p>

          <Link
            href="/home/mi-oficina/ganancias"
            className="inline-block mt-6 text-[13px] font-semibold text-cm-primary"
          >
            Ver mis ganancias reales →
          </Link>
        </>
      )}
    </div>
  );
}
