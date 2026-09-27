import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PREGUNTAS_EVALUACION, calificarEvaluacion } from '@/lib/cursos';

export async function GET() {
  return NextResponse.json({
    preguntas: PREGUNTAS_EVALUACION.map((p) => ({ id: p.id, pregunta: p.pregunta, opciones: p.opciones })),
  });
}

/** Evaluación simple al terminar el curso — guarda la calificación en la inscripción. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { respuestas } = await request.json();
  if (!respuestas || typeof respuestas !== 'object') {
    return NextResponse.json({ error: 'Faltan las respuestas' }, { status: 400 });
  }

  const inscripcion = await prisma.inscripcionCurso.findUnique({
    where: { usuarioId_cursoId: { usuarioId: session.userId, cursoId: params.id } },
  });
  if (!inscripcion) {
    return NextResponse.json({ error: 'Primero debes inscribirte al curso' }, { status: 400 });
  }

  const calificacion = calificarEvaluacion(respuestas);
  await prisma.inscripcionCurso.update({
    where: { id: inscripcion.id },
    data: { calificacionEvaluacion: calificacion },
  });

  return NextResponse.json({ calificacion });
}
