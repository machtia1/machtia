'use client';

import { useEffect, useState } from 'react';

interface Nodo {
  id: string;
  nombre: string;
  apellido: string;
  status: string;
  ladoEnPadre: 'IZQUIERDA' | 'DERECHA' | null;
}

interface Raiz {
  id: string;
  nombre: string;
  apellido: string;
  status: string;
}

interface DatosRed {
  raiz: Raiz;
  niveles: (Nodo | null)[][];
  total: number;
  activos: number;
  esAdministrador: boolean;
}

const NODE_COLORS: Record<string, string> = {
  ACTIVA: 'bg-cm-primary text-white border-cm-primary',
  INACTIVA: 'bg-amber-100 text-amber-700 border-amber-300',
  PENDIENTE_APROBACION: 'bg-amber-100 text-amber-700 border-amber-300',
  PENDIENTE_CONFIRMACION: 'bg-amber-100 text-amber-700 border-amber-300',
  RECHAZADA: 'bg-red-100 text-red-700 border-red-300',
};

export default function RedUsuarios() {
  const [datos, setDatos] = useState<DatosRed | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seleccionado, setSeleccionado] = useState<Nodo | Raiz | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function cargar() {
    setError('');
    try {
      const res = await fetch('/api/red/mi-red');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar tu red');
        return;
      }
      setDatos(data);
    } catch {
      setError('Error de conexión');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarInactivo() {
    if (!seleccionado || !datos || seleccionado.id === datos.raiz.id) return;
    setProcesando(true);
    try {
      const res = await fetch('/api/admin/red/marcar-inactivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: seleccionado.id }),
      });
      if (res.ok) {
        setSeleccionado(null);
        await cargar();
      }
    } finally {
      setProcesando(false);
    }
  }

  async function eliminarDefinitivo() {
    if (!seleccionado || !datos || seleccionado.id === datos.raiz.id) return;
    const ok = window.confirm(
      `¿Eliminar definitivamente a ${seleccionado.nombre}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setProcesando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/red/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: seleccionado.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo eliminar');
        return;
      }
      setSeleccionado(null);
      await cargar();
    } finally {
      setProcesando(false);
    }
  }

  async function enviarAlFondo() {
    if (!seleccionado || !datos || seleccionado.id === datos.raiz.id) return;
    const ok = window.confirm(
      `¿Enviar a ${seleccionado.nombre} al fondo de su red original? Su posición actual se libera y se reinserta al final.`
    );
    if (!ok) return;
    setProcesando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/red/enviar-al-fondo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: seleccionado.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar al fondo');
        return;
      }
      setSeleccionado(null);
      await cargar();
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return <div className="p-8 text-[14px] text-[#6B7280]">Cargando tu red...</div>;
  }

  if (error || !datos) {
    return <div className="p-8 text-[14px] text-red-600">{error || 'No se pudo cargar la red'}</div>;
  }

  const nodoSeleccionadoEsRaiz = seleccionado?.id === datos.raiz.id;
  const statusSeleccionado = seleccionado
    ? ('status' in seleccionado ? seleccionado.status : 'ACTIVA')
    : null;

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-[22px] font-semibold mb-1">Red de Usuarios · Árbol binario 2x15</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Tu red se llena por invitación: izquierda a derecha, nivel por nivel, hasta 15 niveles de
        profundidad.
      </p>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* ---------- Árbol ---------- */}
        <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5 overflow-x-auto">
          <div className="flex items-center gap-4 mb-5 text-[12px] text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cm-primary inline-block" /> Activo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-300 inline-block" /> Inactivo / pendiente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-dashed border-[#B8BCC8] inline-block" /> Vacante
            </span>
          </div>

          <div className="flex flex-col items-center gap-8 min-w-max pb-2">
            <button
              onClick={() => setSeleccionado(datos.raiz)}
              className={`px-4 py-2 rounded-xl border-2 text-[13px] font-semibold ${
                seleccionado?.id === datos.raiz.id ? 'ring-2 ring-cm-accent' : ''
              } ${NODE_COLORS[datos.raiz.status] ?? NODE_COLORS.ACTIVA}`}
            >
              {datos.raiz.nombre} · Tú
            </button>

            {datos.niveles.map((fila, i) => (
              <div key={i} className="flex items-center gap-3">
                {fila.map((nodo, j) =>
                  nodo ? (
                    <button
                      key={nodo.id}
                      onClick={() => setSeleccionado(nodo)}
                      className={`px-3 py-1.5 rounded-lg border-2 text-[12px] font-medium whitespace-nowrap ${
                        seleccionado?.id === nodo.id ? 'ring-2 ring-cm-accent' : ''
                      } ${NODE_COLORS[nodo.status] ?? NODE_COLORS.ACTIVA}`}
                    >
                      {nodo.nombre}
                    </button>
                  ) : (
                    <div
                      key={j}
                      className="w-[70px] h-[30px] rounded-lg border-2 bg-white border-dashed border-[#D8DCE6]"
                    />
                  )
                )}
              </div>
            ))}

            {datos.niveles.length === 0 && (
              <p className="text-[13px] text-[#6B7280]">
                Todavía no tienes a nadie en tu red — comparte tu link de invitación para empezar.
              </p>
            )}
          </div>
        </div>

        {/* ---------- Panel de control ---------- */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-4">
            <h2 className="text-[13px] font-semibold mb-3">Estado de la red</h2>
            <div className="flex justify-between text-[13px] py-1">
              <span className="text-[#6B7280]">Activos</span>
              <span className="font-semibold">{datos.activos}</span>
            </div>
            <div className="flex justify-between text-[13px] py-1">
              <span className="text-[#6B7280]">Total (incl. inactivos)</span>
              <span className="font-semibold">{datos.total}</span>
            </div>
          </div>

          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-4">
            <h2 className="text-[13px] font-semibold mb-1">Nodo seleccionado</h2>
            {seleccionado ? (
              <>
                <p className="text-[13px] mb-3">
                  <b>
                    {seleccionado.nombre} {'apellido' in seleccionado ? seleccionado.apellido : ''}
                  </b>
                  {' · '}
                  <span className={statusSeleccionado === 'ACTIVA' ? 'text-cm-primary' : 'text-amber-600'}>
                    {statusSeleccionado}
                  </span>
                  {nodoSeleccionadoEsRaiz && <span className="text-[#6B7280]"> (tú, no editable)</span>}
                </p>
                {datos.esAdministrador && !nodoSeleccionadoEsRaiz && (
                  <div className="flex flex-col gap-2">
                    <button
                      disabled={procesando || statusSeleccionado === 'INACTIVA'}
                      onClick={marcarInactivo}
                      className="w-full text-[12px] font-semibold px-3 py-2 rounded-lg border border-amber-300 text-amber-700 disabled:opacity-30"
                    >
                      {statusSeleccionado === 'INACTIVA' ? 'Ya está inactivo' : 'Marcar inactivo (no renovó)'}
                    </button>
                    <button
                      disabled={procesando}
                      onClick={enviarAlFondo}
                      className="w-full text-[12px] font-semibold px-3 py-2 rounded-lg border border-[#E4E7EE] disabled:opacity-30"
                    >
                      Comprimir y enviar al fondo
                    </button>
                    <button
                      disabled={procesando}
                      onClick={eliminarDefinitivo}
                      className="w-full text-[12px] font-semibold px-3 py-2 rounded-lg border border-red-300 text-red-600 disabled:opacity-30"
                    >
                      Eliminar definitivo + comprimir
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[12px] text-[#6B7280]">Selecciona un nodo del árbol.</p>
            )}
          </div>

          {datos.esAdministrador && (
            <p className="text-[11px] text-[#6B7280] bg-[#F4F6FB] rounded-xl p-3">
              "Eliminar" saca a la persona del árbol para siempre. "Comprimir y enviar al fondo"
              libera su posición y la reinserta al final de la red de quien la invitó
              originalmente. En ambos casos, la compresión sigue solo la rama izquierda —
              nadie más pierde su lugar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
