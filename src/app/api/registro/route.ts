import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

const SUSCRIPCIONES_VALIDAS = ['BASICA', 'PLUS', 'NEGOCIOS'] as const;
const TAMANO_MAX_COMPROBANTE = 4 * 1024 * 1024; // 4 MB (Vercel limita el cuerpo de la petición a 4.5 MB)

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const token = formData.get('token')?.toString();
    const apellido = formData.get('apellido')?.toString().trim();
    const pais = formData.get('pais')?.toString().trim();
    const ladaPais = formData.get('ladaPais')?.toString().trim();
    const telefono = formData.get('telefono')?.toString().trim();
    const estadoProvincia = formData.get('estadoProvincia')?.toString().trim();
    const ciudad = formData.get('ciudad')?.toString().trim();
    const suscripcion = formData.get('suscripcion')?.toString();
    const password = formData.get('password')?.toString();
    const comprobante = formData.get('comprobante');

    if (
      !token ||
      !apellido ||
      !pais ||
      !ladaPais ||
      !telefono ||
      !estadoProvincia ||
      !ciudad ||
      !password ||
      password.length < 8
    ) {
      return NextResponse.json({ error: 'Faltan datos o la contraseña es muy corta (mínimo 8 caracteres)' }, { status: 400 });
    }

    if (!suscripcion || !SUSCRIPCIONES_VALIDAS.includes(suscripcion as any)) {
      return NextResponse.json({ error: 'Selecciona una suscripción válida' }, { status: 400 });
    }

    if (!(comprobante instanceof File) || comprobante.size === 0) {
      return NextResponse.json({ error: 'Sube tu comprobante de pago' }, { status: 400 });
    }
    if (comprobante.size > TAMANO_MAX_COMPROBANTE) {
      return NextResponse.json({ error: 'El comprobante no debe pesar más de 5 MB' }, { status: 400 });
    }

    const preregistro = await prisma.preregistro.findUnique({ where: { tokenConfirmacion: token } });
    if (!preregistro) {
      return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 404 });
    }

    const yaExiste = await prisma.user.findUnique({ where: { correo: preregistro.correo } });
    if (yaExiste) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo' }, { status: 409 });
    }

    const invitador = await prisma.user.findUnique({
      where: { linkInvitacion: preregistro.invitadorSlug },
      select: { id: true },
    });
    if (!invitador) {
      return NextResponse.json({ error: 'El invitador original ya no está disponible' }, { status: 404 });
    }

    // Sube el comprobante a Vercel Blob (requiere BLOB_READ_WRITE_TOKEN
    // configurado — ver NOTAS_REGISTRO_FASE2.md).
    const extension = comprobante.name.split('.').pop() || 'jpg';
    const blob = await put(
      `comprobantes/${preregistro.tokenConfirmacion}-${Date.now()}.${extension}`,
      comprobante,
      { access: 'public' }
    );

    // La contraseña se encripta aquí, no en el navegador.
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.user.create({
      data: {
        nombre: preregistro.nombre,
        apellido,
        correo: preregistro.correo,
        passwordHash,
        pais,
        ladaPais,
        telefono,
        estadoProvincia,
        ciudad,
        suscripcion: suscripcion as (typeof SUSCRIPCIONES_VALIDAS)[number],
        comprobantePagoUrl: blob.url,
        correoConfirmado: true,
        status: 'PENDIENTE_APROBACION', // Un Administrador debe aprobar el comprobante.
        invitadoPorId: invitador.id,
      },
    });

    await prisma.preregistro.update({
      where: { id: preregistro.id },
      data: { confirmado: true },
    });

    return NextResponse.json({
      ok: true,
      mensaje:
        'Tu registro fue recibido. Un administrador va a revisar tu comprobante de pago y activar tu cuenta pronto.',
      usuarioId: nuevoUsuario.id,
    });
  } catch (error) {
    console.error('Error en /api/registro:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
