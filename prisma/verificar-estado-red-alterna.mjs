import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de VERIFICACIÓN (solo lectura) — última pieza del
 * diagnóstico del 2 oct 2026. Si los invitados de personas de
 * soporte quedaron bien colocados en el árbol de la Red Alterna pero
 * nunca generaron regalías, hay que descartar algo más grave: que la
 * ventana de fechas de la campaña (RED_ALTERNA_INICIO_ISO /
 * RED_ALTERNA_FIN_ISO) esté mal configurada en producción, lo cual
 * afectaría a TODOS los usuarios, no solo a los de soporte.
 */
function estadoRedAlterna(inicioISO, finISO, fecha = new Date()) {
  const inicio = new Date(inicioISO).getTime();
  const fin = new Date(finISO).getTime();
  const ahora = fecha.getTime();
  if (ahora < inicio) return 'pendiente';
  if (ahora >= fin) return 'cerrada';
  return 'activa';
}

async function main() {
  console.log('== Verificación: estado y configuración de fechas de la Red Alterna ==\n');

  const inicioISO = process.env.RED_ALTERNA_INICIO_ISO ?? '2026-09-16T22:00:00-06:00 (valor por defecto, no hay variable en .env)';
  const finISO = process.env.RED_ALTERNA_FIN_ISO ?? '2026-10-30T22:00:00-06:00 (valor por defecto, no hay variable en .env)';

  console.log(`RED_ALTERNA_INICIO_ISO: ${inicioISO}`);
  console.log(`RED_ALTERNA_FIN_ISO: ${finISO}`);
  console.log(`Fecha/hora actual del servidor (UTC): ${new Date().toISOString()}`);

  const inicioReal = process.env.RED_ALTERNA_INICIO_ISO ?? '2026-09-16T22:00:00-06:00';
  const finReal = process.env.RED_ALTERNA_FIN_ISO ?? '2026-10-30T22:00:00-06:00';
  console.log(`\nEstado calculado en este momento: ${estadoRedAlterna(inicioReal, finReal).toUpperCase()}`);

  console.log('\n---- Totales generales en toda la base de datos ----');
  const totalRegalias = await prisma.regaliaRedAlterna.count();
  const sumaTotal = await prisma.regaliaRedAlterna.aggregate({ _sum: { monto: true } });
  console.log(`Total de regalías de Red Alterna registradas (TODOS los usuarios, no solo soporte): ${totalRegalias}`);
  console.log(`Monto total acumulado en toda la plataforma: $${Number(sumaTotal._sum.monto ?? 0).toFixed(2)} MXN`);

  if (totalRegalias > 0) {
    const ultimas = await prisma.regaliaRedAlterna.findMany({
      orderBy: { creadoEn: 'desc' },
      take: 5,
      select: { creadoEn: true, monto: true, nivel: true, beneficiarioId: true, origenId: true },
    });
    console.log('\nÚltimas 5 regalías generadas (de cualquier usuario):');
    for (const r of ultimas) {
      console.log(`  · ${r.creadoEn.toISOString()} | nivel ${r.nivel} | $${Number(r.monto).toFixed(2)} MXN`);
    }
  } else {
    console.log('\n⚠️  CERO regalías en TODA la base de datos — esto confirma que es una falla general, no algo exclusivo de los niveles restringidos.');
  }

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
