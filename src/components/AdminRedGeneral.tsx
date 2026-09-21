'use client';

import { useEffect, useMemo, useState } from 'react';
import LoadingLogo from './LoadingLogo';

const MAX_NIVEL_RESTRINGIDO = 8;

interface SlotUsuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  pais: string | null;
  linkInvitacion: string;
}

interface Slot {
  id: string;
  nivel: number;
  posicion: number;
  status: 'VACIO' | 'INVITADO' | 'OCUPADO';
  inviteLink: string | null;
  usuario: SlotUsuario | null;
}

const STATUS_LABEL: Record<Slot['status'], string> = {
  VACIO: 'Vacío',
  INVITADO: 'Invitación enviada',
  OCUPADO: 'Ocupado',
};

const STATUS_COLOR: Record<Slot['status'], string> = {
  VACIO: 'bg-white border-dashed border-[#D8DCE6] text-[#B8BCC8]',
  INVITADO: 'bg-amber-50 border-amber-300 text-amber-700',
  OCUPADO: 'bg-cm-primary border-cm-primary text-white',
};

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="text-[11px] font-semibold text-cm-primary border border-cm-primary/30 rounded-md px-2 py-1"
    >
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export default function AdminRedGeneral() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState('');
  const [nivelAbierto, setNivelAbierto] = useState<number>(1);
  const [slotSeleccionadoId, setSlotSeleccionadoId] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function cargar() {
    setError('');
    try {
      const res = await fetch('/api/admin/red-general');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar');
        return;
      }
      setSlots(data.slots);
    } catch {
      setError('Error de conexión');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const resumenPorNivel = useMemo(() => {
    if (!slots) return [];
    const porNivel: Record<number, Slot[]> = {};
    for (const s of slots) {
      (porNivel[s.nivel] ??= []).push(s);
    }
    return Object.entries(porNivel).map(([nivel, fila]) => ({
      nivel: Number(nivel),
      total: fila.length,
      vacios: fila.filter((s) => s.status === 'VACIO').length,
      ocupados: fila.filter((s) => s.status === 'OCUPADO').length,
    }));
  }, [slots]);

  const filaAbierta = slots?.filter((s) => s.nivel === nivelAbierto) ?? [];
  const slotSeleccionado = slots?.find((s) => s.id === slotSeleccionadoId) ?? null;

  async function accion(url: string, body: object) {
    setProcesando(true);
    setError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo completar la acción');
        return false;
      }
      await cargar();
      return true;
    } catch {
      setError('Error de conexión');
      return false;
    } finally {
      setProcesando(false);
    }
  }

  async function handleGenerarLink(slot: Slot) {
    await accion('/api/admin/red-general/generar-link', { slotId: slot.id });
  }
  async function handleResetear(slot: Slot) {
    await accion('/api/admin/red-general/resetear', { slotId: slot.id });
  }
  async function handleEliminar(slot: Slot) {
    const ok = window.confirm(
      '¿Liberar este espacio? Sus datos actuales se borran y el espacio vuelve a quedar disponible para generar una nueva invitación — su posición en el árbol de la Red General se conserva.'
    );
    if (!ok) return;
    await accion('/api/admin/red-general/eliminar', { slotId: slot.id });
    setSlotSeleccionadoId(null);
  }

  if (!slots && !error) {
    return <LoadingLogo label="Cargando espacios..." fullScreen />;
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-[22px] font-semibold mb-1">Red General · Panel de Administrador</h1>
      <p className="text-[#6B7280] text-[14px] mb-6 max-w-2xl">
        Los primeros {MAX_NIVEL_RESTRINGIDO} niveles de la Red General están restringidos: cada
        espacio se llena únicamente generando un link de invitación específico desde aquí. A
        partir de que una persona ocupa un espacio, su propia red hacia abajo funciona con el
        sistema normal de invitación libre.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[13px]">
          {error}
        </div>
      )}

      {slots && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          {/* ---------- Columna izquierda: niveles + slots ---------- */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {resumenPorNivel.map((r) => (
                <button
                  key={r.nivel}
                  onClick={() => {
                    setNivelAbierto(r.nivel);
                    setSlotSeleccionadoId(null);
                  }}
                  className={`text-left bg-white border rounded-xl p-3 transition-colors ${
                    nivelAbierto === r.nivel ? 'border-cm-primary ring-1 ring-cm-primary' : 'border-[#E4E7EE]'
                  }`}
                >
                  <div className="text-[13px] font-semibold mb-1">Nivel {r.nivel}</div>
                  <div className="text-[11px] text-[#6B7280]">
                    {r.total} espacios / {r.vacios} vacío
                  </div>
                  <div className="text-[11px] text-cm-primary font-medium mt-0.5">
                    {r.ocupados} ocupado{r.ocupados !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>

            {filaAbierta.length > 0 && (
              <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5">
                <h2 className="text-[14px] font-semibold mb-4">
                  Nivel {nivelAbierto} — {filaAbierta.length} espacios
                </h2>
                <div className="flex flex-wrap gap-2">
                  {filaAbierta.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSlotSeleccionadoId(slot.id)}
                      className={`px-3 py-2 rounded-lg border-2 text-[12px] font-medium whitespace-nowrap ${
                        STATUS_COLOR[slot.status]
                      } ${slotSeleccionadoId === slot.id ? 'ring-2 ring-cm-accent' : ''}`}
                    >
                      Espacio {slot.posicion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---------- Columna derecha: detalle del slot ---------- */}
          <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5 h-fit sticky top-6">
            {!slotSeleccionado ? (
              <p className="text-[12px] text-[#6B7280]">
                Selecciona un espacio de la lista para ver sus detalles y acciones.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[14px] font-semibold">
                    Nivel {slotSeleccionado.nivel} · Espacio {slotSeleccionado.posicion}
                  </h2>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_COLOR[slotSeleccionado.status]}`}
                  >
                    {STATUS_LABEL[slotSeleccionado.status]}
                  </span>
                </div>

                {slotSeleccionado.status === 'VACIO' && (
                  <div className="mt-4">
                    <p className="text-[12px] text-[#6B7280] mb-3">
                      Este espacio aún no tiene invitación. Genera un link específico para llenarlo.
                    </p>
                    <button
                      disabled={procesando}
                      onClick={() => handleGenerarLink(slotSeleccionado)}
                      className="w-full bg-cm-primary text-white text-[13px] font-semibold py-2.5 rounded-lg disabled:opacity-50"
                    >
                      Generar link de invitación
                    </button>
                  </div>
                )}

                {slotSeleccionado.status === 'INVITADO' && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
                        Link de invitación
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-[12px] bg-[#F4F6FB] rounded-lg px-3 py-2 truncate">
                          machtiaeducacion.com/invitacion-restringida/{slotSeleccionado.inviteLink}
                        </div>
                        <CopyBtn
                          value={`machtiaeducacion.com/invitacion-restringida/${slotSeleccionado.inviteLink}`}
                        />
                      </div>
                    </div>

                    <p className="text-[12px] text-[#6B7280]">
                      Comparte este link con la persona. Ella hace su propio registro (igual que
                      cualquier usuario), eligiendo entre Socio Fundador, Asociado, Profesor
                      Facilitador o Asistente Administrativo. Cuando termine, este espacio va a
                      pasar a &quot;Ocupado&quot; solo, y su registro va a aparecer en el Panel de
                      Aprobaciones para que lo revises como cualquier otro.
                    </p>

                    <button
                      disabled={procesando}
                      onClick={() => handleResetear(slotSeleccionado)}
                      className="text-[12px] font-semibold border border-amber-300 text-amber-700 rounded-lg py-2 disabled:opacity-50"
                    >
                      Resetear invitación
                    </button>
                  </div>
                )}

                {slotSeleccionado.status === 'OCUPADO' && slotSeleccionado.usuario && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="text-[13px] space-y-1">
                      <p><b>{slotSeleccionado.usuario.nombre} {slotSeleccionado.usuario.apellido}</b></p>
                      <p className="text-[#6B7280]">{slotSeleccionado.usuario.correo}</p>
                      <p className="text-[#6B7280]">{slotSeleccionado.usuario.telefono} · {slotSeleccionado.usuario.pais}</p>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
                        Su link de invitación
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-[12px] bg-[#F4F6FB] rounded-lg px-3 py-2 truncate">
                          machtiaeducacion.com/invitacion/{slotSeleccionado.usuario.linkInvitacion}
                        </div>
                        <CopyBtn value={`machtiaeducacion.com/invitacion/${slotSeleccionado.usuario.linkInvitacion}`} />
                      </div>
                    </div>

                    <button
                      disabled={procesando}
                      onClick={() => handleEliminar(slotSeleccionado)}
                      className="text-[12px] font-semibold border border-red-300 text-red-600 rounded-lg py-2 mt-1 disabled:opacity-50"
                    >
                      Liberar este espacio
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
