'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, ChevronRight, Copy, Menu } from 'lucide-react';

type Role = 'administrador' | 'profesor' | 'socio' | 'usuario' | 'asistente';

const ROLE_LABELS: Record<Role, string> = {
  administrador: 'Administrador',
  profesor: 'Profesor Facilitador',
  socio: 'Socio',
  usuario: 'Usuario · Plus',
  asistente: 'Asistente Administrativo',
};

const ROLE_NOTES: Record<Role, string> = {
  administrador:
    'Sesión de Administrador: acceso completo a datos, estadísticas, aprobación de registros y notificaciones directas.',
  profesor:
    'Sesión de Profesor Facilitador: puedes subir material, editar evaluaciones y moderar el foro de tus cursos.',
  socio: 'Sesión de Socio: puedes crear cursos o talleres dentro de tus Espacios Reservados.',
  usuario:
    'Sesión de Usuario: la opción de crear cursos aparece visible pero permanecerá inactiva hasta diciembre de 2026.',
  asistente:
    'Sesión de Asistente Administrativo: puedes editar anuncios, revisar contenido y moderar foros.',
};

const NAV_SECTIONS: { label: string; children?: { label: string; href?: string }[] }[] = [
  {
    label: 'Mi Oficina',
    children: [
      { label: 'Mi Red', href: '/home/red-usuarios' },
      { label: 'Red 2x15', href: '/home/red-usuarios' },
      { label: 'Mi Suscripción', href: '/home/mi-oficina/suscripcion' },
      { label: 'Mis Logros', href: '/home/mi-oficina/logros' },
      { label: 'Mis Ganancias', href: '/home/mi-oficina/ganancias' },
    ],
  },
  { label: 'Cursos' },
  { label: 'Talleres' },
  { label: 'Biblioteca Digital' },
  {
    label: 'Universidad Machtia®',
    children: [{ label: 'Primaria' }, { label: 'Secundaria' }, { label: 'Preparatoria' }, { label: 'Licenciaturas' }],
  },
  {
    label: 'Eventos especiales',
    children: [
      { label: 'Cursos Presenciales' },
      { label: 'Seminarios Online' },
      { label: 'Diplomados' },
      { label: 'Convenciones' },
    ],
  },
  { label: 'SEP-Conocer' },
  { label: 'Romi®' },
  {
    label: 'Servicios Digitales',
    children: [
      { label: 'Pago de Servicios' },
      { label: 'Recargas telefónicas' },
      { label: 'Seguros Médicos y de Vida' },
      { label: 'Autofinanciamiento' },
    ],
  },
  { label: 'Sorteos' },
  { label: 'Fundación Machtia®' },
  { label: 'Negocios y Alianzas' },
];

function useCountdown(target: string) {
  const [text, setText] = useState('calculando…');
  useEffect(() => {
    const targetDate = new Date(target).getTime();
    function tick() {
      const diff = targetDate - Date.now();
      if (diff <= 0) return setText('¡Campaña activa!');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      setText(`${d}d ${h}h ${m}m`);
    }
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [target]);
  return text;
}

interface SessionUser {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'ADMINISTRADOR' | 'PROFESOR_FACILITADOR' | 'SOCIO' | 'USUARIO' | 'ASISTENTE_ADMINISTRATIVO';
  linkInvitacion: string;
}

function mapRol(rol: SessionUser['rol']): Role {
  switch (rol) {
    case 'ADMINISTRADOR':
      return 'administrador';
    case 'PROFESOR_FACILITADOR':
      return 'profesor';
    case 'SOCIO':
      return 'socio';
    case 'ASISTENTE_ADMINISTRATIVO':
      return 'asistente';
    default:
      return 'usuario';
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const countdown = useCountdown('2027-10-20T00:00:00');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/');
          return;
        }
        setUser(data.user);
      })
      .finally(() => setLoadingUser(false));
  }, [router]);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6FB] text-[#1C1E2B] text-[14px]">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const role = mapRol(user.rol);
  const nombreCompleto = `${user.nombre} ${user.apellido}`;
  const primeraLetra = user.nombre.charAt(0).toUpperCase();
  const linkInvitacion = `machtiaeducacion.com/invitacion/${user.linkInvitacion}`;

  return (
    <div className="flex min-h-screen bg-[#F4F6FB] text-[#1C1E2B]">
      {/* Sidebar */}
      <aside
        className={`w-[264px] bg-white border-r border-[#E4E7EE] p-4 fixed lg:sticky top-0 h-screen overflow-y-auto z-30 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center px-2 pb-5">
          <img src="/brand/logo-lockup-color.png" alt="Club Machtia" className="h-9 w-auto" />
        </div>

        <div className="bg-[#F4F6FB] rounded-[10px] px-3 py-2.5 mb-4">
          <div className="text-[13px] font-semibold">{nombreCompleto}</div>
          <div className="text-[11px] font-bold text-cm-primary uppercase tracking-wide">
            {ROLE_LABELS[role]}
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          <a className="rounded-lg bg-cm-primary text-white text-[14px] font-medium px-3 py-2.5">
            Inicio
          </a>

          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <button
                onClick={() =>
                  setOpenSection(openSection === section.label ? null : section.label)
                }
                className="w-full flex items-center justify-between rounded-lg hover:bg-[#F4F6FB] text-[14px] font-medium px-3 py-2.5 text-left"
              >
                {section.label}
                {section.children && (
                  <ChevronRight
                    size={13}
                    className={`text-[#6B7280] transition-transform ${
                      openSection === section.label ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </button>
              {section.children && openSection === section.label && (
                <div className="pl-4 flex flex-col">
                  {section.children.map((child) =>
                    child.href ? (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="text-[13px] text-[#6B7280] hover:text-[#1C1E2B] hover:bg-[#F4F6FB] rounded-md px-3 py-2"
                      >
                        {child.label}
                      </Link>
                    ) : (
                      <a
                        key={child.label}
                        href="#"
                        className="text-[13px] text-[#6B7280] hover:text-[#1C1E2B] hover:bg-[#F4F6FB] rounded-md px-3 py-2"
                      >
                        {child.label}
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

          {role === 'administrador' && (
            <Link
              href="/home/red-general"
              className="mt-3 pt-3 border-t border-[#E4E7EE] rounded-lg text-cm-primary font-bold text-[14px] px-3 py-2.5 block"
            >
              Panel de Administrador
            </Link>
          )}
          {role === 'administrador' && (
            <Link
              href="/home/aprobaciones"
              className="rounded-lg text-cm-primary font-bold text-[14px] px-3 py-2.5 block"
            >
              Aprobar registros
            </Link>
          )}
          {(role === 'profesor' || role === 'socio') && (
            <a className="rounded-lg hover:bg-[#F4F6FB] text-[14px] font-medium px-3 py-2.5">
              Crear contenido
            </a>
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-[#E4E7EE] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <button className="lg:hidden" onClick={() => setSidebarOpen((v) => !v)}>
              <Menu size={20} />
            </button>
            <Link href="/home/mi-oficina/ganancias" className="text-[14px] font-semibold text-cm-primary hidden md:block">Mis Ganancias</Link>
            <a className="text-[14px] font-semibold hidden md:block">Tienda</a>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-cm-primary to-cm-accent text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-full">
            🚀 Campaña de Lanzamiento — {countdown}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Aquí se desplegarían las notificaciones (Elemento 2/3).')}
              className="w-9 h-9 rounded-full border border-[#E4E7EE] flex items-center justify-center relative"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-cm-primary text-white font-bold text-[13px]"
              >
                {primeraLetra}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 bg-white border border-[#E4E7EE] rounded-lg min-w-[200px] shadow-xl p-1.5">
                  <a className="block px-3 py-2 text-[13px] rounded-md hover:bg-[#F4F6FB]">Datos de cuenta</a>
                  <a className="block px-3 py-2 text-[13px] rounded-md hover:bg-[#F4F6FB]">Enlazar Facebook</a>
                  <a className="block px-3 py-2 text-[13px] rounded-md hover:bg-[#F4F6FB]">Enlazar Instagram</a>
                  <a
                    href="/"
                    onClick={handleLogout}
                    className="block px-3 py-2 text-[13px] rounded-md hover:bg-[#F4F6FB] text-red-600"
                  >
                    Cerrar sesión
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2 bg-white border-b border-[#E4E7EE] sticky top-16 z-10">
          <Link href="/home/mi-oficina/ganancias" className="shrink-0 text-[13px] font-semibold text-cm-primary bg-[#ECECFF] px-3.5 py-1.5 rounded-full whitespace-nowrap">
            Mis Ganancias
          </Link>
          <a className="shrink-0 text-[13px] font-semibold bg-[#F4F6FB] border border-[#E4E7EE] px-3.5 py-1.5 rounded-full whitespace-nowrap">
            Tienda
          </a>
          <div className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-cm-primary to-cm-accent text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap">
            🚀 Campaña — {countdown}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-[22px] font-semibold mb-1">Hola, {user.nombre} 👋</h1>
          <p className="text-[#6B7280] text-[14px] mb-6">
            Consulta tu estado dentro de Club Machtia y comparte tu invitación.
          </p>

          <div className="bg-white border border-[#E4E7EE] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
                Tu link de invitación
              </div>
              <div className="text-[14px] font-semibold text-cm-primaryDark">
                {linkInvitacion}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(linkInvitacion);
                setLinkCopiado(true);
                setTimeout(() => setLinkCopiado(false), 2000);
              }}
              className="bg-cm-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              {linkCopiado ? <Check size={14} /> : <Copy size={14} />}
              {linkCopiado ? 'Copiado' : 'Copiar enlace'}
            </button>
          </div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
            <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5">
              <h2 className="text-[15px] font-semibold mb-3">Anuncios y avisos</h2>
              {[
                ['Lanzamiento', 'La cuenta regresiva para la Campaña de Lanzamiento ya está activa.', 'Hoy'],
                ['Cursos', 'El curso de Inglés A1 estará disponible próximamente.', 'Ayer'],
                ['Plataforma', 'Ya puedes enlazar tus redes sociales desde tu perfil.', 'Hace 3 días'],
              ].map(([tag, txt, date]) => (
                <div key={txt} className="py-3 border-b border-[#E4E7EE] last:border-0">
                  <span className="inline-block text-[11px] font-bold text-cm-primary bg-[#ECECFF] px-2 py-0.5 rounded-full mb-1.5">
                    {tag}
                  </span>
                  <div className="text-[13px]">{txt}</div>
                  <div className="text-[11px] text-[#6B7280] mt-1">{date}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5">
              <h2 className="text-[15px] font-semibold mb-3">Resumen de actividad</h2>
              {[
                ['Inicio de sesión', 'Hoy, 9:14 a.m.'],
                ['Referido pendiente de aprobación', 'Ayer'],
                ['Perfil actualizado', 'Hace 4 días'],
              ].map(([txt, meta]) => (
                <div
                  key={txt}
                  className="flex justify-between py-2.5 border-b border-[#E4E7EE] last:border-0 text-[13px]"
                >
                  <span>{txt}</span>
                  <span className="text-[#6B7280] text-[12px]">{meta}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-[12px] text-[#6B7280] bg-white border border-dashed border-[#E4E7EE] rounded-xl px-4 py-3">
            {ROLE_NOTES[role]}
          </div>
        </div>
      </div>
    </div>
  );
}
