'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Image, LayoutGrid, Megaphone, Users } from 'lucide-react';

const TABS = [
  { label: 'Red General', href: '/home/red-general', icon: LayoutGrid },
  { label: 'Aprobar registros', href: '/home/aprobaciones', icon: CheckSquare },
  { label: 'Usuarios', href: '/home/usuarios', icon: Users },
  { label: 'Anuncios', href: '/home/anuncios', icon: Megaphone },
  { label: 'Publicidad', href: '/home/publicidad-admin', icon: Image },
];

/**
 * Navegación compartida entre las 4 pantallas de administración —
 * pedida por el cliente el 20 sept 2026 ("la parte de Anuncios y su
 * edición no aparecen en el perfil de Administrador"): antes cada
 * pantalla de admin solo se podía abrir desde el menú lateral, sin
 * forma de saltar de una a otra. Ahora todas quedan a un clic entre
 * sí, sin importar en cuál esté parado el Administrador.
 */
export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-5 pb-1">
      {TABS.map((tab) => {
        const activo = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap border ${
              activo
                ? 'bg-cm-primary text-white border-cm-primary'
                : 'bg-white text-[#1C1E2B] border-[#E4E7EE] hover:bg-[#F4F6FB]'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
