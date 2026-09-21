'use client';

import { useEffect, useState } from 'react';
import LoadingLogo from './LoadingLogo';

interface Anuncio {
  id: string;
  etiqueta: string;
  texto: string;
  activo: boolean;
  creadoEn: string;
  mediaUrl: string | null;
  mediaTipo: 'IMAGEN' | 'VIDEO' | null;
}

interface Notificacion {
  id: string;
  mensaje: string;
  creadoEn: string;
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  return fecha.toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAnuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[] | null>(null);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // Formulario de "nuevo anuncio"
  const [etiquetaNueva, setEtiquetaNueva] = useState('');
  const [textoNuevo, setTextoNuevo] = useState('');
  const [mediaNueva, setMediaNueva] = useState<{ url: string; tipo: 'IMAGEN' | 'VIDEO' } | null>(null);
  const [subiendoMedia, setSubiendoMedia] = useState(false);
  const [creando, setCreando] = useState(false);

  // Edición en línea
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [etiquetaEdit, setEtiquetaEdit] = useState('');
  const [textoEdit, setTextoEdit] = useState('');
  const [mediaEdit, setMediaEdit] = useState<{ url: string; tipo: 'IMAGEN' | 'VIDEO' } | null>(null);
  const [subiendoMediaEdit, setSubiendoMediaEdit] = useState(false);

  // Notificaciones directas
  const [notificaciones, setNotificaciones] = useState<Notificacion[] | null>(null);
  const [mensajeNotificacion, setMensajeNotificacion] = useState('');
  const [enviandoNotificacion, setEnviandoNotificacion] = useState(false);
  const [errorNotificacion, setErrorNotificacion] = useState('');
  const [borrandoNotifId, setBorrandoNotifId] = useState<string | null>(null);

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

  async function cargarNotificaciones() {
    setErrorNotificacion('');
    try {
      const res = await fetch('/api/admin/notificaciones');
      const data = await res.json();
      if (!res.ok) {
        setErrorNotificacion(data.error || 'No se pudo cargar la lista de notificaciones');
        return;
      }
      setNotificaciones(data.notificaciones);
    } catch {
      setErrorNotificacion('Error de conexión');
    }
  }

  useEffect(() => {
    cargar();
    cargarNotificaciones();
  }, []);

  async function subirArchivo(
    e: React.ChangeEvent<HTMLInputElement>,
    aplicar: (media: { url: string; tipo: 'IMAGEN' | 'VIDEO' }) => void,
    setSubiendo: (v: boolean) => void
  ) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      const res = await fetch('/api/admin/anuncios/media', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo subir el archivo');
        return;
      }
      aplicar({ url: data.mediaUrl, tipo: data.mediaTipo });
    } catch {
      setError('Error de conexión al subir el archivo');
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  }

  async function crearAnuncio(e: React.FormEvent) {
    e.preventDefault();
    if (!etiquetaNueva.trim() || !textoNuevo.trim()) return;
    setCreando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/anuncios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etiqueta: etiquetaNueva,
          texto: textoNuevo,
          mediaUrl: mediaNueva?.url,
          mediaTipo: mediaNueva?.tipo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo crear el anuncio');
        return;
      }
      setEtiquetaNueva('');
      setTextoNuevo('');
      setMediaNueva(null);
      await cargar();
    } finally {
      setCreando(false);
    }
  }

  function empezarEdicion(a: Anuncio) {
    setEditandoId(a.id);
    setEtiquetaEdit(a.etiqueta);
    setTextoEdit(a.texto);
    setMediaEdit(a.mediaUrl && a.mediaTipo ? { url: a.mediaUrl, tipo: a.mediaTipo } : null);
  }

  async function guardarEdicion(id: string) {
    if (!etiquetaEdit.trim() || !textoEdit.trim()) return;
    setProcesandoId(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/anuncios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etiqueta: etiquetaEdit,
          texto: textoEdit,
          mediaUrl: mediaEdit?.url ?? null,
          mediaTipo: mediaEdit?.tipo ?? null,
        }),
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

  async function crearNotificacion(e: React.FormEvent) {
    e.preventDefault();
    if (!mensajeNotificacion.trim()) return;
    setEnviandoNotificacion(true);
    setErrorNotificacion('');
    try {
      const res = await fetch('/api/admin/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: mensajeNotificacion }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorNotificacion(data.error || 'No se pudo emitir la notificación');
        return;
      }
      setMensajeNotificacion('');
      await cargarNotificaciones();
    } finally {
      setEnviandoNotificacion(false);
    }
  }

  async function eliminarNotificacion(n: Notificacion) {
    const ok = window.confirm('¿Eliminar esta notificación? Ya no se mostrará a los usuarios.');
    if (!ok) return;
    setBorrandoNotifId(n.id);
    setErrorNotificacion('');
    try {
      const res = await fetch(`/api/admin/notificaciones/${n.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setErrorNotificacion(data.error || 'No se pudo eliminar');
        return;
      }
      await cargarNotificaciones();
    } finally {
      setBorrandoNotifId(null);
    }
  }

  if (!anuncios && !error) {
    return <LoadingLogo label="Cargando anuncios..." fullScreen />;
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

        <div>
          <label className="text-[12px] font-semibold text-[#6B7280] block mb-1.5">
            Imagen o video (opcional)
          </label>
          {mediaNueva ? (
            <div className="flex items-center gap-3">
              {mediaNueva.tipo === 'IMAGEN' ? (
                <img src={mediaNueva.url} alt="" className="w-24 h-24 object-cover rounded-lg border border-[#E4E7EE]" />
              ) : (
                <video src={mediaNueva.url} className="w-24 h-24 object-cover rounded-lg border border-[#E4E7EE]" />
              )}
              <button
                type="button"
                onClick={() => setMediaNueva(null)}
                className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-red-300 text-red-600"
              >
                Quitar
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={(e) => subirArchivo(e, (m) => setMediaNueva(m), setSubiendoMedia)}
                disabled={subiendoMedia}
                className="text-[13px]"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Imagen: máx. 5 MB, JPG/PNG/WEBP (recomendado 1200×630px). Video: máx. 25 MB,
                MP4/WEBM (ideal 15-30 segundos).
              </p>
              {subiendoMedia && <p className="text-[12px] text-cm-primary mt-1">Subiendo...</p>}
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={creando || subiendoMedia || !etiquetaNueva.trim() || !textoNuevo.trim()}
          className="self-start bg-cm-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {creando ? 'Publicando...' : 'Publicar anuncio'}
        </button>
      </form>

      <div className="flex flex-col gap-3 mb-10">
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
                <div>
                  <label className="text-[12px] font-semibold text-[#6B7280] block mb-1.5">
                    Imagen o video (opcional)
                  </label>
                  {mediaEdit ? (
                    <div className="flex items-center gap-3">
                      {mediaEdit.tipo === 'IMAGEN' ? (
                        <img src={mediaEdit.url} alt="" className="w-24 h-24 object-cover rounded-lg border border-[#E4E7EE]" />
                      ) : (
                        <video src={mediaEdit.url} className="w-24 h-24 object-cover rounded-lg border border-[#E4E7EE]" />
                      )}
                      <button
                        type="button"
                        onClick={() => setMediaEdit(null)}
                        className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-red-300 text-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                        onChange={(e) => subirArchivo(e, (m) => setMediaEdit(m), setSubiendoMediaEdit)}
                        disabled={subiendoMediaEdit}
                        className="text-[13px]"
                      />
                      {subiendoMediaEdit && <p className="text-[12px] text-cm-primary mt-1">Subiendo...</p>}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={procesandoId === a.id || subiendoMediaEdit}
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
                  <div className="min-w-0">
                    <span className="inline-block text-[11px] font-bold text-cm-primary bg-[#ECECFF] px-2 py-0.5 rounded-full mb-1.5">
                      {a.etiqueta}
                    </span>
                    <div className="text-[13px] break-words">{a.texto}</div>
                    {a.mediaUrl && a.mediaTipo === 'IMAGEN' && (
                      <img src={a.mediaUrl} alt="" className="mt-2 rounded-lg max-h-[160px] border border-[#E4E7EE]" />
                    )}
                    {a.mediaUrl && a.mediaTipo === 'VIDEO' && (
                      <video src={a.mediaUrl} controls className="mt-2 rounded-lg max-h-[160px] border border-[#E4E7EE]" />
                    )}
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

      {/* Crear notificación — pedido por el cliente el 20 sept 2026 */}
      <h2 className="text-[18px] font-semibold mb-1">Crear notificación</h2>
      <p className="text-[#6B7280] text-[14px] mb-4">
        A diferencia de los anuncios, esto emite un aviso directo que le aparece a todos los
        usuarios en la campanita 🔔 de su Dashboard, con un punto rojo hasta que la abren.
      </p>

      {errorNotificacion && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[13px]">
          {errorNotificacion}
        </div>
      )}

      <form
        onSubmit={crearNotificacion}
        className="bg-white border border-[#E4E7EE] rounded-2xl p-5 mb-6 flex flex-col gap-3"
      >
        <textarea
          placeholder="Mensaje de la notificación (máx. 300 caracteres)"
          value={mensajeNotificacion}
          onChange={(e) => setMensajeNotificacion(e.target.value)}
          rows={2}
          maxLength={300}
          className="px-3 py-2 rounded-lg border border-[#E4E7EE] text-[13px] resize-none"
        />
        <button
          type="submit"
          disabled={enviandoNotificacion || !mensajeNotificacion.trim()}
          className="self-start bg-cm-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {enviandoNotificacion ? 'Emitiendo...' : 'Emitir notificación'}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {(notificaciones ?? []).map((n) => (
          <div
            key={n.id}
            className="bg-white border border-[#E4E7EE] rounded-2xl p-4 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-[13px] break-words">{n.mensaje}</div>
              <div className="text-[11px] text-[#6B7280] mt-1">{formatearFechaHora(n.creadoEn)}</div>
            </div>
            <button
              disabled={borrandoNotifId === n.id}
              onClick={() => eliminarNotificacion(n)}
              className="shrink-0 text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-red-300 text-red-600 disabled:opacity-30"
            >
              Eliminar
            </button>
          </div>
        ))}
        {(notificaciones ?? []).length === 0 && (
          <p className="text-[13px] text-[#6B7280] bg-white border border-[#E4E7EE] rounded-2xl p-6">
            Todavía no has emitido ninguna notificación.
          </p>
        )}
      </div>
    </div>
  );
}
