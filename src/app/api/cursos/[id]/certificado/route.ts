import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Certificado del alumno que tiene la sesión abierta para este curso (si ya lo ganó). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('session')?.value;
  const s = token ? verifySession(token) : null;
  if (!s) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const cert = await prisma.certificado.findFirst({
    where: { usuarioId: s.userId, cursoId: params.id },
    select: { folio: true, calificacion: true, calificacionMaxima: true, emitidoEn: true },
  });
  if (!cert) return NextResponse.json({ error: 'Aún no tienes certificado de este curso' }, { status: 404 });
  return NextResponse.json({ certificado: cert });
}
