import { prisma } from './prisma';

/** Crea una notificación personal para un usuario específico. */
export async function crearNotificacionUsuario(destinatarioId: string, mensaje: string): Promise<void> {
  await prisma.notificacionUsuario.create({
    data: { destinatarioId, mensaje },
  });
}
