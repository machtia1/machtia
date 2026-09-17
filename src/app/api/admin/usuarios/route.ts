import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session || session.rol !== 'ADMINISTRADOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const usuarios = await prisma.user.findMany({
    where: {
      status: { not: 'RECHAZADA' },
      fueraDeRed: false,
      // Excluye los espacios reservados de la Red General que
      // todavía nadie ha reclamado — no son personas reales.
      reservado: false,
    },
    orderBy: { creadoEn: 'desc' },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      correo: true,
      pais: true,
      suscripcion: true,
      status: true,
      rol: true,
      invitadoPor: { select: { nombre: true, apellido: true } },
      slotRestringido: { select: { nivel: true, posicion: true } },
    },
  });

  const data = usuarios.map((u) => ({
    id: u.id,
    nombreCompleto: `${u.nombre} ${u.apellido}`.trim(),
    correo: u.correo,
    pais: u.pais,
    suscripcion: u.suscripcion,
    status: u.status,
    rol: u.rol,
    patrocinador: u.invitadoPor
      ? `${u.invitadoPor.nombre} ${u.invitadoPor.apellido}`.trim()
      : u.slotRestringido
        ? `Espacio restringido · Nivel ${u.slotRestringido.nivel}`
        : null,
  }));

  return NextResponse.json({ usuarios: data });
}
