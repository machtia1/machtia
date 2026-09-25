'use client';

import { useEffect, useState } from 'react';
import LoadingLogo from './LoadingLogo';

interface Nodo {
  id: string;
  nombre: string;
  apellido: string;
  status: string;
}

interface Raiz {
  id: string;
  nombre: string;
  apellido: string;
  status: string;
}

interface DatosArbolGrafico {
  raiz: Raiz;
  niveles: (Nodo | null)[][];
}

const AVATAR_COLORS: Record<string, string> = {
  ACTIVA: 'bg-cm-primary text-white ring-cm-primary',
  INACTIVA: 'bg-amber-100 text-amber-700 ring-amber-300',
  PENDIENTE_APROBACION: 'bg-amber-100 text-amber-700 ring-amber-300',
  PENDIENTE_CONFIRMACION: 'bg-amber-100 text-amber-700 ring-amber-300',
  RECHAZADA: 'bg-red-100 text-red-700 ring-red-300',
};

const LIMITE_INICIAL_POR_NIVEL = 40;

function iniciales(nombre: string, apellido?: string): string {
  const a = (nombre || '?').trim().charAt(0);
  const b = (apellido || '').trim().charAt(0);
  return (a + b).toUpperCase() || '?';
}

/**
 * Vista de árbol gráfico (nodo por nodo) de la Campaña de
 * Lanzamiento — pedida por el cliente el 25 sept 2026. Mismo
 * lenguaje visual que el árbol de Mi Red 2x15 (RedUsuarios.tsx),
 * pero con 8 posiciones por nivel en vez de 2, y de solo lectura
 * (aquí no se marca inactivo ni se elimina a nadie — esas acciones
 * viven en Mi Red 2x15).
 */
export default function ArbolGraficoAlterna() {
  const [datos, setDatos] = useState<DatosArbolGrafico | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nivelesExpandidos, setNivelesExpandidos] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/campana/arbol-grafico')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'No se pudo cargar el árbol');
          return;
        }
        setDatos(data);
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <LoadingLogo size={28} label="Cargando árbol..." />;
  }

  if (error || !datos) {
    return <p className="text-[13px] text-red-600">{error || 'No se pudo cargar el árbol'}</p>;
  }

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-4 mb-5 text-[12px] text-[#6B7280]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-cm-primary inline-block" /> Activo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-300 inline-block" /> Inactivo / pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-dashed border-[#B8BCC8] inline-block" /> Vacante
        </span>
      </div>

      <div className="flex justify-center pb-6 mb-6 border-b border-[#F0F1F4]">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[15px] font-bold bg-gradient-to-br from-cm-primary to-cm-accent text-white ring-2 ring-cm-primary shadow-sm">
            {iniciales(datos.raiz.nombre, datos.raiz.apellido)}
          </div>
          <span className="text-[13px] font-semibold">{datos.raiz.nombre} · Tú</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {datos.niveles.map((fila, i) => {
          if (fila.every((n) => n === null)) return null;

          const expandido = nivelesExpandidos.has(i);
          const itemsAMostrar = expandido ? fila : fila.slice(0, LIMITE_INICIAL_POR_NIVEL);
          const ocultos = fila.length - itemsAMostrar.length;
          const vacantesEnFila = fila.filter((n) => n === null).length;

          return (
            <div key={i}>
              <div className="flex items-baseline gap-2 mb-2.5">
                <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide">
                  Nivel {i + 1}
                </h3>
                <span className="text-[11px] text-[#B8BCC8]">
                  {fila.length} espacio{fila.length !== 1 ? 's' : ''}
                  {vacantesEnFila > 0 ? ` · ${vacantesEnFila} vacante${vacantesEnFila !== 1 ? 's' : ''}` : ''}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-1 gap-y-2">
                {itemsAMostrar.map((nodo, j) =>
                  nodo ? (
                    <div
                      key={nodo.id}
                      title={`${nodo.nombre} ${nodo.apellido ?? ''}`.trim()}
                      className="flex flex-col items-center gap-1 w-[68px] shrink-0 rounded-xl px-1.5 py-2"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold ring-2 ${
                          AVATAR_COLORS[nodo.status] ?? AVATAR_COLORS.ACTIVA
                        }`}
                      >
                        {iniciales(nodo.nombre, nodo.apellido)}
                      </div>
                      <span className="text-[10.5px] leading-tight text-center line-clamp-2 text-[#1C1E2B] font-medium">
                        {nodo.nombre}
                      </span>
                    </div>
                  ) : (
                    <div
                      key={`vacante-${i}-${j}`}
                      title="Espacio vacante — comparte tu link de invitación para llenarlo"
                      className="flex flex-col items-center gap-1 w-[68px] shrink-0 rounded-xl px-1.5 py-2"
                    >
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#D8DCE6]" />
                      <span className="text-[10.5px] leading-tight text-center text-[#B8BCC8]">Vacante</span>
                    </div>
                  )
                )}
              </div>

              {ocultos > 0 && (
                <button
                  onClick={() => setNivelesExpandidos((prev) => new Set(prev).add(i))}
                  className="mt-2 text-[12px] font-semibold text-cm-primary hover:underline"
                >
                  Ver los {ocultos} restantes
                </button>
              )}
            </div>
          );
        })}

        {datos.niveles.length === 0 && (
          <p className="text-[13px] text-[#6B7280]">
            Todavía no tienes a nadie en tu red de Campaña de Lanzamiento — comparte tu link de
            invitación para empezar.
          </p>
        )}
      </div>
    </div>
  );
}
