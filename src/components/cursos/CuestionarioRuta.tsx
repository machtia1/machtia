'use client';

import { useState } from 'react';
import { X, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NIVEL_LABEL } from './TarjetaCurso';

export interface RutaData {
  id: string;
  titulo: string;
  descripcion: string;
  nivel: string;
  color: string;
  numCursos: number;
  horasTotales: number;
}

const PREGUNTAS = [
  {
    id: 'experiencia',
    texto: '¿Cuál es tu experiencia previa en el tema que quieres aprender?',
    opciones: [
      { valor: 'BASICO', texto: 'Soy nuevo, empiezo desde cero' },
      { valor: 'INTERMEDIO', texto: 'Ya tengo algo de experiencia' },
      { valor: 'AVANZADO', texto: 'Tengo bastante experiencia, quiero profundizar' },
    ],
  },
  {
    id: 'tiempo',
    texto: '¿Cuánto tiempo puedes dedicarle por semana?',
    opciones: [
      { valor: 'POCO', texto: 'Poco tiempo (rutas cortas)' },
      { valor: 'MEDIO', texto: 'Un rato cada día' },
      { valor: 'MUCHO', texto: 'Todo el que sea necesario' },
    ],
  },
] as const;

/**
 * Cuestionario simple para recomendar una Ruta de Aprendizaje —
 * pedido por el cliente el 26 sept 2026 ("banner con call to action
 * para que el usuario responda un cuestionario y así crear una ruta
 * de aprendizaje personalizada"). Es una recomendación basada en
 * reglas sencillas sobre las rutas que ya existen, no un algoritmo
 * de IA — se puede ampliar más adelante.
 */
export default function CuestionarioRuta({
  rutas,
  onClose,
}: {
  rutas: RutaData[];
  onClose: () => void;
}) {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<RutaData | null>(null);

  const responder = (preguntaId: string, valor: string) => {
    const nuevas = { ...respuestas, [preguntaId]: valor };
    setRespuestas(nuevas);
    if (paso < PREGUNTAS.length - 1) {
      setPaso(paso + 1);
    } else {
      setResultado(recomendar(nuevas, rutas));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-[#9297A6] hover:text-[#111827]"
        >
          <X size={18} />
        </button>

        {!resultado && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-cm-accent" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-cm-primary">
                Crea tu ruta de aprendizaje
              </span>
            </div>
            <div className="flex gap-1 mb-5 mt-3">
              {PREGUNTAS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i <= paso ? 'bg-cm-accent' : 'bg-[#E4E7EE]'}`}
                />
              ))}
            </div>
            <h3 className="text-[16px] font-semibold mb-4">{PREGUNTAS[paso].texto}</h3>
            <div className="flex flex-col gap-2">
              {PREGUNTAS[paso].opciones.map((op) => (
                <button
                  key={op.valor}
                  onClick={() => responder(PREGUNTAS[paso].id, op.valor)}
                  className="text-left text-[13.5px] font-medium px-4 py-3 rounded-xl border border-[#E4E7EE] hover:border-cm-accent hover:bg-cm-accent/5 transition-colors"
                >
                  {op.texto}
                </button>
              ))}
            </div>
            {paso > 0 && (
              <button
                onClick={() => setPaso(paso - 1)}
                className="flex items-center gap-1 text-[12px] text-[#6B7280] mt-4 hover:text-cm-primary"
              >
                <ArrowLeft size={13} /> Regresar
              </button>
            )}
          </>
        )}

        {resultado && (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles size={16} className="text-cm-accent" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-cm-primary">
                Te recomendamos
              </span>
            </div>
            <h3 className="text-[19px] font-bold mt-2" style={{ color: resultado.color }}>
              {resultado.titulo}
            </h3>
            <p className="text-[13px] text-[#6B7280] mt-2 mb-1">{resultado.descripcion}</p>
            <p className="text-[11.5px] text-[#9297A6] mb-5">
              Nivel {NIVEL_LABEL[resultado.nivel] ?? resultado.nivel} · {resultado.numCursos} cursos ·{' '}
              {resultado.horasTotales} h aprox.
            </p>
            <Link
              href={`/home/cursos?ruta=${resultado.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cm-primary to-cm-accent text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Empezar esta ruta <ArrowRight size={15} />
            </Link>
            <button
              onClick={() => {
                setPaso(0);
                setRespuestas({});
                setResultado(null);
              }}
              className="block mx-auto text-[12px] text-[#6B7280] mt-3 hover:text-cm-primary"
            >
              Volver a responder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function recomendar(respuestas: Record<string, string>, rutas: RutaData[]): RutaData | null {
  if (rutas.length === 0) return null;

  const nivelDeseado = respuestas.experiencia;
  const porNivel = rutas.filter((r) => r.nivel === nivelDeseado);
  if (porNivel.length > 0) {
    if (respuestas.tiempo === 'POCO') {
      return [...porNivel].sort((a, b) => a.horasTotales - b.horasTotales)[0];
    }
    return porNivel[0];
  }

  // Si ninguna ruta coincide exactamente con el nivel, se recomienda
  // la más corta disponible (mejor punto de entrada).
  return [...rutas].sort((a, b) => a.horasTotales - b.horasTotales)[0];
}
