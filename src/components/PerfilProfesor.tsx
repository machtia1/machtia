'use client';

import { useEffect, useState } from 'react';
import LoadingLogo from './LoadingLogo';
import SubirArchivo from './SubirArchivo';

/**
 * Perfil público del Profesor/Facilitador. Al guardarlo aparece en
 * "Conoce a nuestros instructores" (sección Cursos). Por ahora solo texto:
 * foto, nombre público y estudios (sin subir documentos).
 */
export default function PerfilProfesor({
  userId,
  nombreInicial,
  correo,
}: {
  userId: string;
  nombreInicial: string;
  correo: string;
}) {
  const [cargando, setCargando] = useState(true);
  const [nombrePublico, setNombrePublico] = useState(nombreInicial);
  const [especialidad, setEspecialidad] = useState('');
  const [estudios, setEstudios] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    fetch('/api/profesor/perfil')
      .then((r) => r.json())
      .then((d) => {
        if (d.perfil) {
          setNombrePublico(d.perfil.nombrePublico);
          setEspecialidad(d.perfil.especialidad);
          setEstudios(d.perfil.estudios);
          setFotoUrl(d.perfil.fotoUrl);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    if (!nombrePublico.trim()) return setMensaje({ tipo: 'error', texto: 'Escribe tu nombre público.' });
    if (!especialidad.trim()) return setMensaje({ tipo: 'error', texto: 'Escribe tu especialidad o título principal.' });
    setGuardando(true);
    try {
      const res = await fetch('/api/profesor/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombrePublico, especialidad, estudios, fotoUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMensaje({ tipo: 'error', texto: data.error || 'No se pudo guardar tu perfil.' });
      setMensaje({ tipo: 'ok', texto: 'Perfil guardado. Ya apareces en "Conoce a nuestros instructores".' });
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <LoadingLogo size={28} label="Cargando tu perfil..." />;

  const campo =
    'w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8DCE6] text-[14px] outline-none focus:border-cm-primary focus:ring-2 focus:ring-cm-primary/15';

  return (
    <form
      onSubmit={guardar}
      aria-label="Mi perfil"
      className="bg-white border border-[#E4E7EE] rounded-2xl p-5 sm:p-6 flex flex-col gap-5 max-w-2xl"
    >
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-cm-primary text-white font-bold text-[28px] overflow-hidden flex items-center justify-center shrink-0">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="Tu foto" className="w-full h-full object-cover" />
          ) : (
            (nombrePublico || nombreInicial).charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <SubirArchivo
            tipo="imagen"
            userId={userId}
            etiqueta="Foto de perfil"
            textoBoton="Subir foto"
            accept="image/jpeg,image/png,image/webp"
            actual={fotoUrl ? 'Foto cargada' : undefined}
            alSubir={(url) => setFotoUrl(url)}
          />
          <p className="text-[11.5px] text-[#6B7280] mt-1 truncate">{correo}</p>
        </div>
      </div>

      <div>
        <label htmlFor="perfil-nombre" className="block text-[12px] font-semibold text-[#374151] mb-1.5">
          Nombre público
        </label>
        <input id="perfil-nombre" value={nombrePublico} onChange={(e) => setNombrePublico(e.target.value)} maxLength={80} className={campo} />
        <p className="text-[11.5px] text-[#6B7280] mt-1">Así te verán los alumnos (por ejemplo: Mtra. Laura Gómez).</p>
      </div>

      <div>
        <label htmlFor="perfil-especialidad" className="block text-[12px] font-semibold text-[#374151] mb-1.5">
          Especialidad o título principal
        </label>
        <input
          id="perfil-especialidad"
          value={especialidad}
          onChange={(e) => setEspecialidad(e.target.value)}
          maxLength={100}
          placeholder="Ej. Licenciada en Finanzas"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="perfil-estudios" className="block text-[12px] font-semibold text-[#374151] mb-1.5">
          Estudios, diplomados y certificaciones
        </label>
        <textarea
          id="perfil-estudios"
          value={estudios}
          onChange={(e) => setEstudios(e.target.value)}
          maxLength={3000}
          rows={6}
          placeholder={'Escribe uno por línea. Ej.:\nLicenciatura en Administración — UNAM\nDiplomado en Marketing Digital'}
          className={campo}
        />
      </div>

      {mensaje && (
        <p role="status" className={`text-[13px] ${mensaje.tipo === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="self-start bg-cm-primary text-white text-[14px] font-semibold px-6 py-2.5 rounded-xl disabled:opacity-60"
      >
        {guardando ? 'Guardando...' : 'Guardar perfil'}
      </button>
    </form>
  );
}
