'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAISES, ESTADOS_MEXICO, ladaPorPais } from '@/lib/ubicaciones';
import LoadingLogo from './LoadingLogo';

interface DatosPreregistro {
  nombre: string;
  correo: string;
  invitadorLinkId: string;
  esRestringido?: boolean;
}

const SUSCRIPCIONES = [
  { valor: 'BASICA', etiqueta: 'Básica' },
  { valor: 'PLUS', etiqueta: 'Plus' },
  { valor: 'NEGOCIOS', etiqueta: 'Negocios' },
] as const;

const SUSCRIPCIONES_RESTRINGIDO = [
  { valor: 'SOCIO_FUNDADOR', etiqueta: 'Socio Fundador' },
  { valor: 'ASOCIADO', etiqueta: 'Asociado' },
  { valor: 'PROFESOR_FACILITADOR', etiqueta: 'Profesor Facilitador' },
  { valor: 'ASISTENTE_ADMINISTRATIVO', etiqueta: 'Asistente Administrativo' },
] as const;

export default function RegistroCompleto({ token }: { token: string }) {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<DatosPreregistro | null>(null);
  const [errorCarga, setErrorCarga] = useState('');

  const [apellido, setApellido] = useState('');
  const [pais, setPais] = useState('México');
  const [estadoProvincia, setEstadoProvincia] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [suscripcion, setSuscripcion] = useState<string>('BASICA');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [completado, setCompletado] = useState(false);

  const ladaPais = ladaPorPais(pais);
  const opcionesSuscripcion = datos?.esRestringido ? SUSCRIPCIONES_RESTRINGIDO : SUSCRIPCIONES;

  useEffect(() => {
    fetch(`/api/preregistro/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorCarga(data.error || 'Enlace inválido');
          return;
        }
        setDatos(data);
        if (data.esRestringido) setSuscripcion(SUSCRIPCIONES_RESTRINGIDO[0].valor);
      })
      .catch(() => setErrorCarga('Error de conexión'))
      .finally(() => setCargando(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!apellido.trim()) return setError('Escribe tu apellido');
    if (!estadoProvincia.trim()) return setError('Escribe tu estado o provincia');
    if (!ciudad.trim()) return setError('Escribe tu ciudad');
    if (!telefono.trim()) return setError('Escribe tu teléfono');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (password !== confirmarPassword) return setError('Las contraseñas no coinciden');
    if (!comprobante) return setError('Sube tu comprobante de pago');

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('apellido', apellido.trim());
      formData.append('pais', pais);
      formData.append('ladaPais', ladaPais);
      formData.append('telefono', telefono.trim());
      formData.append('estadoProvincia', estadoProvincia.trim());
      formData.append('ciudad', ciudad.trim());
      formData.append('suscripcion', suscripcion);
      formData.append('password', password);
      formData.append('comprobante', comprobante);

      const res = await fetch('/api/registro', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo completar el registro');
        return;
      }

      setCompletado(true);
    } catch {
      setError('Error de conexión, intenta de nuevo');
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-svh bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,_#0f1a3d_0%,_#0a0e27_45%,_#060915_100%)] text-white flex items-center justify-center">
        <LoadingLogo label="Cargando..." className="[&_p]:text-white/70" />
      </div>
    );
  }

  if (errorCarga || !datos) {
    return (
      <div className="min-h-svh bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,_#0f1a3d_0%,_#0a0e27_45%,_#060915_100%)] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-[20px] font-semibold mb-2">No se pudo abrir tu registro</h1>
          <p className="text-white/60 text-[14px]">{errorCarga}</p>
        </div>
      </div>
    );
  }

  if (completado) {
    return (
      <div className="min-h-svh bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,_#0f1a3d_0%,_#0a0e27_45%,_#060915_100%)] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center rounded-3xl border border-white/10 bg-gradient-to-b from-[rgba(15,23,55,0.92)] to-[rgba(8,12,30,0.97)] backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-8">
          <div className="w-12 h-12 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22)_0%,transparent_72%)] flex items-center justify-center mx-auto mb-4 text-[22px]">
            ✅
          </div>
          <h1 className="text-[20px] font-semibold mb-2">¡Registro recibido!</h1>
          <p className="text-white/70 text-[14px] leading-relaxed mb-6">
            Un administrador va a revisar tu comprobante de pago y activar tu cuenta pronto. Te
            avisaremos por correo en cuanto esté lista.
          </p>
          <button
            onClick={() => router.push('/')}
            className="h-11 px-6 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#6366f1] text-white text-[14px] font-bold shadow-[0_8px_22px_rgba(56,189,248,0.3)]"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
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

      <div className="relative max-w-xl mx-auto px-6 py-14">
        <div className="flex items-center gap-2.5 mb-8">
          <img src="/brand/logo-lockup-white.png" alt="Club Machtia" className="h-7 w-auto" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7dd3fc] mb-1.5">
          Un paso más
        </p>
        <h1 className="text-[26px] font-bold mb-1">Completa tu registro, {datos.nombre}</h1>
        <p className="text-white/55 text-[14px] mb-8">{datos.correo}</p>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[rgba(15,23,55,0.92)] to-[rgba(8,12,30,0.97)] backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-6 sm:p-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Apellido</label>
            <input
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">País</label>
              <select
                value={pais}
                onChange={(e) => {
                  setPais(e.target.value);
                  setEstadoProvincia('');
                }}
                className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
              >
                {PAISES.map((p) => (
                  <option key={p.nombre} value={p.nombre} className="bg-[#0A0E27]">
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Estado / Provincia</label>
              {pais === 'México' ? (
                <select
                  value={estadoProvincia}
                  onChange={(e) => setEstadoProvincia(e.target.value)}
                  className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
                >
                  <option value="" className="bg-[#0A0E27]">Selecciona...</option>
                  {ESTADOS_MEXICO.map((e) => (
                    <option key={e} value={e} className="bg-[#0A0E27]">
                      {e}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={estadoProvincia}
                  onChange={(e) => setEstadoProvincia(e.target.value)}
                  placeholder="Tu estado o provincia"
                  className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Ciudad</label>
            <input
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Tu ciudad"
              className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Teléfono</label>
            <div className="flex gap-2">
              <div className="h-[46px] px-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-[14px] flex items-center">
                {ladaPais}
              </div>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="10 dígitos"
                className="flex-1 h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-2">Elige tu suscripción</label>
            <div className={`grid gap-2 ${opcionesSuscripcion.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {opcionesSuscripcion.map((s) => (
                <button
                  type="button"
                  key={s.valor}
                  onClick={() => setSuscripcion(s.valor)}
                  className={`h-11 rounded-xl text-[13px] font-semibold border transition-colors ${
                    suscripcion === s.valor
                      ? 'bg-gradient-to-br from-[#38bdf8] to-[#6366f1] text-white border-transparent shadow-[0_8px_22px_rgba(56,189,248,0.3)]'
                      : 'bg-white/5 border-white/[0.14] text-white/80'
                  }`}
                >
                  {s.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full h-[46px] px-3.5 rounded-xl bg-white/5 border border-white/[0.14] text-white text-[14px] outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wide text-white/45 mb-1.5">Comprobante de pago</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
              className="w-full text-[13px] text-white/70 file:mr-3 file:h-9 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-br file:from-[#38bdf8] file:to-[#6366f1] file:text-white file:text-[13px] file:font-semibold"
            />
            <p className="text-white/40 text-[11px] mt-1">Imagen o PDF, máximo 4 MB.</p>
          </div>

          {error && <p className="text-red-400 text-[13px]">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="h-12 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#6366f1] text-white text-[14.5px] font-bold mt-2 shadow-[0_8px_22px_rgba(56,189,248,0.3)] disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Completar registro'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
