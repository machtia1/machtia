'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Animate from './Animate';
import HeroBackground from './HeroBackground';

export default function LoginHero() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar sesión');
        return;
      }
      router.push('/home');
      router.refresh();
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <HeroBackground />

      <div className="relative z-10 h-full flex items-center justify-center px-5">
        <Animate delay={200} direction="scale" className="w-full max-w-[420px]">
          <div className="rounded-[28px] bg-[rgba(17,16,15,0.45)] backdrop-blur-[24px] border border-white/[0.08] p-8 sm:p-10">
            <Animate delay={0} direction="down" className="mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-cm-accent to-cm-primary" />
                <span className="text-white text-[22px] font-semibold leading-tight">
                  Club<br />Machtia
                </span>
              </div>
            </Animate>

            <Animate delay={150} direction="up">
              <h1 className="text-white text-[28px] sm:text-[32px] font-semibold leading-tight mb-2">
                Bienvenido de vuelta
              </h1>
              <p className="text-white/70 text-[14px] mb-8">
                Inicia sesión para continuar en tu cuenta
              </p>
            </Animate>

            <Animate delay={300} direction="up">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-white/80 text-[13px] font-medium mb-1.5">
                    Correo o nombre de usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full h-[46px] px-4 rounded-[10px] bg-white/[0.07] border border-white/10 text-white text-[14px] placeholder:text-white/30 outline-none focus:border-cm-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-[13px] font-medium mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-[46px] px-4 pr-11 rounded-[10px] bg-white/[0.07] border border-white/10 text-white text-[14px] placeholder:text-white/30 outline-none focus:border-cm-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-[13px] -mt-1">{error}</p>
                )}

                <div className="flex justify-end -mt-1">
                  <a href="#" className="text-cm-accent text-[13px] font-medium hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[48px] mt-2 rounded-[10px] bg-white text-cm-primaryDark text-[14px] font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Entrando...' : 'Iniciar sesión'}
                </button>
              </form>
            </Animate>

            <Animate delay={450} direction="up">
              <p className="text-center text-white/40 text-[12px] mt-6">
                Etapa 1 — Prototipo funcional · Club Machtia
              </p>
            </Animate>
          </div>
        </Animate>
      </div>
    </section>
  );
}
