'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Menu, X } from 'lucide-react';

export default function VantageLogin() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
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
    <main className="viewport">
      <section className="screen">
        {!videoFailed && (
          <video
            className="background"
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            aria-hidden="true"
            src="/videos/hero-bg.mp4"
            onError={() => setVideoFailed(true)}
          />
        )}
        <div className="vignette" />

        {/* ---------- HEADER ---------- */}
        <header className={`header ${menuOpen ? 'menu-open' : ''}`}>
          <a href="#" className="brand" aria-label="Club Machtia — inicio">
            <div className="brand-mark" />
            <span className="brand-name">Club Machtia</span>
          </a>

          <div className="header-actions" id="tablet-navigation">
            <nav className="nav">
              <a href="#" className="active">Inicio</a>
              <a href="#">Cursos</a>
              <a href="#">Red</a>
              <a href="#">Contacto</a>
            </nav>

            <div className="time-panel">
              <label>Campaña</label>
              <span>Lanzamiento&nbsp; • &nbsp;20 oct 2027</span>
            </div>

            <button className="sign-up" onClick={() => document.getElementById('emailField')?.focus()}>
              Crear cuenta
            </button>
          </div>

          <button
            className="menu-toggle"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {/* ---------- HERO ---------- */}
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="line line-one">
                <span className="line-reveal">Aprende y crece</span>
              </span>
              <span className="line line-two">
                <span className="line-reveal">en una sola red.</span>
              </span>
            </h1>

            <p className="hero-copy">
              Tus cursos, tu red de referidos y tu progreso estaban repartidos
              en distintos lugares. Club Machtia lo reúne todo en un solo
              lugar, para que dejes de buscar y empieces a avanzar.
            </p>

            <button
              className="primary-cta"
              onClick={() => document.getElementById('emailField')?.focus()}
            >
              <span className="label">Empezar ahora</span>
              <span className="arrow-box">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7H12M12 7L7.5 2.5M12 7L7.5 11.5" stroke="white" strokeWidth="1.4" />
                </svg>
              </span>
            </button>
          </div>

          {/* ---------- TARJETA GLASS: LOGIN REAL ---------- */}
          <article className="demo-card">
            <div className="card-inner">
              <p className="card-eyebrow">Bienvenido de vuelta</p>
              <h2 className="card-title">Inicia sesión</h2>

              <form onSubmit={handleSubmit} className="card-form">
                <input
                  id="emailField"
                  type="text"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="Correo o usuario"
                  className="card-input"
                />
                <div className="pass-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="card-input"
                  />
                  <button
                    type="button"
                    className="pass-toggle"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {error && (
                  <p style={{ color: '#ff8080', fontSize: '12px', margin: '-2px 0 0' }}>{error}</p>
                )}

                <a href="/recuperar" className="forgot">¿Olvidaste tu contraseña?</a>

                <button type="submit" disabled={loading} className="watch-button">
                  {loading ? 'Entrando...' : 'Iniciar sesión'}
                </button>
              </form>
            </div>
          </article>
        </section>
      </section>

      <style jsx>{`
        :root {
          font-family: 'Inter', Arial, sans-serif;
        }

        .viewport {
          position: fixed;
          inset: 0;
          isolation: isolate;
          background: #000;
          overflow: hidden;
        }

        .screen {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: #000;
          --gutter-start: clamp(24px, 4.177vw, 96px);
          --gutter-end: clamp(24px, 4.04vw, 96px);
          --header-top: clamp(20px, 2.264vh, 30px);
          --hero-bottom: clamp(28px, 5.19vh, 64px);
          --display-size: clamp(40px, 7.2vh, 84px);
          --display-leading: clamp(50px, 8.6vh, 98px);
          --copy-size: clamp(14px, 1.7vh, 18px);
          --copy-leading: clamp(19px, 2.1vh, 24px);
          --card-width: clamp(230px, 26vh, 300px);
        }

        .background {
          position: absolute;
          inset: 0;
          z-index: -3;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          pointer-events: none;
        }

        .vignette {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(180deg, rgba(0,0,0,.35), rgba(10,14,39,.15) 30%, rgba(10,14,39,.15) 78%, rgba(0,0,0,.55)),
            radial-gradient(ellipse at 44% 54%, transparent 25%, rgba(0,0,0,.35) 100%);
        }

        .header {
          position: absolute;
          top: var(--header-top);
          left: var(--gutter-start);
          right: var(--gutter-end);
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          white-space: nowrap;
          animation: entrance-nav 520ms cubic-bezier(.16,1,.3,1) both;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .brand-mark {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: conic-gradient(from 45deg, #38B6E0, #2C2A8C);
          box-shadow: 0 1px 2px rgba(0,0,0,.3);
        }

        .brand-name {
          color: #fff;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: -0.02em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: clamp(24px, 2.9vw, 40px);
        }

        .nav {
          display: flex;
          gap: clamp(20px, 2.4vw, 34px);
        }

        .nav a {
          color: rgba(229,229,230,.77);
          text-decoration: none;
          font-size: 14px;
          font-weight: 450;
          letter-spacing: -.02em;
          text-shadow: 0 1px 3px rgba(0,0,0,.55);
          position: relative;
          padding-bottom: 4px;
        }

        .nav a.active {
          color: #fff;
        }

        .nav a.active::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,.82);
        }

        .time-panel {
          display: none;
          padding-left: 12px;
          border-left: 2px solid rgba(230,230,230,.35);
        }

        .time-panel label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: rgba(240,240,240,.6);
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .time-panel span {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,.9);
        }

        @media (min-width: 900px) {
          .time-panel { display: block; }
        }

        .sign-up {
          background: #fff;
          color: #101010;
          border: none;
          height: 40px;
          padding: 0 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: -.02em;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.72), 0 1px 5px rgba(0,0,0,.34);
          cursor: pointer;
        }

        .menu-toggle {
          display: none;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(10,7,7,.35);
          backdrop-filter: blur(14px);
          color: #fff;
        }

        @media (max-width: 640px) {
          .header-actions { display: none; }
          .menu-toggle { display: flex; }

          .header.menu-open .header-actions {
            display: flex;
            position: absolute;
            top: 56px;
            right: 0;
            left: auto;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 20px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,.13);
            background: linear-gradient(145deg, rgba(24,22,20,.9), rgba(5,12,14,.94));
            backdrop-filter: blur(18px) saturate(108%);
            min-width: 200px;
          }
          .header.menu-open .nav { flex-direction: column; gap: 12px; }
          .header.menu-open .time-panel { display: block; border: none; padding: 0; }
        }

        .hero {
          position: absolute;
          inset: 0;
        }

        .hero-content {
          position: absolute;
          left: var(--gutter-start);
          bottom: var(--hero-bottom);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 560px;
          padding: 24px 28px 24px 0;
          background: radial-gradient(
            ellipse 130% 110% at 0% 100%,
            rgba(0,0,0,.68) 0%,
            rgba(0,0,0,.46) 45%,
            rgba(0,0,0,.15) 75%,
            transparent 100%
          );
        }

        .hero-title {
          margin: 0;
          font-family: 'Manrope', 'Inter', Arial, sans-serif;
          font-weight: 600;
          font-size: var(--display-size);
          line-height: var(--display-leading);
          letter-spacing: -.03em;
          text-shadow: 0 2px 6px rgba(0,0,0,.85), 0 8px 24px rgba(0,0,0,.6);
        }

        .line {
          display: block;
          overflow: hidden;
        }

        .line-one { color: #fff; }
        .line-two { color: rgba(226,222,222,.92); }

        .line-reveal {
          display: block;
          animation: entrance-line 800ms cubic-bezier(.22,1,.36,1) both;
        }

        .line-one .line-reveal { animation-delay: 260ms; }
        .line-two .line-reveal { animation-delay: 400ms; }

        .hero-copy {
          margin: clamp(14px, 2vh, 22px) 0 0;
          color: rgba(255,255,255,.94);
          font-weight: 450;
          font-size: var(--copy-size);
          line-height: var(--copy-leading);
          max-width: 440px;
          text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 2px 12px rgba(0,0,0,.6);
          animation: entrance-copy 620ms cubic-bezier(.16,1,.3,1) both;
          animation-delay: 700ms;
        }

        .primary-cta {
          margin-top: clamp(20px, 3vh, 32px);
          position: relative;
          display: flex;
          align-items: center;
          height: 46px;
          padding: 0 8px 0 22px;
          border: none;
          border-radius: 8px;
          background: #fff;
          color: #111;
          box-shadow: 0 1px 5px rgba(0,0,0,.38);
          font-weight: 550;
          font-size: 14px;
          letter-spacing: -.02em;
          cursor: pointer;
          gap: 14px;
          animation: entrance-action 560ms cubic-bezier(.16,1,.3,1) both;
          animation-delay: 900ms;
        }

        .primary-cta .arrow-box {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: #070909;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .demo-card {
          position: absolute;
          right: var(--gutter-end);
          bottom: var(--hero-bottom);
          width: var(--card-width);
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(24,22,20,.80), rgba(5,12,14,.86));
          box-shadow: 0 2px 10px rgba(0,0,0,.44), 0 0 0 3px rgba(255,255,255,.035) inset, 0 0 0 1px rgba(0,0,0,.9);
          backdrop-filter: blur(14px) saturate(108%);
          animation: entrance-card 920ms cubic-bezier(.22,1,.36,1) both;
          animation-delay: 1000ms;
        }

        .card-inner {
          padding: 22px;
        }

        .card-eyebrow {
          margin: 0 0 2px;
          color: rgba(255,255,255,.55);
          font-size: 11px;
          font-weight: 500;
        }

        .card-title {
          margin: 0 0 16px;
          color: #fff;
          font-size: 18px;
          font-weight: 650;
        }

        .card-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .card-input {
          height: 40px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.06);
          color: #fff;
          font-size: 13px;
          outline: none;
        }

        .card-input::placeholder { color: rgba(255,255,255,.35); }
        .card-input:focus { border-color: rgba(108,140,255,.7); }

        .pass-wrap { position: relative; }

        .pass-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,.5);
        }

        .forgot {
          font-size: 11.5px;
          color: rgba(255,255,255,.55);
          text-decoration: none;
          align-self: flex-end;
          margin-top: -2px;
        }

        .watch-button {
          margin-top: 6px;
          height: 42px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.21);
          background: linear-gradient(145deg, rgba(26,34,36,.86), rgba(16,29,33,.9));
          color: #fff;
          font-weight: 500;
          font-size: 13.5px;
          cursor: pointer;
        }

        button, a { transition: filter 140ms, opacity 140ms; }
        button:hover, a:hover { filter: brightness(1.08); }
        button:focus-visible, a:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

        @keyframes entrance-nav {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes entrance-line {
          from { transform: translate3d(0,110%,0) skewY(2deg); }
          to   { transform: translate3d(0,0,0) skewY(0deg); }
        }
        @keyframes entrance-copy {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes entrance-action {
          from { opacity: 0; transform: translateY(8px) scale(.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes entrance-card {
          from { opacity: 0; transform: translateY(12px) scale(.968); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .header, .line-reveal, .hero-copy, .primary-cta, .demo-card {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        @media (max-width: 900px) {
          .hero { display: flex; flex-direction: column; justify-content: flex-end; }
          .demo-card {
            position: static;
            margin: 0 var(--gutter-start) 20px;
            width: auto;
          }
          .hero-content {
            position: static;
            padding: 20px var(--gutter-start) 24px;
            margin: 0 calc(var(--gutter-start) * -1);
            max-width: none;
            background: linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.55) 40%, rgba(0,0,0,.72));
          }
        }
      `}</style>
    </main>
  );
}
