import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validarCurso } from '@/lib/cursosProfesor';
import { guardarCursoProfesor, leerCursoProfesor, sesionProfesor } from '@/lib/cursosProfesorServidor';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sesion = sesionProfesor();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const curso = await leerCursoProfesor(sesion.userId, params.id);
  if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  return NextResponse.json(curso);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = sesionProfesor();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const cuerpo = await request.json().catch(() => null);
  const { errores, publicable, limpio } = validarCurso(cuerpo);
  if (!limpio) return NextResponse.json({ error: errores[0], errores }, { status: 400 });

  const r = await guardarCursoProfesor(sesion.userId, params.id, limpio, publicable);
  if (!r) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true, id: r.id, publicado: r.publicado });
}

/** Solo se puede borrar un curso propio que todavía no tenga alumnos inscritos. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const sesion = sesionProfesor();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const curso = await prisma.curso.findUnique({
    where: { id: params.id },
    select: { id: true, autorId: true },
  });
  if (!curso || curso.autorId !== sesion.userId) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }
  const inscritos = await prisma.inscripcionCurso.count({ where: { cursoId: curso.id } });
  if (inscritos > 0) {
    return NextResponse.json(
      { error: 'Este curso ya tiene alumnos inscritos, no se puede borrar.' },
      { status: 409 }
    );
  }
  await prisma.curso.delete({ where: { id: curso.id } });
  return NextResponse.json({ ok: true });
}
