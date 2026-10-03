import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Pago SIMULADO del nivel 1 para personas en posiciones
// restringidas de la Red Alterna sin ningún invitado propio —
// pedido explícito del cliente el 2 oct 2026 (aclaración de lo que
// pedía desde el inicio): sus 5 niveles hacia arriba en el árbol de
// la Red Alterna están ocupados por otras personas restringidas que
// tampoco invitan, así que nunca generan nada por la vía normal.
//
// Qué hace:
//   - Busca a las personas de soporte/restringidas (mismo criterio
//     usado en todo este diagnóstico: reservado=false,
//     invitadoPorId=null, padreRedId definido) que están ACTIVAS.
//   - Si YA tienen al menos un invitado real, se omiten por
//     completo: a ellas no se les simula nada, ya generan (o
//     generarán) regalías reales normales.
//   - Si YA tienen una regalía simulada registrada, se omiten (no
//     se duplica nunca).
//   - A las que no tienen ningún invitado ni ninguna regalía
//     simulada, se les crea UNA sola fila en RegaliaRedAlterna con
//     el monto de nivel 1 de su propia tabla de suscripción,
//     marcada con simulada=true y beneficiarioId === origenId (se
//     pagan a sí mismas, no hay invitado real detrás).
//
// Por qué es seguro:
//   - Es ESTRICTAMENTE aditivo: nunca borra ni modifica una regalía
//     existente (real o simulada).
//   - Nunca duplica: una persona solo puede recibir UN pago
//     simulado (se verifica antes de crear).
//   - No toca ninguna posición del árbol ni ninguna regalía real.
//   - Se puede correr tantas veces como se quiera mientras la
//     campaña siga activa (idempotente): solo paga a quien todavía
//     no tiene nada.
// ============================================================

const RED_ALTERNA_INICIO_ISO = process.env.RED_ALTERNA_INICIO_ISO ?? '2026-09-16T22:00:00-06:00';
const RED_ALTERNA_FIN_ISO = process.env.RED_ALTERNA_FIN_ISO ?? '2026-10-30T22:00:00-06:00';

const RANGO = { BASICA: 0, PLUS: 1, NEGOCIOS: 2 };
const TABLAS = {
  BASICA: { 1: 10.0, 2: 5.0, 3: 5.0, 4: 5.0, 5: 2.5 },
  PLUS: { 1: 20.0, 2: 10.0, 3: 10.0, 4: 10.0, 5: 5.0 },
  NEGOCIOS: { 1: 40.0, 2: 20.0, 3: 20.0, 4: 20.0, 5: 10.0 },
};

function esElegible(s) {
  return s === 'BASICA' || s === 'PLUS' || s === 'NEGOCIOS' || s === 'SOCIO_FUNDADOR' || s === 'ASOCIADO';
}

function tablaEfectiva(s) {
  if (s === 'SOCIO_FUNDADOR' || s === 'ASOCIADO') return 'NEGOCIOS';
  return s;
}

function redAlternaActiva(fecha = new Date()) {
  const inicio = new Date(RED_ALTERNA_INICIO_ISO).getTime();
  const fin = new Date(RED_ALTERNA_FIN_ISO).getTime();
  return fecha.getTime() >= inicio && fecha.getTime() < fin;
}

async function main() {
  console.log('== Simulación de primer invitado — restringidos sin invitados (2 oct 2026) ==\n');

  if (!redAlternaActiva()) {
    console.log('⚠️  La Red Alterna no está activa en este momento (ya cerró o no ha iniciado). No se generó ningún pago simulado.');
    return;
  }

  const restringidos = await prisma.user.findMany({
    where: {
      reservado: false,
      invitadoPorId: null,
      padreRedId: { not: null },
      status: 'ACTIVA',
    },
    select: { id: true, nombre: true, apellido: true, suscripcion: true },
    orderBy: { creadoEn: 'asc' },
  });

  console.log(`Personas restringidas/soporte ACTIVAS encontradas: ${restringidos.length}`);

  let omitidosConInvitados = 0;
  let omitidosYaSimulados = 0;
  let omitidosSinSuscripcionElegible = 0;
  let pagados = 0;
  let totalMonto = 0;

  for (const u of restringidos) {
    const tieneInvitados = await prisma.user.count({ where: { invitadoPorId: u.id } });
    if (tieneInvitados > 0) {
      omitidosConInvitados++;
      continue;
    }

    const yaSimulado = await prisma.regaliaRedAlterna.findFirst({
      where: { beneficiarioId: u.id, simulada: true },
    });
    if (yaSimulado) {
      omitidosYaSimulados++;
      continue;
    }

    if (!esElegible(u.suscripcion)) {
      omitidosSinSuscripcionElegible++;
      continue;
    }

    const tabla = tablaEfectiva(u.suscripcion);
    const monto = TABLAS[tabla][1];

    await prisma.regaliaRedAlterna.create({
      data: {
        beneficiarioId: u.id,
        origenId: u.id,
        nivel: 1,
        monto,
        tablaAplicada: tabla,
        simulada: true,
      },
    });

    console.log(`  ✅ ${u.nombre} ${u.apellido}: pago simulado de nivel 1 creado ($${monto.toFixed(2)} MXN, tabla ${tabla}).`);
    pagados++;
    totalMonto += monto;
  }

  console.log('\n---- RESUMEN ----');
  console.log(`Omitidos (ya tienen invitados reales, no necesitan simulación): ${omitidosConInvitados}`);
  console.log(`Omitidos (ya tenían su pago simulado de una corrida anterior): ${omitidosYaSimulados}`);
  console.log(`Omitidos (sin suscripción elegible para generar regalías): ${omitidosSinSuscripcionElegible}`);
  console.log(`Pagos simulados nuevos creados: ${pagados}`);
  console.log(`Monto total simulado agregado: $${totalMonto.toFixed(2)} MXN`);
  console.log('\n🎉 Listo. No se duplicó ni se modificó ninguna regalía existente (real o simulada).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
