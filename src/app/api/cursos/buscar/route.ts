import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Búsqueda + filtros de Cursos/Talleres — pedido por el cliente el
 * 26 sept 2026: "búsqueda directa o por coincidencia de palabras",
 * más la barra de filtros (categoría, nivel, nuevos, más valorados,
 * especiales).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') === 'TALLER' ? 'TALLER' : 'CURSO';
  const q = searchParams.get('q')?.trim();
  const categoria = searchParams.get('categoria');
  const nivel = searchParams.get('nivel');
  const filtro = searchParams.get('filtro'); // 'nuevos' | 'mejor-valorados' | 'especiales'

  const where: Record<string, unknown> = { tipo, activo: true };
  if (categoria) where.categoria = categoria;
  if (nivel) where.nivel = nivel;
  if (filtro === 'nuevos') where.esNuevo = true;
  if (filtro === 'especiales') where.esEspecial = true;
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: 'insensitive' } },
      { descripcionBreve: { contains: q, mode: 'insensitive' } },
    ];
  }

  const cursos = await prisma.curso.findMany({
    where,
    orderBy: filtro === 'mejor-valorados' ? { calificacionPromedio: 'desc' } : { creadoEn: 'desc' },
    take: 60,
    select: {
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
    },
  });

  return NextResponse.json({ cursos });
}
