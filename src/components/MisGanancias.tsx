'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LogrosUsuario } from '@/lib/logros-types';
import LogroBadge from './LogroBadge';
import LoadingLogo from './LoadingLogo';

interface Movimiento {
  id: string;
  nivel: number;
  monto: string;
  tablaAplicada: string;
  creadoEn: string;
  origen: { nombre: string; apellido: string; suscripcion: string | null };
}

interface ResumenGanancias {
  total: number;
  porNivel: Record<number, number>;
  movimientos: Movimiento[];
  activa: boolean;
  estado: 'pendiente' | 'activa' | 'cerrada';
}

export default function MisGanancias() {
  const [resumen, setResumen] = useState<ResumenGanancias | null>(null);
  const [logros, setLogros] = useState<LogrosUsuario | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/campana/mis-regalias')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setResumen(data);
      })
      .catch(() => setError('Error de conexión'));

    fetch('/api/logros')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setLogros(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 sm:p-8">
      <Link href="/home" className="text-[13px] text-cm-primary font-semibold mb-3 inline-block">
        ← Volver a inicio
      </Link>
      <h1 className="text-[22px] font-semibold mb-1">Mis Ganancias</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Comisiones que has generado dentro de la Campaña de Lanzamiento (Red Alterna).
      </p>

      {error && <p className="text-red-600 text-[13px] mb-4">{error}</p>}

      {!resumen && !error && <LoadingLogo label="Cargando..." />}

      {resumen && (
        <>
          {resumen.estado === 'cerrada' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[13px] rounded-xl px-4 py-3 mb-5">
              La Campaña de Lanzamiento ya cerró — a partir de ahora las ganancias las contabiliza
              la Red General.
            </div>
          )}
          {resumen.estado === 'pendiente' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[13px] rounded-xl px-4 py-3 mb-5">
              La Campaña de Lanzamiento todavía no arranca — empieza hoy 16 de septiembre a las
              10:00 p.m. (hora Centro de México). En cuanto inicie, aquí verás tus
              comisiones en tiempo real.
            </div>
          )}

          {resumen.estado === 'activa' && (resumen.porNivel[1] ?? 0) === 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[13px] rounded-xl px-4 py-3 mb-5">
              Todavía no tienes comisiones porque no has invitado a nadie directamente. Invita al
              menos a 1 persona con tu link personal para empezar a generar comisiones — el resto
              de tu red puede irse llenando, pero las ganancias solo empiezan cuando tienes tu
              primer invitado directo.
            </div>
          )}

          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6 mb-6">
            <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
              Total acumulado
            </div>
            <div className="text-[32px] font-bold text-cm-primaryDark">
              ${resumen.total.toFixed(2)} MXN
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((nivel) => (
              <div key={nivel} className="bg-white border border-[#E4E7EE] rounded-xl p-3 text-center">
                <div className="text-[10px] text-[#6B7280] uppercase font-bold">Nivel {nivel}</div>
                <div className="text-[15px] font-semibold text-cm-primaryDark">
                  ${(resumen.porNivel[nivel] ?? 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {logros && (
            <>
              <h2 className="text-[15px] font-semibold mb-3">Insignias de Ganancias</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {logros.ganancias.map((logro) => (
                  <LogroBadge key={logro.id} logro={logro} />
                ))}
              </div>
            </>
          )}

          <h2 className="text-[15px] font-semibold mb-3">Movimientos</h2>
          <div className="bg-white border border-[#E4E7EE] rounded-2xl overflow-hidden">
            {resumen.movimientos.length === 0 ? (
              <p className="text-[#6B7280] text-[13px] px-5 py-6 text-center">
                Todavía no tienes comisiones registradas.
              </p>
            ) : (
              resumen.movimientos.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-5 py-3 border-b border-[#E4E7EE] last:border-0 text-[13px]"
                >
                  <div>
                    <div className="font-medium">
                      {m.origen.nombre} {m.origen.apellido}
                    </div>
                    <div className="text-[#6B7280] text-[11px]">
                      Nivel {m.nivel} · Tabla {m.tablaAplicada} ·{' '}
                      {new Date(m.creadoEn).toLocaleDateString('es-MX')}
                    </div>
                  </div>
                  <div className="font-semibold text-emerald-600">+${Number(m.monto).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
