'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, EyeOff, Landmark, Wallet } from 'lucide-react';
import AdminTabs from './AdminTabs';
import LoadingLogo from './LoadingLogo';
import type { DatosGuardados } from '@/lib/datosBancarios';

interface Registro {
  usuarioId: string;
  nombre: string;
  correo: string;
  rol: string;
  tieneBanco: boolean;
  tieneWallet: boolean;
  actualizadoEn: string;
}

const ROL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  PROFESOR_FACILITADOR: 'Profesor/Facilitador',
  SOCIO: 'Socio',
  USUARIO: 'Usuario',
  ASISTENTE_ADMINISTRATIVO: 'Administrativo/Operativo',
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] uppercase tracking-wide font-bold text-[#6B7280]">{etiqueta}</p>
      <p className="text-[13px] font-medium break-all select-all">{valor}</p>
    </div>
  );
}

/** Vista del Administrador: quién capturó datos y consulta de los datos completos (descifrados). */
export default function AdminDatosBancarios() {
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosGuardados | null>(null);
  const [errorDetalle, setErrorDetalle] = useState('');

  useEffect(() => {
    fetch('/api/admin/datos-bancarios')
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        setRegistros(d.registros);
      })
      .catch(() => setError('No se pudo cargar la lista.'));
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (registros ?? []).filter((r) => !q || r.nombre.toLowerCase().includes(q) || r.correo.toLowerCase().includes(q));
  }, [registros, busqueda]);

  const ver = async (id: string) => {
    if (abierto === id) {
      setAbierto(null);
      setDatos(null);
      return;
    }
    setAbierto(id);
    setDatos(null);
    setErrorDetalle('');
    const res = await fetch(`/api/admin/datos-bancarios/${id}`);
    const d = await res.json();
    if (res.ok) setDatos(d.datos);
    else setErrorDetalle(d.error || 'No se pudo consultar');
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1000px] mx-auto">
      <AdminTabs />
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-[20px] font-bold">Datos bancarios de usuarios</h1>
          <p className="text-[12.5px] text-[#6B7280]">Información cifrada en la base de datos; solo usted puede verla. Cada consulta queda registrada.</p>
        </div>
        <a
          href="/api/admin/datos-bancarios/exportar"
          className="h-10 px-4 rounded-xl bg-cm-primary text-white text-[13px] font-semibold inline-flex items-center gap-2"
        >
          <Download size={14} /> Descargar CSV
        </a>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o correo..."
        className="w-full h-10 px-3 rounded-xl border border-[#E4E7EE] bg-white text-[13px] mb-4 outline-none focus:border-cm-primary"
      />

      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      {!registros && !error && <LoadingLogo size={28} label="Cargando..." />}
      {registros && filtrados.length === 0 && (
        <p className="text-[13px] text-[#6B7280]">{registros.length === 0 ? 'Todavía nadie ha capturado datos bancarios.' : 'Sin resultados.'}</p>
      )}

      <div className="flex flex-col gap-2">
        {filtrados.map((r) => (
          <div key={r.usuarioId} className="bg-white border border-[#E4E7EE] rounded-2xl p-4" data-testid="fila-datos">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold truncate">{r.nombre}</p>
                <p className="text-[12px] text-[#6B7280] truncate">{r.correo} · {ROL[r.rol] ?? r.rol}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.tieneBanco && <span className="text-[11px] font-semibold bg-[#EEF2FF] text-cm-primary px-2 py-1 rounded-full inline-flex items-center gap-1"><Landmark size={11} /> Banco</span>}
                {r.tieneWallet && <span className="text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] px-2 py-1 rounded-full inline-flex items-center gap-1"><Wallet size={11} /> Wallet</span>}
                <button onClick={() => ver(r.usuarioId)} className="h-9 px-3 rounded-xl border border-[#E4E7EE] text-[12.5px] font-semibold inline-flex items-center gap-1.5">
                  {abierto === r.usuarioId ? <><EyeOff size={13} /> Ocultar</> : <><Eye size={13} /> Ver datos</>}
                </button>
              </div>
            </div>

            {abierto === r.usuarioId && (
              <div className="mt-3 pt-3 border-t border-[#E4E7EE] grid sm:grid-cols-2 gap-4" data-testid="detalle-datos">
                {errorDetalle && <p role="alert" className="text-[12.5px] text-red-600 sm:col-span-2">{errorDetalle}</p>}
                {!datos && !errorDetalle && <p className="text-[12.5px] text-[#6B7280]">Descifrando...</p>}
                {datos?.banco && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[12px] font-bold">{datos.banco.tipo === 'MEXICO' ? 'Cuenta en México' : 'Cuenta internacional'}</p>
                    <Dato etiqueta={datos.banco.tipo === 'MEXICO' ? 'CLABE' : 'Cuenta / IBAN'} valor={datos.banco.cuenta} />
                    <Dato etiqueta="Banco" valor={datos.banco.banco} />
                    <Dato etiqueta="Beneficiario" valor={datos.banco.titular} />
                    <Dato etiqueta="País" valor={datos.banco.pais} />
                    <Dato etiqueta="Adicionales" valor={datos.banco.adicionales} />
                  </div>
                )}
                {datos?.wallet && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[12px] font-bold">Wallet</p>
                    <Dato etiqueta="Moneda" valor={datos.wallet.moneda} />
                    <Dato etiqueta="Red" valor={datos.wallet.red} />
                    <Dato etiqueta="Dirección" valor={datos.wallet.direccion} />
                    <Dato etiqueta="Adicionales" valor={datos.wallet.adicionales} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
