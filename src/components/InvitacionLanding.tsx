'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CuentaRegresiva from '@/components/landing/CuentaRegresiva';
import ReproductorVideo from '@/components/landing/ReproductorVideo';
import AsistentePreguntas from '@/components/landing/AsistentePreguntas';
import {
  POSTER_BIENVENIDA,
  POSTER_PRESENTACION,
  VIDEO_BIENVENIDA,
  VIDEO_PRESENTACION,
} from '@/lib/landingConfig';

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  invitadorLinkId?: string;
  slotToken?: string;
  invitadorNombre: string;
}

function desplazarA(elemento: HTMLElement | null) {
  if (!elemento) return;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  elemento.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'start' });
}

export default function InvitacionLanding({ invitadorLinkId, slotToken, invitadorNombre }: Props) {
  // Pasos de la página: 1 = primer video · 2 = video de presentación · 3 = preguntas y asesor.
  // El formulario de preregistro siempre está disponible al final.
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [sonido, setSonido] = useState(false);
  const [video1NoDisponible, setVideo1NoDisponible] = useState(false);
  const [formularioVisible, setFormularioVisible] = useState(false);

  const presentacionRef = useRef<HTMLElement>(null);
  const asistenteRef = useRef<HTMLDivElement>(null);
  const formularioRef = useRef<HTMLDivElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [linkDesarrollo, setLinkDesarrollo] = useState<string | undefined>();

  // Las invitaciones de espacios restringidos no vienen de una persona.
  const invitadorParaAsesor = slotToken ? undefined : invitadorNombre;

  // Al avanzar de paso, la pantalla baja sola a la sección nueva.
  useEffect(() => {
    if (paso === 2) desplazarA(presentacionRef.current);
    if (paso === 3) desplazarA(asistenteRef.current);
  }, [paso]);

  // El botón fijo "Iniciar registro" se oculta cuando el formulario ya está a la vista.
  useEffect(() => {
    const formulario = formularioRef.current;
    if (!formulario) return;
    const observador = new IntersectionObserver(([entrada]) => setFormularioVisible(entrada.isIntersecting), {
      threshold: 0.25,
    });
    observador.observe(formulario);
    return () => observador.disconnect();
  }, [enviado]);

  const alCambiarSonido = useCallback((activo: boolean) => setSonido(activo), []);

  function conocerMas() {
    setSonido(true); // la persona acaba de tocar: se intenta con sonido
    if (paso >= 2) desplazarA(presentacionRef.current);
    else setPaso(2);
  }

  const alTerminarPresentacion = useCallback(() => setPaso((p) => (p < 3 ? 3 : p)), []);

  function iniciarRegistro() {
    desplazarA(formularioRef.current);
    // Se espera a que termine el desplazamiento para no mover la pantalla dos veces.
    setTimeout(() => nombreRef.current?.focus({ preventScroll: true }), 500);
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

  const botonPrincipal =
    'w-full h-12 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#6366f1] text-white text-[14.5px] font-bold shadow-[0_8px_22px_rgba(56,189,248,0.3)]';

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

      <div className="relative max-w-xl mx-auto px-6 pt-14 sm:pt-20 pb-32">
        <div className="flex items-center gap-2.5 mb-10">
          <img src="/brand/logo-lockup-white.png" alt="Machtia" className="h-7 w-auto" />
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

            <CuentaRegresiva />

            {/* Paso 1: primer video. Arranca solo, sin sonido; no se puede adelantar. */}
            <div className="mb-6">
              <ReproductorVideo
                src={VIDEO_BIENVENIDA}
                poster={POSTER_BIENVENIDA}
                titulo="Video de bienvenida"
                modo="estricto"
                inicioAutomatico
                sonido={sonido}
                onSonidoChange={alCambiarSonido}
                onNoDisponible={() => setVideo1NoDisponible(true)}
                alTerminar={(repetir) => (
                  <>
                    <p className="text-[15px] font-semibold text-center mb-1">¿Quieres conocer más?</p>
                    <button type="button" onClick={conocerMas} className={`${botonPrincipal} max-w-[320px]`}>
                      Sí, quiero conocer más
                    </button>
                    <button
                      type="button"
                      onClick={repetir}
                      className="w-full max-w-[320px] h-11 rounded-xl border border-white/25 text-[14px] font-medium hover:bg-white/5 transition-colors"
                    >
                      Repetir video
                    </button>
                  </>
                )}
              />
              {video1NoDisponible && paso === 1 && (
                <button type="button" onClick={conocerMas} className={`${botonPrincipal} mt-4`}>
                  Sí, quiero conocer más
                </button>
              )}
            </div>

            {/* Paso 2: video de presentación. */}
            {paso >= 2 && (
              <section ref={presentacionRef} aria-label="Presentación" className="mb-6 scroll-mt-6">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7dd3fc] mb-2">Presentación</p>
                <ReproductorVideo
                  src={VIDEO_PRESENTACION}
                  poster={POSTER_PRESENTACION}
                  titulo="Video de presentación"
                  modo="libre"
                  inicioAutomatico
                  sonido={sonido}
                  onSonidoChange={alCambiarSonido}
                  onTerminar={alTerminarPresentacion}
                  onNoDisponible={alTerminarPresentacion}
                />
              </section>
            )}

            {/* Paso 3: preguntas frecuentes y asesor por WhatsApp. */}
            {paso >= 3 && (
              <div ref={asistenteRef} className="mb-10 scroll-mt-6">
                <AsistentePreguntas invitador={invitadorParaAsesor} />
              </div>
            )}

            <div
              id="registro"
              ref={formularioRef}
              className="scroll-mt-6 rounded-3xl border border-white/10 bg-gradient-to-b from-[rgba(15,23,55,0.92)] to-[rgba(8,12,30,0.97)] backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-6"
            >
              <p className="text-[11px] font-bold text-[#7dd3fc] uppercase tracking-wide mb-1">
                Comienza tu registro aquí
              </p>
              <h2 className="text-[18px] font-bold mb-5">Preregistro</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Nombre</label>
                  <input
                    ref={nombreRef}
                    value={nombre}
                    onChange={(e) => validarNombre(e.target.value)}
                    placeholder="Ej. María"
                    autoComplete="given-name"
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
                    inputMode="email"
                    autoComplete="email"
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

      {/* Botón fijo: siempre a la mano hasta que el formulario está a la vista. */}
      {!enviado && !formularioVisible && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 pointer-events-none bg-gradient-to-t from-[#060915] via-[#060915]/70 to-transparent">
          <button
            type="button"
            onClick={iniciarRegistro}
            className={`${botonPrincipal} max-w-xl pointer-events-auto`}
          >
            Iniciar registro
          </button>
        </div>
      )}
    </div>
  );
}
