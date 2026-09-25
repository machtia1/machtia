'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  invitadorLinkId?: string;
  slotToken?: string;
  invitadorNombre: string;
}

export default function InvitacionLanding({ invitadorLinkId, slotToken, invitadorNombre }: Props) {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDisponible, setVideoDisponible] = useState(true);
  const [reproduciendo, setReproduciendo] = useState(false);

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [linkDesarrollo, setLinkDesarrollo] = useState<string | undefined>();

  useEffect(() => {
    if (!videoRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play().then(() => setReproduciendo(true)).catch(() => {});
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, []);

  function toggleVideo() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setReproduciendo(true);
    } else {
      videoRef.current.pause();
      setReproduciendo(false);
    }
  }

  function validarNombre(valor: string) {
    setNombre(valor);
    if (valor.trim() && !SOLO_LETRAS.test(valor)) {
      setErrorNombre('Solo se permiten letras y espacios, sin números ni símbolos.');
    } else {
      setErrorNombre('');
    }
  }

  function validarCorreo(valor: string) {
    setCorreo(valor);
    if (valor.trim() && !CORREO_VALIDO.test(valor)) {
      setErrorCorreo('El formato del correo no es válido.');
    } else {
      setErrorCorreo('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorEnvio('');
    const nombreOk = nombre.trim() && SOLO_LETRAS.test(nombre);
    const correoOk = correo.trim() && CORREO_VALIDO.test(correo);
    if (!nombreOk) setErrorNombre('Escribe tu nombre (solo letras).');
    if (!correoOk) setErrorCorreo('Escribe un correo válido.');
    if (!nombreOk || !correoOk) return;

    setEnviando(true);
    try {
      const res = await fetch('/api/preregistro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, invitadorLinkId, slotToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorEnvio(data.error || 'No se pudo completar el preregistro');
        return;
      }
      setLinkDesarrollo(data.linkDesarrollo);
      setEnviado(true);
    } catch {
      setErrorEnvio('Error de conexión, intenta de nuevo');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative min-h-svh bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,_#0f1a3d_0%,_#0a0e27_45%,_#060915_100%)] text-white overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(56,189,248,0.16) 0%, transparent 55%), radial-gradient(circle at 85% 85%, rgba(99,102,241,0.12) 0%, transparent 50%)',
        }}
      />

      <div className="relative max-w-xl mx-auto px-6 py-14 sm:py-20">
        <div className="flex items-center gap-2.5 mb-10">
          <img src="/brand/logo-lockup-white.png" alt="Club Machtia" className="h-7 w-auto" />
        </div>

        {!enviado ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#7dd3fc] mb-2">
              Una sola cuenta
            </p>
            <h1 className="text-[28px] sm:text-[34px] font-bold leading-tight mb-3">
              Bienvenido al espacio de {invitadorNombre}
            </h1>
            <p className="text-white/60 text-[15px] leading-relaxed mb-8">
              Quiero que conozcas cómo puedes aprender, ayudar y ganar junto a otras personas.
              <br />
              ¿Estás listo?
            </p>

            <div
              onClick={toggleVideo}
              className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 mb-6 cursor-pointer aspect-video"
            >
              {videoDisponible ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  src="/videos/presentacion.mp4"
                  playsInline
                  muted
                  loop
                  onError={() => setVideoDisponible(false)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-[13px]">
                  Video de presentación próximamente
                </div>
              )}
              {!reproduciendo && videoDisponible && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                      <path d="M5 3l12 7-12 7V3z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full h-11 rounded-xl border border-white/25 text-[14px] font-medium mb-10 hover:bg-white/5 transition-colors"
            >
              Conoce más en nuestro sitio
            </button>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[rgba(15,23,55,0.92)] to-[rgba(8,12,30,0.97)] backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-6">
              <p className="text-[11px] font-bold text-[#7dd3fc] uppercase tracking-wide mb-1">
                Comienza tu registro aquí
              </p>
              <h2 className="text-[18px] font-bold mb-5">Preregistro</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Nombre</label>
                  <input
                    value={nombre}
                    onChange={(e) => validarNombre(e.target.value)}
                    placeholder="Ej. María"
                    className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
                  />
                  {errorNombre && <p className="text-red-400 text-[12px] mt-1">{errorNombre}</p>}
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Correo electrónico</label>
                  <input
                    value={correo}
                    onChange={(e) => validarCorreo(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
                  />
                  {errorCorreo && <p className="text-red-400 text-[12px] mt-1">{errorCorreo}</p>}
                </div>

                {errorEnvio && <p className="text-red-400 text-[13px]">{errorEnvio}</p>}

                <button
                  type="submit"
                  disabled={enviando}
                  className="h-12 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#6366f1] text-white text-[14.5px] font-bold mt-1 shadow-[0_8px_22px_rgba(56,189,248,0.3)] disabled:opacity-60"
                >
                  {enviando ? 'Enviando...' : 'Continuar'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[rgba(15,23,55,0.92)] to-[rgba(8,12,30,0.97)] backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22)_0%,transparent_72%)] flex items-center justify-center mx-auto mb-4 text-[22px]">
              ✉️
            </div>
            <h2 className="text-[18px] font-bold mb-2">Revisa tu correo</h2>
            <p className="text-white/70 text-[14px] leading-relaxed">
              Te enviamos un correo de confirmación a <b>{correo}</b>. Al confirmarlo, vas a poder
              completar tu registro con tus datos, elegir tu suscripción y subir tu comprobante de pago.
            </p>
            {linkDesarrollo && (
              <div className="mt-5 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-left">
                <p className="text-yellow-300 text-[11px] font-semibold uppercase tracking-wide mb-1">
                  Modo desarrollo (Brevo no está conectado todavía)
                </p>
                <a href={linkDesarrollo} className="text-yellow-200 text-[12px] underline break-all">
                  {linkDesarrollo}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
