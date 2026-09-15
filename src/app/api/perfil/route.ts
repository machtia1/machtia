import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TEXTO_PRESENTACION_MAX = 400;

export async function GET() {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const usuario = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      nombre: true,
      apellido: true,
      correo: true,
      telefono: true,
      ladaPais: true,
      suscripcion: true,
      linkInvitacion: true,
      creadoEn: true,
      membresiaExpiraEn: true,
      fotoPerfilUrl: true,
      direccionCalle: true,
      direccionColonia: true,
      codigoPostal: true,
      textoPresentacion: true,
      redSocialFacebook: true,
      redSocialInstagram: true,
      redSocialTiktok: true,
    },
  });

  if (!usuario) {
    return NextResponse.json({ error: 'No se encontró el usuario' }, { status: 404 });
  }

  return NextResponse.json({ usuario });
}

export async function PATCH(request: Request) {
  const token = cookies().get('session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const campos = [
    'telefono',
    'direccionCalle',
    'direccionColonia',
    'codigoPostal',
    'textoPresentacion',
    'redSocialFacebook',
    'redSocialInstagram',
    'redSocialTiktok',
  ] as const;

  const data: Record<string, string | null> = {};
  for (const campo of campos) {
    if (campo in body) {
      const valor = body[campo];
      if (valor !== null && typeof valor !== 'string') {
        return NextResponse.json({ error: `El campo ${campo} no es válido` }, { status: 400 });
      }
      data[campo] = typeof valor === 'string' ? valor.trim() || null : null;
    }
  }

  if (typeof data.textoPresentacion === 'string' && data.textoPresentacion.length > TEXTO_PRESENTACION_MAX) {
    return NextResponse.json(
      { error: `El texto de presentación no debe superar ${TEXTO_PRESENTACION_MAX} caracteres` },
      { status: 400 }
    );
  }

  const actualizado = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: {
      telefono: true,
      direccionCalle: true,
      direccionColonia: true,
      codigoPostal: true,
      textoPresentacion: true,
      redSocialFacebook: true,
      redSocialInstagram: true,
      redSocialTiktok: true,
    },
  });

  return NextResponse.json({ usuario: actualizado });
}
