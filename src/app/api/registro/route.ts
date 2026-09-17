import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

const SUSCRIPCIONES_VALIDAS = ['BASICA', 'PLUS', 'NEGOCIOS'] as const;

// Opciones que solo existen para espacios restringidos (Red General).
// Todas generan regalías con la misma mecánica que Negocios (confirmado
// por el cliente el 15 sept 2026); el "rol" define sus permisos reales
// dentro de la plataforma, y son independientes de la suscripción.
const OPCIONES_RESTRINGIDO = [
  'SOCIO_FUNDADOR',
  'ASOCIADO',
  'PROFESOR_FACILITADOR',
  'ASISTENTE_ADMINISTRATIVO',
] as const;

const ROL_POR_OPCION_RESTRINGIDA: Record<(typeof OPCIONES_RESTRINGIDO)[number], string> = {
  SOCIO_FUNDADOR: 'SOCIO',
  ASOCIADO: 'USUARIO',
  PROFESOR_FACILITADOR: 'PROFESOR_FACILITADOR',
  ASISTENTE_ADMINISTRATIVO: 'ASISTENTE_ADMINISTRATIVO',
};

const SUSCRIPCION_POR_OPCION_RESTRINGIDA: Record<(typeof OPCIONES_RESTRINGIDO)[number], string> = {
  SOCIO_FUNDADOR: 'SOCIO_FUNDADOR',
  ASOCIADO: 'ASOCIADO',
  PROFESOR_FACILITADOR: 'NEGOCIOS',
  ASISTENTE_ADMINISTRATIVO: 'NEGOCIOS',
};

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

    if (!suscripcion) {
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

    const esRestringido = !!preregistro.slotRestringidoId;

    let invitadorId: string | null = null;
    let rolFinal: string | undefined;
    let suscripcionFinal: string;
    // Si es un espacio restringido, esta es la fila "reservada" que ya
    // está conectada en el árbol (ver prisma/backfill-red-general.mjs)
    // y que hay que ACTUALIZAR con los datos reales — nunca crear una
    // fila nueva, para no perder su posición en la Red General.
    let slotParaReclamar: { id: string; usuarioId: string | null } | null = null;

    if (esRestringido) {
      if (!OPCIONES_RESTRINGIDO.includes(suscripcion as (typeof OPCIONES_RESTRINGIDO)[number])) {
        return NextResponse.json({ error: 'Selecciona una suscripción válida' }, { status: 400 });
      }
      const opcion = suscripcion as (typeof OPCIONES_RESTRINGIDO)[number];
      rolFinal = ROL_POR_OPCION_RESTRINGIDA[opcion];
      suscripcionFinal = SUSCRIPCION_POR_OPCION_RESTRINGIDA[opcion];
      // Las personas de espacios restringidos son raíz de su propia red
      // de referidos normal (sin invitadoPorId) — pero SÍ tienen ya una
      // posición fija en el árbol de la Red General, asignada por el
      // backfill, que se reclama abajo.

      slotParaReclamar = await prisma.slotRestringido.findUnique({
        where: { id: preregistro.slotRestringidoId! },
        select: { id: true, usuarioId: true },
      });
      if (!slotParaReclamar?.usuarioId) {
        return NextResponse.json(
          { error: 'Este espacio todavía no está inicializado. Contacta al administrador.' },
          { status: 409 }
        );
      }
    } else {
      if (!SUSCRIPCIONES_VALIDAS.includes(suscripcion as any)) {
        return NextResponse.json({ error: 'Selecciona una suscripción válida' }, { status: 400 });
      }
      suscripcionFinal = suscripcion;

      const invitador = await prisma.user.findUnique({
        where: { linkInvitacion: preregistro.invitadorSlug ?? undefined },
        select: { id: true },
      });
      if (!invitador) {
        return NextResponse.json({ error: 'El invitador original ya no está disponible' }, { status: 404 });
      }
      invitadorId = invitador.id;
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

    const datosPersona = {
      nombre: preregistro.nombre,
      apellido,
      correo: preregistro.correo,
      passwordHash,
      pais,
      ladaPais,
      telefono,
      estadoProvincia,
      ciudad,
      suscripcion: suscripcionFinal as (typeof SUSCRIPCIONES_VALIDAS)[number],
      ...(rolFinal ? { rol: rolFinal as any } : {}),
      comprobantePagoUrl: blob.url,
      correoConfirmado: true,
      status: 'PENDIENTE_APROBACION' as const, // Un Administrador debe aprobar el comprobante.
    };

    const nuevoUsuario = slotParaReclamar
      ? // Reclama la fila reservada que ya está conectada al árbol de
        // la Red General — no se toca su padreRedId/ladoEnPadre.
        await prisma.user.update({
          where: { id: slotParaReclamar.usuarioId! },
          data: { ...datosPersona, reservado: false },
        })
      : await prisma.user.create({
          data: { ...datosPersona, invitadoPorId: invitadorId },
        });

    await prisma.preregistro.update({
      where: { id: preregistro.id },
      data: { confirmado: true },
    });

    if (slotParaReclamar) {
      await prisma.slotRestringido.update({
        where: { id: slotParaReclamar.id },
        data: { status: 'OCUPADO', inviteLink: null },
      });
    }

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
