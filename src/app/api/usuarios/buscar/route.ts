import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * "Búsqueda de Usuarios" dentro de Mis Referidos — pedida por el
 * cliente el 25 sept 2026: cualquier usuario logueado puede buscar a
 * otro usuario por nombre de usuario, nombre y apellidos, correo,
 * país, ciudad o suscripción, y también filtrar por país o
 * suscripción exactos (ej. "todos los de México").
 */
export async function GET(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const pais = searchParams.get('pais')?.trim();
  const suscripcion = searchParams.get('suscripcion')?.trim();

  const where: Record<string, unknown> = {
    status: { not: 'RECHAZADA' },
    fueraDeRed: false,
    reservado: false,
  };

  if (pais) where.pais = pais;
  if (suscripcion) where.suscripcion = suscripcion;

  if (q) {
    where.OR = [
      { nombreUsuario: { contains: q, mode: 'insensitive' } },
      { nombre: { contains: q, mode: 'insensitive' } },
      { apellido: { contains: q, mode: 'insensitive' } },
      { correo: { contains: q, mode: 'insensitive' } },
      { pais: { contains: q, mode: 'insensitive' } },
      { ciudad: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Sin texto ni filtros, no regresamos la base completa de golpe —
  // solo cuando el usuario realmente busca o filtra algo.
  if (!q && !pais && !suscripcion) {
    return NextResponse.json({ usuarios: [] });
  }

  const usuarios = await prisma.user.findMany({
    where,
    take: 50,
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      nombreUsuario: true,
      correo: true,
      pais: true,
      ciudad: true,
      suscripcion: true,
    },
  });

  return NextResponse.json({
    usuarios: usuarios.map((u) => ({
      id: u.id,
      nombreCompleto: `${u.nombre} ${u.apellido}`.trim(),
      nombreUsuario: u.nombreUsuario,
      correo: u.correo,
      pais: u.pais,
      ciudad: u.ciudad,
      suscripcion: u.suscripcion,
    })),
  });
}
