import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validarCurso } from '@/lib/cursosProfesor';
import { guardarCursoProfesor, sesionProfesor } from '@/lib/cursosProfesorServidor';

/** Lista los cursos del profesor. */
export async function GET() {
  const sesion = sesionProfesor();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const cursos = await prisma.curso.findMany({
    where: { autorId: sesion.userId },
    orderBy: { creadoEn: 'desc' },
    select: {
      id: true,
      titulo: true,
      portadaUrl: true,
      categoria: true,
      horas: true,
      activo: true,
      borrador: true,
      ocultoPorAdmin: true,
      _count: { select: { lecciones: true, inscripciones: true } },
    },
  });
  return NextResponse.json({ cursos });
}

/** Crea un curso nuevo (se publica solo si ya está completo). */
export async function POST(request: Request) {
  const sesion = sesionProfesor();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const cuerpo = await request.json().catch(() => null);
  const { errores, publicable, limpio } = validarCurso(cuerpo);
  if (!limpio) return NextResponse.json({ error: errores[0], errores }, { status: 400 });

  const r = await guardarCursoProfesor(sesion.userId, null, limpio, publicable);
  return NextResponse.json({ ok: true, id: r!.id, publicado: r!.publicado });
}
