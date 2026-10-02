import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de VERIFICACIÓN (solo lectura, no modifica nada) — pedido
 * por el cliente el 2 oct 2026: "checar y verificar que la Red
 * Alterna funcione y sume solo para los restringidos sin tener que
 * invitar".
 *
 * Qué hace: identifica a las personas de soporte (niveles
 * restringidos 1-7 de la Red General: reservado=false,
 * invitadoPorId=null, con una posición real en padreRedId) y revisa,
 * una por una, contra la base de datos real:
 *   1. Si ya invitó a alguien directamente (invitadoPorId = su id).
 *   2. Si ya tiene regalías registradas en la Red Alterna
 *      (RegaliaRedAlterna donde beneficiarioId = su id).
 *
 * Con esto se confirma, con datos reales, a cuántas personas de
 * soporte SÍ les está funcionando ya el sistema (porque invitaron a
 * alguien) y a cuántas NO les ha generado nada todavía — ese segundo
 * grupo es el que de verdad necesita una solución.
 */
async function main() {
  console.log('== Verificación: personas de soporte (niveles restringidos) vs Red Alterna ==\n');

  const restringidos = await prisma.user.findMany({
    where: {
      reservado: false,
      invitadoPorId: null,
      padreRedId: { not: null },
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      suscripcion: true,
      status: true,
      padreAlternaId: true,
    },
    orderBy: { creadoEn: 'asc' },
  });

  console.log(`Total de personas de soporte encontradas (niveles restringidos reclamados): ${restringidos.length}\n`);

  if (restringidos.length === 0) {
    console.log('No se encontró ninguna. Revisa que el filtro siga siendo correcto.');
    return;
  }

  let conInvitados = 0;
  let sinInvitados = 0;
  let conRegalias = 0;
  let sinRegaliasNiInvitados = 0;
  let totalGanadoGrupo = 0;

  for (const u of restringidos) {
    const numInvitados = await prisma.user.count({ where: { invitadoPorId: u.id } });
    const regalias = await prisma.regaliaRedAlterna.aggregate({
      where: { beneficiarioId: u.id },
      _sum: { monto: true },
      _count: true,
    });
    const montoGanado = Number(regalias._sum.monto ?? 0);
    const numRegalias = regalias._count;

    if (numInvitados > 0) conInvitados++;
    else sinInvitados++;

    if (numRegalias > 0) conRegalias++;
    if (numInvitados === 0 && numRegalias === 0) sinRegaliasNiInvitados++;

    totalGanadoGrupo += montoGanado;

    const enArbolAlterna = u.padreAlternaId ? 'SÍ (tiene padreAlternaId)' : 'NO (fuera del árbol de la Red Alterna)';

    console.log(
      `- ${u.nombre} ${u.apellido} | suscripción: ${u.suscripcion ?? 'N/A'} | status: ${u.status} | ` +
        `invitó a ${numInvitados} persona(s) | en árbol Red Alterna: ${enArbolAlterna} | ` +
        `regalías recibidas: ${numRegalias} ($${montoGanado.toFixed(2)} MXN)`
    );
  }

  console.log('\n---- RESUMEN ----');
  console.log(`Personas de soporte con al menos 1 invitado propio: ${conInvitados}`);
  console.log(`Personas de soporte SIN ningún invitado propio: ${sinInvitados}`);
  console.log(`Personas de soporte que YA tienen regalías registradas: ${conRegalias}`);
  console.log(`Personas de soporte SIN invitados Y SIN regalías (grupo realmente afectado): ${sinRegaliasNiInvitados}`);
  console.log(`Total ganado hasta ahora por todo el grupo de soporte: $${totalGanadoGrupo.toFixed(2)} MXN`);
  console.log('\n🎉 Verificación terminada (no se modificó nada en la base de datos).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
