'use client';

import { useEffect, useState } from 'react';
import LoadingLogo from './LoadingLogo';
import AdminTabs from './AdminTabs';

interface Espacio {
  id: string;
  numero: number;
  inviteLink: string;
  status: 'VACIO' | 'INVITADO' | 'OCUPADO';
  usuario: { id: string; nombre: string; apellido: string; correo: string; status: string } | null;
}

function enlaceCompleto(token: string) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.machtiaeducacion.com';
  return `${base}/invitacion-profesor/${token}`;
}

function BotonCopiar({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(enlaceCompleto(token)).catch(() => {});
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
      }}
      className="text-[12px] font-semibold text-cm-primary border border-cm-primary/30 rounded-md px-3 py-1.5 shrink-0"
    >
      {copiado ? 'Copiado ✓' : 'Copiar enlace'}
    </button>
  );
}

const ETIQUETA_USUARIO: Record<string, string> = {
  PENDIENTE_APROBACION: 'Pendiente de autorizar',
  ACTIVA: 'Autorizado',
  INACTIVA: 'Inactivo',
};

interface CursoProfesor {
  id: string;
  titulo: string;
  activo: boolean;
  borrador: boolean;
  ocultoPorAdmin: boolean;
  autor: { nombre: string; apellido: string } | null;
  _count: { inscripciones: number };
}

/** Cursos creados por profesores: el administrador puede ocultarlos o volver a mostrarlos. */
function CursosDeProfesores() {
  const [cursos, setCursos] = useState<CursoProfesor[] | null>(null);
  const [error, setError] = useState('');

  async function cargar() {
    try {
      const res = await fetch('/api/admin/cursos-profesores');
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudieron cargar los cursos');
      setCursos(data.cursos);
    } catch {
      setError('Error de conexión');
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  async function cambiar(c: CursoProfesor, oculto: boolean) {
    setError('');
    const res = await fetch(`/api/admin/cursos-profesores/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oculto }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || 'No se pudo actualizar el curso');
    await cargar();
  }

  return (
    <section aria-label="Cursos de profesores" className="mt-10">
      <h2 className="text-[17px] font-semibold mb-1">Cursos de profesores</h2>
      <p className="text-[#6B7280] text-[13px] mb-4 max-w-2xl">
        Aquí puedes ocultar un curso (deja de verse en Cursos) o volver a mostrarlo.
      </p>
      {error && <p className="text-red-600 text-[13px] mb-2">{error}</p>}
      {cursos && cursos.length === 0 && (
        <p className="text-[13px] text-[#6B7280]">Todavía no hay cursos creados por profesores.</p>
      )}
      <div className="flex flex-col gap-2.5">
        {(cursos ?? []).map((c) => (
          <div key={c.id} className="bg-white border border-[#E4E7EE] rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="text-[13.5px] font-semibold">{c.titulo}</div>
              <div className="text-[12px] text-[#6B7280]">
                {c.autor ? `${c.autor.nombre} ${c.autor.apellido}` : 'Sin autor'} · {c._count.inscripciones} alumno
                {c._count.inscripciones !== 1 ? 's' : ''} ·{' '}
                {c.ocultoPorAdmin ? 'Oculto' : c.borrador ? 'Borrador' : 'Publicado'}
              </div>
            </div>
            <button
              onClick={() => cambiar(c, !c.ocultoPorAdmin)}
              className={`text-[12px] font-semibold rounded-md px-3 py-1.5 border ${
                c.ocultoPorAdmin ? 'border-emerald-300 text-emerald-700' : 'border-amber-300 text-amber-700'
              }`}
            >
              {c.ocultoPorAdmin ? 'Volver a mostrar' : 'Ocultar curso'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminProfesores() {
  const [espacios, setEspacios] = useState<Espacio[] | null>(null);
  const [maximo, setMaximo] = useState(400);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  async function cargar() {
    setError('');
    try {
      const res = await fetch('/api/admin/profesores');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar');
        return;
      }
      setEspacios(data.espacios);
      setMaximo(data.maximo ?? 400);
    } catch {
      setError('Error de conexión');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    setProcesando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/profesores', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'No se pudo crear el espacio');
      await cargar();
    } catch {
      setError('Error de conexión');
    } finally {
      setProcesando(false);
    }
  }

  async function eliminar(e: Espacio) {
    if (!window.confirm(`¿Eliminar el espacio ${e.numero}? Su enlace dejará de funcionar.`)) return;
    setProcesando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/profesores/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: e.id }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'No se pudo eliminar');
      await cargar();
    } catch {
      setError('Error de conexión');
    } finally {
      setProcesando(false);
    }
  }

  if (!espacios && !error) {
    return <LoadingLogo label="Cargando espacios..." fullScreen />;
  }

  const total = espacios?.length ?? 0;
  const ocupados = espacios?.filter((e) => e.status === 'OCUPADO').length ?? 0;
  const lleno = total >= maximo;

  return (
    <div className="p-6 sm:p-8">
      <AdminTabs />
      <h1 className="text-[22px] font-semibold mb-1">Profesores/Facilitadores</h1>
      <p className="text-[#6B7280] text-[14px] mb-6 max-w-2xl">
        Crea un espacio cuando lo necesites (hasta {maximo}). Cada espacio tiene su propio enlace de
        invitación: compártelo con el profesor, él se registra y tú solo lo autorizas desde
        &quot;Aprobar registros&quot;. Los profesores no forman parte de la Red ni generan regalías.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[13px]">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#E4E7EE] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="text-[13px] font-semibold">
            {total} de {maximo} espacios creados
          </div>
          <div className="text-[12px] text-[#6B7280]">
            {ocupados} ocupado{ocupados !== 1 ? 's' : ''} · {total - ocupados} disponible
            {total - ocupados !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={crear}
          disabled={procesando || lleno}
          className="bg-cm-primary text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50"
        >
          {lleno ? 'Límite alcanzado' : 'Crear nuevo espacio'}
        </button>
      </div>

      {total === 0 ? (
        <p className="text-[13px] text-[#6B7280]">
          Todavía no hay espacios. Toca &quot;Crear nuevo espacio&quot; para generar el primer enlace.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {espacios!.map((e) => (
            <div
              key={e.id}
              className="bg-white border border-[#E4E7EE] rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
            >
              <div className="w-20 shrink-0">
                <div className="text-[13px] font-semibold">Espacio {e.numero}</div>
                <span
                  className={`inline-block mt-0.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    e.status === 'OCUPADO'
                      ? 'bg-cm-primary border-cm-primary text-white'
                      : 'bg-amber-50 border-amber-300 text-amber-700'
                  }`}
                >
                  {e.status === 'OCUPADO' ? 'Ocupado' : 'Disponible'}
                </span>
              </div>

              <div className="flex-1 min-w-[220px]">
                {e.usuario ? (
                  <div className="text-[13px]">
                    <b>
                      {e.usuario.nombre} {e.usuario.apellido}
                    </b>
                    <div className="text-[#6B7280]">
                      {e.usuario.correo} · {ETIQUETA_USUARIO[e.usuario.status] ?? e.usuario.status}
                    </div>
                  </div>
                ) : (
                  <div className="text-[12px] bg-[#F4F6FB] rounded-lg px-3 py-2 break-all">
                    {enlaceCompleto(e.inviteLink)}
                  </div>
                )}
              </div>

              {!e.usuario && (
                <div className="flex items-center gap-2">
                  <BotonCopiar token={e.inviteLink} />
                  <button
                    onClick={() => eliminar(e)}
                    disabled={procesando}
                    className="text-[12px] font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CursosDeProfesores />
    </div>
  );
}
