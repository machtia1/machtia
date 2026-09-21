'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingLogo from './LoadingLogo';

export default function RestablecerPassword({ token }: { token: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');
  const [errorCarga, setErrorCarga] = useState('');

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/restablecer/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorCarga(data.error || 'Link inválido');
          return;
        }
        setNombre(data.nombre);
      })
      .catch(() => setErrorCarga('Error de conexión'))
      .finally(() => setCargando(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (password !== confirmar) return setError('Las contraseñas no coinciden');

    setEnviando(true);
    try {
      const res = await fetch(`/api/auth/restablecer/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar la contraseña');
        return;
      }
      setListo(true);
      setTimeout(() => router.push('/'), 2000);
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center">
        <LoadingLogo label="Cargando..." className="[&_p]:text-white/70" />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-[20px] font-semibold mb-2">Link inválido</h1>
          <p className="text-white/60 text-[14px] mb-4">{errorCarga}</p>
          <a href="/recuperar" className="text-cm-accent text-[14px] underline">
            Pedir un link nuevo
          </a>
        </div>
      </div>
    );
  }

  if (listo) {
    return (
      <div className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-[20px] font-semibold mb-2">¡Contraseña actualizada!</h1>
          <p className="text-white/60 text-[14px]">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <img src="/brand/logo-lockup-white.png" alt="Club Machtia" className="h-8 w-auto" />
        </div>

        <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-8">
          <h1 className="text-[20px] font-semibold mb-1">Hola, {nombre}</h1>
          <p className="text-white/60 text-[14px] mb-6">Crea tu nueva contraseña.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña (mínimo 8 caracteres)"
              className="w-full h-11 px-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[14px] outline-none focus:border-cm-accent"
            />
            <input
              type="password"
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Confirma tu contraseña"
              className="w-full h-11 px-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[14px] outline-none focus:border-cm-accent"
            />
            {error && <p className="text-red-400 text-[13px]">{error}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="h-11 rounded-lg bg-white text-cm-primaryDark text-[14px] font-semibold disabled:opacity-60"
            >
              {enviando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
