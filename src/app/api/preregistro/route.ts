import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { enviarCorreoBrevo } from '@/lib/brevo';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { nombre, correo, invitadorLinkId, slotToken, profesorToken } = await request.json();

    if (!nombre?.trim() || !correo?.trim() || !CORREO_VALIDO.test(correo)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    if (!invitadorLinkId && !slotToken && !profesorToken) {
      return NextResponse.json({ error: 'Falta el enlace de invitación' }, { status: 400 });
    }

    let slotRestringidoId: string | undefined;
    let espacioProfesorId: string | undefined;

    if (profesorToken) {
      // Invitación de Profesor/Facilitador: solo sirve mientras el espacio esté disponible.
      const espacio = await prisma.espacioProfesor.findUnique({
        where: { inviteLink: profesorToken },
        select: { id: true, status: true },
      });
      if (!espacio || espacio.status !== 'INVITADO') {
        return NextResponse.json({ error: 'El enlace de invitación no es válido' }, { status: 404 });
      }
      espacioProfesorId = espacio.id;
    } else if (slotToken) {
      const slot = await prisma.slotRestringido.findUnique({
        where: { inviteLink: slotToken },
        select: { id: true, status: true },
      });
      if (!slot || slot.status !== 'INVITADO') {
        return NextResponse.json({ error: 'El enlace de invitación no es válido' }, { status: 404 });
      }
      slotRestringidoId = slot.id;
    } else {
      const invitador = await prisma.user.findUnique({
        where: { linkInvitacion: invitadorLinkId },
        select: { id: true },
      });
      if (!invitador) {
        return NextResponse.json({ error: 'El enlace de invitación no es válido' }, { status: 404 });
      }
    }

    // Evita duplicados: si ya existe un preregistro sin confirmar con
    // este correo, se reutiliza en vez de crear uno nuevo.
    const existente = await prisma.preregistro.findFirst({
      where: { correo, confirmado: false },
    });

    const tokenConfirmacion = existente?.tokenConfirmacion ?? randomUUID();

    if (existente && espacioProfesorId) {
      // Si la misma persona vuelve a entrar con un link de profesor, el
      // preregistro pendiente queda ligado a este espacio.
      await prisma.preregistro.update({
        where: { id: existente.id },
        data: { espacioProfesorId, slotRestringidoId: null, invitadorSlug: null },
      });
    }

    if (!existente) {
      await prisma.preregistro.create({
        data: {
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          invitadorSlug: slotRestringidoId || espacioProfesorId ? null : invitadorLinkId,
          slotRestringidoId,
          espacioProfesorId,
          tokenConfirmacion,
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const linkConfirmacion = `${baseUrl}/registro/${tokenConfirmacion}`;

    const { enviado } = await enviarCorreoBrevo({
      destinatarioCorreo: correo,
      destinatarioNombre: nombre,
      asunto: 'Confirma tu correo — Club Machtia',
      htmlContenido: `
        <p>Hola ${nombre},</p>
        <p>${
          espacioProfesorId
            ? 'Gracias por tu interés en ser Profesor/Facilitador en Club Machtia. Continúa con tu registro aquí:'
            : 'Gracias por tu interés en Club Machtia. Confirma tu correo para continuar con tu registro:'
        }</p>
        <p><a href="${linkConfirmacion}">${linkConfirmacion}</a></p>
      `,
    });

    return NextResponse.json({
      ok: true,
      // Solo se manda el link directo en la respuesta si Brevo no
      // pudo enviar el correo (por ejemplo, en desarrollo sin API
      // Key todavía) — así se puede seguir probando sin bloquearse.
      linkDesarrollo: enviado ? undefined : linkConfirmacion,
    });
  } catch (error) {
    console.error('Error en /api/preregistro:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
