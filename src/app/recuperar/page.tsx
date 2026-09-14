'use client';

import { useState } from 'react';

export default function RecuperarPage() {
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [linkDesarrollo, setLinkDesarrollo] = useState<string | undefined>();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const res = await fetch('/api/auth/solicitar-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo procesar la solicitud');
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

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cm-accent to-cm-primary" />
          <span className="font-semibold text-[16px]">Club Machtia</span>
        </div>

        <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-8">
          {!enviado ? (
            <>
              <h1 className="text-[20px] font-semibold mb-1">Recupera tu acceso</h1>
              <p className="text-white/60 text-[14px] mb-6">
                Escribe tu correo y te mandamos un link para crear o restablecer tu contraseña.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full h-11 px-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[14px] outline-none focus:border-cm-accent"
                />
                {error && <p className="text-red-400 text-[13px]">{error}</p>}
                <button
                  type="submit"
                  disabled={enviando}
                  className="h-11 rounded-lg bg-white text-cm-primaryDark text-[14px] font-semibold disabled:opacity-60"
                >
                  {enviando ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[20px] font-semibold mb-2">Revisa tu correo</h1>
              <p className="text-white/70 text-[14px] leading-relaxed">
                Si ese correo tiene una cuenta, te llegará un link para crear tu contraseña.
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
