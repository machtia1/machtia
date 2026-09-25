'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, Search, UserPlus, Users } from 'lucide-react';
import { PAISES, banderaPorPais } from '@/lib/ubicaciones';
import LoadingLogo from './LoadingLogo';

const SUSCRIPCIONES_FILTRO = [
  { valor: 'BASICA', etiqueta: 'Básica' },
  { valor: 'PLUS', etiqueta: 'Plus' },
  { valor: 'NEGOCIOS', etiqueta: 'Negocios' },
  { valor: 'NINOS', etiqueta: 'Niños' },
  { valor: 'SOCIO_FUNDADOR', etiqueta: 'Socio Fundador' },
  { valor: 'ASOCIADO', etiqueta: 'Asociado' },
  { valor: 'PROFESOR_FACILITADOR', etiqueta: 'Profesor Facilitador' },
  { valor: 'ASISTENTE_ADMINISTRATIVO', etiqueta: 'Asistente Administrativo' },
] as const;

interface UsuarioBusqueda {
  id: string;
  nombreCompleto: string;
  nombreUsuario: string | null;
  correo: string;
  pais: string | null;
  ciudad: string | null;
  suscripcion: string | null;
}

interface Invitado {
  id: string;
  nombreCompleto: string;
  nombreUsuario: string | null;
  correo: string;
  pais: string | null;
  telefono: string | null;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVA: 'Activo',
  INACTIVA: 'Inactivo',
  PENDIENTE_APROBACION: 'Pendiente de aprobación',
  PENDIENTE_CONFIRMACION: 'Pendiente de confirmar correo',
  RECHAZADA: 'Rechazado',
};

/**
 * "Mis Referidos" — pedida por el cliente el 25 sept 2026, dividida
 * en dos partes:
 *   - Búsqueda de Usuarios: buscador + filtros sobre TODA la base de
 *     usuarios (por usuario, nombre, correo, país, ciudad o
 *     suscripción).
 *   - Mis Invitados: lista de las personas que este usuario invitó
 *     de forma DIRECTA (por su propio link de invitación).
 */
export default function MisReferidos() {
  const [tab, setTab] = useState<'buscar' | 'invitados'>('buscar');

  // ---------- Búsqueda de Usuarios ----------
  const [q, setQ] = useState('');
  const [filtroPais, setFiltroPais] = useState('');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState('');
  const [resultados, setResultados] = useState<UsuarioBusqueda[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');

  useEffect(() => {
    if (tab !== 'buscar') return;
    if (!q.trim() && !filtroPais && !filtroSuscripcion) {
      setResultados(null);
      return;
    }
    const t = window.setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda('');
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (filtroPais) params.set('pais', filtroPais);
        if (filtroSuscripcion) params.set('suscripcion', filtroSuscripcion);
        const res = await fetch(`/api/usuarios/buscar?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorBusqueda(data.error || 'No se pudo buscar');
          return;
        }
        setResultados(data.usuarios);
      } catch {
        setErrorBusqueda('Error de conexión');
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, filtroPais, filtroSuscripcion, tab]);

  // ---------- Mis Invitados ----------
  const [invitados, setInvitados] = useState<Invitado[] | null>(null);
  const [errorInvitados, setErrorInvitados] = useState('');

  useEffect(() => {
    if (tab !== 'invitados' || invitados !== null) return;
    fetch('/api/usuarios/mis-invitados')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorInvitados(data.error || 'No se pudo cargar tus invitados');
          return;
        }
        setInvitados(data.invitados);
      })
      .catch(() => setErrorInvitados('Error de conexión'));
  }, [tab, invitados]);

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-[22px] font-semibold mb-1">Mis Referidos</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Busca a cualquier usuario de la comunidad, o revisa la lista de las personas que tú
        invitaste directamente.
      </p>

      <div className="flex items-center gap-1.5 mb-6 border-b border-[#E4E7EE]">
        <button
          onClick={() => setTab('buscar')}
          className={`flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2.5 border-b-2 -mb-px ${
            tab === 'buscar' ? 'border-cm-primary text-cm-primary' : 'border-transparent text-[#6B7280]'
          }`}
        >
          <Search size={14} /> Búsqueda de Usuarios
        </button>
        <button
          onClick={() => setTab('invitados')}
          className={`flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2.5 border-b-2 -mb-px ${
            tab === 'invitados' ? 'border-cm-primary text-cm-primary' : 'border-transparent text-[#6B7280]'
          }`}
        >
          <UserPlus size={14} /> Mis Invitados
        </button>
      </div>

      {tab === 'buscar' && (
        <div>
          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-4 mb-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9297A6]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca por usuario, nombre, correo, país o ciudad..."
                className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#E4E7EE] text-[13px] outline-none focus:border-cm-accent"
              />
            </div>
            <select
              value={filtroPais}
              onChange={(e) => setFiltroPais(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#E4E7EE] text-[13px] outline-none focus:border-cm-accent"
            >
              <option value="">Todos los países</option>
              {PAISES.map((p) => (
                <option key={p.nombre} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <select
              value={filtroSuscripcion}
              onChange={(e) => setFiltroSuscripcion(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#E4E7EE] text-[13px] outline-none focus:border-cm-accent"
            >
              <option value="">Toda suscripción</option>
              {SUSCRIPCIONES_FILTRO.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.etiqueta}
                </option>
              ))}
            </select>
          </div>

          {errorBusqueda && <p className="text-red-600 text-[13px] mb-3">{errorBusqueda}</p>}

          {buscando && <LoadingLogo size={26} label="Buscando..." />}

          {!buscando && resultados === null && (
            <p className="text-[13px] text-[#6B7280] py-2">
              Escribe algo o elige un filtro para empezar a buscar.
            </p>
          )}

          {!buscando && resultados !== null && resultados.length === 0 && (
            <p className="text-[13px] text-[#6B7280] py-2">No se encontró ningún usuario con esos datos.</p>
          )}

          {!buscando && resultados !== null && resultados.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {resultados.map((u) => (
                <div key={u.id} className="bg-white border border-[#E4E7EE] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[16px]" aria-hidden="true">
                      {banderaPorPais(u.pais)}
                    </span>
                    <span className="text-[14px] font-semibold">{u.nombreCompleto}</span>
                  </div>
                  {u.nombreUsuario && (
                    <p className="text-[12px] text-[#6B7280] mb-1">@{u.nombreUsuario}</p>
                  )}
                  <p className="text-[12px] text-[#6B7280] flex items-center gap-1.5">
                    <Mail size={11} /> {u.correo}
                  </p>
                  <p className="text-[11px] text-[#9297A6] mt-1.5">
                    {[u.ciudad, u.pais].filter(Boolean).join(', ') || 'Sin ubicación'}
                    {u.suscripcion ? ` · ${u.suscripcion}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'invitados' && (
        <div>
          {errorInvitados && <p className="text-red-600 text-[13px] mb-3">{errorInvitados}</p>}

          {invitados === null && !errorInvitados && <LoadingLogo size={26} label="Cargando tus invitados..." />}

          {invitados !== null && invitados.length === 0 && (
            <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6 flex items-center gap-3">
              <Users size={20} className="text-[#9297A6] shrink-0" />
              <p className="text-[13px] text-[#6B7280]">
                Todavía no has invitado a nadie directamente. Comparte tu link de invitación desde
                el Dashboard para empezar.
              </p>
            </div>
          )}

          {invitados !== null && invitados.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {invitados.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white border border-[#E4E7EE] rounded-2xl p-4 flex items-start gap-3"
                >
                  <span className="text-[22px] shrink-0" aria-hidden="true">
                    {banderaPorPais(inv.pais)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold">{inv.nombreCompleto}</span>
                      {inv.nombreUsuario && (
                        <span className="text-[12px] text-[#6B7280]">@{inv.nombreUsuario}</span>
                      )}
                      <span className="text-[10.5px] font-semibold text-cm-primary bg-[#ECECFF] px-2 py-0.5 rounded-full">
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[12px] text-[#6B7280]">
                      <span className="flex items-center gap-1.5">
                        <Mail size={11} /> {inv.correo}
                      </span>
                      {inv.telefono && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={11} /> {inv.telefono}
                        </span>
                      )}
                      {inv.pais && <span>{inv.pais}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
