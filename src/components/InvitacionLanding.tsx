'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CuentaRegresiva from '@/components/landing/CuentaRegresiva';
import ReproductorVideo, { type ControlReproductor } from '@/components/landing/ReproductorVideo';
import AsistentePreguntas from '@/components/landing/AsistentePreguntas';
import {
  POSTER_BIENVENIDA,
  POSTER_PRESENTACION,
  VIDEO_BIENVENIDA,
  VIDEO_PRESENTACION,
  enlaceWhatsApp,
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

function IconoRepetir() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 10-2.5 5.8" />
      <path d="M20 5v5h-5" />
    </svg>
  );
}

function IconoWhatsApp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.52 3.45A11.8 11.8 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41z" />
    </svg>
  );
}

const BOTON_CIAN =
  'w-full max-w-md h-14 sm:h-16 rounded-full bg-cm-cian text-cm-navy text-[19px] sm:text-[23px] font-extrabold shadow-[0_10px_26px_rgba(31,224,238,0.4)] flex items-center justify-center gap-2.5 hover:brightness-95 transition';
const BOTON_AZUL =
  'w-full max-w-md h-14 sm:h-16 rounded-full bg-cm-navy text-white text-[18px] sm:text-[21px] font-bold shadow-[0_10px_26px_rgba(8,42,92,0.28)] flex items-center justify-center gap-2.5 hover:brightness-110 transition';
const BOTON_ENLACE =
  'flex items-center gap-2 text-cm-navy text-[16px] sm:text-[19px] font-semibold hover:underline underline-offset-4';

export default function InvitacionLanding({ invitadorLinkId, slotToken, invitadorNombre }: Props) {
  // Qué video se ve (1 = bienvenida, 2 = presentación) y si ya terminó.
  const [video, setVideo] = useState<1 | 2>(1);
  const [finVideo, setFinVideo] = useState(false);
  const [sonido, setSonido] = useState(false);
  const [preguntasAbiertas, setPreguntasAbiertas] = useState(false);
  // El formulario permanece oculto hasta que la persona toca "Quiero registrarme".
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [formularioVisible, setFormularioVisible] = useState(false);

  const reproductorRef = useRef<ControlReproductor>(null);
  const zonaVideoRef = useRef<HTMLDivElement>(null);
  const accionesRef = useRef<HTMLDivElement>(null);
  const preguntasRef = useRef<HTMLDivElement>(null);
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

  const alCambiarSonido = useCallback((activo: boolean) => setSonido(activo), []);
  const alTerminarVideo = useCallback(() => setFinVideo(true), []);
  const alReiniciarVideo = useCallback(() => {
    setFinVideo(false);
    setPreguntasAbiertas(false);
  }, []);

  // Al terminar un video, los botones nuevos quedan a la vista.
  useEffect(() => {
    if (!finVideo) return;
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(
      () => accionesRef.current?.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'nearest' }),
      120
    );
    return () => clearTimeout(id);
  }, [finVideo, video]);

  // El botón fijo "Quiero registrarme" se oculta cuando el formulario ya está a la vista.
  useEffect(() => {
    const formulario = formularioRef.current;
    if (!formularioAbierto || !formulario) {
      setFormularioVisible(false);
      return;
    }
    const observador = new IntersectionObserver(([entrada]) => setFormularioVisible(entrada.isIntersecting), {
      threshold: 0.25,
    });
    observador.observe(formulario);
    return () => observador.disconnect();
  }, [formularioAbierto, enviado]);

  function conocerMas() {
    setSonido(true); // la persona acaba de tocar: se intenta con sonido
    setVideo(2);
    setFinVideo(false);
    setPreguntasAbiertas(false);
    setTimeout(() => desplazarA(zonaVideoRef.current), 60);
  }

  function repetirVideo() {
    reproductorRef.current?.repetir();
  }

  function alternarPreguntas() {
    const abrir = !preguntasAbiertas;
    setPreguntasAbiertas(abrir);
    if (abrir) setTimeout(() => desplazarA(preguntasRef.current), 80);
  }

  function abrirRegistro() {
    setFormularioAbierto(true);
    // Se espera a que el formulario exista en pantalla antes de bajar a él.
    setTimeout(() => {
      desplazarA(formularioRef.current);
      setTimeout(() => nombreRef.current?.focus({ preventScroll: true }), 450);
    }, 80);
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
    <div className="min-h-svh bg-[linear-gradient(180deg,#ffffff_0%,#f3f8fc_100%)] text-cm-tinta overflow-x-hidden">
      <header>
        <div className="mx-auto max-w-6xl px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <img src="/brand/logo-lockup-color.png" alt="Machtia" className="h-7 sm:h-10 w-auto" />
          <p className="text-right italic font-medium text-cm-navy text-[13px] sm:text-[21px] leading-tight">
            Aprende, Ayuda y Gana
          </p>
        </div>
      </header>

      {!enviado && <CuentaRegresiva />}

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-40">
        {!enviado ? (
          <>
            <div className="pt-8 sm:pt-12 text-center">
              <p className="text-[12.5px] sm:text-[18px] font-bold uppercase tracking-[0.28em] text-[#0aa9bb] mb-3">
                Conoce Machtia®
              </p>
              <h1 className="text-[30px] sm:text-[52px] font-extrabold leading-[1.1] text-cm-tinta">
                Descubre lo que puedes hacer con Machtia<sup className="text-[0.45em] align-super">®</sup>
              </h1>
              <p className="mt-3 sm:mt-4 mx-auto max-w-2xl text-slate-500 text-[16px] sm:text-[24px] leading-snug">
                Conoce cómo aprender, conectar y participar en nuestra comunidad.
              </p>
              <div aria-hidden="true" className="mx-auto mt-5 h-1 w-24 sm:w-36 rounded-full bg-cm-cian" />
              <p className="mt-5 inline-block rounded-full border border-cm-cian/60 bg-cm-cian/10 px-4 py-1.5 text-[13.5px] sm:text-[16px] text-cm-tinta">
                Te invita: <b className="font-bold">{invitadorNombre}</b>
              </p>
            </div>

            <div ref={zonaVideoRef} className="mt-6 sm:mt-8 scroll-mt-4">
              {video === 1 ? (
                <ReproductorVideo
                  key="bienvenida"
                  ref={reproductorRef}
                  src={VIDEO_BIENVENIDA}
                  poster={POSTER_BIENVENIDA}
                  titulo="Video de bienvenida"
                  modo="estricto"
                  inicioAutomatico
                  sonido={sonido}
                  onSonidoChange={alCambiarSonido}
                  onTerminar={alTerminarVideo}
                  onReiniciar={alReiniciarVideo}
                  onNoDisponible={alTerminarVideo}
                />
              ) : (
                <ReproductorVideo
                  key="presentacion"
                  ref={reproductorRef}
                  src={VIDEO_PRESENTACION}
                  poster={POSTER_PRESENTACION}
                  titulo="Video de presentación"
                  modo="libre"
                  inicioAutomatico
                  sonido={sonido}
                  onSonidoChange={alCambiarSonido}
                  onTerminar={alTerminarVideo}
                  onReiniciar={alReiniciarVideo}
                  onNoDisponible={alTerminarVideo}
                />
              )}
            </div>

            {/* Los botones de cada paso aparecen solo al terminar el video. */}
            {finVideo && (
              <div
                key={`acciones-${video}`}
                ref={accionesRef}
                className="aparece mt-6 sm:mt-8 flex flex-col items-center gap-4 scroll-mb-28"
              >
                {video === 1 ? (
                  <button type="button" onClick={conocerMas} className={BOTON_CIAN}>
                    Sí, quiero saber más
                    <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={alternarPreguntas}
                      aria-expanded={preguntasAbiertas}
                      className={BOTON_CIAN}
                    >
                      Preguntas frecuentes
                    </button>
                    <a
                      href={enlaceWhatsApp(invitadorParaAsesor)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={BOTON_AZUL}
                    >
                      <IconoWhatsApp />
                      Contactar a un asesor
                    </a>
                  </>
                )}
                <button type="button" onClick={repetirVideo} className={BOTON_ENLACE}>
                  <IconoRepetir />
                  Repetir video
                </button>
              </div>
            )}

            {video === 2 && finVideo && preguntasAbiertas && (
              <div ref={preguntasRef} className="aparece mt-8 scroll-mt-4">
                <AsistentePreguntas />
              </div>
            )}

            {/* El formulario sigue oculto hasta tocar "Quiero registrarme". */}
            {formularioAbierto && (
              <div
                id="registro"
                ref={formularioRef}
                className="aparece mt-10 scroll-mt-4 rounded-3xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(8,42,92,0.12)] p-6 sm:p-8"
              >
                <p className="text-[12px] font-bold text-[#0aa9bb] uppercase tracking-wide mb-1">
                  Comienza tu registro aquí
                </p>
                <h2 className="text-[22px] sm:text-[26px] font-extrabold text-cm-tinta mb-5">Preregistro</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Nombre</label>
                    <input
                      ref={nombreRef}
                      value={nombre}
                      onChange={(e) => validarNombre(e.target.value)}
                      placeholder="Ej. María"
                      autoComplete="given-name"
                      className="w-full h-[48px] px-3.5 rounded-xl bg-white border border-slate-300 text-cm-tinta text-[15px] placeholder:text-slate-400 outline-none focus:border-cm-cian focus:ring-2 focus:ring-cm-cian/30"
                    />
                    {errorNombre && <p className="text-red-600 text-[12.5px] mt-1">{errorNombre}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Correo electrónico</label>
                    <input
                      value={correo}
                      onChange={(e) => validarCorreo(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      inputMode="email"
                      autoComplete="email"
                      className="w-full h-[48px] px-3.5 rounded-xl bg-white border border-slate-300 text-cm-tinta text-[15px] placeholder:text-slate-400 outline-none focus:border-cm-cian focus:ring-2 focus:ring-cm-cian/30"
                    />
                    {errorCorreo && <p className="text-red-600 text-[12.5px] mt-1">{errorCorreo}</p>}
                  </div>

                  {errorEnvio && <p className="text-red-600 text-[13.5px]">{errorEnvio}</p>}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="min-h-[52px] rounded-2xl bg-cm-cian text-cm-navy text-[16px] font-extrabold mt-1 shadow-[0_8px_22px_rgba(31,224,238,0.35)] hover:brightness-95 disabled:opacity-60 transition"
                  >
                    {enviando ? 'Enviando...' : 'Continuar'}
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(8,42,92,0.12)] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-cm-cian/20 flex items-center justify-center mx-auto mb-4 text-[22px]">
              ✉️
            </div>
            <h2 className="text-[22px] font-extrabold text-cm-tinta mb-2">Revisa tu correo</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Te enviamos un correo de confirmación a <b>{correo}</b>. Al confirmarlo, vas a poder
              completar tu registro con tus datos, elegir tu suscripción y subir tu comprobante de pago.
            </p>
            {linkDesarrollo && (
              <div className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-300 text-left">
                <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide mb-1">
                  Modo desarrollo (Brevo no está conectado todavía)
                </p>
                <a href={linkDesarrollo} className="text-amber-800 text-[12px] underline break-all">
                  {linkDesarrollo}
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Botón fijo: siempre a la mano hasta que el formulario ya está a la vista. */}
      {!enviado && !formularioVisible && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 pointer-events-none bg-gradient-to-t from-white via-white/85 to-transparent">
          <button
            type="button"
            onClick={abrirRegistro}
            className="boton-registro-brillo pointer-events-auto w-full max-w-md h-14 rounded-2xl bg-cm-navy text-white text-[18px] font-extrabold tracking-wide"
          >
            Quiero registrarme
          </button>
        </div>
      )}
    </div>
  );
}
