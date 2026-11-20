import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validarPerfil } from '@/lib/cursosProfesor';
import { sesionProfesor } from '@/lib/cursosProfesorServidor';

export async function GET() {
  const sesion = sesionProfesor();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const i = await prisma.instructor.findUnique({ where: { usuarioId: sesion.userId } });
  return NextResponse.json({
    perfil: i
      ? { nombrePublico: i.nombre, especialidad: i.especialidad, estudios: i.estudios ?? '', fotoUrl: i.fotoUrl ?? '' }
      : null,
  });
}

/**
 * Guarda el perfil público. Al guardarlo, el profesor aparece en "Conoce a
 * nuestros instructores" (sección Cursos) y sus cursos quedan ligados a él.
 */
export async function PUT(request: Request) {
  const sesion = sesionProfesor();
  if (!sesion) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { errores, limpio } = validarPerfil(await request.json().catch(() => null));
  if (!limpio) return NextResponse.json({ error: errores[0], errores }, { status: 400 });

  const datos = {
    nombre: limpio.nombrePublico,
    especialidad: limpio.especialidad,
    estudios: limpio.estudios || null,
    fotoUrl: limpio.fotoUrl || null,
  };
  const existente = await prisma.instructor.findUnique({ where: { usuarioId: sesion.userId } });
  const instructor = existente
    ? await prisma.instructor.update({ where: { id: existente.id }, data: datos })
    : await prisma.instructor.create({ data: { ...datos, usuarioId: sesion.userId } });

  await prisma.curso.updateMany({ where: { autorId: sesion.userId }, data: { instructorId: instructor.id } });
  if (limpio.fotoUrl) {
    await prisma.user.update({ where: { id: sesion.userId }, data: { fotoPerfilUrl: limpio.fotoUrl } });
  }
  return NextResponse.json({ ok: true });
}
