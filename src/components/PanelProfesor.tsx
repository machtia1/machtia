'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, DollarSign, Landmark, LogOut, User as UserIcon, Users } from 'lucide-react';
import LoadingLogo from './LoadingLogo';
import MisCursosProfesor from './MisCursosProfesor';
import PerfilProfesor from './PerfilProfesor';
import DatosBancarios from './DatosBancarios';

interface UsuarioProfesor {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  fotoPerfilUrl: string | null;
}

interface Ganancias {
  totalUsuarios: number;
  porcentaje: number;
  acumulado: number;
  iniciaEn: string;
  yaInicio: boolean;
}

type Seccion = 'ganancias' | 'cursos' | 'perfil' | 'banco';

const SECCIONES: { id: Seccion; etiqueta: string; icono: typeof DollarSign }[] = [
  { id: 'ganancias', etiqueta: 'Mis Ganancias', icono: DollarSign },
  { id: 'cursos', etiqueta: 'Mis Cursos', icono: BookOpen },
  { id: 'perfil', etiqueta: 'Mi perfil', icono: UserIcon },
  { id: 'banco', etiqueta: 'Datos bancarios', icono: Landmark },
];

const formatoMoneda = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

function fechaLarga(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });
}

/**
 * Panel del Profesor/Facilitador. A propósito NO muestra nada de la Red,
 * invitaciones ni regalías: solo Mis Ganancias, Mis Cursos y su perfil.
 */
export default function PanelProfesor({ user }: { user: UsuarioProfesor }) {
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>('ganancias');
  const [ganancias, setGanancias] = useState<Ganancias | null>(null);
  const [errorGanancias, setErrorGanancias] = useState(false);

  useEffect(() => {
    fetch('/api/profesor/ganancias')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setGanancias)
      .catch(() => setErrorGanancias(true));
  }, []);

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const nombreCompleto = `${user.nombre} ${user.apellido}`;

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#1C1E2B]">
      <header className="bg-white border-b border-[#E4E7EE]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <img src="/brand/logo-lockup-color.png" alt="Machtia" className="h-9 w-auto" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-right min-w-0 hidden sm:block">
              <div className="text-[13px] font-semibold truncate">{nombreCompleto}</div>
              <div className="text-[11px] font-bold text-cm-primary uppercase tracking-wide">
                Profesor/Facilitador
              </div>
            </div>
            <button
              onClick={cerrarSesion}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-red-600 border border-red-200 rounded-lg px-3 py-1.5"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-5xl px-4 sm:px-6 flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`shrink-0 flex items-center gap-1.5 text-[13.5px] font-semibold px-4 py-2 rounded-full border whitespace-nowrap ${
                seccion === s.id
                  ? 'bg-cm-primary text-white border-cm-primary'
                  : 'bg-white text-[#1C1E2B] border-[#E4E7EE] hover:bg-[#F4F6FB]'
              }`}
            >
              <s.icono size={15} />
              {s.etiqueta}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-[22px] font-semibold mb-1">Hola, {user.nombre} 👋</h1>
        <p className="text-[#6B7280] text-[14px] mb-6">
          Bienvenido a tu espacio de Profesor/Facilitador.
        </p>

        {seccion === 'ganancias' && (
          <section aria-label="Mis Ganancias" className="grid sm:grid-cols-2 gap-4">
            {!ganancias && !errorGanancias && (
              <div className="sm:col-span-2">
                <LoadingLogo size={28} label="Cargando..." />
              </div>
            )}
            {errorGanancias && (
              <p className="sm:col-span-2 text-[13px] text-red-600">
                No se pudieron cargar tus ganancias. Intenta de nuevo más tarde.
              </p>
            )}
            {ganancias && (
              <>
                <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6">
                  <div className="flex items-center gap-2 text-[#6B7280] text-[12px] font-bold uppercase tracking-wide mb-2">
                    <Users size={15} /> Usuarios en la plataforma
                  </div>
                  <div data-testid="total-usuarios" className="text-[40px] font-extrabold leading-none">
                    {ganancias.totalUsuarios.toLocaleString('es-MX')}
                  </div>
                  <p className="text-[12.5px] text-[#6B7280] mt-2">
                    Total de usuarios activos de la plataforma.
                  </p>
                </div>

                <div className="bg-white border border-[#E4E7EE] rounded-2xl p-6">
                  <div className="flex items-center gap-2 text-[#6B7280] text-[12px] font-bold uppercase tracking-wide mb-2">
                    <DollarSign size={15} /> Ganancias acumuladas
                  </div>
                  <div data-testid="acumulado" className="text-[40px] font-extrabold leading-none text-cm-primary">
                    {formatoMoneda(ganancias.acumulado)}
                  </div>
                  <p className="text-[12.5px] text-[#6B7280] mt-2">
                    {ganancias.yaInicio
                      ? 'Se calcula con un porcentaje sobre el total de usuarios.'
                      : `Empiezan a acumularse a partir del ${fechaLarga(ganancias.iniciaEn)}.`}
                  </p>
                </div>
              </>
            )}
          </section>
        )}

        {seccion === 'cursos' && <MisCursosProfesor userId={user.id} />}

        {seccion === 'banco' && <DatosBancarios />}

        {seccion === 'perfil' && (
          <PerfilProfesor userId={user.id} nombreInicial={nombreCompleto} correo={user.correo} />
        )}
      </main>
    </div>
  );
}
