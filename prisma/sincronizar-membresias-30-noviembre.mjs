import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sincroniza el vencimiento de TODAS las membresías activas al 30 de
 * NOVIEMBRE de 2027, 10:00 p.m. (hora Centro de México) — pedido por
 * el cliente el 27 oct 2026, al ampliarse la Campaña de Lanzamiento
 * hasta el 30 de noviembre: "empieza el año el 30 de Noviembre a la
 * hora que termine la campaña" (cierre de campaña: 10:00 p.m.).
 *
 * Reemplaza la fecha que puso el script anterior
 * (db:sincronizar-membresias-30-octubre → 30 de octubre de 2027) y
 * también corrige a quienes se aprobaron después con la regla vieja,
 * que les asignaba el 30 de octubre de 2026.
 *
 * Qué hace: a cada usuario con status ACTIVA le pone
 * membresiaExpiraEn = 30 de noviembre de 2027, 10:00 p.m.
 *
 * Qué NO hace: no toca el status de nadie, ni su posición en ningún
 * árbol, ni ganancias ni regalías — solo la fecha de vencimiento de
 * la membresía.
 *
 * Es idempotente: se puede correr más de una vez y siempre deja el
 * mismo resultado. Conviene correrla DESPUÉS de desplegar el cambio de
 * src/lib/membresia.ts, para que las aprobaciones nuevas ya usen la
 * misma regla.
 *
 * ⚠️ Acción sobre datos reales de membresía.
 */
const FECHA_VENCIMIENTO = new Date('2027-11-30T22:00:00-06:00');

async function main() {
  console.log('== Sincronizar membresías activas al 30 de noviembre (27 oct 2026) ==');
  console.log(`Nueva fecha de vencimiento para todos: ${FECHA_VENCIMIENTO.toISOString()} (30 nov 2027, 10:00 p.m. hora Centro)`);

  const activos = await prisma.user.count({ where: { status: 'ACTIVA' } });
  console.log(`Usuarios con membresía ACTIVA encontrados: ${activos}`);

  const resultado = await prisma.user.updateMany({
    where: { status: 'ACTIVA' },
    data: { membresiaExpiraEn: FECHA_VENCIMIENTO },
  });

  console.log(`✅ Membresías actualizadas: ${resultado.count}`);
  console.log('🎉 Listo. Todas las membresías activas ahora vencen el 30 de noviembre de 2027, 10:00 p.m.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
