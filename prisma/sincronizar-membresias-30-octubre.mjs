import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sincroniza el vencimiento de TODAS las membresías activas al 30 de
 * octubre — pedido por el cliente el 20 sept 2026: "todas las
 * membresías empiezan a contar el día 30 de octubre, es decir, ahí
 * empieza el año."
 *
 * Qué hace: a cada usuario con status ACTIVA le pone
 * membresiaExpiraEn = 30 de octubre de 2027 (un año completo desde
 * el 30 de octubre de 2026, la fecha en la que "empieza a contar" el
 * año de membresía), sin importar cuándo se haya aprobado
 * originalmente. Así todas las membresías quedan alineadas al mismo
 * calendario, en vez de que cada quien tenga su propia fecha de
 * vencimiento según el día que se aprobó.
 *
 * Qué NO hace: no toca el status de nadie, no toca su posición en
 * ningún árbol, no toca ganancias ni regalías — solo la fecha de
 * vencimiento de la membresía.
 *
 * Nota: esto cubre a quienes YA están activos hoy. Las aprobaciones
 * NUEVAS (a partir de ahora) siguen usando la regla de "365 días
 * desde el día que se aprueban" en /api/admin/aprobar — si también
 * quieren que las aprobaciones nuevas se sincronicen al 30 de
 * octubre de cada año, avísenme y ajusto esa parte también.
 *
 * ⚠️ Acción sobre datos reales de membresía — se corre UNA sola vez.
 */
const FECHA_VENCIMIENTO = new Date('2027-10-30T23:59:59.999-06:00');

async function main() {
  console.log('== Sincronizar membresías activas al 30 de octubre (22 sept 2026) ==');
  console.log(`Nueva fecha de vencimiento para todos: ${FECHA_VENCIMIENTO.toLocaleDateString('es-MX')}`);

  const activos = await prisma.user.count({ where: { status: 'ACTIVA' } });
  console.log(`Usuarios con membresía ACTIVA encontrados: ${activos}`);

  const resultado = await prisma.user.updateMany({
    where: { status: 'ACTIVA' },
    data: { membresiaExpiraEn: FECHA_VENCIMIENTO },
  });

  console.log(`✅ Membresías actualizadas: ${resultado.count}`);
  console.log('🎉 Listo. Todas las membresías activas ahora vencen el 30 de octubre de 2027.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
