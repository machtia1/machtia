'use client';

import { useEffect, useState } from 'react';

interface UsuarioFila {
  id: string;
  nombreCompleto: string;
  correo: string;
  pais: string | null;
  suscripcion: string | null;
  status: string;
  rol: string;
  patrocinador: string | null;
}

const SUSCRIPCION_LABELS: Record<string, string> = {
  BASICA: 'Básica',
  PLUS: 'Plus',
  NEGOCIOS: 'Negocios',
  NINOS: 'Niños',
  SOCIO_FUNDADOR: 'Socio Fundador',
  ASOCIADO: 'Asociado',
  CREADOR_DE_CURSOS: 'Creador de Cursos',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVA: 'Activa',
  INACTIVA: 'Inactiva',
  PENDIENTE_APROBACION: 'Pendiente de aprobación',
  PENDIENTE_CONFIRMACION: 'Pendiente de confirmación',
  RECHAZADA: 'Rechazada',
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioFila[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  async function cargar() {
    setError('');
    try {
      const res = await fetch('/api/admin/usuarios');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar la lista de usuarios');
        return;
      }
      setUsuarios(data.usuarios);
    } catch {
      setError('Error de conexión');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarInactivo(usuario: UsuarioFila) {
    if (usuario.status === 'INACTIVA') return;
    setProcesandoId(usuario.id);
    setError('');
    try {
      const res = await fetch('/api/admin/red/marcar-inactivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuario.id }),
      });
      if (res.ok) {
        await cargar();
      } else {
        const data = await res.json();
        setError(data.error || 'No se pudo marcar como inactivo');
      }
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminarDefinitivo(usuario: UsuarioFila) {
    const ok = window.confirm(
      `¿Eliminar definitivamente a ${usuario.nombreCompleto} de su posición en la red? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setProcesandoId(usuario.id);
    setError('');
    try {
      const res = await fetch('/api/admin/red/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuario.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo eliminar');
        return;
      }
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  }

  async function enviarAlFondo(usuario: UsuarioFila) {
    const ok = window.confirm(
      `¿Enviar a ${usuario.nombreCompleto} al fondo de su red original? Su posición actual se libera y se reinserta al final.`
    );
    if (!ok) return;
    setProcesandoId(usuario.id);
    setError('');
    try {
      const res = await fetch('/api/admin/red/enviar-al-fondo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuario.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar al fondo');
        return;
      }
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  }

  const filtrados = (usuarios ?? []).filter((u) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    return (
      u.nombreCompleto.toLowerCase().includes(q) ||
      u.correo.toLowerCase().includes(q) ||
      (u.patrocinador ?? '').toLowerCase().includes(q)
    );
  });

  if (cargando) {
    return <div className="p-8 text-[14px] text-[#6B7280]">Cargando usuarios...</div>;
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-[22px] font-semibold mb-1">Usuarios</h1>
      <p className="text-[#6B7280] text-[14px] mb-5">
        Lista completa de cuentas registradas, con su patrocinador y tipo de suscripción.
      </p>

      <input
        type="text"
        placeholder="Buscar por nombre, correo o patrocinador..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full max-w-sm mb-4 px-3 py-2 rounded-lg border border-[#E4E7EE] text-[13px]"
      />

      {error && <div className="text-[13px] text-red-600 mb-3">{error}</div>}

      <div className="bg-white border border-[#E4E7EE] rounded-2xl overflow-x-auto">
        <table className="w-full text-[13px] min-w-[900px]">
          <thead>
            <tr className="text-left text-[#6B7280] border-b border-[#E4E7EE]">
              <th className="px-4 py-3 font-medium">Nombre completo</th>
              <th className="px-4 py-3 font-medium">País</th>
              <th className="px-4 py-3 font-medium">Suscripción</th>
              <th className="px-4 py-3 font-medium">Patrocinador</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} className="border-b border-[#F0F1F4] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.nombreCompleto}</div>
                  <div className="text-[#6B7280] text-[12px]">{u.correo}</div>
                </td>
                <td className="px-4 py-3">{u.pais || '—'}</td>
                <td className="px-4 py-3">
                  {u.suscripcion ? SUSCRIPCION_LABELS[u.suscripcion] ?? u.suscripcion : '—'}
                </td>
                <td className="px-4 py-3">{u.patrocinador || '—'}</td>
                <td className="px-4 py-3">{STATUS_LABELS[u.status] ?? u.status}</td>
                <td className="px-4 py-3">
                  {u.rol === 'ADMINISTRADOR' ? (
                    <span className="text-[#6B7280] text-[12px]">—</span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <button
                        disabled={procesandoId === u.id || u.status === 'INACTIVA'}
                        onClick={() => marcarInactivo(u)}
                        className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 disabled:opacity-30 whitespace-nowrap"
                      >
                        {u.status === 'INACTIVA' ? 'Ya está inactivo' : 'Marcar inactivo (no renovó)'}
                      </button>
                      <button
                        disabled={procesandoId === u.id}
                        onClick={() => enviarAlFondo(u)}
                        className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-[#E4E7EE] disabled:opacity-30 whitespace-nowrap"
                      >
                        Comprimir y enviar al fondo
                      </button>
                      <button
                        disabled={procesandoId === u.id}
                        onClick={() => eliminarDefinitivo(u)}
                        className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-red-300 text-red-600 disabled:opacity-30 whitespace-nowrap"
                      >
                        Eliminar definitivo + comprimir
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtrados.length === 0 && (
          <p className="text-[13px] text-[#6B7280] p-6">No se encontraron usuarios.</p>
        )}
      </div>

      <p className="text-[11px] text-[#6B7280] bg-[#F4F6FB] rounded-xl p-3 mt-4">
        Estas son las mismas 3 acciones disponibles al seleccionar a alguien en el árbol de Red
        de Usuarios. "Marcar inactivo" conserva su posición. "Eliminar definitivo" saca a la
        persona del árbol para siempre. "Comprimir y enviar al fondo" libera su posición y la
        reinserta al final de la red de quien la invitó originalmente. En ambos casos de
        eliminación, la compresión sigue solo la rama izquierda — nadie más pierde su lugar.
      </p>
    </div>
  );
}
