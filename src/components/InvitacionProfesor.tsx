'use client';

import { useState } from 'react';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invitación sencilla para Profesor/Facilitador: sin videos, sin cuenta
 * regresiva y sin suscripción. Solo pide nombre y correo; después la persona
 * completa su registro desde el enlace que le llega por correo.
 */
export default function InvitacionProfesor({ token }: { token: string }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [linkDesarrollo, setLinkDesarrollo] = useState<string | undefined>();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) return setError('Escribe tu nombre');
    if (!CORREO_VALIDO.test(correo.trim())) return setError('Escribe un correo válido');

    setEnviando(true);
    try {
      const res = await fetch('/api/preregistro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          profesorToken: token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No se pudo completar el preregistro');
        return;
      }
      setLinkDesarrollo(data.linkDesarrollo);
      setEnviado(true);
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setEnviando(false);
    }
  }

  const campo =
    'w-full h-[50px] px-4 rounded-xl bg-white border border-slate-300 text-cm-tinta text-[15px] outline-none focus:border-cm-navy focus:ring-2 focus:ring-cm-cian/40';

  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#ffffff_0%,#f3f8fc_100%)] text-cm-tinta">
      <header className="mx-auto max-w-3xl px-5 h-16 sm:h-20 flex items-center">
        <img src="/brand/logo-lockup-color.png" alt="Machtia" className="h-9 sm:h-11 w-auto" />
      </header>

      <main className="mx-auto max-w-xl px-5 pb-16 pt-6 sm:pt-12">
        <p className="text-[12px] font-bold uppercase tracking-wide text-cm-navy/70 mb-2">
          Invitación
        </p>
        <h1 className="text-[28px] sm:text-[36px] font-extrabold leading-tight text-cm-tinta">
          Únete como Profesor/Facilitador
        </h1>
        <div className="mt-3 mb-5 h-1.5 w-16 rounded-full bg-cm-cian" />
        <p className="text-[15.5px] text-slate-600 mb-8">
          Escribe tu nombre y tu correo para comenzar tu registro. Es rápido y no necesitas
          subir pagos ni documentos.
        </p>

        {!enviado ? (
          <form
            onSubmit={enviar}
            className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(8,42,92,0.10)] p-6 sm:p-8 flex flex-col gap-4"
            noValidate
          >
            <div>
              <label htmlFor="prof-nombre" className="block text-[13px] font-semibold mb-1.5">
                Nombre
              </label>
              <input
                id="prof-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="given-name"
                className={campo}
              />
            </div>
            <div>
              <label htmlFor="prof-correo" className="block text-[13px] font-semibold mb-1.5">
                Correo electrónico
              </label>
              <input
                id="prof-correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
                className={campo}
              />
            </div>
            {error && (
              <p role="alert" className="text-red-600 text-[13.5px]">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={enviando}
              className="h-[52px] rounded-2xl bg-cm-navy text-white text-[16px] font-bold shadow-[0_10px_24px_rgba(8,42,92,0.25)] disabled:opacity-60"
            >
              {enviando ? 'Enviando...' : 'Continuar'}
            </button>
          </form>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(8,42,92,0.10)] p-8 text-center">
            <div className="text-[34px] mb-2">✅</div>
            <h2 className="text-[22px] font-extrabold mb-2">¡Revisa tu correo!</h2>
            <p className="text-slate-600 text-[15px]">
              Te enviamos un mensaje a <b>{correo}</b> con el enlace para completar tu registro.
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
    </div>
  );
}
