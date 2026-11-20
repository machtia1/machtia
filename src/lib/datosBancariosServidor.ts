import { prisma } from './prisma';
import { cifrar, descifrar } from './cifrado';
import type { DatosGuardados } from './datosBancarios';

/** Lee y descifra los datos de un usuario. null si no tiene. Lanza si no se puede descifrar. */
export async function leerDatosBancarios(usuarioId: string): Promise<DatosGuardados | null> {
  const fila = await prisma.datosBancarios.findUnique({ where: { usuarioId } });
  if (!fila) return null;
  const crudo = JSON.parse(descifrar(fila.datosCifrados)) as Partial<DatosGuardados>;
  return { banco: crudo.banco ?? null, wallet: crudo.wallet ?? null };
}

/** Cifra y guarda (o borra el registro si ya no queda ni banco ni wallet). */
export async function guardarDatosBancarios(usuarioId: string, datos: DatosGuardados) {
  if (!datos.banco && !datos.wallet) {
    await prisma.datosBancarios.deleteMany({ where: { usuarioId } });
    return;
  }
  const datosCifrados = cifrar(JSON.stringify(datos));
  const campos = { datosCifrados, tieneBanco: !!datos.banco, tieneWallet: !!datos.wallet };
  await prisma.datosBancarios.upsert({
    where: { usuarioId },
    create: { usuarioId, ...campos },
    update: campos,
  });
}
