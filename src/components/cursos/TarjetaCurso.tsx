import Link from 'next/link';
import { Star, Clock, PlayCircle, BookOpen } from 'lucide-react';

export const CATEGORIA_LABEL: Record<string, string> = {
  NEGOCIOS: 'Negocios',
  FINANZAS: 'Finanzas',
  MARKETING: 'Marketing',
  SALUD: 'Salud',
  IDIOMAS: 'Idiomas',
  HABILIDADES_DIGITALES: 'Habilidades Digitales',
};

export const NIVEL_LABEL: Record<string, string> = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
};

export interface TarjetaCursoData {
  id: string;
  titulo: string;
  descripcionBreve: string;
  portadaUrl: string | null;
  categoria: string;
  nivel: string;
  duracionMinutos: number;
  calificacionPromedio: number;
  numCalificaciones: number;
  instructor: { nombre: string } | null;
  _count: { lecciones: number };
}

/**
 * Tarjeta de curso/taller — estilo tomado de la referencia que envió
 * el cliente el 26 sept 2026 (portada, categoría, calificación,
 * duración) adaptado a la paleta cm-primary/cm-accent del proyecto.
 */
export default function TarjetaCurso({
  curso,
  progreso,
  tipo = 'cursos',
}: {
  curso: TarjetaCursoData;
  progreso?: number;
  tipo?: 'cursos' | 'talleres';
}) {
  const horas = Math.round((curso.duracionMinutos / 60) * 10) / 10;

  return (
    <Link
      href={`/home/${tipo}/${curso.id}`}
      className="shrink-0 w-[220px] sm:w-[236px] bg-white border border-[#E4E7EE] rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative w-full h-[118px] bg-gradient-to-br from-cm-primary to-cm-accent">
        {curso.portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={curso.portadaUrl} alt={curso.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={30} className="text-white/40" />
          </div>
        )}
        <span className="absolute top-2 left-2 text-[9.5px] font-bold uppercase tracking-wide bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
          {CATEGORIA_LABEL[curso.categoria] ?? curso.categoria}
        </span>
        {typeof progreso === 'number' && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/25">
            <div className="h-full bg-cm-accent" style={{ width: `${Math.min(100, progreso)}%` }} />
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-1 min-h-[34px]">
          {curso.titulo}
        </h3>
        <p className="text-[11.5px] text-[#6B7280] line-clamp-2 mb-2 min-h-[30px]">
          {curso.descripcionBreve}
        </p>
        <div className="flex items-center justify-between text-[11px] text-[#9297A6]">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {horas > 0 ? `${horas} h` : `${curso._count.lecciones} lecc.`}
          </span>
          {curso.calificacionPromedio > 0 && (
            <span className="flex items-center gap-1 text-[#F59E0B] font-semibold">
              <Star size={11} className="fill-current" /> {curso.calificacionPromedio.toFixed(1)}
            </span>
          )}
        </div>
        {curso.instructor && (
          <p className="text-[10.5px] text-[#9297A6] mt-1.5 truncate">{curso.instructor.nombre}</p>
        )}
        {typeof progreso === 'number' && (
          <p className="text-[10.5px] font-semibold text-cm-primary mt-1.5 flex items-center gap-1">
            <PlayCircle size={11} /> {Math.round(progreso)}% completado
          </p>
        )}
      </div>
    </Link>
  );
}
