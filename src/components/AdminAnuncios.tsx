'use client';

import { useEffect, useState } from 'react';

interface Anuncio {
  id: string;
  etiqueta: string;
  texto: string;
  activo: boolean;
  creadoEn: string;
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminAnuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[] | null>(null);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // Formulario de "nuevo anuncio"
  const [etiquetaNueva, setEtiquetaNueva] = useState('');
  const [textoNuevo, setTextoNuevo] = useState('');
  const [creando, setCreando] = useState(false);

  // Edición en línea
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [etiquetaEdit, setEtiquetaEdit] = useState('');
  const [textoEdit, setTextoEdit] = useState('');

  async function cargar() {
    setError('');
    try {
      const res = await fetch('/api/admin/anuncios');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar la lista de anuncios');
        return;
      }
      setAnuncios(data.anuncios);
    } catch {
      setError('Error de conexión');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crearAnuncio(e: React.FormEvent) {
    e.preventDefault();
    if (!etiquetaNueva.trim() || !textoNuevo.trim()) return;
    setCreando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/anuncios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etiqueta: etiquetaNueva, texto: textoNuevo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo crear el anuncio');
        return;
      }
      setEtiquetaNueva('');
      setTextoNuevo('');
      await cargar();
    } finally {
      setCreando(false);
    }
  }

  function empezarEdicion(a: Anuncio) {
    setEditandoId(a.id);
    setEtiquetaEdit(a.etiqueta);
    setTextoEdit(a.texto);
  }

  async function guardarEdicion(id: string) {
    if (!etiquetaEdit.trim() || !textoEdit.trim()) return;
    setProcesandoId(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/anuncios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etiqueta: etiquetaEdit, texto: textoEdit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo guardar el cambio');
        return;
      }
      setEditandoId(null);
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  }

  async function alternarActivo(a: Anuncio) {
    setProcesandoId(a.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/anuncios/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !a.activo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar');
        return;
      }
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminarAnuncio(a: Anuncio) {
    const ok = window.confirm(`¿Eliminar el anuncio "${a.etiqueta}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    setProcesandoId(a.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/anuncios/${a.id}`, { method: 'DELETE' });
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

  if (!anuncios && !error) {
    return <div className="p-8 text-[14px] text-[#6B7280]">Cargando anuncios...</div>;
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <h1 className="text-[22px] font-semibold mb-1">Anuncios y avisos</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Lo que publiques aquí aparece en la sección "Anuncios y avisos" del Dashboard de todos los
        usuarios. Un anuncio desactivado deja de mostrarse pero no se borra.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[13px]">
          {error}
        </div>
      )}

      <form
        onSubmit={crearAnuncio}
        className="bg-white border border-[#E4E7EE] rounded-2xl p-5 mb-6 flex flex-col gap-3"
      >
        <h2 className="text-[14px] font-semibold">Nuevo anuncio</h2>
        <input
          type="text"
          placeholder="Etiqueta (ej. Lanzamiento, Cursos, Plataforma)"
          value={etiquetaNueva}
          onChange={(e) => setEtiquetaNueva(e.target.value)}
          maxLength={40}
          className="px-3 py-2 rounded-lg border border-[#E4E7EE] text-[13px]"
        />
        <textarea
          placeholder="Texto del anuncio"
          value={textoNuevo}
          onChange={(e) => setTextoNuevo(e.target.value)}
          rows={3}
          className="px-3 py-2 rounded-lg border border-[#E4E7EE] text-[13px] resize-none"
        />
        <button
          type="submit"
          disabled={creando || !etiquetaNueva.trim() || !textoNuevo.trim()}
          className="self-start bg-cm-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {creando ? 'Publicando...' : 'Publicar anuncio'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {(anuncios ?? []).map((a) => (
          <div key={a.id} className="bg-white border border-[#E4E7EE] rounded-2xl p-5">
            {editandoId === a.id ? (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={etiquetaEdit}
                  onChange={(e) => setEtiquetaEdit(e.target.value)}
                  maxLength={40}
                  className="px-3 py-2 rounded-lg border border-[#E4E7EE] text-[13px]"
                />
                <textarea
                  value={textoEdit}
                  onChange={(e) => setTextoEdit(e.target.value)}
                  rows={3}
                  className="px-3 py-2 rounded-lg border border-[#E4E7EE] text-[13px] resize-none"
                />
                <div className="flex gap-2">
                  <button
                    disabled={procesandoId === a.id}
                    onClick={() => guardarEdicion(a.id)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-cm-primary text-white disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#E4E7EE]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block text-[11px] font-bold text-cm-primary bg-[#ECECFF] px-2 py-0.5 rounded-full mb-1.5">
                      {a.etiqueta}
                    </span>
                    <div className="text-[13px]">{a.texto}</div>
                    <div className="text-[11px] text-[#6B7280] mt-1">
                      {formatearFecha(a.creadoEn)} · {a.activo ? 'Visible' : 'Desactivado'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => empezarEdicion(a)}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-[#E4E7EE]"
                  >
                    Editar
                  </button>
                  <button
                    disabled={procesandoId === a.id}
                    onClick={() => alternarActivo(a)}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 disabled:opacity-30"
                  >
                    {a.activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                  <button
                    disabled={procesandoId === a.id}
                    onClick={() => eliminarAnuncio(a)}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-red-300 text-red-600 disabled:opacity-30"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {(anuncios ?? []).length === 0 && (
          <p className="text-[13px] text-[#6B7280] bg-white border border-[#E4E7EE] rounded-2xl p-6">
            Todavía no has publicado ningún anuncio.
          </p>
        )}
      </div>
    </div>
  );
}
