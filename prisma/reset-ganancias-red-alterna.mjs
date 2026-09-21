import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Borra TODAS las regalías generadas hasta ahora en la Red Alterna,
 * para que las ganancias de todos los usuarios vuelvan a $0 y
 * empiecen a contar desde hoy — pedido explícito del cliente el 20
 * sept 2026 ("Resetear de cero a partir de hoy"), después de que
 * entraran las personas que no se habían podido registrar antes.
 *
 * No toca la posición de nadie en el árbol de la Red Alterna
 * (padreAlternaId) — solo borra el historial de comisiones ya
 * pagadas/contabilizadas. Las regalías nuevas se seguirán generando
 * con normalidad en cada aprobación futura, mientras la campaña siga
 * activa.
 *
 * ⚠️ Acción irreversible sobre dinero real — se corre UNA sola vez.
 */
async function main() {
  console.log('== Reset de ganancias Red Alterna (20 sept 2026) ==');

  const total = await prisma.regaliaRedAlterna.count();
  console.log(`Regalías registradas actualmente: ${total}`);

  const borradas = await prisma.regaliaRedAlterna.deleteMany({});
  console.log(`✅ Regalías borradas: ${borradas.count}`);
  console.log('🎉 Ganancias reseteadas a $0. Las nuevas aprobaciones vuelven a generar regalías con normalidad.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
