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

interface ComprobanteRecibido {
  nombre: string;
  tipo: string;
  tamano: number;
  cuerpo: Blob | Buffer;
}

const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

/** Extensión para guardar el comprobante: primero por su tipo, luego por su nombre, y 'jpg' por defecto. */
function extensionDe(comprobante: ComprobanteRecibido): string {
  const porTipo = EXTENSION_POR_TIPO[comprobante.tipo];
  if (porTipo) return porTipo;
  const porNombre = comprobante.nombre.includes('.') ? comprobante.nombre.split('.').pop() ?? '' : '';
  return /^[A-Za-z0-9]{2,5}$/.test(porNombre) ? porNombre.toLowerCase() : 'jpg';
}

export async function POST(request: Request) {
  try {
    // El formulario normal llega como multipart. Como camino de respaldo
    // (cuando el envío de archivos falla en el celular de la persona) también
    // se acepta JSON con el comprobante en base64 — ver src/lib/subidaArchivos.ts.
    const esJson = (request.headers.get('content-type') ?? '').includes('application/json');

    let obtener: (nombre: string) => string | undefined;
    let comprobante: ComprobanteRecibido | null = null;

    if (esJson) {
      const cuerpo = await request.json().catch(() => null);
      if (!cuerpo || typeof cuerpo !== 'object') {
        return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
      }
      obtener = (nombre) => (typeof cuerpo[nombre] === 'string' ? cuerpo[nombre] : undefined);

      const base64 = typeof cuerpo.comprobanteBase64 === 'string' ? cuerpo.comprobanteBase64 : '';
      const tipo = typeof cuerpo.comprobanteTipo === 'string' ? cuerpo.comprobanteTipo : '';
      const contenido = Buffer.from(base64, 'base64');
      if (contenido.length > 0) {
        if (!tipo.startsWith('image/') && tipo !== 'application/pdf') {
          return NextResponse.json({ error: 'El comprobante debe ser una imagen o un PDF' }, { status: 400 });
        }
        comprobante = {
          nombre: typeof cuerpo.comprobanteNombre === 'string' ? cuerpo.comprobanteNombre : 'comprobante',
          tipo,
          tamano: contenido.length,
          cuerpo: contenido,
        };
      }
    } else {
      const formData = await request.formData();
      obtener = (nombre) => formData.get(nombre)?.toString();
      const archivo = formData.get('comprobante');
      if (archivo instanceof File && archivo.size > 0) {
        comprobante = { nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, cuerpo: archivo };
      }
    }

    const token = obtener('token');
    const apellido = obtener('apellido')?.trim();
    const pais = obtener('pais')?.trim();
    const ladaPais = obtener('ladaPais')?.trim();
    const telefono = obtener('telefono')?.trim();
    const estadoProvincia = obtener('estadoProvincia')?.trim();
    const ciudad = obtener('ciudad')?.trim();
    const suscripcion = obtener('suscripcion');
    const password = obtener('password');

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

    if (!comprobante) {
      return NextResponse.json({ error: 'Sube tu comprobante de pago' }, { status: 400 });
    }
    if (comprobante.tamano > TAMANO_MAX_COMPROBANTE) {
      return NextResponse.json({ error: 'El comprobante no debe pesar más de 4 MB' }, { status: 400 });
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
    const blob = await put(
      `comprobantes/${preregistro.tokenConfirmacion}-${Date.now()}.${extensionDe(comprobante)}`,
      comprobante.cuerpo,
      {
        access: 'public',
        // Solo se fija el tipo cuando es uno confiable; si no, Vercel Blob lo
        // deduce de la extensión (.jpg, .png, .pdf) y el administrador puede verlo.
        ...(comprobante.tipo.startsWith('image/') || comprobante.tipo === 'application/pdf'
          ? { contentType: comprobante.tipo }
          : {}),
      }
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
