'use client';

import { useEffect, useState } from 'react';
import LoadingLogo from './LoadingLogo';
import SubirArchivo from './SubirArchivo';
import { duracionVideoMinutos, formatearMB } from '@/lib/subidaDirecta';
import {
  CATEGORIAS,
  MAX_MODULOS,
  MAX_OPCIONES,
  MAX_PREGUNTAS,
  MIN_OPCIONES,
  cursoVacio,
  faltantesParaPublicar,
  moduloVacio,
  preguntaVacia,
  validarCurso,
  type CursoPayload,
  type ModuloPayload,
  type PreguntaPayload,
} from '@/lib/cursosProfesor';

const campo =
  'w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8DCE6] text-[14px] outline-none focus:border-cm-primary focus:ring-2 focus:ring-cm-primary/15';
const etiquetaCss = 'block text-[12px] font-semibold text-[#374151] mb-1.5';

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#E4E7EE] rounded-2xl p-5 sm:p-6">
      <h2 className="text-[16px] font-semibold mb-4">{titulo}</h2>
      {children}
    </section>
  );
}

/** Crear o editar un curso: datos, módulos (video + preguntas), calificación y archivos. */
export default function EditorCurso({
  userId,
  cursoId,
  alCerrar,
}: {
  userId: string;
  cursoId: string | null;
  alCerrar: () => void;
}) {
  const [id, setId] = useState<string | null>(cursoId);
  const [datos, setDatos] = useState<CursoPayload>(cursoVacio());
  const [cargando, setCargando] = useState(!!cursoId);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [resultado, setResultado] = useState<{ publicado: boolean; faltan: string[]; oculto: boolean } | null>(null);
  const [nombresVideo, setNombresVideo] = useState<Record<number, string>>({});
  const [ocultoAdmin, setOcultoAdmin] = useState(false);

  useEffect(() => {
    if (!cursoId) return;
    fetch(`/api/profesor/cursos/${cursoId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.datos) {
          setDatos(d.datos);
          setOcultoAdmin(!!d.ocultoPorAdmin);
        }
      })
      .catch(() => setErrores(['No se pudo cargar el curso.']))
      .finally(() => setCargando(false));
  }, [cursoId]);

  const cambiar = (parcial: Partial<CursoPayload>) => setDatos((d) => ({ ...d, ...parcial }));
  const cambiarModulo = (i: number, parcial: Partial<ModuloPayload>) =>
    setDatos((d) => ({ ...d, modulos: d.modulos.map((m, k) => (k === i ? { ...m, ...parcial } : m)) }));
  const cambiarPregunta = (i: number, j: number, parcial: Partial<PreguntaPayload>) =>
    setDatos((d) => ({
      ...d,
      modulos: d.modulos.map((m, k) =>
        k === i ? { ...m, preguntas: m.preguntas.map((q, n) => (n === j ? { ...q, ...parcial } : q)) } : m
      ),
    }));

  function ajustarNumModulos(n: number) {
    setDatos((d) => {
      const modulos = d.modulos.slice(0, n);
      while (modulos.length < n) modulos.push(moduloVacio());
      return { ...d, modulos };
    });
  }

  function ajustarNumPreguntas(i: number, n: number) {
    setDatos((d) => ({
      ...d,
      modulos: d.modulos.map((m, k) => {
        if (k !== i) return m;
        const preguntas = m.preguntas.slice(0, n);
        while (preguntas.length < n) preguntas.push(preguntaVacia());
        return { ...m, preguntas };
      }),
    }));
  }

  function ajustarNumOpciones(i: number, j: number, n: number) {
    const q = datos.modulos[i].preguntas[j];
    const opciones = q.opciones.slice(0, n);
    while (opciones.length < n) opciones.push('');
    cambiarPregunta(i, j, { opciones, correctas: q.correctas.filter((c) => c < n) });
  }

  function alternarCorrecta(i: number, j: number, k: number) {
    const q = datos.modulos[i].preguntas[j];
    const correctas = q.correctas.includes(k) ? q.correctas.filter((c) => c !== k) : [...q.correctas, k].sort((a, b) => a - b);
    cambiarPregunta(i, j, { correctas });
  }

  async function guardar() {
    setResultado(null);
    const { errores: errs, limpio } = validarCurso(datos);
    setErrores(errs);
    if (!limpio) return;

    setGuardando(true);
    try {
      const res = await fetch(id ? `/api/profesor/cursos/${id}` : '/api/profesor/cursos', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrores(data.errores ?? [data.error || 'No se pudo guardar el curso.']);
        return;
      }
      setId(data.id);
      // Recarga para conservar los ids de los módulos (así los cambios siguientes no duplican nada).
      const fresco = await fetch(`/api/profesor/cursos/${data.id}`).then((r) => r.json()).catch(() => null);
      if (fresco?.datos) {
        setDatos(fresco.datos);
        setOcultoAdmin(!!fresco.ocultoPorAdmin);
      }
      setResultado({ publicado: !!data.publicado, faltan: faltantesParaPublicar(datos), oculto: !!fresco?.ocultoPorAdmin });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrores(['Error de conexión. Intenta de nuevo.']);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <LoadingLogo size={28} label="Cargando curso..." />;

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={alCerrar} className="text-[13px] font-semibold text-cm-primary">
          ← Volver a Mis Cursos
        </button>
        <h1 className="text-[18px] font-semibold text-right">{id ? 'Editar curso' : 'Crear nuevo curso'}</h1>
      </div>

      {resultado && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-[13.5px] ${
            resultado.publicado ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}
        >
          {resultado.publicado
            ? '✅ Curso guardado y publicado: ya aparece en la sección Cursos.'
            : resultado.oculto
            ? 'Curso guardado, pero un administrador lo tiene oculto por ahora.'
            : `Curso guardado como borrador. Para publicarlo falta: ${resultado.faltan.join(', ')}.`}
        </div>
      )}
      {ocultoAdmin && !resultado && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-[13.5px]">
          Un administrador tiene este curso oculto por ahora.
        </div>
      )}

      <Tarjeta titulo="1. Datos del curso">
        <div className="flex flex-col gap-4">
          <SubirArchivo
            tipo="imagen"
            userId={userId}
            etiqueta="Foto de portada"
            textoBoton="Subir portada"
            accept="image/jpeg,image/png,image/webp"
            actual={datos.portadaUrl ? 'Portada cargada' : undefined}
            alSubir={(url) => cambiar({ portadaUrl: url })}
          />
          {datos.portadaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={datos.portadaUrl} alt="Portada" className="w-full max-w-xs aspect-video object-cover rounded-xl border border-[#E4E7EE]" />
          )}
          <div>
            <label htmlFor="curso-titulo" className={etiquetaCss}>Título del curso</label>
            <input id="curso-titulo" value={datos.titulo} onChange={(e) => cambiar({ titulo: e.target.value })} maxLength={120} className={campo} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="curso-categoria" className={etiquetaCss}>Categoría</label>
              <select id="curso-categoria" value={datos.categoria} onChange={(e) => cambiar({ categoria: e.target.value })} className={campo}>
                {CATEGORIAS.map((c) => (
                  <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="curso-horas" className={etiquetaCss}>Horas del curso</label>
              <input
                id="curso-horas"
                type="number"
                min={0.5}
                step={0.5}
                value={Number.isFinite(datos.horas) ? datos.horas : ''}
                onChange={(e) => cambiar({ horas: e.target.value === '' ? NaN : Number(e.target.value) })}
                className={campo}
              />
            </div>
          </div>
          <div>
            <label htmlFor="curso-tema" className={etiquetaCss}>Tema</label>
            <input id="curso-tema" value={datos.tema} onChange={(e) => cambiar({ tema: e.target.value })} maxLength={200} placeholder="De qué trata el curso, en una frase" className={campo} />
          </div>
          <div>
            <label htmlFor="curso-temario" className={etiquetaCss}>Temario (opcional)</label>
            <textarea id="curso-temario" value={datos.temario} onChange={(e) => cambiar({ temario: e.target.value })} rows={4} maxLength={4000} placeholder="Lista de lo que se verá en el curso" className={campo} />
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="2. Módulos">
        <div className="mb-4 max-w-[220px]">
          <label htmlFor="curso-num-modulos" className={etiquetaCss}>Número de módulos</label>
          <select id="curso-num-modulos" value={datos.modulos.length} onChange={(e) => ajustarNumModulos(Number(e.target.value))} className={campo}>
            {Array.from({ length: MAX_MODULOS }, (_, k) => k + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-4">
          {datos.modulos.map((m, i) => (
            <div key={i} data-testid={`modulo-${i + 1}`} className="border border-[#E4E7EE] rounded-xl p-4 bg-[#FAFBFD]">
              <h3 className="text-[14.5px] font-semibold mb-3">Módulo {i + 1}</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor={`mod-${i}-titulo`} className={etiquetaCss}>Título del módulo</label>
                  <input id={`mod-${i}-titulo`} value={m.titulo} onChange={(e) => cambiarModulo(i, { titulo: e.target.value })} maxLength={120} className={campo} />
                </div>

                <SubirArchivo
                  tipo="video"
                  userId={userId}
                  etiqueta="Video del módulo (MP4, hasta 200 MB)"
                  textoBoton="Subir video"
                  accept="video/mp4"
                  actual={m.videoUrl ? nombresVideo[i] ?? 'Video cargado' : undefined}
                  alSubir={async (url, archivo) => {
                    const dur = await duracionVideoMinutos(archivo);
                    cambiarModulo(i, { videoUrl: url, duracionMinutos: dur });
                    setNombresVideo((n) => ({ ...n, [i]: `${archivo.name} · ${formatearMB(archivo.size)} · ${dur} min` }));
                  }}
                />

                <div className="max-w-[220px]">
                  <label htmlFor={`mod-${i}-numpreg`} className={etiquetaCss}>Número de preguntas</label>
                  <select id={`mod-${i}-numpreg`} value={m.preguntas.length} onChange={(e) => ajustarNumPreguntas(i, Number(e.target.value))} className={campo}>
                    {Array.from({ length: MAX_PREGUNTAS + 1 }, (_, k) => k).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {m.preguntas.map((q, j) => (
                  <fieldset key={j} data-testid={`pregunta-${i + 1}-${j + 1}`} className="border border-[#E4E7EE] rounded-xl p-3.5 bg-white">
                    <legend className="text-[13px] font-semibold px-1">Pregunta {j + 1}</legend>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label htmlFor={`q-${i}-${j}-texto`} className={etiquetaCss}>Pregunta</label>
                        <input id={`q-${i}-${j}-texto`} value={q.texto} onChange={(e) => cambiarPregunta(i, j, { texto: e.target.value })} maxLength={500} className={campo} />
                      </div>
                      <div className="max-w-[220px]">
                        <label htmlFor={`q-${i}-${j}-numop`} className={etiquetaCss}>Número de opciones</label>
                        <select id={`q-${i}-${j}-numop`} value={q.opciones.length} onChange={(e) => ajustarNumOpciones(i, j, Number(e.target.value))} className={campo}>
                          {Array.from({ length: MAX_OPCIONES - MIN_OPCIONES + 1 }, (_, k) => k + MIN_OPCIONES).map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] text-[#6B7280]">Escribe las opciones y marca la o las respuestas correctas.</p>
                        {q.opciones.map((o, k) => (
                          <div key={k} className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              aria-label={`Marcar opción ${k + 1} como correcta`}
                              checked={q.correctas.includes(k)}
                              onChange={() => alternarCorrecta(i, j, k)}
                              className="h-5 w-5 accent-[#2E3192] shrink-0"
                            />
                            <input
                              aria-label={`Opción ${k + 1} de la pregunta ${j + 1}`}
                              value={o}
                              onChange={(e) => cambiarPregunta(i, j, { opciones: q.opciones.map((x, n) => (n === k ? e.target.value : x)) })}
                              maxLength={300}
                              placeholder={`Opción ${k + 1}`}
                              className={campo}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta titulo="3. Calificación y archivos">
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label htmlFor="curso-cal-min" className={etiquetaCss}>Calificación mínima para aprobar</label>
            <input id="curso-cal-min" type="number" min={0} value={Number.isFinite(datos.calificacionMinima) ? datos.calificacionMinima : ''} onChange={(e) => cambiar({ calificacionMinima: e.target.value === '' ? NaN : Number(e.target.value) })} className={campo} />
          </div>
          <div>
            <label htmlFor="curso-cal-max" className={etiquetaCss}>Calificación máxima</label>
            <input id="curso-cal-max" type="number" min={1} value={Number.isFinite(datos.calificacionMaxima) ? datos.calificacionMaxima : ''} onChange={(e) => cambiar({ calificacionMaxima: e.target.value === '' ? NaN : Number(e.target.value) })} className={campo} />
          </div>
        </div>
        <p className="text-[12px] text-[#6B7280] mb-5">
          Al terminar todos los módulos y aprobar, el alumno recibe su certificado automáticamente.
        </p>

        <label className="flex items-center gap-2.5 text-[14px] font-medium mb-3 cursor-pointer">
          <input type="checkbox" checked={datos.permiteArchivos} onChange={(e) => cambiar({ permiteArchivos: e.target.checked })} className="h-5 w-5 accent-[#2E3192]" />
          Este curso incluye archivos adicionales
        </label>

        {datos.permiteArchivos && (
          <div className="flex flex-col gap-3">
            <SubirArchivo
              tipo="archivo"
              userId={userId}
              etiqueta="Agregar archivo (PDF, Word, PowerPoint, Excel o ZIP, hasta 50 MB)"
              textoBoton="Agregar archivo"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
              alSubir={(url, archivo) => cambiar({ archivos: [...datos.archivos, { nombre: archivo.name, url, tamano: archivo.size }] })}
            />
            {datos.archivos.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {datos.archivos.map((a, k) => (
                  <li key={k} className="flex items-center justify-between gap-3 text-[13px] bg-[#F4F6FB] rounded-lg px-3 py-2">
                    <span className="min-w-0 break-all">{a.nombre} · {formatearMB(a.tamano)}</span>
                    <button type="button" onClick={() => cambiar({ archivos: datos.archivos.filter((_, n) => n !== k) })} className="text-red-600 font-semibold shrink-0">
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Tarjeta>

      {errores.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-[13.5px]">
          <p className="font-semibold mb-1">Revisa lo siguiente:</p>
          <ul className="list-disc pl-5">
            {errores.map((e, k) => (
              <li key={k}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pb-6">
        <button type="button" onClick={guardar} disabled={guardando} className="bg-cm-primary text-white text-[14.5px] font-semibold px-7 py-3 rounded-xl disabled:opacity-60">
          {guardando ? 'Guardando...' : 'Guardar curso'}
        </button>
        <p className="text-[12px] text-[#6B7280]">
          Si el curso tiene portada y el video de todos sus módulos, se publica solo al guardarlo.
        </p>
      </div>
    </div>
  );
}
