import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de VERIFICACIÓN (solo lectura) — seguimiento al hallazgo
 * del 2 oct 2026: dos personas de soporte (Stephanie y Gustavo) SÍ
 * tienen invitados directos, pero aparecen con $0.00 de regalías en
 * la Red Alterna. Esto no debería pasar según cómo está construido
 * el sistema — hay que ver exactamente qué está pasando con cada uno
 * de sus invitados antes de proponer cualquier solución.
 */
async function main() {
  console.log('== Diagnóstico: invitados de personas de soporte que no generaron regalías ==\n');

  const soporteConInvitados = await prisma.user.findMany({
    where: {
      reservado: false,
      invitadoPorId: null,
      padreRedId: { not: null },
    },
    select: { id: true, nombre: true, apellido: true },
  });

  for (const soporte of soporteConInvitados) {
    const invitados = await prisma.user.findMany({
      where: { invitadoPorId: soporte.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        suscripcion: true,
        status: true,
        padreAlternaId: true,
        membresiaExpiraEn: true,
        creadoEn: true,
      },
    });

    if (invitados.length === 0) continue;

    console.log(`\n--- ${soporte.nombre} ${soporte.apellido} (${invitados.length} invitado(s)) ---`);

    for (const inv of invitados) {
      const regaliasOrigen = await prisma.regaliaRedAlterna.findMany({
        where: { origenId: inv.id },
        select: { beneficiarioId: true, nivel: true, monto: true },
      });

      console.log(
        `  · ${inv.nombre} ${inv.apellido} | suscripción: ${inv.suscripcion ?? 'N/A'} | status: ${inv.status} | ` +
          `creado: ${inv.creadoEn.toISOString()} | membresiaExpiraEn: ${inv.membresiaExpiraEn?.toISOString() ?? 'N/A'} | ` +
          `padreAlternaId: ${inv.padreAlternaId ?? 'NULL (no está en el árbol de la Red Alterna)'} | ` +
          `regalías generadas por su suscripción: ${regaliasOrigen.length}`
      );

      if (regaliasOrigen.length > 0) {
        for (const r of regaliasOrigen) {
          console.log(`      → nivel ${r.nivel}, $${Number(r.monto).toFixed(2)} MXN, beneficiario: ${r.beneficiarioId}`);
        }
      }
    }
  }

  console.log('\n🎉 Diagnóstico terminado (no se modificó nada en la base de datos).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
