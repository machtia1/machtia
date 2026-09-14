import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { enviarCorreoBrevo } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { correo } = await request.json();
    if (!correo?.trim()) {
      return NextResponse.json({ error: 'Escribe tu correo' }, { status: 400 });
    }

    const usuario = await prisma.user.findUnique({ where: { correo: correo.trim().toLowerCase() } });

    // Por seguridad, siempre respondemos "ok" exista o no la cuenta —
    // así nadie puede usar este formulario para adivinar qué correos
    // están registrados.
    if (!usuario) {
      return NextResponse.json({ ok: true });
    }

    const token = randomUUID();
    await prisma.user.update({
      where: { id: usuario.id },
      data: { tokenConfirmacion: token },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const link = `${baseUrl}/restablecer/${token}`;

    const { enviado } = await enviarCorreoBrevo({
      destinatarioCorreo: usuario.correo,
      destinatarioNombre: usuario.nombre,
      asunto: 'Crea tu contraseña — Club Machtia',
      htmlContenido: `
        <p>Hola ${usuario.nombre},</p>
        <p>Da clic en el siguiente link para crear o restablecer tu contraseña:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Si tú no pediste esto, puedes ignorar este correo.</p>
      `,
    });

    return NextResponse.json({ ok: true, linkDesarrollo: enviado ? undefined : link });
  } catch (error) {
    console.error('Error en /api/auth/solicitar-reset:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
