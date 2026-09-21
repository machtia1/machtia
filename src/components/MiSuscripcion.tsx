'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, Copy } from 'lucide-react';
import LoadingLogo from './LoadingLogo';

interface Perfil {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  ladaPais: string | null;
  suscripcion: string | null;
  linkInvitacion: string;
  creadoEn: string;
  membresiaExpiraEn: string | null;
  fotoPerfilUrl: string | null;
  direccionCalle: string | null;
  direccionColonia: string | null;
  codigoPostal: string | null;
  textoPresentacion: string | null;
  redSocialFacebook: string | null;
  redSocialInstagram: string | null;
  redSocialTiktok: string | null;
}

const TEXTO_PRESENTACION_MAX = 400;

export default function MiSuscripcion() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch('/api/perfil')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setPerfil(data.usuario);
      })
      .catch(() => setError('Error de conexión'));
  }, []);

  function actualizarCampo<K extends keyof Perfil>(campo: K, valor: Perfil[K]) {
    setPerfil((p) => (p ? { ...p, [campo]: valor } : p));
    setGuardado(false);
  }

  async function guardar() {
    if (!perfil) return;
    setGuardando(true);
    setError('');
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: perfil.telefono,
          direccionCalle: perfil.direccionCalle,
          direccionColonia: perfil.direccionColonia,
          codigoPostal: perfil.codigoPostal,
          textoPresentacion: perfil.textoPresentacion,
          redSocialFacebook: perfil.redSocialFacebook,
          redSocialInstagram: perfil.redSocialInstagram,
          redSocialTiktok: perfil.redSocialTiktok,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo guardar');
        return;
      }
      setGuardado(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setGuardando(false);
    }
  }

  async function subirFoto(archivo: File) {
    setSubiendoFoto(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('foto', archivo);
      const res = await fetch('/api/perfil/foto', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo subir la foto');
        return;
      }
      setPerfil((p) => (p ? { ...p, fotoPerfilUrl: data.usuario.fotoPerfilUrl } : p));
    } catch {
      setError('Error de conexión');
    } finally {
      setSubiendoFoto(false);
    }
  }

  function copiarLink() {
    if (!perfil) return;
    navigator.clipboard.writeText(`machtiaeducacion.com/invitacion/${perfil.linkInvitacion}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (error && !perfil) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-red-600 text-[13px]">{error}</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="p-6 sm:p-8">
        <LoadingLogo label="Cargando tu perfil..." />
      </div>
    );
  }

  const diasRestantes = perfil.membresiaExpiraEn
    ? Math.max(0, Math.ceil((new Date(perfil.membresiaExpiraEn).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <Link href="/home" className="text-[13px] text-cm-primary font-semibold mb-3 inline-block">
        ← Volver a inicio
      </Link>
      <h1 className="text-[22px] font-semibold mb-1">Mi Suscripción</h1>
      <p className="text-[#6B7280] text-[14px] mb-6">Administra tu perfil y los datos de tu cuenta.</p>

      {error && <p className="text-red-600 text-[13px] mb-4">{error}</p>}

      {/* Foto + datos básicos */}
      <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6 mb-5 flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-cm-primary text-white flex items-center justify-center font-bold text-[24px] overflow-hidden">
            {perfil.fotoPerfilUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={perfil.fotoPerfilUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              perfil.nombre.charAt(0).toUpperCase()
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-[#E4E7EE] flex items-center justify-center cursor-pointer shadow">
            <Camera size={13} />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={subiendoFoto}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) subirFoto(file);
              }}
            />
          </label>
        </div>
        <div>
          <div className="text-[16px] font-semibold">
            {perfil.nombre} {perfil.apellido}
          </div>
          <div className="text-[13px] text-[#6B7280]">{perfil.correo}</div>
          {perfil.suscripcion && (
            <span className="inline-block mt-1 text-[11px] font-bold text-cm-primary bg-[#ECECFF] px-2 py-0.5 rounded-full">
              {perfil.suscripcion}
            </span>
          )}
          {subiendoFoto && <div className="text-[11px] text-[#6B7280] mt-1">Subiendo foto...</div>}
        </div>
      </div>

      {/* Membresía */}
      <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6 mb-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
            Fecha de registro
          </div>
          <div className="text-[13px] font-medium">
            {new Date(perfil.creadoEn).toLocaleDateString('es-MX')}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
            Fecha de finalización
          </div>
          <div className="text-[13px] font-medium">
            {perfil.membresiaExpiraEn
              ? new Date(perfil.membresiaExpiraEn).toLocaleDateString('es-MX')
              : 'No definida aún'}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
            Días restantes
          </div>
          <div className="text-[13px] font-medium">{diasRestantes ?? '—'}</div>
        </div>
      </div>

      {/* Link de invitación */}
      <div className="bg-white border border-[#E4E7EE] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
            Tu link de invitación
          </div>
          <div className="text-[14px] font-semibold text-cm-primaryDark">
            machtiaeducacion.com/invitacion/{perfil.linkInvitacion}
          </div>
        </div>
        <button
          onClick={copiarLink}
          className="bg-cm-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
        >
          {copiado ? <Check size={14} /> : <Copy size={14} />}
          {copiado ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>

      {/* Datos editables */}
      <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6 mb-5 flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold">Datos de contacto</h2>

        <div>
          <label className="text-[12px] font-semibold text-[#6B7280] block mb-1">Teléfono</label>
          <input
            value={perfil.telefono ?? ''}
            onChange={(e) => actualizarCampo('telefono', e.target.value)}
            className="w-full border border-[#E4E7EE] rounded-lg px-3 h-10 text-[13px]"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[12px] font-semibold text-[#6B7280] block mb-1">Calle y número</label>
            <input
              value={perfil.direccionCalle ?? ''}
              onChange={(e) => actualizarCampo('direccionCalle', e.target.value)}
              className="w-full border border-[#E4E7EE] rounded-lg px-3 h-10 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6B7280] block mb-1">Código postal</label>
            <input
              value={perfil.codigoPostal ?? ''}
              onChange={(e) => actualizarCampo('codigoPostal', e.target.value)}
              className="w-full border border-[#E4E7EE] rounded-lg px-3 h-10 text-[13px]"
            />
          </div>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-[#6B7280] block mb-1">Colonia</label>
          <input
            value={perfil.direccionColonia ?? ''}
            onChange={(e) => actualizarCampo('direccionColonia', e.target.value)}
            className="w-full border border-[#E4E7EE] rounded-lg px-3 h-10 text-[13px]"
          />
        </div>

        <div>
          <label className="text-[12px] font-semibold text-[#6B7280] block mb-1">
            Texto de presentación ({(perfil.textoPresentacion ?? '').length}/{TEXTO_PRESENTACION_MAX})
          </label>
          <textarea
            value={perfil.textoPresentacion ?? ''}
            maxLength={TEXTO_PRESENTACION_MAX}
            onChange={(e) => actualizarCampo('textoPresentacion', e.target.value)}
            rows={3}
            className="w-full border border-[#E4E7EE] rounded-lg px-3 py-2 text-[13px] resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[12px] font-semibold text-[#6B7280] block mb-1">Facebook</label>
            <input
              value={perfil.redSocialFacebook ?? ''}
              onChange={(e) => actualizarCampo('redSocialFacebook', e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full border border-[#E4E7EE] rounded-lg px-3 h-10 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6B7280] block mb-1">Instagram</label>
            <input
              value={perfil.redSocialInstagram ?? ''}
              onChange={(e) => actualizarCampo('redSocialInstagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full border border-[#E4E7EE] rounded-lg px-3 h-10 text-[13px]"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6B7280] block mb-1">TikTok</label>
            <input
              value={perfil.redSocialTiktok ?? ''}
              onChange={(e) => actualizarCampo('redSocialTiktok', e.target.value)}
              placeholder="https://tiktok.com/@..."
              className="w-full border border-[#E4E7EE] rounded-lg px-3 h-10 text-[13px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={guardar}
            disabled={guardando}
            className="bg-cm-primary text-white text-[13px] font-semibold px-5 py-2 rounded-lg disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {guardado && <span className="text-emerald-600 text-[13px] font-medium">Guardado ✓</span>}
        </div>
      </div>

      {/* Comparte en comunidad — próximamente */}
      <div className="bg-[#F4F6FB] border border-dashed border-[#E4E7EE] rounded-2xl p-6 text-center">
        <div className="text-[14px] font-semibold mb-1">Comparte en comunidad</div>
        <span className="inline-block text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          Próximamente
        </span>
      </div>
    </div>
  );
}
