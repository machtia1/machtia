'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import LoadingLogo from './LoadingLogo';
import AdminTabs from './AdminTabs';

interface Imagen {
  id: string;
  imagenUrl: string;
  orden: number;
  activo: boolean;
}

/**
 * Panel de administración de la sección "Publicidad" — pedido por el
 * cliente el 25 sept 2026: un carrusel de hasta 8 imágenes en
 * formato publicación de Facebook, que cualquier usuario puede ver y
 * descargar desde su Dashboard para promocionar el negocio en sus
 * propias redes sociales.
 */
export default function AdminPublicidad() {
  const [imagenes, setImagenes] = useState<Imagen[] | null>(null);
  const [maximo, setMaximo] = useState(8);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  async function cargar() {
    setError('');
    try {
      const res = await fetch('/api/admin/publicidad');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar la lista de imágenes');
        return;
      }
      setImagenes(data.imagenes);
      setMaximo(data.maximo ?? 8);
    } catch {
      setError('Error de conexión');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function subirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      const resMedia = await fetch('/api/admin/publicidad/media', { method: 'POST', body: formData });
      const dataMedia = await resMedia.json();
      if (!resMedia.ok) {
        setError(dataMedia.error || 'No se pudo subir la imagen');
        return;
      }

      const res = await fetch('/api/admin/publicidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenUrl: dataMedia.imagenUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo agregar la imagen al carrusel');
        return;
      }
      await cargar();
    } catch {
      setError('Error de conexión al subir la imagen');
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  }

  async function alternarActivo(img: Imagen) {
    setProcesandoId(img.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/publicidad/${img.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !img.activo }),
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

  async function mover(img: Imagen, direccion: 'arriba' | 'abajo') {
    if (!imagenes) return;
    const ordenados = [...imagenes].sort((a, b) => a.orden - b.orden);
    const idx = ordenados.findIndex((i) => i.id === img.id);
    const idxVecino = direccion === 'arriba' ? idx - 1 : idx + 1;
    if (idxVecino < 0 || idxVecino >= ordenados.length) return;

    const vecino = ordenados[idxVecino];
    setProcesandoId(img.id);
    setError('');
    try {
      await Promise.all([
        fetch(`/api/admin/publicidad/${img.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orden: vecino.orden }),
        }),
        fetch(`/api/admin/publicidad/${vecino.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orden: img.orden }),
        }),
      ]);
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminar(img: Imagen) {
    const ok = window.confirm('¿Eliminar esta imagen del carrusel de Publicidad? Esta acción no se puede deshacer.');
    if (!ok) return;
    setProcesandoId(img.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/publicidad/${img.id}`, { method: 'DELETE' });
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

  if (!imagenes && !error) {
    return <LoadingLogo label="Cargando publicidad..." fullScreen />;
  }

  const ordenados = [...(imagenes ?? [])].sort((a, b) => a.orden - b.orden);
  const puedeAgregar = ordenados.length < maximo;

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <AdminTabs />
      <h1 className="text-[22px] font-semibold mb-1">Publicidad</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">
        Sube hasta {maximo} imágenes en formato publicación de Facebook (recomendado 1200×630px).
        Cualquier usuario las va a poder ver y descargar desde su Dashboard, en la sección
        "Publicidad", para promocionar el negocio en sus propias redes.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[13px]">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5 mb-6">
        <h2 className="text-[14px] font-semibold mb-3">
          Agregar imagen ({ordenados.length}/{maximo})
        </h2>
        {puedeAgregar ? (
          <>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={subirImagen}
              disabled={subiendo}
              className="text-[13px]"
            />
            <p className="text-[11px] text-[#6B7280] mt-1">
              JPG, PNG o WEBP, máximo 5 MB. Se agrega al final del carrusel.
            </p>
            {subiendo && <p className="text-[12px] text-cm-primary mt-1">Subiendo...</p>}
          </>
        ) : (
          <p className="text-[13px] text-[#6B7280]">
            Ya tienes el máximo de {maximo} imágenes. Borra alguna para poder agregar otra.
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {ordenados.map((img, idx) => (
          <div key={img.id} className="bg-white border border-[#E4E7EE] rounded-2xl p-4">
            <img
              src={img.imagenUrl}
              alt=""
              className="w-full aspect-[1.9/1] object-cover rounded-lg border border-[#E4E7EE] mb-3"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#6B7280]">
                Posición {idx + 1} · {img.activo ? 'Visible' : 'Desactivada'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={procesandoId === img.id || idx === 0}
                  onClick={() => mover(img, 'arriba')}
                  aria-label="Subir posición"
                  className="w-7 h-7 rounded-lg border border-[#E4E7EE] flex items-center justify-center disabled:opacity-30"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  disabled={procesandoId === img.id || idx === ordenados.length - 1}
                  onClick={() => mover(img, 'abajo')}
                  aria-label="Bajar posición"
                  className="w-7 h-7 rounded-lg border border-[#E4E7EE] flex items-center justify-center disabled:opacity-30"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                disabled={procesandoId === img.id}
                onClick={() => alternarActivo(img)}
                className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 disabled:opacity-30"
              >
                {img.activo ? 'Desactivar' : 'Reactivar'}
              </button>
              <button
                disabled={procesandoId === img.id}
                onClick={() => eliminar(img)}
                className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-red-300 text-red-600 disabled:opacity-30"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {ordenados.length === 0 && (
          <p className="text-[13px] text-[#6B7280] bg-white border border-[#E4E7EE] rounded-2xl p-6 sm:col-span-2">
            Todavía no has subido ninguna imagen de publicidad.
          </p>
        )}
      </div>
    </div>
  );
}
