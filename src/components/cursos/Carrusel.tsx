'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Carrusel horizontal reutilizable (flechas + scroll) — usado por
 * todas las secciones de la nueva pantalla de Cursos/Talleres
 * pedida por el cliente el 26 sept 2026 (destacados, rutas, nuevos,
 * cortos, especiales, instructores).
 */
export default function Carrusel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const desplazar = (direccion: 1 | -1) => {
    ref.current?.scrollBy({ left: direccion * 300, behavior: 'smooth' });
  };

  return (
    <div className="relative group/carrusel">
      <button
        type="button"
        onClick={() => desplazar(-1)}
        aria-label="Anterior"
        className="hidden sm:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#E4E7EE] shadow-md items-center justify-center text-[#6B7280] hover:text-cm-primary hover:border-cm-primary/30 opacity-0 group-hover/carrusel:opacity-100 transition-opacity"
      >
        <ChevronLeft size={16} />
      </button>
      <div
        ref={ref}
        className="flex gap-3.5 overflow-x-auto scroll-smooth pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => desplazar(1)}
        aria-label="Siguiente"
        className="hidden sm:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#E4E7EE] shadow-md items-center justify-center text-[#6B7280] hover:text-cm-primary hover:border-cm-primary/30 opacity-0 group-hover/carrusel:opacity-100 transition-opacity"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
