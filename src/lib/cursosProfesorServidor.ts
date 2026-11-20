import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { CursoPayload } from '@/lib/cursosProfesor';

/** Sesión del Profesor/Facilitador actual (o null si no lo es). */
export function sesionProfesor() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  return session && session.rol === 'PROFESOR_FACILITADOR' ? session : null;
}

/**
 * Crea o actualiza un curso del profesor con todo su contenido (módulos,
 * preguntas, archivos). Si ya tiene portada y todos los módulos tienen video,
 * se publica solo (aparece en Cursos); si no, queda como borrador.
 * Devuelve null si el curso no es de este profesor.
 */
export async function guardarCursoProfesor(
  autorId: string,
  cursoId: string | null,
  datos: CursoPayload,
  publicable: boolean
): Promise<{ id: string; publicado: boolean } | null> {
  const instructor = await prisma.instructor.findUnique({ where: { usuarioId: autorId } });

  let existente: { id: string; autorId: string | null; ocultoPorAdmin: boolean; borrador: boolean } | null = null;
  if (cursoId) {
    existente = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, autorId: true, ocultoPorAdmin: true, borrador: true },
    });
    if (!existente || existente.autorId !== autorId) return null;
  }

  const ocultoPorAdmin = existente?.ocultoPorAdmin ?? false;
  const publicado = publicable && !ocultoPorAdmin;
  const primeraPublicacion = publicable && (!existente || existente.borrador);

  const camposCurso = {
    titulo: datos.titulo,
    descripcionBreve: datos.tema,
    descripcionLarga: datos.temario || null,
    temario: datos.temario || null,
    categoria: datos.categoria as never,
    horas: datos.horas,
    duracionMinutos: Math.round(datos.horas * 60),
    portadaUrl: datos.portadaUrl || null,
    calificacionMinima: datos.calificacionMinima,
    calificacionMaxima: datos.calificacionMaxima,
    permiteArchivos: datos.permiteArchivos,
    borrador: !publicable,
    activo: publicado,
    instructorId: instructor?.id ?? null,
    ...(primeraPublicacion ? { esNuevo: true } : {}),
  };

  return prisma.$transaction(async (tx) => {
    const curso = existente
      ? await tx.curso.update({ where: { id: existente.id }, data: camposCurso })
      : await tx.curso.create({ data: { ...camposCurso, tipo: 'CURSO', autorId } });

    // ----- Módulos (cada uno es una lección de tipo video) -----
    const actuales = await tx.leccion.findMany({ where: { cursoId: curso.id }, select: { id: true } });
    const idsActuales = new Set(actuales.map((l) => l.id));
    const idsQueQuedan = new Set(datos.modulos.map((m) => m.id).filter((x): x is string => !!x && idsActuales.has(x)));

    // Se quitan los módulos eliminados y se libera el orden para reacomodar sin choques.
    for (const l of actuales) {
      if (!idsQueQuedan.has(l.id)) await tx.leccion.delete({ where: { id: l.id } });
    }
    await tx.leccion.updateMany({ where: { cursoId: curso.id }, data: { orden: { increment: 1000 } } });

    for (let i = 0; i < datos.modulos.length; i++) {
      const m = datos.modulos[i];
      const campos = {
        titulo: m.titulo,
        orden: i + 1,
        tipoContenido: 'VIDEO' as const,
        contenidoUrl: m.videoUrl || null,
        duracionMinutos: m.duracionMinutos,
      };
      const leccion =
        m.id && idsQueQuedan.has(m.id)
          ? await tx.leccion.update({ where: { id: m.id }, data: campos })
          : await tx.leccion.create({ data: { ...campos, cursoId: curso.id } });

      await tx.preguntaModulo.deleteMany({ where: { leccionId: leccion.id } });
      if (m.preguntas.length) {
        await tx.preguntaModulo.createMany({
          data: m.preguntas.map((q, j) => ({
            leccionId: leccion.id,
            orden: j + 1,
            texto: q.texto,
            opciones: q.opciones,
            correctas: q.correctas,
          })),
        });
      }
    }

    // ----- Archivos adicionales -----
    await tx.archivoCurso.deleteMany({ where: { cursoId: curso.id } });
    if (datos.permiteArchivos && datos.archivos.length) {
      await tx.archivoCurso.createMany({
        data: datos.archivos.map((a) => ({ cursoId: curso.id, nombre: a.nombre, url: a.url, tamano: a.tamano })),
      });
    }

    return { id: curso.id, publicado };
  });
}

/** Un curso del profesor en el formato del editor (con respuestas correctas). */
export async function leerCursoProfesor(autorId: string, cursoId: string) {
  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    include: {
      lecciones: { orderBy: { orden: 'asc' }, include: { preguntas: { orderBy: { orden: 'asc' } } } },
      archivos: { orderBy: { creadoEn: 'asc' } },
    },
  });
  if (!curso || curso.autorId !== autorId) return null;

  return {
    id: curso.id,
    publicado: curso.activo,
    borrador: curso.borrador,
    ocultoPorAdmin: curso.ocultoPorAdmin,
    datos: {
      titulo: curso.titulo,
      categoria: curso.categoria,
      tema: curso.descripcionBreve,
      temario: curso.temario ?? '',
      horas: curso.horas ?? Math.round((curso.duracionMinutos / 60) * 10) / 10,
      portadaUrl: curso.portadaUrl ?? '',
      calificacionMinima: curso.calificacionMinima,
      calificacionMaxima: curso.calificacionMaxima,
      permiteArchivos: curso.permiteArchivos,
      modulos: curso.lecciones.map((l) => ({
        id: l.id,
        titulo: l.titulo,
        videoUrl: l.contenidoUrl ?? '',
        duracionMinutos: l.duracionMinutos,
        preguntas: l.preguntas.map((q) => ({ texto: q.texto, opciones: q.opciones, correctas: q.correctas })),
      })),
      archivos: curso.archivos.map((a) => ({ nombre: a.nombre, url: a.url, tamano: a.tamano })),
    } satisfies CursoPayload,
  };
}
