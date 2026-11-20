import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Elimina un espacio que todavía no lo usa nadie (su link deja de servir). */
export async function POST(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await request.json().catch(() => ({}));
  if (!id) {
    return NextResponse.json({ error: 'Falta el espacio' }, { status: 400 });
  }

  const espacio = await prisma.espacioProfesor.findUnique({ where: { id } });
  if (!espacio) {
    return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 });
  }
  if (espacio.status !== 'INVITADO' || espacio.usuarioId) {
    return NextResponse.json(
      { error: 'Este espacio ya lo usa un profesor, no se puede eliminar.' },
      { status: 409 }
    );
  }

  // Los preregistros que alcanzaron a usar este link también se retiran.
  await prisma.$transaction([
    prisma.preregistro.deleteMany({ where: { espacioProfesorId: id, confirmado: false } }),
    prisma.espacioProfesor.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
