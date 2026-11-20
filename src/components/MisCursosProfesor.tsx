'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import LoadingLogo from './LoadingLogo';
import EditorCurso from './EditorCurso';

interface CursoResumen {
  id: string;
  titulo: string;
  portadaUrl: string | null;
  horas: number | null;
  activo: boolean;
  borrador: boolean;
  ocultoPorAdmin: boolean;
  _count: { lecciones: number; inscripciones: number };
}

function estado(c: CursoResumen): { texto: string; css: string } {
  if (c.ocultoPorAdmin) return { texto: 'Oculto por administrador', css: 'bg-red-50 border-red-200 text-red-700' };
  if (c.borrador) return { texto: 'Borrador', css: 'bg-amber-50 border-amber-300 text-amber-700' };
  return { texto: 'Publicado', css: 'bg-emerald-50 border-emerald-300 text-emerald-700' };
}

/** "Mis Cursos" del profesor: lista de sus cursos y editor para crear o modificar. */
export default function MisCursosProfesor({ userId }: { userId: string }) {
  const [cursos, setCursos] = useState<CursoResumen[] | null>(null);
  const [error, setError] = useState('');
  // undefined = viendo la lista; null = curso nuevo; string = editando ese curso
  const [editando, setEditando] = useState<string | null | undefined>(undefined);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/profesor/cursos');
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'No se pudieron cargar tus cursos.');
      setCursos(data.cursos);
    } catch {
      setError('Error de conexión.');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function borrar(c: CursoResumen) {
    if (!window.confirm(`¿Borrar el curso "${c.titulo}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/profesor/cursos/${c.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || 'No se pudo borrar el curso.');
    await cargar();
  }

  if (editando !== undefined) {
    return (
      <EditorCurso
        key={editando ?? 'nuevo'}
        userId={userId}
        cursoId={editando}
        alCerrar={() => {
          setEditando(undefined);
          cargar();
        }}
      />
    );
  }

  return (
    <section aria-label="Mis Cursos">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-[17px] font-semibold">Mis Cursos</h2>
        <button
          type="button"
          onClick={() => setEditando(null)}
          className="flex items-center gap-1.5 bg-cm-primary text-white text-[13.5px] font-semibold px-4 py-2.5 rounded-xl"
        >
          <Plus size={16} /> Crear nuevo curso
        </button>
      </div>

      {error && <p className="text-red-600 text-[13px] mb-3">{error}</p>}
      {!cursos && !error && <LoadingLogo size={28} label="Cargando tus cursos..." />}

      {cursos && cursos.length === 0 && (
        <div className="bg-white border border-[#E4E7EE] rounded-2xl p-8 text-center">
          <BookOpen size={30} className="mx-auto text-cm-primary mb-3" />
          <p className="text-[14px] text-[#6B7280] max-w-md mx-auto">
            Todavía no tienes cursos. Toca &quot;Crear nuevo curso&quot; para empezar.
          </p>
        </div>
      )}

      {cursos && cursos.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {cursos.map((c) => {
            const e = estado(c);
            return (
              <div key={c.id} className="bg-white border border-[#E4E7EE] rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-video bg-[#EEF1F8] flex items-center justify-center">
                  {c.portadaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.portadaUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="text-[#9CA3AF]" />
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <span className={`self-start text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-full border ${e.css}`}>{e.texto}</span>
                  <h3 className="text-[15px] font-semibold leading-snug">{c.titulo}</h3>
                  <p className="text-[12px] text-[#6B7280]">
                    {c._count.lecciones} módulo{c._count.lecciones !== 1 ? 's' : ''}
                    {c.horas ? ` · ${c.horas} h` : ''} · {c._count.inscripciones} alumno{c._count.inscripciones !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2 mt-auto pt-2">
                    <button type="button" onClick={() => setEditando(c.id)} className="flex-1 text-[13px] font-semibold border border-cm-primary/40 text-cm-primary rounded-lg py-2">
                      Editar
                    </button>
                    {c._count.inscripciones === 0 && (
                      <button type="button" onClick={() => borrar(c)} className="text-[13px] font-semibold border border-red-200 text-red-600 rounded-lg px-3 py-2">
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
