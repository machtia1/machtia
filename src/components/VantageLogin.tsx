'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Briefcase, Check, Eye, EyeOff, GraduationCap, Lock, Users } from 'lucide-react';

/**
 * Rediseño del Login pedido por el cliente el 20 sept 2026 — replica
 * exactamente el diseño y la animación del video de ejemplo que
 * mandó (fondo azul marino oscuro, escudo/copo de nieve animado con
 * 4 íconos orbitando alrededor, tarjeta de acceso tipo "hoja
 * deslizante" con el formulario). Mismo diseño y misma animación
 * tanto en celular como en computadora — en computadora la tarjeta
 * se acomoda a un lado en vez de ocupar todo el ancho, porque un
 * diseño de "hoja inferior" estirado a pantalla completa se vería
 * roto, pero todos los elementos visuales (colores, animación,
 * textos, tarjeta) son los mismos.
 *
 * Los 4 íconos que orbitan representan las secciones reales del menú
 * (pedido por el cliente el 20 sept 2026, "iconitos relacionados al
 * menú"): Mi Oficina, Mi Red, Cursos y Universidad Machtia®.
 *
 * Toda la funcionalidad que ya tenía el login se conserva tal cual:
 * correo + contraseña, mostrar/ocultar contraseña, mensaje de error,
 * estado de carga, link "¿Olvidaste tu contraseña?" → /recuperar, y
 * el POST a /api/auth/login que redirige a /home.
 */
export default function VantageLogin() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      // Igual que en el video de ejemplo: el botón muestra "Acceso
      // confirmado" un instante antes de entrar, en vez de saltar
      // directo a la siguiente pantalla.
      setSuccess(true);
      window.setTimeout(() => {
        router.push('/home');
        router.refresh();
      }, 650);
    } catch {
      setError('Error de conexión, intenta de nuevo');
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="bg-glow" aria-hidden="true" />

      {/* ---------- HEADER ---------- */}
      <header className="header">
        <a href="#" className="brand" aria-label="Club Machtia — inicio">
          <img
            src="/brand/logo-lockup-white.png"
            alt="Club Machtia"
            className="brand-logo"
            width={73}
            height={28}
          />
        </a>
        <a href="mailto:contacto@machtiaeducacion.com" className="help-link">
          Ayuda
        </a>
      </header>

      <div className="content">
        {/* ---------- IDENTIDAD ANIMADA ---------- */}
        <section className="hero">
          <div className="orbit-stage" aria-hidden="true">
            <div className="ring ring-outer" />
            <div className="ring ring-inner" />

            <div className="orbit-group">
              {[Briefcase, Users, BookOpen, GraduationCap].map((Icon, i) => (
                <div key={i} className={`orbit-item orbit-item-${i}`}>
                  <div className="orbit-badge">
                    <Icon size={16} />
                  </div>
                </div>
              ))}
            </div>

            <div className="crest">
              <img
                src="/brand/icon-color.png"
                alt=""
                className="crest-icon"
                width={56}
                height={56}
              />
            </div>
          </div>

          <p className="eyebrow">Una sola cuenta</p>
          <h1 className="headline">
            Todo conectado.
            <br />
            Todo en Machtia.
          </h1>
          <p className="subcopy">
            Una experiencia integrada para aprender, conectar y crecer desde cualquier lugar.
          </p>
        </section>

        {/* ---------- TARJETA DE ACCESO ---------- */}
        <section className="card">
          <div className="card-handle" aria-hidden="true" />
          <div className="card-inner">
            <p className="card-eyebrow">Acceso seguro</p>
            <h2 className="card-title">Bienvenido de vuelta</h2>
            <p className="card-subtitle">Continúa en tu cuenta Club Machtia.</p>

            <form onSubmit={handleSubmit} className="card-form">
              <label className="field-label" htmlFor="emailField">
                Correo electrónico
              </label>
              <input
                id="emailField"
                type="text"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="nombre@correo.com"
                className="field-input"
                autoComplete="username"
              />

              <label className="field-label" htmlFor="passField">
                Contraseña
              </label>
              <div className="pass-wrap">
                <input
                  id="passField"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="field-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <a href="/recuperar" className="forgot">
                ¿Olvidaste tu contraseña?
              </a>

              {error && <p className="error-msg">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className={`submit-btn ${success ? 'is-success' : ''}`}
              >
                {success ? (
                  <>
                    <Check size={16} /> Acceso confirmado
                  </>
                ) : loading ? (
                  'Entrando...'
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>

            <div className="secure-note">
              <Lock size={11} />
              Conexión protegida
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .page {
          min-height: 100svh;
          background: radial-gradient(ellipse 90% 60% at 50% 0%, #0f1a3d 0%, #0a0e27 45%, #060915 100%);
          color: #fff;
          font-family: 'Century Gothic', 'League Spartan', Arial, sans-serif;
          position: relative;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        .bg-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.16) 0%, transparent 55%),
            radial-gradient(circle at 85% 85%, rgba(99, 102, 241, 0.12) 0%, transparent 50%);
          pointer-events: none;
        }

        .header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          animation: fade-down 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .brand-logo {
          height: 28px;
          width: auto;
          display: block;
        }

        .help-link {
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
        }
        .help-link:hover {
          color: #fff;
        }

        .content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 20px 0;
        }

        /* ---------- Identidad animada (escudo + íconos orbitando) ---------- */
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-top: 8px;
          animation: fade-up 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 120ms;
        }

        .orbit-stage {
          position: relative;
          width: 220px;
          height: 190px;
          margin-bottom: 18px;
        }

        .ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          border: 1px solid rgba(103, 179, 255, 0.28);
          transform: translate(-50%, -50%);
        }
        .ring-outer {
          width: 210px;
          height: 120px;
          box-shadow: 0 0 26px rgba(56, 189, 248, 0.12) inset;
        }
        .ring-inner {
          width: 130px;
          height: 130px;
          border-color: rgba(103, 179, 255, 0.4);
        }

        .crest {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 84px;
          height: 84px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 72%);
        }
        .crest-icon {
          width: 56px;
          height: 56px;
          filter: brightness(0) invert(1);
          animation: pulse-glow 2.6s ease-in-out infinite;
        }

        .orbit-group {
          position: absolute;
          inset: 0;
          animation: orbit-spin 20s linear infinite;
        }
        .orbit-item {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 0;
        }
        .orbit-item-0 { transform: rotate(0deg) translateX(105px); }
        .orbit-item-1 { transform: rotate(90deg) translateX(65px); }
        .orbit-item-2 { transform: rotate(180deg) translateX(105px); }
        .orbit-item-3 { transform: rotate(270deg) translateX(65px); }

        .orbit-badge {
          transform: translate(-50%, -50%);
          animation: orbit-spin-reverse 20s linear infinite;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(147, 197, 253, 0.55);
          background: rgba(10, 20, 50, 0.75);
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #dbeafe;
        }

        .eyebrow {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #7dd3fc;
        }

        .headline {
          margin: 0 0 10px;
          font-family: 'Montserrat', 'Century Gothic', Arial, sans-serif;
          font-weight: 700;
          font-size: clamp(24px, 6vw, 32px);
          line-height: 1.18;
          letter-spacing: -0.01em;
        }

        .subcopy {
          margin: 0;
          max-width: 320px;
          color: rgba(255, 255, 255, 0.62);
          font-size: 14px;
          line-height: 1.5;
        }

        /* ---------- Tarjeta de acceso ---------- */
        .card {
          width: 100%;
          max-width: 440px;
          margin: 28px 0 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px 24px 0 0;
          background: linear-gradient(180deg, rgba(15, 23, 55, 0.92), rgba(8, 12, 30, 0.97));
          box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(56, 189, 248, 0.06) inset;
          backdrop-filter: blur(18px);
          animation: slide-up-sheet 750ms cubic-bezier(0.19, 1, 0.22, 1) both;
          animation-delay: 220ms;
        }

        .card-handle {
          width: 40px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.22);
          margin: 12px auto 0;
        }

        .card-inner {
          padding: 22px 26px 26px;
        }

        .card-eyebrow {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #7dd3fc;
        }

        .card-title {
          margin: 0 0 4px;
          font-size: 21px;
          font-weight: 700;
          color: #fff;
        }

        .card-subtitle {
          margin: 0 0 18px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
        }

        .card-form {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 6px;
        }
        .field-label:not(:first-child) {
          margin-top: 14px;
        }

        .field-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
          outline: none;
        }
        .field-input::placeholder {
          color: rgba(255, 255, 255, 0.32);
        }
        .field-input:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
        }

        .pass-wrap {
          position: relative;
        }
        .pass-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: none;
          background: #2563eb;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .forgot {
          align-self: flex-end;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.55);
          text-decoration: none;
        }
        .forgot:hover {
          color: #7dd3fc;
        }

        .error-msg {
          margin: 10px 0 0;
          color: #fca5a5;
          font-size: 12.5px;
        }

        .submit-btn {
          margin-top: 18px;
          height: 48px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: #fff;
          font-weight: 700;
          font-size: 14.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 22px rgba(56, 189, 248, 0.3);
        }
        .submit-btn:disabled {
          opacity: 0.85;
          cursor: default;
        }
        .submit-btn.is-success {
          background: linear-gradient(135deg, #34d399, #10b981);
          box-shadow: 0 8px 22px rgba(16, 185, 129, 0.35);
        }

        .secure-note {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        button, a { transition: filter 140ms, opacity 140ms, color 140ms; }
        button:hover { filter: brightness(1.06); }
        button:focus-visible, a:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-spin-reverse {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up-sheet {
          from { opacity: 0; transform: translateY(36px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .header, .hero, .card, .crest-icon, .orbit-group, .orbit-badge {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        /* ---------- Computadora / pantallas anchas ---------- */
        @media (min-width: 900px) {
          .header {
            padding: 28px 48px;
          }

          .content {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 72px;
            padding: 20px 48px 60px;
            max-width: 1180px;
            margin: 0 auto;
            min-height: calc(100svh - 84px);
          }

          .hero {
            align-items: flex-start;
            text-align: left;
            max-width: 460px;
          }

          .orbit-stage {
            align-self: center;
          }

          .subcopy {
            max-width: 400px;
          }

          .card {
            margin: 0;
            max-width: 400px;
            border-radius: 24px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 189, 248, 0.06) inset;
          }

          .card-handle {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
