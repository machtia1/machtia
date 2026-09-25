'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import LoadingLogo from './LoadingLogo';

interface Imagen {
  id: string;
  imagenUrl: string;
}

const INTERVALO_MS = 5000;

/**
 * Sección "Publicidad" — pedida por el cliente el 25 sept 2026:
 * carrusel de hasta 8 imágenes en formato publicación de Facebook,
 * que cualquier usuario puede ver y descargar para promocionar el
 * negocio en sus propias redes sociales. Avanza sola cada 5
 * segundos y también se puede mover a mano con las flechas o los
 * puntos.
 */
export default function PublicidadCarrusel() {
  const [imagenes, setImagenes] = useState<Imagen[] | null>(null);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    fetch('/api/publicidad')
      .then((res) => res.json())
      .then((data) => setImagenes(data.imagenes ?? []))
      .catch(() => setImagenes([]));
  }, []);

  useEffect(() => {
    if (!imagenes || imagenes.length < 2) return;
    const t = window.setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, INTERVALO_MS);
    return () => window.clearInterval(t);
  }, [imagenes]);

  function anterior() {
    if (!imagenes || imagenes.length === 0) return;
    setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
  }

  function siguiente() {
    if (!imagenes || imagenes.length === 0) return;
    setIndice((i) => (i + 1) % imagenes.length);
  }

  async function descargar(img: Imagen) {
    try {
      const res = await fetch(img.imagenUrl);
      const blob = await res.blob();
      const extension = blob.type.split('/')[1] || 'jpg';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `publicidad-club-machtia-${img.id}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Si algo falla (ej. CORS), al menos abrimos la imagen en una
      // pestaña nueva para que el usuario la pueda guardar a mano.
      window.open(img.imagenUrl, '_blank');
    }
  }

  if (imagenes === null) {
    return <LoadingLogo size={28} label="Cargando publicidad..." />;
  }

  if (imagenes.length === 0) {
    return (
      <p className="text-[13px] text-[#6B7280] py-2">
        Todavía no hay imágenes de publicidad disponibles.
      </p>
    );
  }

  const actual = imagenes[indice];

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden border border-[#E4E7EE] bg-[#F4F6FB] aspect-[1.9/1]">
        <img src={actual.imagenUrl} alt="" className="w-full h-full object-cover" />

        {imagenes.length > 1 && (
          <>
            <button
              onClick={anterior}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={siguiente}
              aria-label="Siguiente imagen"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        <button
          onClick={() => descargar(actual)}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white text-[#1C1E2B] text-[12px] font-semibold px-3 py-1.5 rounded-lg shadow"
        >
          <Download size={13} />
          Descargar
        </button>
      </div>

      {imagenes.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {imagenes.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndice(i)}
              aria-label={`Ir a la imagen ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === indice ? 'w-5 bg-cm-primary' : 'w-1.5 bg-[#D9DCE8]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
