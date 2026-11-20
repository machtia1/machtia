import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { leerDatosBancarios } from '@/lib/datosBancariosServidor';

/** Datos COMPLETOS (descifrados) de un usuario. Solo Administrador; queda registro en los logs. */
export async function GET(_req: Request, { params }: { params: { usuarioId: string } }) {
  const token = cookies().get('session')?.value;
  const s = token ? verifySession(token) : null;
  if (!s || s.rol !== 'ADMINISTRADOR') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const usuario = await prisma.user.findUnique({
    where: { id: params.usuarioId },
    select: { id: true, nombre: true, apellido: true, correo: true },
  });
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const datos = await leerDatosBancarios(usuario.id);
    console.info(`[datos-bancarios] admin ${s.userId} consultó los datos del usuario ${usuario.id}`);
    return NextResponse.json({ usuario, datos });
  } catch {
    return NextResponse.json({ error: 'No se pudieron descifrar los datos (¿cambió la llave de cifrado?)' }, { status: 500 });
  }
}
