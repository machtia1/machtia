'use client';

import { useEffect, useState } from 'react';

interface Nodo {
  id: string;
  nombre: string;
  apellido: string;
  status: string;
  ladoEnPadre: 'IZQUIERDA' | 'DERECHA' | null;
  reservado: boolean;
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

/** Círculo de avatar: color de fondo + color de anillo según status. */
const AVATAR_COLORS: Record<string, string> = {
  ACTIVA: 'bg-cm-primary text-white ring-cm-primary',
  INACTIVA: 'bg-amber-100 text-amber-700 ring-amber-300',
  PENDIENTE_APROBACION: 'bg-amber-100 text-amber-700 ring-amber-300',
  PENDIENTE_CONFIRMACION: 'bg-amber-100 text-amber-700 ring-amber-300',
  RECHAZADA: 'bg-red-100 text-red-700 ring-red-300',
};

/** Cuántas tarjetas se muestran por nivel antes de pedir "Ver los demás"
 * (los niveles 1-8 de la Red General pueden tener hasta 256 espacios). */
const LIMITE_INICIAL_POR_NIVEL = 40;

function iniciales(nombre: string, apellido?: string): string {
  const a = (nombre || '?').trim().charAt(0);
  const b = (apellido || '').trim().charAt(0);
  return (a + b).toUpperCase() || '?';
}

function NodoTarjeta({
  nombre,
  apellido,
  status,
  reservado,
  seleccionado,
  onClick,
}: {
  nombre: string;
  apellido?: string;
  status: string;
  reservado?: boolean;
  seleccionado: boolean;
  onClick: () => void;
}) {
  const colorAvatar = reservado ? 'bg-[#EDEEF2] text-[#9297A6] ring-[#D8DCE6]' : AVATAR_COLORS[status] ?? AVATAR_COLORS.ACTIVA;

  return (
    <button
      onClick={onClick}
      title={reservado ? 'Espacio reservado — todavía nadie lo ha reclamado' : `${nombre} ${apellido ?? ''}`.trim()}
      className={`flex flex-col items-center gap-1 w-[68px] shrink-0 rounded-xl px-1.5 py-2 transition-colors ${
        seleccionado ? 'bg-[#F0F1FF] ring-1 ring-cm-accent' : 'hover:bg-[#F4F6FB]'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold ring-2 ${colorAvatar}`}
      >
        {reservado ? '🔒' : iniciales(nombre, apellido)}
      </div>
      <span
        className={`text-[10.5px] leading-tight text-center line-clamp-2 ${
          reservado ? 'text-[#9297A6] italic' : 'text-[#1C1E2B] font-medium'
        }`}
      >
        {reservado ? 'Reservado' : nombre}
      </span>
    </button>
  );
}

export default function RedUsuarios() {
  const [datos, setDatos] = useState<DatosRed | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seleccionado, setSeleccionado] = useState<Nodo | Raiz | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [nivelesExpandidos, setNivelesExpandidos] = useState<Set<number>>(new Set());

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
    if ('reservado' in seleccionado && seleccionado.reservado) return;
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
    if ('reservado' in seleccionado && seleccionado.reservado) return;
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
    if ('reservado' in seleccionado && seleccionado.reservado) return;
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
  const seleccionadoReservado =
    !!seleccionado && 'reservado' in seleccionado && (seleccionado as Nodo).reservado;
  const hayReservadosEnVista = datos.niveles.some((fila) => fila.some((n) => n?.reservado));

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-[22px] font-semibold mb-1">Red de Usuarios · Árbol binario 2x15</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Tu red se llena por invitación: izquierda a derecha, nivel por nivel, hasta 15 niveles de
        profundidad.
      </p>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* ---------- Árbol ---------- */}
        <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-4 mb-5 text-[12px] text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cm-primary inline-block" /> Activo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-300 inline-block" /> Inactivo / pendiente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-dashed border-[#B8BCC8] inline-block" /> Vacante
            </span>
            {hayReservadosEnVista && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EDEEF2] border border-[#D8DCE6] inline-block" /> Reservado (sin reclamar)
              </span>
            )}
          </div>

          {/* Tu propio nodo, destacado arriba de todos los niveles */}
          <div className="flex justify-center pb-6 mb-6 border-b border-[#F0F1F4]">
            <button
              onClick={() => setSeleccionado(datos.raiz)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-colors ${
                seleccionado?.id === datos.raiz.id ? 'bg-[#F0F1FF] ring-1 ring-cm-accent' : 'hover:bg-[#F4F6FB]'
              }`}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-[15px] font-bold bg-gradient-to-br from-cm-primary to-cm-accent text-white ring-2 ring-cm-primary shadow-sm">
                {iniciales(datos.raiz.nombre, datos.raiz.apellido)}
              </div>
              <span className="text-[13px] font-semibold">{datos.raiz.nombre} · Tú</span>
            </button>
          </div>

          {/* Niveles, cada uno con salto de línea automático — nunca se
              desborda de la pantalla, sin importar cuántos espacios tenga
              (los niveles 1-8 de la Red General llegan hasta 256). */}
          <div className="flex flex-col gap-6">
            {datos.niveles.map((fila, i) => {
              if (fila.every((n) => n === null)) return null;

              const expandido = nivelesExpandidos.has(i);
              const itemsAMostrar = expandido ? fila : fila.slice(0, LIMITE_INICIAL_POR_NIVEL);
              const ocultos = fila.length - itemsAMostrar.length;
              const reservadosEnFila = fila.filter((n) => n?.reservado).length;
              const vacantesEnFila = fila.filter((n) => n === null).length;

              return (
                <div key={i}>
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide">
                      Nivel {i + 1}
                    </h3>
                    <span className="text-[11px] text-[#B8BCC8]">
                      {fila.length} espacio{fila.length !== 1 ? 's' : ''}
                      {reservadosEnFila > 0 ? ` · ${reservadosEnFila} sin reclamar` : ''}
                      {vacantesEnFila > 0 ? ` · ${vacantesEnFila} vacante${vacantesEnFila !== 1 ? 's' : ''}` : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-1 gap-y-2">
                    {itemsAMostrar.map((nodo, j) =>
                      nodo ? (
                        <NodoTarjeta
                          key={nodo.id}
                          nombre={nodo.nombre}
                          apellido={nodo.apellido}
                          status={nodo.status}
                          reservado={nodo.reservado}
                          seleccionado={seleccionado?.id === nodo.id}
                          onClick={() => setSeleccionado(nodo)}
                        />
                      ) : (
                        <div
                          key={`vacante-${i}-${j}`}
                          title="Espacio vacante — comparte tu link de invitación para llenarlo"
                          className="flex flex-col items-center gap-1 w-[68px] shrink-0 rounded-xl px-1.5 py-2"
                        >
                          <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#D8DCE6]" />
                          <span className="text-[10.5px] leading-tight text-center text-[#B8BCC8]">Vacante</span>
                        </div>
                      )
                    )}
                  </div>

                  {ocultos > 0 && (
                    <button
                      onClick={() =>
                        setNivelesExpandidos((prev) => new Set(prev).add(i))
                      }
                      className="mt-2 text-[12px] font-semibold text-cm-primary hover:underline"
                    >
                      Ver los {ocultos} restantes
                    </button>
                  )}
                </div>
              );
            })}

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
                {seleccionadoReservado ? (
                  <p className="text-[12px] text-[#6B7280] bg-[#F4F6FB] rounded-lg p-3">
                    Espacio reservado de la Red General — todavía nadie lo ha reclamado. Genera su
                    link de invitación desde el Panel de Administrador (Red General) para llenarlo.
                  </p>
                ) : (
                  datos.esAdministrador &&
                  !nodoSeleccionadoEsRaiz && (
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
                  )
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
