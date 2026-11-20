import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Lista de usuarios que han capturado datos (sin descifrar nada). Solo Administrador. */
export async function GET() {
  const token = cookies().get('session')?.value;
  const s = token ? verifySession(token) : null;
  if (!s || s.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const filas = await prisma.datosBancarios.findMany({
    orderBy: { actualizadoEn: 'desc' },
    select: {
      usuarioId: true,
      tieneBanco: true,
      tieneWallet: true,
      actualizadoEn: true,
      usuario: { select: { nombre: true, apellido: true, correo: true, rol: true } },
    },
  });
  return NextResponse.json({
    registros: filas.map((f) => ({
      usuarioId: f.usuarioId,
      nombre: `${f.usuario.nombre} ${f.usuario.apellido}`.trim(),
      correo: f.usuario.correo,
      rol: f.usuario.rol,
      tieneBanco: f.tieneBanco,
      tieneWallet: f.tieneWallet,
      actualizadoEn: f.actualizadoEn,
    })),
  });
}
