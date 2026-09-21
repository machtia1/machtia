'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingLogo from './LoadingLogo';
import AdminTabs from './AdminTabs';

interface Pendiente {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  ladaPais: string | null;
  pais: string | null;
  estadoProvincia: string | null;
  ciudad: string | null;
  suscripcion: string | null;
  comprobantePagoUrl: string | null;
  creadoEn: string;
  invitadoPor: { nombre: string; apellido: string } | null;
}

const ETIQUETA_SUSCRIPCION: Record<string, string> = {
  BASICA: 'Básica',
  PLUS: 'Plus',
  NEGOCIOS: 'Negocios',
  NINOS: 'Niños',
  SOCIO_FUNDADOR: 'Socio Fundador',
  CREADOR_DE_CURSOS: 'Creador de Cursos',
};

export default function PanelAprobaciones() {
  const [pendientes, setPendientes] = useState<Pendiente[] | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function cargar() {
    setError('');
    try {
      const res = await fetch('/api/admin/pendientes');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar la lista');
        return;
      }
      setPendientes(data.pendientes);
    } catch {
      setError('Error de conexión');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function aprobar(usuarioId: string) {
    setProcesando(usuarioId);
    setError('');
    try {
      const res = await fetch('/api/admin/aprobar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo aprobar');
        return;
      }
      setPendientes((prev) => prev?.filter((p) => p.id !== usuarioId) ?? null);
    } catch {
      setError('Error de conexión');
    } finally {
      setProcesando(null);
    }
  }

  async function rechazar(usuarioId: string, nombreCompleto: string) {
    const confirmado = window.confirm(
      `¿Rechazar el registro de ${nombreCompleto}? Esta acción no se puede deshacer desde aquí.`
    );
    if (!confirmado) return;

    setProcesando(usuarioId);
    setError('');
    try {
      const res = await fetch('/api/admin/rechazar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo rechazar');
        return;
      }
      setPendientes((prev) => prev?.filter((p) => p.id !== usuarioId) ?? null);
    } catch {
      setError('Error de conexión');
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <AdminTabs />
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[22px] font-semibold text-[#1C1E2B]">Aprobar registros</h1>
          <Link href="/home" className="text-[13px] text-cm-primary font-medium hover:underline">
            ← Volver al Dashboard
          </Link>
        </div>
        <p className="text-[#6B7280] text-[14px] mb-8">
          Revisa el comprobante de pago antes de aprobar. Al aprobar, la cuenta se activa
          inmediatamente y se generan las regalías de la Red Alterna si la campaña sigue vigente.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[13px]">
            {error}
          </div>
        )}

        {pendientes === null && !error && <LoadingLogo label="Cargando..." />}

        {pendientes && pendientes.length === 0 && (
          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-10 text-center">
            <p className="text-[#6B7280] text-[14px]">
              No hay registros pendientes de aprobación en este momento.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {pendientes?.map((p) => {
            const nombreCompleto = `${p.nombre} ${p.apellido}`;
            const esProcesando = procesando === p.id;
            return (
              <div
                key={p.id}
                className="bg-white border border-[#E4E7EE] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-[15px] font-semibold text-[#1C1E2B]">{nombreCompleto}</h2>
                    {p.suscripcion && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cm-primary/10 text-cm-primary">
                        {ETIQUETA_SUSCRIPCION[p.suscripcion] ?? p.suscripcion}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#6B7280] mb-2">{p.correo}</p>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-[#374151]">
                    <div>
                      <dt className="text-[#9CA3AF]">Teléfono</dt>
                      <dd>{p.ladaPais} {p.telefono}</dd>
                    </div>
                    <div>
                      <dt className="text-[#9CA3AF]">Ubicación</dt>
                      <dd>{p.ciudad}, {p.estadoProvincia}, {p.pais}</dd>
                    </div>
                    {p.invitadoPor && (
                      <div className="col-span-2">
                        <dt className="text-[#9CA3AF]">Invitado por</dt>
                        <dd>{p.invitadoPor.nombre} {p.invitadoPor.apellido}</dd>
                      </div>
                    )}
                  </dl>

                  {p.comprobantePagoUrl && (
                    <a
                      href={p.comprobantePagoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-[13px] font-medium text-cm-primary hover:underline"
                    >
                      Ver comprobante de pago →
                    </a>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => aprobar(p.id)}
                    disabled={esProcesando}
                    className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {esProcesando ? '...' : 'Aprobar'}
                  </button>
                  <button
                    onClick={() => rechazar(p.id, nombreCompleto)}
                    disabled={esProcesando}
                    className="h-10 px-4 rounded-lg border border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 disabled:opacity-50"
                  >
                    {esProcesando ? '...' : 'Rechazar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
