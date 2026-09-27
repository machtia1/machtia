import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TARJETA_SELECT = {
  id: true,
  titulo: true,
  descripcionBreve: true,
  portadaUrl: true,
  categoria: true,
  nivel: true,
  duracionMinutos: true,
  calificacionPromedio: true,
  numCalificaciones: true,
  instructor: { select: { nombre: true } },
  _count: { select: { lecciones: true } },
} as const;

/**
 * Todo lo que necesita la pantalla principal de Cursos/Talleres en
 * una sola llamada — pedido por el cliente el 26 sept 2026: carrusel
 * principal (mínimo 10), "sigue aprendiendo", rutas de aprendizaje,
 * nuevos, cortos, especiales, instructores y próximos eventos.
 */
export async function GET(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') === 'TALLER' ? 'TALLER' : 'CURSO';

  const [destacados, nuevos, cortos, especiales, rutas, instructores, eventos, enProgreso] =
    await Promise.all([
      prisma.curso.findMany({
        where: { tipo, activo: true },
        orderBy: { calificacionPromedio: 'desc' },
        take: 12,
        select: TARJETA_SELECT,
      }),
      prisma.curso.findMany({
        where: { tipo, activo: true, esNuevo: true },
        orderBy: { creadoEn: 'desc' },
        take: 10,
        select: TARJETA_SELECT,
      }),
      prisma.curso.findMany({
        where: { tipo, activo: true, esCorto: true },
        orderBy: { creadoEn: 'desc' },
        take: 10,
        select: TARJETA_SELECT,
      }),
      prisma.curso.findMany({
        where: { tipo, activo: true, esEspecial: true },
        orderBy: { creadoEn: 'desc' },
        take: 10,
        select: TARJETA_SELECT,
      }),
      prisma.rutaAprendizaje.findMany({
        orderBy: { creadoEn: 'asc' },
        include: {
          cursos: {
            where: { activo: true },
            orderBy: { ordenEnRuta: 'asc' },
            select: TARJETA_SELECT,
          },
        },
      }),
      prisma.instructor.findMany({
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { cursos: true } } },
      }),
      prisma.eventoCurso.findMany({
        where: { fechaHora: { gte: new Date() } },
        orderBy: { fechaHora: 'asc' },
        take: 6,
        select: {
          id: true,
          titulo: true,
          instructorNombre: true,
          fechaHora: true,
          linkAcceso: true,
        },
      }),
      session
        ? prisma.inscripcionCurso.findMany({
            where: { usuarioId: session.userId, completado: false, curso: { tipo } },
            orderBy: { ultimaActividad: 'desc' },
            take: 3,
            select: {
              progreso: true,
              curso: { select: TARJETA_SELECT },
            },
          })
        : Promise.resolve([]),
    ]);

  return NextResponse.json({
    enProgreso: enProgreso.map((i) => ({ ...i.curso, progreso: i.progreso })),
    destacados,
    nuevos,
    cortos,
    especiales,
    rutas: rutas.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      nivel: r.nivel,
      color: r.color,
      numCursos: r.cursos.length,
      horasTotales: Math.round(r.cursos.reduce((s, c) => s + c.duracionMinutos, 0) / 60),
      cursos: r.cursos,
    })),
    instructores: instructores.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      especialidad: i.especialidad,
      fotoUrl: i.fotoUrl,
      numCursos: i._count.cursos,
    })),
    eventos,
  });
}
