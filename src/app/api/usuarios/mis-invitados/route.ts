import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * "Mis Invitados" dentro de Mis Referidos — pedida por el cliente el
 * 25 sept 2026: la lista de personas que ESTE usuario invitó de
 * forma directa, a través de su propio link de invitación
 * (invitadoPorId) — no incluye a nadie que haya entrado por la red
 * de otra persona, aunque haya terminado más abajo en su árbol.
 */
export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const invitados = await prisma.user.findMany({
    where: { invitadoPorId: session.userId, reservado: false },
    orderBy: { creadoEn: 'desc' },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      nombreUsuario: true,
      correo: true,
      pais: true,
      ladaPais: true,
      telefono: true,
      status: true,
    },
  });

  return NextResponse.json({
    invitados: invitados.map((u) => ({
      id: u.id,
      nombreCompleto: `${u.nombre} ${u.apellido}`.trim(),
      nombreUsuario: u.nombreUsuario,
      correo: u.correo,
      pais: u.pais,
      telefono: u.telefono ? `${u.ladaPais ?? ''} ${u.telefono}`.trim() : null,
      status: u.status,
    })),
  });
}
