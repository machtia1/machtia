'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronRight,
  Copy,
  CreditCard,
  DollarSign,
  Gift,
  GraduationCap,
  Handshake,
  HeartHandshake,
  type LucideIcon,
  Library,
  LayoutGrid,
  Megaphone,
  Menu,
  Network,
  Smartphone,
  Trophy,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useCountdown } from '@/lib/useCountdown';
import LoadingLogo from './LoadingLogo';

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

interface NavChild {
  label: string;
  href?: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  href?: string;
  icon: LucideIcon;
  children?: NavChild[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Mi Oficina',
    icon: Briefcase,
    children: [
      { label: 'Mi Suscripción', href: '/home/mi-oficina/suscripcion', icon: CreditCard },
      { label: 'Mis Logros', href: '/home/mi-oficina/logros', icon: Trophy },
      { label: 'Mis Ganancias', href: '/home/mi-oficina/ganancias', icon: DollarSign },
    ],
  },
  {
    label: 'Mi Red',
    icon: Users,
    children: [
      { label: 'Mis Referidos', href: '/home/red-usuarios', icon: UserPlus },
      { label: 'Mi Red 2x15', href: '/home/red-usuarios', icon: Network },
    ],
  },
  { label: 'Cursos', href: '/home/cursos', icon: BookOpen },
  { label: 'Talleres', href: '/home/talleres', icon: Wrench },
  { label: 'Biblioteca Digital', href: '/home/proximamente/biblioteca-digital', icon: Library },
  { label: 'Universidad Machtia®', href: '/home/proximamente/universidad-machtia', icon: GraduationCap },
  { label: 'Eventos especiales', href: '/home/proximamente/eventos-especiales', icon: CalendarDays },
  { label: 'SEP-Conocer', href: '/home/proximamente/sep-conocer', icon: Award },
  { label: 'Romi®', href: '/home/proximamente/romi', icon: Bot },
  { label: 'Servicios Digitales', href: '/home/proximamente/servicios-digitales', icon: Smartphone },
  { label: 'Sorteos', href: '/home/proximamente/sorteos', icon: Gift },
  { label: 'Fundación Machtia®', href: '/home/proximamente/fundacion-machtia', icon: HeartHandshake },
  { label: 'Negocios y Alianzas', href: '/home/proximamente/negocios-alianzas', icon: Handshake },
];



interface SessionUser {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'ADMINISTRADOR' | 'PROFESOR_FACILITADOR' | 'SOCIO' | 'USUARIO' | 'ASISTENTE_ADMINISTRATIVO';
  linkInvitacion: string;
  fotoPerfilUrl: string | null;
}

interface AnuncioDashboard {
  id: string;
  etiqueta: string;
  texto: string;
  creadoEn: string;
  mediaUrl: string | null;
  mediaTipo: 'IMAGEN' | 'VIDEO' | null;
}

interface NotificacionDashboard {
  id: string;
  mensaje: string;
  creadoEn: string;
}

/** "Hoy" / "Ayer" / "Hace N días" a partir de una fecha ISO. */
function formatearFechaAnuncio(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const diffMs = hoy.setHours(0, 0, 0, 0) - new Date(fecha).setHours(0, 0, 0, 0);
  const diffDias = Math.round(diffMs / 86400000);
  if (diffDias <= 0) return 'Hoy';
  if (diffDias === 1) return 'Ayer';
  return `Hace ${diffDias} días`;
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
  const [anuncios, setAnuncios] = useState<AnuncioDashboard[] | null>(null);
  const [notificaciones, setNotificaciones] = useState<NotificacionDashboard[] | null>(null);
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const [hayNoLeidas, setHayNoLeidas] = useState(false);
  const countdown = useCountdown('2026-10-30T22:00:00-06:00', '¡Campaña activa!');

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

  useEffect(() => {
    fetch('/api/anuncios')
      .then((res) => res.json())
      .then((data) => setAnuncios(data.anuncios ?? []))
      .catch(() => setAnuncios([]));
  }, []);

  useEffect(() => {
    fetch('/api/notificaciones')
      .then((res) => res.json())
      .then((data) => {
        setNotificaciones(data.notificaciones ?? []);
        setHayNoLeidas(Boolean(data.hayNoLeidas));
      })
      .catch(() => setNotificaciones([]));
  }, []);

  // Bloquea el scroll de la página de fondo mientras el menú (sidebar)
  // está abierto en celular/tablet — antes se desplazaban los dos a la
  // vez, pedido corregir por el cliente el 20 sept 2026.
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  async function abrirNotificaciones() {
    const abriendo = !notificacionesOpen;
    setNotificacionesOpen(abriendo);
    if (abriendo && hayNoLeidas) {
      setHayNoLeidas(false);
      fetch('/api/notificaciones/marcar-vistas', { method: 'POST' }).catch(() => {});
    }
  }

  async function borrarNotificacion(id: string) {
    // Se quita de la lista al instante (no hace falta esperar la
    // respuesta para que se sienta rápido); si falla, se recupera.
    const anterior = notificaciones;
    setNotificaciones((actual) => (actual ?? []).filter((n) => n.id !== id));
    try {
      const res = await fetch(`/api/notificaciones/${id}`, { method: 'DELETE' });
      if (!res.ok) setNotificaciones(anterior);
    } catch {
      setNotificaciones(anterior);
    }
  }

  if (loadingUser) {
    return <LoadingLogo fullScreen label="Cargando..." />;
  }

  if (!user) {
    return null;
  }

  const role = mapRol(user.rol);
  const nombreCompleto = `${user.nombre} ${user.apellido}`;
  const primeraLetra = user.nombre.charAt(0).toUpperCase();
  const linkInvitacion = `machtiaeducacion.com/invitacion/${user.linkInvitacion}`;

  return (
    <div className="flex min-h-screen bg-[#F4F6FB] text-[#1C1E2B] overflow-x-hidden">
      {/* Fondo oscuro detrás del menú en celular/tablet — al tocarlo se
          cierra el menú (antes no había forma de cerrarlo). */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-[264px] bg-white border-r border-[#E4E7EE] p-4 fixed lg:sticky top-0 h-screen overflow-y-auto z-30 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-2 pb-5">
          <img src="/brand/logo-lockup-color.png" alt="Club Machtia" className="h-9 w-auto" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg hover:bg-[#F4F6FB] flex items-center justify-center text-[#6B7280] shrink-0"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-[#F4F6FB] rounded-[10px] px-3 py-2.5 mb-4 min-w-0">
          <div className="text-[13px] font-semibold truncate">{nombreCompleto}</div>
          <div className="text-[11px] font-bold text-cm-primary uppercase tracking-wide truncate">
            {ROLE_LABELS[role]}
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          <a className="rounded-lg bg-cm-primary text-white text-[14px] font-medium px-3 py-2.5 flex items-center gap-2.5">
            <LayoutGrid size={16} />
            Inicio
          </a>

          {NAV_SECTIONS.map((section) =>
            section.href ? (
              <Link
                key={section.label}
                href={section.href}
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg hover:bg-[#F4F6FB] text-[14px] font-medium px-3 py-2.5 flex items-center gap-2.5"
              >
                <section.icon size={16} className="text-[#6B7280] shrink-0" />
                <span className="min-w-0 break-words">{section.label}</span>
              </Link>
            ) : (
            <div key={section.label}>
              <button
                onClick={() =>
                  setOpenSection(openSection === section.label ? null : section.label)
                }
                className="w-full flex items-center justify-between rounded-lg hover:bg-[#F4F6FB] text-[14px] font-medium px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <section.icon size={16} className="text-[#6B7280] shrink-0" />
                  <span className="truncate">{section.label}</span>
                </span>
                {section.children && (
                  <ChevronRight
                    size={13}
                    className={`text-[#6B7280] shrink-0 transition-transform ${
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
                        onClick={() => setSidebarOpen(false)}
                        className="text-[13px] text-[#6B7280] hover:text-[#1C1E2B] hover:bg-[#F4F6FB] rounded-md px-3 py-2 flex items-center gap-2"
                      >
                        <child.icon size={14} className="shrink-0" />
                        <span className="min-w-0 break-words">{child.label}</span>
                      </Link>
                    ) : (
                      <a
                        key={child.label}
                        href="#"
                        className="text-[13px] text-[#6B7280] hover:text-[#1C1E2B] hover:bg-[#F4F6FB] rounded-md px-3 py-2 flex items-center gap-2"
                      >
                        <child.icon size={14} className="shrink-0" />
                        <span className="min-w-0 break-words">{child.label}</span>
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
            )
          )}

          {role === 'administrador' && (
            <Link
              href="/home/red-general"
              onClick={() => setSidebarOpen(false)}
              className="mt-3 pt-3 border-t border-[#E4E7EE] rounded-lg text-cm-primary font-bold text-[14px] px-3 py-2.5 flex items-center gap-2.5"
            >
              <LayoutGrid size={16} className="shrink-0" />
              Panel de Administrador
            </Link>
          )}
          {role === 'administrador' && (
            <Link
              href="/home/aprobaciones"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg text-cm-primary font-bold text-[14px] px-3 py-2.5 flex items-center gap-2.5"
            >
              <CheckSquare size={16} className="shrink-0" />
              Aprobar registros
            </Link>
          )}
          {role === 'administrador' && (
            <Link
              href="/home/usuarios"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg text-cm-primary font-bold text-[14px] px-3 py-2.5 flex items-center gap-2.5"
            >
              <Users size={16} className="shrink-0" />
              Usuarios
            </Link>
          )}
          {role === 'administrador' && (
            <Link
              href="/home/anuncios"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg text-cm-primary font-bold text-[14px] px-3 py-2.5 flex items-center gap-2.5"
            >
              <Megaphone size={16} className="shrink-0" />
              Anuncios
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

          <Link
            href="/home/campana-lanzamiento"
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-cm-primary to-cm-accent text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-full"
          >
            🚀 Campaña de Lanzamiento — {countdown}
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={abrirNotificaciones}
                className="w-9 h-9 rounded-full border border-[#E4E7EE] flex items-center justify-center relative"
                aria-label="Notificaciones"
              >
                <Bell size={16} />
                {hayNoLeidas && (
                  <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>
              {notificacionesOpen && (
                <div className="absolute right-0 top-11 bg-white border border-[#E4E7EE] rounded-lg w-[300px] max-w-[85vw] shadow-xl p-2 max-h-[70vh] overflow-y-auto">
                  <div className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide px-2 py-1.5">
                    Notificaciones
                  </div>
                  {(notificaciones ?? []).length === 0 && (
                    <p className="text-[13px] text-[#6B7280] px-2 py-3">No hay notificaciones todavía.</p>
                  )}
                  {(notificaciones ?? []).map((n) => (
                    <div
                      key={n.id}
                      className="group px-2 py-2.5 border-t border-[#E4E7EE] first:border-0 flex items-start gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] break-words">{n.mensaje}</div>
                        <div className="text-[11px] text-[#6B7280] mt-0.5">
                          {formatearFechaAnuncio(n.creadoEn)}
                        </div>
                      </div>
                      <button
                        onClick={() => borrarNotificacion(n.id)}
                        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#F4F6FB] hover:text-[#6B7280]"
                        aria-label="Borrar notificación"
                        title="Borrar notificación"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-cm-primary text-white font-bold text-[13px] overflow-hidden flex items-center justify-center shrink-0"
              >
                {user.fotoPerfilUrl ? (
                  <img
                    src={user.fotoPerfilUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  primeraLetra
                )}
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
          <Link
            href="/home/campana-lanzamiento"
            className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-cm-primary to-cm-accent text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap"
          >
            🚀 Campaña — {countdown}
          </Link>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-[22px] font-semibold mb-1">Hola, {user.nombre} 👋</h1>
          <p className="text-[#6B7280] text-[14px] mb-6">
            Consulta tu estado dentro de Club Machtia y comparte tu invitación.
          </p>

          <div className="bg-white border border-[#E4E7EE] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-1">
                Tu link de invitación
              </div>
              <div className="text-[14px] font-semibold text-cm-primaryDark break-all">
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
              {anuncios === null && <LoadingLogo size={28} label="Cargando anuncios..." />}
              {anuncios !== null && anuncios.length === 0 && (
                <p className="text-[13px] text-[#6B7280] py-2">No hay anuncios por ahora.</p>
              )}
              {(anuncios ?? []).map((a) => (
                <div key={a.id} className="py-3 border-b border-[#E4E7EE] last:border-0">
                  <span className="inline-block text-[11px] font-bold text-cm-primary bg-[#ECECFF] px-2 py-0.5 rounded-full mb-1.5">
                    {a.etiqueta}
                  </span>
                  <div className="text-[13px] break-words">{a.texto}</div>
                  {a.mediaUrl && a.mediaTipo === 'IMAGEN' && (
                    <img
                      src={a.mediaUrl}
                      alt={a.etiqueta}
                      className="mt-2 rounded-lg w-full max-h-[280px] object-cover border border-[#E4E7EE]"
                    />
                  )}
                  {a.mediaUrl && a.mediaTipo === 'VIDEO' && (
                    <video
                      src={a.mediaUrl}
                      controls
                      className="mt-2 rounded-lg w-full max-h-[280px] border border-[#E4E7EE]"
                    />
                  )}
                  <div className="text-[11px] text-[#6B7280] mt-1">{formatearFechaAnuncio(a.creadoEn)}</div>
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
