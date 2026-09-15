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
    if (!nombreOk) setErrorNombre('Escribe tu nombre y apellido (solo letras).');
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
    <div className="min-h-screen bg-[#0A0E27] text-white">
      <div className="max-w-xl mx-auto px-6 py-14 sm:py-20">
        <div className="flex items-center gap-2.5 mb-10">
          <img src="/brand/logo-lockup-white.png" alt="Club Machtia" className="h-8 w-auto" />
        </div>

        {!enviado ? (
          <>
            <h1 className="text-[28px] sm:text-[34px] font-semibold leading-tight mb-3">
              Bienvenido al espacio de {invitadorNombre}
            </h1>
            <p className="text-white/70 text-[15px] leading-relaxed mb-8">
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
              className="w-full h-11 rounded-lg border border-white/25 text-[14px] font-medium mb-10 hover:bg-white/5 transition-colors"
            >
              Conoce más en nuestro sitio
            </button>

            <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-6">
              <p className="text-[13px] font-semibold text-white/60 uppercase tracking-wide mb-1">
                Comienza tu registro aquí
              </p>
              <h2 className="text-[18px] font-semibold mb-5">Preregistro</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] text-white/70 mb-1.5">Nombre y Apellido</label>
                  <input
                    value={nombre}
                    onChange={(e) => validarNombre(e.target.value)}
                    placeholder="Ej. María López"
                    className="w-full h-11 px-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[14px] outline-none focus:border-cm-accent"
                  />
                  {errorNombre && <p className="text-red-400 text-[12px] mt-1">{errorNombre}</p>}
                </div>

                <div>
                  <label className="block text-[13px] text-white/70 mb-1.5">Correo electrónico</label>
                  <input
                    value={correo}
                    onChange={(e) => validarCorreo(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full h-11 px-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[14px] outline-none focus:border-cm-accent"
                  />
                  {errorCorreo && <p className="text-red-400 text-[12px] mt-1">{errorCorreo}</p>}
                </div>

                {errorEnvio && <p className="text-red-400 text-[13px]">{errorEnvio}</p>}

                <button
                  type="submit"
                  disabled={enviando}
                  className="h-11 rounded-lg bg-white text-cm-primaryDark text-[14px] font-semibold mt-1 disabled:opacity-60"
                >
                  {enviando ? 'Enviando...' : 'Continuar'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-cm-accent/20 flex items-center justify-center mx-auto mb-4">
              ✉️
            </div>
            <h2 className="text-[18px] font-semibold mb-2">Revisa tu correo</h2>
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
