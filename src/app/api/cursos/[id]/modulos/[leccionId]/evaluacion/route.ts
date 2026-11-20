import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calificarModulo, evaluarCierreCurso, type Respuestas } from '@/lib/evaluacionModulos';

function sesion() {
  const token = cookies().get('session')?.value;
  return token ? verifySession(token) : null;
}

async function cargarContexto(cursoId: string, leccionId: string, usuarioId: string) {
  const leccion = await prisma.leccion.findUnique({
    where: { id: leccionId },
    select: {
      id: true,
      cursoId: true,
      titulo: true,
      curso: { select: { activo: true, calificacionMinima: true, calificacionMaxima: true } },
      preguntas: { orderBy: { orden: 'asc' }, select: { id: true, orden: true, texto: true, opciones: true, correctas: true } },
    },
  });
  if (!leccion || leccion.cursoId !== cursoId || !leccion.curso.activo) return { error: 'Módulo no encontrado', status: 404 as const };
  const inscripcion = await prisma.inscripcionCurso.findUnique({
    where: { usuarioId_cursoId: { usuarioId, cursoId } },
    select: { id: true },
  });
  if (!inscripcion) return { error: 'Primero debes inscribirte al curso', status: 403 as const };
  return { leccion, inscripcion };
}

/** Preguntas del módulo SIN las respuestas correctas + tu mejor resultado. */
export async function GET(_req: Request, { params }: { params: { id: string; leccionId: string } }) {
  const s = sesion();
  if (!s) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const ctx = await cargarContexto(params.id, params.leccionId, s.userId);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const previo = await prisma.resultadoModulo.findUnique({
    where: { inscripcionId_leccionId: { inscripcionId: ctx.inscripcion.id, leccionId: ctx.leccion.id } },
  });
  return NextResponse.json({
    preguntas: ctx.leccion.preguntas.map((p) => ({
      id: p.id,
      texto: p.texto,
      opciones: p.opciones,
      multiple: p.correctas.length > 1,
    })),
    calificacionMinima: ctx.leccion.curso.calificacionMinima,
    calificacionMaxima: ctx.leccion.curso.calificacionMaxima,
    resultado: previo ? { mejorNota: previo.mejorNota, ultimaNota: previo.ultimaNota, intentos: previo.intentos } : null,
  });
}

/** Califica el examen del módulo en el servidor y guarda la mejor nota. */
export async function POST(request: Request, { params }: { params: { id: string; leccionId: string } }) {
  const s = sesion();
  if (!s) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const ctx = await cargarContexto(params.id, params.leccionId, s.userId);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { leccion, inscripcion } = ctx;

  if (leccion.preguntas.length === 0) {
    return NextResponse.json({ error: 'Este módulo no tiene examen' }, { status: 400 });
  }

  const vista = await prisma.leccionCompletada.findUnique({
    where: { inscripcionId_leccionId: { inscripcionId: inscripcion.id, leccionId: leccion.id } },
  });
  if (!vista) {
    return NextResponse.json({ error: 'Primero marca el módulo como completado para presentar su examen' }, { status: 400 });
  }

  let body: { respuestas?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
  const crudas = body.respuestas;
  if (!crudas || typeof crudas !== 'object' || Array.isArray(crudas)) {
    return NextResponse.json({ error: 'Faltan las respuestas' }, { status: 400 });
  }

  const respuestas: Respuestas = {};
  for (const p of leccion.preguntas) {
    const dadas = (crudas as Record<string, unknown>)[p.id];
    if (!Array.isArray(dadas) || dadas.length === 0) {
      return NextResponse.json({ error: 'Responde todas las preguntas antes de enviar' }, { status: 400 });
    }
    const limpias = dadas.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < p.opciones.length);
    if (limpias.length !== dadas.length) {
      return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 });
    }
    respuestas[p.id] = limpias;
  }

  const { nota, aciertos, total, detalle } = calificarModulo(leccion.preguntas, respuestas, leccion.curso.calificacionMaxima);

  const previo = await prisma.resultadoModulo.findUnique({
    where: { inscripcionId_leccionId: { inscripcionId: inscripcion.id, leccionId: leccion.id } },
  });
  const guardado = previo
    ? await prisma.resultadoModulo.update({
        where: { id: previo.id },
        data: { ultimaNota: nota, mejorNota: Math.max(previo.mejorNota, nota), intentos: { increment: 1 } },
      })
    : await prisma.resultadoModulo.create({
        data: { inscripcionId: inscripcion.id, leccionId: leccion.id, mejorNota: nota, ultimaNota: nota },
      });

  const cierre = await evaluarCierreCurso(inscripcion.id);

  return NextResponse.json({
    nota,
    aciertos,
    total,
    detalle,
    aprobadoModulo: nota >= leccion.curso.calificacionMinima,
    resultado: { mejorNota: guardado.mejorNota, ultimaNota: guardado.ultimaNota, intentos: guardado.intentos },
    curso: cierre,
  });
}
